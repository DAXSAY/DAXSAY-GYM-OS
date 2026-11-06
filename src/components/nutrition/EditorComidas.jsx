// Editor de comidas de la dieta: tarjetas por comida, alimentos del catálogo
// (los macros se recalculan con los gramos) o alimentos escritos a mano.
import React, { useState } from "react";
import { Plus, Trash2, BookOpen, PenLine, ChevronUp, ChevronDown } from "lucide-react";
import { SelectorAlimentos, CATEGORIAS } from "./CatalogoAlimentos";

const r1 = (n) => Math.round(Number(n || 0) * 10) / 10;

/** Recalcula los totales de una comida */
export function totalesComida(meal) {
  const items = meal.items || [];
  return {
    ...meal,
    totalCalories: Math.round(items.reduce((a, i) => a + Number(i.calories || 0), 0)),
    totalProteins: r1(items.reduce((a, i) => a + Number(i.proteins || 0), 0)),
    totalCarbs: r1(items.reduce((a, i) => a + Number(i.carbs || 0), 0)),
    totalFats: r1(items.reduce((a, i) => a + Number(i.fats || 0), 0)),
  };
}

/** Cambia los gramos de un alimento del catálogo y recalcula */
function conGramos(it, gramos) {
  const g = Number(gramos);
  if (!it.per100) {
    return { ...it, weightGrams: g, portion: g ? `${g} g` : it.portion };
  }
  const k = g / 100;
  const texto = String(it.portion || "").split(" · ").slice(1).join(" · ");
  return {
    ...it,
    weightGrams: g,
    portion: `${g} g${texto ? ` · ${texto}` : ""}`,
    calories: Math.round(it.per100.kcal * k),
    proteins: r1(it.per100.p * k),
    carbs: r1(it.per100.c * k),
    fats: r1(it.per100.g * k),
  };
}

const Meta = ({ label, valor, meta, color, unidad = "g" }) => {
  const pct = meta > 0 ? Math.min(130, (valor / meta) * 100) : 0;
  const fuera = meta > 0 && (pct > 110 || pct < 90);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold uppercase text-slate-500">{label}</span>
        <span className={`text-[11px] font-bold ${fuera ? "text-amber-600" : "text-emerald-600"}`}>{meta > 0 ? `${Math.round((valor / meta) * 100)}%` : ""}</span>
      </div>
      <p className="text-lg font-black text-slate-900">
        {Math.round(valor)}
        <span className="text-xs font-semibold text-slate-400">
          {" "}
          / {meta || "—"} {unidad}
        </span>
      </p>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
};

/** Hora de la comida con dos listas (hora y minutos) y AM/PM: no se borra al escribir */
const SelectorHora = ({ value, onChange }) => {
  const ok = /^\d{2}:\d{2}$/.test(value || "");
  const [h24, mm] = ok ? value.split(":").map(Number) : [null, null];
  const pm = h24 != null && h24 >= 12;
  const h12 = h24 == null ? "" : ((h24 + 11) % 12) + 1;
  const poner = (h, m, esPm) => {
    const hh = ((Number(h) % 12) + (esPm ? 12 : 0)) % 24;
    onChange(`${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };
  const cls = "bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-700 cursor-pointer";
  return (
    <span className="flex items-center gap-1" title="Hora de la comida">
      <select className={cls} value={h12} onChange={(e) => poner(e.target.value, mm ?? 0, pm)}>
        {h24 == null && <option value="">--</option>}
        {Array.from({ length: 12 }, (_, k) => k + 1).map((h) => (
          <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
        ))}
      </select>
      <span className="text-slate-400 text-xs">:</span>
      <select className={cls} value={mm ?? ""} onChange={(e) => poner(h12 || 7, e.target.value, pm)}>
        {mm == null && <option value="">--</option>}
        {Array.from({ length: 12 }, (_, k) => k * 5).map((m) => (
          <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
        ))}
        {mm != null && mm % 5 !== 0 && <option value={mm}>{String(mm).padStart(2, "0")}</option>}
      </select>
      <span className="flex rounded-lg border border-slate-200 overflow-hidden">
        {["AM", "PM"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => poner(h12 || 7, mm ?? 0, t === "PM")}
            className={`px-1.5 py-1 text-[10px] font-bold cursor-pointer ${(t === "PM") === pm && h24 != null ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
          >
            {t}
          </button>
        ))}
      </span>
    </span>
  );
};

