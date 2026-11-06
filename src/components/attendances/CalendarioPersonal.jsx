// Calendario de asistencia del personal: por trabajador y por mes,
// qué días llegó puntual, tarde, faltó, tuvo permiso o no se registró.
// Desde aquí también se corrige un día (marcar falta, permiso, tarde...).
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarCheck, Clock, CalendarX, FileCheck2, HelpCircle, Search } from "lucide-react";
import { useGym } from "../../context/GymContext";
import { hoyISO } from "../../utils/fecha";
import { userCan } from "../../config/roles";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const moverMes = (mes, n) => {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const ESTADOS_PERSONAL = {
  puntual: { nombre: "Puntual", clase: "bg-emerald-500 text-white border-emerald-500", punto: "bg-emerald-500", icono: CalendarCheck, texto: "text-emerald-600" },
  tarde: { nombre: "Tarde", clase: "bg-amber-400 text-white border-amber-400", punto: "bg-amber-400", icono: Clock, texto: "text-amber-600" },
  falta: { nombre: "Faltó", clase: "bg-rose-500 text-white border-rose-500", punto: "bg-rose-500", icono: CalendarX, texto: "text-rose-600" },
  permiso: { nombre: "Permiso", clase: "bg-sky-500 text-white border-sky-500", punto: "bg-sky-500", icono: FileCheck2, texto: "text-sky-600" },
  sin: { nombre: "Sin registro", clase: "bg-slate-50 text-slate-500 border-dashed border-slate-300", punto: "bg-slate-200", icono: HelpCircle, texto: "text-slate-500" },
  descanso: { nombre: "Descanso / fuera de contrato", clase: "bg-white text-slate-300 border-slate-100", punto: "bg-white border border-slate-200" },
  futuro: { nombre: "Próximo", clase: "bg-white text-slate-300 border-slate-100", punto: "bg-white border border-slate-200" },
};

export const normalizarEstado = (s) =>
  ({ puntual: "puntual", on_time: "puntual", authorized: "puntual", tarde: "tarde", late: "tarde", falta: "falta", permiso: "permiso" })[s] || "puntual";

/** Registros de un contrato */
export const registrosDe = (attendances, c) =>
  attendances.filter(
    (a) =>
      a.category !== "student" &&
      a.userRole !== "student" &&
      (a.contractId === c.id || (c.staffId && a.userId === c.staffId) || (c.dni && a.userDni === c.dni)),
  );

export const CalendarioPersonal = () => {
  const { attendances, staffContracts, recordAttendance, deleteAttendance, currentUser } = useGym();
  const puedeEditar = userCan(currentUser, "attendances", "editar") || userCan(currentUser, "attendances", "crear");
  const [texto, setTexto] = useState("");
  const [elegidoId, setElegidoId] = useState(staffContracts[0]?.id || "");
  const [mes, setMes] = useState(hoyISO().slice(0, 7));
  const [diaSel, setDiaSel] = useState(null);
  const [motivo, setMotivo] = useState("");
  const hoy = hoyISO();

  const lista = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return staffContracts.filter((c) => !q || c.fullName?.toLowerCase().includes(q) || String(c.dni || "").includes(q) || c.roleTitle?.toLowerCase().includes(q));
  }, [staffContracts, texto]);
  const c = staffContracts.find((x) => x.id === elegidoId) || lista[0];

  // Un registro por día (el último de entrada manda el estado)
  const porDia = useMemo(() => {
    if (!c) return {};
    const out = {};
    registrosDe(attendances, c)
      .slice()
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .forEach((a) => {
        const d = (out[a.date] ||= { entradas: [], salidas: [] });
        if (a.type === "out") d.salidas.push(a);
        else d.entradas.push(a);
      });
    Object.values(out).forEach((d) => {
      const u = d.entradas[d.entradas.length - 1];
      d.estado = u ? normalizarEstado(u.status) : "puntual";
      d.ultimo = u || d.salidas[0];
    });
    return out;
  }, [attendances, c]);

  const celdas = useMemo(() => {
    if (!c) return [];
    const [y, m] = mes.split("-").map(Number);
    const vacias = (new Date(y, m - 1, 1).getDay() + 6) % 7;
    const total = new Date(y, m, 0).getDate();
    return [
      ...Array.from({ length: vacias }, () => null),
      ...Array.from({ length: total }, (_, i) => {
        const fecha = `${mes}-${String(i + 1).padStart(2, "0")}`;
        const dow = new Date(`${fecha}T12:00:00`).getDay();
        const reg = porDia[fecha];
        let estado;
        if (reg) estado = reg.estado;
        else if (fecha > hoy) estado = "futuro";
        else if (dow === 0 || (c.startDate && fecha < c.startDate) || (c.endDate && fecha > c.endDate)) estado = "descanso";
        else estado = "sin";
        return { fecha, dia: i + 1, estado, reg };
      }),
    ];
  }, [c, mes, porDia, hoy]);

  const stats = useMemo(() => {
    const d = celdas.filter(Boolean);
    const cuenta = (k) => d.filter((x) => x.estado === k).length;
    const laborables = d.filter((x) => ["puntual", "tarde", "falta", "permiso", "sin"].includes(x.estado)).length;
    const asistio = cuenta("puntual") + cuenta("tarde");
    return { puntual: cuenta("puntual"), tarde: cuenta("tarde"), falta: cuenta("falta"), permiso: cuenta("permiso"), sin: cuenta("sin"), pct: laborables ? Math.round((asistio / laborables) * 100) : null };
  }, [celdas]);

  const marcar = (estado) => {
    if (!c || !diaSel) return;
    if ((estado === "falta" || estado === "permiso") && !motivo.trim() && !window.confirm("¿Guardar sin escribir el motivo?")) return;
    const previos = diaSel.reg?.entradas || [];
    recordAttendance({
      date: diaSel.fecha,
      time: diaSel.reg?.ultimo?.time || (estado === "falta" || estado === "permiso" ? "—" : "08:00 a. m."),
      userId: c.staffId,
      userName: c.fullName,
      userRole: c.role === "trainer" ? "trainer" : "staff",
      userDni: c.dni,
      type: "in",
      status: estado,
      category: "staff",
      contractId: c.id,
      hoursWorked: estado === "falta" || estado === "permiso" ? 0 : undefined,
      reason: motivo.trim() || undefined,
      checkInMethod: "dni_manual",
      notes: `Corregido desde el calendario del personal (${ESTADOS_PERSONAL[estado].nombre})`,
    });
    previos.forEach((a) => deleteAttendance(a.id));
    setMotivo("");
    setDiaSel(null);
  };

  if (!staffContracts.length)
    return <p className="text-sm text-slate-500 text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">Aún no hay personal con contrato registrado.</p>;

  const titMes = `${MESES[Number(mes.slice(5)) - 1]} ${mes.slice(0, 4)}`;
  const esMesActual = mes === hoy.slice(0, 7);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar trabajador por nombre, DNI o cargo…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {lista.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                setElegidoId(x.id);
                setDiaSel(null);
              }}
              className={`px-3 py-1.5 rounded-xl border text-sm cursor-pointer ${
                c?.id === x.id ? "bg-blue-600 border-blue-600 text-white font-bold" : "border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300"
              }`}
            >
              {x.fullName}
              <span className={`ml-1.5 text-[11px] ${c?.id === x.id ? "text-blue-100" : "text-slate-500"}`}>{x.roleTitle}</span>
            </button>
          ))}
        </div>
      </div>

      {c && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {["puntual", "tarde", "falta", "permiso", "sin"].map((k) => {
              const E = ESTADOS_PERSONAL[k];
              const Icono = E.icono;
              return (
                <div key={k} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-2.5">
                  <Icono className={`w-5 h-5 ${E.texto}`} />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">{E.nombre}</p>
                    <p className={`text-xl font-black ${E.texto}`}>{stats[k]}</p>
                  </div>
                </div>
              );
            })}
            <div className="bg-white rounded-2xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">Asistencia del mes</p>
              <p className="text-xl font-black text-slate-900">{stats.pct == null ? "—" : `${stats.pct}%`}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setMes(moverMes(mes, -1))} className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer" title="Mes anterior">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="font-black text-slate-900">
                  {c.fullName} · {titMes}
                </p>
                <p className="text-[11px] text-slate-500">
                  {c.roleTitle} · contrato {c.startDate?.split("-").reverse().join("/")} al {c.endDate?.split("-").reverse().join("/")}
                </p>
                {!esMesActual && (
                  <button type="button" onClick={() => setMes(hoy.slice(0, 7))} className="text-[11px] font-bold text-blue-600 cursor-pointer">
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
              {celdas.map((x, i) =>
                x ? (
                  <button
                    key={x.fecha}
                    type="button"
                    onClick={() => {
                      setDiaSel(x);
                      setMotivo(x.reg?.ultimo?.reason || "");
                    }}
                    title={`${x.fecha.split("-").reverse().join("/")} · ${ESTADOS_PERSONAL[x.estado].nombre}`}
                    className={`h-14 sm:h-16 rounded-xl border flex flex-col items-center justify-center text-sm font-bold cursor-pointer transition-transform hover:scale-105 ${ESTADOS_PERSONAL[x.estado].clase} ${
                      x.fecha === hoy ? "ring-2 ring-offset-1 ring-slate-900" : ""
                    } ${diaSel?.fecha === x.fecha ? "ring-2 ring-blue-500" : ""}`}
                  >
                    {x.dia}
                    {x.reg?.ultimo?.time && x.reg.ultimo.time !== "—" && (
                      <span className="text-[9px] font-semibold opacity-90 leading-none">{String(x.reg.ultimo.time).replace(/\s?[ap]\.?\s?m\.?/i, "")}</span>
                    )}
                  </button>
                ) : (
                  <span key={`v${i}`} />
                ),
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              {["puntual", "tarde", "falta", "permiso", "sin", "descanso"].map((k) => (
                <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <span className={`w-3 h-3 rounded ${ESTADOS_PERSONAL[k].punto}`} /> {ESTADOS_PERSONAL[k].nombre}
                </span>
              ))}
            </div>

            {diaSel && (
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                <p className="text-sm text-slate-700">
                  <b>{new Date(`${diaSel.fecha}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}:</b>{" "}
                  {ESTADOS_PERSONAL[diaSel.estado].nombre}
                  {diaSel.reg?.entradas?.length > 0 && diaSel.reg.ultimo?.time !== "—" && ` · entrada ${diaSel.reg.entradas[0].time}`}
                  {diaSel.reg?.salidas?.length > 0 && ` · salida ${diaSel.reg.salidas[diaSel.reg.salidas.length - 1].time}`}
                  {diaSel.reg?.ultimo?.reason && <span className="text-slate-500"> · Motivo: {diaSel.reg.ultimo.reason}</span>}
                </p>
                {puedeEditar && diaSel.estado !== "futuro" && diaSel.estado !== "descanso" && (
                  <>
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Motivo / observación (salud, trámite, tráfico, vacaciones…)"
                      maxLength={200}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      {["puntual", "tarde", "falta", "permiso"].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => marcar(k)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border ${ESTADOS_PERSONAL[k].clase}`}
                        >
                          Marcar {ESTADOS_PERSONAL[k].nombre.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
