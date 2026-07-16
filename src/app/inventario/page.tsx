// INVENTARIO Y LOTES: stock por lote con fechas de vencimiento y
// alertas por 1, 3 y 6 meses. Filtro por nivel de alerta.
import { prisma } from '@/lib/prisma';
import { fecha, nivelVencimiento, mesesHasta } from '@/lib/format';

export const dynamic = 'force-dynamic';

const colores: Record<string, string> = {
  vencido: 'bg-red-600 text-white', critico: 'bg-red-100 text-red-700',
  alerta: 'bg-amber-100 text-amber-700', proximo: 'bg-yellow-100 text-yellow-800',
  ok: 'bg-emerald-100 text-emerald-700',
};
const etiqueta: Record<string, string> = {
  vencido: 'VENCIDO', critico: '≤ 1 mes', alerta: '≤ 3 meses', proximo: '≤ 6 meses', ok: 'Vigente',
};

export default async function Inventario({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const lotes = await prisma.lote.findMany({
    where: { cantidad: { gt: 0 } },
    include: { producto: true, proveedor: true },
    orderBy: { fechaVencimiento: 'asc' }, take: 500,
  });
  const conNivel = lotes.map((l) => ({ ...l, nivel: nivelVencimiento(l.fechaVencimiento) }));
  const filtrados = f && f !== 'todos' ? conNivel.filter((l) => l.nivel === f) : conNivel;

  const conteo = {
    vencido: conNivel.filter((l) => l.nivel === 'vencido').length,
    critico: conNivel.filter((l) => l.nivel === 'critico').length,
    alerta: conNivel.filter((l) => l.nivel === 'alerta').length,
    proximo: conNivel.filter((l) => l.nivel === 'proximo').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Inventario y lotes</h1>
        <p className="text-sm text-slate-500">Control de stock por lote y fechas de vencimiento (metodo FEFO)</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Filtro label="Vencidos" valor={conteo.vencido} f="vencido" cur={f} color="bg-red-600" />
        <Filtro label="Por vencer ≤1 mes" valor={conteo.critico} f="critico" cur={f} color="bg-red-500" />
        <Filtro label="≤3 meses" valor={conteo.alerta} f="alerta" cur={f} color="bg-amber-500" />
        <Filtro label="≤6 meses" valor={conteo.proximo} f="proximo" cur={f} color="bg-yellow-500" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-slate-50"><tr>
            <th className="th">Producto</th><th className="th">Lote</th><th className="th">Vencimiento</th>
            <th className="th">Estado</th><th className="th">Stock (und)</th><th className="th">Proveedor</th>
          </tr></thead>
          <tbody>
            {filtrados.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="td font-medium">{l.producto.nombre}<div className="text-xs text-slate-400">{l.producto.principioActivo}</div></td>
                <td className="td text-slate-500">{l.codigoLote}</td>
                <td className="td">{fecha(l.fechaVencimiento)}<div className="text-xs text-slate-400">{mesesHasta(l.fechaVencimiento)} meses</div></td>
                <td className="td"><span className={`badge ${colores[l.nivel]}`}>{etiqueta[l.nivel]}</span></td>
                <td className="td font-medium">{l.cantidad}</td>
                <td className="td text-slate-500">{l.proveedor?.nombre ?? '—'}</td>
              </tr>
            ))}
            {filtrados.length === 0 && <tr><td className="td text-slate-400" colSpan={6}>Sin lotes en este filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Filtro({ label, valor, f, cur, color }: { label: string; valor: number; f: string; cur?: string; color: string }) {
  const active = cur === f;
  return (
    <a href={active ? '/inventario' : `/inventario?f=${f}`}
      className={`card p-4 block transition ${active ? 'ring-2 ring-brand' : 'hover:shadow'}`}>
      <div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${color}`} /><span className="text-xs font-semibold text-slate-500">{label}</span></div>
      <div className="text-2xl font-bold mt-1">{valor}</div>
      <div className="text-xs text-slate-400">lotes</div>
    </a>
  );
}
