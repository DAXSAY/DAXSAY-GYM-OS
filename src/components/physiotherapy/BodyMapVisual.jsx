import React, { useState } from "react";
import { Plus, X, Target, MapPin } from "lucide-react";

/* ------------------------------------------------------------------
   MAPA CORPORAL DE DOLOR (vista anterior y posterior)
   - Los puntos están dentro del SVG, así quedan siempre alineados
     con la silueta sin importar el tamaño de pantalla.
   - Zonas bilaterales: se marca lado derecho / izquierdo.
   - Convención clínica: en la vista anterior el lado derecho del
     paciente aparece a la izquierda del observador.
------------------------------------------------------------------- */

// id -> se conservan los mismos identificadores usados en registros previos
export const ZONE_DETAILS = [
  {
    id: "cervical",
    label: "Columna Cervical",
    short: "Cervical",
    sublabel: "Cuello, nuca y trapecio superior",
    bilateral: false,
    front: [120, 66],
    back: [120, 66],
  },
  {
    id: "hombro",
    label: "Hombro / Manguito Rotador",
    short: "Hombro",
    sublabel: "Deltoides, supraespinoso, acromioclavicular",
    bilateral: true,
    // [x lado derecho del paciente, x lado izquierdo] en vista anterior
    frontX: [72, 168],
    y: 92,
  },
  {
    id: "columna_dorsal",
    label: "Columna Dorsal",
    short: "Dorsal",
    sublabel: "Espalda media, escápulas y romboides",
    bilateral: false,
    back: [120, 124],
  },
  {
    id: "lumbar",
    label: "Columna Lumbar",
    short: "Lumbar",
    sublabel: "L1–L5/S1, cuadrado lumbar, sacroilíaca",
    bilateral: false,
    back: [120, 200],
  },
  {
    id: "codo",
    label: "Codo",
    short: "Codo",
    sublabel: "Epicóndilo / epitróclea, tendón bicipital",
    bilateral: true,
    frontX: [57, 183],
    y: 166,
  },
  {
    id: "muneca_mano",
    label: "Muñeca & Mano",
    short: "Muñeca",
    sublabel: "Túnel carpiano, tendones flexores/extensores",
    bilateral: true,
    frontX: [47, 193],
    y: 238,
  },
  {
    id: "cadera",
    label: "Cadera / Pelvis",
    short: "Cadera",
    sublabel: "Coxofemoral, glúteos, psoas y aductores",
    bilateral: true,
    frontX: [96, 144],
    y: 234,
  },
  {
    id: "rodilla",
    label: "Rodilla",
    short: "Rodilla",
    sublabel: "Meniscos, ligamentos, tendón rotuliano",
    bilateral: true,
    frontX: [99, 141],
    y: 328,
  },
  {
    id: "tobillo_pie",
    label: "Tobillo & Pie",
    short: "Tobillo",
    sublabel: "Aquiles, ligamentos laterales, fascia plantar",
    bilateral: true,
    frontX: [99, 141],
    y: 414,
  },
  {
    id: "muscular_general",
    label: "Sobrecarga Muscular General",
    short: "General",
    sublabel: "Fatiga / sobrecarga global por entrenamiento",
    bilateral: false,
  },
  {
    id: "codo_muneca",
    label: "Codo & Muñeca (registro antiguo)",
    short: "Codo-Muñeca",
    sublabel: "Antebrazo",
    bilateral: false,
    legacy: true,
  },
];

export const zoneLabel = (id, sides) => {
  const z = ZONE_DETAILS.find((x) => x.id === id);
  const base = z ? z.label : id;
  if (!sides || sides.length === 0) return base;
  const txt =
    sides.length === 2 ? "bilateral" : sides[0] === "der" ? "derecho" : "izquierdo";
  return `${base} (${txt})`;
};

