// Congelamiento de membresía: derecho según el plan, nuevo congelamiento e historial
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Snowflake, CalendarClock, AlertTriangle, CheckCircle2, History, Undo2, LogIn } from "lucide-react";
import { useGym } from "../../context/GymContext";
import { api } from "../../api/cliente";
import { userCan } from "../../config/roles";
import { hoyISO, sumarDias, diasHasta, fechaCorta } from "../../utils/fecha";

const MOTIVOS = ["Viaje", "Lesión / salud", "Trabajo", "Estudios", "Embarazo", "Otro"];

export const ESTILO_CONGELAMIENTO = {
  programado: "bg-indigo-50 text-indigo-700 border-indigo-200",
  activo: "bg-sky-600 text-white border-sky-600",
  cumplido: "bg-slate-100 text-slate-600 border-slate-200",
  terminado_antes: "bg-amber-50 text-amber-700 border-amber-200",
  anulado: "bg-rose-50 text-rose-600 border-rose-200 line-through",
};

/** Insignia corta para listas: "Congelado hasta 05/12" o "Congela desde 10/11" */
export const FreezeBadge = ({ member, compact = false }) => {
  const c = member?.freeze?.current;
  if (!c) return null;
  const activo = c.status === "activo";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-bold ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"} ${
        activo ? "bg-sky-600 text-white border-sky-600" : "bg-indigo-50 text-indigo-700 border-indigo-200"
      }`}
    >
      <Snowflake className="w-3 h-3" />
      {activo ? `Congelado hasta ${fechaCorta(c.endDate).slice(0, 5)}` : `Congela desde ${fechaCorta(c.startDate).slice(0, 5)}`}
    </span>
  );
};

/** Valida los días como lo hace el servidor (todo o nada) */
function errorDias(d, dias) {
  if (!d?.puede) return d?.motivoNo || "No puede congelar";
  if (!Number.isInteger(dias) || dias < 1) return "Indica los días";
  if (d.debeUsarTodo && dias !== d.restante) return `Es todo o nada: debe congelar los ${d.restante} días que le quedan`;
  if (dias > d.restante) return `Solo le quedan ${d.restante} días`;
  if (dias < d.minimo) return `Mínimo ${d.minimo} días por congelamiento`;
  const sobra = d.restante - dias;
  if (sobra > 0 && sobra < d.minimo) return `Quedarían ${sobra} días (menos que el mínimo de ${d.minimo}): congele ${d.restante} o como máximo ${d.restante - d.minimo}`;
  return "";
}

export const FreezeScreen = ({ member, onVolver }) => {
  const { freezeMember, closeFreeze, currentUser, members } = useGym();
  const vivo = members.find((m) => m.id === member.id) || member;
  const [data, setData] = useState(null);
  const [inicio, setInicio] = useState(hoyISO());
  const [dias, setDias] = useState("");
  const [motivoTipo, setMotivoTipo] = useState("");
  const [motivoTexto, setMotivoTexto] = useState("");
  const [cierre, setCierre] = useState(null); // { accion, c }
  const [notaCierre, setNotaCierre] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = () => api(`/alumnos/${member.id}/congelamientos`).then(setData).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, [member.id]);

  const puedeEditar = userCan(currentUser, "members", "editar");
  const actual = data?.enrollments?.find((e) => e.current) || data?.enrollments?.[0];

  // Si es todo o nada, los días quedan fijos
  useEffect(() => {
    if (actual?.puede && actual.debeUsarTodo) setDias(String(actual.restante));
    else if (actual?.puede && dias === "") setDias(String(actual.minDias));
  }, [actual?.id, actual?.restante]);

  // Congelamientos que aún cuentan (programados o en curso): el nuevo no puede cruzarse con ellos
  const pendientes = (data?.history || []).filter((h) => h.status === "programado" || h.status === "activo");
  const primeraLibre = pendientes.reduce((f, h) => (h.returnDate > f ? h.returnDate : f), hoyISO());
  useEffect(() => {
    if (data) setInicio(primeraLibre);
  }, [data]);

  const nDias = Number(dias);
  const msgDias = actual ? errorDias(actual, nDias) : "";
  const fin = nDias > 0 ? sumarDias(inicio, nDias - 1) : null;
  const nuevoVence = actual && nDias > 0 ? sumarDias(String(actual.endDate), nDias) : null;
  const motivo = [motivoTipo, motivoTexto.trim()].filter(Boolean).join(": ");
  const fueraDeMembresia = actual && (inicio < String(actual.startDate) || inicio > String(actual.endDate));
  const cruce = fin && pendientes.find((h) => h.startDate <= fin && h.endDate >= inicio);

  // Opciones rápidas válidas (ej. 15 o 30)
  const atajos = useMemo(() => {
    if (!actual?.puede) return [];
    if (actual.debeUsarTodo) return [actual.restante];
    const set = new Set([actual.minDias, actual.restante, actual.restante - actual.minimo].filter((n) => n >= actual.minimo && n <= actual.restante));
    return [...set].sort((a, b) => a - b).filter((n) => !errorDias(actual, n));
  }, [actual]);

  const registrar = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (!motivoTipo) return setError("Elige el motivo del congelamiento");
    setEnviando(true);
    try {
      const r = await freezeMember(member.id, { startDate: inicio, days: nDias, reason: motivo.length >= 5 ? motivo : `${motivo} (sin detalle)` });
      setOk(
        `Congelado del ${fechaCorta(r.freeze.startDate)} al ${fechaCorta(r.freeze.endDate)}. Vuelve el ${fechaCorta(r.freeze.returnDate)}; su membresía ahora vence el ${fechaCorta(r.member.membershipEndDate)}.`,
      );
      setMotivoTipo("");
      setMotivoTexto("");
      setDias("");
      cargar();
    } catch (er) {
      setError(er.message);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarCierre = async () => {
    setError("");
    setOk("");
    setEnviando(true);
    try {
      const m = await closeFreeze(member.id, cierre.c.id, cierre.accion, notaCierre.trim());
      setOk(
        cierre.accion === "anular"
          ? `Congelamiento anulado: se devolvieron los días. Ahora vence el ${fechaCorta(m.membershipEndDate)}.`
          : `Congelamiento terminado: el alumno ya puede ingresar. Ahora vence el ${fechaCorta(m.membershipEndDate)}.`,
      );
      setCierre(null);
      setNotaCierre("");
      setDias("");
      cargar();
    } catch (er) {
      setError(er.message);
    } finally {
      setEnviando(false);
    }
  };

  const hist = data?.history || [];
  const enCurso = hist.find((h) => h.status === "activo") || hist.find((h) => h.status === "programado");

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto min-h-full p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Snowflake className="w-5 h-5 text-sky-600" /> Congelamiento · {vivo.fullName}
            </h2>
            <p className="text-xs text-slate-500">
              DNI {vivo.dni} · {vivo.planName} · vence {fechaCorta(vivo.membershipEndDate)}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {ok && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {ok}
          </div>
        )}

        {!data ? (
          <p className="text-sm text-slate-500 py-10 text-center">Cargando…</p>
        ) : !actual ? (
          <p className="text-sm text-slate-500 py-10 text-center bg-white rounded-2xl border border-slate-200">Este alumno no tiene membresía.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Derecho de congelamiento */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Derecho según el plan</p>
                <p className="font-extrabold text-slate-900">{actual.plan}</p>
                <p className={`text-sm font-semibold ${actual.total ? "text-sky-700" : "text-slate-500"}`}>{actual.texto}</p>
                {actual.total > 0 && (
                  <>
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                        <span>Usados {actual.usados} de {actual.total} días</span>
                        <span>Quedan {actual.restante}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, (actual.usados / actual.total) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                        <p className="text-[10px] font-bold uppercase text-slate-500">Congelamientos</p>
                        <p className="font-black text-slate-900">
                          {actual.partesUsadas} / {actual.partes}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                        <p className="text-[10px] font-bold uppercase text-slate-500">Caduca el</p>
                        <p className="font-black text-slate-900">{fechaCorta(actual.caducaEl)}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Es <b>todo o nada</b>: se congela en bloques de al menos {actual.minimo} días; si el alumno vuelve antes, los días no usados se
                      pierden. El derecho caduca cuando vence la membresía.
                    </p>
                  </>
                )}
              </div>

              {enCurso && (
                <div className={`rounded-2xl p-5 space-y-2 ${enCurso.status === "activo" ? "bg-sky-600 text-white" : "bg-indigo-50 border border-indigo-200 text-indigo-900"}`}>
                  <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Snowflake className="w-4 h-4" /> {enCurso.status === "activo" ? "Congelado ahora" : "Congelamiento programado"}
                  </p>
                  <p className="text-xl font-black">
                    {fechaCorta(enCurso.startDate)} → {fechaCorta(enCurso.endDate)}
                  </p>
                  <p className="text-sm">
                    {enCurso.status === "activo"
                      ? `Le quedan ${enCurso.daysLeft} día(s). Se reactiva solo el ${fechaCorta(enCurso.returnDate)}.`
                      : `Empieza en ${enCurso.daysLeft} día(s). Puede entrenar hasta el ${fechaCorta(sumarDias(enCurso.startDate, -1))}.`}
                  </p>
                </div>
              )}
            </div>

            {/* Nuevo congelamiento */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-black text-slate-800 flex items-center gap-1.5 mb-3">
                <CalendarClock className="w-4 h-4 text-sky-600" /> Nuevo congelamiento
              </p>
              {!puedeEditar ? (
                <p className="text-sm text-slate-500">Tu usuario no puede registrar congelamientos.</p>
              ) : !actual.puede ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600">{actual.motivoNo}</div>
              ) : (
                <form onSubmit={registrar} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-bold text-slate-600 mb-1">Desde *</span>
                      <input
                        type="date"
                        required
                        min={hoyISO()}
                        max={[sumarDias(hoyISO(), 60), String(actual.endDate)].sort()[0]}
                        value={inicio}
                        onChange={(e) => setInicio(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                      />
                      <span className="text-[11px] text-slate-500">Hoy o hasta 60 días después (dentro de la membresía).</span>
                    </label>
                    <label className="block">
                      <span className="block text-xs font-bold text-slate-600 mb-1">Días *</span>
                      <input
                        type="number"
                        required
                        min={actual.minDias}
                        max={actual.maxDias}
                        value={dias}
                        disabled={actual.debeUsarTodo}
                        onChange={(e) => setDias(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white disabled:bg-slate-100 disabled:font-black"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {atajos.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setDias(String(n))}
                            className={`px-2 py-1 rounded-md text-xs font-bold border cursor-pointer ${
                              nDias === n ? "bg-sky-600 text-white border-sky-600" : "bg-white text-sky-700 border-sky-300 hover:bg-sky-50"
                            }`}
                          >
                            {n} días
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>
                  {actual.debeUsarTodo && (
                    <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      Todo o nada: {actual.partesRestantes === 1 ? "es su último congelamiento" : "por el mínimo del plan"}, se congelan los{" "}
                      {actual.restante} días completos.
                    </p>
                  )}
                  <div>
                    <span className="block text-xs font-bold text-slate-600 mb-1">Motivo *</span>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {MOTIVOS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMotivoTipo(m)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                            motivoTipo === m ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <input
                      value={motivoTexto}
                      onChange={(e) => setMotivoTexto(e.target.value)}
                      maxLength={150}
                      placeholder="Detalle (ej. viaje a Cusco por trabajo, certificado médico...)"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  {msgDias || fueraDeMembresia || cruce ? (
                    <p className="text-xs font-bold text-rose-600">
                      {fueraDeMembresia
                        ? "La fecha debe estar dentro de la membresía"
                        : cruce
                          ? `Se cruza con el congelamiento del ${fechaCorta(cruce.startDate)} al ${fechaCorta(cruce.endDate)}: empieza desde el ${fechaCorta(cruce.returnDate)}`
                          : msgDias}
                    </p>
                  ) : (
                    fin && (
                      <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-sm text-sky-900 space-y-0.5">
                        <p>
                          Congelado del <b>{fechaCorta(inicio)}</b> al <b>{fechaCorta(fin)}</b> ({nDias} días) · vuelve el{" "}
                          <b>{fechaCorta(sumarDias(fin, 1))}</b>
                        </p>
                        <p>
                          Vencimiento: {fechaCorta(actual.endDate)} → <b>{fechaCorta(nuevoVence)}</b>
                        </p>
                        <p className="text-xs">
                          Le quedarán {actual.restante - nDias} día(s) y {actual.partesRestantes - 1} congelamiento(s).
                        </p>
                      </div>
                    )
                  )}
                  <button
                    type="submit"
                    disabled={enviando || !!msgDias || fueraDeMembresia || !!cruce}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Snowflake className="w-4 h-4" /> Registrar congelamiento
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Historial */}
        {data && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-black text-slate-800 flex items-center gap-1.5 mb-3">
              <History className="w-4 h-4 text-slate-500" /> Historial de congelamientos
            </p>
            {hist.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no tiene congelamientos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-3">Del</th>
                      <th className="py-2 pr-3">Al</th>
                      <th className="py-2 pr-3">Días</th>
                      <th className="py-2 pr-3">Plan</th>
                      <th className="py-2 pr-3">Motivo</th>
                      <th className="py-2 pr-3">Estado</th>
                      <th className="py-2 pr-3">Vencimiento</th>
                      <th className="py-2 pr-3">Registró</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {hist.map((h) => (
                      <tr key={h.id} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-3 whitespace-nowrap">{fechaCorta(h.startDate)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{fechaCorta(h.endDate)}</td>
                        <td className="py-2 pr-3 font-bold">
                          {h.days}
                          {h.daysUsed != null && <span className="block text-[11px] font-normal text-amber-700">usó {h.daysUsed}</span>}
                        </td>
                        <td className="py-2 pr-3">{h.planName}</td>
                        <td className="py-2 pr-3 max-w-[220px]">
                          {h.reason}
                          {h.closeNote && <span className="block text-[11px] text-slate-500">Cierre: {h.closeNote}</span>}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-bold ${ESTILO_CONGELAMIENTO[h.status]}`}>{h.statusLabel}</span>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-xs text-slate-600">
                          {fechaCorta(h.membershipEndBefore)} → {fechaCorta(h.membershipEndAfter)}
                        </td>
                        <td className="py-2 pr-3 text-xs text-slate-600">
                          {h.registeredBy}
                          {h.closedBy && <span className="block">cerró {h.closedBy}</span>}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {puedeEditar && h.status === "activo" && (
                            <button
                              onClick={() => setCierre({ accion: "terminar", c: h })}
                              className="px-2 py-1 rounded-md text-xs font-bold border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 cursor-pointer inline-flex items-center gap-1"
                            >
                              <LogIn className="w-3 h-3" /> Volvió antes
                            </button>
                          )}
                          {puedeEditar && (h.status === "programado" || (data.isAdmin && (h.status === "activo" || h.status === "cumplido"))) && (
                            <button
                              onClick={() => setCierre({ accion: "anular", c: h })}
                              className="ml-1 px-2 py-1 rounded-md text-xs font-bold border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer inline-flex items-center gap-1"
                            >
                              <Undo2 className="w-3 h-3" /> Anular
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {cierre && (
          <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
              <p className="font-extrabold text-slate-900">
                {cierre.accion === "anular" ? "Anular congelamiento" : "El alumno volvió antes"}
              </p>
              <p className="text-sm text-slate-600">
                {cierre.accion === "anular"
                  ? `Se deshace el congelamiento del ${fechaCorta(cierre.c.startDate)} al ${fechaCorta(cierre.c.endDate)}: se devuelven los ${cierre.c.days} días y el vencimiento vuelve a como estaba.`
                  : `Se reactiva hoy. Congeló ${Math.max(0, -diasHasta(cierre.c.startDate))} día(s); los ${cierre.c.days - Math.max(0, -diasHasta(cierre.c.startDate))} días no usados se pierden (todo o nada) y se descuentan del vencimiento.`}
              </p>
              <textarea
                rows={2}
                value={notaCierre}
                onChange={(e) => setNotaCierre(e.target.value)}
                placeholder={cierre.accion === "anular" ? "¿Por qué se anula? *" : "Observación * (ej. regresó de viaje antes)"}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setCierre(null)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
                  Cancelar
                </button>
                <button
                  onClick={confirmarCierre}
                  disabled={enviando || notaCierre.trim().length < 3}
                  className={`px-4 py-2 rounded-xl text-sm font-extrabold text-white disabled:opacity-50 cursor-pointer ${
                    cierre.accion === "anular" ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
