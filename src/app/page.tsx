// PANEL PRINCIPAL: KPIs del dia, alertas de vencimiento y stock bajo.
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { soles, fecha, nivelVencimiento, mesesHasta } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function getData() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date(); finHoy.setHours(23, 59, 59, 999);

  const [ventasHoy, ventas30, productos, lotesProximos, sinStock] = await Promise.all([
    prisma.venta.aggregate({ where: { fecha: { gte: hoy, lte: finHoy } }, _sum: { total: true }, _count: true }),
    prisma.venta.aggregate({ where: { fecha: { gte: new Date(Date.now() - 30 * 864e5) } }, _sum: { total: true } }),
    prisma.producto.count({ where: { activo: true } }),
    prisma.lote.findMany({
      where: { cantidad: { gt: 0 }, fechaVencimiento: { lte: new Date(Date.now() + 183 * 864e5) } },
      include: { producto: true }, orderBy: { fechaVencimiento: 'asc' }, take: 8,
    }),
    prisma.producto.findMany({ where: { activo: true }, include: { lotes: true } }),
  ]);

  const bajoStock = sinStock
    .map((p) => ({ nombre: p.nombre, stock: p.lotes.reduce((s, l) => s + l.cantidad, 0), min: p.stockMinimo }))
    .filter((p) => p.stock <= p.min)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  return { ventasHoy, ventas30, productos, lotesProximos, bajoStock };
}

const colorVenc: Record<string, string> = {
  vencido: 'bg-red-100 text-red-700', critico: 'bg-red-100 text-red-700',
  alerta: 'bg-amber-100 text-amber-700', proximo: 'bg-yellow-100 text-yellow-700', ok: 'bg-slate-100 text-slate-600',
};

export default async function Panel() {
  const d = await getData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel</h1>
        <p className="text-sm text-slate-500">{fecha(new Date())} · Resumen de tu botica</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Ventas de hoy" value={soles(d.ventasHoy._sum.total ?? 0)} sub={`${d.ventasHoy._count} ventas`} />
        <Kpi title="Ventas 30 dias" value={soles(d.ventas30._sum.total ?? 0)} />
        <Kpi title="Productos activos" value={String(d.productos)} />
        <Kpi title="Alertas de vencimiento" value={String(d.lotesProximos.length)} sub="proximos 6 meses" accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Productos por vencer</h2>
            <Link href="/inventario" className="text-sm text-brand hover:underline">Ver todo</Link>
          </div>
          <table className="w-full">
            <thead><tr><th className="th">Producto</th><th className="th">Lote</th><th className="th">Vence</th><th className="th">Stock</th></tr></thead>
            <tbody>
              {d.lotesProximos.map((l) => {
                const niv = nivelVencimiento(l.fechaVencimiento);
                return (
                  <tr key={l.id}>
                    <td className="td font-medium">{l.producto.nombre}</td>
                    <td className="td text-slate-500">{l.codigoLote}</td>
                    <td className="td"><span className={`badge ${colorVenc[niv]}`}>{fecha(l.fechaVencimiento)} · {mesesHasta(l.fechaVencimiento)}m</span></td>
                    <td className="td">{l.cantidad}</td>
                  </tr>
                );
              })}
              {d.lotesProximos.length === 0 && <tr><td className="td text-slate-400" colSpan={4}>Sin alertas.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Stock bajo (reponer)</h2>
            <Link href="/compras" className="text-sm text-brand hover:underline">Registrar compra</Link>
          </div>
          <table className="w-full">
            <thead><tr><th className="th">Producto</th><th className="th">Stock</th><th className="th">Minimo</th></tr></thead>
            <tbody>
              {d.bajoStock.map((p, i) => (
                <tr key={i}>
                  <td className="td font-medium">{p.nombre}</td>
                  <td className="td"><span className="badge bg-red-100 text-red-700">{p.stock} und</span></td>
                  <td className="td text-slate-500">{p.min}</td>
                </tr>
              ))}
              {d.bajoStock.length === 0 && <tr><td className="td text-slate-400" colSpan={3}>Todo con stock suficiente.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value, sub, accent }: { title: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? 'ring-1 ring-brand/30' : ''}`}>
      <div className="text-xs font-semibold text-slate-500 uppercase">{title}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
