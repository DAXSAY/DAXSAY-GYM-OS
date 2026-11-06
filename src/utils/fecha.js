// Fecha de hoy en Lima con formato AAAA-MM-DD
export const hoyISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });

// Suma días a una fecha AAAA-MM-DD (sin desfases de zona horaria)
export const sumarDias = (iso, dias) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};

// Días desde hoy hasta la fecha (negativo si ya pasó)
export const diasHasta = (iso) =>
  Math.round((new Date(`${iso}T12:00:00`) - new Date(`${hoyISO()}T12:00:00`)) / 86400000);

// AAAA-MM-DD -> "05/11/2026"
export const fechaCorta = (iso) => (iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "");
