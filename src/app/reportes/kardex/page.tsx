// KARDEX: historial de movimientos (entradas/salidas) por producto,
// con saldo acumulado. Selector de producto por query param.
import { prisma } from '@/lib/prisma';
import { fechaHora, soles } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Kardex({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const productos = await prisma.producto.findMany({ orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } });
  const productoId = p ? Number(p) : productos[0]?.id;

  const movs = productoId ? await prisma.movimientoKardex.findMany({
    where: { productoId }, include: { lote: true }, orderBy: { fecha: 'desc' }, take: 200,
  }) : [];

  const color: Record<string, string> = { ENTRADA: 'bg-emerald-100 text-emerald-700', SALIDA: 'bg-red-100 text-red-700', AJUSTE: 'bg-amber-100 text-amber-700' };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold">Kardex</h1><p className="text-sm text-slate-500">Trazabilidad de entradas y salidas por producto</p></div>
      <form className="max-w-sm flex items-end gap-2">
        <div className="flex-1">
          <label className="label">Producto</label>
          <select name="p" defaultValue={productoId} className="input">
            {productos.map((pr) => <option key={pr.id} value={pr.id}>{pr.nombre}</option>)}
          </select>
        </div>
        <button className="btn-ghost">Ver</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-slate-50"><tr>
            <th className="th">Fecha</th><th className="th">Tipo</th><th className="th">Lote</th>
            <th className="th">Cantidad</th><th className="th">Saldo</th><th className="th">Costo und</th><th className="th">Referencia</th>
          </tr></thead>
          <tbody>
            {movs.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="td">{fechaHora(m.fecha)}</td>
                <td className="td"><span className={`badge ${color[m.tipo]}`}>{m.tipo}</span></td>
                <td className="td text-slate-500">{m.lote?.codigoLote ?? '—'}</td>
                <td className={`td font-medium ${m.cantidad < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{m.cantidad > 0 ? '+' : ''}{m.cantidad}</td>
                <td className="td font-medium">{m.saldo}</td>
                <td className="td">{soles(m.costoUnit)}</td>
                <td className="td text-slate-500">{m.referencia ?? '—'}</td>
              </tr>
            ))}
            {movs.length === 0 && <tr><td className="td text-slate-400" colSpan={7}>Sin movimientos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