// Coordenadas de los puntos según vista
const hotspotsFor = (view) => {
  const pts = [];
  ZONE_DETAILS.forEach((z) => {
    if (z.bilateral) {
      const [xDer, xIzq] = z.frontX;
      // En vista posterior se invierte (vemos al paciente de espaldas)
      pts.push({ zone: z, side: "der", x: view === "front" ? xDer : xIzq, y: z.y });
      pts.push({ zone: z, side: "izq", x: view === "front" ? xIzq : xDer, y: z.y });
    } else {
      const c = view === "front" ? z.front : z.back;
      if (c) pts.push({ zone: z, side: null, x: c[0], y: c[1] });
    }
  });
  return pts;
};


/* Silueta humana con proporciones clínicas (8 cabezas aprox.) */
const Silhouette = ({ view }) => {
  const limb = (d, w) => (
    <>
      <path d={d} stroke="#64748b" strokeWidth={w + 3} strokeLinecap="round" fill="none" />
      <path d={d} stroke="url(#piel)" strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  );
  const m = (x) => 240 - x;
  return (
    <g>
      {/* brazos */}
      {limb("M74,92 Q62,128 57,166", 21)}
      {limb("M57,166 Q51,204 47,236", 16)}
      {limb(`M${m(74)},92 Q${m(62)},128 ${m(57)},166`, 21)}
      {limb(`M${m(57)},166 Q${m(51)},204 ${m(47)},236`, 16)}
      <ellipse cx="45" cy="254" rx="8.5" ry="14" fill="url(#piel)" stroke="#64748b" strokeWidth="1.5" />
      <ellipse cx={m(45)} cy="254" rx="8.5" ry="14" fill="url(#piel)" stroke="#64748b" strokeWidth="1.5" />
      {/* piernas */}
      {limb("M101,236 Q96,284 99,328", 30)}
      {limb("M99,328 Q96,372 99,412", 21)}
      {limb(`M${m(101)},236 Q${m(96)},284 ${m(99)},328`, 30)}
      {limb(`M${m(99)},328 Q${m(96)},372 ${m(99)},412`, 21)}
      <ellipse cx="97" cy="428" rx="13" ry="7" fill="url(#piel)" stroke="#64748b" strokeWidth="1.5" />
      <ellipse cx={m(97)} cy="428" rx="13" ry="7" fill="url(#piel)" stroke="#64748b" strokeWidth="1.5" />
      {/* tronco */}
      <path
        d="M84,78 Q120,70 156,78 Q172,84 172,100 L164,150 Q158,182 161,212 L163,240 Q120,252 77,240 L79,212 Q82,182 76,150 L68,100 Q68,84 84,78 Z"
        fill="url(#piel)"
        stroke="#64748b"
        strokeWidth="1.5"
      />
      {/* cuello y cabeza */}
      <path d="M111,56 L110,76 L130,76 L129,56 Z" fill="url(#piel)" stroke="#64748b" strokeWidth="1.5" />
      <ellipse cx="120" cy="38" rx="19" ry="23" fill="url(#piel)" stroke="#64748b" strokeWidth="1.5" />

      {view === "front" ? (
        <g stroke="#94a3b8" strokeOpacity="0.45" fill="none" strokeWidth="1.2">
          <path d="M90,84 Q104,90 117,84" />
          <path d={`M${m(90)},84 Q${m(104)},90 ${m(117)},84`} />
          <path d="M86,118 Q102,132 119,124" />
          <path d={`M${m(86)},118 Q${m(102)},132 ${m(119)},124`} />
          <line x1="120" y1="128" x2="120" y2="200" strokeDasharray="2 4" />
          <circle cx="120" cy="196" r="1.8" fill="#94a3b8" />
          <path d="M88,224 Q120,246 152,224" />
          <ellipse cx="99" cy="328" rx="7" ry="8" />
          <ellipse cx={m(99)} cy="328" rx="7" ry="8" />
          <ellipse cx="114" cy="36" rx="2.2" ry="1.4" fill="#94a3b8" />
          <ellipse cx="126" cy="36" rx="2.2" ry="1.4" fill="#94a3b8" />
        </g>
      ) : (
        <g stroke="#94a3b8" strokeOpacity="0.5" fill="none" strokeWidth="1.2">
          <line x1="120" y1="58" x2="120" y2="232" strokeDasharray="3 3" />
          <path d="M92,98 Q86,120 98,140 L110,128" />
          <path d={`M${m(92)},98 Q${m(86)},120 ${m(98)},140 L${m(110)},128`} />
          <path d="M120,236 L120,252" />
          <path d="M84,240 Q100,258 120,250" />
          <path d={`M${m(84)},240 Q${m(100)},258 120,250`} />
          <path d="M92,338 Q99,344 106,338" />
          <path d={`M${m(92)},338 Q${m(99)},344 ${m(106)},338`} />
        </g>
      )}
    </g>
  );
};

