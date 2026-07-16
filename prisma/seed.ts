/**
 * SEED - Datos de ejemplo realistas de una botica peruana.
 * Ejecuta: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helper: fecha relativa en meses desde hoy
const enMeses = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d;
};

async function main() {
  console.log('Limpiando base de datos...');
  await prisma.movimientoKardex.deleteMany();
  await prisma.ventaItem.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.compraItem.deleteMany();
  await prisma.compra.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.laboratorio.deleteMany();
  await prisma.categoria.deleteMany();

  // ---- Categorias ----
  const cats = await Promise.all(
    ['Analgesicos', 'Antibioticos', 'Antigripales', 'Gastrointestinal',
     'Antialergicos', 'Vitaminas', 'Dermatologicos', 'Cuidado personal']
      .map((nombre) => prisma.categoria.create({ data: { nombre } }))
  );
  const cat = (n: string) => cats.find((c) => c.nombre === n)!.id;

  // ---- Laboratorios ----
  const labs = await Promise.all(
    ['Genfar', 'Portugal', 'Medifarma', 'Bayer', 'Farmindustria',
     'Roemmers', 'Hersil', 'AC Farma']
      .map((nombre) => prisma.laboratorio.create({ data: { nombre } }))
  );
  const lab = (n: string) => labs.find((l) => l.nombre === n)!.id;

  // ---- Proveedores ----
  const provs = await Promise.all([
    prisma.proveedor.create({ data: { nombre: 'Distribuidora Alfaro SAC', ruc: '20512345678', telefono: '01-4567890', contacto: 'Jorge Alfaro' } }),
    prisma.proveedor.create({ data: { nombre: 'Drogueria Los Andes EIRL', ruc: '20487654321', telefono: '054-223344', contacto: 'Maria Quispe' } }),
    prisma.proveedor.create({ data: { nombre: 'Quimica Suiza (QSI)', ruc: '20100123456', telefono: '01-6115000', contacto: 'Ventas QSI' } }),
  ]);

  // ---- Productos ----
  // [nombre, principio, concentracion, forma, categoria, lab, barras, receta,
  //   pCaja, pBlister, pUnidad, uxCaja, uxBlister]
  const P: any[] = [
    ['Panadol Forte', 'Paracetamol', '500 mg', 'Tableta', 'Analgesicos', 'Genfar', '7501001111111', false, 12.0, 3.0, 0.5, 100, 10],
    ['Paracetamol Genfar', 'Paracetamol', '500 mg', 'Tableta', 'Analgesicos', 'Genfar', '7501001111112', false, 8.0, 2.0, 0.3, 100, 10],
    ['Ibuprofeno 400', 'Ibuprofeno', '400 mg', 'Tableta', 'Analgesicos', 'Portugal', '7501001111113', false, 15.0, 4.0, 0.6, 100, 10],
    ['Amoxicilina 500', 'Amoxicilina', '500 mg', 'Capsula', 'Antibioticos', 'Medifarma', '7501001111114', true, 20.0, 6.0, 0.8, 100, 10],
    ['Azitromicina 500', 'Azitromicina', '500 mg', 'Tableta', 'Antibioticos', 'Farmindustria', '7501001111115', true, 18.0, 9.0, 3.0, 30, 3],
    ['Panadol Antigripal', 'Paracetamol + Clorfenamina', '500 mg', 'Tableta', 'Antigripales', 'Bayer', '7501001111116', false, 16.0, 4.5, 0.7, 100, 10],
    ['Aspirina 100', 'Acido acetilsalicilico', '100 mg', 'Tableta', 'Analgesicos', 'Bayer', '7501001111117', false, 14.0, 3.5, 0.4, 100, 10],
    ['Omeprazol 20', 'Omeprazol', '20 mg', 'Capsula', 'Gastrointestinal', 'Portugal', '7501001111118', false, 18.0, 4.0, 0.5, 100, 10],
    ['Ranitidina 300', 'Ranitidina', '300 mg', 'Tableta', 'Gastrointestinal', 'Hersil', '7501001111119', false, 16.0, 4.0, 0.5, 100, 10],
    ['Loratadina 10', 'Loratadina', '10 mg', 'Tableta', 'Antialergicos', 'Roemmers', '7501001111120', false, 15.0, 4.0, 0.5, 100, 10],
    ['Clorfenamina 4', 'Clorfenamina', '4 mg', 'Tableta', 'Antialergicos', 'AC Farma', '7501001111121', false, 6.0, 1.5, 0.2, 100, 10],
    ['Diclofenaco 50', 'Diclofenaco', '50 mg', 'Tableta', 'Analgesicos', 'Medifarma', '7501001111122', false, 12.0, 3.0, 0.4, 100, 10],
    ['Metamizol 500', 'Metamizol', '500 mg', 'Tableta', 'Analgesicos', 'Farmindustria', '7501001111123', false, 10.0, 2.5, 0.3, 100, 10],
    ['Vitamina C 1g', 'Acido ascorbico', '1 g', 'Tableta efervescente', 'Vitaminas', 'Bayer', '7501001111124', false, 22.0, 11.0, 1.2, 20, 10],
    ['Complejo B', 'Vitaminas del complejo B', '-', 'Tableta', 'Vitaminas', 'Hersil', '7501001111125', false, 20.0, 5.0, 0.6, 100, 10],
    ['Sales de rehidratacion', 'Electrolitos', '-', 'Sobre', 'Gastrointestinal', 'Farmindustria', '7501001111126', false, 0, 0, 1.5, 1, 1],
    ['Ciprofloxacino 500', 'Ciprofloxacino', '500 mg', 'Tableta', 'Antibioticos', 'Portugal', '7501001111127', true, 20.0, 5.0, 0.7, 100, 10],
    ['Naproxeno 550', 'Naproxeno', '550 mg', 'Tableta', 'Analgesicos', 'Roemmers', '7501001111128', false, 18.0, 4.5, 0.6, 100, 10],
    ['Alcohol en gel 250ml', 'Alcohol etilico 70%', '250 ml', 'Gel', 'Cuidado personal', 'AC Farma', '7501001111129', false, 0, 0, 8.0, 1, 1],
    ['Ketoconazol crema', 'Ketoconazol', '2%', 'Crema', 'Dermatologicos', 'Medifarma', '7501001111130', false, 0, 0, 12.0, 1, 1],
  ];

  const productos = [];
  for (const p of P) {
    const prod = await prisma.producto.create({
      data: {
        nombre: p[0], principioActivo: p[1], concentracion: p[2], formaFarma: p[3],
        categoriaId: cat(p[4]), laboratorioId: lab(p[5]), codigoBarras: p[6],
        requiereReceta: p[7], precioCaja: p[8], precioBlister: p[9], precioUnidad: p[10],
        unidadesPorCaja: p[11], unidadesPorBlister: p[12], stockMinimo: 20,
      },
    });
    productos.push(prod);
  }

  // ---- Lotes (con vencimientos variados para probar alertas) ----
  // vencimientos: unos ya proximos (1,3,6 meses) y otros lejanos
  const vencs = [1, 3, 6, 12, 18, 24];
  let li = 0;
  for (const prod of productos) {
    const nLotes = 1 + (li % 2); // 1 o 2 lotes por producto
    for (let k = 0; k < nLotes; k++) {
      const mesesVenc = vencs[(li + k) % vencs.length];
      const costo = Math.max(0.1, prod.precioUnidad * 0.6 || 5 * 0.6);
      const cant = 50 + ((li * 7 + k * 13) % 250);
      await prisma.lote.create({
        data: {
          productoId: prod.id,
          codigoLote: `L${new Date().getFullYear()}-${prod.id}${String.fromCharCode(65 + k)}`,
          fechaVencimiento: enMeses(mesesVenc),
          cantidad: cant,
          costoUnitario: Number(costo.toFixed(2)),
          proveedorId: provs[li % provs.length].id,
        },
      });
    }
    li++;
  }

  // ---- Historial de ventas (para reportes y ranking) ----
  console.log('Generando historial de ventas...');
  for (let d = 0; d < 45; d++) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - d);
    const nVentas = 3 + (d % 5);
    for (let v = 0; v < nVentas; v++) {
      const nItems = 1 + (v % 3);
      const itemsData: any[] = [];
      let total = 0;
      for (let it = 0; it < nItems; it++) {
        const prod = productos[(d * 7 + v * 3 + it) % productos.length];
        const lote = await prisma.lote.findFirst({ where: { productoId: prod.id } });
        if (!lote) continue;
        // elegir presentacion
        const tipos = ['UNIDAD', 'BLISTER', 'CAJA'];
        const tipo = tipos[(it + v) % 3];
        const cantidad = 1 + (it % 4);
        let precio = prod.precioUnidad, base = cantidad, costo = lote.costoUnitario;
        if (tipo === 'BLISTER') { precio = prod.precioBlister || prod.precioUnidad * prod.unidadesPorBlister; base = cantidad * prod.unidadesPorBlister; }
        if (tipo === 'CAJA') { precio = prod.precioCaja || prod.precioUnidad * prod.unidadesPorCaja; base = cantidad * prod.unidadesPorCaja; }
        if (precio <= 0) { precio = prod.precioUnidad; base = cantidad; }
        const subtotal = Number((precio * cantidad).toFixed(2));
        total += subtotal;
        itemsData.push({ productoId: prod.id, loteId: lote.id, tipoUnidad: tipo, cantidad, cantidadBase: base, precioUnit: precio, costoUnit: costo, subtotal });
      }
      if (itemsData.length === 0) continue;
      await prisma.venta.create({
        data: {
          fecha, total: Number(total.toFixed(2)),
          metodoPago: ['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'][v % 4],
          items: { create: itemsData },
        },
      });
    }
  }

  console.log('Seed completado.');
  console.log(`Productos: ${productos.length}, Proveedores: ${provs.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
