import { prisma } from '@/lib/prisma';
import { guardarProveedor } from './actions';
export const dynamic = 'force-dynamic';
export default async function Proveedores() {
  const provs = await prisma.proveedor.findMany({
    include: { _count: { select: { compras: true } } }, orderBy: { nombre: 'asc' },
  });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Proveedores</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-slate-50"><tr>
              <th className="th">Nombre</th><th className="th">RUC</th><th className="th">Contacto</th><th className="th">Telefono</th><th className="th">Compras</th>
            </tr></thead>
            <tbody>
              {provs.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td font-medium">{p.nombre}</td>
                  <td className="td text-slate-500">{p.ruc ?? '—'}</td>
                  <td className="td">{p.contacto ?? '—'}</td>
                  <td className="td">{p.telefono ?? '—'}</td>
                  <td className="td">{p._count.compras}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={guardarProveedor} className="card p-5 space-y-3 h-fit">
          <h2 className="font-semibold">Nuevo proveedor</h2>
          <div><label className="label">Nombre / Razon social *</label><input name="nombre" required className="input" /></div>
          <div><label className="label">RUC</label><input name="ruc" className="input" /></div>
          <div><label className="label">Contacto</label><input name="contacto" className="input" /></div>
          <div><label className="label">Telefono</label><input name="telefono" className="input" /></div>
          <div><label className="label">Direccion</label><input name="direccion" className="input" /></div>
          <button className="btn-primary w-full">Guardar proveedor</button>
        </form>
      </div>
    </div>
  );
}
