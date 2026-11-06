// =====================================================================
// PLATO NUTRICIONAL Y PORCIONES CON LA MANO
// Basado en la "Guía completa de Nutrición" (Canva) del gimnasio:
//  - Hoja de referencia del tamaño de porción (porción de mano y medida)
//  - Porciones para hombre y mujer (palma, puño, mano ahuecada, pulgar)
//  - Anatomía de un plato (equilibrado, mediterráneo, cetogénico, paleo)
//  - Carbohidratos según horas de ejercicio
// =====================================================================
import React from "react";

// --- Porciones con la mano --------------------------------------------
// Los gramos son una referencia aproximada para estimar macros.
export const MANOS = {
  palma: { emoji: "✋", nombre: "Palma", que: "Proteína", detalle: "del ancho y grosor de tu palma (sin dedos)", g: 25, macro: "proteína", kcal: 120 },
  puno: { emoji: "✊", nombre: "Puño", que: "Verduras / ensalada", detalle: "del tamaño de tu puño cerrado", g: 5, macro: "carbohidratos", kcal: 25 },
  mano: { emoji: "🤲", nombre: "Mano ahuecada", que: "Carbohidratos", detalle: "lo que entra en tu mano ahuecada", g: 25, macro: "carbohidratos", kcal: 110 },
  pulgar: { emoji: "👍", nombre: "Pulgar", que: "Grasas saludables", detalle: "del tamaño de tu pulgar completo", g: 9, macro: "grasas", kcal: 80 },
};

// Medidas con la mano adicionales (opcionales en cada plato)
// p/c/g = gramos aproximados de proteína, carbohidrato y grasa por porción
export const MANOS_EXTRA = {
  fruta: { campo: "fruits", emoji: "🍎", gesto: "✊", nombre: "Puño", que: "Fruta", detalle: "1 fruta mediana o 1 taza picada", p: 1, c: 15, g: 0, kcal: 60 },
  lacteo: { campo: "dairy", emoji: "🧀", gesto: "✌️", nombre: "Dos dedos", que: "Queso / lácteo", detalle: "queso del largo y grosor de 2 dedos (≈28 g) o 1 taza de leche/yogur", p: 7, c: 3, g: 6, kcal: 95 },
  frutosSecos: { campo: "nuts", emoji: "🥜", gesto: "🤏", nombre: "Puñado chico", que: "Frutos secos / semillas", detalle: "lo que cabe en la palma sin desbordar (≈15 g)", p: 3, c: 3, g: 8, kcal: 90 },
  aceite: { campo: "oil", emoji: "🫒", gesto: "☝️", nombre: "Punta del dedo", que: "Aceite / aderezo", detalle: "1 cucharadita (5 ml), del tamaño de la punta del pulgar", p: 0, c: 0, g: 4.5, kcal: 40 },
};

/** Porciones adicionales sugeridas por día según sexo (referencia) */
export const EXTRA_DIA = { M: { fruits: 2, dairy: 2, nuts: 1, oil: 3 }, F: { fruits: 2, dairy: 2, nuts: 1, oil: 2 } };

/** Porciones por comida principal según sexo (hombre 2 de cada una, mujer 1) */
export const porcionesBase = (sexo) =>
  sexo === "F" ? { palms: 1, fists: 1, hands: 1, thumbs: 1 } : { palms: 2, fists: 2, hands: 2, thumbs: 2 };