export const EditorComidas = ({ meals, setMeals, metas }) => {
  const [selector, setSelector] = useState(null); // índice de la comida
  const cambiar = (mIdx, fn) =>
    setMeals((prev) => prev.map((m, i) => (i === mIdx ? totalesComida(fn(m)) : m)));
  const dia = meals.reduce(
    (a, m) => ({ kcal: a.kcal + Number(m.totalCalories || 0), p: a.p + Number(m.totalProteins || 0), c: a.c + Number(m.totalCarbs || 0), g: a.g + Number(m.totalFats || 0) }),
    { kcal: 0, p: 0, c: 0, g: 0 },
  );
  const mover = (i, d) =>
    setMeals((prev) => {
      const c = [...prev];
      const j = i + d;
      if (j < 0 || j >= c.length) return prev;
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 className="font-extrabold text-sm text-slate-900">🍴 Comidas y alimentos</h4>
          <p className="text-xs text-slate-500">Elige del catálogo y ajusta los gramos: calorías y macros se calculan solos.</p>
        </div>
        <button
          type="button"
          onClick={() =>
            setMeals((prev) => [
              ...prev,
              { id: `m${Date.now()}`, name: `Comida ${prev.length + 1}`, time: "", totalCalories: 0, totalProteins: 0, totalCarbs: 0, totalFats: 0, items: [] },
            ])
          }
          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar comida
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Meta label="Calorías del día" valor={dia.kcal} meta={metas.kcal} color="#0f172a" unidad="kcal" />
        <Meta label="Proteína" valor={dia.p} meta={metas.p} color="#e11d48" />
        <Meta label="Carbohidratos" valor={dia.c} meta={metas.c} color="#f59e0b" />
        <Meta label="Grasas" valor={dia.g} meta={metas.g} color="#65a30d" />
      </div>

      {meals.map((meal, mIdx) => (
        <div key={meal.id || mIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">{mIdx + 1}</span>
            <input
              value={meal.name}
              onChange={(e) => cambiar(mIdx, (m) => ({ ...m, name: e.target.value }))}
              className="flex-1 min-w-[140px] bg-transparent text-sm font-extrabold text-slate-900 focus:outline-none focus:bg-white rounded px-1.5 py-1"
            />
            <SelectorHora value={meal.time} onChange={(t) => cambiar(mIdx, (m) => ({ ...m, time: t }))} />
            <span className="text-xs font-black text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1">{meal.totalCalories || 0} kcal</span>
            <span className="hidden sm:inline text-[11px] text-slate-500">
              P {meal.totalProteins || 0} · C {meal.totalCarbs || 0} · G {meal.totalFats || 0}
            </span>
            <div className="flex items-center">
              <button type="button" onClick={() => mover(mIdx, -1)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer" title="Subir">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => mover(mIdx, 1)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer" title="Bajar">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!meal.items?.length || confirm(`¿Quitar "${meal.name}" con sus alimentos?`)) setMeals((prev) => prev.filter((_, i) => i !== mIdx));
                }}
                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                title="Quitar comida"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {(meal.items || []).length === 0 && <p className="text-xs text-slate-400 text-center py-2">Sin alimentos todavía.</p>}
            {(meal.items || []).map((it) => {
              const libre = !it.per100;
              const c = CATEGORIAS[it.category];
              return (
                <div key={it.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
                  <span className="text-xl w-8 text-center shrink-0">{it.emoji || c?.emoji || "🍽️"}</span>
                  {libre ? (
                    <input
                      value={it.name}
                      placeholder="Alimento o preparación"
                      onChange={(e) => cambiar(mIdx, (m) => ({ ...m, items: m.items.map((x) => (x.id === it.id ? { ...x, name: e.target.value } : x)) }))}
                      className="flex-1 min-w-[150px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold"
                    />
                  ) : (
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{it.name}</p>
                      <p className="text-[11px] text-slate-500">{String(it.portion || "").split(" · ").slice(1).join(" · ")}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="2000"
                      value={it.weightGrams ?? ""}
                      placeholder="g"
                      onChange={(e) => cambiar(mIdx, (m) => ({ ...m, items: m.items.map((x) => (x.id === it.id ? conGramos(x, e.target.value) : x)) }))}
                      className="w-16 px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-bold text-center"
                    />
                    <span className="text-xs text-slate-400">g</span>
                  </div>
                  {libre ? (
                    <div className="flex items-center gap-1">
                      {[
                        ["calories", "kcal", "w-16"],
                        ["proteins", "P", "w-12"],
                        ["carbs", "C", "w-12"],
                        ["fats", "G", "w-12"],
                      ].map(([k, l, w]) => (
                        <input
                          key={k}
                          type="number"
                          min="0"
                          step="0.1"
                          title={l}
                          placeholder={l}
                          value={it[k] ?? ""}
                          onChange={(e) =>
                            cambiar(mIdx, (m) => ({ ...m, items: m.items.map((x) => (x.id === it.id ? { ...x, [k]: Number(e.target.value) } : x)) }))
                          }
                          className={`${w} px-1 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-center`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-right shrink-0 w-28">
                      <p className="text-sm font-black text-amber-600">{it.calories} kcal</p>
                      <p className="text-[10px] text-slate-500">
                        P {it.proteins} · C {it.carbs} · G {it.fats}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => cambiar(mIdx, (m) => ({ ...m, items: m.items.filter((x) => x.id !== it.id) }))}
                    className="p-1.5 text-slate-300 hover:text-rose-600 cursor-pointer"
                    title="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelector(mIdx)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" /> Elegir del catálogo
              </button>
              <button
                type="button"
                onClick={() =>
                  cambiar(mIdx, (m) => ({
                    ...m,
                    items: [...(m.items || []), { id: `item-${Date.now()}`, name: "", weightGrams: "", portion: "", calories: 0, proteins: 0, carbs: 0, fats: 0 }],
                  }))
                }
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <PenLine className="w-3.5 h-3.5" /> Escribir otro
              </button>
            </div>
          </div>
        </div>
      ))}

      {selector !== null && meals[selector] && (
        <SelectorAlimentos
          comida={meals[selector].name}
          onCerrar={() => setSelector(null)}
          onAgregar={(item) => cambiar(selector, (m) => ({ ...m, items: [...(m.items || []), item] }))}
        />
      )}
    </div>
  );
};
