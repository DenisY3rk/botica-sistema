'use client';
import { useState } from 'react';
import { importarExcel, type ResultadoImport } from './actions';

export default function ImportForm() {
  const [res, setRes] = useState<ResultadoImport | null>(null);
  const [cargando, setCargando] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="card p-5 space-y-4">
      <form action={async (fd) => {
        setErr(''); setRes(null); setCargando(true);
        try { setRes(await importarExcel(fd)); }
        catch (e: any) { setErr(e?.message ?? 'Error al importar'); }
        finally { setCargando(false); }
      }} className="space-y-3">
        <input type="file" name="archivo" accept=".xlsx,.xls,.csv" required
          className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-white" />
        <button className="btn-primary" disabled={cargando}>{cargando ? 'Procesando...' : 'Importar productos'}</button>
      </form>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {res && (
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <div className="flex gap-4 text-sm">
            <span className="badge bg-emerald-100 text-emerald-700">Creados: {res.creados}</span>
            <span className="badge bg-blue-100 text-blue-700">Actualizados: {res.actualizados}</span>
            <span className="badge bg-slate-100 text-slate-600">Total filas: {res.total}</span>
          </div>
          {res.errores.length > 0 && (
            <details className="text-sm"><summary className="cursor-pointer text-red-600">{res.errores.length} filas con observaciones</summary>
              <ul className="list-disc pl-5 mt-1 text-slate-600 max-h-40 overflow-y-auto">{res.errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
