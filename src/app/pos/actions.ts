'use server';
// Server Actions del POS: busqueda de productos y registro de venta.
import { prisma } from '@/lib/prisma';
import { registrarVenta, type LineaVenta, stockProducto } from '@/lib/inventory';
import { revalidatePath } from 'next/cache';

// Busqueda inteligente: por nombre, principio activo o codigo de barras.
export async function buscarProductos(q: string) {
  const term = q.trim();
  if (!term) return [];
  const productos = await prisma.producto.findMany({
    where: {
      activo: true,
      OR: [
        { nombre: { contains: term } },
        { principioActivo: { contains: term } },
        { codigoBarras: { equals: term } },
      ],
    },
    include: { lotes: true, laboratorio: true },
    take: 12,
  });
  return productos.map((p) => ({
    id: p.id, nombre: p.nombre, principioActivo: p.principioActivo,
    concentracion: p.concentracion, formaFarma: p.formaFarma,
    laboratorio: p.laboratorio?.nombre ?? '',
    requiereReceta: p.requiereReceta,
    precioCaja: p.precioCaja, precioBlister: p.precioBlister, precioUnidad: p.precioUnidad,
    unidadesPorCaja: p.unidadesPorCaja, unidadesPorBlister: p.unidadesPorBlister,
    stock: p.lotes.reduce((s, l) => s + l.cantidad, 0),
  }));
}

// "Similares": otros productos con el mismo principio activo.
export async function buscarSimilares(principioActivo: string, excluirId: number) {
  const productos = await prisma.producto.findMany({
    where: { activo: true, principioActivo, id: { not: excluirId } },
    include: { lotes: true }, take: 8,
  });
  return productos.map((p) => ({
    id: p.id, nombre: p.nombre, precioUnidad: p.precioUnidad,
    stock: p.lotes.reduce((s, l) => s + l.cantidad, 0),
  }));
}

export async function crearVenta(
  lineas: LineaVenta[], metodoPago: string, cliente?: string
) {
  if (!lineas.length) throw new Error('El carrito esta vacio.');
  const venta = await registrarVenta(lineas, metodoPago, cliente);
  revalidatePath('/'); revalidatePath('/inventario'); revalidatePath('/reportes');
  return { id: venta.id, total: venta.total };
}
