import React from "react";
import { Activity } from "lucide-react";

export const DEFAULT_WILLIAMS_EXERCISES = [
  {
    id: "williams-1",
    number: 1,
    name: "1. Pelvic Tilt (Inclinación / Retroversión Pélvica)",
    description:
      "Decúbito supino, rodillas dobladas. Aplanar la columna lumbar contra la camilla activando abdomen y glúteos.",
    executionStatus: "correcto_sin_dolor",
    painEVA: 1,
    repetitionsOrHold: "10 contracciones de 5 seg",
    clinicalComment:
      "Buena activación del transverso abdominal sin compensación de cuello.",
  },
  {
    id: "williams-2",
    number: 2,
    name: "2. Rodilla Simple al Pecho (Single Knee to Chest)",
    description:
      "Flexión unamipodal hacia el tórax sujetando detrás del muslo. Evalúa flexibilidad de glúteo mayor y fascia lumbar.",
    executionStatus: "correcto_sin_dolor",
    painEVA: 2,
    repetitionsOrHold: "3 repeticiones de 20 seg por pierna",
    clinicalComment:
      "Alivio notable de la tensión paravertebral en la descarga.",
  },
  {
    id: "williams-3",
    number: 3,
    name: "3. Rodillas Dobles al Pecho (Double Knee to Chest)",
    description:
      "Ambas rodillas llevadas al pecho simultáneamente. Provoca máxima apertura foraminal lumbosacra.",
    executionStatus: "molestia_leve",
    painEVA: 3,
    repetitionsOrHold: "3 repeticiones de 20 seg",
    clinicalComment:
      "Molestia leve al final del arco por acortamiento de glúteos.",
  },
  {
    id: "williams-4",
    number: 4,
    name: "4. Flexión Parcial de Tronco (Crunch Abdominal Modificado)",
    description:
      "Despegue escapular con rodillas dobladas. Fortalece pared abdominal anterior sin sobrecargar el psoas.",
    executionStatus: "correcto_sin_dolor",
    painEVA: 1,
    repetitionsOrHold: "2 series de 10 repeticiones",
    clinicalComment: "Fuerza abdominal adecuada, mantiene pelvis estable.",
  },
  {
    id: "williams-5",
    number: 5,
    name: "5. Estiramiento Isquiotibial en Sedente (Hamstring Stretch)",
    description:
      "Sedente con rodillas extendidas, flexión anterior de tronco. Mide flexibilidad de cadena miofascial posterior.",
    executionStatus: "molestia_leve",
    painEVA: 4,
    repetitionsOrHold: "3 repeticiones de 15 seg",
    clinicalComment:
      "Tirantez en tercio medio de isquiotibiales con distancia dedos-planta de 12 cm.",
  },
  {
    id: "williams-6",
    number: 6,
    name: "6. Estiramiento de Flexores de Cadera / Zancada (Hip Flexor Stretch)",
    description:
      "Posición de caballero o zancada baja, retroversión pélvica para elongar el psoas-ilíaco y recto anterior.",
    executionStatus: "correcto_sin_dolor",
    painEVA: 2,
    repetitionsOrHold: "3 repeticiones de 20 seg por lado",
    clinicalComment:
      "Disminuye la anteversión forzada y descomprime charnela lumbosacra.",
  },
];

// SVG Drawings for each Williams exercise
export const WilliamsExerciseSVG = ({ exerciseNumber }) => {
  switch (exerciseNumber) {
    case 1:
      // Pelvic Tilt
      return (
        <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
          <rect width="100" height="60" rx="8" fill="#0f172a" />
          <line
            x1="10"
            y1="48"
            x2="90"
            y2="48"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Supine body */}
          <circle cx="22" cy="40" r="5" fill="#38bdf8" />
          <path d="M26 44 L50 46" stroke="#38bdf8" strokeWidth="3" />
          {/* Bent knees */}
          <path
            d="M50 46 L64 28 L76 48"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Pelvis flat arrow down */}
          <path
            d="M46 38 L46 45"
            stroke="#22c55e"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
        </svg>
      );
    case 2:
      // Single knee to chest
      return (
        <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
          <rect width="100" height="60" rx="8" fill="#0f172a" />
          <line
            x1="10"
            y1="48"
            x2="90"
            y2="48"
            stroke="#334155"
            strokeWidth="2"
          />
          <circle cx="20" cy="40" r="5" fill="#38bdf8" />
          <line
            x1="24"
            y1="44"
            x2="48"
            y2="46"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          {/* One leg flat, one bent to chest */}
          <line
            x1="48"
            y1="46"
            x2="80"
            y2="48"
            stroke="#64748b"
            strokeWidth="2.5"
          />
          <path
            d="M48 46 L42 26 L52 24"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Arm holding knee */}
          <path
            d="M30 42 L48 26"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        </svg>
      );
    case 3:
      // Double knee to chest
      return (
        <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
          <rect width="100" height="60" rx="8" fill="#0f172a" />
          <line
            x1="10"
            y1="48"
            x2="90"
            y2="48"
            stroke="#334155"
            strokeWidth="2"
          />
          <circle cx="20" cy="40" r="5" fill="#38bdf8" />
          <line
            x1="24"
            y1="44"
            x2="44"
            y2="46"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          {/* Both knees bent to chest */}
          <path
            d="M44 46 L38 24 L50 22"
            stroke="#a855f7"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path d="M28 42 L44 24" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      );
    case 4:
      // Partial crunch
      return (
        <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
          <rect width="100" height="60" rx="8" fill="#0f172a" />
          <line
            x1="10"
            y1="48"
            x2="90"
            y2="48"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Torso curled up */}
          <circle cx="26" cy="30" r="5" fill="#38bdf8" />
          <path
            d="M28 34 C36 40, 44 46, 52 46"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          <path
            d="M52 46 L66 28 L78 48"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M32 34 L54 32" stroke="#22c55e" strokeWidth="2" />
        </svg>
      );
    case 5:
      // Hamstring stretch
      return (
        <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
          <rect width="100" height="60" rx="8" fill="#0f172a" />
          <line
            x1="10"
            y1="48"
            x2="90"
            y2="48"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Sitting folded */}
          <path d="M30 48 L78 48" stroke="#38bdf8" strokeWidth="3.5" />
          <circle cx="44" cy="28" r="5" fill="#38bdf8" />
          <path d="M30 48 L42 32 L68 44" stroke="#f59e0b" strokeWidth="3" />
        </svg>
      );
    case 6:
    default:
      // Hip flexor lunge
      return (
        <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
          <rect width="100" height="60" rx="8" fill="#0f172a" />
          <line
            x1="10"
            y1="48"
            x2="90"
            y2="48"
            stroke="#334155"
            strokeWidth="2"
          />
          {/* Lunge position */}
          <circle cx="48" cy="22" r="5" fill="#38bdf8" />
          <line
            x1="48"
            y1="27"
            x2="48"
            y2="40"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          {/* Front leg */}
          <path
            d="M48 40 L64 40 L64 48"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Back leg knee down */}
          <path
            d="M48 40 L34 44 L24 48"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
  }
};

