// Evaluación postural visual (fisioterapia)
// Paso 1: vista lateral con plomada · Paso 2: rodillas y pies de frente · Paso 3: resumen + plano frontal.
// Cada opción se elige tocando una tarjeta con su dibujo; la silueta cambia en tiempo real.
// Los valores son compatibles con las evaluaciones guardadas antes (mismas claves).
import React, { useState } from "react";
import { Check, Eye, Plus, RotateCcw, Sparkles, X } from "lucide-react";

// ---------------------------------------------------------------------
// Opciones (v = valor guardado, l = etiqueta, d = descripción, n = nivel 0 normal · 1 leve · 2 marcado,
// h = cómo aparece en los hallazgos)
// ---------------------------------------------------------------------
export const OPCIONES_LATERAL = {
  headPosition: {
    titulo: "Cabeza",
    opciones: [
      { v: "alineada", l: "Alineada", d: "Oreja sobre la plomada", n: 0 },
      { v: "adelantada_leve", l: "Adelantada leve", d: "≈ 2 cm por delante", n: 1, h: "Cabeza Adelantada (Forward Head) leve" },
      { v: "adelantada_moderada", l: "Adelantada moderada", d: "≈ 4 cm por delante", n: 1, h: "Cabeza adelantada moderada" },
      { v: "adelantada_severa", l: "Adelantada severa", d: "Más de 5 cm", n: 2, h: "Cabeza Adelantada (Forward Head) severa" },
      { v: "retraccion_cervical", l: "Retraída", d: "Por detrás de la plomada", n: 1, h: "Retracción cervical" },
      { v: "extension_cefalica", l: "Mentón elevado", d: "Extensión de la cabeza", n: 1, h: "Extensión cefálica (mentón elevado)" },
      { v: "flexion_cefalica", l: "Mentón al pecho", d: "Flexión de la cabeza", n: 1, h: "Flexión cefálica (mentón descendido)" },
    ],
  },
  cervicalSpine: {
    titulo: "Columna cervical",
    opciones: [
      { v: "normal_fisiologica", l: "Lordosis normal", d: "Curva fisiológica", n: 0 },
      { v: "rectificacion_cervical", l: "Rectificada", d: "Cuello recto", n: 1, h: "Rectificación cervical" },
      { v: "hiperlordosis_cervical", l: "Hiperlordosis", d: "Curva aumentada", n: 1, h: "Hiperlordosis cervical" },
      { v: "inversion_cervical", l: "Invertida", d: "Cifosis cervical", n: 2, h: "Inversión de la curva cervical" },
    ],
  },
  shoulderPosition: {
    titulo: "Hombros",
    opciones: [
      { v: "alineados", l: "Alineados", d: "Acromion en la plomada", n: 0 },
      { v: "protraidos", l: "Adelantados", d: "Enrollados hacia adelante", n: 1, h: "Hombros Protraídos & Enrollados" },
      { v: "retraidos", l: "Retraídos", d: "Escápulas juntas atrás", n: 1, h: "Hombros retraídos" },
      { v: "elevados", l: "Elevados", d: "Hombros hacia las orejas", n: 1, h: "Hombros elevados (trapecio tenso)" },
    ],
  },
  thoracicSpine: {
    titulo: "Columna dorsal",
    opciones: [
      { v: "normal_armonica", l: "Cifosis normal", d: "Curva armónica", n: 0 },
      { v: "hipercifosis_dorsal", l: "Hipercifosis", d: "Espalda curva, flexible", n: 1, h: "Hipercifosis Dorsal Torácica" },
      { v: "hipercifosis_estructural", l: "Hipercifosis rígida", d: "No corrige al estirarse", n: 2, h: "Hipercifosis dorsal estructural" },
      { v: "espalda_plana_rectificada", l: "Dorso plano", d: "Curva disminuida", n: 1, h: "Dorso plano" },
    ],
  },
  lumbarSpine: {
    titulo: "Columna lumbar",
    opciones: [
      { v: "normal_fisiologica", l: "Lordosis normal", d: "Curva fisiológica", n: 0 },
      { v: "hiperlordosis_lumbar", l: "Hiperlordosis", d: "Arco lumbar acentuado", n: 1, h: "Hiperlordosis Lumbar" },
      { v: "rectificacion_lumbar", l: "Rectificada", d: "Espalda baja plana", n: 1, h: "Rectificación lumbar" },
      { v: "cifosis_lumbar", l: "Invertida", d: "Cifosis lumbar", n: 2, h: "Inversión de la curva lumbar" },
    ],
  },
  abdomen: {
    titulo: "Abdomen",
    opciones: [
      { v: "normal", l: "Normal", d: "Pared abdominal firme", n: 0 },
      { v: "prominente", l: "Prominente", d: "Abdomen hacia adelante", n: 1, h: "Abdomen prominente (debilidad de core)" },
    ],
  },
  pelvisTilt: {
    titulo: "Pelvis",
    opciones: [
      { v: "neutra", l: "Neutra", d: "≈ 10° de inclinación", n: 0 },
      { v: "anteversion_leve", l: "Anteversión leve", d: "Pelvis algo inclinada adelante", n: 1, h: "Anteversión pélvica leve" },
      { v: "anteversion_marcada", l: "Anteversión marcada", d: "Más de 15°", n: 2, h: "Anteversión pélvica" },
      { v: "retroversion_marcada", l: "Retroversión", d: "Pelvis hacia atrás", n: 1, h: "Retroversión pélvica" },
    ],
  },
  kneeSagittal: {
    titulo: "Rodillas (de perfil)",
    opciones: [
      { v: "neutra", l: "Neutras", d: "Extensión normal 0°", n: 0 },
      { v: "genu_recurvatum", l: "Recurvatum", d: "Hiperextensión > 5°", n: 1, h: "Genu recurvatum" },
      { v: "genu_flexo", l: "Flexo", d: "No extienden completo", n: 1, h: "Genu flexo" },
    ],
  },
  plumbLineDeviation: {
    titulo: "Línea de plomada",
    opciones: [
      { v: "equilibrada", l: "Equilibrada", d: "Cuerpo centrado", n: 0 },
      { v: "anteriorizada", l: "Hacia adelante", d: "El peso cae adelante", n: 1, h: "Línea de plomada anteriorizada" },
      { v: "posteriorizada", l: "Hacia atrás", d: "El peso cae atrás", n: 1, h: "Línea de plomada posteriorizada" },
    ],
  },
};

