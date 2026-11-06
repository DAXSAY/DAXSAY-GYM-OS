// Mensajes predeterminados por categoría (15 por categoría, editables) y envío por WhatsApp
// a los alumnos de cada categoría con el texto ya personalizado.
import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Edit3, MessageCircle, Plus, Search, Shuffle, Trash2, X } from "lucide-react";
import { api } from "../../api/cliente";
import { useGym } from "../../context/GymContext";
import { userCan } from "../../config/roles";

export const CATEGORIAS_MSG = [
  { id: "por_vencer", emoji: "⏳", label: "Por vencer", desc: "Vencen en los próximos 7 días" },
  { id: "vencidos", emoji: "💔", label: "Vencidos", desc: "Vencieron hace menos de 30 días" },
  { id: "no_vienen", emoji: "🪑", label: "No vienen", desc: "Plan activo y 15+ días sin venir" },
  { id: "deuda", emoji: "💳", label: "Deuda pendiente", desc: "Tienen saldo por pagar" },
  { id: "renovaron", emoji: "🙌", label: "Renovaron", desc: "Renovaron en los últimos 7 días" },
  { id: "bienvenida", emoji: "🎉", label: "Nuevos", desc: "Inscritos en los últimos 7 días" },
  { id: "cumpleanos", emoji: "🎂", label: "Cumpleaños", desc: "Cumplen años este mes" },
  { id: "congelamiento", emoji: "❄️", label: "Regresan", desc: "Vuelven de congelar en ≤ 7 días" },
  { id: "constancia", emoji: "🏆", label: "Constantes", desc: "12 o más asistencias en 30 días" },
  { id: "exalumnos", emoji: "👋", label: "Exalumnos", desc: "Vencieron hace más de 30 días" },
];

const VARIABLES = ["nombre", "plan", "fecha_vencimiento", "dias", "deuda", "fecha_limite", "codigo", "fecha_regreso", "asistencias", "gym"];
const fc = (f) => (f ? String(f).slice(0, 10).split("-").reverse().join("/") : "");

export function personalizar(texto, a, gym) {
  const v = {
    nombre: a?.firstName || "",
    plan: a?.plan || "tu plan",
    fecha_vencimiento: fc(a?.endDate) || "—",
    dias: a?.days ?? "",
    deuda: a?.debt != null ? Number(a.debt).toFixed(2) : "",
    fecha_limite: fc(a?.debtDueDate) || "—",
    codigo: a?.codeLabel || "",
    fecha_regreso: fc(a?.returnDate) || "—",
    asistencias: a?.attendances30 ?? "",
    gym: gym || "RADICAL",
  };
  return String(texto || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in v ? String(v[k]) : m));
}

const enlaceWsp = (telefono, texto) => {
  let t = String(telefono || "").replace(/\D/g, "");
  if (t.length === 9) t = `51${t}`;
  return t.length >= 10 ? `https://wa.me/${t}?text=${encodeURIComponent(texto)}` : null;
};

const detalle = (cat, a) =>
  ({
    por_vencer: a.days === 0 ? "Vence hoy" : `Vence en ${a.days} día${a.days === 1 ? "" : "s"}`,
    vencidos: `Venció hace ${a.days} día${a.days === 1 ? "" : "s"}`,
    exalumnos: `Venció hace ${a.days} días`,
    no_vienen: `${a.days} días sin venir`,
    deuda: `Debe S/ ${a.debt.toFixed(2)}${a.debtDueDate ? ` · hasta ${fc(a.debtDueDate)}` : ""}`,
    renovaron: `${a.plan} · hasta ${fc(a.endDate)}`,
    bienvenida: a.days === 0 ? "Se inscribió hoy" : `Inscrito hace ${a.days} día${a.days === 1 ? "" : "s"}`,
    cumpleanos: a.today ? "🎉 ¡Hoy!" : `Cumple el ${a.birthday}`,
    congelamiento: `Vuelve el ${fc(a.returnDate)}`,
    constancia: `${a.attendances30} asistencias en 30 días`,
  })[cat] || "";

