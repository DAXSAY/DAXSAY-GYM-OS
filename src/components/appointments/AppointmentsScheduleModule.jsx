import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  HeartPulse,
  Utensils,
  Share2,
  ShieldAlert,
  Trash2,
  X,
  UserCheck,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import confetti from "canvas-confetti";
import { hoyISO } from "../../utils/fecha";

const HOURS = [
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
];

const NOMBRES_DIA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// 7 días seguidos empezando HOY (sin columnas de días que ya pasaron)
// + desplazamiento en bloques de 7 días
const construirSemana = (offset = 0) => {
  const [y, m, d] = hoyISO().split("-").map(Number);
  const inicio = new Date(Date.UTC(y, m - 1, d + offset * 7));
  return Array.from({ length: 7 }, (_, i) => {
    const f = new Date(inicio);
    f.setUTCDate(inicio.getUTCDate() + i);
    const iso = f.toISOString().slice(0, 10);
    const nombre = NOMBRES_DIA[(f.getUTCDay() + 6) % 7];
    return { key: iso, label: nombre, date: iso, dia: f.getUTCDate(), mes: MESES[f.getUTCMonth()], esHoy: offset === 0 && i === 0 };
  });
};

const fechaLarga = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
};

export const AppointmentsScheduleModule = () => {
  const {
    appointments,
    addAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    members,
    staffContracts,
    staffDirectory,
    currentUser,
  } = useGym();

  // Mode: Staff/Specialist Schedule vs Member/User Portal View
  const [viewMode, setViewMode] = useState("admin_calendar");

  // Calendar Selection State
  const [weekOffset, setWeekOffset] = useState(0);
  const DAYS_OF_WEEK = useMemo(() => construirSemana(weekOffset), [weekOffset]);
  const [selectedDate, setSelectedDate] = useState(hoyISO());
  const selectedDay = DAYS_OF_WEEK.find((d) => d.date === selectedDate)?.key || "";
  const setSelectedDay = () => {};
  const [selectedHour, setSelectedHour] = useState("10:00 AM");
  // Filters
  const [serviceFilter, setServiceFilter] = useState("all");
  const [onlyAvailableFilter, setOnlyAvailableFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [formService, setFormService] = useState("");
  const [formMemberId, setFormMemberId] = useState("");
  const [formStaffName, setFormStaffName] = useState("");
  const [formDate, setFormDate] = useState(hoyISO());
  const [formSlot, setFormSlot] = useState("10:00 AM");
  const [formReason, setFormReason] = useState("");
  const [formRoom, setFormRoom] = useState(
    "Consultorio de Fisioterapia & Rehabilitación",
  );
  const [formNotes, setFormNotes] = useState("");

  // Conflict warning banner state
  const [conflictWarning, setConflictWarning] = useState(null);
  const [detalleHora, setDetalleHora] = useState(false);

  // User Portal Booking State
  const [portalSelectedService, setPortalSelectedService] =
    useState("nutrition");
  const [portalSelectedSlot, setPortalSelectedSlot] = useState("09:00 AM");
  const [portalSelectedDate, setPortalSelectedDate] = useState(hoyISO());
  const [portalStudentName, setPortalStudentName] = useState(currentUser?.fullName || "");
  const [portalStudentPhone, setPortalStudentPhone] = useState("");
  const [portalReason, setPortalReason] = useState("");
  const [portalSuccessMessage, setPortalSuccessMessage] = useState(null);

  // Especialistas reales: contratos de personal + usuario actual (sin nombres ficticios)
  const specialistsFor = (service) => {
    const kw = service === "nutrition" ? ["nutri"] : ["fisio", "physio", "terap"];
    const fromStaff = [
      ...staffDirectory.filter((p) => kw.some((k) => String(p.cargo || "").toLowerCase().includes(k))),
      ...staffContracts.filter((c) => kw.some((k) => String(c.role || "").toLowerCase().includes(k))),
    ]
      .map((p) => p.fullName || p.staffName)
      .filter(Boolean);
    const me =
      currentUser?.fullName &&
      ((service === "nutrition" && currentUser.role === "nutritionist") ||
        (service !== "nutrition" && currentUser.role === "physio"))
        ? [currentUser.fullName]
        : [];
    return Array.from(new Set([...me, ...fromStaff]));
  };
  const availableSpecialists = useMemo(
    () => specialistsFor(formService),
    [formService, staffContracts, staffDirectory, currentUser],
  );

  // Abre el formulario de cita con fecha y hora ya elegidas
  const openBooking = (date, hour, service) => {
    // Sin tipo preseleccionado: solo fisioterapia o nutrición abren en su propio servicio
    const srv = service || (currentUser?.role === "physio" ? "physiotherapy" : currentUser?.role === "nutritionist" ? "nutrition" : "");
    setFormService(srv);
    setFormDate(date || selectedDate);
    setFormSlot(hour || selectedHour);
    setFormReason("");
    setFormNotes("");
    setFormStaffName(srv ? specialistsFor(srv)[0] || "" : "");
    setFormRoom(srv === "nutrition" ? "Consultorio de Nutrición" : srv ? "Consultorio de Fisioterapia" : "");
    setConflictWarning(null);
    setIsBookingModalOpen(true);
  };

  // Handle service change in modal
  const handleServiceChange = (service) => {
    setFormService(service);
    setFormStaffName(specialistsFor(service)[0] || "");
    setFormRoom(service === "nutrition" ? "Consultorio de Nutrición" : "Consultorio de Fisioterapia");
    setFormReason("");
  };

  // Helper to extract standard hour string from timeSlot
  const getSlotHour = (timeSlot) => {
    // e.g. "10:00 AM - 10:45 AM" -> "10:00 AM"
    const match = timeSlot.match(/^\d{2}:\d{2}\s*(?:AM|PM)/i);
    return match ? match[0] : timeSlot;
  };

  // Check if an appointment matches a day and hour
  const getAppointmentsForCell = (date, hour) => {
    return appointments.filter((a) => {
      const matchesDate = a.date === date;
      const matchesHour = a.timeSlot.includes(hour.split(" ")[0]);
      const matchesService =
        serviceFilter === "all" || a.serviceType === serviceFilter;
      return matchesDate && matchesHour && matchesService;
    });
  };

  // Appointments for the currently selected slot (Right side list)
  const currentSlotAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchesDate = a.date === selectedDate;
      const matchesHour = a.timeSlot.includes(selectedHour.split(" ")[0]);
      const matchesService =
        serviceFilter === "all" || a.serviceType === serviceFilter;
      const matchesSearch =
        !searchTerm ||
        a.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.memberDni.includes(searchTerm);
      return matchesDate && matchesHour && matchesService && matchesSearch;
    });
  }, [appointments, selectedDate, selectedHour, serviceFilter, searchTerm]);

  // Conflict Detection function
  const checkScheduleConflict = (memberId, date, hour, excludeAptId) => {
    const overlapping = appointments.find(
      (a) =>
        a.id !== excludeAptId &&
        a.memberId === memberId &&
        a.date === date &&
        a.timeSlot.includes(hour.split(" ")[0]) &&
        a.status !== "falta" &&
        a.status !== "cancelled",
    );
    return overlapping;
  };

  // Check conflicts live when modal inputs change
  const detectedFormConflict = useMemo(() => {
    if (!formMemberId || !formDate || !formSlot) return null;
    return checkScheduleConflict(formMemberId, formDate, formSlot);
  }, [formMemberId, formDate, formSlot, appointments]);

  // Handle booking creation with strict conflict validation & alert
  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (!formService) {
      setConflictWarning("Primero elige el tipo de cita: Nutrición o Fisioterapia.");
      return;
    }
    const mem = members.find((m) => m.id === formMemberId);
    if (!mem) return;

    // Check for conflict
    const conflict = checkScheduleConflict(mem.id, formDate, formSlot);
    if (conflict) {
      setConflictWarning(
        `¡ALERTA DE CRUCE DE HORARIOS! El alumno ${mem.fullName} ya tiene una cita agendada de ${conflict.serviceType === "nutrition" ? "Nutrición" : "Fisioterapia"} con ${conflict.staffName} el día ${conflict.date} en el horario ${conflict.timeSlot}.`,
      );
      return;
    }

    setConflictWarning(null);

    const slotFull = `${formSlot} - ${formSlot.replace("00", "45")}`;

    addAppointment({
      serviceType: formService,
      memberId: mem.id,
      memberName: mem.fullName,
      memberDni: mem.dni,
      memberPhone: mem.phone,
      staffId: "staff-assigned",
      staffName: formStaffName,
      date: formDate,
      timeSlot: slotFull,
      durationMinutes: 45,
      status: "por_atender",
      reason:
        formReason.trim() ||
        (formService === "nutrition"
          ? "Control nutricional y cálculo de macros"
          : "Sesión de fisioterapia y rehabilitación"),
      roomOrDesk: formRoom,
      notes: formNotes.trim() || undefined,
      reminderSent: false,
      dayOfWeek: fechaLarga(formDate).split(",")[0],
    });

    confetti({ particleCount: 50, spread: 70 });
    setIsBookingModalOpen(false);
  };

  // WhatsApp Reminder Sender
  const sendWhatsAppReminder = (apt) => {
    const serviceName =
      apt.serviceType === "nutrition"
        ? "🥗 Nutrición Deportiva"
        : "🩺 Fisioterapia & Rehabilitación";
    const statusLabels = {
      por_atender: "Por Atender (En Espera)",
      atendiendo: "En Atención Ahora",
      atendido: "Atendido",
      pospuesto: "Pospuesto / Reprogramado",
      falta: "Inasistencia Registrada",
    };

    const text = encodeURIComponent(
      `*RADICAL - RECORDATORIO Y ESTADO DE CITA*\n` +
        `¡Hola ${apt.memberName}!\n` +
        `📌 *Servicio:* ${serviceName}\n` +
        `👨‍⚕️ *Especialista:* ${apt.staffName}\n` +
        `📅 *Fecha:* ${apt.date} (${apt.dayOfWeek || "Semana en curso"})\n` +
        `⏰ *Horario:* ${apt.timeSlot}\n` +
        `📍 *Ubicación:* ${apt.roomOrDesk}\n` +
        `📋 *Estado Actual:* ${statusLabels[apt.status] || apt.status}\n` +
        `📝 *Motivo:* ${apt.reason}\n\n` +
        `Por favor confirma tu asistencia o acércate a recepción.`,
    );
    const phone = apt.memberPhone ? apt.memberPhone.replace(/\D/g, "") : "";
    const url = phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  // Status badge style helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "atendiendo":
        return {
          bg: "bg-emerald-500 text-white animate-pulse",
          label: "Atendiendo",
          dot: "bg-white",
        };
      case "por_atender":
        return {
          bg: "bg-blue-100 text-blue-800 border border-blue-300",
          label: "Por Atender",
          dot: "bg-blue-500",
        };
      case "atendido":
        return {
          bg: "bg-slate-100 text-slate-700 border border-slate-300",
          label: "Atendido",
          dot: "bg-slate-500",
        };
      case "pospuesto":
        return {
          bg: "bg-amber-100 text-amber-800 border border-amber-300",
          label: "Pospuesto",
          dot: "bg-amber-500",
        };
      case "falta":
        return {
          bg: "bg-rose-100 text-rose-800 border border-rose-300",
          label: "Falta",
          dot: "bg-rose-500",
        };
      default:
        return {
          bg: "bg-blue-100 text-blue-800 border border-blue-200",
          label: "Programado",
          dot: "bg-blue-500",
        };
    }
  };

  // User Portal: Book from member portal
  const handlePortalSelfBooking = () => {
    const mem =
      members.find((m) =>
        m.fullName.toLowerCase().includes(portalStudentName.toLowerCase()),
      ) || members[0];
    const specialist = specialistsFor(portalSelectedService)[0] || "Por asignar";

    const slotFull = `${portalSelectedSlot} - ${portalSelectedSlot.replace("00", "45")}`;

    addAppointment({
      serviceType: portalSelectedService,
      memberId: mem?.id || "portal-mem",
      memberName: portalStudentName,
      memberDni: mem?.dni || "",
      memberPhone: portalStudentPhone,
      staffId: "staff-portal",
      staffName: specialist,
      date: portalSelectedDate,
      timeSlot: slotFull,
      durationMinutes: 45,
      status: "por_atender",
      reason: portalReason,
      roomOrDesk:
        portalSelectedService === "nutrition"
          ? "Consultorio de Nutrición"
          : "Consultorio de Fisioterapia",
      notes: "Reservado a través del Portal de Usuario Web",
      reminderSent: false,
      dayOfWeek: fechaLarga(portalSelectedDate).split(",")[0],
    });

    setPortalSuccessMessage(
      `¡Cita agendada con éxito para el ${portalSelectedDate} a las ${portalSelectedSlot}! Se envió la confirmación a recepción.`,
    );
    confetti({ particleCount: 60, spread: 80 });
  };

  // User Portal: Send WhatsApp to reception
  const handleSendWhatsAppToReception = () => {
    const sName =
      portalSelectedService === "nutrition"
        ? "Nutrición Deportiva"
        : "Fisioterapia y Rehabilitación";
    const text = encodeURIComponent(
      `*SOLICITUD DE CITA DESDE EL PORTAL DEL ALUMNO*\n` +
        `¡Hola Recepción RADICAL!\n` +
        `Soy el alumno: *${portalStudentName}*\n` +
        `Deseo reservar un turno para: *${sName}*\n` +
        `📅 *Fecha solicitada:* ${portalSelectedDate}\n` +
        `⏰ *Hora deseada:* ${portalSelectedSlot}\n` +
        `📝 *Motivo:* ${portalReason}\n\n` +
        `Por favor confirmar disponibilidad.`,
    );
    window.open(`https://wa.me/51999888777?text=${text}`, "_blank");
  };

  // Counts for KPIs
  const atendiendoCount = appointments.filter(
    (a) => a.status === "atendiendo",
  ).length;
  const porAtenderCount = appointments.filter(
    (a) => a.status === "por_atender",
  ).length;
  const atendidoCount = appointments.filter(
    (a) => a.status === "atendido",
  ).length;
  const pospuestoCount = appointments.filter(
    (a) => a.status === "pospuesto",
  ).length;
  const faltaCount = appointments.filter((a) => a.status === "falta").length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <CalendarDays className="w-4 h-4" />
              <span>Agenda de Citas Estilo Google Calendar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Horarios & Reserva de Citas
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Toque el + de una hora libre para agendar. Toque una hora con citas
              para ver a los pacientes y cambiar su estado (atendiendo, atendido,
              pospuesto o falta).
            </p>
          </div>

          {/* Action buttons & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800/90 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setViewMode("admin_calendar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "admin_calendar"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Vista Calendario Staff</span>
              </button>
              <button
                onClick={() => setViewMode("user_portal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "user_portal"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Portal del Alumno / Usuario</span>
              </button>
            </div>

            <button
              onClick={() => {
                openBooking(selectedDate, selectedHour);
              }}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar en {selectedHour}</span>
            </button>
          </div>
        </div>

        {/* Real-time Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase block">
                Atendiendo Ahora
              </span>
              <span className="text-lg font-extrabold text-emerald-200">
                {atendiendoCount}
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="bg-blue-950/60 border border-blue-500/40 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-400 font-bold uppercase block">
                Por Atender
              </span>
              <span className="text-lg font-extrabold text-blue-200">
                {porAtenderCount}
              </span>
            </div>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase block">
                Atendidos
              </span>
              <span className="text-lg font-extrabold text-white">
                {atendidoCount}
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="bg-amber-950/60 border border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase block">
                Pospuestos
              </span>
              <span className="text-lg font-extrabold text-amber-200">
                {pospuestoCount}
              </span>
            </div>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>

          <div className="bg-rose-950/60 border border-rose-500/40 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-400 font-bold uppercase block">
                Faltas (Liberados)
              </span>
              <span className="text-lg font-extrabold text-rose-200">
                {faltaCount}
              </span>
            </div>
            <X className="w-4 h-4 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Cross Conflict Warning Banner if triggered */}
      {conflictWarning && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 text-xs text-rose-900 shadow-md flex items-start justify-between gap-3 animate-bounce">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold block text-sm">
                Alerta de Cruce de Horarios Detectada
              </strong>
              <p className="mt-0.5 text-rose-800">{conflictWarning}</p>
            </div>
          </div>
          <button
            onClick={() => setConflictWarning(null)}
            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ----------------- VIEW 1: GOOGLE CALENDAR STYLE SCHEDULE ----------------- */}
      {viewMode === "admin_calendar" && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Service Filters */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setServiceFilter("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  serviceFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todos los Servicios
              </button>
              <button
                onClick={() => setServiceFilter("physiotherapy")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  serviceFilter === "physiotherapy"
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Fisioterapia</span>
              </button>
              <button
                onClick={() => setServiceFilter("nutrition")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  serviceFilter === "nutrition"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Nutrición</span>
              </button>
            </div>

            {/* Filter by Available / Free hours toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOnlyAvailableFilter(!onlyAvailableFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                  onlyAvailableFilter
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                <span>Filtrar solo horas disponibles (vacías o por falta)</span>
              </button>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar paciente o doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Navegación de semanas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold hover:bg-slate-50 cursor-pointer"
              >
                ← 7 días antes
              </button>
              <button
                onClick={() => {
                  setWeekOffset(0);
                  setSelectedDate(hoyISO());
                }}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold cursor-pointer"
              >
                Hoy
              </button>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold hover:bg-slate-50 cursor-pointer"
              >
                7 días después →
              </button>
            </div>
            <span className="text-base font-extrabold text-slate-800">
              {DAYS_OF_WEEK[0].dia} {DAYS_OF_WEEK[0].mes} – {DAYS_OF_WEEK[6].dia} {DAYS_OF_WEEK[6].mes}{" "}
              {DAYS_OF_WEEK[6].date.slice(0, 4)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openBooking(selectedDate, selectedHour, "nutrition")}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Cita de nutrición
              </button>
              <button
                onClick={() => openBooking(selectedDate, selectedHour, "physiotherapy")}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Cita de fisioterapia
              </button>
            </div>
          </div>

          {/* MAIN TWO-COLUMN GOOGLE CALENDAR GRID & RIGHT PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT / CENTER: GOOGLE CALENDAR GRID (7 COLUMNS) */}
            <div className="lg:col-span-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Calendar Days Header */}
              <div className="grid grid-cols-8 bg-slate-900 text-white border-b border-slate-800 text-center text-xs font-bold sticky top-0 z-10">
                <div className="p-3 bg-slate-950 text-slate-400 border-r border-slate-800 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                {DAYS_OF_WEEK.map((day) => {
                  const isDaySelected = selectedDay === day.key;
                  return (
                    <button
                      key={day.key}
                      onClick={() => {
                        setSelectedDay(day.key);
                        setSelectedDate(day.date);
                      }}
                      className={`p-2.5 transition-colors text-left flex flex-col items-center justify-center cursor-pointer border-r border-slate-800 last:border-r-0 ${
                        isDaySelected
                          ? "bg-blue-600 text-white"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {day.esHoy ? "Hoy" : day.label}
                      </span>
                      <span
                        className={`text-xs mt-0.5 px-1.5 py-0.2 rounded-full font-extrabold ${isDaySelected ? "bg-white text-blue-900" : "text-slate-400"}`}
                      >
                        {day.dia} {day.mes}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Time Slots Rows */}
              <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
                {HOURS.map((hour) => {
                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-8 min-h-[64px] group"
                    >
                      {/* Left time label */}
                      <div className="p-2 bg-slate-50 border-r border-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center text-center select-none">
                        {hour}
                      </div>

                      {/* Day cells for this hour */}
                      {DAYS_OF_WEEK.map((day) => {
                        const cellApts = getAppointmentsForCell(day.date, hour);
                        const isCellSelected =
                          selectedDate === day.date && selectedHour === hour;
                        const hasFalta = cellApts.some(
                          (a) => a.status === "falta",
                        );
                        const isSlotFree =
                          cellApts.length === 0 ||
                          (hasFalta &&
                            cellApts.every((a) => a.status === "falta"));

                        // Filter condition
                        if (onlyAvailableFilter && !isSlotFree) {
                          return (
                            <div
                              key={`${day.key}-${hour}`}
                              className="p-1 border-r border-slate-100 last:border-r-0 bg-slate-50/50 opacity-40 select-none flex items-center justify-center text-xs text-slate-400"
                            >
                              Ocupado
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${day.key}-${hour}`}
                            onClick={() => {
                              setSelectedDate(day.date);
                              setSelectedHour(hour);
                              if (cellApts.length === 0) {
                                if (day.date >= hoyISO()) openBooking(day.date, hour);
                              } else {
                                setDetalleHora(true);
                              }
                            }}
                            className={`p-1.5 border-r border-slate-100 last:border-r-0 transition-all cursor-pointer relative flex flex-col justify-between ${
                              isCellSelected
                                ? "bg-blue-50/90 ring-2 ring-blue-600 z-10"
                                : isSlotFree
                                  ? "hover:bg-slate-50 bg-white"
                                  : "bg-slate-50/60 hover:bg-slate-100/80"
                            }`}
                          >
                            {cellApts.length === 0 ? (
                              day.date < hoyISO() ? (
                                <div className="h-full" />
                              ) : (
                                <div className="h-full flex items-center justify-center py-2">
                                  <span className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 text-slate-400 flex items-center justify-center hover:border-blue-500 hover:text-white hover:bg-blue-600 transition-all">
                                    <Plus className="w-4 h-4" />
                                  </span>
                                </div>
                              )
                            ) : (
                              <div className="space-y-1 w-full">
                                {cellApts.map((apt) => {
                                  const badge = getStatusBadge(apt.status);
                                  const isPhysio =
                                    apt.serviceType === "physiotherapy";

                                  return (
                                    <div
                                      key={apt.id}
                                      className={`p-1 rounded-md text-xs font-semibold leading-tight shadow-xs border ${
                                        isPhysio
                                          ? "bg-cyan-50/90 border-cyan-200 text-cyan-950"
                                          : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="truncate font-extrabold">
                                          {apt.memberName.split(" ")[0]}
                                        </span>
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`}
                                        />
                                      </div>
                                      <div className="text-xs text-slate-500 truncate mt-0.5">
                                        {badge.label}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Indicator of selection */}
                            {isCellSelected && (
                              <div className="absolute top-1 right-1">
                                <span className="w-2 h-2 rounded-full bg-blue-600 block" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Detalle de una hora con citas (pantalla completa) */}
      {viewMode === "admin_calendar" && detalleHora && (
            <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
            <div className="w-full max-w-3xl mx-auto min-h-full bg-white p-5 sm:p-8 space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setDetalleHora(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  ← Volver al calendario
                </button>
              </div>
              {/* Header of Active Hour */}
              <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">
                    Horario Seleccionado
                  </span>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>
                      {fechaLarga(selectedDate)}, {selectedHour}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-300 block mt-0.5">
                    Fecha: {selectedDate}
                  </span>
                </div>

                <button
                  onClick={() => {
                    openBooking(selectedDate, selectedHour);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  title="Añadir paciente a esta hora"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Agendar</span>
                </button>
              </div>

              {/* Status explanation strip */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">
                  Control en tiempo real del especialista:
                </span>
                El nutricionista o fisioterapeuta puede alternar los estados
                tocando los botones de cada paciente.
              </div>

              {/* List of Persons Scheduled for this hour */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                  <span>
                    Personas Agendadas ({currentSlotAppointments.length})
                  </span>
                  {currentSlotAppointments.length === 0 && (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-xs border border-emerald-200">
                      Horario Disponible
                    </span>
                  )}
                </div>

                {currentSlotAppointments.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center text-xs space-y-2">
                    <CalendarIcon className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="font-bold text-slate-700">
                      Sin personas agendadas para esta hora
                    </p>
                    <p className="text-slate-500 text-xs">
                      Este turno está completamente libre o se liberó por
                      inasistencia previa.
                    </p>
                    <button
                      onClick={() => {
                        openBooking(selectedDate, selectedHour);
                      }}
                      className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agendar Cita Aquí</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {currentSlotAppointments.map((apt) => {
                      const isPhysio = apt.serviceType === "physiotherapy";
                      const badge = getStatusBadge(apt.status);

                      return (
                        <div
                          key={apt.id}
                          className="bg-white rounded-xl border-2 border-slate-200 p-3 shadow-xs space-y-2 hover:border-blue-300 transition-colors"
                        >
                          {/* Patient and Service Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold ${
                                  isPhysio
                                    ? "bg-cyan-100 text-cyan-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {isPhysio ? (
                                  <HeartPulse className="w-3 h-3" />
                                ) : (
                                  <Utensils className="w-3 h-3" />
                                )}
                                <span>
                                  {isPhysio ? "Fisioterapia" : "Nutrición"}
                                </span>
                              </span>
                              <h4 className="font-extrabold text-slate-900 text-xs mt-1">
                                {apt.memberName}
                              </h4>
                              <p className="text-xs text-slate-500">
                                DNI: {apt.memberDni} • Tel:{" "}
                                {apt.memberPhone || "No registrado"}
                              </p>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          {/* Reason & Specialist */}
                          <div className="bg-slate-50 p-2 rounded-lg text-xs space-y-0.5">
                            <div className="text-slate-800 font-medium">
                              <strong>Motivo:</strong> {apt.reason}
                            </div>
                            <div className="text-slate-600">
                              <strong>Especialista:</strong> {apt.staffName}
                            </div>
                            <div className="text-slate-500 text-xs">
                              <strong>Ubicación:</strong> {apt.roomOrDesk}
                            </div>
                          </div>

                          {/* INTERACTIVE STATUS ASSIGNMENT BUTTONS (Nutricionista / Fisio asigna estado actual) */}
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                              Asignar Estado Actual del Paciente:
                            </span>
                            <div className="grid grid-cols-3 gap-1 text-xs font-bold">
                              <button
                                onClick={() =>
                                  updateAppointmentStatus(apt.id, "atendiendo")
                                }
                                className={`py-1 px-1.5 rounded-md border text-center transition-colors cursor-pointer ${
                                  apt.status === "atendiendo"
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                              >
                                Atendiendo
                              </button>

                              <button
                                onClick={() =>
                                  updateAppointmentStatus(apt.id, "por_atender")
                                }
                                className={`py-1 px-1.5 rounded-md border text-center transition-colors cursor-pointer ${
                                  apt.status === "por_atender"
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                    : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                                }`}
                              >
                                Por Atender
                              </button>

                              <button
                                onClick={() =>
                                  updateAppointmentStatus(apt.id, "atendido")
                                }
                                className={`py-1 px-1.5 rounded-md border text-center transition-colors cursor-pointer ${
                                  apt.status === "atendido"
                                    ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                                    : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                }`}
                              >
                                Atendido
                              </button>

                              <button
                                onClick={() =>
                                  updateAppointmentStatus(apt.id, "pospuesto")
                                }
                                className={`py-1 px-1.5 rounded-md border text-center transition-colors cursor-pointer ${
                                  apt.status === "pospuesto"
                                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                }`}
                              >
                                Pospuesto
                              </button>

                              <button
                                onClick={() =>
                                  updateAppointmentStatus(apt.id, "falta")
                                }
                                className={`py-1 px-1.5 rounded-md border text-center transition-colors cursor-pointer ${
                                  apt.status === "falta"
                                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                    : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                                }`}
                              >
                                Falta
                              </button>

                              <button
                                onClick={() => sendWhatsAppReminder(apt)}
                                className="py-1 px-1.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 flex items-center justify-center gap-1 cursor-pointer"
                                title="Mandar mensaje WhatsApp"
                              >
                                <Share2 className="w-3 h-3" />
                                <span>Wpp</span>
                              </button>
                            </div>
                          </div>

                          {/* Delete option */}
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => deleteAppointment(apt.id)}
                              className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Cancelar Cita</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            </div>
      )}

      {/* ----------------- VIEW 2: PORTAL DEL ALUMNO / USUARIO ----------------- */}
      {viewMode === "user_portal" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider block">
              Vista Exclusiva del Cliente
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              Portal del Alumno: Reserva y Disponibilidad de Horarios
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Consulta en tiempo real las horas libres de Fisioterapia y
              Nutrición Deportiva. Puedes confirmar tu cita de forma directa o
              enviar un mensaje automático por WhatsApp a recepción para agendar
              tu turno.
            </p>
          </div>

          {portalSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{portalSuccessMessage}</span>
              </div>
              <button
                onClick={() => setPortalSuccessMessage(null)}
                className="text-emerald-700 font-bold hover:underline"
              >
                Cerrar
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Form in User Portal */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-cyan-600" />
                <span>Datos de tu Reserva</span>
              </h3>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Especialidad Requerida
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPortalSelectedService("nutrition")}
                    className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      portalSelectedService === "nutrition"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Utensils className="w-4 h-4 mb-1" />
                    <div className="text-xs">Nutrición Deportiva</div>
                    <div className="text-xs opacity-80">
                      Lic. Sofía Valdivia
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPortalSelectedService("physiotherapy")}
                    className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      portalSelectedService === "physiotherapy"
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <HeartPulse className="w-4 h-4 mb-1" />
                    <div className="text-xs">Fisioterapia</div>
                    <div className="text-xs opacity-80">
                      Lic. Diego Morales
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Completo del Alumno
                </label>
                <input
                  type="text"
                  value={portalStudentName}
                  onChange={(e) => setPortalStudentName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  value={portalStudentPhone}
                  onChange={(e) => setPortalStudentPhone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha
                  </label>
                  <select
                    value={portalSelectedDate}
                    onChange={(e) => setPortalSelectedDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.label} ({d.dia} {d.mes})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Horario Deseado
                  </label>
                  <select
                    value={portalSelectedSlot}
                    onChange={(e) => setPortalSelectedSlot(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo de Consulta o Lesión
                </label>
                <textarea
                  rows={2}
                  value={portalReason}
                  onChange={(e) => setPortalReason(e.target.value)}
                  placeholder="Ej. Evaluación de manguito rotador o plan de pérdida de grasa..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handlePortalSelfBooking}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Agendar Directamente</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsAppToReception}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Mandar Mensaje al WhatsApp de Recepción</span>
                </button>
              </div>
            </div>

            {/* Available Hours Matrix in Portal */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Horas Disponibles en {portalSelectedDate}</span>
              </h3>
              <p className="text-slate-500 text-xs">
                Selecciona una franja horaria vacía para asignarla a tu reserva
                de{" "}
                {portalSelectedService === "nutrition"
                  ? "Nutrición"
                  : "Fisioterapia"}
                :
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HOURS.map((hour) => {
                  const apts = getAppointmentsForCell(portalSelectedDate, hour);
                  const isTaken =
                    apts.length > 0 && apts.some((a) => a.status !== "falta");
                  const isSelected = portalSelectedSlot === hour;

                  return (
                    <button
                      key={hour}
                      disabled={isTaken}
                      onClick={() => setPortalSelectedSlot(hour)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan-600 text-white border-cyan-600 font-extrabold shadow-xs"
                          : isTaken
                            ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed line-through"
                            : "bg-white text-slate-800 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50"
                      }`}
                    >
                      <div className="text-xs font-bold">{hour}</div>
                      <div className="text-xs mt-0.5 font-semibold">
                        {isTaken ? "Ocupado" : "Disponible"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">
                  📌 Reglas de Atención al Alumno:
                </div>
                <div>
                  • Las citas tienen una duración de 45 minutos efectivos.
                </div>
                <div>
                  • En caso de no asistir y marcarse falta, el turno queda
                  disponible para otros miembros.
                </div>
                <div>
                  • Si deseas cancelar o reprogramar, notifica con al menos 2
                  horas de anticipación.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- NUEVA CITA: PANTALLA COMPLETA ----------------- */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
          <div
            className={`text-white px-4 sm:px-8 py-4 flex items-center justify-between gap-4 shrink-0 bg-gradient-to-r ${
              formService === "nutrition" ? "from-emerald-700 to-teal-800" : formService ? "from-cyan-700 to-blue-800" : "from-slate-700 to-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                {formService === "nutrition" ? <Utensils className="w-6 h-6" /> : <HeartPulse className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">Nueva cita</span>
                <h3 className="text-xl font-extrabold">
                  {formService === "nutrition" ? "Consulta de nutrición" : formService ? "Sesión de fisioterapia" : "Elige el tipo de cita"}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleCreateBooking} className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Servicio */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                  <h4 className="text-base font-extrabold text-slate-900 mb-4">1. ¿Qué tipo de cita?</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        id: "nutrition",
                        t: "Nutrición",
                        d: "Plan de alimentación, control de peso y composición corporal",
                        Icon: Utensils,
                        on: "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100",
                        ic: "bg-emerald-600",
                      },
                      {
                        id: "physiotherapy",
                        t: "Fisioterapia",
                        d: "Evaluación de lesiones, dolor y rehabilitación",
                        Icon: HeartPulse,
                        on: "border-cyan-500 bg-cyan-50 ring-4 ring-cyan-100",
                        ic: "bg-cyan-600",
                      },
                    ].map(({ id, t, d, Icon, on, ic }) => (
                      <button
                        type="button"
                        key={id}
                        onClick={() => handleServiceChange(id)}
                        className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex gap-4 items-start ${
                          formService === id ? on : "border-slate-200 hover:border-slate-400 bg-white"
                        }`}
                      >
                        <span className={`w-12 h-12 rounded-xl ${ic} text-white flex items-center justify-center shrink-0`}>
                          <Icon className="w-6 h-6" />
                        </span>
                        <span>
                          <span className="block text-lg font-extrabold text-slate-900">{t}</span>
                          <span className="block text-sm text-slate-500">{d}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* 2. Paciente y especialista */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                  <h4 className="text-base font-extrabold text-slate-900 mb-4">2. Paciente y especialista</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Alumno *</label>
                      <select
                        value={formMemberId}
                        onChange={(e) => setFormMemberId(e.target.value)}
                        required
                        className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="">Seleccione…</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName} · DNI {m.dni}
                          </option>
                        ))}
                      </select>
                      {members.length === 0 && (
                        <p className="text-xs text-amber-700 mt-1">Aún no hay alumnos registrados.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Especialista *</label>
                      <input
                        list="lista-especialistas"
                        value={formStaffName}
                        onChange={(e) => setFormStaffName(e.target.value)}
                        required
                        placeholder={formService === "nutrition" ? "Nutricionista" : "Fisioterapeuta"}
                        className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-white"
                      />
                      <datalist id="lista-especialistas">
                        {availableSpecialists.map((n) => (
                          <option key={n} value={n} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </section>

                {/* 3. Fecha y hora */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                  <h4 className="text-base font-extrabold text-slate-900 mb-4">3. Fecha y hora</h4>
                  <div className="flex flex-wrap items-end gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Fecha *</label>
                      <input
                        type="date"
                        value={formDate}
                        min={hoyISO()}
                        onChange={(e) => setFormDate(e.target.value)}
                        required
                        className="text-sm p-3 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <span className="text-sm text-slate-500 pb-3 capitalize">{fechaLarga(formDate)}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {HOURS.map((h) => {
                      const ocupadas = appointments.filter(
                        (a) =>
                          a.date === formDate &&
                          a.timeSlot.includes(h.split(" ")[0]) &&
                          a.serviceType === formService &&
                          a.status !== "falta",
                      ).length;
                      const sel = formSlot === h;
                      return (
                        <button
                          type="button"
                          key={h}
                          onClick={() => setFormSlot(h)}
                          className={`py-3 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                            sel
                              ? "bg-blue-600 border-blue-600 text-white shadow"
                              : ocupadas
                                ? "bg-amber-50 border-amber-200 text-amber-800"
                                : "bg-white border-slate-200 text-slate-700 hover:border-blue-400"
                          }`}
                        >
                          {h}
                          <span className={`block text-xs font-semibold ${sel ? "text-white/80" : "text-slate-500"}`}>
                            {ocupadas ? `${ocupadas} agendada(s)` : "Libre"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {detectedFormConflict && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>
                        Este alumno ya tiene una cita ese día a esa hora ({detectedFormConflict.staffName}). Elija otro
                        horario.
                      </span>
                    </div>
                  )}
                </section>

                {/* 4. Motivo */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                  <h4 className="text-base font-extrabold text-slate-900 mb-4">4. Motivo de la cita</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(formService === "nutrition"
                      ? ["Primera consulta", "Control mensual", "Plan de alimentación", "Evaluación de composición corporal"]
                      : ["Evaluación inicial", "Sesión de tratamiento", "Control de evolución", "Dolor agudo"]
                    ).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setFormReason(m)}
                        className={`px-3 py-2 rounded-xl border text-sm font-semibold cursor-pointer ${
                          formReason === m
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-300 text-slate-700 hover:border-slate-500"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="O escriba el motivo…"
                    className="w-full text-sm p-3 rounded-xl border border-slate-300 bg-white"
                  />
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Notas internas (opcional)"
                    className="w-full mt-3 text-sm p-3 rounded-xl border border-slate-300 bg-white"
                  />
                </section>
              </div>

              {/* Resumen */}
              <aside className="lg:sticky lg:top-6 self-start space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div
                    className={`p-5 text-white ${formService === "nutrition" ? "bg-emerald-600" : formService ? "bg-cyan-700" : "bg-slate-700"}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-white/80">Resumen</span>
                    <p className="text-3xl font-black mt-1">{formSlot}</p>
                    <p className="text-sm capitalize">{fechaLarga(formDate)}</p>
                  </div>
                  <dl className="p-5 space-y-3 text-sm">
                    {[
                      ["Servicio", formService === "nutrition" ? "Nutrición" : formService ? "Fisioterapia" : "—"],
                      ["Alumno", members.find((m) => m.id === formMemberId)?.fullName || "—"],
                      ["Especialista", formStaffName || "—"],
                      ["Lugar", formRoom],
                      ["Duración", "45 minutos"],
                      ["Motivo", formReason || "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="font-bold text-slate-900 text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <button
                  type="submit"
                  disabled={!!detectedFormConflict || !formService}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-extrabold shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Confirmar cita
                </button>
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="w-full py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
              </aside>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
