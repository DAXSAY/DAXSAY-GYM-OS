import React, { useState } from "react";
import { Check, Eye, Plus, Sliders, Activity } from "lucide-react";

export const NORMAL_LATERAL = {
  headPosition: "alineada",
  cervicalSpine: "normal_fisiologica",
  thoracicSpine: "normal_armonica",
  lumbarSpine: "normal_fisiologica",
  pelvisTilt: "neutra",
  kneeSagittal: "neutra",
  plumbLineDeviation: "equilibrada",
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
  achillesTendon: "alineado_vertical",
  details: "",
};

// Hallazgos que se generan solos a partir de lo marcado en vista lateral y rodillas/pies
const AUTO_RULES = [
  ["headPosition", "adelantada_leve", "Cabeza Adelantada (Forward Head) leve"],
  ["headPosition", "adelantada_severa", "Cabeza Adelantada (Forward Head) severa"],
  ["headPosition", "retraccion_cervical", "Retracción cervical"],
  ["cervicalSpine", "rectificacion_cervical", "Rectificación cervical"],
  ["cervicalSpine", "hiperlordosis_cervical", "Hiperlordosis cervical"],
  ["thoracicSpine", "hipercifosis_dorsal", "Hipercifosis Dorsal Torácica"],
  ["thoracicSpine", "espalda_plana_rectificada", "Dorso plano"],
  ["lumbarSpine", "hiperlordosis_lumbar", "Hiperlordosis Lumbar"],
  ["lumbarSpine", "rectificacion_lumbar", "Rectificación lumbar"],
  ["pelvisTilt", "anteversion_marcada", "Anteversión pélvica"],
  ["pelvisTilt", "retroversion_marcada", "Retroversión pélvica"],
  ["kneeSagittal", "genu_recurvatum", "Genu recurvatum"],
  ["kneeSagittal", "genu_flexo", "Genu flexo"],
  ["plumbLineDeviation", "anteriorizada", "Línea de plomada anteriorizada"],
  ["plumbLineDeviation", "posteriorizada", "Línea de plomada posteriorizada"],
];
const KNEE_RULES = [
  ["frontalAlignment", "genu_valgo", "Genu valgo"],
  ["frontalAlignment", "genu_varo", "Genu varo"],
  ["patellarTracking", "estrabismo_convergente", "Rótulas convergentes"],
  ["patellarTracking", "estrabismo_divergente", "Rótulas divergentes"],
  ["patellarTracking", "rotula_alta", "Rótula alta"],
  ["patellarTracking", "rotula_baja", "Rótula baja"],
  ["effusionInflammation", "derrame_leve", "Derrame articular leve en rodilla"],
  ["effusionInflammation", "derrame_a_tension", "Derrame articular a tensión en rodilla"],
  ["effusionInflammation", "bursitis_prerrotuliana", "Bursitis rotuliana"],
];
const ANKLE_RULES = [
  ["hindfootAlignment", "valgo_retropie_pronacion", "Retropié valgo (pronación)"],
  ["hindfootAlignment", "varo_retropie_supinacion", "Retropié varo (supinación)"],
  ["plantarArch", "pie_plano_flexible", "Pie plano flexible"],
  ["plantarArch", "pie_plano_rigido", "Pie plano rígido"],
  ["plantarArch", "pie_cavo", "Pie cavo"],
  ["achillesTendon", "engrosamiento", "Engrosamiento del tendón de Aquiles"],
  ["achillesTendon", "desviacion_medial", "Aquiles desviado a medial"],
  ["achillesTendon", "desviacion_lateral", "Aquiles desviado a lateral"],
];

export const AUTO_POSTURE_LABELS = [...AUTO_RULES, ...KNEE_RULES, ...ANKLE_RULES].map((r) => r[2]);

export const derivePostureFindings = (lateral, knees, ankles) => {
  const out = [];
  const apply = (obj, rules) =>
    rules.forEach(([k, v, label]) => {
      if (obj && obj[k] === v) out.push(label);
    });
  apply(lateral, AUTO_RULES);
  apply(knees, KNEE_RULES);
  apply(ankles, ANKLE_RULES);
  return out;
};

// Hallazgos del plano frontal que no se ven en la vista lateral
export const FRONTAL_FINDINGS = [
  { name: "Escoliosis / Asimetría Lateral", desc: "Desviación lateral de columna, triángulos del talle asimétricos." },
  { name: "Hombros Protraídos & Enrollados", desc: "Rotación interna humeral; riesgo de pinzamiento subacromial." },
  { name: "Desnivel de hombros", desc: "Un acromion más alto que el otro en vista posterior." },
  { name: "Escápula alada", desc: "Borde medial de la escápula despegado del tórax." },
  { name: "Inclinación pélvica lateral", desc: "Crestas ilíacas a distinta altura." },
  { name: "Rotación de tronco / pelvis", desc: "Un hemicuerpo adelantado respecto al otro." },
];

