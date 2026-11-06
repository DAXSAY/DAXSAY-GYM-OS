// Indicaciones para el alumno: estiramientos, movilidad, calentamiento, postura y cuidados.
// El profesional solo elige (clic) y ajusta si hace falta; la dosis estándar ya viene puesta:
// estiramientos 3 x 30 s, movilidad y calentamiento 2 x 15.
import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ClipboardList, Home, Plus, Save, Search, Sunrise, Sunset, Trash2, X } from "lucide-react";
import { api } from "../../api/cliente";
import { useGym } from "../../context/GymContext";
import { buscarAlumno } from "../../utils/codigo";

export const CATEGORIAS = {
  calentamiento: { label: "Calentamiento articular", corto: "Calentamiento", emoji: "🔥", chip: "bg-orange-50 text-orange-800 border-orange-200", activo: "bg-orange-500 text-white border-orange-500" },
  movilidad: { label: "Movilidad", corto: "Movilidad", emoji: "🔄", chip: "bg-sky-50 text-sky-800 border-sky-200", activo: "bg-sky-600 text-white border-sky-600" },
  estiramiento: { label: "Estiramientos", corto: "Estiramiento", emoji: "🧘", chip: "bg-emerald-50 text-emerald-800 border-emerald-200", activo: "bg-emerald-600 text-white border-emerald-600" },
  postura: { label: "Postura (ligas)", corto: "Postura", emoji: "🧍", chip: "bg-violet-50 text-violet-800 border-violet-200", activo: "bg-violet-600 text-white border-violet-600" },
  cuidado: { label: "Cuidados", corto: "Cuidado", emoji: "🩹", chip: "bg-rose-50 text-rose-800 border-rose-200", activo: "bg-rose-600 text-white border-rose-600" },
};

export const LUGARES = {
  antes: { label: "Antes de entrenar", corto: "Antes", icon: Sunrise, color: "text-orange-600" },
  despues: { label: "Después de entrenar", corto: "Después", icon: Sunset, color: "text-emerald-700" },
  casa: { label: "En casa", corto: "Casa", icon: Home, color: "text-blue-700" },
};

const ORDEN_LUGAR = { antes: 0, despues: 1, casa: 2 };

export const textoDosis = (it) => {
  if (!it?.sets && !it?.reps && !it?.seconds) return "";
  const s = it.sets ? `${it.sets} × ` : "";
  if (it.seconds) return `${s}${it.seconds} seg`;
  if (it.reps) return `${s}${it.reps} reps`;
  return it.sets ? `${it.sets} series` : "";
};

const fc = (f) => (f ? String(f).slice(0, 10).split("-").reverse().join("/") : "");

const ordenar = (lista, orden) =>
  [...lista].sort((a, b) => ORDEN_LUGAR[a.place] - ORDEN_LUGAR[b.place] || (orden[a.id] ?? 999) - (orden[b.id] ?? 999));

// ---------------------------------------------------------------------
// Editor (entrenador / fisioterapeuta)
// ---------------------------------------------------------------------
/**
 * Selector controlado de indicaciones (catálogo + plantillas a la izquierda, lo elegido a la derecha).
 * Lo usan el editor de Rutinas/Alumnos y la evaluación de fisioterapia.
 */
