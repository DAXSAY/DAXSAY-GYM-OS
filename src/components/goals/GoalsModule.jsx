// ============================================================
// METAS & LOGROS
//  Administración: metas en soles por turno de recepción, metas de
//  logros (mancuernas) por entrenador, objetivos de alumnos y bonos.
//  Recepción: ve su meta del mes (cuánto falta por mes, semana y día).
//  Entrenador: ve sus mancuernas y los objetivos de sus alumnos.
//  Nutrición / Fisioterapia: crean y evalúan objetivos de alumnos;
//  al aprobarlos, el entrenador del alumno gana un logro.
// ============================================================
import React, { useEffect, useState } from "react";
import {
  Trophy,
  Target,
  Dumbbell,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Gift,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Wallet,
  Search,
  RefreshCw,
} from "lucide-react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { useGym } from "../../context/GymContext";
import { api } from "../../api/cliente";
import { userCan } from "../../config/roles";
import { hoyISO } from "../../utils/fecha";

const soles = (n) => `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fCorta = (f) => (f ? `${String(f).slice(8, 10)}/${String(f).slice(5, 7)}` : "");
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const nombreMes = (m) => `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const CATEGORIA = { composicion: "Peso / masa muscular", lesion: "Lesiones / dolor", general: "Todos los logros", ingresos: "Ingresos" };
const TIPO_OBJ = {
  bajar_peso: ["Bajar de peso", "nutricion", "kg"],
  ganar_masa: ["Ganar masa muscular", "nutricion", "kg"],
  reducir_grasa: ["Reducir % de grasa", "nutricion", "%"],
  mejorar_lesion: ["Recuperar lesión", "fisioterapia", ""],
  reducir_dolor: ["Reducir dolor", "fisioterapia", "EVA"],
  movilidad: ["Mejorar movilidad", "fisioterapia", "°"],
  otro: ["Otro", null, ""],
};
const ESTADO_OBJ = {
  en_proceso: ["En proceso", "bg-blue-100 text-blue-700"],
  conseguida: ["Meta conseguida", "bg-emerald-100 text-emerald-700"],
  no_conseguida: ["No conseguida", "bg-rose-100 text-rose-700"],
  cancelada: ["Cancelada", "bg-slate-100 text-slate-500"],
};