export const OPCIONES_RODILLAS = {
  frontalAlignment: {
    titulo: "Alineación de rodillas",
    opciones: [
      { v: "neutro_simetrico", l: "Normales", d: "Ejes rectos y simétricos", n: 0 },
      { v: "genu_valgo", l: "Genu valgo", d: "Rodillas hacia adentro (X)", n: 1, h: "Genu valgo" },
      { v: "valgo_dinamico", l: "Valgo dinámico", d: "Se van adentro al agacharse", n: 1, h: "Valgo dinámico de rodilla" },
      { v: "genu_varo", l: "Genu varo", d: "Rodillas separadas (O)", n: 1, h: "Genu varo" },
    ],
  },
  patellarTracking: {
    titulo: "Rótulas",
    opciones: [
      { v: "centrada", l: "Centradas", d: "Miran al frente", n: 0 },
      { v: "estrabismo_convergente", l: "Convergentes", d: "Miran hacia adentro", n: 1, h: "Rótulas convergentes" },
      { v: "estrabismo_divergente", l: "Divergentes", d: "Miran hacia afuera", n: 1, h: "Rótulas divergentes" },
      { v: "lateralizada", l: "Lateralizadas", d: "Desplazadas afuera", n: 1, h: "Rótula lateralizada" },
      { v: "rotula_alta", l: "Altas", d: "Patela alta", n: 1, h: "Rótula alta" },
      { v: "rotula_baja", l: "Bajas", d: "Patela baja", n: 1, h: "Rótula baja" },
    ],
  },
  effusionInflammation: {
    titulo: "Inflamación",
    opciones: [
      { v: "ausente", l: "Sin inflamación", d: "Sin edema", n: 0 },
      { v: "derrame_leve", l: "Derrame leve", d: "Hinchazón ligera", n: 1, h: "Derrame articular leve en rodilla" },
      { v: "derrame_a_tension", l: "Derrame a tensión", d: "Rodilla muy hinchada", n: 2, h: "Derrame articular a tensión en rodilla" },
      { v: "bursitis_prerrotuliana", l: "Bursitis", d: "Bulto delante de la rótula", n: 1, h: "Bursitis rotuliana" },
    ],
  },
};

export const OPCIONES_PIES = {
  plantarArch: {
    titulo: "Arco del pie",
    opciones: [
      { v: "normal", l: "Normal", d: "Arco fisiológico", n: 0 },
      { v: "pie_plano_flexible", l: "Plano flexible", d: "El arco aparece en puntas", n: 1, h: "Pie plano flexible" },
      { v: "pie_plano_rigido", l: "Plano rígido", d: "Sin arco nunca", n: 2, h: "Pie plano rígido" },
      { v: "pie_cavo", l: "Cavo", d: "Arco muy alto", n: 1, h: "Pie cavo" },
    ],
  },
  hindfootAlignment: {
    titulo: "Talón (vista de atrás)",
    opciones: [
      { v: "neutro", l: "Neutro", d: "Calcáneo vertical", n: 0 },
      { v: "valgo_retropie_pronacion", l: "Pronado", d: "Talón hacia adentro", n: 1, h: "Retropié valgo (pronación)" },
      { v: "varo_retropie_supinacion", l: "Supinado", d: "Talón hacia afuera", n: 1, h: "Retropié varo (supinación)" },
    ],
  },
  forefoot: {
    titulo: "Dedos y antepié",
    opciones: [
      { v: "normal", l: "Normales", d: "Sin deformidad", n: 0 },
      { v: "hallux_valgus", l: "Juanete", d: "Hallux valgus", n: 1, h: "Hallux valgus (juanete)" },
      { v: "dedos_garra", l: "Dedos en garra", d: "Dedos flexionados", n: 1, h: "Dedos en garra" },
    ],
  },
  achillesTendon: {
    titulo: "Tendón de Aquiles",
    opciones: [
      { v: "alineado_vertical", l: "Alineado", d: "Vertical, sin engrosar", n: 0 },
      { v: "engrosamiento", l: "Engrosado", d: "Tendinopatía", n: 1, h: "Engrosamiento del tendón de Aquiles" },
      { v: "desviacion_medial", l: "Desviado adentro", d: "Hacia medial", n: 1, h: "Aquiles desviado a medial" },
      { v: "desviacion_lateral", l: "Desviado afuera", d: "Hacia lateral", n: 1, h: "Aquiles desviado a lateral" },
    ],
  },
};

// Tipos posturales de Kendall: elegir uno rellena la vista lateral (luego se ajusta a mano)
export const TIPOS_POSTURALES = [
  { v: "ideal", l: "Ideal", d: "Todo alineado", set: {} },
  {
    v: "cifolordotica", l: "Cifolordótica", d: "Cifosis + lordosis aumentadas",
    set: { headPosition: "adelantada_leve", thoracicSpine: "hipercifosis_dorsal", lumbarSpine: "hiperlordosis_lumbar", pelvisTilt: "anteversion_marcada", abdomen: "prominente" },
  },
  {
    v: "sway_back", l: "Sway-back", d: "Pelvis adelantada, tronco atrás",
    set: { headPosition: "adelantada_leve", thoracicSpine: "hipercifosis_dorsal", lumbarSpine: "rectificacion_lumbar", pelvisTilt: "retroversion_marcada", kneeSagittal: "genu_recurvatum", plumbLineDeviation: "posteriorizada" },
  },
  {
    v: "espalda_plana", l: "Espalda plana", d: "Curvas disminuidas",
    set: { headPosition: "adelantada_leve", thoracicSpine: "espalda_plana_rectificada", lumbarSpine: "rectificacion_lumbar", pelvisTilt: "retroversion_marcada", kneeSagittal: "genu_flexo" },
  },
  {
    v: "militar", l: "Lordótica (militar)", d: "Pecho afuera, lumbar arqueada",
    set: { thoracicSpine: "espalda_plana_rectificada", lumbarSpine: "hiperlordosis_lumbar", pelvisTilt: "anteversion_marcada", kneeSagittal: "genu_recurvatum", shoulderPosition: "retraidos" },
  },
];

