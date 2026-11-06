import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  ShieldAlert,
  Dumbbell,
  Ruler,
  ClipboardList,
  Flame,
  Info,
  Stethoscope,
  Hand,
  Plus,
  Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------
   HERRAMIENTAS CLÍNICAS ESTANDARIZADAS DE FISIOTERAPIA
   Cada sección se exporta por separado para ubicarla en la pestaña
   que corresponde (anamnesis / exploración).
------------------------------------------------------------------- */

export const RED_FLAGS = [
  { id: "anestesia_silla", label: "Anestesia en silla de montar (zona perineal)", urgent: true },
  { id: "vejiga_intestino", label: "Retención / incontinencia urinaria o fecal", urgent: true },
  { id: "deficit_neuro", label: "Déficit neurológico progresivo en piernas", urgent: true },
  { id: "mielopatia", label: "Marcha inestable o torpeza de manos", urgent: true },
  { id: "cancer", label: "Antecedente de cáncer" },
  { id: "peso", label: "Pérdida de peso inexplicada" },
  { id: "fiebre", label: "Fiebre, escalofríos o infección reciente" },
  { id: "trauma", label: "Traumatismo importante (caída, accidente)" },
  { id: "dolor_nocturno", label: "Dolor nocturno que no cede con reposo" },
  { id: "corticoides", label: "Corticoides prolongados / osteoporosis" },
  { id: "edad", label: "Primer episodio con > 50 o < 20 años" },
];

export const MRC_GRADES = [
  { v: 0, label: "0 · Sin contracción" },
  { v: 1, label: "1 · Contracción sin movimiento" },
  { v: 2, label: "2 · Mueve sin gravedad" },
  { v: 3, label: "3 · Vence la gravedad" },
  { v: 4, label: "4 · Vence resistencia moderada" },
  { v: 5, label: "5 · Normal" },
];

export const MRC_GROUPS = [
  { id: "abd_hombro", label: "Abductores de hombro" },
  { id: "flex_codo", label: "Flexores de codo" },
  { id: "ext_muneca", label: "Extensores de muñeca" },
  { id: "flex_cadera", label: "Flexores de cadera" },
  { id: "ext_rodilla", label: "Extensores de rodilla" },
  { id: "dorsi_tobillo", label: "Dorsiflexores de tobillo" },
];

/* Articulaciones y movimientos con valores de referencia AAOS (grados).
   bilateral:false -> movimiento axial de columna con un solo valor. */
export const ROM_JOINTS = [
  {
    id: "Cervical",
    zones: ["cervical"],
    movs: [
      { id: "cerv_flex", mov: "Flexión", norm: 45, bilateral: false },
      { id: "cerv_ext", mov: "Extensión", norm: 45, bilateral: false },
      { id: "cerv_incl", mov: "Inclinación lateral", norm: 45 },
      { id: "cerv_rot", mov: "Rotación", norm: 60 },
    ],
  },
  {
    id: "Hombro",
    zones: ["hombro"],
    movs: [
      { id: "hom_flex", mov: "Flexión", norm: 180 },
      { id: "hom_abd", mov: "Abducción", norm: 180 },
      { id: "hom_re", mov: "Rotación externa", norm: 90 },
      { id: "hom_ri", mov: "Rotación interna", norm: 70 },
    ],
  },
  {
    id: "Codo",
    zones: ["codo", "codo_muneca"],
    movs: [
      { id: "codo_flex", mov: "Flexión", norm: 150 },
      { id: "ant_pro", mov: "Pronación", norm: 80 },
      { id: "ant_sup", mov: "Supinación", norm: 80 },
    ],
  },
  {
    id: "Muñeca",
    zones: ["muneca_mano", "codo_muneca"],
    movs: [
      { id: "mun_flex", mov: "Flexión", norm: 80 },
      { id: "mun_ext", mov: "Extensión", norm: 70 },
      { id: "mun_rad", mov: "Desviación radial", norm: 20 },
      { id: "mun_cub", mov: "Desviación cubital", norm: 30 },
    ],
  },
  {
    id: "Tronco",
    zones: ["columna_dorsal", "lumbar"],
    movs: [
      { id: "tr_flex", mov: "Flexión", norm: 80, bilateral: false },
      { id: "tr_ext", mov: "Extensión", norm: 25, bilateral: false },
      { id: "tr_incl", mov: "Inclinación lateral", norm: 35 },
      { id: "tr_rot", mov: "Rotación", norm: 45 },
    ],
  },
  {
    id: "Cadera",
    zones: ["cadera"],
    movs: [
      { id: "cad_flex", mov: "Flexión", norm: 120 },
      { id: "cad_ext", mov: "Extensión", norm: 30 },
      { id: "cad_abd", mov: "Abducción", norm: 45 },
      { id: "cad_ri", mov: "Rotación interna", norm: 45 },
      { id: "cad_re", mov: "Rotación externa", norm: 45 },
    ],
  },
  {
    id: "Rodilla",
    zones: ["rodilla"],
    movs: [{ id: "rod_flex", mov: "Flexión", norm: 135 }],
  },
  {
    id: "Tobillo",
    zones: ["tobillo_pie"],
    movs: [
      { id: "tob_df", mov: "Dorsiflexión", norm: 20 },
      { id: "tob_pf", mov: "Flexión plantar", norm: 50 },
    ],
  },
];

