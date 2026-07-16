// GESTION DE PRODUCTOS: listado con busqueda + alta/edicion.
import { listarProductos } from './actions';
import { soles } from '@/lib/format';
import NuevoProducto from './NuevoProducto';

export const dynamic = 'force-dynamic';

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const productos = await listarProductos(q);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-slate-500">{productos.length} productos · busca por nombre, principio activo o codigo</p>
        </div>
        <NuevoProducto />
      </div>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar..." className="input max-w-sm" />
        <button className="btn-ghost">Buscar</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-slate-50"><tr>
            <th className="th">Producto</th><th className="th">Principio activo</th><th className="th">Lab</th>
            <th className="th">Unidad</th><th className="th">Blister</th><th className="th">Caja</th><th className="th">Stock</th>
          </tr></thead>
          <tbody>
            {productos.map((p) => {
              const stock = p.lotes.reduce((s, l) => s + l.cantidad, 0);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td font-medium">{p.nombre}{p.requiereReceta && <span className="badge bg-red-100 text-red-700 ml-1">Receta</span>}<div className="text-xs text-slate-400">{p.concentracion} · {p.formaFarma}</div></td>
                  <td className="td">{p.principioActivo}</td>
                  <td className="td text-slate-500">{p.laboratorio?.nombre}</td>
                  <td className="td">{soles(p.precioUnidad)}</td>
                  <td className="td">{soles(p.precioBlister)}</td>
                  <td className="td">{soles(p.precioCaja)}</td>
                  <td className="td"><span className={`badge ${stock <= p.stockMinimo ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{stock} und</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
