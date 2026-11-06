// Calendario de asistencias de un alumno: qué días vino y qué días no.
// Lo usan administración/recepción (Control Asistencias y ficha del alumno) y el propio alumno.
import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, CalendarCheck, CalendarX, Percent, Clock, Target, MessageSquareText, Trash2, PhoneCall, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { api } from "../../api/cliente";
import { hoyISO } from "../../utils/fecha";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const finDeMes = (mes) => {
  const [y, m] = mes.split("-").map(Number);
  return iso(new Date(y, m, 0));
};
const moverMes = (mes, n) => {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
export const MOTIVOS_AUSENCIA = {
  salud: "Salud / enfermedad",
  lesion: "Lesión",
  viaje: "Viaje",
  trabajo: "Trabajo",
  estudios: "Estudios / exámenes",
  economico: "Tema económico",
  motivacion: "Falta de motivación",
  horario: "No le acomoda el horario",
  otro: "Otro",
};
const MEDIOS = { ninguno: "Sin contactar", llamada: "Llamada", whatsapp: "WhatsApp", presencial: "En persona" };
const lunesDe = (f) => {
  const d = new Date(`${f}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return iso(d);
};
const sumar = (f, n) => {
  const d = new Date(`${f}T12:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const dentro = (fecha, rangos) => rangos.some((r) => fecha >= r.start && fecha <= r.end);

// Estilos por estado del día
export const ESTADOS_DIA = {
  vino: { nombre: "Vino", clase: "bg-emerald-500 text-white border-emerald-500", punto: "bg-emerald-500" },
  aviso: { nombre: "Vino (membresía vencida o congelada)", clase: "bg-amber-400 text-white border-amber-400", punto: "bg-amber-400" },
  falto: { nombre: "No vino", clase: "bg-rose-50 text-rose-700 border-rose-200", punto: "bg-rose-200" },
  congelado: { nombre: "Congelado", clase: "bg-sky-50 text-sky-700 border-sky-200", punto: "bg-sky-300" },
  sin: { nombre: "Sin membresía", clase: "bg-slate-50 text-slate-300 border-slate-100", punto: "bg-slate-200" },
  futuro: { nombre: "Próximo", clase: "bg-white text-slate-300 border-slate-100", punto: "bg-white border border-slate-200" },
};

/** Clasifica cada día del rango */
function clasificar(datos) {
  const porDia = Object.fromEntries((datos?.days || []).map((d) => [d.date, d]));
  return (fecha) => {
    const a = porDia[fecha];
    if (a && a.status !== "denied") return { estado: a.status === "ok" ? "vino" : "aviso", asistencia: a };
    if (fecha > datos.hoy) return { estado: "futuro" };
    if (dentro(fecha, datos.freezes)) return { estado: "congelado" };
    if (!dentro(fecha, datos.memberships)) return { estado: "sin" };
    return { estado: "falto" };
  };
}

export const CalendarioAsistencias = ({ memberId, titulo = true, seguimiento = true }) => {
  const [notas, setNotas] = useState([]);
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mes, setMes] = useState(hoyISO().slice(0, 7));
  const [datos, setDatos] = useState(null);
  const [anio, setAnio] = useState(null);
  const [error, setError] = useState("");
  const [diaSel, setDiaSel] = useState(null);

  useEffect(() => {
    if (!memberId) return;
    setDatos(null);
    setError("");
    api(`/alumnos/${memberId}/asistencias?desde=${lunesDe(`${mes}-01`)}&hasta=${sumar(lunesDe(finDeMes(mes)), 6)}`)
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, [memberId, mes]);

  const cargarNotas = () =>
    api(`/alumnos/${memberId}/seguimiento-asistencia`)
      .then(setNotas)
      .catch(() => setNotas([]));
  useEffect(() => {
    if (memberId && seguimiento) cargarNotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, seguimiento]);

  const notaDelDia = (f) => notas.find((n) => f >= n.date && f <= (n.until || n.date));

  const guardarNota = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api(`/alumnos/${memberId}/seguimiento-asistencia`, { method: "POST", body: form });
      setForm(null);
      await cargarNotas();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };
  const borrarNota = async (n) => {
    if (!window.confirm("¿Borrar esta nota de seguimiento?")) return;
    try {
      await api(`/alumnos/seguimiento-asistencia/${n.id}`, { method: "DELETE" });
      await cargarNotas();
    } catch (err) {
      alert(err.message);
    }
  };

  // Resumen de los últimos 12 meses (barras)
  useEffect(() => {
    if (!memberId) return;
    const hasta = hoyISO();
    const desde = `${moverMes(hasta.slice(0, 7), -11)}-01`;
    api(`/alumnos/${memberId}/asistencias?desde=${desde}&hasta=${hasta}`)
      .then(setAnio)
      .catch(() => setAnio(null));
  }, [memberId]);

  const celdas = useMemo(() => {
    if (!datos) return [];
    const [y, m] = mes.split("-").map(Number);
    const primero = new Date(y, m - 1, 1);
    const vacias = (primero.getDay() + 6) % 7; // lunes = 0
    const total = new Date(y, m, 0).getDate();
    const clasif = clasificar(datos);
    return [
      ...Array.from({ length: vacias }, () => null),
      ...Array.from({ length: total }, (_, i) => {
        const fecha = `${mes}-${String(i + 1).padStart(2, "0")}`;
        return { fecha, dia: i + 1, ...clasif(fecha) };
      }),
    ];
  }, [datos, mes]);

  const stats = useMemo(() => {
    const dias = celdas.filter(Boolean);
    const vino = dias.filter((c) => c.estado === "vino" || c.estado === "aviso");
    const falto = dias.filter((c) => c.estado === "falto");
    const habiles = vino.length + falto.length;
    // Racha: días seguidos que vino (en el mes visible, hasta hoy)
    let racha = 0;
    let mejor = 0;
    dias.filter((c) => c.estado !== "futuro").forEach((c) => {
      if (c.estado === "vino" || c.estado === "aviso") {
        racha += 1;
        mejor = Math.max(mejor, racha);
      } else if (c.estado === "falto") racha = 0;
    });
    // Hora habitual (la más repetida)
    const horas = vino.map((c) => c.asistencia?.time?.slice(0, 2)).filter(Boolean);
    const moda = horas.sort((a, b) => horas.filter((x) => x === b).length - horas.filter((x) => x === a).length)[0];
    // Por día de la semana
    const semana = DIAS.map((d, i) => ({ nombre: d, valor: vino.filter((c) => (new Date(`${c.fecha}T12:00:00`).getDay() + 6) % 7 === i).length }));
    return { vino: vino.length, falto: falto.length, pct: habiles ? Math.round((vino.length / habiles) * 100) : null, racha, mejor, hora: moda ? `${moda}:00` : "—", semana };
  }, [celdas]);

  // Semanas del mes: cuántas veces vino frente a su meta (días de su rutina)
  const semanas = useMemo(() => {
    if (!datos) return [];
    const meta = datos.metaSemanal?.dias || 3;
    const clasif = clasificar(datos);
    const out = [];
    for (let ini = lunesDe(`${mes}-01`); ini <= finDeMes(mes); ini = sumar(ini, 7)) {
      const dias = Array.from({ length: 7 }, (_, i) => sumar(ini, i));
      const estados = dias.map(clasif);
      const vino = estados.filter((c) => c.estado === "vino" || c.estado === "aviso").length;
      const enCurso = dias.some((d) => d >= datos.hoy) && dias[0] <= datos.hoy;
      const futura = dias[0] > datos.hoy;
      const sinPlan = estados.every((c) => c.estado === "sin" || c.estado === "congelado" || c.estado === "futuro");
      out.push({ ini, fin: dias[6], vino, meta, enCurso, futura, sinPlan, cumple: vino >= meta });
    }
    return out;
  }, [datos, mes]);

  // Días desde la última vez que vino (con el año cargado)
  const ausencia = useMemo(() => {
    if (!anio || !datos) return null;
    const ultimos = anio.days.filter((d) => d.status !== "denied").map((d) => d.date).sort();
    const ultima = ultimos[ultimos.length - 1];
    if (!ultima) return { dias: null, ultima: null };
    const dias = Math.round((new Date(`${datos.hoy}T12:00:00`) - new Date(`${ultima}T12:00:00`)) / 86400000);
    return { dias, ultima };
  }, [anio, datos]);

  const porMes = useMemo(() => {
    if (!anio) return [];
    const base = moverMes(hoyISO().slice(0, 7), -11);
    return Array.from({ length: 12 }, (_, i) => {
      const m = moverMes(base, i);
      return {
        mes: m,
        nombre: `${MESES[Number(m.slice(5)) - 1].slice(0, 3)}`,
        valor: anio.days.filter((d) => d.date.startsWith(m) && d.status !== "denied").length,
      };
    });
  }, [anio]);

  if (error) return <p className="text-sm text-rose-600 p-4">{error}</p>;

  const titMes = `${MESES[Number(mes.slice(5)) - 1]} ${mes.slice(0, 4)}`;
  const esMesActual = mes === hoyISO().slice(0, 7);

  return (
    <div className="space-y-4">
      {titulo && datos && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-lg font-black text-slate-900">{datos.alumno.name}</p>
            <p className="text-xs text-slate-500">
              <span className="font-mono font-bold text-blue-700">{datos.alumno.codeLabel}</span> · inscrito el{" "}
              {datos.alumno.registeredAt?.split("-").reverse().join("/")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          [CalendarCheck, "Días que vino", stats.vino, "text-emerald-600"],
          [CalendarX, "Días que faltó", stats.falto, "text-rose-600"],
          [Percent, "Asistencia del mes", stats.pct == null ? "—" : `${stats.pct}%`, "text-slate-900"],
          [Flame, "Mejor racha", `${stats.mejor} día${stats.mejor === 1 ? "" : "s"}`, "text-orange-500"],
        ].map(([Icono, t, v, c]) => (
          <div key={t} className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
              <Icono className={`w-5 h-5 ${c}`} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">{t}</p>
              <p className={`text-xl font-black ${c}`}>{v}</p>
            </div>
          </div>
        ))}
      </div>

      {ausencia?.dias >= 4 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex flex-wrap items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm text-rose-800 flex-1">
            <b>Lleva {ausencia.dias} días sin venir</b> (última vez: {ausencia.ultima.split("-").reverse().join("/")}).
            {seguimiento && " Anota el motivo y si ya lo contactaron."}
          </p>
          {seguimiento && (
            <button
              type="button"
              onClick={() => setForm({ date: datos.hoy, until: "", reason: "otro", channel: "whatsapp", detail: "" })}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Registrar seguimiento
            </button>
          )}
        </div>
      )}

      {datos && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-600" /> Veces por semana
            </p>
            <p className="text-[11px] text-slate-500">
              Meta: <b className="text-slate-800">{datos.metaSemanal?.dias || 3} días por semana</b>{" "}
              {datos.metaSemanal?.fuente === "rutina" ? `(su rutina «${datos.metaSemanal.rutina}»)` : "(sin rutina asignada: meta general)"}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {semanas.map((w) => {
              const pct = Math.min(100, Math.round((w.vino / w.meta) * 100));
              const color = w.futura || w.sinPlan ? "bg-slate-200" : w.cumple ? "bg-emerald-500" : w.enCurso ? "bg-amber-400" : "bg-rose-500";
              return (
                <div key={w.ini} className="rounded-xl border border-slate-200 p-2.5">
                  <p className="text-[10px] font-bold text-slate-500">
                    {w.ini.slice(8)}/{w.ini.slice(5, 7)} – {w.fin.slice(8)}/{w.fin.slice(5, 7)}
                  </p>
                  <p className="text-lg font-black text-slate-900 leading-tight">
                    {w.vino}
                    <span className="text-xs text-slate-400 font-bold"> / {w.meta}</span>
                  </p>
                  <div className="h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${w.futura ? 0 : pct}%` }} />
                  </div>
                  <p className="text-[10px] font-bold mt-1 flex items-center gap-1">
                    {w.futura ? (
                      <span className="text-slate-400">Próxima</span>
                    ) : w.sinPlan ? (
                      <span className="text-slate-400">Sin membresía</span>
                    ) : w.cumple ? (
                      <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cumplió</span>
                    ) : w.enCurso ? (
                      <span className="text-amber-600">En curso · faltan {w.meta - w.vino}</span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> No cumplió</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setMes(moverMes(mes, -1))} className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer" title="Mes anterior">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="font-black text-slate-900">{titMes}</p>
              {!esMesActual && (
                <button type="button" onClick={() => setMes(hoyISO().slice(0, 7))} className="text-[11px] font-bold text-blue-600 cursor-pointer">
                  Ir a este mes
                </button>
              )}
            </div>
            <button type="button" onClick={() => setMes(moverMes(mes, 1))} disabled={esMesActual} className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer disabled:opacity-30" title="Mes siguiente">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {DIAS.map((d) => (
              <span key={d} className="text-[11px] font-bold uppercase text-slate-400 py-1">
                {d}
              </span>
            ))}
            {!datos
              ? Array.from({ length: 35 }, (_, i) => <span key={i} className="aspect-square rounded-xl bg-slate-50 animate-pulse" />)
              : celdas.map((c, i) =>
                  c ? (
                    <button
                      key={c.fecha}
                      type="button"
                      onClick={() => setDiaSel(c)}
                      title={`${c.fecha.split("-").reverse().join("/")} · ${ESTADOS_DIA[c.estado].nombre}${c.asistencia ? ` · ${c.asistencia.time}` : ""}`}
                      className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-sm font-bold cursor-pointer transition-transform hover:scale-105 ${ESTADOS_DIA[c.estado].clase} ${
                        c.fecha === datos.hoy ? "ring-2 ring-offset-1 ring-slate-900" : ""
                      }`}
                    >
                      {c.dia}
                      {c.asistencia && <span className="text-[9px] font-semibold opacity-90 leading-none">{c.asistencia.time}</span>}
                      {seguimiento && !c.asistencia && notaDelDia(c.fecha) && (
                        <span className="text-[9px] font-bold leading-none text-violet-700" title={MOTIVOS_AUSENCIA[notaDelDia(c.fecha).reason]}>
                          ● nota
                        </span>
                      )}
                    </button>
                  ) : (
                    <span key={`v${i}`} />
                  ),
                )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {["vino", "aviso", "falto", "congelado", "sin"].map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span className={`w-3 h-3 rounded ${ESTADOS_DIA[k].punto}`} /> {ESTADOS_DIA[k].nombre}
              </span>
            ))}
          </div>
          {diaSel && (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <b>{new Date(`${diaSel.fecha}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}:</b>{" "}
              {diaSel.asistencia
                ? `entró a las ${diaSel.asistencia.time}${diaSel.asistencia.marks > 1 ? ` (${diaSel.asistencia.marks} marcas)` : ""}`
                : ESTADOS_DIA[diaSel.estado].nombre.toLowerCase()}
              {seguimiento && notaDelDia(diaSel.fecha) && (
                <span className="text-violet-700 font-semibold"> · {MOTIVOS_AUSENCIA[notaDelDia(diaSel.fecha).reason]}</span>
              )}
              {seguimiento && !diaSel.asistencia && diaSel.estado !== "futuro" && (
                <button
                  type="button"
                  onClick={() => setForm({ date: diaSel.fecha, until: "", reason: "otro", channel: "ninguno", detail: "" })}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold cursor-pointer"
                >
                  Anotar motivo
                </button>
              )}
            </div>
          )}
          {form && (
            <form onSubmit={guardarNota} className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <p className="sm:col-span-2 text-xs font-black uppercase text-violet-800">¿Por qué no está viniendo?</p>
              <label className="text-[11px] font-bold text-slate-600">
                Desde
                <input type="date" value={form.date} max={datos?.hoy} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-0.5 w-full p-2 rounded-lg border border-slate-200 bg-white text-sm" required />
              </label>
              <label className="text-[11px] font-bold text-slate-600">
                Hasta (opcional)
                <input type="date" value={form.until} min={form.date} onChange={(e) => setForm({ ...form, until: e.target.value })} className="mt-0.5 w-full p-2 rounded-lg border border-slate-200 bg-white text-sm" />
              </label>
              <label className="text-[11px] font-bold text-slate-600">
                Motivo
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-0.5 w-full p-2 rounded-lg border border-slate-200 bg-white text-sm">
                  {Object.entries(MOTIVOS_AUSENCIA).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">
                ¿Se le contactó?
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="mt-0.5 w-full p-2 rounded-lg border border-slate-200 bg-white text-sm">
                  {Object.entries(MEDIOS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <input
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                placeholder="Detalle: qué dijo, cuándo vuelve…"
                maxLength={300}
                className="sm:col-span-2 p-2 rounded-lg border border-slate-200 bg-white text-sm"
              />
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setForm(null)} className="px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                  {guardando ? "Guardando…" : "Guardar nota"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {seguimiento && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                  <MessageSquareText className="w-4 h-4 text-violet-600" /> Seguimiento de ausencias
                </p>
                {!form && datos && (
                  <button
                    type="button"
                    onClick={() => setForm({ date: datos.hoy, until: "", reason: "otro", channel: "ninguno", detail: "" })}
                    className="text-[11px] font-bold text-violet-700 cursor-pointer"
                  >
                    + Nota
                  </button>
                )}
              </div>
              {notas.length === 0 ? (
                <p className="text-xs text-slate-400">Sin notas. Toca un día en que no vino y usa «Anotar motivo».</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notas.slice(0, 30).map((n) => (
                    <li key={n.id} className="rounded-xl border border-violet-100 bg-violet-50/50 p-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-800">
                          {MOTIVOS_AUSENCIA[n.reason] || n.reason}
                          <span className="font-semibold text-slate-500">
                            {" "}· {n.date.split("-").reverse().join("/")}
                            {n.until && n.until !== n.date ? ` al ${n.until.split("-").reverse().join("/")}` : ""}
                          </span>
                        </p>
                        <button type="button" onClick={() => borrarNota(n)} className="text-slate-400 hover:text-rose-600 cursor-pointer" title="Borrar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {n.detail && <p className="text-slate-600 mt-0.5">{n.detail}</p>}
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" /> {MEDIOS[n.channel] || "Sin contactar"}
                        {n.registeredBy && ` · por ${n.registeredBy}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase text-slate-500 mb-1">Días que más viene ({titMes.split(" ")[0]})</p>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.semana} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} día(s)`, "Asistencias"]} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} fill="#10b981" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500">Hora habitual de llegada: <b>{stats.hora}</b></p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase text-slate-500 mb-1">Asistencias por mes (último año)</p>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMes} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} onClick={(e) => e?.activePayload && setMes(e.activePayload[0].payload.mes)}>
                  <XAxis dataKey="nombre" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} día(s)`, "Asistencias"]} />
                  <Bar dataKey="valor" radius={[5, 5, 0, 0]} cursor="pointer" isAnimationActive={false}>
                    {porMes.map((p) => (
                      <Cell key={p.mes} fill={p.mes === mes ? "#0f172a" : "#a7f3d0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500">Toca una barra para ver ese mes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
