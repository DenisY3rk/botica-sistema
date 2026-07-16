import ImportForm from './ImportForm';
export const dynamic = 'force-dynamic';
export default function Importar() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div><h1 className="text-2xl font-bold">Carga masiva desde Excel</h1><p className="text-sm text-slate-500">Migra tu catalogo en minutos. Sube tu .xlsx o .csv y el sistema crea o actualiza los productos.</p></div>
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Formato esperado</h2>
        <p className="text-sm text-slate-600">La primera fila debe tener los encabezados. Columnas reconocidas (no importa el orden):</p>
        <div className="text-xs bg-slate-50 rounded-lg p-3 font-mono overflow-x-auto">
          nombre · principio_activo · concentracion · forma · codigo_barras · precio_unidad · precio_blister · precio_caja · und_x_caja · und_x_blister · stock_minimo
        </div>
        <p className="text-xs text-slate-400">Solo <b>nombre</b> y <b>principio_activo</b> son obligatorios. El resto es opcional.</p>
      </div>
      <ImportForm />
    </div>
  );
}
