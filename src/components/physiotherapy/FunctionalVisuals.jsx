import React from "react";
import { Activity, ShieldAlert, Flame, AlertCircle } from "lucide-react";

export const FunctionalVisuals = ({
  romStatus = "completo",
  onRomStatusChange,
  romDetails = "",
  onRomDetailsChange,
  onRomChange,
  mobilityQuality = "normal",
  onMobilityQualityChange,
  painPhase = "inicio_movimiento",
  onPainPhaseChange,
  dynamicPainEVA = 0,
  onDynamicPainEVAChange,
  painNature = "Punzante",
  onPainNatureChange,
  onPainChange,
  tests,
  functionalTests,
  onToggleTestResult,
  muscleTone = "normotono",
  onMuscleToneChange,
  tempEdema = "normotermico",
  onTempEdemaChange,
  tenderNotes,
  tenderZoneNotes,
  onTenderZoneNotesChange,
  onPalpationChange,
  readOnly = false,
}) => {
  const currentTests = tests || functionalTests || [];
  const currentNotes = tenderNotes ?? tenderZoneNotes ?? "";

  // Visual Arc Angle based on ROM status
  const getRomAngle = () => {
    switch (romStatus) {
      case "completo":
        return 160;
      case "limitado_leve":
        return 125;
      case "limitado_moderado":
        return 85;
      case "severamente_limitado":
        return 45;
      default:
        return 140;
    }
  };

  const handleRomStatusClick = (st) => {
    if (onRomStatusChange) onRomStatusChange(st);
    if (onRomChange) onRomChange(st, romDetails);
  };

  const handleRomDetailsInput = (text) => {
    if (onRomDetailsChange) onRomDetailsChange(text);
    if (onRomChange) onRomChange(romStatus, text);
  };

  const handlePainPhaseClick = (ph) => {
    if (onPainPhaseChange) onPainPhaseChange(ph);
    if (onPainChange) onPainChange(ph, dynamicPainEVA, painNature);
  };

  const handlePainEvaInput = (eva) => {
    if (onDynamicPainEVAChange) onDynamicPainEVAChange(eva);
    if (onPainChange) onPainChange(painPhase, eva, painNature);
  };

  const handleToneChange = (tone) => {
    if (onMuscleToneChange) onMuscleToneChange(tone);
    if (onPalpationChange) onPalpationChange(tone, tempEdema, currentNotes);
  };

  const handleTempChange = (temp) => {
    if (onTempEdemaChange) onTempEdemaChange(temp);
    if (onPalpationChange) onPalpationChange(muscleTone, temp, currentNotes);
  };

  const handleNotesChange = (text) => {
    if (onTenderZoneNotesChange) onTenderZoneNotesChange(text);
    if (onPalpationChange) onPalpationChange(muscleTone, tempEdema, text);
  };

  return (
    <div className="space-y-6">
      {/* 1. VISUAL GONIOMETER & PAIN ON MOVEMENT ARC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Goniometer / ROM Visual Dial */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Goniómetro & Rango Articular (ROM)</span>
            </h5>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                romStatus === "completo"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {String(romStatus).replace("_", " ").toUpperCase()}
            </span>
          </div>

          {/* SVG Goniometer Graphic */}
          <div className="bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center relative">
            <svg
              viewBox="0 0 200 115"
              className="w-full max-w-[320px] h-44"
              fill="none"
            >
              {/* Semicircle scale */}
              <path
                d="M20 100 A80 80 0 0 1 180 100"
                stroke="#334155"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Normal green target range */}
              <path
                d="M120 28 A80 80 0 0 1 180 100"
                stroke="#22c55e"
                strokeWidth="12"
                strokeOpacity="0.4"
              />
              {/* Current ROM Arc */}
              <path
                d={`M20 100 A80 80 0 0 1 ${100 + 80 * Math.cos(Math.PI - (getRomAngle() * Math.PI) / 180)} ${100 - 80 * Math.sin((getRomAngle() * Math.PI) / 180)}`}
                stroke={romStatus === "completo" ? "#38bdf8" : "#f43f5e"}
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Center Pivot Needle */}
              <circle cx="100" cy="100" r="8" fill="#e2e8f0" />
              <line
                x1="100"
                y1="100"
                x2={
                  100 + 72 * Math.cos(Math.PI - (getRomAngle() * Math.PI) / 180)
                }
                y2={100 - 72 * Math.sin((getRomAngle() * Math.PI) / 180)}
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Degree labels */}
              <text
                x="20"
                y="112"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
              >
                0°
              </text>
              <text x="94" y="20" fill="#94a3b8" fontSize="9" fontWeight="bold">
                90°
              </text>
              <text
                x="170"
                y="112"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
              >
                180°
              </text>
              <text
                x="86"
                y="85"
                fill="#38bdf8"
                fontSize="13"
                fontWeight="bold"
              >
                ~{getRomAngle()}°
              </text>
            </svg>
            <span className="text-xs text-slate-300 font-semibold mt-1">
              Amplitud angular estimada: ~{getRomAngle()}° de recorrido
              funcional
            </span>
          </div>

          {!readOnly && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  "completo",
                  "limitado_leve",
                  "limitado_moderado",
                  "severamente_limitado",
                ].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleRomStatusClick(st)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      romStatus === st
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {st === "completo" && "Completo (100%)"}
                    {st === "limitado_leve" && "Limitado Leve (~80%)"}
                    {st === "limitado_moderado" && "Moderado (~50%)"}
                    {st === "severamente_limitado" && "Severo (<30%)"}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={romDetails}
                onChange={(e) => handleRomDetailsInput(e.target.value)}
                placeholder="Ej. Flexión completa con limitación terminal en rotación externa..."
                className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Pain on Movement (Arco Doloroso) Visual */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>Arco Doloroso & Dolor a la Movilidad</span>
            </h5>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              EVA Dinámico: {dynamicPainEVA}/10
            </span>
          </div>

          {/* Visual Arc of Pain Indicator */}
          <div className="bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 200 95"
              className="w-full max-w-[320px] h-40"
              fill="none"
            >
              {/* Path base */}
              <path
                d="M15 80 Q100 10 185 80"
                stroke="#334155"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Pain Zone Highlight based on phase */}
              {painPhase === "inicio_movimiento" && (
                <path
                  d="M15 80 Q55 45 75 35"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              )}
              {painPhase === "arco_medio" && (
                <path
                  d="M65 40 Q100 20 135 40"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              )}
              {painPhase === "final_rango" && (
                <path
                  d="M125 35 Q145 45 185 80"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              )}
              {painPhase === "todo_el_recorrido" && (
                <path
                  d="M15 80 Q100 10 185 80"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              )}
              <text x="15" y="92" fill="#94a3b8" fontSize="8">
                Inicio
              </text>
              <text x="82" y="92" fill="#94a3b8" fontSize="8">
                Arco Medio
              </text>
              <text x="160" y="92" fill="#94a3b8" fontSize="8">
                Final
              </text>
            </svg>
            <span className="text-xs text-amber-300 font-semibold mt-1">
              Fase: {String(painPhase).replace("_", " ").toUpperCase()} (
              {painNature || "Punzante"})
            </span>
          </div>

          {!readOnly && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  "inicio_movimiento",
                  "arco_medio",
                  "final_rango",
                  "todo_el_recorrido",
                ].map((ph) => (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => handlePainPhaseClick(ph)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      painPhase === ph
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ph === "inicio_movimiento" && "Al Iniciar (0°-30°)"}
                    {ph === "arco_medio" && "Arco Medio (60°-120°)"}
                    {ph === "final_rango" && "Al Final del Rango"}
                    {ph === "todo_el_recorrido" && "En Todo el Recorrido"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-medium">
                  EVA Dinámico:
                </span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={dynamicPainEVA}
                  onChange={(e) =>
                    handlePainEvaInput(parseInt(e.target.value) || 0)
                  }
                  className="flex-1 accent-rose-600"
                />

                <span className="text-xs font-bold text-rose-600 w-6 text-right">
                  {dynamicPainEVA}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. ORTHOPEDIC FUNCTIONAL TESTS WITH ARTICULATION BADGES & CARDS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Evaluaciones Funcionales Específicas por Articulación</span>
          </label>
          <span className="text-xs text-slate-500">
            {currentTests.filter((t) => t?.result === "positivo").length} tests
            patológicos positivos
          </span>
        </div>

        {currentTests.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No se han registrado pruebas funcionales específicas para esta
            evaluación.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {currentTests.map((test, index) => {
              const isPos = test?.result === "positivo";
              const isNeg = test?.result === "negativo";
              const isDoubt = test?.result === "dudoso";

              return (
                <div
                  key={
                    test?.testName
                      ? `test-${test.testName}-${index}`
                      : `test-idx-${index}`
                  }
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isPos
                      ? "bg-rose-50/80 border-rose-300 ring-1 ring-rose-300"
                      : isDoubt
                        ? "bg-amber-50/80 border-amber-300"
                        : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        {test?.joint || "Articulación"}
                      </span>
                      <h6 className="text-xs font-bold text-slate-900 truncate">
                        {test?.testName || "Prueba Funcional"}
                      </h6>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPos
                        ? "⚠️ Maniobra positiva (reproduce síntoma patológico)"
                        : "Respuesta fisiológica sin signos de rotura o compresión"}
                    </p>
                  </div>

                  {!readOnly && onToggleTestResult ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleTestResult(index, "negativo")}
                        title="Negativo (Normal)"
                        className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isNeg
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Negativo
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTestResult(index, "positivo")}
                        title="Positivo (Hallazgo)"
                        className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isPos
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Positivo
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTestResult(index, "dudoso")}
                        title="Dudoso / Tolerancia límite"
                        className={`px-1.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isDoubt
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        ?
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isPos
                          ? "bg-rose-600 text-white"
                          : isDoubt
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {test?.result || "negativo"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. PALPATION POR ZONA DE DOLOR VISUAL */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <span>
            Palpación por Zona de Dolor (Tono Muscular, Temperatura & Puntos
            Gatillo)
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tone selector */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">
              Tono Muscular a la Palpación:
            </span>
            {!readOnly ? (
              <select
                value={muscleTone}
                onChange={(e) => handleToneChange(e.target.value)}
                className="w-full text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="normotono">
                  Normotono (Tono muscular elástico normal)
                </option>
                <option value="contractura_focal">
                  Contractura Focal / Banda tensa palpable
                </option>
                <option value="hipertono_espasmo">
                  Hipertono en Espasmo Protector Reflejo
                </option>
                <option value="hipotono">
                  Hipotono / Atrofia o debilidad marcada
                </option>
              </select>
            ) : (
              <p className="text-xs font-semibold text-slate-800">
                {String(muscleTone).replace("_", " ").toUpperCase()}
              </p>
            )}
          </div>

          {/* Temperature & Edema */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">
              Temperatura Local / Edema:
            </span>
            {!readOnly ? (
              <select
                value={tempEdema}
                onChange={(e) => handleTempChange(e.target.value)}
                className="w-full text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="normotermico">
                  Normotérmico sin edema visible
                </option>
                <option value="calor_local">
                  Calor local perceptible (Signo inflamatorio activo)
                </option>
                <option value="edema_leve">
                  Edema leve periarticular (Fóvea leve)
                </option>
                <option value="edema_moderado">
                  Edema moderado / derrame articular
                </option>
              </select>
            ) : (
              <p className="text-xs font-semibold text-slate-800">
                {String(tempEdema).replace("_", " ").toUpperCase()}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <input
              type="text"
              value={currentNotes}
              disabled={readOnly}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Detalle de palpación: puntos gatillo miofasciales, dolor exquisito sobre inserción..."
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
