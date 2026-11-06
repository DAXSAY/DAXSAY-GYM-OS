// =====================================================================
// PROSPECTOS (CRM)
// Personas que vienen o escriben a preguntar: recepción anota sus datos,
// el plan que le interesa y cuándo contactarlo. El sistema avisa 30 min
// antes, se puede dar un pase libre con código y cerrar el caso como
// "Matriculado" o "De baja" (por ejemplo, si no contesta).
// =====================================================================
import React, { useEffect, useMemo, useState } from "react";
import {
  Contact, Plus, Phone, MessageCircle, CalendarClock, Ticket, UserCheck, UserX, Search, X, Clock, History, Sparkles,
  CheckCircle2, AlertTriangle, Footprints, Trash2, Pencil,
} from "lucide-react";
import { QrCodigo, descargarTarjetaQR, descargarPdfQR, compartirTarjetaQR, EscanerQR, camaraQRDisponible } from "../common/QrCodigo";
import { api } from "../../api/cliente";
import { useGym } from "../../context/GymContext";
import { userCan } from "../../config/roles";
import { hoyISO } from "../../utils/fecha";
import { TelWhatsApp } from "../common/TelWhatsApp";
import { PaseNoConcretado, PanelPases, ReporteCrm } from "./CrmPases";
import { NewMemberModal } from "../members/NewMemberModal";

export const ESTADOS_CRM = {
  nuevo: { label: "Nuevo", chip: "bg-sky-100 text-sky-800 border-sky-200", punto: "bg-sky-500" },
  seguimiento: { label: "En seguimiento", chip: "bg-amber-100 text-amber-800 border-amber-200", punto: "bg-amber-500" },
  pase_entregado: { label: "Pase libre entregado", chip: "bg-violet-100 text-violet-800 border-violet-200", punto: "bg-violet-500" },
  matriculado: { label: "Matriculado", chip: "bg-emerald-100 text-emerald-800 border-emerald-200", punto: "bg-emerald-500" },
  de_baja: { label: "De baja", chip: "bg-slate-200 text-slate-700 border-slate-300", punto: "bg-slate-400" },
};
const ORIGENES = { visita: "Vino al gimnasio", whatsapp: "WhatsApp", llamada: "Llamada", redes: "Redes sociales", referido: "Referido", web: "Página web", otro: "Otro" };
const CONTACTO = {
  llamada: { label: "Llamada", icono: Phone },
  whatsapp: { label: "WhatsApp", icono: MessageCircle },
  visita: { label: "Visita", icono: Footprints },
};
const MOTIVOS_BAJA = ["No contesta", "No responde los mensajes", "Eligió otro gimnasio", "Le pareció caro", "Se mudó / no puede venir", "Ya no está interesado"];
const fCorta = (iso) => (iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "");
const telWa = (t) => {
  const n = String(t || "").replace(/\D/g, "");
  return n.length === 9 ? `51${n}` : n;
};

/** Estado de la próxima cita de contacto */
export const estadoCita = (p) => {
  if (!p.contactDate || !p.contactTime || ["matriculado", "de_baja"].includes(p.status)) return null;
  const cuando = new Date(`${p.contactDate}T${p.contactTime}:00-05:00`).getTime();
  const min = Math.round((cuando - Date.now()) / 60000);
  if (min < -5) return { tono: "bg-rose-100 text-rose-800 border-rose-300", texto: "Atrasado", min };
  if (min <= 30) return { tono: "bg-orange-500 text-white border-orange-500 animate-pulse", texto: min <= 0 ? "¡Ahora!" : `En ${min} min`, min };
  if (p.contactDate === hoyISO()) return { tono: "bg-amber-100 text-amber-800 border-amber-300", texto: "Hoy", min };
  return { tono: "bg-sky-50 text-sky-800 border-sky-200", texto: "Agendado", min };
};

/** Primer nombre de quien atiende (recepcionista conectada) */
export const primerNombre = (t) => String(t || "").trim().split(/\s+/)[0] || "";
/** "soy Margot de RADICAL" (o "te escribe recepción de RADICAL" si la cuenta aún tiene nombre genérico) */
const presentacion = (quien, gym) => {
  const n = primerNombre(quien);
  if (!n || /^(recepci[oó]n|administra|admin|entrenador|nutrici|fisioterap|usuario)/i.test(n)) return `te escribe recepción de *${gym}*`;
  return `soy ${n} de *${gym}*`;
};

/** Mensaje de WhatsApp para el interesado, firmado por quien lo atiende */
export const mensajeWhatsApp = (p, gym = "RADICAL", quien = "") => {
  const nombre = primerNombre(p.fullName);
  const yo = presentacion(quien, gym);
  const plan = p.planName ? `el plan *${p.planName}*${p.planPrice ? ` (S/ ${p.planPrice})` : ""}` : "nuestros planes";
  const vinoHoy = p.source === "visita" && String(p.createdAt || "").slice(0, 10) === hoyISO();
  const inicio = vinoHoy ? `Gracias por visitarnos hoy y preguntar por ${plan}.` : `Gracias por tu interés en ${plan}.`;
  if (p.passCode) {
    const hora = p.contactDate === p.passDate && p.contactTime ? ` a las ${p.contactTime}` : "";
    return `Hola ${nombre} 👋, ${yo}. ${inicio}\n\n🎟️ Aquí tienes tu *pase libre* para conocer el gimnasio y entrenar gratis:\nCódigo: *${p.passCode}*\nVálido el ${fCorta(p.passDate)}${hora}.\n\nMuestra el QR (o el código) en recepción al llegar. Cualquier duda o consulta, escríbenos por aquí. ¡Te esperamos! 💪`;
  }
  return `Hola ${nombre} 👋, ${yo}. ${inicio}\n¿Te ayudamos a separar tu matrícula o prefieres venir a conocer el gimnasio con un pase libre? 💪`;
};

