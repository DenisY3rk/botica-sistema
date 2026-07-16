'use client';
// ============================================================
//  POS - Flujo de venta rapido optimizado para teclado.
//  Atajos:
//   - Escribe y ENTER: busca y agrega el 1er resultado (o abre lista)
//   - Flechas arriba/abajo: navegar resultados; ENTER: agregar
//   - F2 caja · F3 blister · F4 unidad (presentacion por defecto)
//   - +/- : ajustar cantidad de la ultima linea
//   - F9 o "Cobrar": finaliza la venta
//   - ESC: limpiar busqueda
// ============================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import { buscarProductos, crearVenta } from './actions';
import { soles } from '@/lib/format';

type Prod = Awaited<ReturnType<typeof buscarProductos>>[number];
type Tipo = 'CAJA' | 'BLISTER' | 'UNIDAD';
interface Linea { prod: Prod; tipo: Tipo; cantidad: number; }

const precioDe = (p: Prod, t: Tipo) => t === 'CAJA' ? p.precioCaja : t === 'BLISTER' ? p.precioBlister : p.precioUnidad;
const baseDe = (p: Prod, t: Tipo, c: number) => t === 'CAJA' ? c * p.unidadesPorCaja : t === 'BLISTER' ? c * p.unidadesPorBlister : c;

export default function POSClient() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Prod[]>([]);
  const [sel, setSel] = useState(0);
  const [carrito, setCarrito] = useState<Linea[]>([]);
  const [tipoDefault, setTipoDefault] = useState<Tipo>('UNIDAD');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [msg, setMsg] = useState('');
  const [procesando, setProcesando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enfoca la caja de busqueda al cargar y tras cada venta.
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Busqueda con debounce de 180ms.
  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setRes([]); return; }
      const r = await buscarProductos(q);
      setRes(r); setSel(0);
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const agregar = useCallback((p: Prod, tipo: Tipo = tipoDefault) => {
    if (p.stock <= 0) { setMsg(`Sin stock: ${p.nombre}`); return; }
    setCarrito((c) => {
      const i = c.findIndex((l) => l.prod.id === p.id && l.tipo === tipo);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], cantidad: n[i].cantidad + 1 }; return n; }
      return [...c, { prod: p, tipo, cantidad: 1 }];
    });
    setQ(''); setRes([]); setMsg(''); inputRef.current?.focus();
  }, [tipoDefault]);

  const cambiarCant = (i: number, delta: number) =>
    setCarrito((c) => c.map((l, k) => k === i ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l));
  const quitar = (i: number) => setCarrito((c) => c.filter((_, k) => k !== i));

  const total = carrito.reduce((s, l) => s + precioDe(l.prod, l.tipo) * l.cantidad, 0);

  const cobrar = useCallback(async () => {
    if (carrito.length === 0 || procesando) return;
    setProcesando(true);
    try {
      const lineas = carrito.map((l) => ({ productoId: l.prod.id, tipoUnidad: l.tipo, cantidad: l.cantidad }));
      const v = await crearVenta(lineas, metodo);
      setMsg(`Venta #${v.id} registrada · ${soles(v.total)}`);
      setCarrito([]); setQ(''); setRes([]);
    } catch (e: any) { setMsg('Error: ' + (e?.message ?? 'no se pudo registrar')); }
    finally { setProcesando(false); inputRef.current?.focus(); }
  }, [carrito, metodo, procesando]);

  // Atajos globales de teclado.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); setTipoDefault('CAJA'); }
      else if (e.key === 'F3') { e.preventDefault(); setTipoDefault('BLISTER'); }
      else if (e.key === 'F4') { e.preventDefault(); setTipoDefault('UNIDAD'); }
      else if (e.key === 'F9') { e.preventDefault(); cobrar(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cobrar]);

  const onKeyBusqueda = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, res.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (res[sel]) agregar(res[sel]); }
    else if (e.key === 'Escape') { setQ(''); setRes([]); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Columna izquierda: busqueda + resultados */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Venta rapida</h1>
          <p className="text-sm text-slate-500">
            Presentacion por defecto:{' '}
            <b className="text-brand">{tipoDefault}</b> · F2 caja · F3 blister · F4 unidad · F9 cobrar
          </p>
        </div>

        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyBusqueda}
          placeholder="Escanea codigo de barras o escribe nombre / principio activo..."
          className="input text-lg py-3" autoComplete="off" />

        {res.length > 0 && (
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {res.map((p, i) => (
              <button key={p.id} onClick={() => agregar(p)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between ${i === sel ? 'bg-brand/10' : 'hover:bg-slate-50'}`}>
                <div>
                  <div className="font-medium">{p.nombre} {p.requiereReceta && <span className="badge bg-red-100 text-red-700 ml-1">Receta</span>}</div>
                  <div className="text-xs text-slate-500">{p.principioActivo} {p.concentracion} · {p.laboratorio} · Stock: {p.stock}</div>
                </div>
                <div className="text-right text-sm">
                  <div>U: {soles(p.precioUnidad)}</div>
                  <div className="text-xs text-slate-400">Caja: {soles(p.precioCaja)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {msg && <div className="card p-3 text-sm bg-brand/5 border-brand/20 text-brand-dark font-medium">{msg}</div>}
      </div>

      {/* Columna derecha: carrito + cobro */}
      <div className="card p-4 flex flex-col h-fit lg:sticky lg:top-6">
        <h2 className="font-semibold mb-2">Carrito ({carrito.length})</h2>
        <div className="flex-1 space-y-2 max-h-[45vh] overflow-y-auto">
          {carrito.map((l, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="flex-1">
                <div className="text-sm font-medium">{l.prod.nombre}</div>
                <div className="text-xs text-slate-500">
                  <select value={l.tipo} onChange={(e) => setCarrito((c) => c.map((x, k) => k === i ? { ...x, tipo: e.target.value as Tipo } : x))}
                    className="bg-transparent border rounded px-1">
                    <option value="UNIDAD">Unidad</option>
                    <option value="BLISTER">Blister</option>
                    <option value="CAJA">Caja</option>
                  </select>{' '}× {soles(precioDe(l.prod, l.tipo))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => cambiarCant(i, -1)} className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200">−</button>
                <span className="w-7 text-center text-sm">{l.cantidad}</span>
                <button onClick={() => cambiarCant(i, 1)} className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200">+</button>
              </div>
              <div className="w-16 text-right text-sm font-medium">{soles(precioDe(l.prod, l.tipo) * l.cantidad)}</div>
              <button onClick={() => quitar(i)} className="text-slate-400 hover:text-red-500">×</button>
            </div>
          ))}
          {carrito.length === 0 && <div className="text-sm text-slate-400 py-8 text-center">Carrito vacio. Escanea un producto.</div>}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{soles(total)}</span></div>
          <div className="grid grid-cols-4 gap-1">
            {['EFECTIVO', 'YAPE', 'PLIN', 'TARJETA'].map((m) => (
              <button key={m} onClick={() => setMetodo(m)}
                className={`text-xs py-1.5 rounded font-medium ${metodo === m ? 'bg-brand text-white' : 'bg-slate-100'}`}>{m}</button>
            ))}
          </div>
          <button onClick={cobrar} disabled={procesando || carrito.length === 0}
            className="btn-primary w-full py-3 text-base disabled:opacity-50">
            {procesando ? 'Procesando...' : `Cobrar · ${soles(total)} (F9)`}
          </button>
        </div>
      </div>
    </div>
  );
}