export const POSTURE_PRESETS = [
  {
    id: "pos-neutral",
    name: "Alineación Neutral Equilibrada",
    type: "neutral",
    shortDesc:
      "Línea de plomada pasa por conducto auditivo, acromion, trocánter y maléolo.",
    clinicalSigns:
      "Curvaturas fisiológicas armónicas, pelvis neutra y simetría bilateral.",
    badge: "Alineación Normal",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "pos-cabeza",
    name: "Cabeza Adelantada (Forward Head)",
    type: "cabeza_adelantada",
    shortDesc:
      "Oreja por delante de la línea acromial con hiperextensión suboccipital.",
    clinicalSigns:
      "Sobrecarga de trapecios superiores y debilidad de flexores profundos del cuello.",
    badge: "Cervical Alterada",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    id: "pos-cifosis",
    name: "Hipercifosis Dorsal Torácica",
    type: "cifosis_dorsal",
    shortDesc:
      'Curva dorsal exagerada ("joroba") con escápulas en abducción/campaneo.',
    clinicalSigns:
      "Acortamiento pectoral menor, debilidad de romboides y trapecio medio.",
    badge: "Dorsal Aumentada",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
  },
  {
    id: "pos-lordosis",
    name: "Hiperlordosis Lumbar",
    type: "lordosis_lumbar",
    shortDesc: "Arco lumbar acentuado con anteversión pélvica marcada.",
    clinicalSigns:
      "Tensión en flexores de cadera (psoas) e inhibición de glúteos y transverso.",
    badge: "Lumbo-Pélvica",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    id: "pos-escoliosis",
    name: "Escoliosis / Asimetría Lateral",
    type: "escoliosis",
    shortDesc:
      "Desviación lateral de la columna con asimetría de triángulos de la talla.",
    clinicalSigns:
      "Desnivel de hombros, ángulo de Cobb funcional o estructural a vigilar.",
    badge: "Asimetría Tridimensional",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    id: "pos-hombros",
    name: "Hombros Protraídos & Enrollados",
    type: "hombros_protraidos",
    shortDesc: "Rotación interna humeral con antepulsión de cabeza humeral.",
    clinicalSigns:
      "Riesgo de pinzamiento subacromial y tendinopatía de manguito rotador.",
    badge: "Cintura Escapular",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
];

export const PostureSilhouetteSVG = ({ type, active }) => {
  const strokeColor = active ? "#38bdf8" : "#64748b";
  const plumbLineColor = "#ef4444";

  switch (type) {
    case "neutral":
      return (
        <svg
          viewBox="0 0 100 160"
          className="w-full h-44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="50"
            y1="5"
            x2="50"
            y2="155"
            stroke={plumbLineColor}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.6"
          />
          <circle
            cx="50"
            cy="22"
            r="10"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={active ? "#0284c7" : "#1e293b"}
            fillOpacity="0.4"
          />
          <path d="M49 32 L49 42" stroke={strokeColor} strokeWidth="2.5" />
          <path
            d="M50 42 C47 52, 53 65, 50 78 C47 90, 52 100, 50 110"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse
            cx="50"
            cy="110"
            rx="9"
            ry="6"
            stroke={strokeColor}
            strokeWidth="2"
          />
          <line
            x1="50"
            y1="114"
            x2="50"
            y2="150"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="42"
            y1="150"
            x2="56"
            y2="150"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="50" cy="22" r="2" fill="#22c55e" />
          <circle cx="50" cy="45" r="2" fill="#22c55e" />
          <circle cx="50" cy="110" r="2" fill="#22c55e" />
          <circle cx="50" cy="150" r="2" fill="#22c55e" />
        </svg>
      );

    case "cabeza_adelantada":
      return (
        <svg
          viewBox="0 0 100 160"
          className="w-full h-44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="42"
            y1="5"
            x2="42"
            y2="155"
            stroke={plumbLineColor}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
          <circle
            cx="62"
            cy="20"
            r="10"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={active ? "#f59e0b" : "#1e293b"}
            fillOpacity="0.4"
          />
          <path
            d="M58 29 L46 44"
            stroke="#f43f5e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M46 44 C42 55, 46 75, 43 95 L42 112"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="42"
            y1="112"
            x2="42"
            y2="150"
            stroke={strokeColor}
            strokeWidth="3"
          />
          <line
            x1="36"
            y1="150"
            x2="50"
            y2="150"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
        </svg>
      );

    case "cifosis_dorsal":
      return (
        <svg
          viewBox="0 0 100 160"
          className="w-full h-44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="46"
            y1="5"
            x2="46"
            y2="155"
            stroke={plumbLineColor}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
          <circle
            cx="56"
            cy="22"
            r="10"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={active ? "#ef4444" : "#1e293b"}
            fillOpacity="0.4"
          />
          <path
            d="M52 32 C38 48, 26 62, 38 82 C44 95, 46 102, 46 112"
            stroke="#ef4444"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="46"
            y1="112"
            x2="46"
            y2="150"
            stroke={strokeColor}
            strokeWidth="3"
          />
          <line
            x1="38"
            y1="150"
            x2="54"
            y2="150"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
          <circle cx="31" cy="62" r="3" fill="#ef4444" />
        </svg>
      );

    case "lordosis_lumbar":
      return (
        <svg
          viewBox="0 0 100 160"
          className="w-full h-44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="48"
            y1="5"
            x2="48"
            y2="155"
            stroke={plumbLineColor}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
          <circle
            cx="48"
            cy="20"
            r="10"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={active ? "#f59e0b" : "#1e293b"}
            fillOpacity="0.4"
          />
          <path
            d="M48 30 C44 48, 48 65, 46 78 C44 88, 65 96, 52 112"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="50"
            cy="112"
            rx="10"
            ry="6"
            transform="rotate(25 50 112)"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <line
            x1="48"
            y1="118"
            x2="48"
            y2="150"
            stroke={strokeColor}
            strokeWidth="3"
          />
          <line
            x1="40"
            y1="150"
            x2="56"
            y2="150"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
        </svg>
      );

    case "escoliosis":
      return (
        <svg
          viewBox="0 0 100 160"
          className="w-full h-44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="50"
            y1="5"
            x2="50"
            y2="155"
            stroke={plumbLineColor}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
          <circle
            cx="50"
            cy="20"
            r="10"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={active ? "#a855f7" : "#1e293b"}
            fillOpacity="0.4"
          />
          <path
            d="M50 30 C62 48, 64 64, 50 78 C36 92, 38 104, 50 114"
            stroke="#a855f7"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="28"
            y1="46"
            x2="72"
            y2="40"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="30"
            y1="112"
            x2="70"
            y2="116"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="42"
            y1="115"
            x2="42"
            y2="150"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
          <line
            x1="58"
            y1="115"
            x2="58"
            y2="150"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
        </svg>
      );

    case "hombros_protraidos":
    default:
      return (
        <svg
          viewBox="0 0 100 160"
          className="w-full h-44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="46"
            y1="5"
            x2="46"
            y2="155"
            stroke={plumbLineColor}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
          <circle
            cx="50"
            cy="22"
            r="10"
            stroke={strokeColor}
            strokeWidth="2.5"
            fill={active ? "#6366f1" : "#1e293b"}
            fillOpacity="0.4"
          />
          <path
            d="M48 32 L46 50 C44 70, 46 90, 46 112"
            stroke={strokeColor}
            strokeWidth="3"
          />
          <circle
            cx="60"
            cy="52"
            r="6"
            stroke="#6366f1"
            strokeWidth="2.5"
            fill="#6366f1"
            fillOpacity="0.3"
          />
          <path
            d="M60 58 Q66 85 58 110"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="46"
            y1="112"
            x2="46"
            y2="150"
            stroke={strokeColor}
            strokeWidth="3"
          />
          <line
            x1="38"
            y1="150"
            x2="54"
            y2="150"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
        </svg>
      );
  }
};

// =========================================================================
// SVG SILUETA LATERAL ESPECÍFICA CON LÍNEA DE PLOMADA Y MARCADORES ANATÓMICOS
// =========================================================================
export const LateralSilhouetteAnatomySVG = ({
  lateralEval,
  className = "w-full h-72",
}) => {
  const isHeadForward = lateralEval?.headPosition?.includes("adelantada");
  const isCervicalHypo =
    lateralEval?.cervicalSpine === "rectificacion_cervical";
  const isCifosis = lateralEval?.thoracicSpine === "hipercifosis_dorsal";
  const isLordosis = lateralEval?.lumbarSpine === "hiperlordosis_lumbar";
  const isAnteversion = lateralEval?.pelvisTilt === "anteversion_marcada";
  const isRecurvatum = lateralEval?.kneeSagittal === "genu_recurvatum";
  const isFlexo = lateralEval?.kneeSagittal === "genu_flexo";

  // Head center X position
  const headX = isHeadForward ? 64 : 50;
  const earX = isHeadForward ? 62 : 49;
  const shoulderX = 49;
  const hipX = isAnteversion ? 52 : 49;
  const kneeX = isRecurvatum ? 44 : isFlexo ? 55 : 49;
  const ankleX = 49;

  return (
    <svg
      viewBox="0 0 120 220"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Dark Container */}
      <rect width="120" height="220" rx="16" fill="#090d16" />

      {/* Grid Reference lines */}
      <line
        x1="10"
        y1="30"
        x2="110"
        y2="30"
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <line
        x1="10"
        y1="65"
        x2="110"
        y2="65"
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <line
        x1="10"
        y1="125"
        x2="110"
        y2="125"
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <line
        x1="10"
        y1="170"
        x2="110"
        y2="170"
        stroke="#1e293b"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <line
        x1="10"
        y1="205"
        x2="110"
        y2="205"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Plumb Line (Línea de Plomada Roja de Referencia) */}
      <line
        x1="49"
        y1="8"
        x2="49"
        y2="210"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.85"
      />
      <circle cx="49" cy="8" r="3" fill="#ef4444" />
      <text
        x="54"
        y="14"
        fill="#ef4444"
        fontSize="7"
        fontWeight="bold"
        fontFamily="monospace"
      >
        PLOMADA
      </text>

      {/* Anatomical Lateral Body Profile */}
      {/* Head */}
      <circle
        cx={headX}
        cy="30"
        r="13"
        stroke="#38bdf8"
        strokeWidth="2.5"
        fill="#0284c7"
        fillOpacity="0.25"
      />
      {/* Ear tragus marker */}
      <circle
        cx={earX}
        cy="30"
        r="2.5"
        fill="#facc15"
        stroke="#000"
        strokeWidth="0.8"
      />
      <text x={earX + 5} y="32" fill="#facc15" fontSize="6" fontWeight="bold">
        Oreja
      </text>

      {/* Neck Cervical Spine */}
      {isHeadForward ? (
        <path
          d={`M${earX - 3} 38 C${shoulderX + 4} 45, ${shoulderX + 6} 55, ${shoulderX} 62`}
          stroke="#f43f5e"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ) : isCervicalHypo ? (
        <path
          d={`M${earX} 40 L${shoulderX} 62`}
          stroke="#38bdf8"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : (
        <path
          d={`M${earX} 40 C${shoulderX + 2} 48, ${shoulderX + 2} 56, ${shoulderX} 62`}
          stroke="#38bdf8"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}

      {/* Thoracic Spine (Dorsal) */}
      {isCifosis ? (
        <path
          d={`M${shoulderX} 62 C34 78, 32 98, ${shoulderX} 118`}
          stroke="#f43f5e"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d={`M${shoulderX} 62 C43 78, 43 98, ${shoulderX} 118`}
          stroke="#38bdf8"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      )}
      {/* Acromion shoulder marker */}
      <circle
        cx={shoulderX}
        cy="62"
        r="2.5"
        fill="#22c55e"
        stroke="#000"
        strokeWidth="0.8"
      />
      <text
        x={shoulderX + 5}
        y="64"
        fill="#22c55e"
        fontSize="6"
        fontWeight="bold"
      >
        Acromion
      </text>

      {/* Lumbar Spine */}
      {isLordosis ? (
        <path
          d={`M${shoulderX} 118 C64 128, 64 140, ${hipX} 150`}
          stroke="#f59e0b"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d={`M${shoulderX} 118 C54 128, 54 140, ${hipX} 150`}
          stroke="#38bdf8"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      )}

      {/* Pelvis & Greater Trochanter Marker */}
      <ellipse
        cx={hipX}
        cy="150"
        rx="10"
        ry="7"
        transform={
          isAnteversion ? `rotate(22 ${hipX} 150)` : `rotate(5 ${hipX} 150)`
        }
        stroke={isAnteversion ? "#f59e0b" : "#38bdf8"}
        strokeWidth="2.2"
        fill={isAnteversion ? "#f59e0b" : "#38bdf8"}
        fillOpacity="0.2"
      />

      <circle
        cx={hipX}
        cy="150"
        r="2.5"
        fill="#facc15"
        stroke="#000"
        strokeWidth="0.8"
      />
      <text x={hipX + 8} y="152" fill="#facc15" fontSize="6" fontWeight="bold">
        Trocánter
      </text>

      {/* Femur / Thigh to Knee */}
      <line
        x1={hipX}
        y1="154"
        x2={kneeX}
        y2="182"
        stroke="#38bdf8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Knee joint marker */}
      <circle
        cx={kneeX}
        cy="182"
        r="3"
        fill={isRecurvatum || isFlexo ? "#f43f5e" : "#22c55e"}
        stroke="#000"
        strokeWidth="0.8"
      />
      <text
        x={kneeX + 6}
        y="184"
        fill={isRecurvatum || isFlexo ? "#f43f5e" : "#22c55e"}
        fontSize="6"
        fontWeight="bold"
      >
        {isRecurvatum ? "Recurvatum" : isFlexo ? "Flexo" : "Cóndilo"}
      </text>

      {/* Tibia to Ankle */}
      <line
        x1={kneeX}
        y1="184"
        x2={ankleX}
        y2="205"
        stroke="#38bdf8"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Lateral malleolus ankle marker */}
      <circle
        cx={ankleX}
        cy="205"
        r="2.5"
        fill="#22c55e"
        stroke="#000"
        strokeWidth="0.8"
      />
      <text
        x={ankleX + 5}
        y="207"
        fill="#22c55e"
        fontSize="6"
        fontWeight="bold"
      >
        Maléolo
      </text>

      {/* Foot base */}
      <path
        d={`M${ankleX - 6} 205 L${ankleX + 16} 205 L${ankleX + 18} 208 L${ankleX - 7} 208 Z`}
        fill="#64748b"
      />

      {/* Deviation badges */}
      {isHeadForward && (
        <g>
          <rect
            x="75"
            y="24"
            width="40"
            height="13"
            rx="3"
            fill="#ef4444"
            fillOpacity="0.9"
          />
          <text x="79" y="33" fill="#fff" fontSize="6" fontWeight="bold">
            Adelantada
          </text>
        </g>
      )}
      {isCifosis && (
        <g>
          <rect
            x="5"
            y="75"
            width="34"
            height="13"
            rx="3"
            fill="#ef4444"
            fillOpacity="0.9"
          />
          <text x="8" y="84" fill="#fff" fontSize="6" fontWeight="bold">
            Cifosis
          </text>
        </g>
      )}
      {isLordosis && (
        <g>
          <rect
            x="76"
            y="125"
            width="40"
            height="13"
            rx="3"
            fill="#f59e0b"
            fillOpacity="0.9"
          />
          <text x="79" y="134" fill="#fff" fontSize="6" fontWeight="bold">
            Lordosis +
          </text>
        </g>
      )}
    </svg>
  );
};

