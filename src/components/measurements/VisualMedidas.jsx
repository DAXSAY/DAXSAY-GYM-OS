// Visualización de composición corporal (bioimpedancia) y medidas
// - Barras de rango de colores (IMC, grasa, músculo, visceral, agua, cintura/cadera)
// - Dona de composición (grasa, músculo, hueso, resto)
// - Silueta con las medidas (perímetros) y el cambio respecto a la evaluación anterior
import React from "react";

const n = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
const r1 = (v) => Math.round(v * 10) / 10;

// Rangos de referencia (orientativos, adultos)
export function rangos(sexo) {
  const m = sexo === "F";
  return {
    imc: { min: 14, max: 40, tramos: [[18.5, "#38bdf8", "Bajo"], [25, "#22c55e", "Normal"], [30, "#f59e0b", "Sobrepeso"], [40, "#ef4444", "Obesidad"]] },
    grasa: m
      ? { min: 10, max: 50, tramos: [[21, "#38bdf8", "Bajo"], [33, "#22c55e", "Saludable"], [39, "#f59e0b", "Alto"], [50, "#ef4444", "Muy alto"]] }
      : { min: 3, max: 40, tramos: [[8, "#38bdf8", "Bajo"], [20, "#22c55e", "Saludable"], [25, "#f59e0b", "Alto"], [40, "#ef4444", "Muy alto"]] },
    musculo: m
      ? { min: 15, max: 45, tramos: [[24, "#f59e0b", "Bajo"], [30, "#22c55e", "Normal"], [35, "#10b981", "Alto"], [45, "#0ea5e9", "Muy alto"]] }
      : { min: 25, max: 55, tramos: [[33, "#f59e0b", "Bajo"], [39, "#22c55e", "Normal"], [44, "#10b981", "Alto"], [55, "#0ea5e9", "Muy alto"]] },
    visceral: { min: 1, max: 30, tramos: [[9.5, "#22c55e", "Normal"], [14.5, "#f59e0b", "Alto"], [30, "#ef4444", "Muy alto"]] },
    agua: m
      ? { min: 35, max: 70, tramos: [[45, "#f59e0b", "Baja"], [60, "#22c55e", "Normal"], [70, "#0ea5e9", "Alta"]] }
      : { min: 40, max: 75, tramos: [[50, "#f59e0b", "Baja"], [65, "#22c55e", "Normal"], [75, "#0ea5e9", "Alta"]] },
    icc: m
      ? { min: 0.6, max: 1.1, tramos: [[0.8, "#22c55e", "Bajo riesgo"], [0.85, "#f59e0b", "Moderado"], [1.1, "#ef4444", "Alto"]] }
      : { min: 0.7, max: 1.2, tramos: [[0.95, "#22c55e", "Bajo riesgo"], [1.0, "#f59e0b", "Moderado"], [1.2, "#ef4444", "Alto"]] },
  };
}

const pct = (p, kg, peso) => n(p) ?? (n(kg) && n(peso) ? (kg / peso) * 100 : null);
const tramoDe = (v, cfg) => cfg.tramos.find(([h]) => v <= h) || cfg.tramos[cfg.tramos.length - 1];