/** Para quien no vino con su pase: invitarlo a reprogramar */
export const mensajeReprogramar = (p, gym = "RADICAL", quien = "") => {
  const yo = presentacion(quien, gym);
  return `Hola ${primerNombre(p.fullName)} 👋, ${yo}. Te esperábamos el ${fCorta(p.passDate)} con tu pase libre *${p.passCode}* 😊. ¿Te lo reprogramamos para otro día? Dinos qué día y hora te queda mejor.`;
};

/** El pase ya venció sin usarse (o es hoy y pasó más de 1 hora de la cita) */
export const paseNoUsado = (p) => {
  if (p.status !== "pase_entregado" || !p.passCode || p.passUsedAt || !p.passDate) return false;
  const hoy = hoyISO();
  if (p.passDate < hoy) return true;
  if (p.passDate === hoy && p.contactDate === p.passDate && p.contactTime) {
    return new Date(`${p.passDate}T${p.contactTime}:00-05:00`).getTime() < Date.now() - 3600000;
  }
  return false;
};

// ---------------------------------------------------------------------
// Selector de día: Hoy, Mañana y los días de la semana que siguen
// ---------------------------------------------------------------------
const NOMBRE_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const diasRapidos = (hoy, n = 7) => {
  const [y, m, d] = hoy.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const f = new Date(Date.UTC(y, m - 1, d + i));
    return { iso: f.toISOString().slice(0, 10), nombre: i === 0 ? "Hoy" : i === 1 ? "Mañana" : NOMBRE_DIA[f.getUTCDay()], num: f.getUTCDate() };
  });
};

const TONOS_DIA = {
  azul: { on: "bg-blue-600 border-blue-600 text-white", off: "bg-white border-blue-200 text-blue-800 hover:bg-blue-50", txt: "text-blue-800", borde: "border-blue-200" },
  violeta: { on: "bg-violet-600 border-violet-600 text-white", off: "bg-white border-violet-200 text-violet-800 hover:bg-violet-50", txt: "text-violet-800", borde: "border-violet-200" },
};

const SelectorDia = ({ valor, onCambiar, tono = "azul" }) => {
  const hoy = hoyISO();
  const dias = useMemo(() => diasRapidos(hoy), [hoy]);
  const t = TONOS_DIA[tono];
  const fuera = valor && !dias.some((d) => d.iso === valor);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        {dias.map((d) => (
          <button
            key={d.iso}
            type="button"
            onClick={() => onCambiar(d.iso)}
            className={`rounded-xl border px-1 py-1.5 text-center cursor-pointer transition-colors ${valor === d.iso ? t.on : t.off}`}
          >
            <span className="block text-[11px] font-black uppercase leading-tight">{d.nombre}</span>
            <span className="block text-lg font-black leading-tight">{d.num}</span>
          </button>
        ))}
      </div>
      <label className={`flex items-center gap-2 text-xs font-bold ${t.txt}`}>
        Otra fecha:
        <input type="date" min={hoy} value={fuera ? valor : ""} onChange={(e) => e.target.value && onCambiar(e.target.value)} className={`px-2 py-1 rounded-lg border ${t.borde} bg-white text-sm text-slate-800`} />
        {valor && <span className="font-normal text-slate-500">· elegido: {fCorta(valor)}</span>}
      </label>
    </div>
  );
};

