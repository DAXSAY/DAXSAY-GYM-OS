// =====================================================================
// FICHA DEPORTIVA DEL ALUMNO (para entrenador, fisio, nutrición, recepción)
// Membresía + rutina que le toca hoy + lesiones / restricciones de fisio +
// dieta + asistencia reciente, en una sola vista.
// =====================================================================
import React, { useEffect, useMemo, useState } from "react";
import { Dumbbell, HeartPulse, Salad, CalendarCheck, AlertTriangle, ShieldCheck, Clock, ChevronDown } from "lucide-react";
import { api } from "../../api/cliente";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const sinTilde = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const fCorta = (iso) => (iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "—");
const NOMBRE_ZONA = {
  cervical: "Cervical", dorsal: "Dorsal", lumbar: "Lumbar", hombro: "Hombro", codo: "Codo", muneca: "Muñeca", cadera: "Cadera",
  rodilla: "Rodilla", tobillo: "Tobillo", pie: "Pie", sacro: "Sacro", isquios: "Isquiotibiales", cuadriceps: "Cuádriceps",
};

/** Qué día de la rutina le toca hoy:
 *  1) si el día se llama como el día de la semana (Lunes, Martes…), ese;
 *  2) si no, va rotando según los días que ya vino al gimnasio. */
export const diaDeHoy = (rutina, totalAsistencias = 0) => {
  const dias = rutina?.days || [];
  if (!dias.length) return { indice: -1, motivo: "" };
  const hoy = sinTilde(DIAS[new Date().getDay()]);
  const porNombre = dias.findIndex((d) => sinTilde(d.dayName).includes(hoy));
  if (porNombre >= 0) return { indice: porNombre, motivo: `hoy es ${DIAS[new Date().getDay()]}` };
  const i = totalAsistencias % dias.length;
  return { indice: i, motivo: `según su asistencia (${totalAsistencias} días entrenados, rota cada ${dias.length} días)` };
};