/** Barra horizontal con zonas de color y un marcador en el valor */
export function BarraRango({ titulo, icono, valor, unidad = "", cfg, previo, invertido = false, decimales = 1 }) {
  const v = n(valor);
  const pos = (x) => Math.max(0, Math.min(100, ((x - cfg.min) / (cfg.max - cfg.min)) * 100));
  const t = v != null ? tramoDe(v, cfg) : null;
  const p = n(previo);
  const cambio = v != null && p != null ? r1(v - p) : null;
  const bueno = cambio == null || cambio === 0 ? null : invertido ? cambio < 0 : cambio > 0;
  let ini = cfg.min;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
          {icono && <span className="text-base">{icono}</span>} {titulo}
        </span>
        {t && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: t[1] }}>
            {t[2]}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="text-2xl font-black text-slate-900">{v != null ? (decimales === 0 ? Math.round(v) : r1(v)) : "—"}</span>
        <span className="text-sm text-slate-500">{unidad}</span>
        {cambio != null && cambio !== 0 && (
          <span className={`text-xs font-bold ${bueno ? "text-emerald-600" : "text-rose-600"}`}>
            {cambio > 0 ? "▲" : "▼"} {Math.abs(cambio)}
          </span>
        )}
      </div>
      <div className="relative mt-2 h-3">
        <div className="absolute inset-0 flex rounded-full overflow-hidden">
          {cfg.tramos.map(([hasta, color], k) => {
            const w = pos(hasta) - pos(ini);
            ini = hasta;
            return <div key={k} style={{ width: `${w}%`, background: color, opacity: 0.85 }} />;
          })}
        </div>
        {p != null && <div className="absolute -top-0.5 w-0.5 h-4 bg-slate-400" style={{ left: `${pos(p)}%` }} title={`Anterior: ${p}`} />}
        {v != null && (
          <div className="absolute -top-1.5 -translate-x-1/2" style={{ left: `${pos(v)}%` }}>
            <div className="w-5 h-5 rounded-full bg-white border-[3px] shadow" style={{ borderColor: t?.[1] || "#0f172a" }} />
          </div>
        )}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        {cfg.tramos.map(([, , l], k) => (
          <span key={k}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/** Dona de composición corporal en kg */
export function DonaComposicion({ peso, grasaKg, musculoKg, huesoKg }) {
  const P = n(peso);
  if (!P) return null;
  const g = n(grasaKg) || 0;
  const mu = n(musculoKg) || 0;
  const h = n(huesoKg) || 0;
  const resto = Math.max(0, P - g - mu - h);
  const partes = [
    ["Grasa", g, "#f59e0b"],
    ["Músculo", mu, "#10b981"],
    ["Hueso", h, "#94a3b8"],
    ["Agua y órganos", resto, "#38bdf8"],
  ].filter(([, v]) => v > 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let acum = 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-4">
      <svg viewBox="0 0 140 140" className="w-32 h-32 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#f1f5f9" strokeWidth="18" />
        {partes.map(([l, v, c]) => {
          const largo = (v / P) * C;
          const el = <circle key={l} cx="70" cy="70" r={R} fill="none" stroke={c} strokeWidth="18" strokeDasharray={`${largo} ${C - largo}`} strokeDashoffset={-acum} />;
          acum += largo;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" transform="rotate(90 70 70)" fontSize="20" fontWeight="900" fill="#0f172a">{r1(P)}</text>
        <text x="70" y="84" textAnchor="middle" transform="rotate(90 70 70)" fontSize="10" fill="#64748b">kg</text>
      </svg>
      <div className="space-y-1.5 text-sm">
        <p className="text-xs font-bold text-slate-500">¿De qué está hecho tu peso?</p>
        {partes.map(([l, v, c]) => (
          <p key={l} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ background: c }} />
            <span className="text-slate-700 w-28">{l}</span>
            <b className="text-slate-900">{r1(v)} kg</b>
            <span className="text-xs text-slate-400">{Math.round((v / P) * 100)}%</span>
          </p>
        ))}
      </div>
    </div>
  );
}

/** Panel completo de composición corporal */
export const edadDe = (nac) => {
  if (!nac) return null;
  const d = new Date(String(nac).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const h = new Date();
  let e = h.getFullYear() - d.getFullYear();
  if (h.getMonth() < d.getMonth() || (h.getMonth() === d.getMonth() && h.getDate() < d.getDate())) e--;
  return e;
};

export function PanelComposicion({ a, previo, sexo, edad }) {
  if (!a) return null;
  const b = a.bioimpedance || {};
  const bp = previo?.bioimpedance || {};
  const R = rangos(sexo);
  const icc = n(a.waistHipRatio) ?? (n(a.perimeters?.waist) && n(a.perimeters?.hip) ? a.perimeters.waist / a.perimeters.hip : null);
  const iccPrev = n(previo?.waistHipRatio);
  const imc = n(a.bmi) ?? (n(a.weightKg) && n(a.heightCm) ? a.weightKg / (a.heightCm / 100) ** 2 : null);
  const edadMet = n(b.metabolicAge);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3">
        <DonaComposicion peso={a.weightKg} grasaKg={b.bodyFatKg ?? (n(b.bodyFatPercentage) && a.weightKg ? (a.weightKg * b.bodyFatPercentage) / 100 : null)} musculoKg={b.muscleMassKg} huesoKg={b.boneMassKg} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50 to-white p-3">
            <p className="text-xs font-bold text-slate-500">🔥 Metabolismo basal</p>
            <p className="text-2xl font-black text-slate-900">{n(b.basalMetabolicRateKcal) ? Math.round(b.basalMetabolicRateKcal) : "—"} <span className="text-sm font-semibold text-slate-500">kcal/día</span></p>
            <p className="text-[11px] text-slate-500">Lo que gasta tu cuerpo en reposo</p>
          </div>
          <div className={`rounded-xl border p-3 ${edadMet && edad ? (edadMet <= edad ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white" : "border-rose-200 bg-gradient-to-br from-rose-50 to-white") : "border-slate-200 bg-white"}`}>
            <p className="text-xs font-bold text-slate-500">🎂 Edad metabólica</p>
            <p className="text-2xl font-black text-slate-900">{edadMet ?? "—"} <span className="text-sm font-semibold text-slate-500">años</span></p>
            {edadMet && edad ? (
              <p className={`text-[11px] font-semibold ${edadMet <= edad ? "text-emerald-700" : "text-rose-700"}`}>
                {edadMet < edad ? `${edad - edadMet} años más joven que tu edad real 💪` : edadMet === edad ? "Igual a tu edad real" : `${edadMet - edad} años mayor que tu edad real`}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">Comparada con tu edad real</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-3">
            <p className="text-xs font-bold text-slate-500">💧 Agua corporal</p>
            <p className="text-2xl font-black text-slate-900">{n(b.totalBodyWaterLiters) ? r1(b.totalBodyWaterLiters) : n(b.totalBodyWaterPercentage) && n(a.weightKg) ? r1((a.weightKg * b.totalBodyWaterPercentage) / 100) : "—"} <span className="text-sm font-semibold text-slate-500">litros</span></p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
            <p className="text-xs font-bold text-slate-500">🦴 Masa ósea</p>
            <p className="text-2xl font-black text-slate-900">{n(b.boneMassKg) ? r1(b.boneMassKg) : "—"} <span className="text-sm font-semibold text-slate-500">kg</span></p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <BarraRango titulo="Índice de masa corporal" icono="⚖️" valor={imc} cfg={R.imc} previo={previo?.bmi} invertido />
        <BarraRango titulo="Grasa corporal" icono="🟠" valor={b.bodyFatPercentage} unidad="%" cfg={R.grasa} previo={bp.bodyFatPercentage} invertido />
        <BarraRango titulo="Masa muscular" icono="💪" valor={pct(b.muscleMassPercentage, b.muscleMassKg, a.weightKg)} unidad="%" cfg={R.musculo} previo={pct(bp.muscleMassPercentage, bp.muscleMassKg, previo?.weightKg)} />
        <BarraRango titulo="Grasa visceral" icono="🫀" valor={b.visceralFatLevel} unidad="nivel" cfg={R.visceral} previo={bp.visceralFatLevel} invertido decimales={0} />
        <BarraRango titulo="Agua corporal" icono="💧" valor={b.totalBodyWaterPercentage} unidad="%" cfg={R.agua} previo={bp.totalBodyWaterPercentage} />
        {icc != null && <BarraRango titulo="Cintura / cadera" icono="📏" valor={icc} cfg={R.icc} previo={iccPrev} invertido decimales={2} />}
      </div>
      <p className="text-[11px] text-slate-400">Rangos orientativos para adultos. La línea gris marca la evaluación anterior.</p>
    </div>
  );
}

/** Silueta de frente con las medidas y su cambio */
export function SiluetaMedidas({ p = {}, previo = {}, sexo }) {
  const m = sexo === "F";
  const filas = [
    ["neck", "Cuello", 62, "izq"],
    ["shoulders", "Hombros", 82, "der"],
    ["chest", "Pecho", 108, "izq"],
    ["bicepsFlexedRight", "Brazo (contraído)", 128, "der"],
    ["waist", "Cintura", 150, "izq", true],
    ["abdomen", "Abdomen", 168, "der", true],
    ["hip", "Cadera", 192, "izq", true],
    ["thighSuperior", "Muslo", 228, "der"],
    ["calf", "Pantorrilla", 300, "izq"],
  ];
  const ancho = { neck: 14, shoulders: 50, chest: 40, bicepsFlexedRight: 9, waist: m ? 28 : 32, abdomen: m ? 32 : 34, hip: m ? 42 : 36, thighSuperior: 15, calf: 10 };
  const cx = { bicepsFlexedRight: 160, thighSuperior: 126, calf: 124 };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <svg viewBox="0 0 400 360" className="w-full max-w-[520px] mx-auto">
        {/* cuerpo */}
        <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.2">
          <circle cx="200" cy="36" r="22" />
          <rect x="190" y="56" width="20" height="14" rx="4" />
          <path d={m ? "M152 78 Q200 70 248 78 L240 140 Q232 152 228 160 Q246 182 244 205 L156 205 Q154 182 172 160 Q168 152 160 140 Z" : "M148 78 Q200 70 252 78 L242 150 Q236 165 234 175 L238 205 L162 205 L166 175 Q164 165 158 150 Z"} />
          <path d="M148 82 L132 150 L140 152 L158 92 Z" />
          <path d="M252 82 L268 150 L260 152 L242 92 Z" />
          <path d="M162 205 L170 340 L194 340 L198 215 L202 215 L206 340 L230 340 L238 205 Z" />
        </g>
        {filas.map(([k, l, y, lado, invertido]) => {
          const v = n(p[k]);
          const ant = n(previo?.[k]);
          const c = v != null && ant != null ? r1(v - ant) : null;
          const bueno = c == null || c === 0 ? null : invertido ? c < 0 : c > 0;
          const x0 = (cx[k] || 200) - ancho[k];
          const x1 = (cx[k] || 200) + ancho[k];
          const xt = lado === "izq" ? 14 : 268;
          const xl = lado === "izq" ? 130 : 270;
          return (
            <g key={k} opacity={v != null ? 1 : 0.35}>
              <line x1={x0} y1={y} x2={x1} y2={y} stroke="#0c8794" strokeWidth="2" strokeDasharray="4 3" />
              <line x1={lado === "izq" ? x0 : x1} y1={y} x2={xl} y2={y} stroke="#cbd5e1" strokeWidth="1" />
              <rect x={xt} y={y - 14} width="118" height="28" rx="8" fill={v != null ? "#ebfcfc" : "#f8fafc"} stroke={v != null ? "#a0ecef" : "#e2e8f0"} />
              <text x={xt + 8} y={y - 2} fontSize="9" fill="#64748b" fontWeight="600">{l}</text>
              <text x={xt + 8} y={y + 10} fontSize="12" fill="#0f172a" fontWeight="800">{v != null ? `${v} cm` : "—"}</text>
              {c != null && c !== 0 && (
                <text x={xt + 110} y={y + 10} fontSize="10" textAnchor="end" fontWeight="800" fill={bueno ? "#059669" : "#e11d48"}>
                  {c > 0 ? "▲" : "▼"}{Math.abs(c)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="text-[11px] text-slate-400 text-center">▲▼ cambio respecto a la evaluación anterior (verde = mejora)</p>
    </div>
  );
}
