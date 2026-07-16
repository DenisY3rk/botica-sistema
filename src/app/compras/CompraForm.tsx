'use client';
import { useState } from 'react';
import { crearCompra } from './actions';
import { soles } from '@/lib/format';

type Prov = { id: number; nombre: string };
type Prod = { id: number; nombre: string; principioActivo: string };
interface Linea { productoId: number; nombre: string; codigoLote: string; fechaVencimiento: string; cantidad: number; costoUnit: number; }

export default function CompraForm({ proveedores, productos }: { proveedores: Prov[]; productos: Prod[] }) {
  const [proveedorId, setProveedorId] = useState(0);
  const [numeroDoc, setNumeroDoc] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [pid, setPid] = useState(0);
  const [msg, setMsg] = useState('');

  const agregar = () => {
    const prod = productos.find((p) => p.id === Number(pid));
    if (!prod) return;
    setLineas((l) => [...l, { productoId: prod.id, nombre: prod.nombre, codigoLote: '', fechaVencimiento: '', cantidad: 1, costoUnit: 0 }]);
  };
  const set = (i: number, k: keyof Linea, v: any) => setLineas((l) => l.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const total = lineas.reduce((s, l) => s + l.cantidad * l.costoUnit, 0);

  const guardar = async () => {
    setMsg('');
    try {
      if (lineas.some((l) => !l.codigoLote || !l.fechaVencimiento || l.cantidad <= 0)) { setMsg('Completa lote, vencimiento y cantidad en cada linea.'); return; }
      const r = await crearCompra(Number(proveedorId), numeroDoc, lineas.map((l) => ({
        productoId: l.productoId, codigoLote: l.codigoLote, fechaVencimiento: l.fechaVencimiento, cantidad: Number(l.cantidad), costoUnit: Number(l.costoUnit),
      })));
      setMsg(`Compra #${r.id} registrada · ${soles(r.total)}`); setLineas([]); setNumeroDoc('');
    } catch (e: any) { setMsg('Error: ' + (e?.message ?? 'no se pudo')); }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label">Proveedor *</label>
          <select value={proveedorId} onChange={(e) => setProveedorId(Number(e.target.value))} className="input">
            <option value={0}>— Selecciona —</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div><label className="label">N° documento</label><input value={numeroDoc} onChange={(e) => setNumeroDoc(e.target.value)} className="input" placeholder="F001-1234" /></div>
        <div className="flex items-end gap-2">
          <select value={pid} onChange={(e) => setPid(Number(e.target.value))} className="input">
            <option value={0}>+ Agregar producto...</option>
            {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.principioActivo})</option>)}
          </select>
          <button onClick={agregar} className="btn-ghost">Add</button>
        </div>
      </div>

      {lineas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead><tr><th className="th">Producto</th><th className="th">Lote</th><th className="th">Vence</th><th className="th">Cant (und)</th><th className="th">Costo und</th><th className="th">Subtotal</th><th></th></tr></thead>
            <tbody>
              {lineas.map((l, i) => (
                <tr key={i}>
                  <td className="td font-medium">{l.nombre}</td>
                  <td className="td"><input value={l.codigoLote} onChange={(e) => set(i, 'codigoLote', e.target.value)} className="input py-1" placeholder="L2026-A" /></td>
                  <td className="td"><input type="date" value={l.fechaVencimiento} onChange={(e) => set(i, 'fechaVencimiento', e.target.value)} className="input py-1" /></td>
                  <td className="td"><input type="number" min={1} value={l.cantidad} onChange={(e) => set(i, 'cantidad', Number(e.target.value))} className="input py-1 w-20" /></td>
                  <td className="td"><input type="number" step="0.01" value={l.costoUnit} onChange={(e) => set(i, 'costoUnit', Number(e.target.value))} className="input py-1 w-24" /></td>
                  <td className="td">{soles(l.cantidad * l.costoUnit)}</td>
                  <td className="td"><button onClick={() => setLineas((x) => x.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">Total: {soles(total)}</div>
        <button onClick={guardar} disabled={!proveedorId || lineas.length === 0} className="btn-primary disabled:opacity-50">Registrar compra</button>
      </div>
      {msg && <div className="text-sm font-medium text-brand-dark">{msg}</div>}
    </div>
  );
}