// Hoja de referencia: alimento, porción de mano, medida equivalente y cuánto comer
export const GUIA_PORCIONES = [
  { grupo: "Verduras", mano: "✊", gesto: "1 puño", medida: "1 taza", cuanto: "Al menos 1 porción en cada comida" },
  { grupo: "Frutas", mano: "✊", gesto: "1 puño", medida: "1 taza", cuanto: "1 a 2 porciones al día" },
  { grupo: "Carnes, pescados y aves", mano: "✋", gesto: "1 palma", medida: "½ taza", cuanto: "1 a 2 porciones por comida" },
  { grupo: "Huevos", mano: "✌️", gesto: "2 unidades", medida: "2 huevos", cuanto: "1 a 2 porciones al día" },
  { grupo: "Arroz, fideos y pasta", mano: "🤲", gesto: "1 mano ahuecada", medida: "½ taza", cuanto: "1 a 2 porciones por comida" },
  { grupo: "Frejoles, lentejas y menestras", mano: "🤲", gesto: "1 mano ahuecada", medida: "½ taza", cuanto: "1 porción al día" },
  { grupo: "Queso", mano: "☝️", gesto: "2 dedos", medida: "⅛ taza · 28 g · 1 onza", cuanto: "2 a 3 porciones al día" },
  { grupo: "Frutos secos, semillas y aceitunas", mano: "👍", gesto: "1 pulgar", medida: "⅛ taza", cuanto: "1 a 2 porciones por comida" },
  { grupo: "Aceites, mantequillas de maní, ghee", mano: "👍", gesto: "1 pulgar", medida: "⅛ taza", cuanto: "1 a 2 porciones por comida" },
  { grupo: "Leche, yogur y kéfir", mano: "✊", gesto: "1 puño", medida: "1 taza · 240 ml", cuanto: "1 a 2 porciones al día" },
  { grupo: "Pan", mano: "✋", gesto: "1 palma (rebanada)", medida: "1 rebanada · 1 pan francés", cuanto: "1 porción por comida (en lugar de arroz)" },
  { grupo: "Papa, camote, yuca y choclo", mano: "✊", gesto: "1 puño", medida: "1 unidad mediana · ½ taza", cuanto: "1 porción por comida (cambia por arroz)" },
  { grupo: "Avena, quinua y kiwicha (crudas)", mano: "🤲", gesto: "1 mano ahuecada", medida: "¼ taza · 40 g", cuanto: "1 porción por comida" },
  { grupo: "Palta", mano: "👍", gesto: "2 pulgares", medida: "¼ de palta", cuanto: "1 porción al día" },
  { grupo: "Mantequilla de maní / cremas", mano: "👍", gesto: "1 pulgar", medida: "1 cucharada · 16 g", cuanto: "1 porción por comida" },
  { grupo: "Aceite de oliva / aderezos", mano: "☝️", gesto: "punta del pulgar", medida: "1 cucharadita · 5 ml", cuanto: "2 a 3 porciones al día" },
  { grupo: "Pescado y mariscos", mano: "✋", gesto: "1 palma", medida: "100-120 g", cuanto: "2 a 3 veces por semana" },
  { grupo: "Pollo deshilachado / atún", mano: "🤲", gesto: "1 mano ahuecada", medida: "½ taza · 80 g", cuanto: "1 a 2 porciones por comida" },
  { grupo: "Chocolate oscuro / dulces", mano: "☝️", gesto: "1 dedo (2 cuadritos)", medida: "10-15 g", cuanto: "Ocasional" },
  { grupo: "Agua", mano: "✊", gesto: "1 vaso", medida: "250 ml", cuanto: "8 a 10 vasos al día (más si entrenas)" },
  { grupo: "Especias", mano: "🤏", gesto: "1 pizca", medida: "⅛ taza", cuanto: "Libre" },
];

// --- Modelos de plato (porcentaje del plato) ----------------------------
export const MODELOS_PLATO = {
  equilibrado: { nombre: "Equilibrado", protein: 25, veg: 50, carbs: 20, fats: 5, nota: "Medio plato de verduras, un cuarto de proteína, un cuarto de carbohidratos y un pulgar de grasa." },
  mediterraneo: { nombre: "Mediterráneo", protein: 25, veg: 45, carbs: 25, fats: 5, nota: "½ plato de verduras, ¼ de cereales integrales, ¼ de menestras, aves, huevos o pescado; 1 cucharada de aceite de oliva." },
  perdida_grasa: { nombre: "Pérdida de grasa", protein: 35, veg: 50, carbs: 10, fats: 5, nota: "Más proteína y verduras; carbohidratos de preferencia alrededor del entrenamiento." },
  masa_muscular: { nombre: "Ganar masa", protein: 30, veg: 30, carbs: 35, fats: 5, nota: "Más carbohidratos para rendir y recuperar; proteína en cada comida." },
  deportivo: { nombre: "Deportivo / pre-post", protein: 25, veg: 25, carbs: 45, fats: 5, nota: "Días de entrenamiento largo: el carbohidrato es el combustible principal." },
  cetogenico: { nombre: "Cetogénico", protein: 30, veg: 45, carbs: 0, fats: 25, nota: "Por calorías: ~75% grasas, ~15% proteína, ~10% carbohidratos (solo de verduras)." },
  paleo: { nombre: "Paleo", protein: 35, veg: 40, carbs: 15, fats: 10, nota: "Alimentos sin procesar: carnes, pescado, huevos, verduras, frutas, frutos secos; sin lácteos ni granos." },
};

