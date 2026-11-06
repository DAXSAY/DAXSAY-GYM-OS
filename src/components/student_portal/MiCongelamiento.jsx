// Portal del alumno: su derecho a congelar la membresía y su historial
import React, { useEffect, useState } from "react";
import { Snowflake } from "lucide-react";
import { api } from "../../api/cliente";
import { fechaCorta } from "../../utils/fecha";

export const MiCongelamiento = ({ member, gymConfig }) => {
  const f = member.freeze;
  const [hist, setHist] = useState([]);
  const [ver, setVer] = useState(false);

  useEffect(() => {
    api(`/alumnos/${member.id}/congelamientos`)
      .then((d) => setHist(d.history || []))
      .catch(() => setHist([]));
  }, [member.id, member.membershipEndDate]);

  const c = f.current;
  const wsp = `https://wa.me/${gymConfig?.gym_whatsapp || ""}?text=${encodeURIComponent(
    `Hola Recepción ${gymConfig?.gym_nombre || "RADICAL"}, soy ${member.fullName} (DNI: ${member.dni}) y deseo congelar mi membresía. Me quedan ${f.daysLeft} días de congelamiento.`,
  )}`;

  return (
    <div className={`mt-4 rounded-2xl p-4 border ${c?.status === "activo" ? "bg-sky-500/25 border-sky-300/60" : "bg-white/5 border-white/15"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
            <Snowflake className="w-4 h-4" />
            {c?.status === "activo" ? "Tu membresía está congelada" : c ? "Congelamiento programado" : "Congelamiento de membresía"}
          </p>
          {c ? (
            <p className="text-white text-sm">
              Del <b>{fechaCorta(c.startDate)}</b> al <b>{fechaCorta(c.endDate)}</b> ·{" "}
              {c.status === "activo" ? (
                <>
                  vuelves el <b>{fechaCorta(c.returnDate)}</b> ({c.daysLeft} día(s))
                </>
              ) : (
                <>empieza en {c.daysLeft} día(s)</>
              )}
              . Tu membresía vence el <b>{fechaCorta(member.membershipEndDate)}</b>.
            </p>
          ) : (
            <p className="text-white text-sm">{f.rules}.</p>
          )}
          {f.allowed && (
            <p className="text-xs text-slate-300">
              Te quedan <b className="text-white">{f.daysLeft}</b> de {f.totalDays} días
              {f.maxParts > 1 && ` (${f.partsLeft} de ${f.maxParts} congelamientos)`} · caduca el {fechaCorta(f.expiresOn)}
              {f.allowed && " · todo o nada: si vuelves antes, los días no usados se pierden"}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {hist.length > 0 && (
            <button onClick={() => setVer(!ver)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer">
              {ver ? "Ocultar historial" : `Historial (${hist.length})`}
            </button>
          )}
          {f.canFreeze && !c && (
            <a href={wsp} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold text-center">
              Solicitar congelamiento
            </a>
          )}
        </div>
      </div>
      {ver && (
        <ul className="mt-3 space-y-1.5">
          {hist.map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-2 text-xs bg-white/5 rounded-lg px-3 py-2 text-slate-200">
              <span>
                {fechaCorta(h.startDate)} → {fechaCorta(h.endDate)} · {h.days} días{h.daysUsed != null ? ` (usó ${h.daysUsed})` : ""} · {h.reason}
              </span>
              <b className={h.status === "anulado" ? "text-rose-300" : h.status === "activo" ? "text-sky-200" : "text-slate-300"}>{h.statusLabel}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