export const NORMAL_LATERAL = {
  headPosition: "alineada",
  cervicalSpine: "normal_fisiologica",
  shoulderPosition: "alineados",
  thoracicSpine: "normal_armonica",
  lumbarSpine: "normal_fisiologica",
  abdomen: "normal",
  pelvisTilt: "neutra",
  kneeSagittal: "neutra",
  plumbLineDeviation: "equilibrada",
  posturalType: "",
  notes: "",
};
export const NORMAL_KNEES = {
  frontalAlignment: "neutro_simetrico",
  sagittalAlignment: "neutro",
  patellarTracking: "centrada",
  effusionInflammation: "ausente",
  details: "",
};
export const NORMAL_ANKLES = {
  hindfootAlignment: "neutro",
  plantarArch: "normal",
  forefoot: "normal",
  achillesTendon: "alineado_vertical",
  details: "",
};

// Hallazgos del plano frontal (vista de frente y de espalda)
export const FRONTAL_FINDINGS = [
  { name: "Escoliosis / Asimetría Lateral", corto: "Escoliosis", desc: "Columna desviada, talle asimétrico", icon: "escoliosis" },
  { name: "Desnivel de hombros", corto: "Desnivel de hombros", desc: "Un hombro más alto", icon: "hombros" },
  { name: "Escápula alada", corto: "Escápula alada", desc: "Borde de la escápula despegado", icon: "escapula" },
  { name: "Inclinación lateral de cabeza", corto: "Cabeza inclinada", desc: "Oreja más cerca de un hombro", icon: "cabeza" },
  { name: "Inclinación pélvica lateral", corto: "Pelvis desnivelada", desc: "Crestas ilíacas a distinta altura", icon: "pelvis" },
  { name: "Rotación de tronco / pelvis", corto: "Rotación de tronco", desc: "Un lado adelantado", icon: "rotacion" },
  { name: "Dismetría de miembros inferiores", corto: "Pierna más corta", desc: "Diferencia de longitud", icon: "dismetria" },
];

const TODAS = [OPCIONES_LATERAL, OPCIONES_RODILLAS, OPCIONES_PIES];
const opcion = (grupo, campo, valor) => grupo[campo]?.opciones.find((o) => o.v === valor);
const nivelDe = (grupo, campo, valor) => opcion(grupo, campo, valor)?.n || 0;

/** Etiqueta legible de un valor (para el reporte) */
export function etiquetaPostura(campo, valor) {
  for (const g of TODAS) {
    const o = opcion(g, campo, valor);
    if (o) return o.l;
  }
  return valor ? String(valor).replace(/_/g, " ") : "";
}

// Etiquetas de hallazgos automáticos (las antiguas se mantienen para reconocerlas al editar)
const ANTIGUAS = ["Cabeza Adelantada (Forward Head) leve", "Cabeza Adelantada (Forward Head) severa"];
export const AUTO_POSTURE_LABELS = Array.from(
  new Set([...ANTIGUAS, ...TODAS.flatMap((g) => Object.values(g).flatMap((c) => c.opciones.filter((o) => o.h).map((o) => o.h)))]),
);

export const derivePostureFindings = (lateral, knees, ankles) => {
  const out = [];
  const aplicar = (obj, grupo) =>
    Object.entries(grupo).forEach(([campo, c]) => {
      const o = c.opciones.find((x) => x.v === obj?.[campo]);
      if (o?.h) out.push(o.h);
    });
  aplicar(lateral, OPCIONES_LATERAL);
  aplicar(knees, OPCIONES_RODILLAS);
  aplicar(ankles, OPCIONES_PIES);
  return out;
};

// ---------------------------------------------------------------------
// Dibujos
// ---------------------------------------------------------------------
const COLOR = ["#10b981", "#f59e0b", "#f43f5e"];
const PIEL = "#e2e8f0";
const BORDE = "#94a3b8";