export const ROM_NORMS = ROM_JOINTS.flatMap((j) =>
  j.movs.map((m) => ({ ...m, joint: j.id, bilateral: m.bilateral !== false })),
);

export const jointsForZones = (zones = []) =>
  ROM_JOINTS.filter((j) => j.zones.some((z) => zones.includes(z))).map((j) => j.id);

export const ODI_SECTIONS = [
  "Intensidad del dolor",
  "Cuidado personal (vestirse, asearse)",
  "Levantar objetos",
  "Caminar",
  "Estar sentado",
  "Estar de pie",
  "Dormir",
  "Actividad laboral / doméstica",
  "Vida social",
  "Viajar / desplazarse",
];

const ODI_LEVELS = [
  "0 · Sin limitación",
  "1 · Muy leve",
  "2 · Leve",
  "3 · Moderada",
  "4 · Severa",
  "5 · Imposible / máxima",
];

export const PAIN_PHASES = [
  { id: "ninguno", label: "Sin dolor" },
  { id: "inicio", label: "Al inicio" },
  { id: "medio", label: "Arco medio" },
  { id: "final", label: "Final del rango" },
  { id: "todo", label: "Todo el recorrido" },
];

export const EMPTY_CLINICAL_SCALES = {
  redFlags: [],
  pain: { actual: null, mejor: null, peor: null },
  mrc: {},
  romJoints: [],
  rom: {},
  romPain: {},
  odi: { enabled: false, answers: Array(10).fill(null) },
};

export const normalizeScales = (s) => ({
  ...EMPTY_CLINICAL_SCALES,
  ...(s || {}),
  pain: { ...EMPTY_CLINICAL_SCALES.pain, ...(s?.pain || {}) },
  odi: { ...EMPTY_CLINICAL_SCALES.odi, ...(s?.odi || {}) },
  romJoints: s?.romJoints || [],
  romPain: s?.romPain || {},
});

export const odiResult = (odi) => {
  const answered = (odi?.answers || []).filter((a) => a !== null && a !== undefined && a !== "");
  if (answered.length === 0) return null;
  const total = answered.reduce((s, a) => s + Number(a), 0);
  const pct = Math.round((total / (answered.length * 5)) * 100);
  let label = "Discapacidad mínima";
  let color = "#16a34a";
  if (pct > 80) { label = "Postrado / posible magnificación"; color = "#7f1d1d"; }
  else if (pct > 60) { label = "Discapacidad invalidante"; color = "#b91c1c"; }
  else if (pct > 40) { label = "Discapacidad severa"; color = "#ea580c"; }
  else if (pct > 20) { label = "Discapacidad moderada"; color = "#ca8a04"; }
  return { pct, label, color, answered: answered.length };
};

export const mrcTotal = (mrc) => {
  let total = 0;
  let count = 0;
  MRC_GROUPS.forEach((g) => {
    ["izq", "der"].forEach((lado) => {
      const v = mrc?.[g.id]?.[lado];
      if (v !== undefined && v !== null && v !== "") { total += Number(v); count++; }
    });
  });
  return count ? { total, count } : null;
};