export const WilliamsVisuals = ({
  williamsEval,
  onChange,
  readOnly = false,
}) => {
  const current = williamsEval || {
    enabled: true,
    overallTolerance: "buena",
    summaryNotes:
      "Protocolo de flexión de Williams completado con tolerancia adecuada y alivio de sobrecarga lumbar.",
    exercises: DEFAULT_WILLIAMS_EXERCISES,
  };

  const handleUpdateExercise = (index, field, value) => {
    if (!onChange) return;
    const updated = [...current.exercises];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange({
      ...current,
      exercises: updated,
    });
  };

  const handleUpdateOverall = (field, value) => {
    if (!onChange) return;
    onChange({
      ...current,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-indigo-900/40 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span>
                Evaluación Funcional de Williams (Columna Lumbo-Sacra)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                6 Ejercicios de Flexión
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Protocolo estándar de oro para lumbalgia, hiperlordosis y
              descompresión de carillas articulares.
            </p>
          </div>
        </div>

        {/* Overall Tolerance Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">
            Tolerancia Global:
          </span>
          <select
            disabled={readOnly}
            value={current.overallTolerance}
            onChange={(e) =>
              handleUpdateOverall("overallTolerance", e.target.value)
            }
            className="bg-slate-950 border border-indigo-500/40 text-indigo-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
          >
            <option value="excelente">Excelente (Sin Dolor)</option>
            <option value="buena">Buena (Molestia Mínima)</option>
            <option value="regular_con_molestia">
              Regular (Dolor Moderado)
            </option>
            <option value="deficiente_dolorosa">
              Deficiente (Dolor Severo)
            </option>
          </select>
        </div>
      </div>

      {/* Grid of 6 Williams Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {current.exercises.map((item, idx) => {
          const statusColors = {
            correcto_sin_dolor:
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
            molestia_leve: "bg-amber-500/10 border-amber-500/30 text-amber-300",
            dolor_limitante: "bg-rose-500/10 border-rose-500/30 text-rose-300",
            contraindicado:
              "bg-purple-500/10 border-purple-500/30 text-purple-300",
          };

          return (
            <div
              key={item.id}
              className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                      {item.number}
                    </span>
                    <h5 className="text-xs font-extrabold text-white line-clamp-1">
                      {item.name}
                    </h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <WilliamsExerciseSVG exerciseNumber={item.number} />
                </div>
              </div>

              {/* Status and EVA row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Respuesta / Ejecución:
                  </label>
                  <select
                    disabled={readOnly}
                    value={item.executionStatus}
                    onChange={(e) =>
                      handleUpdateExercise(
                        idx,
                        "executionStatus",
                        e.target.value,
                      )
                    }
                    className={`w-full p-1.5 rounded-lg text-xs font-bold border ${statusColors[item.executionStatus]} bg-slate-900`}
                  >
                    <option value="correcto_sin_dolor">
                      Aprobado / Sin Dolor
                    </option>
                    <option value="molestia_leve">
                      Molestia Leve (Tolerable)
                    </option>
                    <option value="dolor_limitante">
                      Dolor Punzante / Limitante
                    </option>
                    <option value="contraindicado">
                      Contraindicado / No Evaluar
                    </option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 uppercase">
                      Dolor EVA:
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {item.painEVA}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    disabled={readOnly}
                    value={item.painEVA}
                    onChange={(e) =>
                      handleUpdateExercise(
                        idx,
                        "painEVA",
                        Number(e.target.value),
                      )
                    }
                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Clinical comment input */}
              <div className="space-y-1">
                <input
                  type="text"
                  disabled={readOnly}
                  value={item.clinicalComment}
                  onChange={(e) =>
                    handleUpdateExercise(idx, "clinicalComment", e.target.value)
                  }
                  placeholder="Observación clínica del ejercicio..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Notes */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800">
        <label className="text-xs font-bold text-slate-300 uppercase block">
          Conclusión & Prescripción del Protocolo de Williams:
        </label>
        <textarea
          disabled={readOnly}
          rows={2}
          value={current.summaryNotes}
          onChange={(e) => handleUpdateOverall("summaryNotes", e.target.value)}
          placeholder="Resumen del protocolo Williams y recomendaciones para la rutina de fortalecimiento..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white placeholder-slate-500"
        />
      </div>
    </div>
  );
};