/** Silueta de perfil (mira a la derecha) que cambia según la evaluación lateral */
export function SiluetaLateral({ lat, viewBox = "0 0 220 400", mini = false, foco }) {
  const L = { ...NORMAL_LATERAL, ...(lat || {}) };
  const PL = 110;
  const shift = { equilibrada: 0, anteriorizada: 8, posteriorizada: -8 }[L.plumbLineDeviation] ?? 0;
  const headShift = { alineada: 0, adelantada_leve: 6, adelantada_moderada: 11, adelantada_severa: 16, retraccion_cervical: -6, extension_cefalica: 3, flexion_cefalica: 3 }[L.headPosition] ?? 0;
  const headRot = { extension_cefalica: -18, flexion_cefalica: 18 }[L.headPosition] ?? 0;
  const sx = 96 + shift;
  const hipX = 110 + Math.round(shift * 0.5) + (L.plumbLineDeviation === "posteriorizada" ? 10 : 0);
  const knee = { neutra: [112, 285], genu_recurvatum: [102, 287], genu_flexo: [122, 283] }[L.kneeSagittal] || [112, 285];
  const ankle = [106, 362];
  const tilt = { neutra: 10, anteversion_leve: 18, anteversion_marcada: 27, retroversion_marcada: -6 }[L.pelvisTilt] ?? 10;
  const lumbarX = { normal_fisiologica: sx + 7, hiperlordosis_lumbar: sx + 16, rectificacion_lumbar: sx + 1, cifosis_lumbar: sx - 7 }[L.lumbarSpine] ?? sx + 7;
  const toracX = { normal_armonica: sx - 11, hipercifosis_dorsal: sx - 23, hipercifosis_estructural: sx - 29, espalda_plana_rectificada: sx - 3 }[L.thoracicSpine] ?? sx - 11;
  const c1 = [sx + 6 + Math.round(headShift * 0.7), 47];
  const cervX = { normal_fisiologica: sx + 7, rectificacion_cervical: sx + 2, hiperlordosis_cervical: sx + 12, inversion_cervical: sx - 5 }[L.cervicalSpine] ?? sx + 7;
  const head = [sx + 18 + headShift, 33];
  const ear = [head[0] - 4, 36];
  const acr = [PL + shift + ({ protraidos: 8, retraidos: -5 }[L.shoulderPosition] || 0), 84 - (L.shoulderPosition === "elevados" ? 6 : 0)];
  const s1 = [hipX - 13, 190];
  const l1 = [sx, 140];
  const c7 = [sx, 72];
  const panza = L.abdomen === "prominente" ? 12 : 0;
  const frente = `M ${c1[0] + 11} 54 Q ${sx + 36} 68 ${sx + 37} 102 Q ${sx + 34 + panza} 150 ${hipX + 21} 200`;
  const espalda = `M ${s1[0]} ${s1[1]} Q ${lumbarX} 165 ${l1[0]} ${l1[1]} Q ${toracX} 106 ${c7[0]} ${c7[1]} Q ${cervX} 58 ${c1[0]} ${c1[1]}`;
  const nL = nivelDe(OPCIONES_LATERAL, "lumbarSpine", L.lumbarSpine);
  const nT = nivelDe(OPCIONES_LATERAL, "thoracicSpine", L.thoracicSpine);
  const nC = Math.max(nivelDe(OPCIONES_LATERAL, "cervicalSpine", L.cervicalSpine), 0);
  const nH = nivelDe(OPCIONES_LATERAL, "headPosition", L.headPosition);
  const nP = nivelDe(OPCIONES_LATERAL, "pelvisTilt", L.pelvisTilt);
  const nK = nivelDe(OPCIONES_LATERAL, "kneeSagittal", L.kneeSagittal);
  const nS = nivelDe(OPCIONES_LATERAL, "shoulderPosition", L.shoulderPosition);
  const punto = (x, y, ok, etiqueta) => (
    <g>
      <circle cx={x} cy={y} r={mini ? 3.5 : 4} fill={ok ? COLOR[0] : COLOR[1]} stroke="white" strokeWidth="1.5" />
      {!mini && etiqueta && (
        <text x={x + 9} y={y + 3} fontSize="9" fill="#475569" fontWeight="600">{etiqueta}</text>
      )}
    </g>
  );
  const resalta = (campos) => !foco || campos.includes(foco);
  return (
    <svg viewBox={viewBox} className="w-full h-full" role="img" aria-label="Silueta lateral">
      {/* plomada */}
      <line x1={PL} y1="6" x2={PL} y2="384" stroke="#ef4444" strokeWidth={mini ? 1.4 : 1.6} strokeDasharray="5 4" opacity="0.8" />
      {!mini && <circle cx={PL} cy="8" r="4" fill="#ef4444" />}
      {/* piernas */}
      <path d={`M ${hipX} 200 L ${knee[0]} ${knee[1]} L ${ankle[0]} ${ankle[1]}`} fill="none" stroke={PIEL} strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${hipX} 200 L ${knee[0]} ${knee[1]} L ${ankle[0]} ${ankle[1]}`} fill="none" stroke={BORDE} strokeWidth="1.2" strokeLinejoin="round" opacity="0.7" />
      <path d={`M ${ankle[0] - 12} 374 Q ${ankle[0] - 8} 362 ${ankle[0] + 2} 364 L ${ankle[0] + 34} 372 Q ${ankle[0] + 38} 378 ${ankle[0] + 32} 380 L ${ankle[0] - 12} 380 Z`} fill={PIEL} stroke={BORDE} strokeWidth="1" />
      <line x1="70" y1="381" x2="160" y2="381" stroke="#cbd5e1" strokeWidth="2" />
      {/* tronco */}
      <path d={`${espalda} L ${c1[0] + 10} 52 ${frente.replace("M", "L")} Z`} fill={PIEL} stroke={BORDE} strokeWidth="1" opacity={resalta(["abdomen", "thoracicSpine", "lumbarSpine", "pelvisTilt"]) ? 1 : 0.6} />
      {/* pelvis */}
      <g transform={`rotate(${tilt} ${hipX} 194)`}>
        <rect x={hipX - 21} y={183} width="40" height="23" rx="10" fill="white" stroke={COLOR[nP]} strokeWidth={resalta(["pelvisTilt"]) ? 3 : 2} opacity="0.95" />
        <line x1={hipX - 21} y1={195} x2={hipX + 19} y2={195} stroke={COLOR[nP]} strokeWidth="1" strokeDasharray="2 2" />
      </g>
      {/* columna por tramos */}
      <path d={`M ${s1[0]} ${s1[1]} Q ${lumbarX} 165 ${l1[0]} ${l1[1]}`} fill="none" stroke={COLOR[nL]} strokeWidth={resalta(["lumbarSpine"]) ? 5 : 3.5} strokeLinecap="round" />
      <path d={`M ${l1[0]} ${l1[1]} Q ${toracX} 106 ${c7[0]} ${c7[1]}`} fill="none" stroke={COLOR[nT]} strokeWidth={resalta(["thoracicSpine"]) ? 5 : 3.5} strokeLinecap="round" />
      <path d={`M ${c7[0]} ${c7[1]} Q ${cervX} 58 ${c1[0]} ${c1[1]}`} fill="none" stroke={COLOR[nC]} strokeWidth={resalta(["cervicalSpine"]) ? 5 : 3.5} strokeLinecap="round" />
      {/* brazo y hombro */}
      <path d={`M ${acr[0]} ${acr[1]} Q ${acr[0] + 4} ${acr[1] + 45} ${acr[0] + 2} ${acr[1] + 92}`} fill="none" stroke={PIEL} strokeWidth="13" strokeLinecap="round" />
      <path d={`M ${acr[0]} ${acr[1]} Q ${acr[0] + 4} ${acr[1] + 45} ${acr[0] + 2} ${acr[1] + 92}`} fill="none" stroke={BORDE} strokeWidth="1" opacity="0.6" />
      <circle cx={acr[0]} cy={acr[1]} r="9" fill="white" stroke={COLOR[nS]} strokeWidth={resalta(["shoulderPosition"]) ? 3 : 2} />
      {/* cabeza */}
      <g transform={`rotate(${headRot} ${head[0]} ${head[1]})`}>
        <circle cx={head[0]} cy={head[1]} r="16" fill={PIEL} stroke={COLOR[nH]} strokeWidth={resalta(["headPosition"]) ? 3 : 2} />
        <path d={`M ${head[0] + 15} ${head[1] - 2} L ${head[0] + 21} ${head[1] + 3} L ${head[0] + 15} ${head[1] + 6}`} fill={PIEL} stroke={BORDE} strokeWidth="1" />
        <circle cx={head[0] + 7} cy={head[1] - 4} r="1.6" fill="#475569" />
      </g>
      {/* rodilla */}
      <circle cx={knee[0]} cy={knee[1]} r="7" fill="white" stroke={COLOR[nK]} strokeWidth={resalta(["kneeSagittal"]) ? 3 : 2} />
      {/* puntos de la plomada */}
      {punto(ear[0], ear[1], Math.abs(ear[0] - PL) <= 3, "Oreja")}
      {punto(acr[0], acr[1] - 10, Math.abs(acr[0] - PL) <= 3, "Acromion")}
      {punto(hipX, 196, Math.abs(hipX - PL) <= 3, "Trocánter")}
      {punto(knee[0] - 6, knee[1], nK === 0, "Rodilla")}
      {punto(ankle[0], ankle[1], true, "Maléolo")}
    </svg>
  );
}

/** Piernas de frente (rodillas, rótulas, inflamación) */
export function PiernasFrente({ kn, an, mini = false, viewBox = "0 0 220 290" }) {
  const K = { ...NORMAL_KNEES, ...(kn || {}) };
  const A = { ...NORMAL_ANKLES, ...(an || {}) };
  const tipo = K.frontalAlignment;
  const rod = { genu_valgo: [97, 123], valgo_dinamico: [97, 123], genu_varo: [70, 150] }[tipo] || [84, 136];
  const tob = { genu_valgo: [80, 140], valgo_dinamico: [80, 140], genu_varo: [92, 128] }[tipo] || [86, 134];
  const cad = [78, 142];
  const off = { estrabismo_convergente: [5, 0], estrabismo_divergente: [-5, 0], lateralizada: [-7, 0], rotula_alta: [0, -13], rotula_baja: [0, 10] }[K.patellarTracking] || [0, 0];
  const nK = nivelDe(OPCIONES_RODILLAS, "frontalAlignment", tipo);
  const nR = nivelDe(OPCIONES_RODILLAS, "patellarTracking", K.patellarTracking);
  const inflam = { derrame_leve: 0.25, derrame_a_tension: 0.45, bursitis_prerrotuliana: 0.3 }[K.effusionInflammation] || 0;
  const pron = { valgo_retropie_pronacion: 1, varo_retropie_supinacion: -1 }[A.hindfootAlignment] || 0;
  const pierna = (lado) => {
    const s = lado === 0 ? 1 : -1; // izquierda del dibujo = pierna derecha del paciente
    const h = [cad[lado], 22];
    const k = [rod[lado], 140];
    const t = [tob[lado], 258];
    const pat = [k[0] + off[0] * s, k[1] + off[1]];
    return (
      <g key={lado}>
        <path d={`M ${h[0]} ${h[1]} L ${k[0]} ${k[1]} L ${t[0]} ${t[1]}`} fill="none" stroke={PIEL} strokeWidth="21" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M ${h[0]} ${h[1]} L ${k[0]} ${k[1]} L ${t[0]} ${t[1]}`} fill="none" stroke={BORDE} strokeWidth="1" strokeLinejoin="round" opacity="0.6" />
        <line x1={h[0]} y1={h[1]} x2={t[0]} y2={t[1]} stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
        {inflam > 0 && <circle cx={k[0]} cy={k[1]} r="21" fill="#38bdf8" opacity={inflam} />}
        <circle cx={k[0]} cy={k[1]} r="10" fill="white" stroke={COLOR[nK]} strokeWidth="2.5" />
        <ellipse cx={pat[0]} cy={pat[1]} rx="5.5" ry="7" fill={nR ? "#fde68a" : "#d1fae5"} stroke={COLOR[nR]} strokeWidth="1.8" />
        <g transform={`rotate(${pron * 10 * s} ${t[0]} ${t[1]})`}>
          <ellipse cx={t[0] - 4 * s} cy={t[1] + 14} rx="15" ry="9" fill={PIEL} stroke={BORDE} strokeWidth="1" />
        </g>
      </g>
    );
  };
  return (
    <svg viewBox={viewBox} className="w-full h-full" role="img" aria-label="Piernas de frente">
      <rect x="62" y="10" width="96" height="24" rx="12" fill="white" stroke={BORDE} strokeWidth="1" />
      {!mini && <text x="110" y="26" fontSize="9" textAnchor="middle" fill="#64748b" fontWeight="600">Pelvis</text>}
      {pierna(0)}
      {pierna(1)}
      {!mini && (
        <>
          <text x="22" y="144" fontSize="9" fill="#64748b" fontWeight="600">Der.</text>
          <text x="180" y="144" fontSize="9" fill="#64748b" fontWeight="600">Izq.</text>
        </>
      )}
    </svg>
  );
}

