// Alertas para el administrador: hoy, cambios de fecha límite de pago hechos por recepción.
import React, { useCallback, useEffect, useState } from "react";
import { CalendarClock, Check, CheckCheck } from "lucide-react";
import { api } from "../../api/cliente";

const fc = (f) => (f ? String(f).slice(0, 10).split("-").reverse().join("/") : "—");

const hace = (fecha) => {
  const t = new Date(String(fecha).replace(" ", "T"));
  if (Number.isNaN(t.getTime())) return "";
  const min = Math.round((Date.now() - t.getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return fc(fecha);
};

/** Carga las alertas del administrador y las refresca cada minuto (o al avisar un cambio). */
export function useAlertasAdmin(activo, limite = 30) {
  const [datos, setDatos] = useState({ pendientes: 0, alertas: [] });
  const cargar = useCallback(async () => {
    if (!activo) return;
    try {
      setDatos(await api(`/alertas?limite=${limite}`));
    } catch {
      /* sin conexión: se reintenta en el siguiente ciclo */
    }
  }, [activo, limite]);

  useEffect(() => {
    if (!activo) return undefined;
    cargar();
    const t = setInterval(cargar, 60000);
    const alAvisar = () => cargar();
    window.addEventListener("radicalgym:alertas", alAvisar);
    window.addEventListener("focus", alAvisar);
    return () => {
      clearInterval(t);
      window.removeEventListener("radicalgym:alertas", alAvisar);
      window.removeEventListener("focus", alAvisar);
    };
  }, [activo, cargar]);

  const marcarVista = async (id) => {
    try {
      const r = await api(`/alertas/${id}/vista`, { method: "PUT" });
      setDatos((d) => ({
        pendientes: r.pendientes,
        alertas: d.alertas.map((a) => (id === "todas" || a.id === id ? { ...a, seen: true } : a)),
      }));
      window.dispatchEvent(new Event("radicalgym:alertas"));
    } catch {
      /* se reintenta al recargar */
    }
  };

  return { ...datos, cargar, marcarVista };
}

/** Una alerta de cambio de fecha de pago */
export function AlertaFechaPago({ alerta, onVista, compacta = false }) {
  return (
    <div
      className={`p-2.5 rounded-lg border text-xs transition-colors ${
        alerta.seen ? "bg-white border-slate-200 text-slate-500" : "bg-blue-50/70 border-blue-200 text-slate-800"
      }`}
    >
      <div className="flex items-start gap-2">
        <CalendarClock className={`w-4 h-4 mt-0.5 shrink-0 ${alerta.seen ? "text-slate-400" : "text-blue-600"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold truncate">{alerta.memberName || "Alumno"}</span>
            <span className="text-[11px] text-slate-400 shrink-0">{hace(alerta.date)}</span>
          </div>
          <p className="mt-0.5">
            Fecha de pago: <s className="text-slate-400">{fc(alerta.previousDate)}</s> →{" "}
            <b className={alerta.seen ? "" : "text-blue-700"}>{fc(alerta.newDate)}</b>
            {alerta.debt != null && <> · debe S/ {alerta.debt.toFixed(2)}</>}
          </p>
          {!compacta && <p className="text-[11px] text-slate-500 mt-0.5">{alerta.message}</p>}
          {compacta && alerta.by && <p className="text-[11px] text-slate-500 mt-0.5">Cambiado por: {alerta.by}</p>}
        </div>
        {!alerta.seen && onVista && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVista(alerta.id);
            }}
            title="Marcar como vista"
            className="p-1 rounded-md text-blue-700 hover:bg-blue-100 cursor-pointer shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Panel completo (sección Notificaciones & Alertas) */
export function PanelAlertasAdmin() {
  const { pendientes, alertas, marcarVista } = useAlertasAdmin(true, 100);
  const [verTodas, setVerTodas] = useState(false);
  const lista = verTodas ? alertas : alertas.filter((a) => !a.seen);
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900">Cambios de fecha de pago</h3>
          {pendientes > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">{pendientes} nuevas</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={() => setVerTodas((v) => !v)} className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
            {verTodas ? "Solo nuevas" : "Ver historial"}
          </button>
          {pendientes > 0 && (
            <button type="button" onClick={() => marcarVista("todas")} className="font-semibold text-blue-700 flex items-center gap-1 cursor-pointer">
              <CheckCheck className="w-3.5 h-3.5" /> Marcar todas como vistas
            </button>
          )}
        </div>
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-slate-500 py-3 text-center">
          {verTodas ? "Todavía no hay cambios registrados." : "No hay cambios nuevos. Recepción no ha movido ninguna fecha de pago."}
        </p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {lista.map((a) => (
            <AlertaFechaPago key={a.id} alerta={a} onVista={marcarVista} />
          ))}
        </div>
      )}
    </section>
  );
}
