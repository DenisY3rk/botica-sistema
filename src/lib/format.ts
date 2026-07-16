// Utilidades de formato para Peru (soles y fechas).
export const soles = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n || 0);

export const fecha = (d: Date | string) =>
  new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const fechaHora = (d: Date | string) =>
  new Date(d).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

// Meses hasta el vencimiento (puede ser negativo si ya vencio).
export const mesesHasta = (d: Date | string) => {
  const hoy = new Date();
  const v = new Date(d);
  return (v.getFullYear() - hoy.getFullYear()) * 12 + (v.getMonth() - hoy.getMonth());
};

// Clasificacion de alerta por vencimiento.
export function nivelVencimiento(d: Date | string): 'vencido' | 'critico' | 'alerta' | 'proximo' | 'ok' {
  const m = mesesHasta(d);
  if (m < 0) return 'vencido';
  if (m <= 1) return 'critico';   // <= 1 mes
  if (m <= 3) return 'alerta';    // <= 3 meses
  if (m <= 6) return 'proximo';   // <= 6 meses
  return 'ok';
}
