// =====================================================================
// CATÁLOGO DE ALIMENTOS: selector visual y administración
// Valores por 100 g (Tablas Peruanas de Composición de Alimentos
// CENAN/INS 2017 y USDA). El nutricionista puede agregar los suyos.
// =====================================================================
import React, { useMemo, useState } from "react";
import { Search, X, Plus, Pencil, EyeOff, Check } from "lucide-react";
import { useGym } from "../../context/GymContext";
import { userCan } from "../../config/roles";

export const CATEGORIAS = {
  proteinas: { nombre: "Proteínas", emoji: "🍗", chip: "bg-rose-50 text-rose-700 border-rose-200", activo: "bg-rose-600 text-white border-rose-600", barra: "#e11d48" },
  lacteos: { nombre: "Lácteos", emoji: "🥛", chip: "bg-sky-50 text-sky-700 border-sky-200", activo: "bg-sky-600 text-white border-sky-600", barra: "#0284c7" },
  cereales: { nombre: "Cereales", emoji: "🍚", chip: "bg-amber-50 text-amber-700 border-amber-200", activo: "bg-amber-500 text-white border-amber-500", barra: "#f59e0b" },
  tuberculos: { nombre: "Tubérculos", emoji: "🥔", chip: "bg-orange-50 text-orange-700 border-orange-200", activo: "bg-orange-500 text-white border-orange-500", barra: "#f97316" },
  legumbres: { nombre: "Menestras", emoji: "🫘", chip: "bg-yellow-50 text-yellow-800 border-yellow-200", activo: "bg-yellow-600 text-white border-yellow-600", barra: "#ca8a04" },
  verduras: { nombre: "Verduras", emoji: "🥦", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", activo: "bg-emerald-600 text-white border-emerald-600", barra: "#16a34a" },
  frutas: { nombre: "Frutas", emoji: "🍎", chip: "bg-pink-50 text-pink-700 border-pink-200", activo: "bg-pink-500 text-white border-pink-500", barra: "#ec4899" },
  grasas: { nombre: "Grasas", emoji: "🥑", chip: "bg-lime-50 text-lime-800 border-lime-200", activo: "bg-lime-600 text-white border-lime-600", barra: "#65a30d" },
  bebidas: { nombre: "Bebidas", emoji: "🥤", chip: "bg-cyan-50 text-cyan-700 border-cyan-200", activo: "bg-cyan-600 text-white border-cyan-600", barra: "#0891b2" },
  suplementos: { nombre: "Suplementos", emoji: "💪", chip: "bg-violet-50 text-violet-700 border-violet-200", activo: "bg-violet-600 text-white border-violet-600", barra: "#7c3aed" },
  platos: { nombre: "Platos", emoji: "🍲", chip: "bg-red-50 text-red-700 border-red-200", activo: "bg-red-600 text-white border-red-600", barra: "#dc2626" },
  otros: { nombre: "Otros", emoji: "🍯", chip: "bg-slate-50 text-slate-700 border-slate-200", activo: "bg-slate-700 text-white border-slate-700", barra: "#64748b" },
};

const r1 = (n) => Math.round(n * 10) / 10;

/** Macros de un alimento del catálogo para cierta cantidad de gramos */
export function calcularPorcion(f, gramos) {
  const k = Number(gramos || 0) / 100;
  return {
    calories: Math.round(f.kcal100 * k),
    proteins: r1(f.protein100 * k),
    carbs: r1(f.carbs100 * k),
    fats: r1(f.fats100 * k),
  };
}

/** Fila de alimento para una comida, a partir del catálogo */
export function itemDesdeCatalogo(f, gramos = f.portionGrams) {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId: f.id,
    name: f.name,
    emoji: f.emoji,
    category: f.category,
    weightGrams: Number(gramos),
    portion: `${gramos} g${f.portionText ? ` · ${f.portionText}` : ""}`,
    per100: { kcal: f.kcal100, p: f.protein100, c: f.carbs100, g: f.fats100 },
    ...calcularPorcion(f, gramos),
  };
}