// =========================================================================
// VISUAL KNEES & ANKLES SILHOUETTE SVG (RODILLAS & TOBILLOS)
// =========================================================================
export const KneesAnklesVisualSVG = ({
  knees,
  ankles,
  className = "w-full h-80",
}) => {
  const isValgo = knees?.frontalAlignment === "genu_valgo";
  const isVaro = knees?.frontalAlignment === "genu_varo";
  const isFlatFoot = ankles?.plantarArch?.includes("plano");
  const isCavoFoot = ankles?.plantarArch === "pie_cavo";
  const isValgoAnkle = ankles?.hindfootAlignment === "valgo_retropie_pronacion";

  // Left & Right knee center X positions
  const leftKneeX = isValgo ? 56 : isVaro ? 36 : 46;
  const rightKneeX = isValgo ? 64 : isVaro ? 84 : 74;

  const leftFootX = isValgoAnkle ? 38 : 42;
  const rightFootX = isValgoAnkle ? 82 : 78;

  return (
    <svg
      viewBox="0 0 120 180"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="180" rx="14" fill="#090d16" />

      {/* Pelvis base */}
      <line
        x1="38"
        y1="20"
        x2="82"
        y2="20"
        stroke="#38bdf8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="38" cy="20" r="3" fill="#38bdf8" />
      <circle cx="82" cy="20" r="3" fill="#38bdf8" />
      <text x="44" y="14" fill="#94a3b8" fontSize="7" fontWeight="bold">
        EIPS / Pelvis
      </text>

      {/* Femur bones */}
      <line
        x1="38"
        y1="20"
        x2={leftKneeX}
        y2="78"
        stroke="#38bdf8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="82"
        y1="20"
        x2={rightKneeX}
        y2="78"
        stroke="#38bdf8"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Knee joint Patellas */}
      <circle
        cx={leftKneeX}
        cy="78"
        r="6"
        stroke="#f59e0b"
        strokeWidth="2"
        fill="#f59e0b"
        fillOpacity="0.3"
      />
      <circle
        cx={rightKneeX}
        cy="78"
        r="6"
        stroke="#f59e0b"
        strokeWidth="2"
        fill="#f59e0b"
        fillOpacity="0.3"
      />

      {/* Axis Lines for Valgo/Varo */}
      <line
        x1="38"
        y1="20"
        x2="38"
        y2="160"
        stroke="#ef4444"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />
      <line
        x1="82"
        y1="20"
        x2="82"
        y2="160"
        stroke="#ef4444"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />

      {/* Tibia bones */}
      <line
        x1={leftKneeX}
        y1="84"
        x2={leftFootX}
        y2="148"
        stroke="#38bdf8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1={rightKneeX}
        y1="84"
        x2={rightFootX}
        y2="148"
        stroke="#38bdf8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Ankle Malleoli */}
      <ellipse cx={leftFootX} cy="150" rx="4.5" ry="3" fill="#22c55e" />
      <ellipse cx={rightFootX} cy="150" rx="4.5" ry="3" fill="#22c55e" />

      {/* Feet Base */}
      <ellipse
        cx={leftFootX}
        cy="162"
        rx="7"
        ry="3.5"
        fill={isFlatFoot ? "#ef4444" : "#64748b"}
      />
      <ellipse
        cx={rightFootX}
        cy="162"
        rx="7"
        ry="3.5"
        fill={isFlatFoot ? "#ef4444" : "#64748b"}
      />

      {/* Badges on diagram */}
      <g>
        <rect
          x="15"
          y="88"
          width="40"
          height="13"
          rx="3"
          fill={isValgo || isVaro ? "#ef4444" : "#10b981"}
        />
        <text x="18" y="97" fill="#fff" fontSize="6.5" fontWeight="bold">
          {isValgo ? "Genu Valgo" : isVaro ? "Genu Varo" : "Rodilla Normal"}
        </text>
      </g>

      <g>
        <rect
          x="65"
          y="152"
          width="50"
          height="13"
          rx="3"
          fill={isFlatFoot || isValgoAnkle ? "#f59e0b" : "#10b981"}
        />
        <text x="68" y="161" fill="#fff" fontSize="6.5" fontWeight="bold">
          {isFlatFoot
            ? "Pie Plano"
            : isCavoFoot
              ? "Pie Cavo"
              : isValgoAnkle
                ? "Pronación"
                : "Tobillo Neutro"}
        </text>
      </g>
    </svg>
  );
};