// Lo enviado se recuerda solo en este navegador y por día (para no repetir)
const claveEnviados = (hoy) => `radicalgym_msg_enviados_${hoy}`;
const leerEnviados = (hoy) => {
  try {
    return JSON.parse(localStorage.getItem(claveEnviados(hoy)) || "{}");
  } catch {
    return {};
  }
};

export function MensajesCategorias() {
  const { currentUser } = useGym();
  const puedeEditar = userCan(currentUser, "alerts", "editar");
  const [plantillas, setPlantillas] = useState([]);
  const [dest, setDest] = useState({ hoy: "", gym: "", categorias: {} });
  const [cat, setCat] = useState("por_vencer");
  const [selMsg, setSelMsg] = useState(null);
  const [variar, setVariar] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState("");
  const [enviados, setEnviados] = useState({});
  const [copiado, setCopiado] = useState("");

  const cargar = () =>
    Promise.all([api("/mensajes/plantillas"), api("/mensajes/destinatarios")])
      .then(([p, d]) => {
        setPlantillas(p);
        setDest(d);
        setEnviados(leerEnviados(d.hoy));
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);

  const mensajes = useMemo(() => plantillas.filter((p) => p.category === cat), [plantillas, cat]);
  const alumnos = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return (dest.categorias[cat] || []).filter((a) => !q || a.name.toLowerCase().includes(q) || a.codeLabel.toLowerCase().includes(q));
  }, [dest, cat, buscar]);
  useEffect(() => {
    setSelMsg(null);
    setEditando(null);
    setBuscar("");
  }, [cat]);
  const elegido = mensajes.find((m) => m.id === selMsg) || mensajes[0];
  const mensajePara = (a, i) => (variar && !selMsg ? mensajes[i % Math.max(mensajes.length, 1)] : elegido);

  const marcar = (a) => {
    const k = `${cat}:${a.id}`;
    const nuevo = { ...enviados, [k]: true };
    setEnviados(nuevo);
    try {
      localStorage.setItem(claveEnviados(dest.hoy), JSON.stringify(nuevo));
    } catch {
      /* navegador sin almacenamiento */
    }
  };
  const copiar = async (texto, id) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      setTimeout(() => setCopiado(""), 1500);
    } catch {
      /* sin permiso de portapapeles */
    }
  };

  const guardar = async () => {
    setError("");
    try {
      const body = { category: cat, title: editando.title, message: editando.message };
      const r = editando.id ? await api(`/mensajes/plantillas/${editando.id}`, { method: "PUT", body }) : await api("/mensajes/plantillas", { method: "POST", body });
      setPlantillas((ps) => (editando.id ? ps.map((p) => (p.id === r.id ? r : p)) : [r, ...ps]));
      setSelMsg(r.id);
      setEditando(null);
    } catch (e) {
      setError(e.message);
    }
  };
  const quitar = async (m) => {
    if (!window.confirm(`¿Quitar el mensaje "${m.title}"?`)) return;
    await api(`/mensajes/plantillas/${m.id}`, { method: "DELETE" });
    setPlantillas((ps) => ps.filter((p) => p.id !== m.id));
    if (selMsg === m.id) setSelMsg(null);
  };

  const info = CATEGORIAS_MSG.find((c) => c.id === cat);
  const ejemplo = alumnos[0] || { firstName: "María", plan: "Mensual", endDate: dest.hoy, days: 3, debt: 50, debtDueDate: dest.hoy, codeLabel: "MG-12", returnDate: dest.hoy, attendances30: 14 };
  const enviadosCat = alumnos.filter((a) => enviados[`${cat}:${a.id}`]).length;

  return (
    <div className="space-y-4">
      {/* Categorías */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {CATEGORIAS_MSG.map((c) => {
          const n = (dest.categorias[c.id] || []).length;
          const on = c.id === cat;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`text-left rounded-xl border p-3 cursor-pointer transition-colors ${on ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-400"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{c.emoji}</span>
                <span className={`min-w-6 h-6 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${n ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>{n}</span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{c.label}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{c.desc}</p>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Mensajes */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">
              {info?.emoji} Mensajes · {info?.label} <span className="text-slate-400 font-normal">({mensajes.length})</span>
            </h3>
            {puedeEditar && !editando && (
              <button type="button" onClick={() => setEditando({ title: "", message: "" })} className="text-xs font-bold text-blue-700 flex items-center gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Nuevo mensaje
              </button>
            )}
          </div>

          {editando && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
              <input value={editando.title} onChange={(e) => setEditando({ ...editando, title: e.target.value })} placeholder="Título (ej. Recordatorio con cariño)" className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" />
              <textarea value={editando.message} onChange={(e) => setEditando({ ...editando, message: e.target.value })} rows={4} maxLength={1000} placeholder="Escribe el mensaje…" className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm" />
              <div className="flex flex-wrap gap-1">
                {VARIABLES.map((v) => (
                  <button key={v} type="button" onClick={() => setEditando((e) => ({ ...e, message: `${e.message}{{${v}}}` }))} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-600 cursor-pointer hover:border-blue-400">
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 bg-white rounded-lg border border-slate-200 p-2">
                <b>Vista previa:</b> {personalizar(editando.message, ejemplo, dest.gym)}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={guardar} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-bold cursor-pointer">Guardar</button>
                <button type="button" onClick={() => setEditando(null)} className="px-3 py-1.5 rounded-lg text-slate-600 text-sm cursor-pointer">Cancelar</button>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={variar} onChange={(e) => { setVariar(e.target.checked); if (e.target.checked) setSelMsg(null); }} className="accent-blue-600" />
            <Shuffle className="w-3.5 h-3.5" /> Un mensaje distinto para cada alumno (o toca uno para usarlo con todos)
          </label>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {mensajes.map((m) => {
              const on = selMsg === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => { setSelMsg(on ? null : m.id); if (!on) setVariar(false); }}
                  className={`rounded-xl border p-3 cursor-pointer transition-colors ${on ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-400"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">
                      {on && <Check className="w-3.5 h-3.5 inline -mt-0.5 mr-1 text-blue-600" />}
                      {m.title}
                      {m.custom && <span className="ml-1 text-[10px] text-blue-600">★ propio</span>}
                    </p>
                    <span className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button type="button" title="Copiar" onClick={() => copiar(personalizar(m.message, ejemplo, dest.gym), m.id)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                        {copiado === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {puedeEditar && (
                        <>
                          <button type="button" title="Editar" onClick={() => setEditando({ id: m.id, title: m.title, message: m.message })} className="p-1 text-slate-400 hover:text-blue-700 cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" title="Quitar" onClick={() => quitar(m)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{personalizar(m.message, ejemplo, dest.gym)}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Destinatarios */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 lg:sticky lg:top-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">
              Para quién <span className="text-slate-400 font-normal">({alumnos.length})</span>
            </h3>
            {alumnos.length > 0 && (
              <span className="text-xs text-slate-500">
                Enviados hoy: <b className="text-emerald-700">{enviadosCat}</b> / {alumnos.length}
              </span>
            )}
          </div>
          {alumnos.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar alumno…" className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-300 text-sm" />
            </div>
          )}
          {alumnos.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay alumnos en esta categoría por ahora. 🎉</p>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {alumnos.map((a, i) => {
                const m = mensajePara(a, i);
                const texto = personalizar(m?.message, a, dest.gym);
                const url = enlaceWsp(a.phone, texto);
                const hecho = enviados[`${cat}:${a.id}`];
                return (
                  <div key={a.id} className={`rounded-xl border p-3 ${hecho ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          <span className="font-mono text-blue-700 mr-1.5">{a.codeLabel}</span>
                          {a.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{detalle(cat, a)}{a.phone ? ` · ${a.phone}` : " · sin celular"}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" title="Copiar mensaje" onClick={() => copiar(texto, `a${a.id}`)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer">
                          {copiado === `a${a.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => marcar(a)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${hecho ? "bg-emerald-100 text-emerald-800" : "bg-green-600 text-white hover:bg-green-700"}`}
                          >
                            {hecho ? <Check className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />} {hecho ? "Enviado" : "WhatsApp"}
                          </a>
                        ) : (
                          <span className="px-2 py-1.5 rounded-lg text-[11px] text-slate-400 border border-dashed border-slate-200 flex items-center gap-1">
                            <X className="w-3 h-3" /> Sin celular
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2" title={texto}>
                      <b className="text-slate-400">{m?.title}:</b> {texto}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