const Bloque = ({ icono: Icono, titulo, color, children, extra }) => (
  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden rd-aparece">
    <div className={`px-4 py-2.5 flex items-center justify-between gap-2 ${color}`}>
      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
        <Icono className="w-4 h-4" /> {titulo}
      </h4>
      {extra}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export const FichaDeportiva = ({ member, onVerCalendario }) => {
  const [ficha, setFicha] = useState(null);
  const [error, setError] = useState("");
  const [verDia, setVerDia] = useState(null);

  useEffect(() => {
    setFicha(null);
    setError("");
    api(`/alumnos/${member.id}/ficha`).then(setFicha).catch((e) => setError(e.message));
  }, [member.id]);

  const hoy = useMemo(() => diaDeHoy(ficha?.rutina, ficha?.asistencia?.total || 0), [ficha]);
  if (error) return <p className="text-xs text-rose-600 font-semibold">No se pudo cargar la ficha deportiva: {error}</p>;
  if (!ficha) return <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />;

  const { fisioterapia: f, dieta: d, rutina: r, asistencia: a } = ficha;
  const iDia = verDia ?? hoy.indice;
  const dia = r?.days?.[iDia];
  const alertas = [
    ...(ficha.restriccionesFicha && !/^sin/i.test(ficha.restriccionesFicha) ? [ficha.restriccionesFicha] : []),
    ...(f?.restriccionesSala && !/^sin restricc/i.test(f.restriccionesSala) ? [f.restriccionesSala] : []),
  ];
  const tieneLesion = !!f && ((f.zonas || []).length > 0 || Number(f.dolorEVA) > 0);

  return (
    <div className="space-y-3">
      {/* Avisos importantes arriba */}
      {(alertas.length > 0 || tieneLesion) && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-900 space-y-0.5">
            <p className="font-black">Cuidado al entrenar</p>
            {tieneLesion && (
              <p>
                Zona tratada en fisioterapia: <b>{(f.zonas || []).map((z) => NOMBRE_ZONA[z] || z).join(", ") || "—"}</b>
                {Number(f.dolorEVA) > 0 && <> · dolor {f.dolorEVA}/10</>}
                {f.tonoMuscular && f.tonoMuscular !== "normotono" && <> · tono muscular: {f.tonoMuscular}</>}
              </p>
            )}
            {alertas.map((t, i) => (
              <p key={i}>⚠️ {t}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Rutina de hoy */}
        <Bloque
          icono={Dumbbell}
          titulo="Rutina de hoy"
          color="bg-blue-50 text-blue-800"
          extra={
            r?.days?.length > 1 && (
              <div className="flex gap-1">
                {r.days.map((x, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setVerDia(i)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${i === iDia ? "bg-blue-600 text-white" : "bg-white text-blue-700 border border-blue-200"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )
          }
        >
          {!r ? (
            <p className="text-sm text-slate-500">Sin rutina asignada. Asígnale una abajo en "Rutina asignada".</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">{r.title}</p>
              <p className="text-xs text-slate-500">
                {dia?.dayName || `Día ${iDia + 1}`}
                {dia?.focus ? ` · ${dia.focus}` : ""}
                {verDia === null && hoy.motivo ? ` · le toca ${hoy.motivo}` : ""}
              </p>
              <ul className="divide-y divide-slate-100">
                {(dia?.exercises || []).map((e, i) => (
                  <li key={i} className="py-1.5 flex items-center gap-2.5 text-sm">
                    {e.thumbnailUrl ? (
                      <img src={e.thumbnailUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0" />
                    ) : (
                      <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                    )}
                    <span className="flex-1 min-w-0">
                      <b className="block truncate text-slate-800">{e.exerciseName}</b>
                      <span className="text-xs text-slate-500">
                        {e.sets} × {e.reps} {e.rir ? `· ${e.rir}` : ""} {e.restSeconds ? `· descanso ${e.restSeconds}s` : ""}
                      </span>
                    </span>
                  </li>
                ))}
                {!(dia?.exercises || []).length && <li className="py-2 text-xs text-slate-400">Este día no tiene ejercicios.</li>}
              </ul>
            </div>
          )}
        </Bloque>

        {/* Fisioterapia */}
        <Bloque icono={HeartPulse} titulo="Fisioterapia · lesiones y cuidados" color="bg-rose-50 text-rose-800" extra={f && <span className="text-[11px] font-bold">{f.sesiones} sesión(es)</span>}>
          {!f ? (
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Sin evaluaciones de fisioterapia.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-xs text-slate-500">
                Última evaluación {fCorta(f.fecha)} · {f.fisioterapeuta}
              </p>
              {f.motivo && <p><b>Motivo:</b> {f.motivo}</p>}
              <div className="flex flex-wrap gap-1.5">
                {(f.zonas || []).map((z) => (
                  <span key={z} className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">{NOMBRE_ZONA[z] || z}</span>
                ))}
                {(f.puntosGatillo || []).filter((p) => String(p).trim()).map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">Contractura: {p}</span>
                ))}
                {(f.antecedentes || []).map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">{p}</span>
                ))}
              </div>
              {f.postura?.length > 0 && <p className="text-xs text-slate-600"><b>Postura:</b> {f.postura.join(" · ")}</p>}
              {f.zonaSensible && <p className="text-xs text-slate-600"><b>Zona sensible:</b> {f.zonaSensible}</p>}
              {f.restriccionesSala && <p className="text-xs"><b>En sala:</b> {f.restriccionesSala}</p>}
              {f.indicaciones?.length > 0 && (
                <details className="group">
                  <summary className="text-xs font-bold text-rose-700 cursor-pointer flex items-center gap-1 list-none">
                    <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" /> {f.indicaciones.length} indicaciones para el alumno
                  </summary>
                  <ul className="mt-1.5 space-y-1">
                    {f.indicaciones.map((x, i) => (
                      <li key={i} className="text-xs text-slate-700">
                        • <b>{x.nombre}</b> {x.series ? `${x.series} × ${x.reps ? `${x.reps} reps` : `${x.segundos} s`}` : ""} {x.detalle ? `— ${x.detalle}` : ""}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </Bloque>

        {/* Dieta */}
        <Bloque icono={Salad} titulo="Dieta" color="bg-emerald-50 text-emerald-800">
          {!d ? (
            <p className="text-sm text-slate-500">Sin plan de alimentación activo.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="font-bold text-slate-900">{d.titulo}</p>
              <p className="text-xs text-slate-500">
                {[d.nutricionista, d.desde && `desde ${fCorta(d.desde)}`].filter(Boolean).join(" · ")}
              </p>
              {Number(d.kcal) > 0 && (
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    ["kcal", d.kcal],
                    ["Proteína", `${d.proteinas || 0} g`],
                    ["Carbos", `${d.carbohidratos || 0} g`],
                    ["Grasas", `${d.grasas || 0} g`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-emerald-50 border border-emerald-100 py-1">
                      <p className="text-[10px] font-bold uppercase text-emerald-700">{k}</p>
                      <p className="text-sm font-black text-slate-900">{v}</p>
                    </div>
                  ))}
                </div>
              )}
              <ul className="flex flex-wrap gap-1.5">
                {d.comidas.map((c, i) => (
                  <li key={i} className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <Clock className="w-3 h-3 inline mr-0.5 text-slate-400" />
                    {c.hora || "—"} · <b>{c.nombre}</b>
                  </li>
                ))}
              </ul>
              {d.recomendaciones && <p className="text-xs text-slate-600">{d.recomendaciones}</p>}
            </div>
          )}
        </Bloque>

        {/* Asistencia */}
        <Bloque icono={CalendarCheck} titulo="Asistencia" color="bg-amber-50 text-amber-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-amber-50 border border-amber-100 py-2">
              <p className="text-2xl font-black text-slate-900">{a.ultimos30}</p>
              <p className="text-[10px] font-bold uppercase text-amber-700">días en 30 días</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 py-2">
              <p className="text-2xl font-black text-slate-900">{a.total}</p>
              <p className="text-[10px] font-bold uppercase text-amber-700">días en total</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 py-2">
              <p className="text-sm font-black text-slate-900 mt-1.5">{fCorta(a.ultima)}</p>
              <p className="text-[10px] font-bold uppercase text-amber-700">último ingreso</p>
            </div>
          </div>
          {onVerCalendario && (
            <button
              type="button"
              onClick={onVerCalendario}
              className="mt-2 w-full px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold cursor-pointer"
            >
              📅 Ver calendario de asistencias y seguimiento
            </button>
          )}
        </Bloque>
      </div>
    </div>
  );
};