// =========================================================================
// MAIN POSTURE VISUAL SELECTOR WITH LATERAL VIEW, EDITABLE POSTURE & KNEES/ANKLES
// =========================================================================

export const PostureVisualSelector = ({
  selectedFindings,
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
  visualComments = "",
  onVisualCommentsChange,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState("lateral");
  const [customFindingInput, setCustomFindingInput] = useState("");

  // Default Lateral State if not set
  const currentLateral = { ...NORMAL_LATERAL, ...(lateralEvaluation || {}) };

  // Default Knees State
  const currentKnees = { ...NORMAL_KNEES, ...(visualKnees || {}) };

  // Default Ankles State
  const currentAnkles = { ...NORMAL_ANKLES, ...(visualAnkles || {}) };
  const autoFindings = derivePostureFindings(currentLateral, currentKnees, currentAnkles);

  const handleUpdateLateral = (field, value) => {
    if (onLateralEvaluationChange) {
      onLateralEvaluationChange({
        ...currentLateral,
        [field]: value,
      });
    }
  };

  const handleUpdateKnees = (field, value) => {
    if (onVisualKneesChange) {
      onVisualKneesChange({
        ...currentKnees,
        [field]: value,
      });
    }
  };

  const handleUpdateAnkles = (field, value) => {
    if (onVisualAnklesChange) {
      onVisualAnklesChange({
        ...currentAnkles,
        [field]: value,
      });
    }
  };

  const isSelected = (name) => {
    return selectedFindings.some(
      (f) =>
        f.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(f.toLowerCase()),
    );
  };

  const handleAddCustom = (e) => {
    if (e) e.preventDefault();
    if (!customFindingInput.trim()) return;
    if (onAddCustomFinding) {
      onAddCustomFinding(customFindingInput.trim());
    } else if (onToggleFinding) {
      onToggleFinding(customFindingInput.trim());
    }
    setCustomFindingInput("");
  };

  return (
    <div className="space-y-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 text-white shadow-xl">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Evaluación Postural & Biomecánica Integral</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Editable
            </span>
          </h4>
          <p className="text-xs text-slate-400">
            Paso 1: alineación lateral con la línea de plomada · Paso 2: rodillas y pies de frente ·
            Paso 3: resumen automático + hallazgos del plano frontal.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("lateral")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "lateral"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>1. Vista lateral (plomada)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rodillas_tobillo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "rodillas_tobillo"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>2. Rodillas y pies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "presets"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>3. Resumen postural ({autoFindings.length + selectedFindings.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
           TAB 1: VISIÓN LATERAL (SAGITAL & LÍNEA DE PLOMADA)
          ========================================================================= */}
      {activeTab === "lateral" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          {/* Left Column: Anatomical SVG Silhouette */}
          <div className="lg:col-span-5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Silueta Plano Sagital
              </span>
              <span className="text-xs text-red-400 font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Línea Plomada Roja
              </span>
            </div>

            <LateralSilhouetteAnatomySVG lateralEval={currentLateral} />

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">
                Criterio Normal de Plomada:
              </span>
              <p>
                Pasa por el lóbulo de la oreja, acromion, trocánter mayor,
                anterior al eje de rodilla y anterior al maléolo externo.
              </p>
            </div>
          </div>

          {/* Right Column: Editable Lateral Checkpoints */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h5 className="text-sm font-black text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                <span>Checkpoints Anatómicos en Visión Lateral</span>
                <span className="text-xs font-normal text-slate-400">
                  Edición en tiempo real
                </span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Cabeza y Cuello */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    1. Posición de Cabeza:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.headPosition}
                    onChange={(e) =>
                      handleUpdateLateral("headPosition", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white font-medium focus:border-cyan-400"
                  >
                    <option value="alineada">Alineada con Plomada</option>
                    <option value="adelantada_leve">
                      Cabeza Adelantada Leve (+2 cm)
                    </option>
                    <option value="adelantada_severa">
                      Cabeza Adelantada Severa (Forward Head)
                    </option>
                    <option value="retraccion_cervical">
                      Retracción / Posteriorizada
                    </option>
                  </select>
                </div>

                {/* 2. Columna Cervical */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    2. Columna Cervical:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.cervicalSpine}
                    onChange={(e) =>
                      handleUpdateLateral("cervicalSpine", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white font-medium focus:border-cyan-400"
                  >
                    <option value="normal_fisiologica">
                      Lordosis Fisiológica Normal
                    </option>
                    <option value="rectificacion_cervical">
                      Rectificación Cervical (Cuello recto)
                    </option>
                    <option value="hiperlordosis_cervical">
                      Hiperlordosis Cervical
                    </option>
                  </select>
                </div>

                {/* 3. Columna Dorsal */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    3. Columna Torácica / Dorsal:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.thoracicSpine}
                    onChange={(e) =>
                      handleUpdateLateral("thoracicSpine", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white font-medium focus:border-cyan-400"
                  >
                    <option value="normal_armonica">
                      Cifosis Armónica Fisiológica
                    </option>
                    <option value="hipercifosis_dorsal">
                      Hipercifosis Dorsal (Dorso curvo)
                    </option>
                    <option value="espalda_plana_rectificada">
                      Dorso Plano / Rectificación Torácica
                    </option>
                  </select>
                </div>

                {/* 4. Columna Lumbar */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    4. Columna Lumbar:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.lumbarSpine}
                    onChange={(e) =>
                      handleUpdateLateral("lumbarSpine", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white font-medium focus:border-cyan-400"
                  >
                    <option value="normal_fisiologica">
                      Lordosis Lumbar Fisiológica
                    </option>
                    <option value="hiperlordosis_lumbar">
                      Hiperlordosis Lumbar Acentuada
                    </option>
                    <option value="rectificacion_lumbar">
                      Rectificación Lumbar (Espalda plana)
                    </option>
                  </select>
                </div>

                {/* 5. Inclinación Pélvica */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    5. Báscula Pélvica Sagital:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.pelvisTilt}
                    onChange={(e) =>
                      handleUpdateLateral("pelvisTilt", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white font-medium focus:border-cyan-400"
                  >
                    <option value="neutra">
                      Pelvis Neutra (Inclinación ~10°)
                    </option>
                    <option value="anteversion_marcada">
                      Anteversión Pélvica Marcada (&gt;15°)
                    </option>
                    <option value="retroversion_marcada">
                      Retroversión Pélvica (Aplanamiento)
                    </option>
                  </select>
                </div>

                {/* 6. Rodillas en Sagital */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    6. Rodillas (Visión Lateral):
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.kneeSagittal}
                    onChange={(e) =>
                      handleUpdateLateral("kneeSagittal", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white font-medium focus:border-cyan-400"
                  >
                    <option value="neutra">
                      Neutra (Extensión fisiológica 0°)
                    </option>
                    <option value="genu_recurvatum">
                      Genu Recurvatum (Hiperextensión &gt;5°)
                    </option>
                    <option value="genu_flexo">
                      Genu Flexo (Falta de extensión)
                    </option>
                  </select>
                </div>
              </div>

              {/* Plomada Global */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase block">
                  Desviación respecto a la Línea de Plomada:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "equilibrada",
                      label: "Equilibrada",
                      desc: "Alineación armónica",
                    },
                    {
                      id: "anteriorizada",
                      label: "Anteriorizada",
                      desc: "Centro cae hacia adelante",
                    },
                    {
                      id: "posteriorizada",
                      label: "Posteriorizada",
                      desc: "Centro cae hacia atrás",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() =>
                        handleUpdateLateral("plumbLineDeviation", opt.id)
                      }
                      className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        currentLateral.plumbLineDeviation === opt.id
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-xs opacity-80">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas de Visión Lateral */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-slate-300 uppercase block">
                  Notas de Observación en Visión Lateral:
                </label>
                <textarea
                  disabled={readOnly}
                  rows={2}
                  value={currentLateral.notes || ""}
                  onChange={(e) => handleUpdateLateral("notes", e.target.value)}
                  placeholder="Detalles sobre protrusión de abdomen, báscula pélvica dinámica, marcha lateral..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
           TAB 2: RODILLAS, TOBILLO & COMENTARIOS VISUALES
          ========================================================================= */}
      {activeTab === "rodillas_tobillo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          {/* Left Diagram */}
          <div className="lg:col-span-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Ejes Mecánicos de Miembro Inferior
            </span>
            <KneesAnklesVisualSVG knees={currentKnees} ankles={currentAnkles} />
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-400">
              <p>
                Valora el ángulo Q de rodillas, el tracking patelar y la caída
                del arco longitudinal del pie en bipedestación.
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="lg:col-span-8 space-y-4">
            {/* SECCIÓN 1: EVALUACIÓN VISUAL DE RODILLAS */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h5 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. Evaluación Visual de Rodillas</span>
                <span className="text-xs font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                  Frente & Rótula
                </span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Alineación Frontal:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentKnees.frontalAlignment}
                    onChange={(e) =>
                      handleUpdateKnees("frontalAlignment", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
                  >
                    <option value="neutro_simetrico">Neutro y Simétrico</option>
                    <option value="genu_valgo">
                      Genu Valgo (Rodillas en X)
                    </option>
                    <option value="genu_varo">
                      Genu Varo (Rodillas arqueadas)
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Tracking & Posición Patelar:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentKnees.patellarTracking}
                    onChange={(e) =>
                      handleUpdateKnees("patellarTracking", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
                  >
                    <option value="centrada">Rótula Centrada en Tróclea</option>
                    <option value="estrabismo_convergente">
                      Estrabismo Convergente
                    </option>
                    <option value="estrabismo_divergente">
                      Estrabismo Divergente
                    </option>
                    <option value="rotula_alta">
                      Rótula Alta (Patella Alta)
                    </option>
                    <option value="rotula_baja">Rótula Baja</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Derrame / Inflamación Perirrotuliana:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentKnees.effusionInflammation}
                    onChange={(e) =>
                      handleUpdateKnees("effusionInflammation", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
                  >
                    <option value="ausente">
                      Ausente (Sin edema ni tumefacción)
                    </option>
                    <option value="derrame_leve">
                      Derrame Leve (Signo de la ola positivo)
                    </option>
                    <option value="derrame_a_tension">
                      Derrame a Tensión (Signo del témpano)
                    </option>
                    <option value="bursitis_prerrotuliana">
                      Bursitis Prerrotuliana / Infrarrotuliana
                    </option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={currentKnees.details || ""}
                    onChange={(e) =>
                      handleUpdateKnees("details", e.target.value)
                    }
                    placeholder="Detalles de rodilla (ej. dolor a la palpación en interlínea medial, crepitación patelar)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: EVALUACIÓN VISUAL DE TOBILLO Y PIE */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h5 className="text-sm font-black text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                <span>2. Evaluación Visual de Tobillo y Pie</span>
                <span className="text-xs font-bold bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Retropié & Arco
                </span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Alineación de Retropié (Calcáneo):
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentAnkles.hindfootAlignment}
                    onChange={(e) =>
                      handleUpdateAnkles("hindfootAlignment", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
                  >
                    <option value="neutro">Neutro (Calcáneo vertical)</option>
                    <option value="valgo_retropie_pronacion">
                      Valgo de Retropié (Pronación)
                    </option>
                    <option value="varo_retropie_supinacion">
                      Varo de Retropié (Supinación)
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Arco Longitudinal Plantar:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentAnkles.plantarArch}
                    onChange={(e) =>
                      handleUpdateAnkles("plantarArch", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
                  >
                    <option value="normal">Arco Normal Fisiológico</option>
                    <option value="pie_plano_flexible">
                      Pie Plano Flexible
                    </option>
                    <option value="pie_plano_rigido">Pie Plano Rígido</option>
                    <option value="pie_cavo">Pie Cavo (Arco elevado)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 uppercase block">
                    Tendón de Aquiles:
                  </label>
                  <select
                    disabled={readOnly}
                    value={currentAnkles.achillesTendon}
                    onChange={(e) =>
                      handleUpdateAnkles("achillesTendon", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
                  >
                    <option value="alineado_vertical">
                      Alineado Verticalmente (Sin engrosamiento)
                    </option>
                    <option value="engrosamiento">
                      Engrosamiento Nódulo Tendinoso
                    </option>
                    <option value="desviacion_medial">
                      Desviación Medial por Pronación Forzada
                    </option>
                    <option value="desviacion_lateral">
                      Desviación Lateral
                    </option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={currentAnkles.details || ""}
                    onChange={(e) =>
                      handleUpdateAnkles("details", e.target.value)
                    }
                    placeholder="Detalles de tobillo (ej. apoyo en borde externo, dolor insercional calcáneo)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
           TAB 3: PRESETS DE POSTURA & HALLAZGOS EDITABLES
          ========================================================================= */}
      {activeTab === "presets" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* A. Hallazgos automáticos */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <h5 className="text-sm font-black text-cyan-300 uppercase tracking-wider mb-1">
              Hallazgos detectados (pasos 1 y 2)
            </h5>
            <p className="text-sm text-slate-400 mb-3">
              Se generan solos según lo que marcó en la vista lateral y en rodillas y pies. Para cambiarlos, corrija esos pasos.
            </p>
            {autoFindings.length === 0 ? (
              <p className="text-sm font-semibold text-emerald-400">✓ Alineación sin alteraciones registradas.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {autoFindings.map((f) => (
                  <span key={f} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-500/15 text-amber-200 border border-amber-500/40">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* B. Plano frontal */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <h5 className="text-sm font-black text-blue-300 uppercase tracking-wider mb-1">
              Plano frontal (vista anterior y posterior)
            </h5>
            <p className="text-sm text-slate-400 mb-3">Marque solo lo que observe.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {FRONTAL_FINDINGS.map((f) => {
                const active = selectedFindings.includes(f.name);
                return (
                  <button
                    type="button"
                    key={f.name}
                    disabled={readOnly}
                    onClick={() => onToggleFinding && onToggleFinding(f.name)}
                    className={`text-left p-3 rounded-xl border-2 transition-all flex gap-3 items-start cursor-pointer ${
                      active ? "bg-blue-950/50 border-blue-500" : "bg-slate-900 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center shrink-0 ${
                        active ? "bg-blue-600 text-white" : "border-2 border-slate-600"
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{f.name}</span>
                      <span className="block text-sm text-slate-400">{f.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Otros hallazgos */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h5 className="text-sm font-black text-violet-300 uppercase tracking-wider">Otros hallazgos</h5>
            {!readOnly && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Ej. Hipotrofia de cuádriceps derecho, cicatriz quirúrgica en rodilla…"
                  value={customFindingInput}
                  onChange={(e) => setCustomFindingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustom();
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustom()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold cursor-pointer flex items-center gap-1.5 justify-center"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {selectedFindings
                .filter((f) => !FRONTAL_FINDINGS.some((x) => x.name === f) && !autoFindings.includes(f))
                .map((finding) => (
                  <span
                    key={finding}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold bg-violet-600/25 text-violet-200 border border-violet-500/40 flex items-center gap-2"
                  >
                    {finding}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onRemoveFinding) onRemoveFinding(finding);
                          else if (onToggleFinding) onToggleFinding(finding);
                        }}
                        className="hover:text-red-300 cursor-pointer text-base leading-none"
                        title="Quitar"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
            </div>
          </div>

          {/* Posture Notes */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-300 uppercase block">
              Conclusión de la evaluación postural:
            </label>
            <textarea
              disabled={readOnly}
              rows={2}
              value={notes}
              onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
              placeholder="Alineación en bipedestación estática, respuesta a la autocorrección postural..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white placeholder-slate-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
