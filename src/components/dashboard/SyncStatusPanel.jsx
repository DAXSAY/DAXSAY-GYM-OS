// Estado de la copia de los registros del sistema a sus tablas de MySQL
// (citas, rutinas, dietas, medidas, fisioterapia, asistencias...). Solo admin.
import React, { useEffect, useState } from "react";
import { Database, RefreshCw, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../api/cliente";

const NOMBRES = {
  ejercicios: "Ejercicios propios",
  contratos: "Contratos",
  planilla: "Planilla",
  productos: "Productos",
  rutinas: "Rutinas",
  asignaciones_rutina: "Rutinas asignadas",
  planes_nutricion: "Dietas",
  evaluaciones_corporales: "Medidas",
  citas: "Citas",
  fisioterapia: "Fisioterapia",
  asistencias: "Asistencias",
  clases: "Clases",
  reglas_notificacion: "Reglas de avisos",
  notificaciones: "Avisos enviados",
  plantillas_fisioterapia: "Plantillas de fisio",
};

export const SyncStatusPanel = () => {
  const [estado, setEstado] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargar = () => api("/registros/sincronizacion").then(setEstado).catch(() => setEstado(null));
  useEffect(() => {
    cargar();
  }, []);

  if (!estado) return null;

  if (!estado.activa)
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Falta ejecutar <strong className="font-mono">07_sincronizacion_tablas.sql</strong> en MySQL para que citas, rutinas, dietas y
        demás registros también queden en sus tablas.
      </div>
    );

  const total = estado.modulos.reduce(
    (a, m) => ({ ok: a.ok + m.ok, pendiente: a.pendiente + m.pendiente, error: a.error + m.error }),
    { ok: 0, pendiente: 0, error: 0 },
  );
  const todoBien = total.error === 0 && total.pendiente === 0;

  const reintentar = async () => {
    setTrabajando(true);
    setMensaje("");
    try {
      const r = await api("/registros/sincronizacion", { method: "POST" });
      setMensaje(`${r.ok} copiados${r.error ? `, ${r.error} siguen con error` : ""}.`);
      await cargar();
    } catch (e) {
      setMensaje(e.message);
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 ${todoBien ? "bg-white border-slate-200" : "bg-amber-50 border-amber-300"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setAbierto(!abierto)} className="flex items-center gap-3 text-left cursor-pointer">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${todoBien ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              Base de datos {todoBien ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            </span>
            <span className="text-xs text-slate-600">
              {total.ok} registros copiados a sus tablas
              {total.pendiente ? ` · ${total.pendiente} pendientes` : ""}
              {total.error ? ` · ${total.error} con error` : ""}
            </span>
          </div>
          {abierto ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {!todoBien && (
          <button
            onClick={reintentar}
            disabled={trabajando}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${trabajando ? "animate-spin" : ""}`} /> Volver a copiar
          </button>
        )}
      </div>
      {mensaje && <p className="text-xs font-bold text-slate-700 mt-2">{mensaje}</p>}

      {abierto && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {estado.modulos
              .filter((m) => m.ok + m.pendiente + m.error > 0)
              .map((m) => (
                <div key={m.modulo} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                  <strong className="block text-slate-800">{NOMBRES[m.modulo] || m.modulo}</strong>
                  <span className="text-emerald-700 font-bold">{m.ok} ok</span>
                  {m.pendiente > 0 && <span className="text-slate-500"> · {m.pendiente} pend.</span>}
                  {m.error > 0 && <span className="text-rose-600 font-bold"> · {m.error} error</span>}
                </div>
              ))}
          </div>
          {estado.errores.length > 0 && (
            <div className="bg-white rounded-xl border border-rose-200 p-3 space-y-1.5 text-xs">
              <strong className="text-rose-700">Registros que no se pudieron copiar (siguen guardados en el sistema):</strong>
              {estado.errores.map((e) => (
                <p key={`${e.modulo}-${e.idregistro}`} className="text-slate-700">
                  <span className="font-bold">{NOMBRES[e.modulo] || e.modulo}</span> · {e.detalle}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
