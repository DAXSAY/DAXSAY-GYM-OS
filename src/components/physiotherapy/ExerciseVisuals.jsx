import React from "react";
import { Dumbbell, Plus, Trash2, CheckCircle2 } from "lucide-react";

export const PRESET_EXERCISES_WITH_VISUALS = [
  {
    id: "ex-vis-1",
    name: "Gato-Camello (Cat-Camel) de Movilidad Raquídea",
    type: "movilidad",
    targetZone: "Columna Lumbar & Torácica",
    series: 3,
    repsOrTime: "10 repeticiones lentas",
    restSeconds: 45,
    techniqueTips:
      "Movimiento ondulatorio vértebra por vértebra, sincronizado con la respiración.",
    categoryTag: "Movilidad Activa",
  },
  {
    id: "ex-vis-2",
    name: "Puente de Glúteo Bipodal con Pausa Isométrica",
    type: "cadena_posterior",
    targetZone: "Glúteo Mayor & Estabilidad Lumbar",
    series: 4,
    repsOrTime: "12 repeticiones (3s arriba)",
    restSeconds: 60,
    techniqueTips:
      "Empujar desde los talones, activar abdomen profundo sin arquear la zona lumbar.",
    categoryTag: "Fuerza Terapéutica",
  },
  {
    id: "ex-vis-3",
    name: "Rotación Externa de Hombro con Banda Elástica",
    type: "hombro",
    targetZone: "Manguito Rotador (Infraespinoso)",
    series: 3,
    repsOrTime: "15 repeticiones controladas",
    restSeconds: 45,
    techniqueTips:
      "Mantener codo pegado al costado a 90° con toalla enrollada entre codo y tronco.",
    categoryTag: "Rehabilitación Manguito",
  },
  {
    id: "ex-vis-4",
    name: "Extensión Isométrica de Cuádriceps (Knee Setting)",
    type: "rodilla",
    targetZone: "Vasto Medial & Cuádriceps",
    series: 4,
    repsOrTime: "10 contracciones de 6 seg",
    restSeconds: 45,
    techniqueTips:
      "Empujar el hueco poplíteo contra el rulo comprimiendo firmemente la rótula.",
    categoryTag: "Isometría Rodilla",
  },
  {
    id: "ex-vis-5",
    name: "Deadbug con Control Lumbo-Pélvico",
    type: "core",
    targetZone: "Transverso Abdominal & Multífidos",
    series: 3,
    repsOrTime: "8 repeticiones por lado",
    restSeconds: 60,
    techniqueTips:
      "Evitar despegue de la zona lumbar del suelo al descender brazo y pierna opuesta.",
    categoryTag: "Estabilidad Core",
  },
  {
    id: "ex-vis-6",
    name: "Clamshell (Ostra) con Miniband en Rodillas",
    type: "cadera",
    targetZone: "Glúteo Medio & Rotadores Cadera",
    series: 4,
    repsOrTime: "12 repeticiones por pierna",
    restSeconds: 45,
    techniqueTips:
      "Mantener talones en contacto constante sin dejar caer la pelvis hacia atrás.",
    categoryTag: "Estabilidad Pélvica",
  },
  {
    id: "ex-vis-7",
    name: "Apoyo Monopodal sobre Base Inestable / Bosu",
    type: "propiocepcion",
    targetZone: "Propiocepción de Tobillo y Rodilla",
    series: 3,
    repsOrTime: "30 seg por pierna",
    restSeconds: 45,
    techniqueTips:
      "Microajustes reactivos manteniendo mirada al frente y rodilla semidoblada a 15°.",
    categoryTag: "Propiocepción",
  },
  {
    id: "ex-vis-8",
    name: "Estabilización de Mirada VOR (Reflejo Vestíbulo-Ocular)",
    type: "vestibular",
    targetZone: "Control Cervico-Ocular & Vestíbulo",
    series: 3,
    repsOrTime: "45 seg continuos",
    restSeconds: 30,
    techniqueTips:
      "Fijar vista en el pulgar mientras se gira la cabeza suavemente en plano horizontal.",
    categoryTag: "Vestibular",
  },
  {
    id: "ex-vis-9",
    name: "Péndulo de Codman para Descompresión de Hombro",
    type: "hombro",
    targetZone: "Articulación Glenohumeral Pasiva",
    series: 3,
    repsOrTime: "1 minuto de balanceo suave",
    restSeconds: 30,
    techniqueTips:
      "Tronco inclinado hacia adelante dejando colgar el brazo por gravedad sin fuerza activa.",
    categoryTag: "Movilidad Pasiva",
  },
  {
    id: "ex-vis-10",
    name: "Saltos Reactivos Asistidos / Potencia Controlada",
    type: "potencia",
    targetZone: "Cadena Extensora & Reactividad",
    series: 3,
    repsOrTime: "6 repeticiones bipodales",
    restSeconds: 90,
    techniqueTips:
      "Aterrizaje suave en punta-talón amortiguando impacto con flexión profunda de rodillas.",
    categoryTag: "Potencia / Retorno",
  },
];