export const COLORES_PLATO = { protein: "#e11d48", veg: "#16a34a", carbs: "#f59e0b", fats: "#a16207" };
export const NOMBRES_PLATO = { protein: "Proteína", veg: "Verduras / ensalada", carbs: "Carbohidratos", fats: "Grasas" };
const EMOJI_PLATO = { protein: "🍗", veg: "🥗", carbs: "🍚", fats: "🥑" };

/** Plato completo con valores por defecto (para planes antiguos sin plato) */
export function normalizarPlato(p, sexo) {
  const base = MODELOS_PLATO[p?.model] || MODELOS_PLATO.equilibrado;
  const porc = porcionesBase(sexo);
  const n = (v, d) => (v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? d : Number(v));
  return {
    model: p?.model || "equilibrado",
    protein: n(p?.protein, base.protein),
    veg: n(p?.veg, base.veg),
    carbs: n(p?.carbs, base.carbs),
    fats: n(p?.fats, base.fats),
    palms: n(p?.palms, porc.palms),
    fists: n(p?.fists, porc.fists),
    hands: n(p?.hands, porc.hands),
    thumbs: n(p?.thumbs, porc.thumbs),
    fruits: n(p?.fruits, 0),
    dairy: n(p?.dairy, 0),
    nuts: n(p?.nuts, 0),
    oil: n(p?.oil, 0),
    notes: p?.notes || "",
    id: p?.id || `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: p?.name || "Plato",
    time: p?.time || "",
  };
}

/** Platos de una dieta (formato nuevo: plates; anterior: un solo plate) */
export function platosDePlan(plan, sexo) {
  if (Array.isArray(plan?.plates)) return plan.plates.map((p) => normalizarPlato(p, sexo));
  if (plan?.plate) return [normalizarPlato({ name: "Plato principal", ...plan.plate }, sexo)];
  return [];
}

/** Macros aproximados (un plato o la suma de varios) según las porciones con la mano */
export function macrosPorManos(platos) {
  const lista = Array.isArray(platos) ? platos : [platos];
  const suma = (fn) => lista.reduce((a, pl) => a + fn(pl), 0);
  const extra = (pl, k) => Object.values(MANOS_EXTRA).reduce((a, m) => a + (Number(pl[m.campo]) || 0) * m[k], 0);
  return {
    proteinas: Math.round(suma((pl) => pl.palms * MANOS.palma.g + extra(pl, "p"))),
    carbohidratos: Math.round(suma((pl) => pl.hands * MANOS.mano.g + pl.fists * MANOS.puno.g + extra(pl, "c"))),
    grasas: Math.round(suma((pl) => pl.thumbs * MANOS.pulgar.g + extra(pl, "g"))),
    kcal: Math.round(
      suma((pl) => pl.palms * MANOS.palma.kcal + pl.fists * MANOS.puno.kcal + pl.hands * MANOS.mano.kcal + pl.thumbs * MANOS.pulgar.kcal + extra(pl, "kcal")),
    ),
  };
}

// --- Dibujo del plato -------------------------------------------------
const punto = (cx, cy, r, ang) => [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
function porcion(cx, cy, r, a0, a1) {
  if (a1 - a0 >= Math.PI * 2 - 0.0001) return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  const [x0, y0] = punto(cx, cy, r, a0);
  const [x1, y1] = punto(cx, cy, r, a1);
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1} Z`;
}

/** Silueta de plato con cubiertos y las porciones en colores */
export const PlatoSVG = ({ plate, size = 260, oscuro = false, sinCubiertos = false }) => {
  const pl = plate;
  const partes = ["veg", "protein", "carbs", "fats"].map((k) => [k, Math.max(0, Number(pl[k] || 0))]).filter(([, v]) => v > 0);
  const total = partes.reduce((a, [, v]) => a + v, 0) || 1;
  const W = 340;
  const cx = 170;
  const cy = 130;
  const r = 96;
  let ang = -Math.PI / 2;
  const sectores = partes.map(([k, v]) => {
    const a0 = ang;
    const a1 = ang + (v / total) * Math.PI * 2;
    ang = a1;
    const medio = (a0 + a1) / 2;
    const [lx, ly] = punto(cx, cy, r * 0.6, medio);
    return { k, v: Math.round((v / total) * 100), d: porcion(cx, cy, r, a0, a1), lx, ly, chico: v / total < 0.09 };
  });
  return (
    <svg
      viewBox={sinCubiertos ? "44 4 252 252" : `0 0 ${W} 260`}
      width={size}
      height={sinCubiertos ? size : (size * 260) / W}
      role="img"
      aria-label="Plato nutricional"
    >
      {/* tenedor */}
      <g fill={oscuro ? "#64748b" : "#cbd5e1"} style={{ display: sinCubiertos ? "none" : undefined }}>
        <rect x="22" y="70" width="6" height="150" rx="3" />
        {[10, 18, 26, 34].map((x) => (
          <rect key={x} x={x} y="34" width="4" height="40" rx="2" />
        ))}
        <rect x="10" y="68" width="28" height="10" rx="5" />
        {/* cuchillo */}
        <path d="M 312 30 C 330 60 330 110 316 130 L 316 222 a 4 4 0 0 1 -8 0 L 308 34 Z" />
      </g>
      {/* plato */}
      <circle cx={cx} cy={cy} r={r + 26} fill={oscuro ? "#1e293b" : "#ffffff"} stroke={oscuro ? "#334155" : "#e2e8f0"} strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={oscuro ? "#334155" : "#f1f5f9"} strokeWidth="6" />
      {sectores.map((s) => (
        <path key={s.k} d={s.d} fill={COLORES_PLATO[s.k]} stroke={oscuro ? "#1e293b" : "#ffffff"} strokeWidth="3" />
      ))}
      {sectores.map((s) =>
        s.chico || sinCubiertos ? null : (
          <g key={`t-${s.k}`} textAnchor="middle" style={{ pointerEvents: "none" }}>
            <text x={s.lx} y={s.ly - 4} fontSize="20">
              {EMOJI_PLATO[s.k]}
            </text>
            <text x={s.lx} y={s.ly + 16} fontSize="15" fontWeight="900" fill="#ffffff">
              {s.v}%
            </text>
          </g>
        ),
      )}
    </svg>
  );
};

/** Leyenda del plato + porciones con la mano */
export const LeyendaPlato = ({ plate, oscuro = false }) => (
  <div className="space-y-1.5">
    {["veg", "protein", "carbs", "fats"].map((k) => (
      <div key={k} className={`flex items-center justify-between gap-3 text-sm ${oscuro ? "text-slate-200" : "text-slate-700"}`}>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: COLORES_PLATO[k] }} />
          {NOMBRES_PLATO[k]}
        </span>
        <b>{Math.round(plate[k] || 0)}%</b>
      </div>
    ))}
  </div>
);

