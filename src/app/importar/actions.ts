'use server';
// CARGA MASIVA DESDE EXCEL: parsea .xlsx/.csv y crea/actualiza productos.
// Columnas esperadas (fila 1 = encabezados):
//   nombre | principio_activo | concentracion | forma | codigo_barras |
//   precio_unidad | precio_blister | precio_caja | und_x_caja | und_x_blister | stock_minimo
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';

export interface ResultadoImport { creados: number; actualizados: number; errores: string[]; total: number; }

export async function importarExcel(formData: FormData): Promise<ResultadoImport> {
  const file = formData.get('archivo') as File | null;
  if (!file) throw new Error('No se recibio ningun archivo.');

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: 'buffer' });
  const hoja = wb.Sheets[wb.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<any>(hoja, { defval: '' });

  const res: ResultadoImport = { creados: 0, actualizados: 0, errores: [], total: filas.length };
  const num = (v: any) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
  const norm = (o: any, ...keys: string[]) => {
    for (const k of Object.keys(o)) {
      const kk = k.toLowerCase().trim().replace(/\s+/g, '_');
      if (keys.includes(kk)) return o[k];
    }
    return '';
  };

  for (let i = 0; i < filas.length; i++) {
    const f = filas[i];
    try {
      const nombre = String(norm(f, 'nombre', 'producto', 'descripcion')).trim();
      const principioActivo = String(norm(f, 'principio_activo', 'principio', 'principioactivo')).trim();
      if (!nombre || !principioActivo) { res.errores.push(`Fila ${i + 2}: falta nombre o principio activo.`); continue; }

      const data = {
        nombre, principioActivo,
        concentracion: String(norm(f, 'concentracion', 'concentración')) || null,
        formaFarma: String(norm(f, 'forma', 'forma_farmaceutica')) || null,
        codigoBarras: String(norm(f, 'codigo_barras', 'codigo', 'barras', 'ean')) || null,
        precioUnidad: num(norm(f, 'precio_unidad', 'p_unidad', 'preciounidad')),
        precioBlister: num(norm(f, 'precio_blister', 'p_blister')),
        precioCaja: num(norm(f, 'precio_caja', 'p_caja')),
        unidadesPorCaja: Math.max(1, num(norm(f, 'und_x_caja', 'unidades_por_caja')) || 1),
        unidadesPorBlister: Math.max(1, num(norm(f, 'und_x_blister', 'unidades_por_blister')) || 1),
        stockMinimo: num(norm(f, 'stock_minimo', 'minimo')) || 10,
      };

      const existente = data.codigoBarras
        ? await prisma.producto.findUnique({ where: { codigoBarras: data.codigoBarras } })
        : await prisma.producto.findFirst({ where: { nombre: data.nombre } });

      if (existente) { await prisma.producto.update({ where: { id: existente.id }, data }); res.actualizados++; }
      else { await prisma.producto.create({ data }); res.creados++; }
    } catch (e: any) {
      res.errores.push(`Fila ${i + 2}: ${e?.message ?? 'error'}`);
    }
  }
  revalidatePath('/productos');
  return res;
}
