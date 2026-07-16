// ============================================================
//  LOGICA DE NEGOCIO: stock, ventas, compras y Kardex.
//  Todo corre en el servidor (Server Actions) dentro de
//  transacciones para mantener consistencia del inventario.
// ============================================================
import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export type TipoUnidad = 'CAJA' | 'BLISTER' | 'UNIDAD';

// Convierte la cantidad de una presentacion (caja/blister/unidad)
// a UNIDADES base, que es como se descuenta el stock.
export function aUnidadesBase(
  tipo: TipoUnidad,
  cantidad: number,
  uxCaja: number,
  uxBlister: number
): number {
  if (tipo === 'CAJA') return cantidad * (uxCaja || 1);
  if (tipo === 'BLISTER') return cantidad * (uxBlister || 1);
  return cantidad;
}

// Precio de la presentacion elegida.
export function precioPresentacion(
  tipo: TipoUnidad,
  p: { precioCaja: number; precioBlister: number; precioUnidad: number }
): number {
  if (tipo === 'CAJA') return p.precioCaja;
  if (tipo === 'BLISTER') return p.precioBlister;
  return p.precioUnidad;
}

// Stock total (en unidades) de un producto sumando sus lotes vigentes.
export async function stockProducto(productoId: number): Promise<number> {
  const r = await prisma.lote.aggregate({
    where: { productoId, cantidad: { gt: 0 } },
    _sum: { cantidad: true },
  });
  return r._sum.cantidad ?? 0;
}

// -----------------------------------------------------------
//  VENTA: descuenta stock por FEFO (First-Expired-First-Out):
//  se consume primero el lote que vence antes. Registra Kardex.
// -----------------------------------------------------------
export interface LineaVenta {
  productoId: number;
  tipoUnidad: TipoUnidad;
  cantidad: number;
}

export async function registrarVenta(
  lineas: LineaVenta[],
  metodoPago: string,
  cliente?: string
) {
  return prisma.$transaction(async (tx) => {
    let total = 0;
    const itemsCreate: Prisma.VentaItemCreateWithoutVentaInput[] = [];

    for (const l of lineas) {
      const prod = await tx.producto.findUniqueOrThrow({ where: { id: l.productoId } });
      const base = aUnidadesBase(l.tipoUnidad, l.cantidad, prod.unidadesPorCaja, prod.unidadesPorBlister);
      const precio = precioPresentacion(l.tipoUnidad, prod);

      // Verificar stock total
      const disponible = await stockProducto(l.productoId);
      if (disponible < base) {
        throw new Error(`Stock insuficiente de ${prod.nombre}. Disponible: ${disponible} und, requerido: ${base} und.`);
      }

      // Consumo FEFO: lotes ordenados por vencimiento ascendente.
      let restante = base;
      const lotes = await tx.lote.findMany({
        where: { productoId: l.productoId, cantidad: { gt: 0 } },
        orderBy: { fechaVencimiento: 'asc' },
      });

      let costoPromedio = 0, tomadoParaCosto = 0;
      for (const lote of lotes) {
        if (restante <= 0) break;
        const toma = Math.min(lote.cantidad, restante);
        const nuevoSaldoLote = lote.cantidad - toma;
        await tx.lote.update({ where: { id: lote.id }, data: { cantidad: nuevoSaldoLote } });

        // Kardex por cada lote afectado
        const saldoProd = await sumaStockTx(tx, l.productoId);
        await tx.movimientoKardex.create({
          data: {
            productoId: l.productoId, loteId: lote.id, tipo: 'SALIDA',
            cantidad: -toma, saldo: saldoProd, costoUnit: lote.costoUnitario,
            referencia: 'Venta',
          },
        });
        costoPromedio += lote.costoUnitario * toma;
        tomadoParaCosto += toma;
        restante -= toma;
      }
      const costoUnit = tomadoParaCosto > 0 ? costoPromedio / tomadoParaCosto : 0;
      const subtotal = Number((precio * l.cantidad).toFixed(2));
      total += subtotal;

      itemsCreate.push({
        producto: { connect: { id: l.productoId } },
        tipoUnidad: l.tipoUnidad, cantidad: l.cantidad, cantidadBase: base,
        precioUnit: precio, costoUnit, subtotal,
      });
    }

    const venta = await tx.venta.create({
      data: { total: Number(total.toFixed(2)), metodoPago, cliente, items: { create: itemsCreate } },
      include: { items: { include: { producto: true } } },
    });

    // Actualizar referencia de kardex reciente con el id de venta
    await tx.movimientoKardex.updateMany({
      where: { referencia: 'Venta', loteId: { not: null } },
      data: { referencia: `Venta #${venta.id}` },
    });

    return venta;
  });
}

async function sumaStockTx(tx: Prisma.TransactionClient, productoId: number) {
  const r = await tx.lote.aggregate({ where: { productoId }, _sum: { cantidad: true } });
  return r._sum.cantidad ?? 0;
}

// -----------------------------------------------------------
//  COMPRA: ingresa mercaderia creando un lote y sumando stock.
// -----------------------------------------------------------
export interface LineaCompra {
  productoId: number;
  codigoLote: string;
  fechaVencimiento: string; // ISO
  cantidad: number;         // en unidades
  costoUnit: number;
}

export async function registrarCompra(
  proveedorId: number,
  numeroDoc: string | undefined,
  lineas: LineaCompra[]
) {
  return prisma.$transaction(async (tx) => {
    let total = 0;
    for (const l of lineas) {
      const lote = await tx.lote.create({
        data: {
          productoId: l.productoId, codigoLote: l.codigoLote,
          fechaVencimiento: new Date(l.fechaVencimiento),
          cantidad: l.cantidad, costoUnitario: l.costoUnit, proveedorId,
        },
      });
      const saldo = await sumaStockTx(tx, l.productoId);
      await tx.movimientoKardex.create({
        data: {
          productoId: l.productoId, loteId: lote.id, tipo: 'ENTRADA',
          cantidad: l.cantidad, saldo, costoUnit: l.costoUnit, referencia: 'Compra',
        },
      });
      total += l.cantidad * l.costoUnit;
    }

    const compra = await tx.compra.create({
      data: {
        proveedorId, numeroDoc, total: Number(total.toFixed(2)),
        items: {
          create: lineas.map((l) => ({
            producto: { connect: { id: l.productoId } },
            cantidad: l.cantidad, costoUnit: l.costoUnit,
            subtotal: Number((l.cantidad * l.costoUnit).toFixed(2)),
          })),
        },
      },
    });
    await tx.movimientoKardex.updateMany({
      where: { referencia: 'Compra' }, data: { referencia: `Compra #${compra.id}` },
    });
    return compra;
  });
}
