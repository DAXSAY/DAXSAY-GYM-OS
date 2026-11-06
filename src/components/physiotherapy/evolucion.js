// Estados y datos de seguimiento de la evolución en fisioterapia (compartidos por ficha, lista y reporte)
export const ESTADOS_EVOLUCION = [
  { v: "en_evaluacion", l: "Evaluación inicial", emoji: "🔍", clase: "bg-slate-100 text-slate-700 border-slate-300" },
  { v: "reevaluacion", l: "Control / reevaluación", emoji: "📋", clase: "bg-blue-100 text-blue-800 border-blue-300" },
  { v: "notable_mejora", l: "Mejoría notable", d: "dolor ↓ más de 50 %", emoji: "🎉", clase: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { v: "mejora_moderada", l: "Mejoría moderada", d: "dolor ↓ 30–50 %", emoji: "😊", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { v: "mejora_leve", l: "Mejoría leve", emoji: "👍", clase: "bg-teal-50 text-teal-700 border-teal-200" },
  { v: "estable", l: "Estable, sin cambios", emoji: "⚖️", clase: "bg-amber-50 text-amber-800 border-amber-200" },
  { v: "recaida", l: "Recaída", d: "volvió el dolor", emoji: "🔁", clase: "bg-orange-100 text-orange-800 border-orange-300" },
  { v: "empeoramiento", l: "Empeoramiento", d: "reajustar plan", emoji: "⚠️", clase: "bg-rose-100 text-rose-800 border-rose-300" },
  { v: "derivacion", l: "Derivado a médico", emoji: "🏥", clase: "bg-purple-100 text-purple-800 border-purple-300" },
  { v: "alta", l: "Alta / objetivo cumplido", emoji: "🏆", clase: "bg-indigo-100 text-indigo-800 border-indigo-300" },
];
export const estadoEvolucion = (v) => ESTADOS_EVOLUCION.find((e) => e.v === v) || ESTADOS_EVOLUCION[0];

export const ADHERENCIA = [
  { v: "primera", l: "Primera vez", emoji: "🆕" },
  { v: "completa", l: "Hace todo lo indicado", emoji: "✅" },
  { v: "parcial", l: "Lo hace a veces", emoji: "🟡" },
  { v: "no_realiza", l: "No lo hace", emoji: "❌" },
];
export const FRECUENCIA_SESIONES = ["1 vez por semana", "2 veces por semana", "3 veces por semana", "Cada 15 días", "Mensual", "Solo control"];
export const PRONOSTICO = [
  { v: "favorable", l: "Favorable", emoji: "🟢" },
  { v: "reservado", l: "Reservado", emoji: "🟡" },
  { v: "desfavorable", l: "Desfavorable", emoji: "🔴" },
];
export const etiqueta = (lista, v) => lista.find((x) => x.v === v);
