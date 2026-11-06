import React, { useMemo, useState } from "react";
import { CATEGORIAS as CAT_IND, LUGARES as LUGARES_IND, textoDosis } from "../indicaciones/Indicaciones";
import { Dumbbell, HeartPulse, ListOrdered, ShieldAlert, Home, CalendarCheck } from "lucide-react";
import { useExerciseBank, ExerciseThumb, ExerciseDetail, MUSCLE_LABELS, ATRIBUCION_MEDIA } from "../routines/ExerciseBank";
import { zoneLabel } from "../physiotherapy/BodyMapVisual";
import { GuiaPorciones, VistaPlatos, platosDePlan } from "../nutrition/PlatoNutricional";

/** Recomendaciones de porciones con la mano (se ven aunque no tenga dieta) */
const RecomendacionesPorciones = ({ sexo }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
    <div>
      <h3 className="text-lg font-extrabold text-slate-900">✋ Recomendaciones: mide tus porciones con la mano</h3>
      <p className="text-sm text-slate-500">
        Tu mano siempre está contigo y es proporcional a tu cuerpo. Úsala para servirte sin balanza.
      </p>
    </div>
    <GuiaPorciones sexo={sexo} />
  </div>
);

const Vacio = ({ icon: Icon, titulo, texto }) => (
  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
    <Icon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
    <p className="text-base font-bold text-slate-800">{titulo}</p>
    <p className="text-sm text-slate-500 mt-1">{texto}</p>
  </div>
);