const Pantalla = ({ titulo, subtitulo, onVolver, children, ancho = "max-w-3xl" }) => (
  <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
    <div className={`w-full ${ancho} mx-auto min-h-full p-4 sm:p-6 space-y-5`}>
      <div className="flex items-center gap-3">
        <button onClick={onVolver} className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div>
          <h2 className="text-lg font-black text-slate-900">{titulo}</h2>
          {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
        </div>
      </div>
      {children}
    </div>
  </div>
);
const campo = "mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

// Mancuernas (logros) dibujadas
const Mancuernas = ({ logrado, meta }) => {
  const total = Math.max(meta, logrado);
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: Math.min(total, 40) }, (_, i) => (
        <span
          key={i}
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${i < logrado ? "bg-amber-400 text-amber-950 shadow-sm" : "bg-slate-100 text-slate-300"}`}
          title={i < logrado ? "Logro conseguido" : "Por conseguir"}
        >
          <Dumbbell className="w-4 h-4" />
        </span>
      ))}
      {total > 40 && <span className="text-xs text-slate-500 self-center">+{total - 40}</span>}
    </div>
  );
};

// ------------------------------------------------------------
// Tarjeta de meta con su avance
// ------------------------------------------------------------
const TarjetaMeta = ({ meta, admin, onEditar, onEliminar, onBono }) => {
  const p = meta.progress;
  const dinero = meta.type === "recepcion";
  const fmt = (v) => (dinero ? soles(v) : `${v}`);
  const h = hoyISO();
  const vigente = meta.start <= h && meta.end >= h;
  const atraso = vigente && p.logrado < p.ritmoIdeal;
  return (
    <div className={`bg-white rounded-2xl border-2 p-5 space-y-4 ${p.cumplida ? "border-emerald-300" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-black uppercase text-slate-500">
            {dinero ? "Meta de recepción" : `Meta de entrenador · ${CATEGORIA[meta.category]}`}
          </span>
          <h3 className="text-xl font-black text-slate-900">{meta.name}</h3>
          <p className="text-xs text-slate-500">
            {fCorta(meta.start)} al {fCorta(meta.end)} · {p.totalDias} días {meta.bonus > 0 && `· Bono: ${soles(meta.bonus)}`}
          </p>
          {meta.notes && <p className="text-xs text-slate-600 mt-1">{meta.notes}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {p.cumplida ? (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> ¡Meta cumplida!
            </span>
          ) : (
            vigente && (
              <span className={`px-3 py-1 rounded-full text-xs font-black ${atraso ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"}`}>
                {atraso ? "Por debajo del ritmo" : "A buen ritmo"}
              </span>
            )
          )}
          {admin && (
            <>
              <button onClick={onEditar} className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer" title="Editar meta">
                <Pencil className="w-4 h-4 text-slate-600" />
              </button>
              {!meta.bonusId && (
                <button onClick={onEliminar} className="p-2 rounded-lg hover:bg-rose-50 cursor-pointer" title="Eliminar meta">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Barra de avance */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-black text-slate-900">
            {fmt(p.logrado)} <span className="text-slate-400 font-bold">de {fmt(p.objetivo)}</span>
          </span>
          <span className="font-black text-blue-700">{p.porcentaje}%</span>
        </div>
        <div className="h-4 rounded-full bg-slate-100 overflow-hidden relative">
          <div className={`h-full rounded-full ${p.cumplida ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`} style={{ width: `${p.porcentaje}%` }} />
          {vigente && !p.cumplida && (
            <div className="absolute top-0 h-full w-0.5 bg-slate-900/60" style={{ left: `${Math.min(100, (p.ritmoIdeal / (p.objetivo || 1)) * 100)}%` }} title="Donde debería ir hoy" />
          )}
        </div>
      </div>

      {dinero ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-sm">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
            <span className="text-xs font-bold text-rose-500 uppercase block">Falta en el mes</span>
            <strong className="text-lg text-rose-700">{soles(p.faltante)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase block">Días que quedan</span>
            <strong className="text-lg">{p.diasRestantes}</strong>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-xs font-bold text-blue-500 uppercase block">Necesario por día</span>
            <strong className="text-lg text-blue-700">{soles(p.necesarioPorDia)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase block">Esta semana</span>
            <strong className="text-lg">{soles(p.semanaActual?.total)}</strong>
            {p.semanaActual && <span className="text-xs text-slate-500 block">meta {soles(p.semanaActual.meta)}</span>}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase block">Hoy</span>
            <strong className="text-lg text-emerald-700">{soles(p.hoy)}</strong>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Mancuernas logrado={p.logrado} meta={p.objetivo} />
          <p className="text-sm text-slate-600">
            {p.cumplida ? "Consiguió todas sus mancuernas." : `Le faltan ${p.faltante} logro(s). Quedan ${p.diasRestantes} días.`}
          </p>
          {p.logros.length > 0 && (
            <ul className="text-xs text-slate-600 space-y-0.5">
              {p.logros.map((l) => (
                <li key={l.id}>
                  🏋️ {fCorta(l.dia)} · <strong>{l.alumno}</strong>: {l.descripcion}
                  {l.inicial != null && l.final != null && ` (${l.inicial} → ${l.final} ${l.unidad})`} · aprobó {l.evaluador || (l.area === "nutricion" ? "nutrición" : "fisioterapia")}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className={`grid grid-cols-1 ${dinero ? "lg:grid-cols-3" : ""} gap-4`}>
        <div className={dinero ? "lg:col-span-2" : ""} style={{ height: 210 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={p.diario} margin={{ top: 5, right: 10, left: dinero ? 10 : -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" tickFormatter={fCorta} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={dinero} />
              <Tooltip labelFormatter={fCorta} formatter={(v, n) => [dinero ? soles(v) : v, n === "acumulado" ? "Logrado" : n === "ideal" ? "Ritmo ideal" : "Del día"]} />
              <Area type="monotone" dataKey="acumulado" stroke="#0c8794" fill="#0c879422" strokeWidth={2} connectNulls={false} />
              <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {dinero && (
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={p.semanas.map((s) => ({ ...s, nombre: `Sem ${s.numero}` }))} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => soles(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="meta" name="Meta semana" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Logrado" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {p.cumplida && admin && meta.bonus >= 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <span className="text-sm font-bold text-amber-900">
            {meta.bonusId ? `Bono ${meta.bonusStatus === "pagado" ? "pagado" : "aprobado"}` : "Meta cumplida: puedes aprobar el bono."}
          </span>
          {!meta.bonusId && (
            <button onClick={onBono} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black flex items-center gap-1.5 cursor-pointer">
              <Gift className="w-4 h-4" /> Aprobar bono
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------
// Formulario de meta (admin)
// ------------------------------------------------------------
const FormMeta = ({ tipo, meta, mes, onVolver, onGuardada }) => {
  const { staffDirectory } = useGym();
  const [turnos, setTurnos] = useState([]);
  const [f, setF] = useState({
    receptionShiftId: meta?.receptionShiftId || "",
    staffId: meta?.staffId || "",
    category: meta?.category && meta.category !== "ingresos" ? meta.category : "general",
    month: meta ? "" : mes,
    start: meta?.start || "",
    end: meta?.end || "",
    amount: meta?.type === "recepcion" ? meta.progress.objetivo : "",
    achievements: meta?.type === "entrenador" ? meta.progress.objetivo : "",
    bonus: meta?.bonus || "",
    notes: meta?.notes || "",
  });
  const [porFechas, setPorFechas] = useState(!!meta);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/metas/turnos-recepcion").then(setTurnos).catch(() => {});
  }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const entrenadores = staffDirectory.filter((s) => s.cargo === "entrenador");
  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const body = { ...f, type: tipo, month: porFechas ? undefined : f.month };
      if (meta) await api(`/metas/metas/${meta.id}`, { method: "PUT", body });
      else await api("/metas/metas", { method: "POST", body });
      onGuardada();
    } catch (er) {
      setError(er.message);
    }
  };
  return (
    <Pantalla titulo={meta ? "Editar meta" : tipo === "recepcion" ? "Nueva meta de recepción" : "Nueva meta de entrenador"} onVolver={onVolver}>
      <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {tipo === "recepcion" ? (
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Turno de recepción *</span>
            <select required value={f.receptionShiftId} onChange={set("receptionShiftId")} className={campo}>
              <option value="">Elegir…</option>
              {turnos.filter((t) => t.active).map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.people.length ? `· ${t.people.map((p) => p.name).join(", ")}` : "· sin personas asignadas"}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="font-bold text-slate-700">Entrenador *</span>
              <select required value={f.staffId} onChange={set("staffId")} className={campo}>
                <option value="">Elegir…</option>
                {entrenadores.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-bold text-slate-700">Cuentan los logros de</span>
              <select value={f.category} onChange={set("category")} className={campo}>
                <option value="general">Todos (nutrición y fisioterapia)</option>
                <option value="composicion">Peso / masa muscular (nutrición)</option>
                <option value="lesion">Lesiones / dolor (fisioterapia)</option>
              </select>
            </label>
          </div>
        )}
        <div className="flex gap-2 text-xs font-bold">
          <button type="button" onClick={() => setPorFechas(false)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${!porFechas ? "bg-blue-600 text-white" : "bg-slate-100"}`}>Por mes</button>
          <button type="button" onClick={() => setPorFechas(true)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${porFechas ? "bg-blue-600 text-white" : "bg-slate-100"}`}>Por fechas</button>
        </div>
        {porFechas ? (
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm"><span className="font-bold text-slate-700">Desde *</span><input type="date" required value={f.start} onChange={set("start")} className={campo} /></label>
            <label className="block text-sm"><span className="font-bold text-slate-700">Hasta *</span><input type="date" required value={f.end} min={f.start} onChange={set("end")} className={campo} /></label>
          </div>
        ) : (
          <label className="block text-sm"><span className="font-bold text-slate-700">Mes *</span><input type="month" required value={f.month} onChange={set("month")} className={campo} /></label>
        )}
        <div className="grid grid-cols-2 gap-4">
          {tipo === "recepcion" ? (
            <label className="block text-sm"><span className="font-bold text-slate-700">Meta en soles *</span><input type="number" min="1" step="0.01" required value={f.amount} onChange={set("amount")} placeholder="5000" className={`${campo} text-lg font-black`} /></label>
          ) : (
            <label className="block text-sm"><span className="font-bold text-slate-700">Logros (mancuernas) a conseguir *</span><input type="number" min="1" required value={f.achievements} onChange={set("achievements")} placeholder="10" className={`${campo} text-lg font-black`} /></label>
          )}
          <label className="block text-sm"><span className="font-bold text-slate-700">Bono al cumplir (S/)</span><input type="number" min="0" step="0.01" value={f.bonus} onChange={set("bonus")} placeholder="0" className={`${campo} text-lg font-black`} /></label>
        </div>
        <label className="block text-sm"><span className="font-bold text-slate-700">Notas</span><input value={f.notes} onChange={set("notes")} className={campo} /></label>
        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer">Guardar meta</button>
      </form>
    </Pantalla>
  );
};

// ------------------------------------------------------------
// Aprobar bono
// ------------------------------------------------------------
const FormBono = ({ meta, onVolver, onListo }) => {
  const [turnos, setTurnos] = useState([]);
  const [staffId, setStaffId] = useState(meta.staffId || "");
  const [monto, setMonto] = useState(meta.bonus || "");
  const [error, setError] = useState("");
  useEffect(() => {
    if (meta.type === "recepcion") api("/metas/turnos-recepcion").then(setTurnos).catch(() => {});
  }, [meta]);
  const personas = turnos.find((t) => t.id === meta.receptionShiftId)?.people || [];
  const aprobar = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/metas/bonos", { method: "POST", body: { goalId: meta.id, staffId: staffId || undefined, amount: Number(monto) } });
      onListo();
    } catch (er) {
      setError(er.message);
    }
  };
  return (
    <Pantalla titulo={`Aprobar bono · ${meta.name}`} subtitulo="El bono queda aprobado; luego se marca como pagado en la pestaña Bonos." onVolver={onVolver}>
      <form onSubmit={aprobar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {meta.type === "recepcion" && (
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Para quién</span>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={campo}>
              <option value="">Todo el turno ({meta.name})</option>
              {personas.filter((p) => p.staffId).map((p) => <option key={p.staffId} value={p.staffId}>{p.name}</option>)}
            </select>
            <span className="text-xs text-slate-500">Si son varias personas, aprueba un bono para cada una.</span>
          </label>
        )}
        <label className="block text-sm"><span className="font-bold text-slate-700">Monto del bono (S/)</span><input type="number" min="1" step="0.01" required value={monto} onChange={(e) => setMonto(e.target.value)} className={`${campo} text-lg font-black`} /></label>
        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <button className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black cursor-pointer">Aprobar bono</button>
      </form>
    </Pantalla>
  );
};

// ------------------------------------------------------------
// Objetivos de alumnos
// ------------------------------------------------------------
const FormObjetivo = ({ areaFija, onVolver, onGuardado }) => {
  const { members, trainers } = useGym();
  const [buscar, setBuscar] = useState("");
  const [f, setF] = useState({ memberId: "", type: areaFija === "fisioterapia" ? "reducir_dolor" : "bajar_peso", description: "", initialValue: "", targetValue: "", unit: "", controlDate: "", trainerId: "", area: areaFija || "nutricion" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const alumno = members.find((m) => m.id === f.memberId);
  const lista = members.filter((m) => `${m.fullName} ${m.dni}`.toLowerCase().includes(buscar.toLowerCase())).slice(0, 8);
  const tipos = Object.entries(TIPO_OBJ).filter(([, [, area]]) => !area || area === (areaFija || f.area));
  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/metas/objetivos", { method: "POST", body: { ...f, unit: f.unit || TIPO_OBJ[f.type][2], trainerId: f.trainerId || alumno?.assignedTrainerId } });
      onGuardado();
    } catch (er) {
      setError(er.message);
    }
  };
  return (
    <Pantalla titulo="Nuevo objetivo del alumno" subtitulo="Al hacer el nuevo control podrás marcarlo como conseguido y darle el logro a su entrenador." onVolver={onVolver}>
      <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="text-sm">
          <span className="font-bold text-slate-700">Alumno *</span>
          {alumno ? (
            <div className="mt-1 flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span>
                <strong>{alumno.fullName}</strong> · DNI {alumno.dni} · Entrenador: {trainers.find((t) => t.id === alumno.assignedTrainerId)?.name || "sin asignar"}
              </span>
              <button type="button" onClick={() => setF({ ...f, memberId: "" })} className="text-xs font-bold text-blue-700 cursor-pointer">Cambiar</button>
            </div>
          ) : (
            <>
              <div className="relative mt-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre o DNI" className={`${campo} pl-9 mt-0`} />
              </div>
              <div className="mt-1 border border-slate-200 rounded-xl divide-y divide-slate-100">
                {lista.map((m) => (
                  <button type="button" key={m.id} onClick={() => setF({ ...f, memberId: m.id })} className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer">
                    {m.fullName} <span className="text-xs text-slate-500">· {m.dni} · {m.planName}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {!areaFija && (
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Área que evalúa</span>
            <select value={f.area} onChange={set("area")} className={campo}>
              <option value="nutricion">Nutrición</option>
              <option value="fisioterapia">Fisioterapia</option>
            </select>
          </label>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Tipo de objetivo *</span>
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value, unit: TIPO_OBJ[e.target.value][2] })} className={campo}>
              {tipos.map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Fecha del próximo control *</span>
            <input type="date" required min={hoyISO()} value={f.controlDate} onChange={set("controlDate")} className={campo} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-bold text-slate-700">Objetivo *</span>
          <input required value={f.description} onChange={set("description")} placeholder="Ej. Bajar de 90 kg a 85 kg / Dolor lumbar de EVA 7 a 2" className={campo} />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label className="block text-sm"><span className="font-bold text-slate-700">Valor inicial</span><input type="number" step="0.01" value={f.initialValue} onChange={set("initialValue")} className={campo} /></label>
          <label className="block text-sm"><span className="font-bold text-slate-700">Valor meta</span><input type="number" step="0.01" value={f.targetValue} onChange={set("targetValue")} className={campo} /></label>
          <label className="block text-sm"><span className="font-bold text-slate-700">Unidad</span><input value={f.unit || TIPO_OBJ[f.type][2]} onChange={set("unit")} className={campo} /></label>
        </div>
        <label className="block text-sm">
          <span className="font-bold text-slate-700">Entrenador que recibirá el logro</span>
          <select value={f.trainerId || alumno?.assignedTrainerId || ""} onChange={set("trainerId")} className={campo}>
            <option value="">Sin entrenador</option>
            {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <button disabled={!f.memberId} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black cursor-pointer">Guardar objetivo</button>
      </form>
    </Pantalla>
  );
};

const EvaluarObjetivo = ({ objetivo, onVolver, onListo }) => {
  const { trainers } = useGym();
  const [estado, setEstado] = useState("conseguida");
  const [valorFinal, setValorFinal] = useState("");
  const [obs, setObs] = useState("");
  const [otorgar, setOtorgar] = useState(true);
  const [trainerId, setTrainerId] = useState(objetivo.trainerId || "");
  const [error, setError] = useState("");
  const evaluar = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api(`/metas/objetivos/${objetivo.id}/evaluar`, {
        method: "POST",
        body: { status: estado, finalValue: valorFinal, observation: obs, grant: otorgar, trainerId: trainerId || undefined },
      });
      onListo();
    } catch (er) {
      setError(er.message);
    }
  };
  return (
    <Pantalla titulo={`Control · ${objetivo.memberName}`} subtitulo={objetivo.description} onVolver={onVolver}>
      <form onSubmit={evaluar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200"><span className="text-xs font-bold text-slate-400 block">INICIAL</span><strong>{objetivo.initialValue ?? "—"} {objetivo.unit}</strong></div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200"><span className="text-xs font-bold text-slate-400 block">META</span><strong>{objetivo.targetValue ?? "—"} {objetivo.unit}</strong></div>
          <label className="block"><span className="text-xs font-bold text-slate-500">VALOR HOY</span><input type="number" step="0.01" value={valorFinal} onChange={(e) => setValorFinal(e.target.value)} className={`${campo} mt-0.5 font-black`} /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setEstado("conseguida")} className={`p-4 rounded-xl border-2 font-black flex items-center justify-center gap-2 cursor-pointer ${estado === "conseguida" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>
            <CheckCircle2 className="w-5 h-5" /> Meta conseguida
          </button>
          <button type="button" onClick={() => setEstado("no_conseguida")} className={`p-4 rounded-xl border-2 font-black flex items-center justify-center gap-2 cursor-pointer ${estado === "no_conseguida" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-500"}`}>
            <XCircle className="w-5 h-5" /> No conseguida
          </button>
        </div>
        <label className="block text-sm"><span className="font-bold text-slate-700">Observación del control *</span><textarea required rows={3} value={obs} onChange={(e) => setObs(e.target.value)} className={campo} /></label>
        {estado === "conseguida" && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <input type="checkbox" checked={otorgar} onChange={(e) => setOtorgar(e.target.checked)} />
              <Dumbbell className="w-4 h-4" /> Dar el logro (mancuerna) al entrenador
            </label>
            {otorgar && (
              <select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className={campo}>
                <option value="">Elegir entrenador…</option>
                {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
        )}
        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black cursor-pointer">Guardar control</button>
      </form>
    </Pantalla>
  );
};

const ListaObjetivos = ({ puedeCrear, areaPropia, admin }) => {
  const [objetivos, setObjetivos] = useState(null);
  const [vista, setVista] = useState(null);
  const [filtro, setFiltro] = useState("en_proceso");
  const [buscar, setBuscar] = useState("");
  const cargar = () => api("/metas/objetivos").then(setObjetivos).catch(() => setObjetivos([]));
  useEffect(() => {
    cargar();
  }, []);
  const h = hoyISO();
  const lista = (objetivos || []).filter((o) => (filtro === "todos" || o.status === filtro || (filtro === "vencidos" && o.status === "en_proceso" && o.controlDate <= h)) && `${o.memberName} ${o.memberDni} ${o.trainerName}`.toLowerCase().includes(buscar.toLowerCase()));
  const puedeEvaluar = (o) => o.status === "en_proceso" && (admin || o.area === areaPropia);

  if (vista === "nuevo") return <FormObjetivo areaFija={areaPropia} onVolver={() => setVista(null)} onGuardado={() => { setVista(null); cargar(); }} />;
  if (vista?.evaluar) return <EvaluarObjetivo objetivo={vista.evaluar} onVolver={() => setVista(null)} onListo={() => { setVista(null); cargar(); }} />;

  const pendientesHoy = (objetivos || []).filter((o) => o.status === "en_proceso" && o.controlDate <= h).length;
  return (
    <div className="space-y-4">
      {pendientesHoy > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold flex items-center gap-2">
          <CalendarClock className="w-4 h-4" /> {pendientesHoy} objetivo(s) ya tienen fecha de control: evalúalos para dar los logros.
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-2">
        {[["en_proceso", "En proceso"], ["vencidos", "Control pendiente"], ["conseguida", "Conseguidos"], ["no_conseguida", "No conseguidos"], ["todos", "Todos"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${filtro === k ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{l}</button>
        ))}
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar alumno o entrenador" className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm flex-1 min-w-48" />
        {puedeCrear && (
          <button onClick={() => setVista("nuevo")} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Nuevo objetivo
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {!objetivos && <p className="text-slate-500 text-sm">Cargando…</p>}
        {objetivos && lista.length === 0 && <p className="text-slate-500 text-sm">No hay objetivos con este filtro.</p>}
        {lista.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <strong className="text-slate-900">{o.memberName}</strong>
                <span className="text-xs text-slate-500 block">
                  {TIPO_OBJ[o.type]?.[0]} · {o.area === "nutricion" ? "Nutrición" : "Fisioterapia"} · Entrenador: {o.trainerName || "—"}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${ESTADO_OBJ[o.status][1]}`}>{ESTADO_OBJ[o.status][0]}</span>
            </div>
            <p className="text-sm text-slate-700">{o.description}</p>
            <p className="text-xs text-slate-500">
              {o.initialValue != null && `Inicio ${o.initialValue} ${o.unit} → meta ${o.targetValue ?? "—"} ${o.unit}`}
              {o.finalValue != null && ` · Final ${o.finalValue} ${o.unit}`} · Control: <strong className={o.status === "en_proceso" && o.controlDate <= h ? "text-amber-700" : ""}>{fCorta(o.controlDate)}</strong>
            </p>
            {o.observation && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2">{o.observation} {o.evaluatedBy && `· ${o.evaluatedBy}`}</p>}
            {o.achievementGranted && <p className="text-xs font-black text-amber-700 flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> Logro otorgado a {o.trainerName}</p>}
            {puedeEvaluar(o) && (
              <button onClick={() => setVista({ evaluar: o })} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer">
                Hacer control / evaluar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// Bonos (admin)
// ------------------------------------------------------------
const ListaBonos = ({ admin }) => {
  const [bonos, setBonos] = useState(null);
  const [error, setError] = useState("");
  const [metodo, setMetodo] = useState("transferencia");
  const cargar = () => api("/metas/bonos").then(setBonos).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, []);
  const accion = async (id, tipo) => {
    setError("");
    try {
      await api(`/metas/bonos/${id}/${tipo}`, { method: "POST", body: { method: metodo } });
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase text-slate-600">Bonos</h3>
        {admin && (
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            Pagar con
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="px-2 py-1 rounded-lg border border-slate-300">
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="yape_plin">Yape / Plin</option>
            </select>
          </label>
        )}
      </div>
      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
      {!bonos ? (
        <p className="text-slate-500 text-sm">Cargando…</p>
      ) : bonos.length === 0 ? (
        <p className="text-slate-500 text-sm">Aún no hay bonos.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200">
              <th className="py-2 pr-3">Beneficiario</th>
              <th className="py-2 pr-3">Motivo</th>
              <th className="py-2 pr-3">Monto</th>
              <th className="py-2 pr-3">Estado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {bonos.map((b) => (
              <tr key={b.id} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-semibold">{b.beneficiary}</td>
                <td className="py-2 pr-3 text-slate-600">{b.reason}</td>
                <td className="py-2 pr-3 font-black">{soles(b.amount)}</td>
                <td className="py-2 pr-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${b.status === "pagado" ? "bg-emerald-100 text-emerald-700" : b.status === "anulado" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-800"}`}>
                    {b.status === "pagado" ? `Pagado ${fCorta(b.paidAt)}` : b.status === "anulado" ? "Anulado" : "Aprobado, por pagar"}
                  </span>
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  {admin && b.status === "aprobado" && (
                    <>
                      <button onClick={() => accion(b.id, "pagar")} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold mr-1 cursor-pointer">
                        <Wallet className="w-3.5 h-3.5 inline" /> Pagar
                      </button>
                      <button onClick={() => accion(b.id, "anular")} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer">Anular</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ============================================================
// Módulo
// ============================================================
export const GoalsModule = () => {
  const { currentUser } = useGym();
  const admin = userCan(currentUser, "users", "editar");
  const rol = currentUser?.role;
  const areaPropia = rol === "nutritionist" ? "nutricion" : rol === "physio" ? "fisioterapia" : null;
  const puedeObjetivos = admin || !!areaPropia;

  const pestanas = admin
    ? [["recepcion", "Metas de recepción"], ["entrenadores", "Entrenadores y logros"], ["objetivos", "Objetivos de alumnos"], ["bonos", "Bonos"]]
    : rol === "trainer"
      ? [["mias", "Mis mancuernas"], ["objetivos", "Objetivos de mis alumnos"], ["bonos", "Mis bonos"]]
      : rol === "reception"
        ? [["mias", "Mi meta"], ["bonos", "Mis bonos"]]
        : [["objetivos", "Objetivos de alumnos"], ["ranking", "Logros de entrenadores"]];

  const [tab, setTab] = useState(pestanas[0][0]);
  const [mes, setMes] = useState(hoyISO().slice(0, 7));
  const [metas, setMetas] = useState(null);
  const [logros, setLogros] = useState([]);
  const [vista, setVista] = useState(null);
  const [aviso, setAviso] = useState("");

  const cargar = () => {
    if (["recepcion", "entrenadores", "mias"].includes(tab)) api(`/metas/metas?mes=${mes}`).then(setMetas).catch(() => setMetas([]));
    if (["entrenadores", "ranking"].includes(tab)) api(`/metas/logros?mes=${mes}`).then(setLogros).catch(() => setLogros([]));
  };
  useEffect(() => {
    setMetas(null);
    cargar();
  }, [tab, mes]);

  const listo = (texto) => {
    setVista(null);
    setAviso(texto);
    cargar();
    setTimeout(() => setAviso(""), 5000);
  };
  const eliminar = async (m) => {
    if (!window.confirm(`¿Eliminar la meta de ${m.name}?`)) return;
    try {
      await api(`/metas/metas/${m.id}`, { method: "DELETE" });
      cargar();
    } catch (e) {
      setAviso(e.message);
    }
  };

  if (vista?.form) return <FormMeta tipo={vista.form} meta={vista.meta} mes={mes} onVolver={() => setVista(null)} onGuardada={() => listo("Meta guardada.")} />;
  if (vista?.bono) return <FormBono meta={vista.bono} onVolver={() => setVista(null)} onListo={() => listo("Bono aprobado. Págalo desde la pestaña Bonos.")} />;

  const de = (tipo) => (metas || []).filter((m) => m.type === tipo);
  const recep = de("recepcion");
  const resumenRecepcion = {
    meta: recep.reduce((a, m) => a + m.progress.objetivo, 0),
    logrado: recep.reduce((a, m) => a + m.progress.logrado, 0),
  };

  const tarjetas = (lista) =>
    lista.length === 0 ? (
      <p className="text-sm text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
        No hay metas para {nombreMes(mes)}.
      </p>
    ) : (
      lista.map((m) => (
        <TarjetaMeta
          key={m.id}
          meta={m}
          admin={admin}
          onEditar={() => setVista({ form: m.type, meta: m })}
          onEliminar={() => eliminar(m)}
          onBono={() => setVista({ bono: m })}
        />
      ))
    );

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-800 rounded-3xl p-6 text-white shadow-lg flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
            <Target className="w-4 h-4" /> Metas & logros
          </span>
          <h1 className="text-2xl font-black mt-1">{admin ? "Metas del equipo" : rol === "reception" ? "Mi meta del mes" : rol === "trainer" ? "Mis logros" : "Objetivos de los alumnos"}</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            {admin
              ? "Asigna metas en soles a cada turno de recepción y metas de logros a los entrenadores. Nutrición y fisioterapia aprueban los objetivos de los alumnos y cada aprobación es una mancuerna para el entrenador."
              : rol === "reception"
                ? "Lo que se cobra en tu turno suma a la meta. Mira cuánto falta en el mes, la semana y hoy."
                : rol === "trainer"
                  ? "Cada alumno que consigue su objetivo (aprobado por nutrición o fisioterapia) es una mancuerna para ti."
                  : "Registra el objetivo del alumno y, en el siguiente control, indica si lo consiguió para dar el logro a su entrenador."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-bold" />
          <button onClick={cargar} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer" title="Actualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200">
        {pestanas.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 rounded-lg text-sm font-bold cursor-pointer ${tab === k ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            {l}
          </button>
        ))}
      </div>
      {aviso && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{aviso}</div>}

      {tab === "recepcion" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-2">
                <span className="text-xs font-bold text-slate-400 block">META TOTAL {nombreMes(mes).toUpperCase()}</span>
                <strong className="text-lg">{soles(resumenRecepcion.meta)}</strong>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-2">
                <span className="text-xs font-bold text-slate-400 block">LOGRADO</span>
                <strong className="text-lg text-emerald-600">{soles(resumenRecepcion.logrado)}</strong>
              </div>
            </div>
            <button onClick={() => setVista({ form: "recepcion" })} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" /> Nueva meta de recepción
            </button>
          </div>
          {metas ? tarjetas(de("recepcion")) : <p className="text-slate-500 text-sm">Cargando…</p>}
        </div>
      )}

      {(tab === "entrenadores" || tab === "ranking") && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-black uppercase text-slate-600 mb-3 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> Ranking de logros · {nombreMes(mes)}
            </h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={logros} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="composition" stackId="a" name="Peso / masa" fill="#16a34a" />
                  <Bar dataKey="injury" stackId="a" name="Lesión / dolor" fill="#0891b2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="w-full text-sm mt-3">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200">
                  <th className="py-2">Entrenador</th>
                  <th className="py-2">Alumnos</th>
                  <th className="py-2">Peso / masa</th>
                  <th className="py-2">Lesión / dolor</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Objetivos en proceso</th>
                </tr>
              </thead>
              <tbody>
                {logros.map((l) => (
                  <tr key={l.staffId} className="border-b border-slate-100">
                    <td className="py-2 font-semibold">{l.name}</td>
                    <td className="py-2">{l.students}</td>
                    <td className="py-2">{l.composition}</td>
                    <td className="py-2">{l.injury}</td>
                    <td className="py-2 font-black text-amber-600">🏋️ {l.total}</td>
                    <td className="py-2">{l.inProgress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tab === "entrenadores" && (
            <>
              <div className="flex justify-end">
                <button onClick={() => setVista({ form: "entrenador" })} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center gap-1.5 cursor-pointer">
                  <Plus className="w-4 h-4" /> Nueva meta de entrenador
                </button>
              </div>
              {metas ? tarjetas(de("entrenador")) : <p className="text-slate-500 text-sm">Cargando…</p>}
            </>
          )}
        </div>
      )}

      {tab === "mias" && <div className="space-y-4">{metas ? tarjetas(metas) : <p className="text-slate-500 text-sm">Cargando…</p>}</div>}
      {tab === "objetivos" && <ListaObjetivos puedeCrear={puedeObjetivos} areaPropia={areaPropia} admin={admin} />}
      {tab === "bonos" && <ListaBonos admin={admin} />}
    </div>
  );
};