const MiniMacros = ({ p, c, g }) => {
  const t = p * 4 + c * 4 + g * 9 || 1;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100" title={`P ${p} g · C ${c} g · G ${g} g`}>
      <div style={{ width: `${((p * 4) / t) * 100}%`, background: "#e11d48" }} />
      <div style={{ width: `${((c * 4) / t) * 100}%`, background: "#f59e0b" }} />
      <div style={{ width: `${((g * 9) / t) * 100}%`, background: "#65a30d" }} />
    </div>
  );
};

/** Tarjeta de alimento (selector y catálogo) */
export const TarjetaAlimento = ({ f, onClick, accion }) => {
  const porc = calcularPorcion(f, f.portionGrams);
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border border-slate-200 p-3 flex flex-col gap-2 transition-all ${
        onClick ? "cursor-pointer hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5" : ""
      } ${f.active === false ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-3xl leading-none shrink-0 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">{f.emoji || CATEGORIAS[f.category]?.emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">{f.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{f.portionText || `${f.portionGrams} g`}</p>
        </div>
      </div>
      <MiniMacros p={porc.proteins} c={porc.carbs} g={porc.fats} />
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="font-black text-slate-800 whitespace-nowrap">{porc.calories} kcal</span>
        <span className="text-slate-400 whitespace-nowrap">{f.portionGrams} g</span>
      </div>
      <div className="flex gap-1 text-[10px] font-bold">
        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">P {porc.proteins}</span>
        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">C {porc.carbs}</span>
        <span className="px-1.5 py-0.5 rounded bg-lime-50 text-lime-700">G {porc.fats}</span>
      </div>
      {(f.glycemic || f.tags) && (
        <div className="flex flex-wrap gap-1">
          {f.glycemic && <span className={`text-[9px] font-bold rounded border px-1 py-0.5 ${IG[f.glycemic]}`}>IG {f.glycemic}</span>}
          {String(f.tags || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 2).map((t) => (
            <span key={t} className="text-[9px] font-semibold rounded bg-slate-100 text-slate-600 px-1 py-0.5">{t}</span>
          ))}
        </div>
      )}
      {f.notes && <p className="text-[10px] text-slate-500 leading-tight line-clamp-2" title={f.notes}>💡 {f.notes}</p>}
      {f.custom && <span className="absolute top-2 right-2 text-[9px] font-black uppercase bg-violet-100 text-violet-700 rounded px-1.5 py-0.5">Propio</span>}
      {accion}
    </div>
  );
};

/** Chips de categorías */
const Categorias = ({ valor, onChange, conteo }) => (
  <div className="flex gap-1.5 overflow-x-auto pb-1">
    <button
      type="button"
      onClick={() => onChange("")}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${!valor ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
    >
      Todos
    </button>
    {Object.entries(CATEGORIAS).map(([k, c]) =>
      conteo && !conteo[k] ? null : (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${valor === k ? c.activo : `${c.chip} hover:brightness-95`}`}
        >
          {c.emoji} {c.nombre}
          {conteo && <span className="opacity-70"> {conteo[k]}</span>}
        </button>
      ),
    )}
  </div>
);

const filtrar = (lista, cat, texto) => {
  const t = texto.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return lista.filter(
    (f) => (!cat || f.category === cat) && (!t || f.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(t)),
  );
};

/** Ventana para elegir alimentos y agregarlos a una comida */
export const SelectorAlimentos = ({ comida, onAgregar, onCerrar }) => {
  const { foods, currentUser } = useGym();
  const puedeCrear = userCan(currentUser, "nutrition", "crear");
  const [creando, setCreando] = useState(null);
  const [cat, setCat] = useState("");
  const [texto, setTexto] = useState("");
  const [elegido, setElegido] = useState(null);
  const [gramos, setGramos] = useState(100);
  const [agregados, setAgregados] = useState(0);
  const lista = useMemo(() => filtrar(foods, cat, texto), [foods, cat, texto]);
  const conteo = useMemo(() => foods.reduce((m, f) => ((m[f.category] = (m[f.category] || 0) + 1), m), {}), [foods]);
  const elegir = (f) => {
    setElegido(f);
    setGramos(f.portionGrams);
  };
  const agregar = () => {
    onAgregar(itemDesdeCatalogo(elegido, Number(gramos)));
    setAgregados((n) => n + 1);
    setElegido(null);
  };
  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCerrar}>
      <div className="bg-slate-50 w-full sm:max-w-4xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Agregar a</p>
              <p className="text-lg font-black text-slate-900">{comida}</p>
            </div>
            <div className="flex items-center gap-2">
              {agregados > 0 && <span className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">{agregados} agregado(s)</span>}
              <button type="button" onClick={onCerrar} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold cursor-pointer">
                Listo
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar: pollo, atún, quinua, palta…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Categorias valor={cat} onChange={setCat} conteo={conteo} />
          </div>
          {puedeCrear && (
            <button type="button" onClick={() => setCreando({ ...VACIO, name: texto, category: cat || "proteinas" })} className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> ¿No está? Crear un alimento nuevo
            </button>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {foods.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">Cargando catálogo…</p>
          ) : lista.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm text-slate-500">No encontramos «{texto}» en el catálogo.</p>
              {puedeCrear && (
                <button type="button" onClick={() => setCreando({ ...VACIO, name: texto, category: cat || "proteinas" })} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer">
                  <Plus className="w-4 h-4" /> Crear «{texto || "nuevo alimento"}»
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {lista.map((f) => (
                <TarjetaAlimento key={f.id} f={f} onClick={() => elegir(f)} />
              ))}
            </div>
          )}
        </div>
        {creando && <FormularioAlimento inicial={creando} onCerrar={() => setCreando(null)} onGuardado={(f) => f && elegir(f)} />}
        {elegido && (
          <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center gap-3">
            <span className="text-3xl">{elegido.emoji}</span>
            <div className="flex-1 min-w-[160px]">
              <p className="font-bold text-slate-900">{elegido.name}</p>
              <p className="text-xs text-slate-500">{elegido.portionText}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[0.5, 1, 1.5, 2].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setGramos(Math.round(elegido.portionGrams * m * 10) / 10)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    Number(gramos) === Math.round(elegido.portionGrams * m * 10) / 10 ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {m === 1 ? "1 porción" : `×${m}`}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="2000"
                value={gramos}
                onChange={(e) => setGramos(e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-center"
              />
              <span className="text-xs text-slate-500">g</span>
            </div>
            <span className="text-sm font-black text-amber-600">{calcularPorcion(elegido, gramos).calories} kcal</span>
            <button
              type="button"
              disabled={!(Number(gramos) > 0)}
              onClick={agregar}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const VACIO = { name: "", category: "proteinas", emoji: "", kcal100: "", protein100: "", carbs100: "", fats100: "", fiber100: 0, portionGrams: 100, portionText: "", sugar100: "", sodium100: "", glycemic: "", tags: "", notes: "" };
const ETIQUETAS = ["andino", "amazónico", "peruano", "vegano", "sin gluten", "sin lactosa", "alto en proteína", "alto en fibra", "omega 3", "hierro", "calcio", "magro"];
const IG = { bajo: "bg-emerald-50 text-emerald-700 border-emerald-200", medio: "bg-amber-50 text-amber-700 border-amber-200", alto: "bg-rose-50 text-rose-700 border-rose-200" };

/** Administración del catálogo (vista del nutricionista) */
export const CatalogoAlimentos = () => {
  const { foods, saveFood, hideFood, currentUser } = useGym();
  const [cat, setCat] = useState("");
  const [texto, setTexto] = useState("");
  const [soloPropios, setSoloPropios] = useState(false);
  const [form, setForm] = useState(null); // null | { ...datos, id? }
  const [error, setError] = useState("");
  const puedeCrear = userCan(currentUser, "nutrition", "crear");
  const puedeEditar = userCan(currentUser, "nutrition", "editar");
  const lista = useMemo(() => filtrar(foods, cat, texto).filter((f) => !soloPropios || f.custom), [foods, cat, texto, soloPropios]);
  const conteo = useMemo(() => foods.reduce((m, f) => ((m[f.category] = (m[f.category] || 0) + 1), m), {}), [foods]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900">🍽️ Catálogo de alimentos</h3>
            <p className="text-xs text-slate-500">
              {foods.length} alimentos · valores por 100 g (Tablas Peruanas de Composición de Alimentos CENAN/INS 2017 y USDA)
            </p>
          </div>
          {puedeCrear && (
            <button
              type="button"
              onClick={() => setForm({ ...VACIO, category: cat || "proteinas" })}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nuevo alimento
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar alimento…" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
            <input type="checkbox" checked={soloPropios} onChange={(e) => setSoloPropios(e.target.checked)} className="accent-violet-600" /> Solo los agregados por nutrición
          </label>
        </div>
        <Categorias valor={cat} onChange={setCat} conteo={conteo} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {lista.map((f) => (
          <TarjetaAlimento
            key={f.id}
            f={f}
            accion={
              puedeEditar && (
                <div className="flex gap-1.5 pt-1 border-t border-slate-100 opacity-70 group-hover:opacity-100">
                  <button type="button" onClick={() => setForm({ ...f })} className="flex-1 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer flex items-center justify-center gap-1">
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`¿Ocultar "${f.name}" del catálogo? Las dietas que ya lo usan no cambian.`)) return;
                      try {
                        await hideFood(f.id);
                      } catch (er) {
                        alert(er.message);
                      }
                    }}
                    className="flex-1 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <EyeOff className="w-3 h-3" /> Ocultar
                  </button>
                </div>
              )
            }
          />
        ))}
      </div>

      {form && <FormularioAlimento inicial={form} onCerrar={() => setForm(null)} />}
    </div>
  );
};

/** Formulario de alimento (nuevo o editar). Lo usan el catálogo y el buscador de cada comida. */
export const FormularioAlimento = ({ inicial, onCerrar, onGuardado }) => {
  const { saveFood } = useGym();
  const [form, setFormInterno] = useState(inicial);
  const [error, setError] = useState("");
  const setForm = (v) => (v === null ? onCerrar() : setFormInterno(v));
  const set = (k) => (e) => setFormInterno((f) => ({ ...f, [k]: e.target.value }));
  const kcalCalc = Math.round(Number(form.protein100 || 0) * 4 + Number(form.carbs100 || 0) * 4 + Number(form.fats100 || 0) * 9);
  const guardar = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setError("");
    try {
      const r = await saveFood({ ...form, emoji: form.emoji || CATEGORIAS[form.category].emoji }, form.id);
      onGuardado?.(r);
      onCerrar();
    } catch (er) {
      setError(er.message);
    }
  };
  return (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <div role="form" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); guardar(e); } }} className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">{form.id ? "Editar alimento" : "Nuevo alimento"}</h3>
              <button type="button" onClick={() => setForm(null)} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-3">
              <label className="w-20">
                <span className="block text-xs font-bold text-slate-600 mb-1">Ícono</span>
                <input value={form.emoji} onChange={set("emoji")} maxLength={4} placeholder={CATEGORIAS[form.category].emoji} className="w-full p-2.5 rounded-xl border border-slate-300 text-2xl text-center" />
              </label>
              <label className="flex-1">
                <span className="block text-xs font-bold text-slate-600 mb-1">Nombre *</span>
                <input required value={form.name} onChange={set("name")} placeholder="Ej. Ceviche de pescado" className="w-full p-2.5 rounded-xl border border-slate-300 text-sm" />
              </label>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-600 mb-1">Categoría *</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(CATEGORIAS).map(([k, c]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: k }))}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer ${form.category === k ? c.activo : c.chip}`}
                  >
                    {c.emoji} {c.nombre}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-600 mb-1">Valores por 100 g *</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  ["protein100", "Proteína", "text-rose-600"],
                  ["carbs100", "Carbohid.", "text-amber-600"],
                  ["fats100", "Grasa", "text-lime-700"],
                  ["fiber100", "Fibra", "text-slate-600"],
                ].map(([k, l, c]) => (
                  <label key={k} className="block">
                    <span className={`block text-[11px] font-bold ${c}`}>{l} (g)</span>
                    <input required={k !== "fiber100"} type="number" step="0.1" min="0" max="100" value={form[k]} onChange={set(k)} className="w-full p-2 rounded-lg border border-slate-300 text-sm font-bold" />
                  </label>
                ))}
              </div>
              <label className="block mt-2">
                <span className="block text-[11px] font-bold text-slate-600">Calorías (kcal) · déjalo vacío para calcular: {kcalCalc} kcal</span>
                <input type="number" step="1" min="0" max="900" value={form.kcal100} onChange={set("kcal100")} placeholder={String(kcalCalc)} className="w-full p-2 rounded-lg border border-slate-300 text-sm font-bold" />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="block text-xs font-bold text-slate-600 mb-1">Porción (g) *</span>
                <input required type="number" step="0.5" min="1" max="2000" value={form.portionGrams} onChange={set("portionGrams")} className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold" />
              </label>
              <label className="block col-span-2">
                <span className="block text-xs font-bold text-slate-600 mb-1">Medida casera / de mano</span>
                <input value={form.portionText} onChange={set("portionText")} maxLength={60} placeholder="Ej. 1 palma · 1 filete" className="w-full p-2.5 rounded-xl border border-slate-300 text-sm" />
              </label>
            </div>
            <details className="rounded-xl border border-slate-200 p-3" open={!!(form.sugar100 || form.sodium100 || form.glycemic || form.tags || form.notes)}>
              <summary className="text-xs font-bold text-slate-600 cursor-pointer">Más información (opcional): azúcares, sodio, índice glucémico, etiquetas</summary>
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="block text-[11px] font-bold text-slate-600">Azúcares (g / 100 g)</span>
                    <input type="number" step="0.1" min="0" max="100" value={form.sugar100 ?? ""} onChange={set("sugar100")} className="w-full p-2 rounded-lg border border-slate-300 text-sm" />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-bold text-slate-600">Sodio (mg / 100 g)</span>
                    <input type="number" step="1" min="0" max="40000" value={form.sodium100 ?? ""} onChange={set("sodium100")} className="w-full p-2 rounded-lg border border-slate-300 text-sm" />
                  </label>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Índice glucémico</span>
                  <div className="flex gap-1.5">
                    {["bajo", "medio", "alto"].map((g) => (
                      <button key={g} type="button" onClick={() => setForm((f) => ({ ...f, glycemic: f.glycemic === g ? "" : g }))} className={`px-3 py-1 rounded-full border text-xs font-bold cursor-pointer capitalize ${form.glycemic === g ? IG[g] + " ring-2 ring-offset-1 ring-slate-300" : "bg-white border-slate-200 text-slate-500"}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Etiquetas</span>
                  <div className="flex flex-wrap gap-1">
                    {ETIQUETAS.map((t) => {
                      const lista = String(form.tags || "").split(",").map((x) => x.trim()).filter(Boolean);
                      const on = lista.includes(t);
                      return (
                        <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, tags: (on ? lista.filter((x) => x !== t) : [...lista, t]).join(", ") }))} className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold cursor-pointer ${on ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="block">
                  <span className="block text-[11px] font-bold text-slate-600">Dato útil para el alumno</span>
                  <input value={form.notes || ""} onChange={set("notes")} maxLength={200} placeholder="Ej. Rico en hierro; combinar con limón" className="w-full p-2 rounded-lg border border-slate-300 text-sm" />
                </label>
              </div>
            </details>
            {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
            <button type="button" onClick={guardar} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Guardar alimento
            </button>
          </div>
        </div>
  );
};
