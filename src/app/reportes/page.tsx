// REPORTES: ventas por dia, resumen de compras, valor de inventario
// y ranking de los 50 productos mas rentables (utilidad = venta - costo).
import { prisma } from '@/lib/prisma';
import { soles, fecha } from '@/lib/format';

export const dynamic = 'force-dynamic';

async function getReportes() {
  const desde = new Date(Date.now() - 30 * 864e5);

  const [ventaItems, comprasAgg, lotes, ventasDia] = await Promise.all([
    prisma.ventaItem.findMany({
      where: { venta: { fecha: { gte: desde } } },
      include: { producto: { select: { nombre: true, principioActivo: true } } },
    }),
    prisma.compra.aggregate({ where: { fecha: { gte: desde } }, _sum: { total: true }, _count: true }),
    prisma.lote.findMany({ where: { cantidad: { gt: 0 } }, include: { producto: { select: { precioUnidad: true } } } }),
    prisma.venta.groupBy({ by: ['fecha'], where: { fecha: { gte: desde } }, _sum: { total: true } }),
  ]);

  // Ranking por rentabilidad
  const map = new Map<number, { nombre: string; principio: string; unidades: number; ingreso: number; costo: number }>();
  for (const it of ventaItems) {
    const cur = map.get(it.productoId) ?? { nombre: it.producto.nombre, principio: it.producto.principioActivo, unidades: 0, ingreso: 0, costo: 0 };
    cur.unidades += it.cantidadBase;
    cur.ingreso += it.subtotal;
    cur.costo += it.costoUnit * it.cantidadBase;
    map.set(it.productoId, cur);
  }
  const ranking = [...map.values()]
    .map((r) => ({ ...r, utilidad: r.ingreso - r.costo, margen: r.ingreso > 0 ? ((r.ingreso - r.costo) / r.ingreso) * 100 : 0 }))
    .sort((a, b) => b.utilidad - a.utilidad)
    .slice(0, 50);

  // Ventas por dia (agrupadas por fecha calendario)
  const porDia = new Map<string, number>();
  for (const v of ventasDia) {
    const k = new Date(v.fecha).toISOString().slice(0, 10);
    porDia.set(k, (porDia.get(k) ?? 0) + (v._sum.total ?? 0));
  }
  const dias = [...porDia.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  const maxDia = Math.max(1, ...dias.map((d) => d[1]));

  const totalVentas = ventaItems.reduce((s, i) => s + i.subtotal, 0);
  const totalUtilidad = ranking.reduce((s, r) => s + r.utilidad, 0);
  const valorInventario = lotes.reduce((s, l) => s + l.cantidad * l.costoUnitario, 0);
  const valorVentaInv = lotes.reduce((s, l) => s + l.cantidad * (l.producto.precioUnidad || 0), 0);

  return { ranking, comprasAgg, dias, maxDia, totalVentas, totalUtilidad, valorInventario, valorVentaInv };
}

export default async function Reportes() {
  const r = await getReportes();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Reportes</h1><p className="text-sm text-slate-500">Ultimos 30 dias</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi t="Ventas (30d)" v={soles(r.totalVentas)} />
        <Kpi t="Utilidad estimada" v={soles(r.totalUtilidad)} />
        <Kpi t="Compras (30d)" v={soles(r.comprasAgg._sum.total ?? 0)} s={`${r.comprasAgg._count} compras`} />
        <Kpi t="Valor inventario (costo)" v={soles(r.valorInventario)} s={`Venta: ${soles(r.valorVentaInv)}`} />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-3">Ventas por dia</h2>
        <div className="space-y-1.5">
          {r.dias.map(([d, v]) => (
            <div key={d} className="flex items-center gap-3 text-sm">
              <span className="w-20 text-slate-500">{fecha(d)}</span>
              <div className="flex-1 bg-slate-100 rounded h-5 overflow-hidden">
                <div className="h-full bg-brand" style={{ width: `${(v / r.maxDia) * 100}%` }} />
              </div>
              <span className="w-20 text-right font-medium">{soles(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-semibold px-4 pt-4">Ranking · Top 50 productos mas rentables</h2>
        <table className="w-full min-w-[640px] mt-2">
          <thead className="bg-slate-50"><tr>
            <th className="th">#</th><th className="th">Producto</th><th className="th">Und vendidas</th>
            <th className="th">Ingreso</th><th className="th">Utilidad</th><th className="th">Margen</th>
          </tr></thead>
          <tbody>
            {r.ranking.map((p, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="td text-slate-400">{i + 1}</td>
                <td className="td font-medium">{p.nombre}<div className="text-xs text-slate-400">{p.principio}</div></td>
                <td className="td">{p.unidades}</td>
                <td className="td">{soles(p.ingreso)}</td>
                <td className="td font-medium text-emerald-700">{soles(p.utilidad)}</td>
                <td className="td"><span className="badge bg-emerald-100 text-emerald-700">{p.margen.toFixed(0)}%</span></td>
              </tr>
            ))}
            {r.ranking.length === 0 && <tr><td className="td text-slate-400" colSpan={6}>Sin ventas en el periodo.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ t, v, s }: { t: string; v: string; s?: string }) {
  return <div className="card p-5"><div className="text-xs font-semibold text-slate-500 uppercase">{t}</div><div className="mt-1 text-2xl font-bold">{v}</div>{s && <div className="text-xs text-slate-400 mt-1">{s}</div>}</div>;
}