/** Resumen de goniometría: % promedio y peor % respecto a lo normal */
export const romSummary = (rom = {}) => {
  const pcts = [];
  ROM_NORMS.forEach((r) => {
    ["izq", "der", "val"].forEach((k) => {
      const v = rom?.[r.id]?.[k];
      if (v !== null && v !== undefined && v !== "") pcts.push(Math.min(120, (Number(v) / r.norm) * 100));
    });
  });
  if (!pcts.length) return null;
  const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  const worst = Math.round(Math.min(...pcts));
  const status =
    worst >= 90 ? "completo" : worst >= 70 ? "limitacion_leve" : worst >= 45 ? "limitacion_moderada" : "bloqueo_severo";
  return { avg, worst, status, count: pcts.length };
};

export const romStatusLabel = (pct) =>
  pct == null
    ? null
    : pct >= 90
      ? ["Normal", "bg-emerald-100 text-emerald-700", "#16a34a"]
      : pct >= 70
        ? ["Limitación leve", "bg-amber-100 text-amber-700", "#d97706"]
        : pct >= 45
          ? ["Limitación moderada", "bg-orange-100 text-orange-700", "#ea580c"]
          : ["Limitación severa", "bg-rose-100 text-rose-700", "#dc2626"];

const painColor = (v) =>
  v === null || v === undefined ? "#cbd5e1" : v <= 3 ? "#16a34a" : v <= 6 ? "#f59e0b" : "#dc2626";

