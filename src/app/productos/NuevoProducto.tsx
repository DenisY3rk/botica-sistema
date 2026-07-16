'use client';
import { useState } from 'react';
import { guardarProducto } from './actions';

export default function NuevoProducto() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ Nuevo producto</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form action={async (fd) => { await guardarProducto(fd); setOpen(false); }}
            onClick={(e) => e.stopPropagation()}
            className="card p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
            <h2 className="text-lg font-bold">Nuevo producto</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Nombre comercial *</label><input name="nombre" required className="input" /></div>
              <div><label className="label">Principio activo *</label><input name="principioActivo" required className="input" /></div>
              <div><label className="label">Concentracion</label><input name="concentracion" placeholder="500 mg" className="input" /></div>
              <div><label className="label">Forma farmaceutica</label><input name="formaFarma" placeholder="Tableta" className="input" /></div>
              <div><label className="label">Codigo de barras</label><input name="codigoBarras" className="input" /></div>
              <div><label className="label">Precio unidad</label><input name="precioUnidad" type="number" step="0.01" className="input" /></div>
              <div><label className="label">Precio blister</label><input name="precioBlister" type="number" step="0.01" className="input" /></div>
              <div><label className="label">Precio caja</label><input name="precioCaja" type="number" step="0.01" className="input" /></div>
              <div><label className="label">Unidades por caja</label><input name="unidadesPorCaja" type="number" defaultValue={100} className="input" /></div>
              <div><label className="label">Unidades por blister</label><input name="unidadesPorBlister" type="number" defaultValue={10} className="input" /></div>
              <div><label className="label">Stock minimo</label><input name="stockMinimo" type="number" defaultValue={20} className="input" /></div>
              <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" name="requiereReceta" /> Requiere receta medica</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
              <button className="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
