// Ejercicios terapéuticos de la sesión (fisioterapia)
// Cada ejercicio con su imagen: del banco de ejercicios (animación), subida desde la PC/celular
// o pegando un enlace. La imagen se puede copiar (enlace) o descargar. El alumno lo ve en su portal.
import React, { useRef, useState } from "react";
import { Check, Copy, Download, Dumbbell, ImagePlus, Link2, Plus, Trash2, Upload, X } from "lucide-react";
import { ExercisePicker, useExerciseBank, MUSCLE_LABELS } from "../routines/ExerciseBank";
import { subirImagen, copiarEnlace, descargarImagen } from "../../utils/imagenes";

// Se mantiene por compatibilidad con evaluaciones antiguas (ya no se ofrece)
export const CLINICAL_EXERCISE_IMAGE_PRESETS = [];

const FRECUENCIAS = ["Diario", "5 veces por semana", "3 veces por semana", "2 veces por semana", "Solo en la sesión"];
const REPS = ["8 reps", "10 reps", "12 reps", "15 reps", "20 reps", "20 seg", "30 seg", "45 seg", "60 seg"];
const DESCANSOS = [30, 45, 60, 90];
const INP = "w-full text-sm px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500";

/** Herramientas de una imagen: subir, enlace, copiar, descargar, quitar */
function HerramientasImagen({ url, nombre, onChange, carpeta = "ejercicios", compacto = false, readOnly }) {
  const archivo = useRef(null);
  const [estado, setEstado] = useState("");
  const [pegar, setPegar] = useState(false);
  const [enlace, setEnlace] = useState("");
  const avisar = (t) => {
    setEstado(t);
    setTimeout(() => setEstado(""), 1800);
  };
  const subir = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setEstado("Subiendo…");
    try {
      onChange(await subirImagen(f, carpeta));
      avisar("✓ Imagen subida");
    } catch (er) {
      setEstado(er.message);
    }
  };
  const boton = "px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer";
  if (readOnly) return null;
  return (
    <div className="space-y-1">
      <div className={`flex flex-wrap gap-1 ${compacto ? "" : "justify-center"}`}>
        <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={subir} />
        <button type="button" onClick={() => archivo.current?.click()} className={boton} title="Subir desde la PC o el celular">
          <Upload className="w-3 h-3" /> Subir
        </button>
        <button type="button" onClick={() => setPegar((v) => !v)} className={boton} title="Pegar un enlace de imagen">
          <Link2 className="w-3 h-3" /> Enlace
        </button>
        {url && (
          <>
            <button type="button" onClick={async () => { try { await copiarEnlace(url); avisar("✓ Enlace copiado"); } catch { avisar("No se pudo copiar"); } }} className={boton} title="Copiar el enlace de la imagen">
              <Copy className="w-3 h-3" /> Copiar
            </button>
            <button type="button" onClick={() => descargarImagen(url, nombre)} className={boton} title="Descargar la imagen">
              <Download className="w-3 h-3" /> Bajar
            </button>
            <button type="button" onClick={() => onChange("")} className={`${boton} hover:!text-rose-600 hover:!border-rose-300`} title="Quitar imagen">
              <X className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
      {pegar && (
        <div className="flex gap-1">
          <input value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://…" className={`${INP} !py-1 text-xs`} />
          <button
            type="button"
            onClick={() => {
              if (/^(https?:\/\/|\/uploads\/)/.test(enlace.trim())) {
                onChange(enlace.trim());
                setEnlace("");
                setPegar(false);
              } else avisar("Pega un enlace que empiece con https://");
            }}
            className="px-2 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer"
          >
            OK
          </button>
        </div>
      )}
      {estado && <p className="text-[11px] text-slate-500 text-center">{estado}</p>}
    </div>
  );
}

export const ExercisePrescriptionCard = ({
  exercises = [],
  onChange,
  cardTitle,
  onCardTitleChange,
  cardFrequency,
  onCardFrequencyChange,
  readOnly = false,
}) => {
  const banco = useExerciseBank();
  const [verBanco, setVerBanco] = useState(false);
  const [cambiarImagenDe, setCambiarImagenDe] = useState(null);

  const actualizar = (i, campo, valor) => {
    if (readOnly) return;
    const lista = [...exercises];
    lista[i] = { ...lista[i], [campo]: valor };
    onChange(lista);
  };
  const quitar = (id) => !readOnly && onChange(exercises.filter((e) => e.id !== id));
  const mover = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= exercises.length) return;
    const lista = [...exercises];
    [lista[i], lista[j]] = [lista[j], lista[i]];
    onChange(lista);
  };
  const nuevo = (base = {}) => ({
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "",
    series: 3,
    repsOrTime: "10 reps",
    restSeconds: 45,
    targetZone: "",
    techniqueTips: "",
    imageUrl: "",
    commentsWithImages: [],
    ...base,
  });
  const agregarDelBanco = (ex) => {
    if (cambiarImagenDe != null) {
      actualizar(cambiarImagenDe, "imageUrl", ex.gifUrl || ex.thumbnailUrl || "");
      setCambiarImagenDe(null);
      setVerBanco(false);
      return;
    }
    onChange([
      ...exercises,
      nuevo({ name: ex.name, imageUrl: ex.gifUrl || ex.thumbnailUrl || "", targetZone: MUSCLE_LABELS[ex.muscleGroup] || "", bankId: ex.id }),
    ]);
  };

  const pautas = (i) => exercises[i].commentsWithImages || [];
  const setPautas = (i, lista) => actualizar(i, "commentsWithImages", lista);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
      {/* Cabecera */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[220px]">
          <span className="block text-xs font-bold text-slate-600 mb-1">Nombre de la rutina terapéutica</span>
          <input disabled={readOnly} value={cardTitle || ""} onChange={(e) => onCardTitleChange?.(e.target.value)} placeholder="Ej. Estabilidad lumbar fase 1" className={INP} />
        </label>
        <div>
          <span className="block text-xs font-bold text-slate-600 mb-1">Frecuencia</span>
          <div className="flex flex-wrap gap-1">
            {FRECUENCIAS.map((f) => (
              <button
                key={f}
                type="button"
                disabled={readOnly}
                onClick={() => onCardFrequencyChange?.(f)}
                className={`px-2.5 py-1 rounded-full border text-xs font-semibold cursor-pointer ${cardFrequency === f ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setCambiarImagenDe(null); setVerBanco((v) => !v); }} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer">
            <Dumbbell className="w-4 h-4" /> {verBanco && cambiarImagenDe == null ? "Cerrar banco" : `Agregar del banco (${banco.length})`}
          </button>
          <button type="button" onClick={() => onChange([...exercises, nuevo()])} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-50">
            <Plus className="w-4 h-4" /> Ejercicio propio
          </button>
        </div>
      )}

      {verBanco && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-3">
          {cambiarImagenDe != null && (
            <p className="text-xs font-semibold text-blue-800 mb-2">
              Elige la imagen para «{exercises[cambiarImagenDe]?.name || "ejercicio"}»
              <button type="button" onClick={() => { setCambiarImagenDe(null); setVerBanco(false); }} className="ml-2 underline cursor-pointer">cancelar</button>
            </p>
          )}
          <ExercisePicker exercises={banco} onPick={agregarDelBanco} picked={exercises.map((e) => e.bankId).filter(Boolean)} />
        </div>
      )}

      {exercises.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-200 rounded-xl">
          Sin ejercicios. Agrégalos del banco (con animación) o crea uno propio con tu foto.
        </p>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={ex.id} className="rounded-2xl border border-slate-200 p-3 grid grid-cols-1 md:grid-cols-[150px_1fr] gap-3">
              {/* Imagen */}
              <div className="space-y-1.5">
                <div className="relative aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                  <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  {ex.imageUrl ? (
                    <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-contain" loading="lazy" />
                  ) : (
                    <ImagePlus className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                {!readOnly && (
                  <button type="button" onClick={() => { setCambiarImagenDe(i); setVerBanco(true); }} className="w-full text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">
                    Elegir del banco
                  </button>
                )}
                <HerramientasImagen url={ex.imageUrl} nombre={ex.name} onChange={(u) => actualizar(i, "imageUrl", u)} readOnly={readOnly} />
              </div>

              {/* Datos */}
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <input disabled={readOnly} value={ex.name} onChange={(e) => actualizar(i, "name", e.target.value)} placeholder="Nombre del ejercicio" className={`${INP} font-bold`} />
                  {!readOnly && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button type="button" onClick={() => mover(i, -1)} className="px-1.5 py-1 text-slate-400 hover:text-slate-800 cursor-pointer" title="Subir">↑</button>
                      <button type="button" onClick={() => mover(i, 1)} className="px-1.5 py-1 text-slate-400 hover:text-slate-800 cursor-pointer" title="Bajar">↓</button>
                      <button type="button" onClick={() => quitar(ex.id)} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer" title="Quitar ejercicio">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-[90px_1fr_1fr_1fr] gap-2">
                  <label>
                    <span className="block text-[11px] font-bold text-slate-500">Series</span>
                    <input disabled={readOnly} type="number" min="1" max="10" value={ex.series ?? ""} onChange={(e) => actualizar(i, "series", Number(e.target.value))} className={INP} />
                  </label>
                  <label>
                    <span className="block text-[11px] font-bold text-slate-500">Repeticiones o tiempo</span>
                    <input disabled={readOnly} value={ex.repsOrTime || ""} onChange={(e) => actualizar(i, "repsOrTime", e.target.value)} placeholder="10 reps / 30 seg" className={INP} list={`reps-${ex.id}`} />
                    <datalist id={`reps-${ex.id}`}>{REPS.map((r) => <option key={r} value={r} />)}</datalist>
                  </label>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500">Descanso</span>
                    <div className="flex gap-1">
                      {DESCANSOS.map((d) => (
                        <button key={d} type="button" disabled={readOnly} onClick={() => actualizar(i, "restSeconds", d)} className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${Number(ex.restSeconds) === d ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    <span className="block text-[11px] font-bold text-slate-500">Zona</span>
                    <input disabled={readOnly} value={ex.targetZone || ""} onChange={(e) => actualizar(i, "targetZone", e.target.value)} placeholder="Ej. Lumbar" className={INP} />
                  </label>
                </div>
                <label className="block">
                  <span className="block text-[11px] font-bold text-slate-500">Cómo hacerlo (lo verá el alumno)</span>
                  <textarea disabled={readOnly} rows={2} value={ex.techniqueTips || ""} onChange={(e) => actualizar(i, "techniqueTips", e.target.value)} placeholder="Ej. Respira lento, sin dolor; mantén la espalda neutra." className={INP} />
                </label>

                {/* Pautas con imagen */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">Pautas con imagen ({pautas(i).length}) · ej. posición de pies, ángulo del brazo</span>
                    {!readOnly && (
                      <button type="button" onClick={() => setPautas(i, [...pautas(i), { id: `p-${Date.now()}`, comment: "", imageUrl: "" }])} className="text-[11px] font-bold text-blue-700 flex items-center gap-0.5 cursor-pointer">
                        <Plus className="w-3 h-3" /> Agregar
                      </button>
                    )}
                  </div>
                  {pautas(i).map((p, k) => (
                    <div key={p.id} className="flex gap-2 items-start bg-white rounded-lg border border-slate-200 p-2">
                      <div className="w-20 shrink-0 space-y-1">
                        <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-5 h-5 text-slate-300" />}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <textarea disabled={readOnly} rows={2} value={p.comment || ""} onChange={(e) => setPautas(i, pautas(i).map((x, z) => (z === k ? { ...x, comment: e.target.value } : x)))} placeholder="Ej. Pies a la anchura de la cadera, rodillas alineadas" className={`${INP} text-xs`} />
                        <HerramientasImagen compacto carpeta="pautas" url={p.imageUrl} nombre={`${ex.name}-pauta-${k + 1}`} readOnly={readOnly} onChange={(u) => setPautas(i, pautas(i).map((x, z) => (z === k ? { ...x, imageUrl: u } : x)))} />
                      </div>
                      {!readOnly && (
                        <button type="button" onClick={() => setPautas(i, pautas(i).filter((_, z) => z !== k))} className="text-slate-300 hover:text-rose-600 cursor-pointer" title="Quitar pauta">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {exercises.length > 0 && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Check className="w-3.5 h-3.5 text-emerald-600" /> El alumno verá estos ejercicios con sus imágenes en su portal (Mi Fisioterapia).
        </p>
      )}
    </div>
  );
};