export const PorcionesMano = ({ plate, oscuro = false }) => {
  const filas = [
    ["palma", plate.palms],
    ["puno", plate.fists],
    ["mano", plate.hands],
    ["pulgar", plate.thumbs],
  ];
  const extras = Object.values(MANOS_EXTRA).filter((m) => Number(plate[m.campo]) > 0);
  return (
    <div className="space-y-2">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {filas.map(([k, n]) => (
        <div key={k} className={`rounded-xl p-3 text-center border ${oscuro ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
          <div className="text-2xl leading-none">{MANOS[k].emoji.repeat(Math.max(0, Math.min(3, Math.round(n))) || 0) || "—"}</div>
          <p className={`mt-1 text-lg font-black ${oscuro ? "text-white" : "text-slate-900"}`}>
            {n} {MANOS[k].nombre.toLowerCase()}
            {n === 1 ? "" : "s"}
          </p>
          <p className={`text-[11px] font-bold uppercase ${oscuro ? "text-slate-300" : "text-slate-500"}`}>{MANOS[k].que}</p>
        </div>
      ))}
    </div>
    {extras.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {extras.map((m) => (
          <span key={m.campo} className={`px-3 py-1.5 rounded-full border text-xs font-bold ${oscuro ? "bg-white/5 border-white/10 text-slate-100" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
            {m.emoji} {plate[m.campo]} {m.nombre.toLowerCase()} · {m.que}
          </span>
        ))}
      </div>
    )}
    </div>
  );
};

