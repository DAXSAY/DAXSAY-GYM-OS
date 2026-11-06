import React, { useState } from "react";
import {
  BellRing,
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  Send,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Sliders,
  Check,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import { TelWhatsApp } from "../common/TelWhatsApp";
import { userCan } from "../../config/roles";
import confetti from "canvas-confetti";
import { hoyISO } from "../../utils/fecha";
import { PanelAlertasAdmin } from "../alerts/AlertasAdmin";
import { MensajesCategorias } from "./MensajesCategorias";

// Color y emoji de cada tipo de regla
const ESTILOS_REGLA = {
  fidelizacion: { emoji: "🎂", barra: "from-pink-500 to-orange-400", icono: "bg-pink-50 text-pink-600", chip: "bg-pink-100 text-pink-700" },
  especial: { emoji: "✨", barra: "from-violet-500 to-fuchsia-500", icono: "bg-violet-50 text-violet-600", chip: "bg-violet-100 text-violet-700" },
  clases: { emoji: "⏰", barra: "from-emerald-500 to-teal-400", icono: "bg-emerald-50 text-emerald-600", chip: "bg-emerald-100 text-emerald-700" },
  critico: { emoji: "⚠️", barra: "from-rose-500 to-amber-400", icono: "bg-rose-50 text-rose-600", chip: "bg-rose-100 text-rose-700" },
  preventivo: { emoji: "📅", barra: "from-amber-400 to-yellow-300", icono: "bg-amber-50 text-amber-600", chip: "bg-amber-100 text-amber-800" },
  vencido: { emoji: "⛔", barra: "from-rose-600 to-rose-400", icono: "bg-rose-50 text-rose-600", chip: "bg-rose-100 text-rose-700" },
  promocion: { emoji: "🎁", barra: "from-orange-500 to-amber-400", icono: "bg-orange-50 text-orange-600", chip: "bg-orange-100 text-orange-700" },
};
const estiloRegla = (tag) => {
  const k = String(tag || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const clave = Object.keys(ESTILOS_REGLA).find((x) => k.includes(x)) || (k.includes("renov") ? "critico" : k.includes("promo") ? "promocion" : "");
  return ESTILOS_REGLA[clave] || { emoji: "🔔", barra: "from-blue-500 to-cyan-400", icono: "bg-blue-50 text-blue-600", chip: "bg-blue-100 text-blue-700" };
};
// Resalta {{variables}} como etiquetas de color
const conVariables = (texto) =>
  String(texto || "")
    .split(/(\{\{[^}]+\}\})/g)
    .map((parte, i) =>
      /^\{\{/.test(parte) ? (
        <span key={i} className="inline-block mx-0.5 px-1.5 rounded-md bg-blue-100 text-blue-800 text-[12px] font-bold">
          {parte.slice(2, -2).replace(/_/g, " ")}
        </span>
      ) : (
        parte
      ),
    );

export const NotificationCenter = () => {
  const {
    currentUser,
    notificationRules,
    notificationLogs,
    classes,
    renewalAlerts,
    members,
    updateNotificationRule,
    toggleNotificationRule,
    sendDirectNotification,
    sendManualCampaign,
    triggerRealWebNotification,
    addClassNotice,
    deleteClassNotice,
    renewMembership,
    clearNotificationLogs,
  } = useGym();

  const [activeTab, setActiveTab] = useState("mensajes");
  const [verCongelados, setVerCongelados] = useState(false);
  // Las reglas automáticas solo las configura quien puede editar avisos (admin)
  const puedeEditarReglas = userCan(currentUser, "alerts", "editar");

  // Rule editing modal
  const [editingRule, setEditingRule] = useState(null);
  const [ruleTemplateTitle, setRuleTemplateTitle] = useState("");
  const [ruleTemplateBody, setRuleTemplateBody] = useState("");
  const [ruleChannels, setRuleChannels] = useState([]);
  const [ruleDaysOffset, setRuleDaysOffset] = useState(3);
  const [ruleTimingStr, setRuleTimingStr] = useState("");

  // Campaign builder state
  const [campTitle, setCampTitle] = useState("");
  const [campCategory, setCampCategory] = useState("special_promo");
  const [campAudience, setCampAudience] = useState("all");
  const [campChannels, setCampChannels] = useState(["push", "whatsapp"]);
  const [campMessage, setCampMessage] = useState(
    "¡Hola {{nombre}}! 🌟 Aprovecha esta semana un 20% de descuento en suplementos deportivos y renueva tu plan {{plan}} al mejor precio en recepción.",
  );
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);

  // Class Notice modal
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassInstructor, setNewClassInstructor] = useState("");
  const [newClassSchedule, setNewClassSchedule] = useState("");
  const [newClassRoom, setNewClassRoom] = useState("Sala Principal");
  const [newClassCapacity, setNewClassCapacity] = useState(25);
  const [newClassDate, setNewClassDate] = useState(hoyISO());

  // Alert filter
  const [alertFilter, setAlertFilter] = useState("all");
  const [alertSearch, setAlertSearch] = useState("");

  // Log filter
  const [logChannelFilter, setLogChannelFilter] = useState("all");
  const [viewingLogMessage, setViewingLogMessage] = useState(null);

  // Request browser push permission helper
  const handleRequestPushPermission = async () => {
    const granted = await triggerRealWebNotification(
      "RADICAL - Notificaciones Activas",
      "¡Has habilitado las notificaciones push en tiempo real en tu navegador!",
    );
    if (granted) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.2 } });
    }
  };

  const handleOpenEditRule = (rule) => {
    setEditingRule(rule);
    setRuleTemplateTitle(rule.templateTitle);
    setRuleTemplateBody(rule.templateBody);
    setRuleChannels(rule.channels);
    setRuleDaysOffset(rule.timingValueDays);
    setRuleTimingStr(rule.triggerTiming);
  };

  const handleSaveRule = (e) => {
    e.preventDefault();
    if (!editingRule) return;

    updateNotificationRule(editingRule.id, {
      templateTitle: ruleTemplateTitle,
      templateBody: ruleTemplateBody,
      channels: ruleChannels,
      timingValueDays: ruleDaysOffset,
      triggerTiming:
        ruleTimingStr || `${ruleDaysOffset} días antes del vencimiento`,
    });

    setEditingRule(null);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 } });
  };

  const handleToggleChannelInRule = (channel) => {
    if (ruleChannels.includes(channel)) {
      if (ruleChannels.length === 1) return; // keep at least 1
      setRuleChannels(ruleChannels.filter((c) => c !== channel));
    } else {
      setRuleChannels([...ruleChannels, channel]);
    }
  };

  const handleToggleChannelInCampaign = (channel) => {
    if (campChannels.includes(channel)) {
      if (campChannels.length === 1) return;
      setCampChannels(campChannels.filter((c) => c !== channel));
    } else {
      setCampChannels([...campChannels, channel]);
    }
  };

  // Launch campaign
  const handleSendCampaign = (e) => {
    e.preventDefault();
    if (!campTitle.trim() || !campMessage.trim()) return;

    setIsSendingCampaign(true);
    setTimeout(() => {
      const count = sendManualCampaign({
        title: campTitle.trim(),
        message: campMessage.trim(),
        category: campCategory,
        targetAudience: campAudience,
        channels: campChannels,
      });

      setIsSendingCampaign(false);
      confetti({ particleCount: 60, spread: 75, origin: { y: 0.5 } });
      alert(
        `¡Campaña enviada exitosamente a ${count} socios por [${campChannels.join(", ")}]!`,
      );
      setActiveTab("logs");
    }, 350);
  };

  // Send single direct notification to student
  const handleSendDirect = (alert, channel) => {
    const member = members.find((m) => m.id === alert.memberId);
    if (!member) return;

    const title = alert.isExpired
      ? "⚠️ Membresía Vencida - RADICAL"
      : "⏰ Recordatorio de Renovación de Membresía";
    const msg = alert.isExpired
      ? `Hola ${member.fullName}, tu membresía de ${member.planName} venció el ${member.membershipEndDate}. ¡Renueva hoy en RADICAL y mantén tu disciplina!`
      : `Hola ${member.fullName}, tu membresía de ${member.planName} vencerá el ${member.membershipEndDate} (${alert.daysLeft} días restantes). ¡Te esperamos en recepción para renovar!`;

    sendDirectNotification(
      member.id,
      member.fullName,
      title,
      msg,
      "renewal_reminder",
      channel,
      member.phone,
      member.email,
    );

    if (channel === "whatsapp") {
      const cleanPhone = member.phone.replace(/\D/g, "");
      const encoded = encodeURIComponent(msg);
      window.open(
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`,
        "_blank",
      );
    }

    confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
  };

  // Send class notice broadcast
  const handleBroadcastClassNotice = (cls) => {
    const title = `🥊 Recordatorio de Clase: ${cls.name}`;
    const msg = `¡Hola socio! Te recordamos tu clase de ${cls.name} con ${cls.instructorName} en ${cls.room} (${cls.schedule}). ¡Llega 10 min antes con tu hidratación!`;

    let sent = 0;
    const targetMembers = members.slice(0, 8);

    targetMembers.forEach((m) => {
      sendDirectNotification(
        m.id,
        m.fullName,
        title,
        msg,
        "class_notice",
        "push",
      );
      sendDirectNotification(
        m.id,
        m.fullName,
        title,
        msg,
        "class_notice",
        "email",
        undefined,
        m.email,
      );
      sent++;
    });

    confetti({ particleCount: 45, spread: 60, origin: { y: 0.4 } });
    alert(
      `¡Aviso de clase enviado a ${sent} alumnos inscritos vía Push y Email!`,
    );
  };

  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassInstructor.trim()) return;

    addClassNotice({
      name: newClassName.trim(),
      instructorName: newClassInstructor.trim(),
      schedule:
        newClassSchedule.trim() || "Lunes a Viernes 07:00 AM - 08:00 AM",
      room: newClassRoom,
      registeredCount: 0,
      capacity: newClassCapacity,
      date: newClassDate || hoyISO(),
    });

    setNewClassName("");
    setNewClassInstructor("");
    setNewClassSchedule("");
    setIsNewClassModalOpen(false);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  // Filtered alerts
  const filteredAlerts = renewalAlerts.filter((a) => {
    if (alertFilter === "expired" && !a.isExpired) return false;
    if (alertFilter === "urgent" && (a.isExpired || a.daysLeft > 3))
      return false;
    if (alertFilter === "warning" && (a.isExpired || a.daysLeft <= 3))
      return false;

    const term = alertSearch.toLowerCase();
    return (
      a.memberName.toLowerCase().includes(term) ||
      a.phone.includes(term) ||
      a.planName.toLowerCase().includes(term)
    );
  });

  // Filtered logs
  const filteredLogs = notificationLogs.filter((log) => {
    if (logChannelFilter === "all") return true;
    return log.channel === logChannelFilter;
  });

  const getChannelBadge = (ch) => {
    switch (ch) {
      case "whatsapp":
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-bold flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </span>
        );
      case "email":
        return (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold flex items-center gap-1">
            <Mail className="w-3 h-3" /> Email
          </span>
        );
      case "push":
        return (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-bold flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> Push Web
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-gray-50 text-gray-700 border border-gray-200 rounded text-xs font-bold flex items-center gap-1">
            {ch}
          </span>
        );
    }
  };

  // Congelamientos en curso o programados (para recepción: quién vuelve y quién deja de venir)
  const congelados = members
    .filter((m) => m.freeze?.current)
    .sort((a, b) => (a.freeze.current.status === "activo" ? a.freeze.current.returnDate : a.freeze.current.startDate).localeCompare(
      b.freeze.current.status === "activo" ? b.freeze.current.returnDate : b.freeze.current.startDate,
    ));
  const fCorta = (f) => (f ? String(f).slice(0, 10).split("-").reverse().join("/") : "");

  return (
    <div className="space-y-4">
      {/* Top Banner / System Summary */}
      <div className="rd-portada p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-0.5">
            <BellRing className="w-3.5 h-3.5" />
            <span>Sistema Multicanal de Notificaciones & Automatizaciones</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            Centro de Notificaciones, Alertas de Renovación y Avisos de Clases
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configuración por el administrador para recordatorios automáticos de
            vencimiento, avisos de clases grupales y promociones especiales con
            envío por Push, Email y WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRequestPushPermission}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-semibold rounded-md border border-gray-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            title="Activar permisos de notificaciones push en el navegador"
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
            <span>Probar Push Web</span>
          </button>

          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-md">
            {renewalAlerts.length} Alertas Activas
          </span>
        </div>
      </div>

      {currentUser?.role === "admin" && <PanelAlertasAdmin />}
      {congelados.length > 0 && (
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-sky-800 flex items-center gap-2">
              ❄️ Congelamientos
              <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white normal-case tracking-normal">{congelados.filter((m) => m.freeze.current.status === "activo").length} congelados hoy</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white normal-case tracking-normal">{congelados.filter((m) => m.freeze.current.status !== "activo").length} programados</span>
            </p>
            {congelados.length > 8 && (
              <button type="button" onClick={() => setVerCongelados((v) => !v)} className="text-xs font-bold text-sky-700 hover:underline cursor-pointer">
                {verCongelados ? "Ver menos" : `Ver todos (${congelados.length})`}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {congelados.slice(0, verCongelados ? 60 : 8).map((m) => {
              const c = m.freeze.current;
              const activo = c.status === "activo";
              return (
                <a
                  key={m.id}
                  href={`https://wa.me/${String(m.phone || "").replace(/\D/g, "").replace(/^(9\d{8})$/, "51$1")}?text=${encodeURIComponent(
                    activo
                      ? `Hola ${m.fullName.split(" ")[0]}, te recordamos que tu congelamiento termina el ${fCorta(c.endDate)}. ¡Te esperamos desde el ${fCorta(c.returnDate)}!`
                      : `Hola ${m.fullName.split(" ")[0]}, tu congelamiento empieza el ${fCorta(c.startDate)} y termina el ${fCorta(c.endDate)}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`rd-levanta flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs border ${activo ? "bg-white border-sky-200 text-sky-900" : "bg-indigo-50 border-indigo-200 text-indigo-900"}`}
                  title="Enviar recordatorio por WhatsApp"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0 ${activo ? "bg-sky-100 text-sky-700" : "bg-indigo-100 text-indigo-700"}`}>{m.fullName.charAt(0)}</span>
                  <span className="min-w-0">
                    <b className="block truncate">{m.fullName}</b>
                    <span className="opacity-80">{activo ? `Vuelve el ${fCorta(c.returnDate)}` : `Congela desde ${fCorta(c.startDate)}`}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-2xl overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab("mensajes")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "mensajes"
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md [&_svg]:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 text-green-600" />
          <span>Mensajes por categoría</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "rules"
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md [&_svg]:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>Reglas Automáticas (Admin)</span>
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "alerts"
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md [&_svg]:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Vencimientos Activos ({renewalAlerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("classes")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "classes"
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md [&_svg]:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Avisos de Clases ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "campaigns"
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md [&_svg]:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Send className="w-3.5 h-3.5 text-purple-600" />
          <span>Promociones Especiales</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === "logs"
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md [&_svg]:text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-600" />
          <span>Historial de Envíos ({notificationLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: AUTOMATIC NOTIFICATION RULES CONFIGURATION (ADMIN) */}
      {activeTab === "mensajes" && <MensajesCategorias />}

      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
            <Settings className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Automatizaciones Configurables por el Administrador
              </p>
              <p className="text-blue-800 text-xs mt-0.5">
                El sistema evalúa el estado de membresías y clases para emitir
                recordatorios preventivos y promociones. Puedes ajustar los
                canales por regla (Push, Email, WhatsApp) y personalizar las
                plantillas dinámicas con{" "}
                <span className="inline-block px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">nombre</span>
                ,{" "}
                <span className="inline-block px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">plan</span>{" "}
                y{" "}
                <span className="inline-block px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">fecha_vencimiento</span>
                .
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {notificationRules.map((rule, idx) => {
              const tono = estiloRegla(rule.badgeTag);
              return (
                <div
                  key={rule.id}
                  className={`rd-aparece rd-levanta relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col ${rule.enabled ? "" : "opacity-70"}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${tono.barra}`} />
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${tono.icono}`}>{tono.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-[0.14em] px-2 py-0.5 rounded-full ${tono.chip}`}>{rule.badgeTag}</span>
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug mt-1">{rule.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" /> {rule.triggerTiming}
                        </p>
                      </div>
                      {/* Interruptor */}
                      <button
                        type="button"
                        onClick={() => puedeEditarReglas && toggleNotificationRule(rule.id)}
                        disabled={!puedeEditarReglas}
                        title={rule.enabled ? "Activa: toca para pausar" : "Pausada: toca para activar"}
                        className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer disabled:cursor-default"
                      >
                        <span className={`relative w-11 h-6 rounded-full transition-colors ${rule.enabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${rule.enabled ? "left-[1.35rem]" : "left-0.5"}`} />
                        </span>
                        <span className={`text-[10px] font-black ${rule.enabled ? "text-emerald-600" : "text-slate-400"}`}>{rule.enabled ? "ACTIVA" : "PAUSADA"}</span>
                      </button>
                    </div>

                    {/* Vista previa del mensaje como burbuja de chat */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Vista previa del mensaje</p>
                      <div className="relative rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-3.5 py-2.5 shadow-xs">
                        <p className="text-sm font-bold text-slate-900">{conVariables(rule.templateTitle)}</p>
                        <p className="text-sm text-slate-600 leading-relaxed mt-1">{conVariables(rule.templateBody)}</p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Canales</span>
                        {rule.channels.map((ch) => (
                          <span key={ch}>{getChannelBadge(ch)}</span>
                        ))}
                      </div>
                      {puedeEditarReglas && (
                        <button
                          onClick={() => handleOpenEditRule(rule)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <Settings className="w-3.5 h-3.5" /> Editar regla
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE RENEWAL ALERTS & DIRECT SEND */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por socio, teléfono o plan..."
                value={alertSearch}
                onChange={(e) => setAlertSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
              <button
                onClick={() => setAlertFilter("all")}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  alertFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:text-slate-900"
                }`}
              >
                Todos ({renewalAlerts.length})
              </button>
              <button
                onClick={() => setAlertFilter("expired")}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  alertFilter === "expired"
                    ? "bg-rose-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:text-slate-900"
                }`}
              >
                ⛔ Vencidos ({renewalAlerts.filter((a) => a.isExpired).length})
              </button>
              <button
                onClick={() => setAlertFilter("urgent")}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  alertFilter === "urgent"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:text-slate-900"
                }`}
              >
                ⚠️ Críticos 1-3 días (
                {
                  renewalAlerts.filter((a) => !a.isExpired && a.daysLeft <= 3)
                    .length
                }
                )
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAlerts.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">
                  ¡No hay vencimientos pendientes en este filtro!
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Todos los socios tienen su membresía al día.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.memberId}
                  className={`bg-white border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all ${
                    alert.isExpired
                      ? "border-rose-300"
                      : alert.daysLeft <= 3
                        ? "border-amber-300"
                        : "border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          alert.isExpired
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : alert.daysLeft <= 3
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                        }`}
                      >
                        {alert.isExpired ? (
                          <>
                            <XCircle className="w-3 h-3" />
                            Vencido hace {Math.abs(alert.daysLeft)}d
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Vence en {alert.daysLeft}{" "}
                            {alert.daysLeft === 1 ? "día" : "días"}
                          </>
                        )}
                      </span>

                      <span className="text-xs font-mono text-gray-500">
                        {alert.endDate}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">
                      {alert.memberName}
                    </h3>
                    <p className="text-xs text-blue-700 font-semibold mt-0.5">
                      {alert.planName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Teléfono:{" "}
                      <TelWhatsApp tel={alert.phone} className="font-mono" />
                    </p>
                  </div>

                  {/* Actions: Send 1-click WhatsApp, Push, Email or Quick Renew */}
                  <div className="mt-3.5 pt-2.5 border-t border-gray-100 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSendDirect(alert, "whatsapp")}
                        className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Enviar recordatorio pre-redactado por WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleSendDirect(alert, "email")}
                        className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Enviar correo de renovación"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Email</span>
                      </button>

                      <button
                        onClick={() => handleSendDirect(alert, "push")}
                        className="py-1 px-2 bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-xs rounded-md flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Enviar notificación Push a la app"
                      >
                        <Smartphone className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const m = members.find(
                          (mem) => mem.id === alert.memberId,
                        );
                        if (m) {
                          renewMembership(m.id, m.planId, "efectivo");
                          confetti({
                            particleCount: 40,
                            spread: 60,
                            origin: { y: 0.6 },
                          });
                        }
                      }}
                      className="w-full py-1 text-center bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-semibold rounded cursor-pointer transition-colors"
                    >
                      ⚡ Renovar Plan 1-Clic
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CLASS NOTICES & BROADCASTS */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Horarios de Clases Grupales & Avisos a Alumnos</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Envía recordatorios automáticos de clases, cambios de sala o
                anuncios especiales a los alumnos.
              </p>
            </div>

            <button
              onClick={() => setIsNewClassModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Clase / Aviso</span>
            </button>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                      {cls.room}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      Inscritos: {cls.registeredCount}/{cls.capacity}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-blue-700 font-semibold mb-2">
                    Coach: {cls.instructorName}
                  </p>

                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{cls.schedule}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Fecha: {cls.date}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleBroadcastClassNotice(cls)}
                    className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Notificar Alumnos</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar aviso de clase "${cls.name}"?`)) {
                        deleteClassNotice(cls.id);
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Eliminar clase"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SPECIAL PROMOTIONS CAMPAIGN BUILDER */}
      {activeTab === "campaigns" && (
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs space-y-4">
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Creador de Campañas & Promociones Especiales</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Enviar Mensaje Promocional Masivo Multicanal
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Envía ofertas especiales (Black Friday, 2x1, descuentos en tienda)
              segmentando por estado del alumno.
            </p>
          </div>

          <form onSubmit={handleSendCampaign} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Título de la Campaña *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 🔥 20% OFF en Renovación Semestral & Suplementos"
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Categoría
                </label>
                <select
                  value={campCategory}
                  onChange={(e) => setCampCategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="special_promo">Promoción Especial</option>
                  <option value="class_notice">Evento / Masterclass</option>
                  <option value="renewal_reminder">
                    Campaña de Reenganche
                  </option>
                  <option value="general_alert">Aviso General</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Audiencia Objetivo (Segmentación)
                </label>
                <select
                  value={campAudience}
                  onChange={(e) => setCampAudience(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="all">
                    Todos los Alumnos Registrados ({members.length} socios)
                  </option>
                  <option value="active">
                    Sólo Socios Activos (
                    {members.filter((m) => m.status === "active").length}{" "}
                    socios)
                  </option>
                  <option value="expiring_soon">
                    Socios Próximos a Vencer (
                    {members.filter((m) => m.status === "expiring_soon").length}{" "}
                    socios)
                  </option>
                  <option value="expired">
                    Socios Vencidos / Inactivos (
                    {members.filter((m) => m.status === "expired").length}{" "}
                    socios)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Canales de Envío Simultáneos
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                    <input
                      type="checkbox"
                      checked={campChannels.includes("push")}
                      onChange={() => handleToggleChannelInCampaign("push")}
                      className="rounded accent-purple-600"
                    />

                    <span className="font-semibold text-purple-800">
                      Push Web
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                    <input
                      type="checkbox"
                      checked={campChannels.includes("email")}
                      onChange={() => handleToggleChannelInCampaign("email")}
                      className="rounded accent-blue-600"
                    />

                    <span className="font-semibold text-blue-800">Email</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                    <input
                      type="checkbox"
                      checked={campChannels.includes("whatsapp")}
                      onChange={() => handleToggleChannelInCampaign("whatsapp")}
                      className="rounded accent-emerald-600"
                    />

                    <span className="font-semibold text-emerald-800">
                      WhatsApp
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">
                  Cuerpo del Mensaje / Oferta *
                </label>
                <span className="text-xs text-gray-400">
                  Usa {"{{nombre}}"} para personalizar
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={campMessage}
                onChange={(e) => setCampMessage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSendingCampaign}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSendingCampaign
                    ? "Enviando Campaña..."
                    : "Disparar Campaña Masiva"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Historial y Registro de Notificaciones Enviadas
              </h2>
              <p className="text-xs text-gray-500">
                Auditoría completa de mensajes automáticos y manuales disparados
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-500 mr-1">Filtrar:</span>
                {["all", "whatsapp", "email", "push"].map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setLogChannelFilter(ch)}
                    className={`px-2.5 py-1 rounded capitalize font-semibold cursor-pointer ${
                      logChannelFilter === ch
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:text-slate-800"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              {notificationLogs.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("¿Limpiar historial de notificaciones?")) {
                      clearNotificationLogs();
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer ml-2"
                  title="Limpiar registro"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                  <th className="py-2.5 px-3">Fecha & Hora</th>
                  <th className="py-2.5 px-3">Destinatario</th>
                  <th className="py-2.5 px-3">Canal</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Título / Asunto</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No hay registros de notificaciones en este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {log.recipientName}
                      </td>
                      <td className="py-2.5 px-3">
                        {getChannelBadge(log.channel)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs font-semibold uppercase px-1.5 py-0.2 bg-gray-100 text-gray-700 rounded">
                          {log.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium max-w-[200px] truncate">
                        {log.title}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-fit">
                          <Check className="w-3 h-3" />
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setViewingLogMessage(log)}
                          className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        >
                          Ver Mensaje
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Notification Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Configurar Regla: {editingRule.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Parámetros de disparo automático
                </p>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveRule}
              className="space-y-3.5 my-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Días de Anticipación / Desfase
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={ruleDaysOffset}
                    onChange={(e) => setRuleDaysOffset(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Descripción del Disparo
                  </label>
                  <input
                    type="text"
                    value={ruleTimingStr}
                    onChange={(e) => setRuleTimingStr(e.target.value)}
                    placeholder="Ej. 3 días antes del vencimiento"
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Canales Habilitados para esta Regla
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                    <input
                      type="checkbox"
                      checked={ruleChannels.includes("push")}
                      onChange={() => handleToggleChannelInRule("push")}
                      className="rounded accent-purple-600"
                    />

                    <span className="font-semibold text-purple-800">
                      Push Web
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                    <input
                      type="checkbox"
                      checked={ruleChannels.includes("email")}
                      onChange={() => handleToggleChannelInRule("email")}
                      className="rounded accent-blue-600"
                    />

                    <span className="font-semibold text-blue-800">Email</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                    <input
                      type="checkbox"
                      checked={ruleChannels.includes("whatsapp")}
                      onChange={() => handleToggleChannelInRule("whatsapp")}
                      className="rounded accent-emerald-600"
                    />

                    <span className="font-semibold text-emerald-800">
                      WhatsApp
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Título de la Notificación *
                </label>
                <input
                  type="text"
                  required
                  value={ruleTemplateTitle}
                  onChange={(e) => setRuleTemplateTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 font-semibold text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">
                    Plantilla del Mensaje *
                  </label>
                  <span className="text-xs text-gray-400">
                    {"{{nombre}}"} | {"{{plan}}"} | {"{{fecha_vencimiento}}"}
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={ruleTemplateBody}
                  onChange={(e) => setRuleTemplateBody(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-3 py-1.5 text-gray-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs cursor-pointer"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Class Notice Modal */}
      {isNewClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-slate-900">
                Añadir Clase / Aviso Especial
              </h3>
              <button
                onClick={() => setIsNewClassModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateClass}
              className="space-y-3 my-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre de la Clase *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. HIIT Funcional Nocturno"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Instructor / Coach *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Vega"
                  value={newClassInstructor}
                  onChange={(e) => setNewClassInstructor(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Horario & Días *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Martes y Jueves 19:00 - 20:00"
                  value={newClassSchedule}
                  onChange={(e) => setNewClassSchedule(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Sala / Espacio
                  </label>
                  <input
                    type="text"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Capacidad Máxima
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newClassCapacity}
                    onChange={(e) =>
                      setNewClassCapacity(Number(e.target.value))
                    }
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewClassModalOpen(false)}
                  className="px-3 py-1.5 text-gray-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-xs cursor-pointer"
                >
                  Guardar Clase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Log Message Modal */}
      {viewingLogMessage && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {viewingLogMessage.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Destinatario: {viewingLogMessage.recipientName} (
                  {viewingLogMessage.channel})
                </p>
              </div>
              <button
                onClick={() => setViewingLogMessage(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
              {viewingLogMessage.message}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Fecha: {viewingLogMessage.timestamp}</span>
              <span className="font-bold text-emerald-600 uppercase">
                Estado: {viewingLogMessage.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
