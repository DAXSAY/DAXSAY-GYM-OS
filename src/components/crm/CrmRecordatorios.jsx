// Avisos del CRM (tarjetas abajo a la derecha, en cualquier pantalla):
//  1) 30 minutos antes de la hora pactada con un interesado (llamar, escribir
//     o recibir su visita), con notificación del navegador si se permitió.
//  2) Cuando un interesado NO vino con su pase libre: recordar llamarlo y
//     reprogramarle la visita para que no se pierda.
import React, { useEffect, useRef, useState } from "react";
import { BellRing, Phone, MessageCircle, Footprints, X, Check, CalendarClock, AlertTriangle, Ticket } from "lucide-react";
import { api } from "../../api/cliente";
import { useGym } from "../../context/GymContext";
import { mensajeWhatsApp, mensajeReprogramar } from "./CrmModule";
import { enlaceWhatsApp } from "../common/TelWhatsApp";

const ICONO = { llamada: Phone, whatsapp: MessageCircle, visita: Footprints };
const ACCION = { llamada: "llamar a", whatsapp: "escribir por WhatsApp a", visita: "recibir la visita de" };
const fCorta = (iso) => (iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "");

const notificar = (titulo, cuerpo) => {
  try {
    if ("Notification" in window && Notification.permission === "granted") new Notification(titulo, { body: cuerpo, icon: "/logo-radical.png" });
  } catch {
    /* sin notificaciones */
  }
};

