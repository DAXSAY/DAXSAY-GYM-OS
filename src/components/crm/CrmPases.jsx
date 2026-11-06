// =====================================================================
// CRM · Pases libres y reporte
//  - PaseNoConcretado: en la ficha, cuando el interesado no vino o canceló:
//    motivo (viaje, vacaciones, no le interesa...) en texto libre y volver a
//    llamarlo otro día, o cerrar el caso.
//  - PanelPases: historial de pases (pendientes, usados, no concretados) para
//    volver a llamar a quien no vino.
//  - ReporteCrm: cuántas personas vienen a preguntar por turno, hora y día,
//    cuántos pases se usan y por qué no se concretan.
// Todo sale de MySQL (tablas prospectos, prospecto_seguimientos y pases_libres).
// =====================================================================
import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from "recharts";
import { Ticket, Phone, MessageCircle, CalendarClock, XCircle, CheckCircle2, Clock, Search, BarChart3, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { api } from "../../api/cliente";
import { hoyISO } from "../../utils/fecha";
import { TelWhatsApp, enlaceWhatsApp } from "../common/TelWhatsApp";

export const MOTIVOS_PASE = [
  ["viaje", "✈️ Viaje"],
  ["vacaciones", "🏖️ Vacaciones"],
  ["no_interesa", "🙅 Ya no le interesa"],
  ["salud", "🩹 Salud / lesión"],
  ["trabajo", "💼 Trabajo o estudios"],
  ["horario", "🕒 No le acomoda el horario"],
  ["precio", "💸 Precio"],
  ["no_contesta", "📵 No contesta"],
  ["otro_gimnasio", "🏋️ Eligió otro gimnasio"],
  ["otro", "📝 Otro motivo"],
];
const fCorta = (iso) => (iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "");
const masDias = (n) => {
  const [y, m, d] = hoyISO().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

// ---------------------------------------------------------------------
// Pase no concretado (dentro de la ficha del interesado)
// ---------------------------------------------------------------------
export const PaseNoConcretado = ({ p, onHecho, onCancelar }) => {
  const [tipo, setTipo] = useState("viaje");
  const [motivo, setMotivo] = useState("");
  const [accion, setAccion] = useState("volver_a_llamar");
  const [fecha, setFecha] = useState(masDias(7));
  const [hora, setHora] = useState(p.contactTime || "16:00");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const atajos = [
    ["Mañana", masDias(1)],
    ["En 1 semana", masDias(7)],
    ["En 15 días", masDias(15)],
    ["En 1 mes", masDias(30)],
  ];
  const guardar = async () => {
    setError("");
    if (tipo === "otro" && !motivo.trim()) return setError("Escribe el motivo.");
    setGuardando(true);
    try {
      onHecho(await api(`/prospectos/${p.id}/pase/no-concretado`, { method: "POST", body: { motivoTipo: tipo, motivo, accion, fecha, hora } }));
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };
  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-4 space-y-3">
      <p className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
        <XCircle className="w-4 h-4" /> Pase no concretado · {p.passCode}
      </p>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-slate-800">¿Por qué no vino?</p>
        <div className="flex flex-wrap gap-1.5">
          {MOTIVOS_PASE.map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTipo(k)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer ${tipo === k ? "bg-rose-600 border-rose-600 text-white" : "bg-white border-rose-200 text-slate-700 hover:bg-rose-50"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder={tipo === "otro" ? "Escribe lo que dijo (obligatorio)" : "Detalle (opcional). Ej. se va de vacaciones a Arequipa un mes y vuelve en diciembre"}
          className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-sm text-slate-800"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-slate-800">¿Qué hacemos?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAccion("volver_a_llamar")}
            className={`text-left rounded-xl border-2 p-3 cursor-pointer ${accion === "volver_a_llamar" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
          >
            <span className="font-black text-slate-900 flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-blue-600" /> Volver a llamarlo
            </span>
            <span className="block text-[11px] text-slate-500">Queda en seguimiento con una llamada agendada.</span>
          </button>
          <button
            type="button"
            onClick={() => setAccion("baja")}
            className={`text-left rounded-xl border-2 p-3 cursor-pointer ${accion === "baja" ? "border-slate-700 bg-slate-100" : "border-slate-200 bg-white"}`}
          >
            <span className="font-black text-slate-900 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-slate-600" /> Cerrar el caso
            </span>
            <span className="block text-[11px] text-slate-500">Pasa a "De baja" con este motivo.</span>
          </button>
        </div>
        {accion === "volver_a_llamar" && (
          <div className="rounded-xl border border-blue-200 bg-white p-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {atajos.map(([l, d]) => (
                <button key={l} type="button" onClick={() => setFecha(d)} className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer ${fecha === d ? "bg-blue-600 border-blue-600 text-white" : "border-blue-200 text-blue-800"}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-bold text-slate-600">
                Día
                <input type="date" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} className="block mt-0.5 px-2 py-1.5 rounded-lg border border-blue-200 text-sm text-slate-800" />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Hora
                <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="block mt-0.5 px-2 py-1.5 rounded-lg border border-blue-200 text-sm text-slate-800" />
              </label>
              <span className="text-xs text-blue-800">🔔 Te avisaremos ese día, 30 minutos antes.</span>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancelar} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
          Cancelar
        </button>
        <button type="button" disabled={guardando} onClick={guardar} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-black cursor-pointer">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// Pases libres (historial)
// ---------------------------------------------------------------------
const ESTADO_PASE = {
  pendiente: { label: "Pendiente", chip: "bg-violet-100 text-violet-800 border-violet-200" },
  usado: { label: "Vino ✓", chip: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  no_concretado: { label: "No concretado", chip: "bg-rose-100 text-rose-800 border-rose-200" },
};

export const PanelPases = ({ onAbrirProspecto, gym = "RADICAL" }) => {
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("no_concretado");
  const [busca, setBusca] = useState("");
  useEffect(() => {
    api("/prospectos/pases")
      .then(setLista)
      .catch((e) => setError(e.message));
  }, []);
  const hoy = hoyISO();
  // Igual que el aviso: el día ya pasó, o es hoy y pasó más de 1 hora de la hora acordada
  const vencido = (x) =>
    x.status === "pendiente" &&
    (x.visitDate < hoy || (x.visitDate === hoy && x.visitTime && new Date(`${x.visitDate}T${x.visitTime}:00-05:00`).getTime() < Date.now() - 3600000));
  const cuenta = (f) => (lista || []).filter(f).length;
  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (lista || []).filter((x) => {
      if (filtro === "no_vino" && !vencido(x)) return false;
      if (["pendiente", "usado", "no_concretado"].includes(filtro) && x.status !== filtro) return false;
      return !q || `${x.fullName} ${x.code} ${x.phone} ${x.reason}`.toLowerCase().includes(q);
    });
  }, [lista, filtro, busca]);

  if (error) return <p className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>;
  if (!lista) return <p className="text-sm text-slate-500">Cargando pases…</p>;
  const FILTROS = [
    ["no_concretado", "No concretados", cuenta((x) => x.status === "no_concretado")],
    ["no_vino", "⚠️ No vinieron (vencidos)", cuenta(vencido)],
    ["pendiente", "Pendientes", cuenta((x) => x.status === "pendiente")],
    ["usado", "Vinieron", cuenta((x) => x.status === "usado")],
    ["todos", "Todos", lista.length],
  ];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Ticket className="w-4 h-4 text-violet-600" /> Pases libres entregados
        </p>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nombre, código o motivo" className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm w-64" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map(([k, l, n]) => (
          <button key={k} type="button" onClick={() => setFiltro(k)} className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${filtro === k ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
            {l} <span className="opacity-70">{n}</span>
          </button>
        ))}
      </div>
      {visibles.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No hay pases en esta lista.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Interesado</th>
                <th className="py-2 pr-3">Código</th>
                <th className="py-2 pr-3">Visita</th>
                <th className="py-2 pr-3">Resultado</th>
                <th className="py-2 pr-3">Motivo</th>
                <th className="py-2 pr-3">Volver a llamar</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((x) => {
                const E = vencido(x) ? { label: "No vino", chip: "bg-amber-100 text-amber-800 border-amber-300" } : ESTADO_PASE[x.status];
                const msg = `Hola ${String(x.fullName).split(" ")[0]} 👋, te escribimos de *${gym}*. Te esperábamos con tu pase libre *${x.code}* 😊. ¿Te lo reprogramamos? Dinos qué día y hora te queda mejor.`;
                return (
                  <tr key={x.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3">
                      <b className="block text-slate-900">{x.fullName}</b>
                      <TelWhatsApp tel={x.phone} mensaje={msg} className="text-xs" />
                    </td>
                    <td className="py-2 pr-3 font-mono font-black text-violet-700 whitespace-nowrap">{x.code}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-slate-700">
                      {fCorta(x.visitDate)} {x.visitTime}
                      {x.reschedules > 0 && <span className="block text-[11px] text-slate-500">reprogramado {x.reschedules}×</span>}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-black whitespace-nowrap ${E.chip}`}>{E.label}</span>
                    </td>
                    <td className="py-2 pr-3 text-slate-700 max-w-[16rem]">
                      {x.reasonLabel ? <b>{x.reasonLabel}</b> : <span className="text-slate-400">—</span>}
                      {x.reason && <span className="block text-xs text-slate-500">{x.reason}</span>}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {x.callBackDate ? (
                        <span className={`font-bold ${x.callBackDate <= hoy ? "text-orange-600" : "text-slate-700"}`}>{fCorta(x.callBackDate)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <a href={`tel:${x.phone}`} title="Llamar" className="p-1.5 rounded-lg bg-blue-600 text-white">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a href={enlaceWhatsApp(x.phone, msg)} target="_blank" rel="noreferrer" title="WhatsApp" className="p-1.5 rounded-lg bg-emerald-600 text-white">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button type="button" onClick={() => onAbrirProspecto(x.prospectId)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">
                          Ficha
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------
// Reporte del CRM
// ---------------------------------------------------------------------
const COLORES = ["#0ea7b3", "#f59e0b", "#8b5cf6", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#64748b"];

const Tarjeta = ({ titulo, valor, sub, tono }) => (
  <div className={`rounded-2xl border p-4 ${tono}`}>
    <p className="text-[11px] font-black uppercase tracking-wider opacity-80">{titulo}</p>
    <p className="text-2xl font-black mt-0.5">{valor}</p>
    {sub && <p className="text-xs opacity-80">{sub}</p>}
  </div>
);

const Caja = ({ titulo, icono: I, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4">
    <p className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-3">
      <I className="w-4 h-4 text-blue-600" /> {titulo}
    </p>
    {children}
  </div>
);

const Lista = ({ filas, vacio = "Sin datos en este periodo." }) =>
  filas.length === 0 ? (
    <p className="text-sm text-slate-400">{vacio}</p>
  ) : (
    <div className="space-y-1.5">
      {filas.map((f, i) => {
        const max = Math.max(...filas.map((x) => x.total), 1);
        return (
          <div key={f.nombre} className="text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-700 truncate">{f.nombre}</span>
              <b className="text-slate-900">{f.total}</b>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(f.total / max) * 100}%`, background: COLORES[i % COLORES.length] }} />
            </div>
          </div>
        );
      })}
    </div>
  );

export const ReporteCrm = () => {
  const hoy = hoyISO();
  const [desde, setDesde] = useState(`${hoy.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(hoy);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setDatos(null);
    api(`/prospectos/reporte?desde=${desde}&hasta=${hasta}`)
      .then((d) => (setDatos(d), setError("")))
      .catch((e) => setError(e.message));
  }, [desde, hasta]);
  const rangos = [
    ["Hoy", hoy, hoy],
    ["Últimos 7 días", (() => { const [y, m, d] = hoy.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d - 6)).toISOString().slice(0, 10); })(), hoy],
    ["Este mes", `${hoy.slice(0, 7)}-01`, hoy],
    ["Este año", `${hoy.slice(0, 4)}-01-01`, hoy],
  ];
  const r = datos?.resumen;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1.5">
          {rangos.map(([l, a, b]) => (
            <button key={l} type="button" onClick={() => (setDesde(a), setHasta(b))} className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${desde === a && hasta === b ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
              {l}
            </button>
          ))}
        </div>
        <label className="text-xs font-bold text-slate-600">
          Desde
          <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className="block mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
        </label>
        <label className="text-xs font-bold text-slate-600">
          Hasta
          <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className="block mt-0.5 px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
        </label>
      </div>

      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
      {!datos && !error && <p className="text-sm text-slate-500">Cargando reporte…</p>}
      {datos && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Tarjeta titulo="Vinieron a preguntar" valor={r.interesados} sub="interesados registrados" tono="bg-sky-50 border-sky-200 text-sky-900" />
            <Tarjeta titulo="Se matricularon" valor={r.matriculados} sub={`${r.conversion}% de conversión`} tono="bg-emerald-50 border-emerald-200 text-emerald-900" />
            <Tarjeta titulo="Pases entregados" valor={r.pases} sub={`${r.reprogramaciones} reprogramaciones`} tono="bg-violet-50 border-violet-200 text-violet-900" />
            <Tarjeta titulo="Vinieron con su pase" valor={r.pasesUsados} sub={`${r.asistenciaPases}% de los pases`} tono="bg-teal-50 border-teal-200 text-teal-900" />
            <Tarjeta titulo="No concretados" valor={r.pasesNoConcretados} sub="con su motivo" tono="bg-rose-50 border-rose-200 text-rose-900" />
            <Tarjeta titulo="Pases pendientes" valor={r.pasesPendientes} sub="aún por venir" tono="bg-amber-50 border-amber-200 text-amber-900" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Caja titulo="Afluencia por turno" icono={Users}>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos.porTurno} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="interesados" name="Interesados" fill="#0ea7b3" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pases" name="Pases" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="matriculados" name="Matriculados" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Turnos: {datos.turnos.map((t) => `${t.nombre} (${t.horario})`).join(" · ")}</p>
            </Caja>
            <Caja titulo="¿A qué hora vienen a preguntar?" icono={Clock}>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos.porHora} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hora" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Interesados" radius={[5, 5, 0, 0]}>
                      {datos.porHora.map((h, i) => {
                        const hh = Number(h.hora.slice(0, 2));
                        return <Cell key={i} fill={hh < 12 ? "#f59e0b" : hh < 18 ? "#0ea7b3" : "#6366f1"} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">🟠 mañana · 🔵 tarde · 🟣 noche</p>
            </Caja>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Caja titulo="Por día de la semana" icono={CalendarClock}>
              <Lista filas={datos.porDia} />
            </Caja>
            <Caja titulo="¿Cómo nos conocieron?" icono={TrendingUp}>
              <Lista filas={datos.porOrigen} />
            </Caja>
            <Caja titulo="Planes que les interesan" icono={BarChart3}>
              <Lista filas={datos.porPlan} />
            </Caja>
            <Caja titulo="¿Por qué no vinieron?" icono={AlertTriangle}>
              <Lista filas={datos.motivos} vacio="Ningún pase no concretado en este periodo." />
            </Caja>
          </div>
          <Caja titulo="Interesados registrados por cada persona del personal" icono={CheckCircle2}>
            <Lista filas={datos.porQuien} />
          </Caja>
        </>
      )}
    </div>
  );
};