export const ExerciseVectorDrawing = ({ type }) => {
  switch (type) {
    case "movilidad": // Cat camel
      return (
        <svg
          viewBox="0 0 140 80"
          className="w-full h-20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="10"
            y1="72"
            x2="130"
            y2="72"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {/* Hands and knees on ground */}
          <line
            x1="32"
            y1="48"
            x2="32"
            y2="72"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="102"
            y1="52"
            x2="102"
            y2="72"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Arched Spine Cat Camel */}
          <path
            d="M32 48 Q67 24 102 52"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Head looking down */}
          <circle cx="20" cy="54" r="8" fill="#0284c7" />
          {/* Flow movement arrows */}
          <path
            d="M67 36 L67 26"
            stroke="#22c55e"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
          <path
            d="M67 44 L67 54"
            stroke="#eab308"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
        </svg>
      );

    case "cadena_posterior": // Glute bridge
      return (
        <svg
          viewBox="0 0 140 80"
          className="w-full h-20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="10"
            y1="72"
            x2="130"
            y2="72"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {/* Upper back on ground */}
          <circle cx="26" cy="65" r="7" fill="#0284c7" />
          {/* Elevated Pelvic Bridge Line */}
          <path
            d="M30 65 L65 38 L98 72"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Feet on floor */}
          <line
            x1="98"
            y1="72"
            x2="108"
            y2="72"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Glute highlight glow circle */}
          <circle cx="65" cy="38" r="9" fill="#f43f5e" fillOpacity="0.5" />
          <path
            d="M65 48 L65 30"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "hombro": // Rotator cuff or codman
      return (
        <svg
          viewBox="0 0 140 80"
          className="w-full h-20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="10"
            y1="72"
            x2="130"
            y2="72"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {/* Standing torso */}
          <circle cx="60" cy="22" r="7" fill="#0284c7" />
          <line
            x1="60"
            y1="29"
            x2="60"
            y2="58"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          <line
            x1="56"
            y1="58"
            x2="54"
            y2="72"
            stroke="#38bdf8"
            strokeWidth="2.5"
          />
          <line
            x1="64"
            y1="58"
            x2="66"
            y2="72"
            stroke="#38bdf8"
            strokeWidth="2.5"
          />
          {/* Arm with 90 deg elbow */}
          <path
            d="M60 34 L72 44 L94 44"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Elastic resistance band */}
          <path
            d="M94 44 L118 44"
            stroke="#ef4444"
            strokeWidth="3"
            strokeDasharray="3 2"
          />
          {/* Rotation arc arrow */}
          <path
            d="M90 38 Q100 44 90 50"
            stroke="#22c55e"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );

    case "rodilla": // Knee isometric
      return (
        <svg
          viewBox="0 0 140 80"
          className="w-full h-20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="10"
            y1="72"
            x2="130"
            y2="72"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {/* Sitting person */}
          <line
            x1="30"
            y1="42"
            x2="30"
            y2="72"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          <circle cx="30" cy="34" r="7" fill="#0284c7" />
          {/* Extended leg with foam roller under knee */}
          <path
            d="M30 72 L65 64 L108 52"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Foam roller under knee */}
          <ellipse cx="65" cy="68" rx="8" ry="5" fill="#f59e0b" />
          {/* Downward force arrow */}
          <path
            d="M65 52 L65 62"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "propiocepcion": // Single leg balance
      return (
        <svg
          viewBox="0 0 140 80"
          className="w-full h-20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="10"
            y1="72"
            x2="130"
            y2="72"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {/* Unstable Bosu dome */}
          <path
            d="M50 72 Q70 60 90 72 Z"
            fill="#0284c7"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          {/* Single Leg standing on top */}
          <circle cx="70" cy="18" r="6" fill="#38bdf8" />
          <line
            x1="70"
            y1="24"
            x2="70"
            y2="44"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          <line
            x1="70"
            y1="44"
            x2="70"
            y2="62"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          {/* Lifted knee */}
          <path d="M70 44 L84 46 L86 58" stroke="#94a3b8" strokeWidth="2" />
          {/* Balance ripples */}
          <path
            d="M44 65 Q70 54 96 65"
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        </svg>
      );

    case "vestibular": // VOR gaze fixation
      return (
        <svg
          viewBox="0 0 140 80"
          className="w-full h-20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Head profile */}
          <circle
            cx="45"
            cy="40"
            r="14"
            stroke="#38bdf8"
            strokeWidth="2.5"
            fill="#0284c7"
            fillOpacity="0.3"
          />
          <circle cx="52" cy="38" r="2.5" fill="#38bdf8" />
          {/* Eye Gaze Target Ray */}
          <line
            x1="55"
            y1="38"
            x2="105"
            y2="38"
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
          {/* Target Thumb / Point */}
          <circle cx="108" cy="38" r="5" fill="#ef4444" />
          {/* Cervical rotation arc */}
          <path
            d="M35 24 Q45 18 55 24"
            stroke="#f59e0b"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );

    case "potencia": // Explosive power
    default:
      return (
        <svg
          viewBox="0 0 140 80"
          className="w-full h-20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="10"
            y1="72"
            x2="130"
            y2="72"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          {/* Person jumping or landing with lightning bolt */}
          <circle cx="70" cy="22" r="6" fill="#38bdf8" />
          <line
            x1="70"
            y1="28"
            x2="70"
            y2="48"
            stroke="#38bdf8"
            strokeWidth="3"
          />
          <path d="M70 48 L60 62 L64 70" stroke="#38bdf8" strokeWidth="3" />
          <path d="M70 48 L80 62 L76 70" stroke="#38bdf8" strokeWidth="3" />
          {/* Lightning power icon */}
          <path
            d="M85 24 L94 18 L90 28 L98 28 L86 42 L88 32 Z"
            fill="#eab308"
          />
        </svg>
      );
  }
};