const BodyFigure = ({ view, selectedZones, zoneSides, onPoint, readOnly, size }) => {
  const pts = hotspotsFor(view);
  const isOn = (p) => {
    if (!selectedZones.includes(p.zone.id)) return false;
    if (!p.side) return true;
    const s = zoneSides?.[p.zone.id];
    return !s || s.length === 0 || s.includes(p.side);
  };
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-extrabold text-slate-200 uppercase tracking-widest mb-1">
        {view === "front" ? "Vista anterior" : "Vista posterior"}
      </span>
      <svg viewBox="0 0 240 450" className={size} role="img">
        <defs>
          <linearGradient id="piel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b4a63" />
            <stop offset="100%" stopColor="#273449" />
          </linearGradient>
          <radialGradient id="dolor">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Silhouette view={view} />

        {/* halos de dolor */}
        {pts.filter(isOn).map((p) => (
          <circle key={`h-${p.zone.id}-${p.side}`} cx={p.x} cy={p.y} r="22" fill="url(#dolor)">
            <animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite" />
          </circle>
        ))}

        {/* puntos */}
        {pts.map((p) => {
          const on = isOn(p);
          const lbl = `${p.zone.short}${p.side ? (p.side === "der" ? " D" : " I") : ""}`;
          const labelLeft = p.x < 120;
          return (
            <g
              key={`${p.zone.id}-${p.side}`}
              onClick={() => !readOnly && onPoint(p.zone.id, p.side)}
              style={{ cursor: readOnly ? "default" : "pointer" }}
            >
              <title>{zoneLabel(p.zone.id, p.side ? [p.side] : null)}</title>
              <circle
                cx={p.x}
                cy={p.y}
                r="8"
                fill={on ? "#f43f5e" : "#0f172a"}
                stroke={on ? "#fff" : "#38bdf8"}
                strokeWidth="2"
              />
              {on ? (
                <path
                  d={`M${p.x - 3.5},${p.y} l2.5,2.8 l5,-5.6`}
                  stroke="#fff"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              ) : (
                !readOnly && (
                  <path
                    d={`M${p.x - 3.5},${p.y} h7 M${p.x},${p.y - 3.5} v7`}
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )
              )}
              {on && (
                <text
                  x={p.side ? (labelLeft ? p.x - 13 : p.x + 13) : p.x + 13}
                  y={p.y + 3.5}
                  textAnchor={p.side && labelLeft ? "end" : "start"}
                  fontSize="10"
                  fontWeight="800"
                  fill="#fecdd3"
                  stroke="#020617"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {lbl}
                </text>
              )}
            </g>
          );
        })}

        {/* lateralidad */}
        <text x="14" y="446" fontSize="11" fontWeight="800" fill="#64748b">
          {view === "front" ? "DER" : "IZQ"}
        </text>
        <text x="226" y="446" fontSize="11" fontWeight="800" fill="#64748b" textAnchor="end">
          {view === "front" ? "IZQ" : "DER"}
        </text>
      </svg>
    </div>
  );
};

