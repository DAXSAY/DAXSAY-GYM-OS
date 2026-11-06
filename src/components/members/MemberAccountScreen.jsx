// Estado de cuenta del alumno: matrículas, pagos y cobro del saldo pendiente
import React, { useEffect, useState } from "react";
import { ArrowLeft, Wallet, CheckCircle2, CalendarClock, MessageCircle } from "lucide-react";
import { DebtDueDatePicker, DebtBadge, enlaceRecordatorioDeuda } from "./DebtDueDate";
import { useGym } from "../../context/GymContext";
import { api } from "../../api/cliente";
import { userCan } from "../../config/roles";

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const fecha = (f) => (f ? `${String(f).slice(8, 10)}/${String(f).slice(5, 7)}/${String(f).slice(0, 4)}` : "—");
const METODO = { efectivo: "Efectivo", yape_plin: "Yape / Plin", tarjeta: "Tarjeta", transferencia: "Transferencia" };

export const MemberAccountScreen = ({ member, onVolver }) => {
  const { payMemberDebt, setDebtDueDate, currentUser, cashShift, members, gymConfig } = useGym();
  const vivo = members.find((m) => m.id === member.id) || member; // datos actualizados del alumno
  const [nuevaFecha, setNuevaFecha] = useState(""); // fecha límite para lo que quede tras un abono
  const [reprogramar, setReprogramar] = useState(false);
  const [fechaRepro, setFechaRepro] = useState("");
  const [cuenta, setCuenta] = useState(null);
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("efectivo");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [deuda, setDeuda] = useState(member.debt || 0);

  const cargar = () => api(`/alumnos/${member.id}/pagos`).then(setCuenta).catch((e) => setError(e.message));
  useEffect(() => {
    cargar();
  }, [member.id]);

  const puedeEditarFecha = userCan(currentUser, "members", "editar") || userCan(currentUser, "finance", "editar");
  const abonoParcial = monto !== "" && Number(monto) > 0 && Number(monto) < deuda - 0.004;
  const linkWsp = enlaceRecordatorioDeuda({
    nombre: vivo.fullName, telefono: vivo.phone, monto: deuda, fecha: vivo.debtDueDate, gym: gymConfig?.gym_nombre || "RADICAL",
  });

  const guardarFecha = async () => {
    setError("");
    setOk("");
    try {
      await setDebtDueDate(member.id, fechaRepro);
      setOk(
        fechaRepro === String(vivo.debtDueDate || "").slice(0, 10)
          ? "La fecha límite no cambió."
          : currentUser?.role === "admin"
            ? "Fecha límite de pago actualizada."
            : "Fecha límite de pago actualizada. Se avisó al administrador.",
      );
      setReprogramar(false);
      cargar();
    } catch (er) {
      setError(er.message);
    }
  };

  const puedeCobrar = userCan(currentUser, "members", "crear") || userCan(currentUser, "finance", "crear");
  const cajaCerrada = currentUser?.role === "reception" && cashShift && !cashShift.open;

  const cobrar = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    setEnviando(true);
    try {
      const r = await payMemberDebt(member.id, Number(monto), metodo, notas, abonoParcial ? nuevaFecha : undefined);
      setNuevaFecha("");
      setDeuda(r.debt);
      setOk(`Cobro registrado. ${r.debt > 0 ? `Aún debe ${soles(r.debt)}.` : "Deuda cancelada."}`);
      setMonto("");
      setNotas("");
      cargar();
    } catch (er) {
      setError(er.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto min-h-full p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900">Estado de cuenta · {member.fullName}</h2>
            <p className="text-xs text-slate-500">DNI {member.dni}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={`rounded-2xl border-2 p-5 ${deuda > 0 ? "bg-rose-50 border-rose-300" : "bg-emerald-50 border-emerald-300"}`}>
            <span className="text-xs font-black uppercase text-slate-500">Deuda pendiente</span>
            <p className={`text-3xl font-black ${deuda > 0 ? "text-rose-600" : "text-emerald-600"}`}>{soles(deuda)}</p>
            {deuda <= 0 && (
              <p className="text-sm text-emerald-700 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" /> Al día
              </p>
            )}
            {deuda > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-slate-700 flex items-center gap-1">
                  <CalendarClock className="w-4 h-4 text-rose-500" />
                  Cancelar hasta: <b>{fecha(vivo.debtDueDate)}</b>
                </p>
                <DebtBadge member={{ ...vivo, debt: deuda }} compact />
                <div className="flex flex-wrap gap-2 pt-1">
                  {puedeEditarFecha && (
                    <button type="button" onClick={() => { setReprogramar((v) => !v); setFechaRepro(vivo.debtDueDate || ""); }} className="text-xs font-bold text-blue-700 underline cursor-pointer">
                      Cambiar fecha límite
                    </button>
                  )}
                  {linkWsp && (
                    <a href={linkWsp} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 flex items-center gap-1 underline">
                      <MessageCircle className="w-3.5 h-3.5" /> Recordar por WhatsApp
                    </a>
                  )}
                </div>
                {reprogramar && (
                  <div className="space-y-2">
                    <DebtDueDatePicker value={fechaRepro} onChange={setFechaRepro} membershipEnd={vivo.membershipEndDate} label="Nueva fecha límite" />
                    {currentUser?.role !== "admin" && (
                      <p className="text-[11px] text-slate-500">El administrador recibirá un aviso con la fecha anterior y la nueva.</p>
                    )}
                    <button type="button" disabled={!fechaRepro} onClick={guardarFecha} className="px-3 py-1.5 rounded-lg bg-blue-600 disabled:opacity-50 text-white text-xs font-bold cursor-pointer">
                      Guardar fecha
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {deuda > 0 && puedeCobrar && (
            <form onSubmit={cobrar} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-black uppercase text-slate-700 flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> Cobrar saldo
              </h3>
              {cajaCerrada && <p className="text-sm font-bold text-amber-700">Abre tu caja para poder cobrar.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block text-sm">
                  <span className="font-bold text-slate-700">Monto (S/)</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.10"
                    max={deuda}
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-lg font-black"
                  />
                  <button type="button" onClick={() => setMonto(String(deuda))} className="text-xs text-blue-600 font-bold mt-1 cursor-pointer">
                    Cobrar todo ({soles(deuda)})
                  </button>
                </label>
                <label className="block text-sm">
                  <span className="font-bold text-slate-700">Método</span>
                  <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white">
                    {Object.entries(METODO).map(([k, l]) => (
                      <option key={k} value={k}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-bold text-slate-700">Nota (opcional)</span>
                  <input value={notas} onChange={(e) => setNotas(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300" />
                </label>
              </div>
              {abonoParcial && (
                <DebtDueDatePicker
                  value={nuevaFecha}
                  onChange={setNuevaFecha}
                  membershipEnd={vivo.membershipEndDate}
                  required={false}
                  label={`Quedará debiendo ${soles(deuda - Number(monto))}. ¿Nueva fecha para cancelar? (opcional, si no se mantiene ${fecha(vivo.debtDueDate)})`}
                />
              )}
              {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
              <button disabled={enviando || cajaCerrada} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black cursor-pointer">
                {enviando ? "Registrando…" : "Registrar cobro"}
              </button>
            </form>
          )}
          {ok && <p className="lg:col-span-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold">{ok}</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
          <h3 className="text-sm font-black uppercase text-slate-700 mb-3">Matrículas</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-200">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Vigencia</th>
                <th className="py-2 pr-3 text-right">Precio</th>
                <th className="py-2 pr-3 text-right">Pagado</th>
                <th className="py-2 pr-3 text-right">Saldo</th>
                <th className="py-2 pr-3">Límite de pago</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(cuenta?.matriculas || []).map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{fecha(m.date)}</td>
                  <td className="py-2 pr-3 font-semibold">{m.plan} {m.renewal && <span className="text-xs text-blue-600">(renovación)</span>}</td>
                  <td className="py-2 pr-3">{fecha(m.start)} – {fecha(m.end)}</td>
                  <td className="py-2 pr-3 text-right">{soles(m.price)}</td>
                  <td className="py-2 pr-3 text-right text-emerald-700">{soles(m.paid)}</td>
                  <td className={`py-2 pr-3 text-right font-bold ${m.balance > 0 ? "text-rose-600" : "text-slate-400"}`}>{m.balance > 0 ? soles(m.balance) : "—"}</td>
                  <td className={`py-2 pr-3 ${m.dueStatus === "vencida" ? "text-rose-700 font-bold" : ""}`}>
                    {m.dueDate ? `${fecha(m.dueDate)}${m.dueStatus === "vencida" ? " (vencida)" : ""}${m.dueDateSet ? "" : " · fin del plan"}` : "—"}
                  </td>
                  <td className="py-2 capitalize">{m.status.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cuenta?.pagos?.length > 0 && (
            <>
              <h3 className="text-sm font-black uppercase text-slate-700 mt-5 mb-2">Pagos de saldo</h3>
              <ul className="text-sm space-y-1">
                {cuenta.pagos.map((p) => (
                  <li key={p.id} className="flex justify-between border-b border-slate-100 py-1">
                    <span>
                      {fecha(p.date)} {String(p.date).slice(11, 16)} · {METODO[p.method]} {p.notes && `· ${p.notes}`} · {p.user}
                    </span>
                    <strong className="text-emerald-700">{soles(p.amount)}</strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