export const CrmRecordatorios = ({ onAbrir }) => {
  const { gymConfig, currentUser } = useGym();
  const gym = gymConfig?.gym_nombre || "RADICAL";
  const quien = currentUser?.fullName || "";
  const [avisos, setAvisos] = useState([]);
  const [noVinieron, setNoVinieron] = useState([]);
  const notificados = useRef(new Set());
  const ocultos = useRef(new Set());

  useEffect(() => {
    let vivo = true;
    const revisar = () => {
      api("/prospectos/recordatorios")
        .then((l) => {
          if (!vivo) return;
          const nuevos = l.filter((p) => !ocultos.current.has(`${p.id}-${p.contactDate}-${p.contactTime}`));
          setAvisos(nuevos);
          nuevos.forEach((p) => {
            const k = `${p.id}-${p.contactDate}-${p.contactTime}`;
            if (notificados.current.has(k)) return;
            notificados.current.add(k);
            notificar(
              p.contactType === "visita" && p.passCode ? `RADICAL · Pase libre de ${p.fullName}` : "RADICAL · Recordatorio de prospecto",
              p.contactType === "visita" && p.passCode
                ? `A las ${p.contactTime} viene ${p.fullName} con su pase ${p.passCode}.`
                : `A las ${p.contactTime}: ${ACCION[p.contactType] || "contactar a"} ${p.fullName}${p.planName ? ` · plan ${p.planName}` : ""}`,
            );
          });
        })
        .catch(() => {});
      api("/prospectos/pases-sin-usar")
        .then((l) => {
          if (!vivo) return;
          const nuevos = l.filter((p) => !ocultos.current.has(`nv-${p.id}-${p.passDate}`));
          setNoVinieron(nuevos);
          nuevos.forEach((p) => {
            const k = `nv-${p.id}-${p.passDate}`;
            if (notificados.current.has(k)) return;
            notificados.current.add(k);
            notificar(`RADICAL · ${p.fullName} no vino con su pase`, `Pase ${p.passCode} del ${fCorta(p.passDate)}${p.contactTime ? ` a las ${p.contactTime}` : ""}. Llámalo y reprográmale el pase.`);
          });
        })
        .catch(() => {});
    };
    revisar();
    try {
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    } catch {
      /* nada */
    }
    const t = setInterval(revisar, 60000);
    window.addEventListener("radical:crm-cambio", revisar);
    return () => {
      vivo = false;
      clearInterval(t);
      window.removeEventListener("radical:crm-cambio", revisar);
    };
  }, []);

  if (!avisos.length && !noVinieron.length) return null;

  const abrirFicha = (p) => {
    try {
      sessionStorage.setItem("radical_crm_abrir", p.id);
    } catch {
      /* nada */
    }
    onAbrir?.(p);
    window.dispatchEvent(new CustomEvent("radical:crm-abrir", { detail: p.id }));
  };
  const listo = async (p) => {
    ocultos.current.add(`${p.id}-${p.contactDate}-${p.contactTime}`);
    setAvisos((a) => a.filter((x) => x.id !== p.id));
    try {
      await api(`/prospectos/${p.id}/recordatorio-visto`, { method: "POST" });
      window.dispatchEvent(new Event("radical:crm"));
    } catch {
      /* se reintenta en el próximo aviso */
    }
  };
  const ocultar = (p) => {
    ocultos.current.add(`${p.id}-${p.contactDate}-${p.contactTime}`);
    setAvisos((a) => a.filter((x) => x.id !== p.id));
  };
  const ocultarNoVino = (p) => {
    ocultos.current.add(`nv-${p.id}-${p.passDate}`);
    setNoVinieron((a) => a.filter((x) => x.id !== p.id));
  };
  // Si ya pasó la hora y no vino, manda el aviso de "no vino" (no el de la cita)
  const idsNoVino = new Set(noVinieron.map((p) => p.id));
  const avisosCita = avisos.filter((p) => !idsNoVino.has(p.id));
  const tarjetasNoVino = noVinieron;

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-2 w-[22rem] max-w-[calc(100vw-2rem)]">
      {avisosCita.slice(0, 3).map((p) => {
        const I = ICONO[p.contactType] || Phone;
        const conPase = p.contactType === "visita" && p.passCode;
        return (
          <div key={p.id} className="rd-aparece bg-white rounded-2xl border-2 border-orange-300 shadow-2xl overflow-hidden">
            <div className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                {conPase ? <Ticket className="w-4 h-4 animate-bounce" /> : <BellRing className="w-4 h-4 animate-bounce" />}
                {conPase ? `Pase libre de ${String(p.fullName).split(" ")[0]} · ${p.contactTime}` : `Recordatorio · ${p.contactTime}`}
              </span>
              <button type="button" onClick={() => ocultar(p)} title="Ocultar por ahora" className="p-0.5 rounded hover:bg-white/20 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3.5 space-y-2.5">
              {conPase ? (
                <p className="text-sm text-slate-800">
                  A las <b>{p.contactTime}</b> viene <b>{p.fullName}</b> con su pase libre{" "}
                  <span className="font-mono font-black text-violet-700">{p.passCode}</span>
                  {p.planName ? <> · le interesa el plan <b>{p.planName}</b></> : null}. Recíbelo en recepción y valida su QR.
                </p>
              ) : (
                <p className="text-sm text-slate-800">
                  Recuerda <b>{ACCION[p.contactType] || "contactar a"} {p.fullName}</b> a las <b>{p.contactTime}</b>
                  {p.planName ? <> · le interesa el plan <b>{p.planName}</b></> : null}.
                  {!p.passCode && <span className="block mt-1 text-xs text-violet-700 font-bold">Si acepta venir, genérale su pase libre desde la ficha.</span>}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {p.contactType === "whatsapp" ? (
                  <a href={enlaceWhatsApp(p.phone, mensajeWhatsApp(p, gym, quien))} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                    <I className="w-3.5 h-3.5" /> Escribir
                  </a>
                ) : (
                  <a href={`tel:${p.phone}`} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Llamar
                  </a>
                )}
                {!p.passCode ? (
                  <button type="button" onClick={() => abrirFicha(p)} className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" /> Generar pase
                  </button>
                ) : (
                  <button type="button" onClick={() => abrirFicha(p)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">
                    Ver ficha
                  </button>
                )}
                <button type="button" onClick={() => listo(p)} className="ml-auto px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer">
                  <Check className="w-3.5 h-3.5" /> Listo
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {tarjetasNoVino.slice(0, Math.max(1, 3 - Math.min(avisosCita.length, 3))).map((p) => (
        <div key={`nv-${p.id}`} className="rd-aparece bg-white rounded-2xl border-2 border-rose-300 shadow-2xl overflow-hidden">
          <div className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-pink-500 text-white flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> No vino con su pase
            </span>
            <button type="button" onClick={() => ocultarNoVino(p)} title="Ocultar por ahora" className="p-0.5 rounded hover:bg-white/20 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3.5 space-y-2.5">
            <p className="text-sm text-slate-800">
              <b>{p.fullName}</b> (pase <span className="font-mono font-black text-violet-700">{p.passCode}</span>) dijo que vendría el <b>{fCorta(p.passDate)}</b>
              {p.contactDate === p.passDate && p.contactTime ? <> a las <b>{p.contactTime}</b></> : null} y no vino. No olvides llamarlo y
              reprogramar su pase para que no se pierda.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <a href={`tel:${p.phone}`} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Llamar
              </a>
              <a href={enlaceWhatsApp(p.phone, mensajeReprogramar(p, gym, quien))} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <button type="button" onClick={() => (setNoVinieron((l) => l.filter((x) => x.id !== p.id)), abrirFicha(p))} className="ml-auto px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
                <CalendarClock className="w-3.5 h-3.5" /> Reprogramar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