/* ===================== MI RUTINA ===================== */
export const MiRutina = ({ routines, memberId, assignedRoutineId }) => {
  const bank = useExerciseBank();
  const [detalle, setDetalle] = useState(null);
  const [dia, setDia] = useState(0);

  const misRutinas = useMemo(
    () =>
      routines.filter(
        (r) => String(r.id) === String(assignedRoutineId) || String(r.targetStudentId) === String(memberId),
      ),
    [routines, memberId, assignedRoutineId],
  );
  const [sel, setSel] = useState(0);
  const rutina = misRutinas[sel];

  if (!rutina)
    return (
      <Vacio
        icon={Dumbbell}
        titulo="Aún no tienes una rutina asignada"
        texto="Tu entrenador te asignará una rutina personalizada. Cuando lo haga, aparecerá aquí."
      />
    );

  const dias = rutina.days || [];
  const d = dias[Math.min(dia, dias.length - 1)];
  const buscar = (ex) => bank.find((b) => b.id === ex.exerciseId);

  return (
    <div className="space-y-5">
      {misRutinas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {misRutinas.map((r, i) => (
            <button
              key={r.id}
              onClick={() => {
                setSel(i);
                setDia(0);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer border ${
                i === sel ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300 text-slate-700"
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>
      )}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6">
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
          {rutina.level} · {rutina.objective}
        </span>
        <h2 className="text-2xl font-extrabold mt-1">{rutina.title}</h2>
        {rutina.description && <p className="text-slate-300 mt-1">{rutina.description}</p>}
        {rutina.trainerName && <p className="text-sm text-slate-400 mt-2">Entrenador: {rutina.trainerName}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {dias.map((x, i) => (
          <button
            key={i}
            onClick={() => setDia(i)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer border ${
              i === dia ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300 text-slate-700"
            }`}
          >
            {x.dayName || `Día ${i + 1}`}
          </button>
        ))}
      </div>

      {d && (
        <div className="space-y-3">
          {d.focus && <p className="text-sm text-slate-600">Enfoque: {d.focus}</p>}
          {(d.exercises || []).map((ex, i) => {
            const base = buscar(ex);
            const pasos = ex.steps || base?.steps || [];
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4">
                <button onClick={() => base && setDetalle(base)} className="shrink-0 cursor-pointer" title="Ver cómo se hace">
                  <ExerciseThumb ex={{ ...ex, name: ex.exerciseName }} alwaysGif className="w-28 h-28 rounded-xl border border-slate-200" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 font-bold">{i + 1}.</span>
                    <h4 className="text-base font-extrabold text-slate-900">{ex.exerciseName}</h4>
                    <span className="text-xs font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {MUSCLE_LABELS[ex.muscleGroup] || ex.muscleGroup}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    {[
                      ["Series", ex.sets],
                      ["Repeticiones", ex.reps],
                      ["Descanso", `${ex.restSeconds || 0} s`],
                      ["Esfuerzo", ex.rir || "—"],
                    ].map(([t, v]) => (
                      <div key={t} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                        <span className="block text-xs text-slate-500">{t}</span>
                        <span className="text-base font-black text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                  {ex.notes && (
                    <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Indicación de tu entrenador: {ex.notes}
                    </p>
                  )}
                  {pasos.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm font-semibold text-blue-700 cursor-pointer flex items-center gap-1">
                        <ListOrdered className="w-4 h-4" /> Cómo se hace ({pasos.length} pasos)
                      </summary>
                      <ol className="mt-2 space-y-1 list-decimal list-inside text-sm text-slate-700">
                        {pasos.map((p, k) => (
                          <li key={k}>{p}</li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-slate-400 text-center">{ATRIBUCION_MEDIA}</p>
        </div>
      )}
      {detalle && <ExerciseDetail ex={detalle} onClose={() => setDetalle(null)} />}
    </div>
  );
};

/* ===================== MI PLAN DE ALIMENTACIÓN ===================== */
export const MiDieta = ({ plan, sexo }) => {
  if (!plan)
    return (
      <div className="space-y-5">
        <Vacio
          icon={Dumbbell}
          titulo="Aún no tienes un plan de alimentación"
          texto="Cuando tu nutricionista te asigne un plan, lo verás aquí con tu plato, tus comidas y porciones."
        />
        <RecomendacionesPorciones sexo={sexo} />
      </div>
    );
  const platos = platosDePlan(plan, sexo);
  const macros = [
    ["Calorías", `${plan.dailyCaloriesTarget || 0} kcal`, "text-slate-900"],
    ["Proteínas", `${plan.proteinsTargetGrams || 0} g`, "text-blue-700"],
    ["Carbohidratos", `${plan.carbsTargetGrams || 0} g`, "text-amber-700"],
    ["Grasas", `${plan.fatsTargetGrams || 0} g`, "text-rose-700"],
    ["Agua", `${plan.waterLitersTarget || 0} L`, "text-cyan-700"],
  ];
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-6">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">Tu plan de alimentación</span>
        <h2 className="text-2xl font-extrabold mt-1">{plan.title}</h2>
        {plan.trainerName && <p className="text-sm text-emerald-100 mt-1">Responsable: {plan.trainerName}</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {macros.map(([t, v, c]) => (
          <div key={t} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <span className="block text-xs text-slate-500">{t}</span>
            <span className={`text-xl font-black ${c}`}>{v}</span>
          </div>
        ))}
      </div>
      {/* Tus platos (gráficos) */}
      {platos.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-lg font-extrabold text-slate-900">🍽️ Así se ven tus platos</h3>
          <p className="text-sm text-slate-500 mb-4">Tu nutricionista te asignó {platos.length} plato{platos.length === 1 ? "" : "s"}. Toca cada uno para ver cómo servirlo.</p>
          <VistaPlatos plates={platos} metas={{ proteinas: plan.proteinsTargetGrams, carbohidratos: plan.carbsTargetGrams, grasas: plan.fatsTargetGrams }} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(plan.meals || []).map((meal) => (
          <div key={meal.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-extrabold text-slate-900">
                {meal.name} <span className="text-sm text-slate-400 font-mono">{meal.time}</span>
              </h4>
              <span className="text-sm font-black text-emerald-700">{meal.totalCalories || 0} kcal</span>
            </div>
            {(meal.items || []).length === 0 ? (
              <p className="text-sm text-slate-400">Sin alimentos indicados.</p>
            ) : (
              <ul className="space-y-1.5">
                {meal.items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3 text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="font-semibold text-slate-800">
                      {it.emoji ? <span className="mr-1.5">{it.emoji}</span> : null}
                      {it.name}
                    </span>
                    <span className="font-mono text-slate-600 shrink-0">
                      {it.portion} · {it.calories} kcal
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      {(plan.supplements?.length > 0 || plan.hydrationGuidelines || plan.recommendations) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 text-sm text-slate-700">
          {plan.supplements?.length > 0 && (
            <p>
              <b>Suplementos:</b> {plan.supplements.join(", ")}
            </p>
          )}
          {plan.hydrationGuidelines && (
            <p>
              <b>Hidratación:</b> {plan.hydrationGuidelines}
            </p>
          )}
          {plan.recommendations && (
            <p>
              <b>Recomendaciones:</b> {plan.recommendations}
            </p>
          )}
        </div>
      )}
      <RecomendacionesPorciones sexo={sexo} />
    </div>
  );
};

/* ===================== MI FISIOTERAPIA ===================== */
export const MiFisioterapia = ({ records }) => {
  const lista = useMemo(
    () => [...records].sort((a, b) => `${b.date}`.localeCompare(`${a.date}`)),
    [records],
  );
  if (!lista.length)
    return (
      <Vacio
        icon={HeartPulse}
        titulo="No tienes evaluaciones de fisioterapia"
        texto="Cuando el fisioterapeuta registre una evaluación, verás aquí sus indicaciones y tus ejercicios."
      />
    );
  return (
    <div className="space-y-4">
      {lista.map((r) => {
        const ejercicios = r.exerciseDosage?.customExercises || [];
        return (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-700 to-indigo-800 text-white px-5 py-4 flex flex-wrap justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-200">
                  Sesión {r.sessionNumber || ""} · {r.date}
                </span>
                <h3 className="text-lg font-extrabold">{r.consultationReason}</h3>
                <p className="text-sm text-cyan-100">Fisioterapeuta: {r.physiotherapistName}</p>
              </div>
              <span className="self-start text-sm font-black bg-white/15 rounded-lg px-3 py-1.5">
                Dolor: {r.painLevelEVA ?? "—"}/10
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {(r.affectedZones || [r.affectedZone]).filter(Boolean).map((z) => (
                  <span key={z} className="text-sm font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {zoneLabel(z, r.affectedZoneSides?.[z])}
                  </span>
                ))}
              </div>
              {r.patientFriendlySummary && (
                <p className="text-[0.95rem] text-slate-700 leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-4">
                  {r.patientFriendlySummary}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {r.gymWorkoutRestrictions && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                    <span className="font-bold flex items-center gap-1.5 mb-1">
                      <ShieldAlert className="w-4 h-4" /> En el gimnasio
                    </span>
                    {r.gymWorkoutRestrictions}
                  </div>
                )}
                {r.homeIndications && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <span className="font-bold flex items-center gap-1.5 mb-1">
                      <Home className="w-4 h-4" /> En casa
                    </span>
                    {r.homeIndications}
                  </div>
                )}
              </div>
              {(r.studentIndications || []).length > 0 && (
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 mb-2">Tus indicaciones</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {Object.entries(LUGARES_IND).map(([k, L]) => {
                      const l = r.studentIndications.filter((i) => i.place === k);
                      if (!l.length) return null;
                      return (
                        <div key={k} className="rounded-xl border border-slate-200 p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{L.label}</p>
                          {l.map((i, n) => (
                            <p key={n} className="text-sm text-slate-700 flex justify-between gap-2">
                              <span>{CAT_IND[i.category]?.emoji} {i.name}</span>
                              <b className="whitespace-nowrap">{textoDosis(i)}</b>
                            </p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {ejercicios.length > 0 && (
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 mb-2">
                    Tus ejercicios ({r.exerciseDosage?.customCardFrequency || ""})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ejercicios.map((e, n) => (
                      <div key={e.id} className="rounded-xl border border-slate-200 p-3 text-sm flex gap-3">
                        <div className="w-24 h-24 shrink-0 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                          {e.imageUrl ? (
                            <a href={e.imageUrl} target="_blank" rel="noreferrer" title="Ver imagen grande">
                              <img src={e.imageUrl} alt={e.name} className="w-24 h-24 object-contain" loading="lazy" />
                            </a>
                          ) : (
                            <span className="text-2xl font-black text-slate-300">{n + 1}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900">{e.name}</p>
                          <p className="text-slate-600">
                            <b>{e.series} × {e.repsOrTime}</b> · descanso {e.restSeconds}s
                          </p>
                          {e.techniqueTips && <p className="text-slate-500 mt-1">{e.techniqueTips}</p>}
                          {(e.commentsWithImages || []).filter((p) => p.comment || p.imageUrl).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {e.commentsWithImages.filter((p) => p.comment || p.imageUrl).map((p) => (
                                <div key={p.id} className="flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 p-1 pr-2 max-w-full">
                                  {p.imageUrl && (
                                    <a href={p.imageUrl} target="_blank" rel="noreferrer">
                                      <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                                    </a>
                                  )}
                                  <span className="text-xs text-slate-600">{p.comment}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.nextAppointmentDate && (
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-blue-600" /> Próximo control: {r.nextAppointmentDate}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