/** Huella plantar: normal, plana o cava */
function Huella({ tipo }) {
  const corte = { normal: { rx: 9, ry: 19, cx: 16 }, pie_plano_flexible: { rx: 4, ry: 12, cx: 12 }, pie_plano_rigido: null, pie_cavo: { rx: 13, ry: 24, cx: 18 } }[tipo];
  return (
    <svg viewBox="0 0 40 72" className="h-14 w-8">
      <path d="M20 4 C 31 4 34 16 32 28 C 30 40 33 52 30 62 C 28 69 14 70 11 63 C 8 55 12 44 9 32 C 6 18 9 4 20 4 Z" fill={tipo === "pie_cavo" ? "#fda4af" : "#63dce3"} />
      {corte && <ellipse cx={corte.cx} cy="38" rx={corte.rx} ry={corte.ry} fill="white" />}
      {tipo === "pie_cavo" && <rect x="6" y="34" width="28" height="8" fill="white" />}
      {[["13", "6"], ["19", "5"], ["24", "6"], ["28", "8"], ["31", "11"]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 2.6 : 1.8} fill={tipo === "pie_cavo" ? "#fda4af" : "#63dce3"} transform="translate(0 -3)" />
      ))}
    </svg>
  );
}

/** Talón visto de atrás */
function Talon({ tipo }) {
  const a = { valgo_retropie_pronacion: 12, varo_retropie_supinacion: -12, desviacion_medial: 10, desviacion_lateral: -10 }[tipo] || 0;
  const grueso = tipo === "engrosamiento";
  return (
    <svg viewBox="0 0 40 72" className="h-14 w-8">
      <rect x="13" y="2" width="14" height="38" rx="6" fill={PIEL} stroke={BORDE} />
      <g transform={`rotate(${a} 20 44)`}>
        <line x1="20" y1="10" x2="20" y2="52" stroke="#f59e0b" strokeWidth={grueso ? 5 : 2.5} strokeLinecap="round" />
        <ellipse cx="20" cy="56" rx="11" ry="12" fill={PIEL} stroke={BORDE} />
      </g>
      <line x1="20" y1="2" x2="20" y2="70" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2 2" />
    </svg>
  );
}