export const BodyMapVisual = ({
  selectedZones = [],
  zoneSides = {},
  onToggleZone,
  onToggleSide,
  onAddCustomZone,
  onRemoveZone,
  readOnly = false,
}) => {
  const [customZoneInput, setCustomZoneInput] = useState("");

  const handlePoint = (zoneId, side) => {
    if (side && onToggleSide) onToggleSide(zoneId, side);
    else if (onToggleZone) onToggleZone(zoneId);
  };

  const customZones = selectedZones.filter((z) => !ZONE_DETAILS.some((d) => d.id === z));

  if (readOnly) {
    return (
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
        <div className="flex justify-center gap-6">
          {["front", "back"].map((v) => (
            <BodyFigure
              key={v}
              view={v}
              selectedZones={selectedZones}
              zoneSides={zoneSides}
              readOnly
              size="w-40 h-80"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center mt-3">
          {selectedZones.map((z) => (
            <span
              key={z}
              className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40"
            >
              {zoneLabel(z, zoneSides?.[z])}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const addCustom = () => {
    const v = customZoneInput.trim();
    if (!v) return;
    if (onAddCustomZone) onAddCustomZone(v);
    setCustomZoneInput("");
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-base font-extrabold flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-400" />
            Mapa corporal del dolor
          </h4>
          <p className="text-sm text-slate-400">
            Toque los puntos <span className="text-sky-400 font-bold">+</span> para marcar las zonas
            dolorosas. En articulaciones pares indique el lado (D = derecho, I = izquierdo).
          </p>
        </div>
        <span className="text-sm font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40">
          {selectedZones.length} zona(s) marcada(s)
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6 bg-slate-950 rounded-xl border border-slate-800 py-3 flex justify-center gap-4 sm:gap-8">
          {["front", "back"].map((v) => (
            <BodyFigure
              key={v}
              view={v}
              selectedZones={selectedZones}
              zoneSides={zoneSides}
              onPoint={handlePoint}
              size="w-36 h-[300px] sm:w-44 sm:h-[370px]"
            />
          ))}
        </div>

        <div className="xl:col-span-6 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Zonas anatómicas
          </span>
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {ZONE_DETAILS.filter((z) => !z.legacy || selectedZones.includes(z.id)).map((z) => {
              const on = selectedZones.includes(z.id);
              const sides = zoneSides?.[z.id] || [];
              return (
                <div
                  key={z.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                    on ? "bg-rose-500/10 border-rose-500/50" : "bg-slate-800/50 border-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleZone && onToggleZone(z.id)}
                    className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                        on ? "bg-rose-500 border-rose-500" : "border-slate-500"
                      }`}
                    >
                      {on && <span className="text-xs font-black">✓</span>}
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{z.label}</span>
                      <span className="block text-xs text-slate-400">{z.sublabel}</span>
                    </span>
                  </button>
                  {z.bilateral && (
                    <div className="flex gap-1 shrink-0">
                      {[
                        ["der", "D"],
                        ["izq", "I"],
                      ].map(([s, t]) => (
                        <button
                          type="button"
                          key={s}
                          title={s === "der" ? "Derecho" : "Izquierdo"}
                          onClick={() => onToggleSide && onToggleSide(z.id, s)}
                          className={`w-8 h-8 rounded-lg text-xs font-black cursor-pointer border ${
                            sides.includes(s)
                              ? "bg-rose-500 border-rose-400 text-white"
                              : "bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-400"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {customZones.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {customZones.map((z) => (
                <span
                  key={z}
                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-200 border border-violet-500/40"
                >
                  <MapPin className="w-3 h-3" />
                  {z}
                  <button type="button" onClick={() => onRemoveZone && onRemoveZone(z)} className="cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <input
              value={customZoneInput}
              onChange={(e) => setCustomZoneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Otra zona (ej. ATM, costillas, aductores)…"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500"
            />
            <button
              type="button"
              onClick={addCustom}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyMapVisual;