/** Barras: lo que aportan las porciones con la mano vs. la meta del plan */
export const ComparaMacros = ({ plates, metas, oscuro = false }) => {
  const m = macrosPorManos(plates);
  const filas = [
    ["Proteína", m.proteinas, metas?.proteinas, COLORES_PLATO.protein],
    ["Carbohidratos", m.carbohidratos, metas?.carbohidratos, COLORES_PLATO.carbs],
    ["Grasas", m.grasas, metas?.grasas, COLORES_PLATO.fats],
  ];
  return (
    <div className="space-y-2">
      {filas.map(([t, v, meta, c]) => {
        const max = Math.max(v, meta || 0, 1);
        return (
          <div key={t}>
            <div className={`flex justify-between text-xs font-bold ${oscuro ? "text-slate-200" : "text-slate-600"}`}>
              <span>{t}</span>
              <span>
                ≈ {v} g/día{meta ? ` · meta ${meta} g` : ""}
              </span>
            </div>
            <div className={`relative h-3 rounded-full overflow-hidden ${oscuro ? "bg-white/10" : "bg-slate-100"}`}>
              <div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: c }} />
              {meta > 0 && <div className="absolute top-0 h-full w-0.5 bg-slate-900" style={{ left: `${(meta / max) * 100}%` }} title="Meta del plan" />}
            </div>
          </div>
        );
      })}
      <p className={`text-[11px] ${oscuro ? "text-slate-400" : "text-slate-500"}`}>
        Aprox. {m.kcal} kcal/día sumando {Array.isArray(plates) ? plates.length : 1} plato(s). Es una estimación: el tamaño de la mano cambia con la persona.
      </p>
    </div>
  );
};

