import React, { useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  Check,
  X,
  Edit3,
  Trash2,
  Users,
  Sparkles,
  Dumbbell,
  Utensils,
  HeartPulse,
  Calculator,
  LayoutGrid,
  Table2,
  TrendingUp,
  Snowflake,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import { userCan } from "../../config/roles";

// Paleta por posición del plan (de menor a mayor precio)
const TONOS = [
  { borde: "border-slate-300", acento: "from-slate-600 to-slate-800", suave: "bg-slate-50", texto: "text-slate-700" },
  { borde: "border-sky-300", acento: "from-sky-500 to-blue-700", suave: "bg-sky-50", texto: "text-sky-700" },
  { borde: "border-indigo-300", acento: "from-indigo-500 to-violet-700", suave: "bg-indigo-50", texto: "text-indigo-700" },
  { borde: "border-emerald-300", acento: "from-emerald-500 to-teal-700", suave: "bg-emerald-50", texto: "text-emerald-700" },
  { borde: "border-amber-300", acento: "from-amber-500 to-orange-700", suave: "bg-amber-50", texto: "text-amber-700" },
];

const soles = (n) => `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const meses = (dias) => Math.max(1, Math.round(Number(dias || 30) / 30));
const duracionTexto = (dias) => {
  const d = Number(dias || 0);
  if (d < 28) return d === 1 ? "1 día" : `${d} días`;
  const m = Math.round(d / 30);
  return m === 1 ? "1 mes" : m === 12 ? "1 año" : `${m} meses`;
};

const VACIO = {
  name: "",
  durationDays: 30,
  price: "",
  description: "",
  includesTrainer: false,
  includesNutrition: false,
  includesPhysio: false,
  popular: false,
  featuresStr: "",
  freezeDays: 0,
  freezeParts: 1,
  freezeMinDays: 0,
};

/** Texto de las reglas de congelamiento (igual que el servidor) */
export const textoCongelamiento = (p) => {
  const total = Number(p?.freezeDays || 0);
  const partes = Number(p?.freezeParts || 1);
  if (!total) return "Sin congelamiento";
  if (partes <= 1) return `${total} días de congelamiento (todo de una vez)`;
  return `${total} días de congelamiento, hasta ${partes} partes de mínimo ${Number(p.freezeMinDays || 0) || Math.floor(total / partes)} días`;
};

/** Mismo control que el servidor, para avisar antes de guardar */
const errorCongelamiento = (f) => {
  const total = Number(f.freezeDays || 0);
  if (!total) return "";
  if (total < 0 || total > 365) return "Los días deben estar entre 0 y 365";
  const partes = Number(f.freezeParts || 1);
  if (partes === 1) return "";
  const min = Number(f.freezeMinDays || 0);
  if (min < 1) return "Indica el mínimo de días por congelamiento";
  if (min * partes > total) return `Con ${partes} partes de mínimo ${min} días se necesitan ${min * partes} días`;
  return "";
};

export const MembershipsPlans = () => {
  const { plans, members, addPlan, updatePlan, deletePlan, currentUser } = useGym();
  const puedeEditar = userCan(currentUser, "memberships", "editar");
  const puedeCrear = userCan(currentUser, "memberships", "crear");
  const puedeEliminar = userCan(currentUser, "memberships", "eliminar");

  const [vista, setVista] = useState("tarjetas");
  const [mostrarMensual, setMostrarMensual] = useState(false);
  const [seleccion, setSeleccion] = useState(null);
  const [editando, setEditando] = useState(null); // null | "nuevo" | plan
  const [form, setForm] = useState(VACIO);
  const [simPlan, setSimPlan] = useState("");
  const [simDescuento, setSimDescuento] = useState(0);

  const ordenados = useMemo(() => [...plans].sort((a, b) => a.price - b.price), [plans]);

  // Precio mensual de referencia: el plan de ~1 mes más barato
  const mensualRef = useMemo(() => {
    const m = ordenados.find((p) => p.durationDays >= 28 && p.durationDays <= 31);
    return m ? m.price : null;
  }, [ordenados]);

  const activosPorPlan = useMemo(() => {
    const c = {};
    members.forEach((m) => {
      if (m.status === "active" || m.status === "expiring_soon") c[m.planId] = (c[m.planId] || 0) + 1;
    });
    return c;
  }, [members]);
  const totalActivos = Object.values(activosPorPlan).reduce((a, b) => a + b, 0);
  const ingresoMensual = ordenados.reduce(
    (s, p) => s + (activosPorPlan[p.id] || 0) * (p.durationDays >= 28 ? p.price / meses(p.durationDays) : 0),
    0,
  );

  const abrirNuevo = () => {
    setForm(VACIO);
    setEditando("nuevo");
  };
  const abrirEditar = (p) => {
    setForm({ ...VACIO, ...p, featuresStr: (p.features || []).join("\n") });
    setEditando(p);
  };
  const guardar = async (e) => {
    e.preventDefault();
    const datos = {
      name: form.name.trim(),
      durationDays: Number(form.durationDays),
      durationMonths: Math.round(Number(form.durationDays) / 30),
      price: Number(form.price),
      description: form.description,
      includesTrainer: form.includesTrainer,
      includesNutrition: form.includesNutrition,
      includesPhysio: form.includesPhysio,
      popular: form.popular,
      features: form.featuresStr.split("\n").map((f) => f.trim()).filter(Boolean),
      freezeDays: Number(form.freezeDays || 0),
      freezeParts: Number(form.freezeDays || 0) ? Number(form.freezeParts || 1) : 1,
      freezeMinDays: Number(form.freezeDays || 0) ? (Number(form.freezeParts || 1) === 1 ? Number(form.freezeDays) : Number(form.freezeMinDays || 0)) : 0,
    };
    if (!datos.name || !datos.price || errorCongelamiento(form)) return;
    if (editando === "nuevo") await addPlan(datos);
    else await updatePlan(editando.id, datos);
    setEditando(null);
  };

  const simulado = ordenados.find((p) => p.id === simPlan) || ordenados[0];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const Tarjeta = ({ p, i, preview = false }) => {
    const t = TONOS[Math.min(i, TONOS.length - 1)];
    const porMes = p.durationDays >= 28 ? p.price / meses(p.durationDays) : null;
    const ahorro =
      mensualRef && porMes && p.durationDays > 31 ? Math.round((1 - porMes / mensualRef) * 100) : null;
    const activos = activosPorPlan[p.id] || 0;
    const sel = seleccion === p.id;
    return (
      <div
        onClick={() => !preview && setSeleccion(sel ? null : p.id)}
        className={`relative bg-white rounded-xl border flex flex-col overflow-hidden transition-all duration-200 ${
          preview ? "" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
        } ${p.popular ? "border-blue-500 shadow-md shadow-blue-100" : t.borde} ${sel ? "ring-4 ring-blue-200" : ""}`}
      >
        <div className={`relative bg-gradient-to-br ${p.popular ? "from-blue-600 to-indigo-800" : t.acento} text-white px-4 pt-3 pb-4 h-[196px] flex flex-col`}>
          {/* fila fija para la etiqueta, así todas las cabeceras miden lo mismo */}
          <div className="h-6 flex items-center justify-between gap-2">
            {p.popular ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/20 rounded-md px-2 py-0.5">
                <Sparkles className="w-3 h-3" /> Más elegido
              </span>
            ) : (
              <span />
            )}
            {!preview && (puedeEditar || puedeEliminar) && (
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {puedeEditar && (
                  <button onClick={() => abrirEditar(p)} className="p-1.5 rounded-md bg-white/15 hover:bg-white/30 cursor-pointer" title="Editar">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {puedeEliminar && (
                  <button
                    onClick={() => confirm(`¿Eliminar el plan ${p.name}? Los alumnos inscritos conservan su historial.`) && deletePlan(p.id)}
                    className="p-1.5 rounded-md bg-white/15 hover:bg-rose-500 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <h3 className="text-lg font-extrabold leading-tight truncate mt-1" title={p.name}>{p.name || "Nombre del plan"}</h3>
          <p className="text-xs text-white/80">{duracionTexto(p.durationDays)} de acceso</p>
          <div className="mt-auto flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-3xl font-black tracking-tight">
              {mostrarMensual && porMes ? soles(porMes) : soles(p.price)}
            </span>
            <span className="text-xs text-white/80">{mostrarMensual && porMes ? "/ mes" : "total"}</span>
          </div>
          <div className="mt-2 h-[42px] flex flex-wrap content-start gap-1 text-[11px] font-bold overflow-hidden">
            {ahorro > 0 && <span className="bg-emerald-400 text-emerald-950 rounded-md px-1.5 py-0.5 whitespace-nowrap">Ahorra {ahorro}%</span>}
            {porMes && !mostrarMensual && p.durationDays > 31 && (
              <span className="bg-white/20 rounded-md px-1.5 py-0.5 whitespace-nowrap">{soles(porMes)}/mes</span>
            )}
            {Number(p.durationDays) > 0 && (
              <span className="bg-white/20 rounded-md px-1.5 py-0.5 whitespace-nowrap">{soles(p.price / Number(p.durationDays))}/día</span>
            )}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-3">
          <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.7em]">{p.description || "\u00a0"}</p>
          <div className="flex flex-wrap gap-2">
            {[
              [p.includesTrainer, Dumbbell, "Entrenador"],
              [p.includesNutrition, Utensils, "Nutrición"],
              [p.includesPhysio, HeartPulse, "Fisioterapia"],
            ].map(([on, Icon, l]) => (
              <span
                key={l}
                className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1 border ${
                  on ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-400 border-slate-200 line-through"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {l}
              </span>
            ))}
          </div>
          <div
            className={`flex items-start gap-2 text-xs font-bold rounded-xl px-3 py-2 border ${
              Number(p.freezeDays || 0) ? "bg-sky-50 text-sky-800 border-sky-200" : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            <Snowflake className="w-4 h-4 shrink-0" /> {textoCongelamiento(p)}
          </div>
          <ul className="space-y-2 flex-1">
            {(p.features || []).map((f, k) => (
              <li key={k} className="flex gap-2 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {!preview && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-4 h-4" /> Alumnos activos
                </span>
                <span className="font-black text-slate-900">{activos}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${p.popular ? "from-blue-500 to-indigo-600" : t.acento}`}
                  style={{ width: `${totalActivos ? (activos / totalActivos) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Planes y tarifas
            </span>
            <h1 className="text-2xl font-extrabold mt-1">Membresías de RADICAL</h1>
            <p className="text-sm text-slate-300">Toque un plan para resaltarlo. Compare precios por mes y el ahorro de cada plan.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Planes", ordenados.length],
              ["Alumnos activos", totalActivos],
              ["Ingreso mensual aprox.", soles(ingresoMensual)],
            ].map(([t, v]) => (
              <div key={t} className="bg-white/10 rounded-2xl px-4 py-3">
                <span className="block text-xs text-slate-300">{t}</span>
                <span className="text-lg font-black">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setVista("tarjetas")}
              className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 cursor-pointer ${vista === "tarjetas" ? "bg-white text-slate-900" : "text-white/80"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Tarjetas
            </button>
            <button
              onClick={() => setVista("comparar")}
              className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 cursor-pointer ${vista === "comparar" ? "bg-white text-slate-900" : "text-white/80"}`}
            >
              <Table2 className="w-4 h-4" /> Comparar
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer bg-white/10 rounded-xl px-3 py-2">
            <input type="checkbox" checked={mostrarMensual} onChange={(e) => setMostrarMensual(e.target.checked)} className="w-4 h-4 accent-cyan-400" />
            Ver precio por mes
          </label>
          {puedeCrear && (
            <button
              onClick={abrirNuevo}
              className="ml-auto px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nuevo plan
            </button>
          )}
        </div>
      </div>

      {ordenados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Aún no hay planes registrados.
        </div>
      ) : vista === "tarjetas" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
          {ordenados.map((p, i) => (
            <Tarjeta key={p.id} p={p} i={i} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-4 text-slate-500 font-bold">Comparación</th>
                {ordenados.map((p) => (
                  <th key={p.id} className={`p-4 text-center ${p.popular ? "bg-blue-50 text-blue-900" : "text-slate-900"}`}>
                    <span className="block font-extrabold">{p.name}</span>
                    {p.popular && <span className="text-xs font-bold text-blue-600">Más elegido</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Precio total", (p) => <b>{soles(p.price)}</b>],
                ["Duración", (p) => duracionTexto(p.durationDays)],
                ["Precio por mes", (p) => (p.durationDays >= 28 ? soles(p.price / meses(p.durationDays)) : "—")],
                [
                  "Ahorro vs. mensual",
                  (p) => {
                    const pm = p.durationDays >= 28 ? p.price / meses(p.durationDays) : null;
                    const a = mensualRef && pm && p.durationDays > 31 ? Math.round((1 - pm / mensualRef) * 100) : null;
                    return a > 0 ? <span className="font-bold text-emerald-700">{a}%</span> : "—";
                  },
                ],
                ["Entrenador", (p) => (p.includesTrainer ? <Check className="w-5 h-5 text-emerald-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />)],
                ["Nutrición", (p) => (p.includesNutrition ? <Check className="w-5 h-5 text-emerald-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />)],
                ["Fisioterapia", (p) => (p.includesPhysio ? <Check className="w-5 h-5 text-emerald-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />)],
                ["Congelamiento", (p) => (Number(p.freezeDays || 0) ? <span className="text-xs font-bold text-sky-700">{textoCongelamiento(p)}</span> : <span className="text-xs text-slate-400">No</span>)],
                ["Alumnos activos", (p) => activosPorPlan[p.id] || 0],
              ].map(([t, f]) => (
                <tr key={t} className="border-t border-slate-100">
                  <td className="p-4 font-semibold text-slate-700">{t}</td>
                  {ordenados.map((p) => (
                    <td key={p.id} className={`p-4 text-center ${p.popular ? "bg-blue-50/50" : ""}`}>
                      {f(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calculadora */}
      {ordenados.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-600" /> Calculadora para recepción
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <label className="block md:col-span-2">
              <span className="block text-sm font-bold text-slate-700 mb-1.5">Plan</span>
              <select
                value={simulado?.id || ""}
                onChange={(e) => setSimPlan(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              >
                {ordenados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {soles(p.price)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-slate-700 mb-1.5">Descuento (S/)</span>
              <input
                type="number"
                min="0"
                value={simDescuento}
                onChange={(e) => setSimDescuento(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm"
              />
            </label>
            <div className="rounded-2xl bg-slate-900 text-white p-4">
              <span className="block text-xs text-slate-400">Total a cobrar</span>
              <span className="text-2xl font-black">{soles(Math.max(0, (simulado?.price || 0) - simDescuento))}</span>
              <span className="block text-xs text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Vence en {duracionTexto(simulado?.durationDays)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Crear / editar plan: pantalla completa con vista previa */}
      {editando && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="bg-slate-900 text-white px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-lg font-extrabold">{editando === "nuevo" ? "Nuevo plan" : `Editar: ${editando.name}`}</h2>
            <button onClick={() => setEditando(null)} className="p-2 rounded-lg hover:bg-white/10 cursor-pointer" title="Cerrar">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-6xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
            <form onSubmit={guardar} className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1.5">Nombre del plan *</span>
                <input value={form.name} onChange={set("name")} required placeholder="Ej. Trimestral Pro" className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-bold text-slate-700 mb-1.5">Precio total (S/) *</span>
                  <input type="number" min="1" step="0.5" value={form.price} onChange={set("price")} required className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
                </label>
                <label className="block">
                  <span className="block text-sm font-bold text-slate-700 mb-1.5">Duración</span>
                  <select value={form.durationDays} onChange={set("durationDays")} className="w-full p-3 rounded-xl border border-slate-300 text-sm">
                    {[
                      [1, "1 día"],
                      [7, "1 semana"],
                      [15, "15 días"],
                      [30, "1 mes"],
                      [60, "2 meses"],
                      [90, "3 meses"],
                      [180, "6 meses"],
                      [360, "1 año"],
                    ].map(([d, l]) => (
                      <option key={d} value={d}>
                        {l}
                      </option>
                    ))}
                    {![1, 7, 15, 30, 60, 90, 180, 360].includes(Number(form.durationDays)) && (
                      <option value={form.durationDays}>{duracionTexto(form.durationDays)}</option>
                    )}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1.5">Descripción</span>
                <input value={form.description} onChange={set("description")} placeholder="Para quién es este plan" className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1.5">Beneficios (uno por línea)</span>
                <textarea rows={5} value={form.featuresStr} onChange={set("featuresStr")} placeholder={"Acceso ilimitado a sala de pesas\nCasillero\nEvaluación física inicial"} className="w-full p-3 rounded-xl border border-slate-300 text-sm" />
              </label>
              <fieldset className="rounded-xl border-2 border-sky-200 bg-sky-50/50 p-4 space-y-3">
                <legend className="px-1 text-sm font-extrabold text-sky-800 flex items-center gap-1.5">
                  <Snowflake className="w-4 h-4" /> Congelamiento
                </legend>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["no", "No permite"],
                    ["uno", "Sí, todo de una vez"],
                    ["partes", "Sí, en partes"],
                  ].map(([k, l]) => {
                    const modo = !Number(form.freezeDays || 0) ? "no" : Number(form.freezeParts || 1) > 1 ? "partes" : "uno";
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            freezeDays: k === "no" ? 0 : k === "partes" ? Math.max(Number(form.freezeDays || 0), 30) : Number(form.freezeDays || 0) || 15,
                            freezeParts: k === "partes" ? Math.max(2, Number(form.freezeParts || 2)) : 1,
                            freezeMinDays: k === "partes" ? Number(form.freezeMinDays || 0) || 15 : 0,
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                          modo === k ? "bg-sky-600 text-white border-sky-600" : "bg-white text-sky-800 border-sky-300 hover:bg-sky-100"
                        }`}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
                {Number(form.freezeDays || 0) > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="block text-xs font-bold text-slate-700 mb-1">Total de días</span>
                      <input type="number" min="1" max="365" value={form.freezeDays} onChange={set("freezeDays")} className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white" />
                    </label>
                    {Number(form.freezeParts || 1) > 1 && (
                      <>
                        <label className="block">
                          <span className="block text-xs font-bold text-slate-700 mb-1">Máx. de partes</span>
                          <input type="number" min="2" max="12" value={form.freezeParts} onChange={set("freezeParts")} className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white" />
                        </label>
                        <label className="block">
                          <span className="block text-xs font-bold text-slate-700 mb-1">Mínimo por parte</span>
                          <input type="number" min="1" value={form.freezeMinDays} onChange={set("freezeMinDays")} className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white" />
                        </label>
                      </>
                    )}
                  </div>
                )}
                {errorCongelamiento(form) ? (
                  <p className="text-xs font-bold text-rose-600">{errorCongelamiento(form)}</p>
                ) : (
                  <p className="text-xs text-sky-900">
                    <b>{textoCongelamiento(form)}.</b>{" "}
                    {Number(form.freezeDays || 0) > 0 &&
                      "Es todo o nada: no se congela de a pocos; si el alumno vuelve antes, pierde los días que no usó. El derecho caduca al vencer la membresía."}
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Si cambias estas reglas, los alumnos que ya compraron el plan conservan las condiciones con las que lo compraron.
                </p>
              </fieldset>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ["includesTrainer", "Incluye entrenador"],
                  ["includesNutrition", "Incluye nutrición"],
                  ["includesPhysio", "Incluye fisioterapia"],
                  ["popular", "Marcar como más elegido"],
                ].map(([k, l]) => (
                  <label key={k} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer text-sm font-semibold ${form[k] ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-700"}`}>
                    <input type="checkbox" checked={!!form[k]} onChange={set(k)} className="w-4 h-4 accent-blue-600" />
                    {l}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditando(null)} className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold cursor-pointer">
                  Guardar plan
                </button>
              </div>
            </form>
            <div className="lg:col-span-2">
              <span className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Vista previa</span>
              <Tarjeta
                preview
                i={2}
                p={{
                  ...form,
                  price: Number(form.price || 0),
                  durationDays: Number(form.durationDays),
                  features: form.featuresStr.split("\n").map((f) => f.trim()).filter(Boolean),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