export function SelectorIndicaciones({ items: sel = [], onChange, notas = "", onNotas, titulo, subtitulo, sugerencias = [], pie, mensaje, sinNotas = false }) {
  const [catalogo, setCatalogo] = useState({ items: [], plantillas: [], puedeIndicar: false });
  const [msg, setMsg] = useState({ ok: "", error: "" });
  const [nueva, setNueva] = useState(null);
  const [filtro, setFiltro] = useState("");
  const setSel = (v) => onChange?.(typeof v === "function" ? v(sel) : v);
  const setNotas = (v) => onNotas?.(v);

  const cargarCatalogo = () => api("/indicaciones/catalogo").then(setCatalogo).catch((e) => setMsg({ ok: "", error: e.message }));
  useEffect(() => {
    cargarCatalogo();
  }, []);

  const porId = useMemo(() => Object.fromEntries(catalogo.items.map((i) => [i.id, i])), [catalogo.items]);
  const orden = useMemo(() => Object.fromEntries(catalogo.items.map((i) => [i.id, i.order])), [catalogo.items]);
  const elegidos = useMemo(() => new Set(sel.map((s) => s.id)), [sel]);
  const puede = catalogo.puedeIndicar;

  const desdeCatalogo = (it, place) => ({
    id: it.id, name: it.name, category: it.category, place: place || it.place,
    sets: it.sets, reps: it.reps, seconds: it.seconds, detail: it.detail,
  });
  const alternar = (it) => {
    if (!puede) return;
    setMsg({ ok: "", error: "" });
    setSel((s) => (s.some((x) => x.id === it.id) ? s.filter((x) => x.id !== it.id) : ordenar([...s, desdeCatalogo(it)], orden)));
  };
  const aplicarPlantilla = (p) => {
    if (!puede) return;
    setSel((s) => {
      const lista = [...s];
      for (const pi of p.items) {
        const it = porId[pi.id];
        if (!it) continue;
        const i = lista.findIndex((x) => x.id === it.id);
        if (i >= 0) lista[i] = { ...lista[i], place: pi.place };
        else lista.push(desdeCatalogo(it, pi.place));
      }
      return ordenar(lista, orden);
    });
    setMsg({ ok: `Plantilla "${p.name}" agregada. Ajusta lo que quieras y guarda.`, error: "" });
  };
  const sugeridos = sugerencias.map((n) => catalogo.items.find((i) => i.name === n)).filter(Boolean).filter((i) => !elegidos.has(i.id));
  const aplicarSugerencias = () => {
    setSel((s) => ordenar([...s, ...sugeridos.map((it) => desdeCatalogo(it))], orden));
    setMsg({ ok: `${sugeridos.length} indicaciones sugeridas según la evaluación. Revisa y ajusta.`, error: "" });
  };
  const cambiar = (id, campo, valor) => setSel((s) => ordenar(s.map((x) => (x.id === id ? { ...x, [campo]: valor } : x)), orden));

  const guardarPlantilla = async () => {
    const nombre = window.prompt("Nombre de la plantilla (ej. Lumbalgia crónica):");
    if (!nombre) return;
    try {
      await api("/indicaciones/plantillas", {
        method: "POST",
        body: { name: nombre, items: sel.filter((x) => /^\d+$/.test(String(x.id))).map((x) => ({ id: x.id, place: x.place })) },
      });
      await cargarCatalogo();
      setMsg({ ok: `Plantilla "${nombre}" creada.`, error: "" });
    } catch (e) {
      setMsg({ ok: "", error: e.message });
    }
  };
  const quitarPlantilla = async (p) => {
    if (!window.confirm(`¿Quitar la plantilla "${p.name}"?`)) return;
    try {
      await api(`/indicaciones/plantillas/${p.id}`, { method: "DELETE" });
      await cargarCatalogo();
    } catch (e) {
      setMsg({ ok: "", error: e.message });
    }
  };
  const crearIndicacion = async (e) => {
    e?.preventDefault?.();
    if (!nueva?.name?.trim()) return setMsg({ ok: "", error: "Escribe el nombre de la indicación" });
    try {
      const it = await api("/indicaciones/catalogo", { method: "POST", body: nueva });
      await cargarCatalogo();
      setSel((s) => ordenar([...s, desdeCatalogo(it)], { ...orden, [it.id]: it.order }));
      setNueva(null);
      setMsg({ ok: `"${it.name}" agregada al catálogo y a este alumno.`, error: "" });
    } catch (er) {
      setMsg({ ok: "", error: er.message });
    }
  };

  const q = filtro.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const visibles = (cat) =>
    catalogo.items.filter((i) => i.category === cat && (!q || i.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)));

  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4 items-start">
      {/* Izquierda: elegir */}
      <div className="space-y-4">
        <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Plantillas · un clic</p>
          <div className="flex flex-wrap gap-2">
            {catalogo.plantillas.map((p) => (
              <span key={p.id} className="inline-flex items-center">
                <button
                  type="button"
                  disabled={!puede}
                  onClick={() => aplicarPlantilla(p)}
                  title={p.description}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer disabled:cursor-default ${
                    p.custom ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-300 hover:border-slate-500"
                  } ${p.custom ? "rounded-r-none" : ""}`}
                >
                  + {p.name} <span className="opacity-60">({p.items.length})</span>
                </button>
                {p.custom && puede && (
                  <button type="button" onClick={() => quitarPlantilla(p)} title="Quitar plantilla" className="px-1.5 py-1.5 rounded-r-full bg-slate-700 text-white text-xs cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar indicación…" className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
            </div>
            {puede && (
              <button
                type="button"
                onClick={() => setNueva(nueva ? null : { name: "", category: "estiramiento", zone: "general", sets: 3, seconds: 30, reps: "", place: "despues", detail: "" })}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer hover:bg-slate-50"
              >
                <Plus className="w-3.5 h-3.5" /> Nueva
              </button>
            )}
          </div>

          {nueva && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <input required autoFocus value={nueva.name} onChange={(e) => setNueva({ ...nueva, name: e.target.value })} placeholder="Nombre (ej. Estiramiento de antebrazo)" className="col-span-2 sm:col-span-4 px-2 py-1.5 rounded-md border border-slate-300 text-sm" />
              <select
                value={nueva.category}
                onChange={(e) => {
                  const c = e.target.value;
                  const est = c === "estiramiento";
                  const cui = c === "cuidado";
                  setNueva({ ...nueva, category: c, sets: cui ? "" : est ? 3 : 2, seconds: est ? 30 : "", reps: est || cui ? "" : 15, place: cui ? "casa" : est ? "despues" : "antes" });
                }}
                className="px-2 py-1.5 rounded-md border border-slate-300"
              >
                {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v.corto}</option>)}
              </select>
              <select value={nueva.zone} onChange={(e) => setNueva({ ...nueva, zone: e.target.value })} className="px-2 py-1.5 rounded-md border border-slate-300">
                {["general", "cuello", "hombro", "brazo", "pecho", "espalda", "tronco", "cadera", "gluteo", "muslo", "pierna", "tobillo"].map((z) => <option key={z} value={z}>{z === "gluteo" ? "glúteo" : z}</option>)}
              </select>
              <label className="flex items-center gap-1">Series <input type="number" min="1" max="10" value={nueva.sets} onChange={(e) => setNueva({ ...nueva, sets: e.target.value })} className="w-12 px-1 py-1 rounded border border-slate-300" /></label>
              {nueva.category === "estiramiento" ? (
                <label className="flex items-center gap-1">Seg. <input type="number" min="5" max="600" value={nueva.seconds} onChange={(e) => setNueva({ ...nueva, seconds: e.target.value })} className="w-14 px-1 py-1 rounded border border-slate-300" /></label>
              ) : (
                <label className="flex items-center gap-1">Reps <input type="number" min="1" max="100" value={nueva.reps} onChange={(e) => setNueva({ ...nueva, reps: e.target.value })} className="w-14 px-1 py-1 rounded border border-slate-300" /></label>
              )}
              <input value={nueva.detail} onChange={(e) => setNueva({ ...nueva, detail: e.target.value })} placeholder="Cómo se hace (opcional)" className="col-span-2 sm:col-span-3 px-2 py-1.5 rounded-md border border-slate-300" />
              <button type="button" onClick={crearIndicacion} className="px-3 py-1.5 rounded-md bg-blue-600 text-white font-bold cursor-pointer">Agregar</button>
            </div>
          )}

          {Object.entries(CATEGORIAS).map(([cat, c]) => {
            const lista = visibles(cat);
            if (!lista.length) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-bold text-slate-600 mb-1.5">
                  {c.emoji} {c.label}
                  {cat === "estiramiento" && <span className="font-normal text-slate-400"> · 3 × 30 s</span>}
                  {(cat === "movilidad" || cat === "calentamiento") && <span className="font-normal text-slate-400"> · 2 × 15</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lista.map((it) => {
                    const on = elegidos.has(it.id);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        disabled={!puede}
                        onClick={() => alternar(it)}
                        title={it.detail}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer disabled:cursor-default transition-colors ${on ? c.activo : c.chip + " hover:brightness-95"}`}
                      >
                        {on && <Check className="w-3 h-3 inline -mt-0.5 mr-0.5" />}
                        {it.name.replace(/^Estiramiento de /, "").replace(/^Movilización de /, "Mov. ").replace(/^Movilidad de /, "")}
                        {it.custom && <span className="opacity-60"> ★</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* Derecha: lo indicado */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 lg:sticky lg:top-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" /> {titulo || "Indicaciones elegidas"}
          </h3>
          {sel.length > 0 && puede && (
            <button type="button" onClick={() => setSel([])} className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer">Vaciar</button>
          )}
        </div>
        {subtitulo && <p className="text-[11px] text-slate-400">{subtitulo}</p>}
        {puede && sugeridos.length > 0 && (
          <button type="button" onClick={aplicarSugerencias} className="w-full text-left rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900 cursor-pointer hover:bg-cyan-100">
            ✨ <b>Sugerir según la evaluación</b> ({sugeridos.length}): {sugeridos.slice(0, 4).map((i) => i.name.replace(/^Estiramiento de /, "Est. ")).join(", ")}
            {sugeridos.length > 4 ? "…" : ""}
          </button>
        )}

        {sel.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">Elige una plantilla o toca las indicaciones de la izquierda.</p>
        ) : (
          Object.entries(LUGARES).map(([lugar, L]) => {
            const lista = sel.filter((x) => x.place === lugar);
            if (!lista.length) return null;
            const Icono = L.icon;
            return (
              <div key={lugar} className="space-y-1.5">
                <p className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${L.color}`}>
                  <Icono className="w-3.5 h-3.5" /> {L.label} ({lista.length})
                </p>
                {lista.map((x) => (
                  <div key={x.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
                    <span className="text-sm">{CATEGORIAS[x.category]?.emoji}</span>
                    <span className="flex-1 min-w-0 text-sm text-slate-800 truncate" title={x.detail}>{x.name}</span>
                    {x.category !== "cuidado" && (
                      <span className="flex items-center gap-0.5 text-xs text-slate-500">
                        <input disabled={!puede} type="number" min="1" max="10" value={x.sets ?? ""} onChange={(e) => cambiar(x.id, "sets", e.target.value)} className="w-9 px-1 py-0.5 rounded border border-slate-200 text-center" />×
                        {(() => {
                          const enSeg = x.seconds != null && x.seconds !== "" ? true : x.reps != null && x.reps !== "" ? false : x.category === "estiramiento";
                          const campo = enSeg ? "seconds" : "reps";
                          return (
                            <>
                              <input disabled={!puede} type="number" min="1" max={enSeg ? 600 : 100} value={x[campo] ?? ""} onChange={(e) => cambiar(x.id, campo, e.target.value)} className="w-11 px-1 py-0.5 rounded border border-slate-200 text-center" />
                              <button
                                type="button"
                                disabled={!puede}
                                title="Cambiar entre repeticiones y segundos"
                                onClick={() => setSel((s) => s.map((y) => (y.id === x.id ? { ...y, seconds: enSeg ? null : y.reps || y.seconds || 30, reps: enSeg ? y.seconds || y.reps || 15 : null } : y)))}
                                className={`w-9 py-0.5 rounded text-[10px] font-bold cursor-pointer disabled:cursor-default ${enSeg ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}
                              >
                                {enSeg ? "seg" : "reps"}
                              </button>
                            </>
                          );
                        })()}
                      </span>
                    )}
                    <span className="flex rounded-md border border-slate-200 overflow-hidden">
                      {Object.entries(LUGARES).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          disabled={!puede}
                          onClick={() => cambiar(x.id, "place", k)}
                          title={v.label}
                          className={`px-1.5 py-0.5 text-[11px] font-semibold cursor-pointer disabled:cursor-default ${x.place === k ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          {v.corto}
                        </button>
                      ))}
                    </span>
                    {puede && (
                      <button type="button" onClick={() => setSel((s) => s.filter((y) => y.id !== x.id))} title="Quitar" className="text-slate-300 hover:text-rose-600 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}

        {!sinNotas && <textarea
          disabled={!puede}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Nota para el alumno (opcional). Ej.: si no te alcanza el tiempo, haz los estiramientos en casa."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
        />}
        {(mensaje?.error || msg.error) && <p className="text-sm font-semibold text-rose-600">{mensaje?.error || msg.error}</p>}
        {(mensaje?.ok || msg.ok) && <p className="text-sm font-semibold text-emerald-700">{mensaje?.ok || msg.ok}</p>}
        {!puede && <p className="text-xs text-slate-500">Solo el entrenador o el fisioterapeuta pueden cambiar las indicaciones.</p>}
        {puede && sel.length > 1 && (
          <button type="button" onClick={guardarPlantilla} className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer">
            Guardar esta combinación como plantilla
          </button>
        )}
        {pie}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------
// Editor con guardado e historial (Rutinas / ficha del alumno)
// ---------------------------------------------------------------------
export function EditorIndicaciones({ member }) {
  const [datos, setDatos] = useState({ vigente: null, historial: [] });
  const [sel, setSel] = useState([]);
  const [notas, setNotas] = useState("");
  const [msg, setMsg] = useState({ ok: "", error: "" });
  const [guardando, setGuardando] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);
  const [puede, setPuede] = useState(false);
  useEffect(() => {
    api("/indicaciones/catalogo").then((c) => setPuede(!!c.puedeIndicar)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!member?.id) return;
    setMsg({ ok: "", error: "" });
    api(`/indicaciones/alumno/${member.id}`)
      .then((d) => {
        setDatos(d);
        setSel(d.vigente?.items?.map((i) => ({ ...i, id: i.id || `x${Math.random()}` })) || []);
        setNotas(d.vigente?.notes || "");
      })
      .catch((e) => setMsg({ ok: "", error: e.message }));
  }, [member?.id]);
  const guardar = async () => {
    setGuardando(true);
    setMsg({ ok: "", error: "" });
    try {
      const d = await api(`/indicaciones/alumno/${member.id}`, {
        method: "POST",
        body: { items: sel.map((x) => ({ ...x, id: /^\d+$/.test(String(x.id)) ? x.id : null })), notes: notas },
      });
      setDatos(d);
      setMsg({ ok: `Indicaciones guardadas. ${member.firstName || "El alumno"} ya las ve en su portal (Mi Rutina).`, error: "" });
    } catch (e) {
      setMsg({ ok: "", error: e.message });
    } finally {
      setGuardando(false);
    }
  };
  return (
    <SelectorIndicaciones
      items={sel}
      onChange={(v) => { setSel(v); setMsg({ ok: "", error: "" }); }}
      notas={notas}
      onNotas={setNotas}
      titulo={`Indicado a ${member.firstName || member.fullName}`}
      subtitulo={datos.vigente ? `Vigente desde el ${fc(datos.vigente.date)} · ${datos.vigente.by}` : ""}
      mensaje={msg}
      pie={
        <>
          {puede && (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={guardando || (!sel.length && !notas.trim())} onClick={guardar} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer">
                <Save className="w-4 h-4" /> {guardando ? "Guardando…" : "Guardar indicaciones"}
              </button>
              {datos.vigente && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("¿Quitar las indicaciones vigentes? Quedarán en el historial.")) return;
                    await api(`/indicaciones/alumno/${member.id}`, { method: "DELETE" });
                    setDatos((d) => ({ vigente: null, historial: d.vigente ? [{ ...d.vigente, current: false }, ...d.historial] : d.historial }));
                    setSel([]);
                    setNotas("");
                  }}
                  className="px-3 py-2 rounded-xl text-rose-600 text-sm font-semibold cursor-pointer hover:bg-rose-50 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Quitar
                </button>
              )}
            </div>
          )}
          {datos.historial.length > 0 && (
            <div className="border-t border-slate-100 pt-2">
              <button type="button" onClick={() => setVerHistorial((v) => !v)} className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${verHistorial ? "rotate-180" : ""}`} /> Historial ({datos.historial.length})
              </button>
              {verHistorial && (
                <div className="mt-2 space-y-2">
                  {datos.historial.map((h) => (
                    <div key={h.id} className="text-xs text-slate-600 rounded-lg bg-slate-50 p-2">
                      <b>{fc(h.date)}</b> · {h.by} — {h.items.map((i) => i.name.replace(/^Estiramiento de /, "Est. ")).join(", ") || "sin ejercicios"}
                      {h.notes && <p className="italic mt-0.5">“{h.notes}”</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      }
    />
  );
}

// ---------------------------------------------------------------------
// Panel con buscador de alumno (módulo de Rutinas)
// ---------------------------------------------------------------------
export function PanelIndicaciones() {
  const { members } = useGym();
  const [texto, setTexto] = useState("");
  const [elegido, setElegido] = useState(null);
  const sugerencias = useMemo(() => {
    const t = texto.trim().toLowerCase();
    if (!t) return [];
    const exacto = buscarAlumno(members, texto)?.member;
    const lista = members.filter(
      (m) => m.fullName.toLowerCase().includes(t) || m.dni.includes(t) || (m.codeLabel || "").toLowerCase().replace("-", "").includes(t.replace(/[\s-]/g, "")),
    );
    return [...(exacto ? [exacto] : []), ...lista.filter((m) => m.id !== exacto?.id)].slice(0, 8);
  }, [texto, members]);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-800 mb-2">¿A qué alumno le das indicaciones?</p>
        <input value={texto} onChange={(e) => { setTexto(e.target.value); setElegido(null); }} placeholder="Código (ej. DF-1), DNI o nombre" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" />
        {!elegido && sugerencias.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {sugerencias.map((m) => (
              <button key={m.id} type="button" onClick={() => { setElegido(m); setTexto(m.fullName); }} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 text-sm cursor-pointer">
                <span className="font-mono font-bold text-blue-700 mr-1.5">{m.codeLabel}</span>
                {m.fullName}
              </button>
            ))}
          </div>
        )}
      </div>
      {elegido && <EditorIndicaciones key={elegido.id} member={elegido} />}
    </div>
  );
}

// ---------------------------------------------------------------------
// Vista del alumno (portal)
// ---------------------------------------------------------------------
export function MisIndicaciones({ memberId }) {
  const [datos, setDatos] = useState(null);
  const [hechos, setHechos] = useState({});
  useEffect(() => {
    if (!memberId) return;
    api(`/indicaciones/alumno/${memberId}`).then(setDatos).catch(() => setDatos({ vigente: null }));
  }, [memberId]);
  const v = datos?.vigente;
  if (!v) return null;
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-600" /> Indicaciones de tu {/fisio/i.test(v.byRole) ? "fisioterapeuta" : "entrenador"}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Desde el {fc(v.date)}{v.by ? ` · ${v.by}` : ""}. Toca cada ejercicio para marcarlo como hecho hoy.
        </p>
      </div>
      {v.notes && <p className="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">💬 {v.notes}</p>}
      <div className="grid md:grid-cols-3 gap-3">
        {Object.entries(LUGARES).map(([lugar, L]) => {
          const lista = v.items.filter((i) => i.place === lugar);
          if (!lista.length) return null;
          const Icono = L.icon;
          return (
            <div key={lugar} className="rounded-xl border border-slate-200 p-3 space-y-1.5">
              <p className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${L.color}`}>
                <Icono className="w-3.5 h-3.5" /> {L.label}
              </p>
              {lista.map((i, n) => {
                const k = `${lugar}-${n}`;
                const ok = hechos[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setHechos((h) => ({ ...h, [k]: !h[k] }))}
                    className={`w-full text-left flex items-start gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${ok ? "bg-emerald-50" : "hover:bg-slate-50"}`}
                  >
                    <span className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center ${ok ? "bg-emerald-600 border-emerald-600" : "border-slate-300"}`}>
                      {ok && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1">
                      <span className={`text-sm ${ok ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {CATEGORIAS[i.category]?.emoji} {i.name}
                      </span>
                      {i.detail && <span className="block text-[11px] text-slate-500">{i.detail}</span>}
                    </span>
                    {textoDosis(i) && <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{textoDosis(i)}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Sugerencias según la evaluación de fisioterapia (hallazgos posturales, zonas y dolor)
// ---------------------------------------------------------------------
const REGLAS_SUGERENCIA = [
  [/cabeza adelantada|forward head|rectificaci[oó]n cervical|inversi[oó]n de la curva cervical/i, ["Retracción de mentón (chin tuck)", "Estiramiento de trapecio lateral", "Estiramiento de trapecio frontal", "Movilidad de cabeza y cuello"]],
  [/hipercifosis|dorso|hombros protra|hombros elevados|esc[aá]pula alada/i, ["Estiramiento de pectoral", "Movilización escapular", "Rotaciones de hombro", "Trasnuca con liga", "Apertura de liga al pecho (pull apart)"]],
  [/hiperlordosis lumbar|anteversi[oó]n|abdomen prominente/i, ["Estiramiento de psoas", "Estiramiento de cuádriceps", "Estiramiento lumbar", "Movilidad de cintura pélvica"]],
  [/rectificaci[oó]n lumbar|retroversi[oó]n|inversi[oó]n de la curva lumbar/i, ["Estiramiento de isquiotibiales", "Movilidad de cintura pélvica", "Movilización de cadera"]],
  [/genu valgo|valgo din[aá]mico/i, ["Estiramiento de aductores", "Movilización de cadera", "Estiramiento de glúteo"]],
  [/genu varo/i, ["Estiramiento de abductores", "Movilización de cadera"]],
  [/recurvatum|genu flexo/i, ["Estiramiento de isquiotibiales", "Estiramiento de pantorrilla"]],
  [/pie plano|pronaci[oó]n|pie cavo|supinaci[oó]n|aquiles/i, ["Estiramiento de pantorrilla", "Movilización de tobillo"]],
  [/derrame|bursitis/i, ["Hielo en la zona de dolor", "Usar rodilleras al entrenar"]],
  [/escoliosis|rotaci[oó]n de tronco|inclinaci[oó]n p[eé]lvica/i, ["Estiramiento de dorsal lateral", "Movilidad de tronco", "Movilidad de cintura pélvica"]],
];
const SUGERENCIA_ZONA = {
  cervical: ["Estiramiento de trapecio lateral", "Movilidad de cabeza y cuello"],
  hombro: ["Rotaciones de hombro", "Estiramiento de hombro", "Movilización escapular"],
  columna_dorsal: ["Movilización de dorsal", "Estiramiento de dorsal frontal"],
  lumbar: ["Estiramiento lumbar", "Estiramiento de glúteo", "Movilidad de cintura pélvica"],
  codo: ["Estiramiento de bíceps", "Estiramiento de tríceps"],
  codo_muneca: ["Estiramiento de bíceps", "Movilidad de codos y muñecas"],
  muneca_mano: ["Movilidad de codos y muñecas"],
  cadera: ["Movilización de cadera", "Estiramiento de psoas", "Estiramiento de glúteo"],
  rodilla: ["Estiramiento de cuádriceps", "Estiramiento de isquiotibiales"],
  tobillo_pie: ["Movilización de tobillo", "Estiramiento de pantorrilla"],
};
export function sugerirIndicaciones({ hallazgos = [], zonas = [], dolor = 0 } = {}) {
  const out = [];
  const add = (lista) => lista.forEach((n) => !out.includes(n) && out.push(n));
  const texto = hallazgos.join(" | ");
  REGLAS_SUGERENCIA.forEach(([re, lista]) => re.test(texto) && add(lista));
  zonas.forEach((z) => add(SUGERENCIA_ZONA[z] || []));
  if (Number(dolor) >= 6) add(["Hielo en la zona de dolor"]);
  return out;
}

/** Texto corto de las indicaciones (para reportes y WhatsApp) */
export function textoIndicaciones(items = []) {
  return Object.entries(LUGARES)
    .map(([k, L]) => {
      const l = items.filter((i) => i.place === k);
      return l.length ? `${L.label}: ${l.map((i) => `${i.name}${textoDosis(i) ? ` (${textoDosis(i)})` : ""}`).join(", ")}` : null;
    })
    .filter(Boolean)
    .join(". ");
}