export const Card = ({ icon: Icon, title, subtitle, color = "text-blue-700", right, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-extrabold text-slate-900">{title}</h4>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5 max-w-3xl">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    {children}
  </section>
);

/* ===================== 1. BANDERAS ROJAS ===================== */
export const RedFlagsSection = ({ scales, set }) => {
  const urgent = RED_FLAGS.filter((f) => f.urgent && scales.redFlags.includes(f.id));
  const other = RED_FLAGS.filter((f) => !f.urgent && scales.redFlags.includes(f.id));
  const toggle = (id) =>
    set({
      redFlags: scales.redFlags.includes(id)
        ? scales.redFlags.filter((f) => f !== id)
        : [...scales.redFlags, id],
    });
  return (
    <Card
      icon={ShieldAlert}
      color="text-rose-600"
      title="Cribado de banderas rojas"
      subtitle="Signos de posible patología grave (cola de caballo, fractura, tumor, infección). Marque solo los presentes."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {RED_FLAGS.map((f) => {
          const on = scales.redFlags.includes(f.id);
          return (
            <button
              type="button"
              key={f.id}
              onClick={() => toggle(f.id)}
              className={`text-left px-3 py-2.5 rounded-xl border-2 text-sm font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                on
                  ? f.urgent
                    ? "bg-rose-50 border-rose-500 text-rose-800"
                    : "bg-amber-50 border-amber-500 text-amber-800"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  on ? (f.urgent ? "bg-rose-600 border-rose-600" : "bg-amber-500 border-amber-500") : "border-slate-300"
                }`}
              >
                {on && <span className="text-white text-xs font-black">✓</span>}
              </span>
              <span className="flex-1">{f.label}</span>
              {f.urgent && (
                <span className="text-xs font-black uppercase text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                  Urgente
                </span>
              )}
            </button>
          );
        })}
      </div>
      {urgent.length > 0 ? (
        <div className="mt-4 p-4 rounded-xl bg-rose-600 text-white flex gap-3 items-start">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div className="text-sm">
            <p className="font-extrabold">Derivación médica URGENTE recomendada</p>
            <p className="opacity-90">
              Signos compatibles con compromiso neurológico grave. No iniciar tratamiento con carga; derivar a
              emergencias o al médico de inmediato.
            </p>
          </div>
        </div>
      ) : other.length > 0 ? (
        <div className="mt-4 p-4 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex gap-3 items-start">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-sm">
            <b>{other.length} bandera(s) presente(s).</b> Vigilar la evolución; si no mejora con el tratamiento,
            derivar a valoración médica.
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
          <b>Ninguna señal de alarma marcada.</b> Puedes continuar con la evaluación con normalidad.
        </div>
      )}
    </Card>
  );
};

/* ===================== 2. DOLOR NRS ===================== */
export const PainSection = ({ scales, set }) => (
  <Card
    icon={Flame}
    color="text-orange-600"
    title="Intensidad del dolor (escala numérica 0-10)"
    subtitle="0 = sin dolor · 1-3 leve · 4-6 moderado · 7-10 severo."
  >
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {[
        ["actual", "Dolor actual *"],
        ["mejor", "Mínimo últimas 24 h"],
        ["peor", "Máximo últimas 24 h"],
      ].map(([k, label]) => {
        const v = scales.pain[k];
        return (
          <div key={k} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">{label}</span>
              <span className="text-2xl font-black" style={{ color: painColor(v) }}>
                {v ?? "–"}
                <span className="text-sm text-slate-400">/10</span>
              </span>
            </div>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => set({ pain: { ...scales.pain, [k]: v === n ? null : n } })}
                  className={`h-10 rounded-md text-sm font-bold transition-all cursor-pointer ${
                    v === n ? "text-white scale-110 shadow-md" : "text-slate-700 hover:scale-105"
                  }`}
                  style={{
                    background: v === n ? painColor(n) : `${painColor(n)}22`,
                    border: `1px solid ${painColor(n)}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

/* ===================== 3. GONIOMETRÍA MULTI-ARTICULAR ===================== */

// Indicador semicircular de colores: arco 0..norm (rojo → verde), agujas izq (índigo) y der (cian)
const RomGauge = ({ norm, izq, der, val }) => {
  const uid = React.useId().replace(/:/g, "");
  const max = norm * 1.15;
  const cx = 100;
  const cy = 96;
  const r = 72;
  const pt = (deg, rr = r) => {
    const a = Math.PI - (Math.min(Math.max(deg, 0), max) / max) * Math.PI;
    return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
  };
  const arc = (from, to, rr = r) => {
    const [x1, y1] = pt(from, rr);
    const [x2, y2] = pt(to, rr);
    const large = ((to - from) / max) * 180 > 180 ? 1 : 0;
    return `M${x1},${y1} A${rr},${rr} 0 ${large} 1 ${x2},${y2}`;
  };
  const needle = (v, color) => {
    if (v == null || v === "") return null;
    const deg = Number(v);
    const [x, y] = pt(deg, r - 6);
    const a = Math.PI - (Math.min(Math.max(deg, 0), max) / max) * Math.PI;
    const px = Math.sin(a) * 4;
    const py = Math.cos(a) * 4;
    return (
      <g>
        <polygon points={`${cx + px},${cy + py} ${x},${y} ${cx - px},${cy - py}`} fill={color} opacity="0.9" />
        <circle cx={x} cy={y} r="4.5" fill="white" stroke={color} strokeWidth="2.5" />
      </g>
    );
  };
  const ticks = Array.from({ length: 11 }, (_, k) => (norm * k) / 10);
  const [nx, ny] = pt(norm, r + 15);
  const etiquetas = [
    izq != null && izq !== "" ? [`I ${izq}°`, "#4f46e5"] : null,
    der != null && der !== "" ? [`D ${der}°`, "#0891b2"] : null,
    val != null && val !== "" ? [`${val}°`, "#7c3aed"] : null,
  ].filter(Boolean);
  return (
    <svg viewBox="0 0 200 128" className="w-full h-auto">
      <defs>
        <linearGradient id={`g${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="40%" stopColor="#fb923c" />
          <stop offset="68%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path d={arc(0, max)} stroke="#f1f5f9" strokeWidth="18" fill="none" strokeLinecap="round" />
      <path d={arc(0, norm)} stroke={`url(#g${uid})`} strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d={arc(norm, max)} stroke="#cbd5e1" strokeWidth="6" fill="none" strokeDasharray="3 3" />
      {ticks.map((t, k) => {
        const [x1, y1] = pt(t, r - 12);
        const [x2, y2] = pt(t, r - (k % 5 === 0 ? 19 : 16));
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={k % 5 === 0 ? 1.6 : 1} />;
      })}
      <text x={nx} y={ny} fontSize="10" fontWeight="800" fill="#15803d" textAnchor="middle">{norm}°</text>
      <text x={cx - r} y={cy + 15} fontSize="9" fill="#94a3b8" textAnchor="middle">0°</text>
      {needle(val, "#7c3aed")}
      {needle(izq, "#4f46e5")}
      {needle(der, "#0891b2")}
      <circle cx={cx} cy={cy} r="7" fill="white" stroke="#0f172a" strokeWidth="3" />
      {etiquetas.length > 0 ? (
        etiquetas.map(([t, c], k) => (
          <g key={k}>
            <rect x={cx - 52 + k * 56 - (etiquetas.length === 1 ? -28 : 0)} y={cy + 12} width="48" height="16" rx="8" fill={c} opacity="0.12" />
            <text x={cx - 28 + k * 56 - (etiquetas.length === 1 ? -28 : 0)} y={cy + 24} fontSize="10" fontWeight="800" fill={c} textAnchor="middle">{t}</text>
          </g>
        ))
      ) : (
        <text x={cx} y={cy + 24} fontSize="9" fill="#94a3b8" textAnchor="middle">Anota los grados</text>
      )}
    </svg>
  );
};

const NumIn = ({ value, onChange, color, label }) => (
  <label className="flex-1">
    <span className="block text-xs font-bold uppercase mb-0.5" style={{ color }}>
      {label}
    </span>
    <div className="relative">
      <input
        type="number"
        min="0"
        max="200"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="w-full text-base font-bold p-2 pr-6 rounded-lg border-2 text-center"
        style={{ borderColor: `${color}55` }}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">°</span>
    </div>
  </label>
);

export const RomSection = ({ scales, set, zones = [] }) => {
  const suggested = jointsForZones(zones);
  const joints = scales.romJoints;

  const toggleJoint = (id) =>
    set({ romJoints: joints.includes(id) ? joints.filter((j) => j !== id) : [...joints, id] });

  const setVal = (mid, k, v) =>
    set({ rom: { ...scales.rom, [mid]: { ...(scales.rom[mid] || {}), [k]: v } } });

  const setPain = (jid, patch) =>
    set({ romPain: { ...scales.romPain, [jid]: { ...(scales.romPain[jid] || {}), ...patch } } });

  const chartData = useMemo(
    () =>
      ROM_NORMS.filter((r) => joints.includes(r.joint))
        .map((r) => {
          const v = scales.rom[r.id] || {};
          const pc = (x) => (x == null ? null : Math.round((x / r.norm) * 100));
          return {
            name: `${r.joint} · ${r.mov}`,
            Izquierdo: r.bilateral ? pc(v.izq) : pc(v.val),
            Derecho: r.bilateral ? pc(v.der) : null,
          };
        })
        .filter((d) => d.Izquierdo != null || d.Derecho != null),
    [scales.rom, joints],
  );

  return (
    <Card
      icon={Ruler}
      color="text-cyan-700"
      title="Rango de movimiento articular (goniometría)"
      subtitle="Seleccione una o varias articulaciones a evaluar y anote los grados medidos. Se compara con el valor normal de referencia (AAOS) y entre lados: una diferencia > 10 % se marca como asimetría."
    >
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {ROM_JOINTS.map((j) => {
          const on = joints.includes(j.id);
          const sug = suggested.includes(j.id);
          return (
            <button
              type="button"
              key={j.id}
              onClick={() => toggleJoint(j.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                on
                  ? "bg-cyan-600 border-cyan-600 text-white shadow"
                  : sug
                    ? "bg-cyan-50 border-cyan-300 text-cyan-800 border-dashed"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {on ? "✓" : <Plus className="w-3.5 h-3.5" />}
              {j.id}
              {sug && !on && <span className="text-xs font-black uppercase">· zona afectada</span>}
            </button>
          );
        })}
        {suggested.some((s) => !joints.includes(s)) && (
          <button
            type="button"
            onClick={() => set({ romJoints: Array.from(new Set([...joints, ...suggested])) })}
            className="text-sm font-bold text-cyan-700 underline underline-offset-2 cursor-pointer"
          >
            Agregar todas las zonas afectadas
          </button>
        )}
      </div>

      {joints.length === 0 ? (
        <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 text-center text-slate-500 text-sm">
          <Info className="w-7 h-7 mx-auto mb-2 text-slate-400" />
          Seleccione arriba las articulaciones que desea medir. Las sugeridas provienen del mapa corporal.
        </div>
      ) : (
        <div className="space-y-5">
          {ROM_JOINTS.filter((j) => joints.includes(j.id)).map((j) => {
            const jp = scales.romPain[j.id] || {};
            return (
              <div key={j.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200">
                  <h5 className="text-base font-extrabold text-slate-900">{j.id}</h5>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-600">Dolor al movimiento:</span>
                    <select
                      value={jp.fase || "ninguno"}
                      onChange={(e) => setPain(j.id, { fase: e.target.value })}
                      className="p-1.5 rounded-lg border border-slate-300 text-sm"
                    >
                      {PAIN_PHASES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    {jp.fase && jp.fase !== "ninguno" && (
                      <>
                        <span className="font-semibold text-slate-600">NRS</span>
                        <select
                          value={jp.nrs ?? ""}
                          onChange={(e) => setPain(j.id, { nrs: e.target.value === "" ? null : Number(e.target.value) })}
                          className="p-1.5 rounded-lg border border-slate-300 text-sm w-16"
                        >
                          <option value="">–</option>
                          {Array.from({ length: 11 }, (_, n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleJoint(j.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Quitar articulación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {j.movs.map((m) => {
                    const bil = m.bilateral !== false;
                    const v = scales.rom[m.id] || {};
                    const vals = bil ? [v.izq, v.der] : [v.val];
                    const present = vals.filter((x) => x != null);
                    const worst = present.length ? Math.min(...present.map((x) => (x / m.norm) * 100)) : null;
                    const st = romStatusLabel(worst);
                    const asym =
                      bil && v.izq != null && v.der != null && Math.max(v.izq, v.der) > 0
                        ? Math.abs(v.izq - v.der) / Math.max(v.izq, v.der) > 0.1
                        : false;
                    return (
                      <div
                        key={m.id}
                        className={`bg-white rounded-xl border border-slate-200 border-t-4 p-3 ${
                          worst == null ? "border-t-slate-200" : worst >= 90 ? "border-t-emerald-500" : worst >= 70 ? "border-t-amber-400" : "border-t-rose-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800">{m.mov}</span>
                          <span className="text-xs font-mono text-slate-500">Normal 0–{m.norm}°</span>
                        </div>
                        <RomGauge norm={m.norm} izq={bil ? v.izq : null} der={bil ? v.der : null} val={bil ? null : v.val} />
                        <div className="flex gap-2">
                          {bil ? (
                            <>
                              <NumIn label="Izquierdo" color="#4f46e5" value={v.izq} onChange={(x) => setVal(m.id, "izq", x)} />
                              <NumIn label="Derecho" color="#0891b2" value={v.der} onChange={(x) => setVal(m.id, "der", x)} />
                            </>
                          ) : (
                            <NumIn label="Medido" color="#7c3aed" value={v.val} onChange={(x) => setVal(m.id, "val", x)} />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2 min-h-[22px]">
                          {st && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st[1]}`}>
                              {st[0]} · {Math.round(worst)}%
                            </span>
                          )}
                          {asym && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              Asimetría
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {chartData.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <h5 className="text-sm font-extrabold text-slate-800 mb-2">
                Resumen: % del rango normal alcanzado
              </h5>
              <div style={{ height: Math.max(260, chartData.length * 48 + 60) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 120]} unit="%" tick={{ fontSize: 13 }} />
                    <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 13, fill: "#334155" }} />
                    <Tooltip formatter={(v) => (v == null ? "–" : `${v}%`)} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <ReferenceLine x={100} stroke="#16a34a" strokeWidth={2} />
                    <ReferenceLine x={70} stroke="#f59e0b" strokeDasharray="4 4" />
                    <Bar dataKey="Izquierdo" name="Izquierdo / único" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={16} />
                    <Bar dataKey="Derecho" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

/* ===================== 4. FUERZA MRC ===================== */
export const MrcSection = ({ scales, set }) => {
  const setMRC = (gid, lado, v) =>
    set({ mrc: { ...scales.mrc, [gid]: { ...(scales.mrc[gid] || {}), [lado]: v === "" ? null : Number(v) } } });
  const data = MRC_GROUPS.map((g) => ({
    corto: g.label,
    Izquierdo: scales.mrc[g.id]?.izq ?? null,
    Derecho: scales.mrc[g.id]?.der ?? null,
  }));
  const sum = mrcTotal(scales.mrc);
  const any = data.some((d) => d.Izquierdo != null || d.Derecho != null);
  return (
    <Card
      icon={Dumbbell}
      color="text-indigo-600"
      title="Fuerza muscular (escala MRC 0-5)"
      subtitle="Test muscular manual bilateral. Evalúe solo los grupos relevantes; la suma total normal es 60."
      right={
        <div className="text-right">
          <span className="block text-xs font-bold uppercase text-slate-500">Suma MRC</span>
          <span className="text-3xl font-black text-indigo-700">
            {sum ? sum.total : "–"}
            <span className="text-base text-slate-400">/{sum ? sum.count * 5 : 60}</span>
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase">
              <th className="py-2">Grupo muscular</th>
              <th className="py-2">Izquierdo</th>
              <th className="py-2">Derecho</th>
            </tr>
          </thead>
          <tbody>
            {MRC_GROUPS.map((g) => (
              <tr key={g.id} className="border-t border-slate-100">
                <td className="py-2 font-semibold text-slate-800">{g.label}</td>
                {["izq", "der"].map((lado) => (
                  <td key={lado} className="py-2 pr-2">
                    <select
                      value={scales.mrc[g.id]?.[lado] ?? ""}
                      onChange={(e) => setMRC(g.id, lado, e.target.value)}
                      className="w-full text-sm p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">–</option>
                      {MRC_GRADES.map((m) => (
                        <option key={m.v} value={m.v}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="h-[340px] bg-slate-50 rounded-xl border border-slate-200 p-3">
          {any ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 13 }} />
                <YAxis type="category" dataKey="corto" width={160} tick={{ fontSize: 13, fill: "#334155" }} />
                <Tooltip formatter={(v) => (v == null ? "–" : `${v}/5`)} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <ReferenceLine x={5} stroke="#16a34a" strokeDasharray="4 4" />
                <Bar dataKey="Izquierdo" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={14} />
                <Bar dataKey="Derecho" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <Info className="w-7 h-7" />
              El gráfico aparece al registrar la fuerza.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

/* ===================== 5. PRUEBAS ESPECIALES ===================== */
const TEST_ZONE_KEYWORDS = {
  cervical: ["cervical"],
  hombro: ["hombro"],
  codo: ["codo"],
  muneca_mano: ["muñeca", "mano", "pulgar"],
  codo_muneca: ["codo", "muñeca"],
  columna_dorsal: ["dorsal", "lumbar"],
  lumbar: ["lumbar"],
  cadera: ["cadera"],
  rodilla: ["rodilla"],
  tobillo_pie: ["tobillo", "pie"],
};

export const SpecialTestsSection = ({ tests = [], onChange, zones = [] }) => {
  const [showAll, setShowAll] = useState(false);
  const [newName, setNewName] = useState("");
  const [newJoint, setNewJoint] = useState("");
  const keys = zones.flatMap((z) => TEST_ZONE_KEYWORDS[z] || []);
  const relevant = (t) => keys.some((k) => (t.joint || "").toLowerCase().includes(k));
  const indexed = tests.map((t, i) => ({ t, i }));
  const visible = showAll || keys.length === 0 ? indexed : indexed.filter(({ t }) => relevant(t) || t.custom);
  const positives = tests.filter((t) => t.result === "positivo").length;

  const setResult = (i, result) => onChange(tests.map((t, k) => (k === i ? { ...t, result } : t)));
  const remove = (i) => onChange(tests.filter((_, k) => k !== i));
  const add = () => {
    if (!newName.trim()) return;
    onChange([...tests, { testName: newName.trim(), joint: newJoint.trim() || "Otra", result: "positivo", custom: true }]);
    setNewName("");
    setNewJoint("");
  };

  return (
    <Card
      icon={Stethoscope}
      color="text-emerald-700"
      title="Pruebas ortopédicas especiales"
      subtitle="Se muestran las pruebas de las zonas marcadas en el mapa corporal. Registre el resultado de las que realice."
      right={
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${positives ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
          {positives} positiva(s)
        </span>
      }
    >
      {keys.length > 0 && (
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3 cursor-pointer w-fit">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="w-4 h-4" />
          Mostrar todas las pruebas ({tests.length})
        </label>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {visible.map(({ t, i }) => (
          <div
            key={`${t.testName}-${i}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
              t.result === "positivo"
                ? "border-rose-300 bg-rose-50"
                : t.result === "dudoso"
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-slate-800">{t.testName}</span>
              <span className="text-xs text-slate-500">{t.joint}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              {[
                ["negativo", "−", "bg-emerald-600"],
                ["dudoso", "?", "bg-amber-500"],
                ["positivo", "+", "bg-rose-600"],
              ].map(([r, s, c]) => (
                <button
                  type="button"
                  key={r}
                  title={r}
                  onClick={() => setResult(i, r)}
                  className={`w-9 h-9 rounded-lg text-base font-black cursor-pointer border ${
                    t.result === r ? `${c} text-white border-transparent` : "bg-white text-slate-500 border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
              {t.custom && (
                <button type="button" onClick={() => remove(i)} className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-slate-500">No hay pruebas predefinidas para estas zonas; agregue una abajo.</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Otra prueba (ej. Test de Jobe)"
          className="flex-1 text-sm p-2.5 rounded-xl border border-slate-300"
        />
        <input
          value={newJoint}
          onChange={(e) => setNewJoint(e.target.value)}
          placeholder="Articulación"
          className="sm:w-48 text-sm p-2.5 rounded-xl border border-slate-300"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-bold flex items-center gap-1 justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>
    </Card>
  );
};

/* ===================== 6. PALPACIÓN ===================== */
export const PalpationSection = ({ tone, onTone, temp, onTemp, notes, onNotes }) => (
  <Card
    icon={Hand}
    color="text-amber-700"
    title="Palpación e inspección local"
    subtitle="Tono muscular, signos inflamatorios y puntos gatillo."
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <span className="block text-sm font-bold text-slate-700 mb-2">Tono muscular</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["normotono", "Normal"],
            ["contractura_focal", "Contractura focal"],
            ["hipertono_espasmo", "Hipertono / espasmo"],
            ["hipotono", "Hipotono"],
          ].map(([v, l]) => (
            <button
              type="button"
              key={v}
              onClick={() => onTone(v)}
              className={`p-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${
                tone === v ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="block text-sm font-bold text-slate-700 mb-2">Temperatura / edema</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["normotermico", "Sin signos"],
            ["calor_local", "Calor local"],
            ["edema_leve", "Edema leve"],
            ["edema_moderado", "Edema moderado"],
          ].map(([v, l]) => (
            <button
              type="button"
              key={v}
              onClick={() => onTemp(v)}
              className={`p-2.5 rounded-xl border-2 text-sm font-bold cursor-pointer ${
                temp === v ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
    <textarea
      rows={2}
      value={notes}
      onChange={(e) => onNotes(e.target.value)}
      placeholder="Puntos gatillo, zonas dolorosas a la palpación, crepitación…"
      className="w-full mt-4 text-sm p-3 rounded-xl border border-slate-300"
    />
  </Card>
);

/* ===================== 7. OSWESTRY ===================== */
export const OdiSection = ({ scales, set }) => {
  const odi = odiResult(scales.odi);
  return (
    <Card
      icon={ClipboardList}
      color="text-violet-700"
      title="Índice de Discapacidad de Oswestry (dolor lumbar)"
      subtitle="10 secciones de 0 a 5. Resultado en %; un cambio de 10 puntos o más entre evaluaciones se considera real."
      right={
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={scales.odi.enabled}
            onChange={(e) => set({ odi: { ...scales.odi, enabled: e.target.checked } })}
            className="w-5 h-5 accent-violet-600"
          />
          Aplicar cuestionario
        </label>
      }
    >
      {scales.odi.enabled ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            {ODI_SECTIONS.map((s, i) => (
              <div key={s} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {i + 1}. {s}
                </label>
                <select
                  value={scales.odi.answers[i] ?? ""}
                  onChange={(e) => {
                    const answers = [...scales.odi.answers];
                    answers[i] = e.target.value === "" ? null : Number(e.target.value);
                    set({ odi: { ...scales.odi, answers } });
                  }}
                  className="w-full text-sm p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Sin responder</option>
                  {ODI_LEVELS.map((l, v) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Resultado ODI</span>
            <span className="text-6xl font-black my-2" style={{ color: odi ? odi.color : "#64748b" }}>
              {odi ? `${odi.pct}%` : "–"}
            </span>
            <span className="text-lg font-bold">{odi ? odi.label : "Complete el cuestionario"}</span>
            {odi && <span className="text-xs text-slate-400 mt-1">{odi.answered}/10 secciones</span>}
            <div className="w-full mt-6 space-y-1 text-left text-xs">
              {[
                ["0–20 %", "Mínima", "#16a34a"],
                ["21–40 %", "Moderada", "#ca8a04"],
                ["41–60 %", "Severa", "#ea580c"],
                ["61–80 %", "Invalidante", "#b91c1c"],
                ["81–100 %", "Postrado / magnificación", "#7f1d1d"],
              ].map(([r, l, c]) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: c }} />
                  <span className="font-mono w-16">{r}</span>
                  <span className="text-slate-300">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Recomendado cuando el motivo de consulta es dolor lumbar. Active la casilla para responderlo.
        </p>
      )}
    </Card>
  );
};