/** Antepié visto desde arriba */
function Antepie({ tipo }) {
  return (
    <svg viewBox="0 0 40 72" className="h-14 w-8">
      <path d="M12 68 C 6 50 6 30 9 18 C 12 8 30 6 33 18 C 36 30 34 50 30 68 Z" fill={PIEL} stroke={BORDE} />
      {tipo === "hallux_valgus" ? (
        <>
          <ellipse cx="15" cy="10" rx="4" ry="6" fill="#fde68a" stroke={BORDE} transform="rotate(25 15 10)" />
          <circle cx="9" cy="24" r="4" fill="#fda4af" />
        </>
      ) : (
        <ellipse cx="13" cy="8" rx="4" ry="6" fill={PIEL} stroke={BORDE} />
      )}
      {[19, 24, 28, 31].map((x, i) =>
        tipo === "dedos_garra" ? (
          <path key={i} d={`M ${x} 14 q 2 -6 0 -9`} stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <circle key={i} cx={x} cy={10 + i} r="2.4" fill={PIEL} stroke={BORDE} />
        ),
      )}
    </svg>
  );
}

/** Mini dibujo para el plano frontal */
function IconoFrontal({ icon, activo }) {
  // La deformidad siempre en rojo (más intensa y gruesa al marcarla); el cuerpo
  // con contorno oscuro para que se vea en modo claro y oscuro.
  const c = activo ? "#dc2626" : "#ef4444";
  const g = activo ? 1.35 : 1;
  const piel = "#d7dfe8";
  const borde = "#64748b";
  const cuerpo = (
    <>
      <circle cx="20" cy="9" r="6" fill={piel} stroke={borde} />
      <rect x="11" y="17" width="18" height="24" rx="5" fill={piel} stroke={borde} />
      <line x1="15" y1="41" x2="14" y2="66" stroke={borde} strokeWidth="7.5" strokeLinecap="round" />
      <line x1="25" y1="41" x2="26" y2="66" stroke={borde} strokeWidth="7.5" strokeLinecap="round" />
      <line x1="15" y1="41" x2="14" y2="66" stroke={piel} strokeWidth="5.5" strokeLinecap="round" />
      <line x1="25" y1="41" x2="26" y2="66" stroke={piel} strokeWidth="5.5" strokeLinecap="round" />
    </>
  );
  const extra = {
    escoliosis: <path d="M20 18 Q 27 26 20 32 Q 13 37 20 42" stroke={c} strokeWidth={2.8 * g} fill="none" strokeLinecap="round" />,
    hombros: <line x1="8" y1="15" x2="32" y2="21" stroke={c} strokeWidth={3.2 * g} strokeLinecap="round" />,
    escapula: <path d="M24 22 l 6 -3 l 1 9 z" fill={c} stroke={c} strokeWidth={g} strokeLinejoin="round" />,
    cabeza: <line x1="13" y1="2" x2="27" y2="16" stroke={c} strokeWidth={2.8 * g} strokeLinecap="round" />,
    pelvis: <line x1="9" y1="37" x2="31" y2="43" stroke={c} strokeWidth={3.2 * g} strokeLinecap="round" />,
    rotacion: <path d="M7 29 A 13 6 0 1 0 33 29" stroke={c} strokeWidth={2.6 * g} fill="none" strokeLinecap="round" />,
    dismetria: <line x1="9" y1="68" x2="31" y2="63" stroke={c} strokeWidth={3.2 * g} strokeLinecap="round" />,
  }[icon];
  return (
    <svg viewBox="0 0 40 72" className="h-[104px] w-[58px]">
      {cuerpo}
      {extra}
    </svg>
  );
}

// ---------------------------------------------------------------------
// Tarjetas de opciones
// ---------------------------------------------------------------------
const VISTAS_LATERAL = {
  headPosition: "64 6 100 84",
  cervicalSpine: "60 20 90 80",
  shoulderPosition: "60 40 110 100",
  thoracicSpine: "48 50 110 110",
  lumbarSpine: "52 120 110 100",
  abdomen: "60 80 110 140",
  pelvisTilt: "60 150 110 80",
  kneeSagittal: "60 230 110 150",
  plumbLineDeviation: "40 0 140 400",
};

