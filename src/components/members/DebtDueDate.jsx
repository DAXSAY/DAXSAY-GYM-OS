import React from "react";
import { CalendarClock } from "lucide-react";
import { hoyISO, sumarDias, diasHasta, fechaCorta } from "../../utils/fecha";

/**
 * Selector de "¿hasta cuándo cancela el saldo?".
 * Atajos de 7 / 15 / 30 días o fecha exacta (máximo 6 meses).
 */
export const DebtDueDatePicker = ({ value, onChange, membershipEnd, required = true, label }) => {
  const hoy = hoyISO();
  const atajos = [
    { t: "7 días", f: sumarDias(hoy, 7) },
    { t: "15 días", f: sumarDias(hoy, 15) },
    { t: "30 días", f: sumarDias(hoy, 30) },
  ];
  if (membershipEnd && membershipEnd > hoy && !atajos.some((a) => a.f === membershipEnd)) {
    atajos.push({ t: "Fin del plan", f: String(membershipEnd).slice(0, 10) });
  }
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 space-y-2 text-left">
      <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
        <CalendarClock className="w-3.5 h-3.5" />
        {label || "¿Hasta cuándo cancela el saldo?"} {required && <span className="text-rose-600">*</span>}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {atajos.map((a) => (
          <button
            key={a.t}
            type="button"
            onClick={() => onChange(a.f)}
            className={`px-2 py-1 rounded-md text-xs font-semibold border cursor-pointer ${
              value === a.f ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {a.t}
          </button>
        ))}
        <input
          type="date"
          min={hoy}
          max={sumarDias(hoy, 180)}
          value={value || ""}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="px-2 py-1 rounded-md border border-amber-300 bg-white text-xs font-semibold"
        />
      </div>
      {value && (
        <p className="text-[11px] text-amber-800">
          Debe cancelar hasta el <b>{fechaCorta(value)}</b> ({diasHasta(value)} días).
        </p>
      )}
    </div>
  );
};

const ESTILOS = {
  vencida: "bg-rose-600 text-white",
  por_vencer: "bg-amber-500 text-white",
  al_dia: "bg-rose-50 text-rose-700 border border-rose-200",
  sin_fecha: "bg-rose-50 text-rose-700 border border-rose-200",
};

/** Texto corto del plazo: "vence hoy", "vencida hace 3 días", "faltan 5 días" */
export const textoPlazo = (member) => {
  const d = member.debtDaysLeft;
  if (d == null) return "";
  if (d < 0) return `vencida hace ${-d} día${d === -1 ? "" : "s"}`;
  if (d === 0) return "vence hoy";
  if (d === 1) return "vence mañana";
  return `faltan ${d} días`;
};

/** Etiqueta "Debe S/ 50 · hasta 05/11 (faltan 6 días)" */
export const DebtBadge = ({ member, compact = false }) => {
  if (!(member?.debt > 0)) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${ESTILOS[member.debtStatus] || ESTILOS.al_dia}`}
      title={member.debtDueDate ? `Fecha límite de pago: ${fechaCorta(member.debtDueDate)}` : "Sin fecha límite"}
    >
      Debe S/ {member.debt.toFixed(2)}
      {member.debtDueDate && (
        <>
          {" · "}
          {compact ? textoPlazo(member) : `hasta ${fechaCorta(member.debtDueDate)} (${textoPlazo(member)})`}
        </>
      )}
    </span>
  );
};

/** Enlace de WhatsApp para recordar al alumno su saldo pendiente */
export const enlaceRecordatorioDeuda = ({ nombre, telefono, monto, fecha, gym = "RADICAL" }) => {
  let tel = String(telefono || "").replace(/[^0-9]/g, "");
  if (tel.length === 9) tel = `51${tel}`;
  if (tel.length < 9) return null;
  const pila = String(nombre || "").split(" ")[0];
  const d = fecha ? diasHasta(fecha) : null;
  const plazo = !fecha
    ? ""
    : d < 0
      ? ` La fecha límite de pago fue el ${fechaCorta(fecha)}.`
      : d === 0
        ? " La fecha límite de pago es hoy."
        : ` La fecha límite de pago es el ${fechaCorta(fecha)}.`;
  const texto = `Hola ${pila} 👋, te saludamos de ${gym}. Te recordamos que tienes un saldo pendiente de S/ ${Number(monto).toFixed(2)} de tu membresía.${plazo} Puedes cancelarlo en recepción o por Yape/Plin. ¡Gracias! 💪`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
};