export const ExerciseVisuals = ({
  customExercises,
  onAddExercise,
  onRemoveExercise,
  readOnly = false,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. VISUAL PRESET EXERCISE GALLERY (CLICK TO ADD) */}
      {!readOnly && (
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-cyan-400" />
                <h5 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Catálogo Ilustrado de Ejercicios Terapéuticos
                </h5>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Haz clic en cualquier ejercicio para agregarlo a la cartilla con
                su prescripción pre-dosificada.
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
              {PRESET_EXERCISES_WITH_VISUALS.length} Ilustraciones Clínicas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {PRESET_EXERCISES_WITH_VISUALS.map((preset) => {
              const alreadyAdded = customExercises.some((e) =>
                e.name
                  .toLowerCase()
                  .includes(preset.name.toLowerCase().slice(0, 15)),
              );

              return (
                <div
                  key={preset.id}
                  className={`bg-slate-850 p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    alreadyAdded
                      ? "border-emerald-500/80 bg-emerald-950/20 shadow-xs"
                      : "border-slate-700/80 hover:border-cyan-500/80 hover:bg-slate-800"
                  }`}
                >
                  {/* Category & Added Indicator */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {preset.categoryTag}
                    </span>
                    {alreadyAdded && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>En cartilla</span>
                      </span>
                    )}
                  </div>

                  {/* SVG Vector Drawing */}
                  <div className="bg-slate-950 rounded-lg p-2 my-1 flex items-center justify-center border border-slate-800">
                    <ExerciseVectorDrawing
                      type={preset.type}
                      name={preset.name}
                    />
                  </div>

                  {/* Title & Target */}
                  <div className="space-y-1 mt-1 flex-1">
                    <h6 className="text-xs font-bold text-white line-clamp-2">
                      {preset.name}
                    </h6>
                    <p className="text-xs text-cyan-300">
                      🎯 {preset.targetZone}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      ⏱ {preset.series} series × {preset.repsOrTime} (Desc:{" "}
                      {preset.restSeconds}s)
                    </p>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() =>
                      onAddExercise({
                        id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                        name: preset.name,
                        series: preset.series,
                        repsOrTime: preset.repsOrTime,
                        restSeconds: preset.restSeconds,
                        techniqueTips: preset.techniqueTips,
                        targetZone: preset.targetZone,
                      })
                    }
                    className="mt-2 w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar a Cartilla</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ACTIVE CUSTOM EXERCISES CARTILLA CARDS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                Cartilla Dosificada para el Alumno ({customExercises.length}{" "}
                {customExercises.length === 1 ? "Ejercicio" : "Ejercicios"})
              </h5>
              <p className="text-xs text-slate-500">
                Esta lista con ilustraciones e indicaciones se incluirá en el
                reporte despachado.
              </p>
            </div>
          </div>
        </div>

        {customExercises.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Dumbbell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">
              No hay ejercicios agregados a la cartilla
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Usa el catálogo ilustrado superior para añadir ejercicios.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customExercises.map((ex, idx) => {
              // Attempt to match illustration preset
              const matchedPreset = PRESET_EXERCISES_WITH_VISUALS.find(
                (p) =>
                  p.name
                    .toLowerCase()
                    .includes(ex.name.toLowerCase().slice(0, 10)) ||
                  ex.name
                    .toLowerCase()
                    .includes(p.name.toLowerCase().slice(0, 10)),
              );

              return (
                <div
                  key={ex.id || idx}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h6 className="text-xs font-bold text-slate-900 truncate">
                        {ex.name}
                      </h6>
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onRemoveExercise(ex.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Quitar ejercicio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Exercise Vector Graphic Display */}
                  <div className="bg-slate-900 rounded-lg p-2 flex items-center justify-center">
                    <ExerciseVectorDrawing
                      type={matchedPreset ? matchedPreset.type : "movilidad"}
                      name={ex.name}
                    />
                  </div>

                  {/* Sets, Reps, Rest Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-200">
                    <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {ex.series} series
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {ex.repsOrTime}
                    </span>
                    {ex.restSeconds > 0 && (
                      <span className="font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        Descanso: {ex.restSeconds}s
                      </span>
                    )}
                  </div>

                  {/* Tips */}
                  {ex.techniqueTips && (
                    <p className="text-xs text-slate-600 italic bg-white p-1.5 rounded-lg border border-slate-200">
                      💡 {ex.techniqueTips}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