// ---------------------------------------------------------------------
// Formulario (nuevo / editar)
// ---------------------------------------------------------------------
const FormularioProspecto = ({ inicial, planes, onGuardar, onCerrar }) => {
  const [f, setF] = useState(() => ({
    fullName: "", phone: "", dni: "", email: "", planId: "", objective: "", source: "visita", notes: "",
    contactType: "whatsapp", contactDate: hoyISO(), contactTime: "16:00", ...(inicial || {}),
  }));
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const nuevo = !inicial?.id;
  const [aceptaPase, setAceptaPase] = useState(false);
  const elegirPase = (si) => {
    setAceptaPase(si);
    // Si acepta el pase, la cita es su visita al gimnasio
    if (si) setF((x) => ({ ...x, contactType: "visita", contactDate: x.contactDate || hoyISO(), contactTime: x.contactTime || "16:00" }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (f.contactType && (!f.contactDate || !f.contactTime)) return setError("Elige el día y la hora para contactarlo, o marca 'Sin cita'.");
    setGuardando(true);
    try {
      await onGuardar(
        { ...f, contactType: f.contactType || "", contactDate: f.contactType ? f.contactDate : "", contactTime: f.contactType ? f.contactTime : "" },
        // Pase libre solo si el interesado lo aceptó: para el día y la hora de su visita
        nuevo && aceptaPase ? { fecha: f.contactDate || hoyISO(), hora: f.contactTime || "" } : null,
      );
    } catch (er) {
      setError(er.message);
    } finally {
      setGuardando(false);
    }
  };

  const campo = "mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm";
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      <form onSubmit={guardar} className="w-full max-w-2xl mx-auto min-h-full bg-white p-6 space-y-4 text-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black flex items-center gap-2">
            <Contact className="w-5 h-5 text-blue-600" /> {inicial?.id ? "Editar prospecto" : "Nuevo prospecto"}
          </h3>
          <button type="button" onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm sm:col-span-2">
            <span className="font-bold text-slate-700">Nombre completo *</span>
            <input autoFocus value={f.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Ej. David Flores Ramos" className={campo} />
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Celular *</span>
            <input value={f.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" placeholder="9XX XXX XXX" className={campo} />
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Plan que le interesa</span>
            <select value={f.planId} onChange={(e) => set("planId", e.target.value)} className={campo}>
              <option value="">Aún no sabe</option>
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · S/ {p.price}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-700">¿Cómo nos conoció?</span>
            <select value={f.source} onChange={(e) => set("source", e.target.value)} className={campo}>
              {Object.entries(ORIGENES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Objetivo (opcional)</span>
            <input value={f.objective} onChange={(e) => set("objective", e.target.value)} placeholder="Bajar de peso, ganar masa…" className={campo} />
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-700">DNI (opcional)</span>
            <input value={f.dni} onChange={(e) => set("dni", e.target.value)} inputMode="numeric" className={campo} />
          </label>
          <label className="block text-sm">
            <span className="font-bold text-slate-700">Correo (opcional)</span>
            <input value={f.email} onChange={(e) => set("email", e.target.value)} type="email" className={campo} />
          </label>
        </div>

        {/* Cita de contacto */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" /> ¿Cuándo y cómo lo contactamos?
          </p>
          <div className="flex flex-wrap gap-2">
            {[...Object.entries(CONTACTO), ["", { label: "Sin cita", icono: X }]].map(([k, c]) => {
              const I = c.icono;
              return (
                <button
                  key={k || "no"}
                  type="button"
                  onClick={() => set("contactType", k)}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-bold flex items-center gap-1.5 cursor-pointer ${
                    f.contactType === k ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <I className="w-4 h-4" /> {c.label}
                </button>
              );
            })}
          </div>
          {f.contactType && (
            <>
              <SelectorDia valor={f.contactDate} onCambiar={(d) => set("contactDate", d)} />
              <label className="block text-sm max-w-[12rem]">
                <span className="font-bold text-slate-700">Hora</span>
                <input type="time" value={f.contactTime} onChange={(e) => set("contactTime", e.target.value)} className={campo} />
              </label>
              <p className="text-xs text-blue-800">🔔 El sistema te avisará 30 minutos antes.</p>
            </>
          )}
        </div>

        {nuevo && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-violet-800 flex items-center gap-1.5">
              <Ticket className="w-4 h-4" /> ¿Acepta un pase libre para venir a conocer el gimnasio?
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => elegirPase(true)} className={`px-3 py-1.5 rounded-xl border text-sm font-bold cursor-pointer ${aceptaPase ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-violet-200 text-violet-800 hover:bg-violet-50"}`}>
                ✅ Sí, generar su QR
              </button>
              <button type="button" onClick={() => elegirPase(false)} className={`px-3 py-1.5 rounded-xl border text-sm font-bold cursor-pointer ${!aceptaPase ? "bg-slate-700 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                ⏳ No, por ahora
              </button>
            </div>
            <p className="text-xs text-violet-900">
              {aceptaPase
                ? `Su pase será para el ${fCorta(f.contactDate || hoyISO())}${f.contactTime ? ` a las ${f.contactTime}` : ""} (el día y la hora de arriba). Si no viene, el sistema te avisará para reprogramarlo.`
                : "Solo se agenda el contacto. Cuando él lo confirme, genera su pase desde su ficha."}
            </p>
          </div>
        )}

        <label className="block text-sm">
          <span className="font-bold text-slate-700">Notas</span>
          <textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Ej. vino apurado, quiere entrenar en las mañanas" className={campo} />
        </label>
        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onCerrar} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
            Cancelar
          </button>
          <button disabled={guardando} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-black cursor-pointer">
            {guardando ? "Guardando…" : "Guardar prospecto"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------------------------------------------------------------------
// Enviar / descargar el QR del pase (imagen, PDF o WhatsApp)
// ---------------------------------------------------------------------
const datosTarjeta = (p) => ({
  texto: p.passCode,
  nombre: p.fullName,
  detalle: `Válido el ${fCorta(p.passDate)}${p.planName ? ` · ${p.planName}` : ""}`,
});
const nombreArchivo = (p, ext) => `pase-libre-${String(p.fullName).trim().split(/\s+/).slice(0, 2).join("-")}-${p.passCode}.${ext}`;

const AccionesPase = ({ p, gym, grande = false }) => {
  const { currentUser } = useGym();
  const [envio, setEnvio] = useState("");
  const btn = grande ? "px-4 py-2.5 rounded-xl text-sm" : "px-3 py-1.5 rounded-lg text-xs";
  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-2 ${grande ? "justify-center" : ""}`}>
        <button
          type="button"
          onClick={async () => {
            setEnvio("");
            const modo = await compartirTarjetaQR({ ...datosTarjeta(p), archivo: nombreArchivo(p, "png"), telefono: telWa(p.phone), mensaje: mensajeWhatsApp(p, gym, currentUser?.fullName) });
            setEnvio(
              modo === "copiado"
                ? "✅ QR copiado. En el chat de WhatsApp que se abrió, pega la imagen con Ctrl+V y envíala."
                : modo === "descargado"
                  ? "⬇ QR descargado. En el chat de WhatsApp que se abrió, adjunta la imagen descargada."
                  : modo === "compartido"
                    ? "✅ QR compartido."
                    : "",
            );
          }}
          className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer flex items-center gap-1.5`}
        >
          <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
        </button>
        <button type="button" onClick={() => descargarTarjetaQR({ ...datosTarjeta(p), archivo: nombreArchivo(p, "png") })} className={`${btn} bg-white border border-violet-300 hover:bg-violet-50 text-violet-800 font-bold cursor-pointer`}>
          ⬇ Imagen (foto)
        </button>
        <button type="button" onClick={() => descargarPdfQR({ ...datosTarjeta(p), archivo: nombreArchivo(p, "pdf") })} className={`${btn} bg-white border border-violet-300 hover:bg-violet-50 text-violet-800 font-bold cursor-pointer`}>
          ⬇ PDF
        </button>
      </div>
      {envio && <p className="text-xs font-bold text-emerald-700">{envio}</p>}
    </div>
  );
};

/** Se muestra al guardar un interesado nuevo: su QR listo para enviar */
const PaseGenerado = ({ p, gym, onVerFicha, onCerrar }) => (
  <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onCerrar}>
    <div className="bg-white rounded-3xl p-6 w-full max-w-md text-center space-y-3 text-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs font-black uppercase tracking-wider text-violet-700 flex items-center justify-center gap-1.5">
        <Ticket className="w-4 h-4" /> Pase libre generado
      </p>
      <h3 className="text-lg font-black">Este es el QR de {p.fullName}</h3>
      <div className="flex justify-center">
        <QrCodigo texto={p.passCode} tam={220} className="border-2 border-violet-200 shadow" />
      </div>
      <span className="inline-block px-5 py-2 rounded-xl border-2 border-dashed border-violet-400 font-mono font-black text-2xl tracking-widest text-violet-800">{p.passCode}</span>
      <p className="text-sm text-slate-600">
        Válido el <b>{fCorta(p.passDate)}</b>
        {p.contactDate === p.passDate && p.contactTime ? <> a las <b>{p.contactTime}</b></> : null}. Al llegar, recepción escanea el QR o escribe el código.
      </p>
      <AccionesPase p={p} gym={gym} grande />
      <p className="text-[11px] text-slate-400">También puedes tomarle una foto a esta pantalla.</p>
      <div className="flex justify-center gap-2 pt-2 border-t border-slate-100">
        <button type="button" onClick={onVerFicha} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">
          Ver ficha
        </button>
        <button type="button" onClick={onCerrar} className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-black cursor-pointer">
          Listo
        </button>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------
// Detalle del prospecto: acciones e historial
// ---------------------------------------------------------------------
const DetalleProspecto = ({ p, puedeEditar, puedeEliminar, gym, onCambio, onEditar, onMatricular, onCerrar, onEliminar }) => {
  const [hist, setHist] = useState([]);
  const [nota, setNota] = useState("");
  const [tipoNota, setTipoNota] = useState(p.contactType || "llamada");
  const [paseFecha, setPaseFecha] = useState(p.passDate && p.passDate >= hoyISO() ? p.passDate : hoyISO());
  const [paseHora, setPaseHora] = useState(p.contactTime || "16:00");
  const { currentUser } = useGym();
  const noVino = paseNoUsado(p);
  const [noConcretado, setNoConcretado] = useState(false);
  const [baja, setBaja] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS_BAJA[0]);
  const [error, setError] = useState("");
  const cargarHist = () => api(`/prospectos/${p.id}/seguimientos`).then(setHist).catch(() => {});
  useEffect(() => {
    cargarHist();
  }, [p.id, p.updatedAt]);

  const hacer = async (fn) => {
    setError("");
    try {
      onCambio(await fn());
    } catch (e) {
      setError(e.message);
    }
  };
  const cita = estadoCita(p);
  const E = ESTADOS_CRM[p.status];
  const abierto = !["matriculado", "de_baja"].includes(p.status);
  const wa = `https://wa.me/${telWa(p.phone)}?text=${encodeURIComponent(noVino ? mensajeReprogramar(p, gym, currentUser?.fullName) : mensajeWhatsApp(p, gym, currentUser?.fullName))}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto min-h-full bg-white p-6 space-y-4 text-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-400 text-white font-black text-xl flex items-center justify-center">
              {p.fullName.charAt(0)}
            </span>
            <div>
              <h3 className="text-lg font-black">{p.fullName}</h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-black ${E.chip}`}>{E.label}</span>
                <span className="text-xs text-slate-500">{ORIGENES[p.source]} · registrado {fCorta(p.createdAt)}{p.registeredBy ? ` por ${p.registeredBy}` : ""}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 p-3">
            <p className="text-[11px] font-black uppercase text-slate-400">Celular</p>
            <TelWhatsApp tel={p.phone} className="font-black text-base" />
            <div className="flex gap-2 mt-2">
              <a href={`tel:${p.phone}`} className="flex-1 px-2 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Llamar
              </a>
              <a href={wa} target="_blank" rel="noreferrer" className="flex-1 px-2 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-3">
            <p className="text-[11px] font-black uppercase text-slate-400">Le interesa</p>
            <p className="font-black text-slate-900">{p.planName || "Aún no sabe"}</p>
            {p.planPrice != null && <p className="text-xs text-slate-500">S/ {p.planPrice}</p>}
            {p.objective && <p className="text-xs text-slate-500 mt-1">Objetivo: {p.objective}</p>}
          </div>
          <div className={`rounded-2xl border p-3 ${cita ? "border-orange-200 bg-orange-50/50" : "border-slate-200"}`}>
            <p className="text-[11px] font-black uppercase text-slate-400">Próximo contacto</p>
            {p.contactDate ? (
              <>
                <p className="font-black text-slate-900">
                  {CONTACTO[p.contactType]?.label || "Contacto"} · {fCorta(p.contactDate)} {p.contactTime}
                </p>
                {cita && <span className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-[11px] font-black ${cita.tono}`}>{cita.texto}</span>}
              </>
            ) : (
              <p className="text-sm text-slate-500">Sin cita</p>
            )}
          </div>
        </div>
        {p.notes && <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">📝 {p.notes}</p>}

        {/* Pase libre */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-violet-800 flex items-center gap-1.5 mb-2">
            <Ticket className="w-4 h-4" /> Pase libre / invitación
          </p>
          {p.passCode ? (
            <div className="flex flex-wrap items-center gap-4">
              <QrCodigo texto={p.passCode} tam={132} className="border border-violet-200 shadow-sm" />
              <div className="space-y-2">
                <span className="inline-block px-4 py-2 rounded-xl bg-white border-2 border-dashed border-violet-400 font-mono font-black text-xl tracking-widest text-violet-800">{p.passCode}</span>
                <p className="text-sm text-slate-700">
                  Válido el <b>{fCorta(p.passDate)}</b>
                  {p.passUsedAt ? <span className="ml-1 text-emerald-700 font-bold">· usado el {String(p.passUsedAt).slice(0, 16).replace("T", " ")}</span> : <span className="ml-1 text-slate-500">· aún no lo usa</span>}
                </p>
                <AccionesPase p={p} gym={gym} />
                <p className="text-[11px] text-slate-500">En recepción se escanea con el lector o se escribe el código en el check-in.</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-2">Dale un día de prueba gratis: el código se muestra en recepción al llegar.</p>
          )}
          {noVino && (
            <p className="mt-3 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              ⚠️ No vino con su pase. Llámalo o escríbele y reprográmale el día para que no se pierda.
            </p>
          )}
          {puedeEditar && p.passCode && !p.passUsedAt && p.status === "pase_entregado" && !noConcretado && (
            <button type="button" onClick={() => setNoConcretado(true)} className="mt-3 px-3 py-2 rounded-xl bg-white border-2 border-rose-300 text-rose-700 hover:bg-rose-50 text-sm font-bold cursor-pointer">
              ✖ No vino / canceló: registrar motivo
            </button>
          )}
          {noConcretado && (
            <div className="mt-3">
              <PaseNoConcretado p={p} onCancelar={() => setNoConcretado(false)} onHecho={(nuevo) => (setNoConcretado(false), onCambio(nuevo))} />
            </div>
          )}
          {puedeEditar && abierto && !p.passUsedAt && (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-bold text-slate-600">{p.passCode ? "Reprogramar la visita" : "¿Qué día y a qué hora viene?"}</p>
              <SelectorDia valor={paseFecha} onCambiar={setPaseFecha} tono="violeta" />
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs font-bold text-slate-600">
                  Hora
                  <input type="time" value={paseHora} onChange={(e) => setPaseHora(e.target.value)} className="block mt-0.5 px-2 py-1.5 rounded-lg border border-violet-200 bg-white text-sm text-slate-800" />
                </label>
                <button type="button" onClick={() => hacer(() => api(`/prospectos/${p.id}/pase`, { method: "POST", body: { fecha: paseFecha, hora: paseHora } }))} className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" /> {p.passCode ? "Reprogramar pase" : "Generar pase libre"}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">El código se mantiene; solo cambia el día y la hora. Recibirás un aviso 30 minutos antes.</p>
            </div>
          )}
        </div>

        {/* Registrar contacto */}
        {puedeEditar && abierto && (
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-600">Registrar lo que pasó</p>
            <div className="flex flex-wrap gap-1.5">
              {[["llamada", "📞 Llamé"], ["whatsapp", "💬 Le escribí"], ["visita", "🚶 Vino"], ["nota", "📝 Nota"]].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setTipoNota(k)} className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer ${tipoNota === k ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Confirmó que viene el sábado a las 4 pm" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" />
              <button
                type="button"
                disabled={!nota.trim()}
                onClick={() => hacer(async () => { const r = await api(`/prospectos/${p.id}/seguimiento`, { method: "POST", body: { tipo: tipoNota, detalle: nota, cerrarRecordatorio: true } }); setNota(""); return r; })}
                className="px-4 py-2 rounded-xl bg-blue-600 disabled:opacity-50 text-white text-sm font-bold cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

        {/* Cerrar el caso */}
        {puedeEditar && (
          <div className="flex flex-wrap gap-2">
            {abierto && (
              <button type="button" onClick={onMatricular} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-black flex items-center gap-1.5 cursor-pointer shadow">
                <UserCheck className="w-4 h-4" /> Matricular ahora
              </button>
            )}
            {abierto && !baja && (
              <button type="button" onClick={() => setBaja(true)} className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-50">
                <UserX className="w-4 h-4" /> Dar de baja
              </button>
            )}
            {!abierto && (
              <button type="button" onClick={() => hacer(() => api(`/prospectos/${p.id}/estado`, { method: "POST", body: { estado: "seguimiento" } }))} className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-bold cursor-pointer hover:bg-slate-50">
                Reabrir seguimiento
              </button>
            )}
            <button type="button" onClick={onEditar} className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-bold flex items-center gap-1.5 cursor-pointer hover:bg-slate-50">
              <Pencil className="w-4 h-4" /> Editar datos / reagendar
            </button>
            {puedeEliminar && (
              <button type="button" onClick={onEliminar} className="ml-auto px-3 py-2.5 rounded-xl text-rose-600 text-sm font-bold flex items-center gap-1.5 cursor-pointer hover:bg-rose-50">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            )}
          </div>
        )}
        {baja && (
          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 space-y-2">
            <p className="text-sm font-bold">¿Por qué se da de baja?</p>
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS_BAJA.map((m) => (
                <button key={m} type="button" onClick={() => setMotivo(m)} className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer ${motivo === m ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" />
              <button type="button" onClick={() => hacer(async () => { const r = await api(`/prospectos/${p.id}/estado`, { method: "POST", body: { estado: "de_baja", motivo } }); setBaja(false); return r; })} className="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold cursor-pointer">
                Confirmar baja
              </button>
            </div>
          </div>
        )}
        {p.status === "de_baja" && p.dropReason && <p className="text-sm text-slate-600">Motivo de baja: <b>{p.dropReason}</b></p>}

        {/* Historial */}
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
            <History className="w-4 h-4" /> Historial
          </p>
          <ol className="relative border-l-2 border-slate-200 ml-2 space-y-3">
            {hist.map((h) => (
              <li key={h.id} className="ml-4">
                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                <p className="text-sm text-slate-800">{h.detail}</p>
                <p className="text-[11px] text-slate-400">
                  {String(h.date).slice(0, 16).replace("T", " ")} {h.by ? `· ${h.by}` : ""}
                </p>
              </li>
            ))}
            {!hist.length && <li className="ml-4 text-xs text-slate-400">Sin movimientos.</li>}
          </ol>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// Módulo principal
// ---------------------------------------------------------------------
export const CrmModule = () => {
  const { plans, currentUser, gymConfig } = useGym();
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("abiertos");
  const [form, setForm] = useState(null); // {} nuevo | prospecto
  const [abierto, setAbierto] = useState(null);
  const [paseNuevo, setPaseNuevo] = useState(null);
  const [vista, setVista] = useState("interesados");
  const [matricular, setMatricular] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [paseMsg, setPaseMsg] = useState(null);
  const [, setReloj] = useState(0);
  const puedeCrear = userCan(currentUser, "crm", "crear");
  const puedeEditar = userCan(currentUser, "crm", "editar");
  const puedeEliminar = userCan(currentUser, "crm", "eliminar");
  const gym = gymConfig?.gym_nombre || "RADICAL";

  const cargar = () =>
    api("/prospectos")
      .then((l) => (setLista(l), setError("")))
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  useEffect(() => {
    cargar();
    const t = setInterval(() => setReloj((x) => x + 1), 30000);
    const r = () => cargar();
    window.addEventListener("radical:crm", r);
    return () => (clearInterval(t), window.removeEventListener("radical:crm", r));
  }, []);
  // Un aviso (p. ej. "no vino con su pase") pide abrir la ficha de un interesado
  useEffect(() => {
    const abrir = (e) => {
      const id = String(e.detail || "");
      api("/prospectos")
        .then((l) => {
          setLista(l);
          const p = l.find((x) => x.id === id);
          if (p) setAbierto(p);
        })
        .catch(() => {});
    };
    window.addEventListener("radical:crm-abrir", abrir);
    const pendiente = sessionStorage.getItem("radical_crm_abrir");
    if (pendiente) {
      sessionStorage.removeItem("radical_crm_abrir");
      abrir({ detail: pendiente });
    }
    return () => window.removeEventListener("radical:crm-abrir", abrir);
  }, []);

  const actualizar = (p) => {
    setLista((l) => (l.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? p : x)) : [p, ...l]));
    if (abierto?.id === p.id) setAbierto(p);
    window.dispatchEvent(new Event("radical:crm-cambio"));
  };

  const mes = hoyISO().slice(0, 7);
  const kpis = useMemo(() => {
    const c = (fn) => lista.filter(fn).length;
    const cerrados = c((p) => ["matriculado", "de_baja"].includes(p.status));
    const matric = c((p) => p.status === "matriculado");
    return {
      abiertos: c((p) => !["matriculado", "de_baja"].includes(p.status)),
      hoy: c((p) => p.contactDate === hoyISO() && !["matriculado", "de_baja"].includes(p.status)),
      pases: c((p) => p.status === "pase_entregado"),
      matricMes: c((p) => p.status === "matriculado" && String(p.updatedAt).slice(0, 7) === mes),
      conversion: cerrados ? Math.round((matric / cerrados) * 100) : 0,
      bajas: c((p) => p.status === "de_baja"),
    };
  }, [lista, mes]);

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((p) => {
      if (filtro === "abiertos" && ["matriculado", "de_baja"].includes(p.status)) return false;
      if (filtro === "hoy" && !(p.contactDate === hoyISO() && !["matriculado", "de_baja"].includes(p.status))) return false;
      if (filtro === "no_vino" && !paseNoUsado(p)) return false;
      if (!["abiertos", "hoy", "todos", "no_vino"].includes(filtro) && p.status !== filtro) return false;
      return !q || p.fullName.toLowerCase().includes(q) || String(p.phone).includes(q) || (p.passCode || "").toLowerCase().includes(q);
    });
  }, [lista, busca, filtro]);

  const agendaHoy = lista
    .filter((p) => p.contactDate === hoyISO() && p.contactTime && !["matriculado", "de_baja"].includes(p.status))
    .sort((a, b) => a.contactTime.localeCompare(b.contactTime));

  const guardarForm = async (datos, pase) => {
    let p = datos.id ? await api(`/prospectos/${datos.id}`, { method: "PUT", body: datos }) : await api("/prospectos", { method: "POST", body: datos });
    if (pase) {
      // Pase libre desde el mismo formulario: se abre su ficha con el QR listo para enviar
      try {
        p = await api(`/prospectos/${p.id}/pase`, { method: "POST", body: pase });
      } catch (e) {
        setError(`Se guardó el prospecto, pero no se pudo generar el pase: ${e.message}`);
      }
      if (p.passCode) setPaseNuevo(p);
    }
    actualizar(p);
    setForm(null);
  };

  const [camara, setCamara] = useState(false);
  const validarPase = async (e, leido) => {
    e?.preventDefault?.();
    setPaseMsg(null);
    try {
      const p = await api("/prospectos/pase/validar", { method: "POST", body: { codigo: leido || codigo } });
      actualizar(p);
      setPaseMsg({ ok: true, texto: `🎟️ PASE LIBRE VÁLIDO: ${p.fullName} puede entrar hoy a probar las instalaciones.` });
      setCodigo("");
    } catch (er) {
      setPaseMsg({ ok: false, texto: er.message });
    }
  };

  const FILTROS = [
    ["abiertos", "Por atender", kpis.abiertos],
    ["hoy", "Contactar hoy", kpis.hoy],
    ["nuevo", "Nuevos"],
    ["seguimiento", "En seguimiento"],
    ["pase_entregado", "Con pase libre"],
    ["no_vino", "⚠️ No vinieron", lista.filter(paseNoUsado).length],
    ["matriculado", "Matriculados"],
    ["de_baja", "De baja"],
    ["todos", "Todos", lista.length],
  ];

  return (
    <div className="space-y-4">
      {/* Portada */}
      <div className="rd-portada rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> CRM · Prospectos
          </span>
          <h1 className="text-2xl font-black mt-1">Interesados que vinieron a preguntar</h1>
          <p className="text-sm text-slate-300 mt-0.5">Anota su celular, el plan que le interesa y cuándo contactarlo. Te avisamos 30 minutos antes.</p>
        </div>
        {puedeCrear && (
          <button type="button" onClick={() => setForm({})} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 text-marino-950 text-sm font-black rd-brillo cursor-pointer flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Nuevo interesado
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap gap-2">
        {[
          ["interesados", "👥 Interesados"],
          ["pases", "🎟️ Pases libres"],
          ["reporte", "📊 Reporte"],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setVista(k)}
            className={`px-4 py-2 rounded-xl text-sm font-black border cursor-pointer ${vista === k ? "bg-blue-600 border-blue-600 text-white shadow" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {vista === "pases" && (
        <PanelPases
          gym={gym}
          onAbrirProspecto={(id) => {
            const p = lista.find((x) => x.id === id);
            if (p) setAbierto(p);
          }}
        />
      )}
      {vista === "reporte" && <ReporteCrm />}

      {vista === "interesados" && (
      <>
      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["Por atender", kpis.abiertos, "bg-sky-50 border-sky-200 text-sky-900"],
          ["Contactar hoy", kpis.hoy, "bg-orange-50 border-orange-200 text-orange-900"],
          ["Con pase libre", kpis.pases, "bg-violet-50 border-violet-200 text-violet-900"],
          ["Matriculados este mes", kpis.matricMes, "bg-emerald-50 border-emerald-200 text-emerald-900"],
          ["Conversión", `${kpis.conversion}%`, "bg-blue-50 border-blue-200 text-blue-900"],
        ].map(([l, v, c]) => (
          <div key={l} className={`rd-aparece rounded-2xl border p-4 ${c}`}>
            <p className="text-[11px] font-black uppercase tracking-wider opacity-80">{l}</p>
            <p className="text-2xl font-black mt-0.5">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Agenda de hoy + validar pase */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-orange-500" /> Agenda de hoy
            </p>
            {agendaHoy.length === 0 && <p className="text-sm text-slate-400">No hay contactos pendientes para hoy.</p>}
            <ol className="space-y-2">
              {agendaHoy.map((p) => {
                const c = estadoCita(p);
                const I = CONTACTO[p.contactType]?.icono || Phone;
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => setAbierto(p)} className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                      <span className="w-14 text-center font-black text-slate-900">{p.contactTime}</span>
                      <I className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <b className="block truncate text-sm">{p.fullName}</b>
                        <span className="text-xs text-slate-500">{p.planName || "Sin plan elegido"}</span>
                      </span>
                      {c && <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${c.tono}`}>{c.texto}</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <form onSubmit={validarPase} className="bg-white rounded-2xl border border-violet-200 p-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-violet-800 flex items-center gap-1.5">
              <Ticket className="w-4 h-4" /> Validar pase libre
            </p>
            <div className="flex gap-2">
              <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Ej. DAVID-K7Q2M" className="flex-1 px-3 py-2 rounded-xl border border-violet-200 text-sm font-mono font-bold tracking-wider" />
              <button disabled={!codigo.trim()} className="px-4 py-2 rounded-xl bg-violet-600 disabled:opacity-50 text-white text-sm font-bold cursor-pointer">
                Validar
              </button>
            </div>
            {camaraQRDisponible() && (
              <button type="button" onClick={() => setCamara(true)} className="w-full py-1.5 rounded-xl border border-violet-300 text-violet-800 text-xs font-bold cursor-pointer hover:bg-violet-50">
                📷 Escanear QR con la cámara
              </button>
            )}
            <p className="text-[11px] text-slate-500">Con el lector USB: haz clic en el recuadro y escanea; el código se valida solo.</p>
            {camara && (
              <EscanerQR
                onCerrar={() => setCamara(false)}
                onLeido={(t) => {
                  setCamara(false);
                  setCodigo(String(t).toUpperCase());
                  validarPase(null, String(t).toUpperCase());
                }}
              />
            )}
            {paseMsg && <p className={`text-sm font-bold ${paseMsg.ok ? "text-emerald-700" : "text-rose-600"}`}>{paseMsg.texto}</p>}
          </form>
        </div>

        {/* Lista */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nombre, celular o código de pase" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTROS.map(([k, l, n]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFiltro(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer flex items-center gap-1.5 ${
                  filtro === k ? "bg-blue-600 border-blue-600 text-white shadow" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {ESTADOS_CRM[k] && <span className={`w-1.5 h-1.5 rounded-full ${filtro === k ? "bg-white" : ESTADOS_CRM[k].punto}`} />}
                {l}
                {n != null && <span className={`px-1.5 rounded-full text-[10px] ${filtro === k ? "bg-white/25" : "bg-slate-100"}`}>{n}</span>}
              </button>
            ))}
          </div>
          {error && (
            <p className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}
          {cargando && <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />}
          {!cargando && visibles.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <Contact className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay prospectos en esta vista.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibles.map((p) => {
              const E = ESTADOS_CRM[p.status];
              const c = estadoCita(p);
              const I = CONTACTO[p.contactType]?.icono;
              return (
                <button key={p.id} type="button" onClick={() => setAbierto(p)} className="rd-levanta text-left rounded-2xl border border-slate-200 bg-white p-3.5 cursor-pointer space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center shrink-0">{p.fullName.charAt(0)}</span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-slate-900">{p.fullName}</b>
                      <span className="text-xs text-slate-500">
                        <TelWhatsApp tel={p.phone} /> · {p.planName || "plan por definir"}
                      </span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black whitespace-nowrap ${E.chip}`}>{E.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {paseNoUsado(p) && <span className="px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 font-black">⚠️ No vino · reprogramar</span>}
                    {p.contactDate && I && !["matriculado", "de_baja"].includes(p.status) && (
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <I className="w-3.5 h-3.5" /> {fCorta(p.contactDate)} {p.contactTime}
                      </span>
                    )}
                    {c && <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${c.tono}`}>{c.texto}</span>}
                    {p.passCode && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 font-mono text-[10px] font-black">
                        {p.passCode} {p.passUsedAt ? "✓" : ""}
                      </span>
                    )}
                    {p.status === "matriculado" && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Seguimiento conseguido
                      </span>
                    )}
                    {p.status === "de_baja" && p.dropReason && <span className="text-slate-500">{p.dropReason}</span>}
                    <span className="ml-auto text-[10px] text-slate-400">{p.followUps} mov.</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </>
      )}

      {form && (
        <FormularioProspecto
          inicial={form.id ? form : null}
          planes={plans}
          onGuardar={guardarForm}
          onCerrar={() => setForm(null)}
        />
      )}
      {paseNuevo && (
        <PaseGenerado
          p={paseNuevo}
          gym={gym}
          onVerFicha={() => (setAbierto(paseNuevo), setPaseNuevo(null))}
          onCerrar={() => setPaseNuevo(null)}
        />
      )}
      {abierto && !form && !matricular && (
        <DetalleProspecto
          p={abierto}
          gym={gym}
          puedeEditar={puedeEditar}
          puedeEliminar={puedeEliminar}
          onCambio={actualizar}
          onEditar={() => setForm(abierto)}
          onMatricular={() => setMatricular(abierto)}
          onCerrar={() => setAbierto(null)}
          onEliminar={async () => {
            if (!window.confirm(`¿Eliminar a ${abierto.fullName} del CRM?`)) return;
            await api(`/prospectos/${abierto.id}`, { method: "DELETE" });
            setLista((l) => l.filter((x) => x.id !== abierto.id));
            setAbierto(null);
          }}
        />
      )}
      {matricular && (
        <NewMemberModal
          isOpen
          inicial={{ fullName: matricular.fullName, phone: matricular.phone, dni: matricular.dni, email: matricular.email, planId: matricular.planId, notes: matricular.notes }}
          onClose={() => setMatricular(null)}
          onCreado={async (nuevo) => {
            try {
              actualizar(await api(`/prospectos/${matricular.id}/estado`, { method: "POST", body: { estado: "matriculado", memberId: nuevo.id } }));
            } catch (e) {
              setError(e.message);
            }
          }}
        />
      )}
    </div>
  );
};