/** Editor del plato para nutrición */
export const EditorPlato = ({ value, onChange, sexo }) => {
  const pl = normalizarPlato(value, sexo);
  const set = (k, v) => onChange({ ...pl, [k]: v });
  const suma = pl.protein + pl.veg + pl.carbs + pl.fats;
  const usarModelo = (k) => {
    const mo = MODELOS_PLATO[k];
    onChange({ ...pl, model: k, protein: mo.protein, veg: mo.veg, carbs: mo.carbs, fats: mo.fats });
  };
  // Al mover un control, los demás se ajustan para que el plato sume 100%
  const mover = (k, v) => {
    const nuevo = Math.max(0, Math.min(100, Number(v)));
    const otros = ["protein", "veg", "carbs", "fats"].filter((x) => x !== k);
    const resto = otros.reduce((a, x) => a + pl[x], 0);
    const queda = 100 - nuevo;
    const r = { ...pl, model: "personalizado", [k]: nuevo };
    let acumulado = 0;
    otros.forEach((x, i) => {
      const val = i === otros.length - 1 ? queda - acumulado : Math.round(resto ? (pl[x] / resto) * queda : queda / otros.length);
      r[x] = Math.max(0, val);
      acumulado += r[x];
    });
    onChange(r);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-emerald-900">Distribución del plato</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(MODELOS_PLATO).map(([k, m]) => (
            <button
              key={k}
              type="button"
              onClick={() => usarModelo(k)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                pl.model === k ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              {m.nombre}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="flex justify-center">
          <PlatoSVG plate={pl} size={300} />
        </div>
        <div className="space-y-3">
          {["veg", "protein", "carbs", "fats"].map((k) => (
            <label key={k} className="block">
              <span className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORES_PLATO[k] }} /> {NOMBRES_PLATO[k]}
                </span>
                <span>{pl[k]}%</span>
              </span>
              <input type="range" min="0" max="80" step="5" value={pl[k]} onChange={(e) => mover(k, e.target.value)} className="w-full" style={{ accentColor: COLORES_PLATO[k] }} />
            </label>
          ))}
          {suma !== 100 && <p className="text-xs font-bold text-rose-600">El plato suma {suma}%.</p>}
          <p className="text-[11px] text-slate-600">{(MODELOS_PLATO[pl.model] || {}).nota || "Plato personalizado."}</p>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-600">
            Porciones con la mano en este plato · {sexo === "F" ? "mujer" : "hombre"}
          </p>
          <div className="flex gap-1.5">
            {[
              ["M", "♂ Base hombre (2 de cada una)", "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"],
              ["F", "♀ Base mujer (1 de cada una)", "border-pink-300 bg-pink-50 text-pink-800 hover:bg-pink-100"],
            ].map(([sx, t, c]) => (
              <button key={sx} type="button" onClick={() => onChange({ ...pl, ...porcionesBase(sx) })} className={`px-2.5 py-1 rounded-full border text-[11px] font-bold cursor-pointer ${c} ${sexo === sx ? "ring-2 ring-offset-1 ring-current" : ""}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ["palms", "palma"],
            ["fists", "puno"],
            ["hands", "mano"],
            ["thumbs", "pulgar"],
          ].map(([k, m]) => (
            <label key={k} className="block bg-white rounded-xl border border-slate-200 p-2 text-center">
              <span className="block text-xl">{MANOS[m].emoji}</span>
              <span className="block text-[11px] font-bold text-slate-600">{MANOS[m].nombre} · {MANOS[m].que}</span>
              <span className="block text-[10px] text-slate-400">Hombre 2 · Mujer 1</span>
              <input
                type="number"
                min="0"
                max="6"
                step="0.5"
                value={pl[k]}
                onChange={(e) => set(k, Number(e.target.value))}
                className="mt-1 w-full p-1.5 rounded-lg border border-slate-300 text-sm text-center font-bold"
              />
            </label>
          ))}
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 mt-3 mb-1.5">Otras medidas con la mano (opcional)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.values(MANOS_EXTRA).map((m) => (
            <label key={m.campo} title={m.detalle} className="block bg-amber-50/60 rounded-xl border border-amber-200 p-2 text-center">
              <span className="block text-xl">{m.emoji}<span className="text-base ml-0.5">{m.gesto}</span></span>
              <span className="block text-[11px] font-bold text-slate-700">{m.nombre} · {m.que}</span>
              <span className="block text-[10px] text-slate-500 leading-tight">{m.detalle}</span>
              <input
                type="number"
                min="0"
                max="6"
                step="0.5"
                value={pl[m.campo] || 0}
                onChange={(e) => set(m.campo, Number(e.target.value))}
                className="mt-1 w-full p-1.5 rounded-lg border border-amber-300 bg-white text-sm text-center font-bold"
              />
            </label>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Referencia por día · hombre: {EXTRA_DIA.M.fruits} frutas, {EXTRA_DIA.M.dairy} lácteos, {EXTRA_DIA.M.nuts} puñado de frutos secos, {EXTRA_DIA.M.oil} cdtas de aceite · mujer: {EXTRA_DIA.F.fruits} frutas, {EXTRA_DIA.F.dairy} lácteos, {EXTRA_DIA.F.nuts} puñado, {EXTRA_DIA.F.oil} cdtas.
        </p>
      </div>
      <label className="block">
        <span className="block text-xs font-bold text-slate-600 mb-1">Indicaciones del plato (opcional)</span>
        <input
          value={pl.notes}
          maxLength={200}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Ej. en el almuerzo cambia el arroz por quinua; ensalada con limón"
          className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white"
        />
      </label>
    </div>
  );
};

/** Hoja de referencia de porciones con la mano (para el alumno y el personal) */
export const GuiaPorciones = ({ oscuro = false, sexo }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Object.entries(MANOS).map(([k, m]) => (
        <div key={k} className={`rounded-2xl p-4 border ${oscuro ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"}`}>
          <div className="text-3xl">{m.emoji}</div>
          <p className="font-black mt-1">
            {m.nombre} = {m.que}
          </p>
          <p className={`text-xs ${oscuro ? "text-slate-300" : "text-slate-500"}`}>Una porción es {m.detalle}.</p>
          <p className={`text-xs font-bold mt-1 ${oscuro ? "text-emerald-300" : "text-emerald-700"}`}>
            {sexo === "F" ? "Mujer: 1" : sexo === "M" ? "Hombre: 2" : "Hombre 2 · Mujer 1"} por comida
          </p>
        </div>
      ))}
    </div>
    <div className={`overflow-x-auto rounded-2xl border ${oscuro ? "border-white/10" : "border-slate-200 bg-white"}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className={`text-left text-[11px] uppercase ${oscuro ? "text-slate-300 bg-white/5" : "text-slate-500 bg-slate-50"}`}>
            <th className="p-3">Alimento</th>
            <th className="p-3">Porción de mano</th>
            <th className="p-3">Medida equivalente</th>
            <th className="p-3">¿Cuánto comer?</th>
          </tr>
        </thead>
        <tbody>
          {GUIA_PORCIONES.map((g) => (
            <tr key={g.grupo} className={`border-t ${oscuro ? "border-white/10 text-slate-100" : "border-slate-100 text-slate-700"}`}>
              <td className="p-3 font-bold">{g.grupo}</td>
              <td className="p-3 whitespace-nowrap">
                <span className="text-lg mr-1">{g.mano}</span> {g.gesto}
              </td>
              <td className="p-3 whitespace-nowrap">{g.medida}</td>
              <td className="p-3">{g.cuanto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${oscuro ? "text-slate-200" : "text-slate-700"}`}>
      {[
        ["🥦 Verduras", "Inclúyelas crudas o cocidas en cada comida y cambia de colores: cada verdura aporta nutrientes distintos."],
        ["🍗 Proteína", "Elige proteínas magras (pollo, pescado, huevo, menestras, tofu) y evita embutidos y carnes muy grasosas."],
        ["🍠 Carbohidratos", "Prefiere los ricos en fibra (avena, quinua, camote, arroz integral) sobre todo antes y después de entrenar; limita dulces y snacks."],
        ["🥑 Grasas", "Palta, frutos secos, aceite de oliva o pescado azul; evita frituras y grasas trans."],
      ].map(([t, x]) => (
        <div key={t} className={`rounded-xl p-3 border ${oscuro ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
          <b>{t}:</b> {x}
        </div>
      ))}
    </div>
    <p className={`text-xs ${oscuro ? "text-slate-400" : "text-slate-500"}`}>
      Ración ≠ porción: la porción es la medida estándar (la de la etiqueta o esta guía); la ración es lo que tú te sirves, que puede ser más o
      menos.
    </p>
  </div>
);

// --- Carbohidratos según el ejercicio ----------------------------------
export const CARBOS_EJERCICIO = [
  ["3–5 horas por semana", 3, 5],
  ["5–7 horas por semana", 5, 6],
  ["1–2 horas por día", 6, 7],
  ["2–4 horas por día", 7, 8],
  ["Más de 4 horas por día", 8, 10],
];

export const TablaCarbosEjercicio = ({ peso }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] uppercase text-slate-500 bg-slate-50">
          <th className="p-3">Ejercicio</th>
          <th className="p-3">Carbohidratos por kg</th>
          {peso > 0 && <th className="p-3">Para {peso} kg</th>}
        </tr>
      </thead>
      <tbody>
        {CARBOS_EJERCICIO.map(([t, a, b]) => (
          <tr key={t} className="border-t border-slate-100">
            <td className="p-3 font-semibold text-slate-700">{t}</td>
            <td className="p-3">
              {a}–{b} g/kg
            </td>
            {peso > 0 && (
              <td className="p-3 font-bold text-amber-700">
                {Math.round(a * peso)}–{Math.round(b * peso)} g/día
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const NOMBRES_SUGERIDOS = ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena", "Pre-entreno", "Post-entreno"];

/** Editor de los platos de la dieta (los que el nutricionista quiera asignar) */
export const EditorPlatos = ({ value, onChange, sexo, metas, comidas = [] }) => {
  const platos = value || [];
  const [activo, setActivo] = React.useState(0);
  const i = Math.min(activo, Math.max(0, platos.length - 1));
  const agregar = (nombre, hora) => {
    const base = platos[platos.length - 1];
    const nuevo = normalizarPlato({ ...(base ? { ...base, id: undefined, notes: "" } : {}), name: nombre, time: hora || "" }, sexo);
    onChange([...platos, nuevo]);
    setActivo(platos.length);
  };
  const unoPorComida = () => {
    const base = platos[0];
    onChange(comidas.map((c) => normalizarPlato({ ...(base ? { ...base, id: undefined, notes: "" } : {}), name: c.name, time: /^\d{2}:\d{2}$/.test(c.time || "") ? c.time : "" }, sexo)));
    setActivo(0);
  };
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-emerald-900">🍽️ Platos del alumno</p>
          <p className="text-xs text-slate-500">Asigna los platos que necesite: uno, tres, siete… cada uno con su distribución y porciones.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {comidas.length > 0 && (
            <button type="button" onClick={unoPorComida} className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold cursor-pointer hover:bg-emerald-50">
              Un plato por cada comida ({comidas.length})
            </button>
          )}
          <button
            type="button"
            disabled={platos.length >= 12}
            onClick={() => agregar(NOMBRES_SUGERIDOS.find((n) => !platos.some((p) => p.name === n)) || `Plato ${platos.length + 1}`)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            + Agregar plato
          </button>
        </div>
      </div>

      {platos.length === 0 ? (
        <p className="text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-300 p-4 text-center">
          Sin platos asignados. Agrega uno o crea uno por cada comida.
        </p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {platos.map((p, k) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivo(k)}
                className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  k === i ? "bg-white border-emerald-500 shadow-sm" : "bg-white/60 border-slate-200 hover:border-emerald-300"
                }`}
              >
                <PlatoSVG plate={p} size={44} sinCubiertos />
                <span>
                  <span className="block text-xs font-extrabold text-slate-900">{p.name}</span>
                  <span className="block text-[10px] text-slate-500">{p.time || `Plato ${k + 1}`}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[160px]">
                <span className="block text-[11px] font-bold text-slate-500">Nombre del plato</span>
                <input
                  value={platos[i].name}
                  maxLength={60}
                  onChange={(e) => onChange(platos.map((p, k) => (k === i ? { ...p, name: e.target.value } : p)))}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </label>
              <label>
                <span className="block text-[11px] font-bold text-slate-500">Hora</span>
                <input
                  type="time"
                  value={platos[i].time}
                  onChange={(e) => onChange(platos.map((p, k) => (k === i ? { ...p, time: e.target.value } : p)))}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => agregar(`${platos[i].name} (copia)`, platos[i].time)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Duplicar
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(platos.filter((_, k) => k !== i));
                  setActivo(Math.max(0, i - 1));
                }}
                className="px-3 py-2 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                Quitar
              </button>
            </div>
            <EditorPlato value={platos[i]} sexo={sexo} onChange={(nuevo) => onChange(platos.map((p, k) => (k === i ? { ...nuevo, id: p.id, name: p.name, time: p.time } : p)))} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2">Total del día con {platos.length} plato(s) vs. metas del plan</p>
            <ComparaMacros plates={platos} metas={metas} />
          </div>
        </>
      )}
    </div>
  );
};