function Grupo({ titulo, children, nivel }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: COLOR[nivel || 0] }} />
        {titulo}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Tarjeta({ activo, nivel, onClick, disabled, dibujo, titulo, desc, alto = "h-14", ancho = "w-[92px]" }) {
  const borde = activo ? (nivel === 0 ? "border-emerald-500 bg-emerald-50" : nivel === 2 ? "border-rose-500 bg-rose-50" : "border-amber-500 bg-amber-50") : "border-slate-200 bg-white hover:border-slate-400";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={desc}
      className={`relative ${ancho} rounded-xl border-2 p-1 pb-1.5 text-center transition-colors cursor-pointer disabled:cursor-default ${borde}`}
    >
      {activo && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center">
          <Check className="w-3 h-3" />
        </span>
      )}
      <div className={`${alto} flex items-center justify-center`}>{dibujo}</div>
      <p className="text-[11px] font-bold leading-tight text-slate-800 mt-0.5">{titulo}</p>
      <p className="text-[10px] leading-tight text-slate-500">{desc}</p>
    </button>
  );
}

// ---------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------
export const PostureVisualSelector = ({
  selectedFindings = [],
  onToggleFinding,
  onAddCustomFinding,
  onRemoveFinding,
  notes = "",
  onNotesChange,
  lateralEvaluation,
  onLateralEvaluationChange,
  visualKnees,
  onVisualKneesChange,
  visualAnkles,
  onVisualAnklesChange,
  readOnly = false,
}) => {
  const [tab, setTab] = useState("lateral");
  const [otro, setOtro] = useState("");
  const L = { ...NORMAL_LATERAL, ...(lateralEvaluation || {}) };
  const K = { ...NORMAL_KNEES, ...(visualKnees || {}) };
  const A = { ...NORMAL_ANKLES, ...(visualAnkles || {}) };
  const auto = derivePostureFindings(L, K, A);
  const setL = (campo, v) => onLateralEvaluationChange?.({ ...L, [campo]: v });
  const setK = (campo, v) => onVisualKneesChange?.({ ...K, [campo]: v });
  const setA = (campo, v) => onVisualAnklesChange?.({ ...A, [campo]: v });
  const aplicarTipo = (t) => onLateralEvaluationChange?.({ ...NORMAL_LATERAL, notes: L.notes, ...t.set, posturalType: t.v });

  const frontales = FRONTAL_FINDINGS.map((f) => f.name);
  const otros = selectedFindings.filter((f) => !frontales.includes(f) && !AUTO_POSTURE_LABELS.includes(f));
  const total = auto.length + selectedFindings.filter((f) => !AUTO_POSTURE_LABELS.includes(f)).length;
  const alterLateral = Object.keys(OPCIONES_LATERAL).filter((c) => nivelDe(OPCIONES_LATERAL, c, L[c]) > 0).length;
  const alterPiernas =
    Object.keys(OPCIONES_RODILLAS).filter((c) => nivelDe(OPCIONES_RODILLAS, c, K[c]) > 0).length +
    Object.keys(OPCIONES_PIES).filter((c) => nivelDe(OPCIONES_PIES, c, A[c]) > 0).length;

  const agregarOtro = (e) => {
    e?.preventDefault();
    const t = otro.trim();
    if (!t) return;
    (onAddCustomFinding || onToggleFinding)?.(t);
    setOtro("");
  };
  const redactar = () => {
    const lista = [...auto, ...selectedFindings.filter((f) => !AUTO_POSTURE_LABELS.includes(f))];
    const tipo = TIPOS_POSTURALES.find((t) => t.v === L.posturalType && t.v !== "ideal");
    const txt = lista.length
      ? `${tipo ? `Patrón postural ${tipo.l.toLowerCase()}. ` : ""}Se observa: ${lista.join(", ").toLowerCase()}.`
      : "Alineación postural dentro de parámetros normales, sin alteraciones relevantes.";
    onNotesChange?.(txt);
  };

  const TABS = [
    ["lateral", "1. De perfil", alterLateral],
    ["piernas", "2. Rodillas y pies", alterPiernas],
    ["resumen", "3. Resumen", total],
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-600" /> Evaluación postural
          </h4>
          <p className="text-xs text-slate-500">Toca la tarjeta que corresponde; el dibujo cambia solo. Verde = normal · ámbar = leve · rojo = marcado.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {TABS.map(([id, txt, n]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 ${tab === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {txt}
              {n > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">{n}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ============ 1. DE PERFIL ============ */}
      {tab === "lateral" && (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 lg:sticky lg:top-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-600">Vista de perfil</span>
              <span className="text-[11px] text-rose-500 font-semibold">— plomada</span>
            </div>
            <div className="h-[380px]">
              <SiluetaLateral lat={L} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Normal: la plomada pasa por oreja, acromion, trocánter, delante de la rodilla y delante del maléolo.
            </p>
            {!readOnly && alterLateral > 0 && (
              <button type="button" onClick={() => onLateralEvaluationChange?.({ ...NORMAL_LATERAL, notes: L.notes })} className="mt-2 w-full text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" /> Marcar todo normal
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-600">Tipo postural (Kendall) · un clic rellena todo</p>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS_POSTURALES.map((t) => (
                  <Tarjeta
                    key={t.v}
                    disabled={readOnly}
                    activo={L.posturalType === t.v}
                    nivel={t.v === "ideal" ? 0 : 1}
                    onClick={() => aplicarTipo(t)}
                    titulo={t.l}
                    desc={t.d}
                    alto="h-24"
                    dibujo={<div className="h-24 w-full"><SiluetaLateral lat={{ ...NORMAL_LATERAL, ...t.set }} viewBox="55 0 110 392" mini /></div>}
                  />
                ))}
              </div>
            </div>
            {Object.entries(OPCIONES_LATERAL).map(([campo, c]) => (
              <Grupo key={campo} titulo={c.titulo} nivel={nivelDe(OPCIONES_LATERAL, campo, L[campo])}>
                {c.opciones.map((o) => (
                  <Tarjeta
                    key={o.v}
                    disabled={readOnly}
                    activo={L[campo] === o.v}
                    nivel={o.n}
                    onClick={() => setL(campo, o.v)}
                    titulo={o.l}
                    desc={o.d}
                    dibujo={
                      <div className="h-14 w-full">
                        <SiluetaLateral lat={{ ...NORMAL_LATERAL, [campo]: o.v }} viewBox={VISTAS_LATERAL[campo]} mini foco={campo} />
                      </div>
                    }
                  />
                ))}
              </Grupo>
            ))}
            <textarea
              disabled={readOnly}
              rows={2}
              value={L.notes || ""}
              onChange={(e) => setL("notes", e.target.value)}
              placeholder="Notas de la vista de perfil (opcional)"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
            />
          </div>
        </div>
      )}

      {/* ============ 2. RODILLAS Y PIES ============ */}
      {tab === "piernas" && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 lg:sticky lg:top-2">
            <span className="text-xs font-bold text-slate-600">Vista de frente</span>
            <div className="h-[320px]">
              <PiernasFrente kn={K} an={A} />
            </div>
            <div className="flex justify-around border-t border-slate-100 pt-2">
              <div className="text-center"><Huella tipo={A.plantarArch} /><p className="text-[10px] text-slate-500">Huella</p></div>
              <div className="text-center"><Talon tipo={A.hindfootAlignment} /><p className="text-[10px] text-slate-500">Talón</p></div>
              <div className="text-center"><Antepie tipo={A.forefoot} /><p className="text-[10px] text-slate-500">Dedos</p></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Rodillas</p>
              {Object.entries(OPCIONES_RODILLAS).map(([campo, c]) => (
                <Grupo key={campo} titulo={c.titulo} nivel={nivelDe(OPCIONES_RODILLAS, campo, K[campo])}>
                  {c.opciones.map((o) => (
                    <Tarjeta
                      key={o.v}
                      disabled={readOnly}
                      activo={K[campo] === o.v}
                      nivel={o.n}
                      onClick={() => setK(campo, o.v)}
                      titulo={o.l}
                      desc={o.d}
                      dibujo={<div className="h-14 w-full"><PiernasFrente kn={{ ...NORMAL_KNEES, [campo]: o.v }} mini viewBox={campo === "frontalAlignment" ? "40 10 140 270" : "45 95 130 90"} /></div>}
                    />
                  ))}
                </Grupo>
              ))}
              <input disabled={readOnly} value={K.details || ""} onChange={(e) => setK("details", e.target.value)} placeholder="Detalle de rodilla (opcional): dolor en interlínea, crepitación…" className="w-full rounded-xl border border-slate-300 p-2.5 text-sm" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tobillos y pies</p>
              {Object.entries(OPCIONES_PIES).map(([campo, c]) => (
                <Grupo key={campo} titulo={c.titulo} nivel={nivelDe(OPCIONES_PIES, campo, A[campo])}>
                  {c.opciones.map((o) => (
                    <Tarjeta
                      key={o.v}
                      disabled={readOnly}
                      activo={A[campo] === o.v}
                      nivel={o.n}
                      onClick={() => setA(campo, o.v)}
                      titulo={o.l}
                      desc={o.d}
                      dibujo={
                        campo === "plantarArch" ? <Huella tipo={o.v} /> : campo === "forefoot" ? <Antepie tipo={o.v} /> : <Talon tipo={o.v} />
                      }
                    />
                  ))}
                </Grupo>
              ))}
              <input disabled={readOnly} value={A.details || ""} onChange={(e) => setA("details", e.target.value)} placeholder="Detalle de tobillo/pie (opcional): apoyo en borde externo, dolor en talón…" className="w-full rounded-xl border border-slate-300 p-2.5 text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* ============ 3. RESUMEN ============ */}
      {tab === "resumen" && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-4 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 grid grid-cols-2 gap-2 lg:sticky lg:top-2">
            <div className="h-56"><SiluetaLateral lat={L} mini /></div>
            <div className="h-56"><PiernasFrente kn={K} an={A} mini /></div>
            <p className="col-span-2 text-center text-xs text-slate-500">
              {total === 0 ? "Sin alteraciones" : `${total} hallazgo${total === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600">Hallazgos de los pasos 1 y 2 <span className="font-normal text-slate-400">· se cambian en esos pasos</span></p>
              {auto.length === 0 ? (
                <p className="text-sm text-emerald-700 font-semibold">✓ Alineación sin alteraciones registradas.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {auto.map((f) => (
                    <span key={f} className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">{f}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600">Vista de frente y de espalda <span className="font-normal text-slate-400">· marca solo lo que observes</span></p>
              <div className="flex flex-wrap gap-1.5">
                {FRONTAL_FINDINGS.map((f) => {
                  const on = selectedFindings.includes(f.name);
                  return (
                    <Tarjeta
                      key={f.name}
                      disabled={readOnly}
                      activo={on}
                      nivel={1}
                      onClick={() => onToggleFinding?.(f.name)}
                      titulo={f.corto}
                      desc={f.desc}
                      alto="h-[108px]"
                      ancho="w-[118px]"
                      dibujo={<IconoFrontal icon={f.icon} activo={on} />}
                    />
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600">Otros hallazgos</p>
              {otros.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {otros.map((f) => (
                    <span key={f} className="pl-2.5 pr-1 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1">
                      {f}
                      {!readOnly && (
                        <button type="button" onClick={() => (onRemoveFinding || onToggleFinding)?.(f)} className="text-slate-400 hover:text-rose-600 cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {!readOnly && (
                <div className="flex gap-2">
                  <input value={otro} onChange={(e) => setOtro(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregarOtro(e)} placeholder="Ej. Hipotrofia de cuádriceps derecho, cicatriz en rodilla…" className="flex-1 rounded-xl border border-slate-300 p-2 text-sm" />
                  <button type="button" onClick={agregarOtro} className="px-3 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center gap-1 cursor-pointer">
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-600">Conclusión postural</p>
                {!readOnly && (
                  <button type="button" onClick={redactar} className="text-xs font-bold text-cyan-700 flex items-center gap-1 cursor-pointer">
                    <Sparkles className="w-3.5 h-3.5" /> Redactar con los hallazgos
                  </button>
                )}
              </div>
              <textarea
                disabled={readOnly}
                rows={3}
                value={notes}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Ej. Patrón cifolordótico con cabeza adelantada; priorizar movilidad dorsal y estiramiento de pectorales."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
