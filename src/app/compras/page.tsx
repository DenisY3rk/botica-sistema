import { prisma } from '@/lib/prisma';
import { datosCompra } from './actions';
import { soles, fecha } from '@/lib/format';
import CompraForm from './CompraForm';
export const dynamic = 'force-dynamic';

export default async function Compras() {
  const { proveedores, productos } = await datosCompra();
  const historial = await prisma.compra.findMany({
    include: { proveedor: true, _count: { select: { items: true } } },
    orderBy: { fecha: 'desc' }, take: 20,
  });
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold">Compras</h1><p className="text-sm text-slate-500">Registra ingresos de mercaderia. Cada linea crea un lote con su vencimiento.</p></div>
      <CompraForm proveedores={proveedores} productos={productos} />
      <div className="card overflow-x-auto">
        <h2 className="font-semibold px-4 pt-4">Ultimas compras</h2>
        <table className="w-full min-w-[560px] mt-2">
          <thead className="bg-slate-50"><tr>
            <th className="th">#</th><th className="th">Fecha</th><th className="th">Proveedor</th><th className="th">Doc</th><th className="th">Items</th><th className="th">Total</th>
          </tr></thead>
          <tbody>
            {historial.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="td">{c.id}</td><td className="td">{fecha(c.fecha)}</td>
                <td className="td font-medium">{c.proveedor.nombre}</td><td className="td text-slate-500">{c.numeroDoc ?? '—'}</td>
                <td className="td">{c._count.items}</td><td className="td font-medium">{soles(c.total)}</td>
              </tr>
            ))}
            {historial.length === 0 && <tr><td className="td text-slate-400" colSpan={6}>Aun no hay compras registradas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