/** Vista de los platos (detalle del plan y portal del alumno) */
export const VistaPlatos = ({ plates, metas, oscuro = false }) => {
  const [abierto, setAbierto] = React.useState(0);
  if (!plates.length) return null;
  const p = plates[Math.min(abierto, plates.length - 1)];
  return (
    <div className="space-y-4">
      {plates.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {plates.map((x, k) => (
            <button
              key={x.id || k}
              type="button"
              onClick={() => setAbierto(k)}
              className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl border cursor-pointer transition-all ${
                k === abierto ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 text-slate-800 hover:border-emerald-300"
              }`}
            >
              <PlatoSVG plate={x} size={40} sinCubiertos />
              <span className="text-left">
                <span className="block text-xs font-extrabold">{x.name}</span>
                {x.time && <span className={`block text-[10px] ${k === abierto ? "text-emerald-100" : "text-slate-500"}`}>{x.time}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-center">
        <div className="md:col-span-2 flex flex-col items-center">
          <PlatoSVG plate={p} size={280} oscuro={oscuro} />
          <p className="text-sm font-extrabold text-slate-900 -mt-1">
            {p.name}
            {p.time ? ` · ${p.time}` : ""}
          </p>
          <p className="text-[11px] text-slate-500">{(MODELOS_PLATO[p.model] || { nombre: "Personalizado" }).nombre}</p>
        </div>
        <div className="md:col-span-3 space-y-4">
          <LeyendaPlato plate={p} oscuro={oscuro} />
          <PorcionesMano plate={p} oscuro={oscuro} />
          {p.notes && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
              <b>Indicación:</b> {p.notes}
            </p>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2">Total del día ({plates.length} plato{plates.length === 1 ? "" : "s"})</p>
        <ComparaMacros plates={plates} metas={metas} oscuro={oscuro} />
      </div>
    </div>
  );
};
