import React, { useState, useMemo } from "react";
import { PanelComposicion, SiluetaMedidas, edadDe } from "../measurements/VisualMedidas";
import {
  Dumbbell,
  CreditCard,
  Calendar,
  Activity,
  Clock,
  CheckCircle2,
  Utensils,
  HeartPulse,
  FileText,
  Share2,
  Key,
  Ticket,
  User,
  TrendingUp,
  Check,
  CalendarCheck,
} from "lucide-react";
import { fechaCorta } from "../../utils/fecha";
import { textoPlazo } from "../members/DebtDueDate";
import { useGym } from "../../context/GymContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import confetti from "canvas-confetti";
import { hoyISO } from "../../utils/fecha";
import { MiRutina, MiDieta, MiFisioterapia } from "./StudentExtras";
import { CalendarioAsistencias } from "../attendances/CalendarioAsistencias";
import { MiCongelamiento } from "./MiCongelamiento";
import { MisIndicaciones } from "../indicaciones/Indicaciones";

// Lectura segura de los datos de cada evaluación corporal
const fatPct = (a) => a?.bioimpedance?.bodyFatPercentage ?? a?.bodyFatPercentage;
const muscleKg = (a) => a?.bioimpedance?.muscleMassKg ?? a?.muscleMassKg;
const waistCm = (a) => a?.perimeters?.waist ?? a?.measurements?.waistCm;
const armCm = (a) => a?.perimeters?.bicepsFlexedRight ?? a?.measurements?.armsCm;
const thighCm = (a) => a?.perimeters?.thighMid ?? a?.measurements?.thighsCm;

const ESTADOS_CITA = {
  por_atender: "Por atender", atendiendo: "En atención", atendido: "Atendida",
  pospuesto: "Pospuesta", falta: "No asistió", cancelada: "Cancelada",
};
const num = (v) => (v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v));
const dif = (a, b) => (num(a) != null && num(b) != null ? Math.round((num(a) - num(b)) * 10) / 10 : null);
const difTexto = (d, unidad, sufijo) =>
  d == null ? "" : `${d > 0 ? "+" : ""}${d} ${unidad} ${sufijo}`;
const clasificarImc = (v) =>
  v < 18.5 ? "Bajo peso" : v < 25 ? "Peso normal" : v < 30 ? "Sobrepeso" : "Obesidad";

export const StudentPortalModule = ({
  currentSection = "membership",
  onSectionChange,
}) => {
  const {
    currentUser,
    members,
    plans,
    trainers,
    bodyAssessments,
    nutritionPlans,
    physioRecords,
    appointments,
    routines,
    gymConfig,
  } = useGym();

  const [activeTab, setActiveTab] = useState(currentSection);

  // Sync internal tab if prop changes
  React.useEffect(() => {
    if (currentSection) setActiveTab(currentSection);
  }, [currentSection]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onSectionChange) onSectionChange(tab);
  };

  // Ficha del alumno conectado
  const currentMember = useMemo(() => {
    if (currentUser?.memberId) {
      const found = members.find((m) => m.id === currentUser.memberId);
      if (found) return found;
    }
    // El alumno solo recibe su propio registro desde la API
    return members.length === 1 ? members[0] : null;
  }, [currentUser, members]);

  // Current Member's Plan
  const memberPlan = useMemo(() => {
    if (!currentMember) return null;
    return (
      plans.find(
        (p) =>
          p.id === currentMember.planId || p.name === currentMember.planName,
      ) || null
    );
  }, [currentMember, plans]);

  // Current Member's Assigned Trainer
  const assignedTrainer = useMemo(() => {
    if (!currentMember?.assignedTrainerId) return null;
    return trainers.find((t) => t.id === currentMember.assignedTrainerId) || null;
  }, [currentMember, trainers]);

  // Current Member's Assessments
  const memberAssessments = useMemo(() => {
    if (!currentMember) return [];
    // Ordenadas de la más reciente a la más antigua
    return bodyAssessments
      .filter((a) => a.memberId === currentMember.id)
      .sort((x, y) => y.date.localeCompare(x.date));
  }, [currentMember, bodyAssessments]);

  const latestAssessment = memberAssessments[0] || null;
  const previousAssessment = memberAssessments[1] || null;
  const firstAssessment = memberAssessments[memberAssessments.length - 1] || null;
  const cambioPeso = dif(latestAssessment?.weightKg, previousAssessment?.weightKg);
  const cambioGrasa = dif(fatPct(latestAssessment), fatPct(previousAssessment));
  const cambioMusculo = dif(muscleKg(latestAssessment), muscleKg(previousAssessment));
  const totalPeso = memberAssessments.length > 1 ? dif(latestAssessment?.weightKg, firstAssessment?.weightKg) : null;
  const totalGrasa = memberAssessments.length > 1 ? dif(fatPct(latestAssessment), fatPct(firstAssessment)) : null;
  const totalMusculo = memberAssessments.length > 1 ? dif(muscleKg(latestAssessment), muscleKg(firstAssessment)) : null;
  const totalCintura = memberAssessments.length > 1 ? dif(waistCm(latestAssessment), waistCm(firstAssessment)) : null;
  const imcActual = useMemo(() => {
    if (num(latestAssessment?.bmi)) return Number(latestAssessment.bmi).toFixed(1);
    const talla = num(latestAssessment?.heightCm);
    const peso = num(latestAssessment?.weightKg);
    return talla && peso ? (peso / (talla / 100) ** 2).toFixed(1) : null;
  }, [latestAssessment]);

  // Current Member's Nutrition Plan
  const memberNutritionPlan = useMemo(() => {
    if (!currentMember) return null;
    // La dieta vigente más reciente (id nutri-<marca de tiempo> => la mayor es la última creada)
    const suyas = nutritionPlans.filter((np) => String(np.targetStudentId) === String(currentMember.id) && np.active !== false);
    const orden = (np) => `${np.createdDate || ""}|${String(np.id).replace(/\D/g, "").padStart(15, "0")}`;
    return suyas.sort((a, b) => orden(b).localeCompare(orden(a)))[0] || null;
  }, [currentMember, nutritionPlans]);

  // Current Member's Physio Records
  const memberPhysioRecords = useMemo(() => {
    if (!currentMember) return [];
    return physioRecords.filter((r) => r.memberId === currentMember.id);
  }, [currentMember, physioRecords]);

  // Current Member's Appointments
  const memberAppointments = useMemo(() => {
    if (!currentMember) return [];
    return appointments.filter(
      (a) =>
        a.memberId === currentMember.id ||
        a.memberName
          .toLowerCase()
          .includes(currentMember.fullName.toLowerCase()),
    );
  }, [currentMember, appointments]);

  // Days left calculation
  const [progressMetric, setProgressMetric] = useState("combined");

  const studentChartData = useMemo(() => {
    if (memberAssessments.length >= 2) {
      return [...memberAssessments].reverse().map((a, idx) => ({
        fecha: a.date,
        peso: a.weightKg,
        grasaPct: fatPct(a),
        musculoKg: muscleKg(a),
        cintura: waistCm(a),
        brazos: armCm(a),
        piernas: thighCm(a),
        toma: `Toma #${idx + 1}`,
      }));
    }
    // Sin evaluaciones registradas no se muestran datos inventados
    return [];
  }, [memberAssessments, latestAssessment]);

  // Days left calculation
  const daysLeft = useMemo(() => {
    if (!currentMember?.membershipEndDate) return 0;
    const today = new Date(hoyISO());
    const end = new Date(currentMember.membershipEndDate);
    const diff = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  }, [currentMember]);

  if (!currentMember) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-extrabold text-slate-900">Tu usuario aún no está vinculado a una ficha de alumno</h2>
        <p className="text-sm text-slate-500 mt-2">Acércate a recepción para que revisen tu registro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* WELCOME STUDENT BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4 sm:space-x-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shrink-0">
              {currentMember?.photoUrl || currentUser.photoUrl ? (
                <img
                  src={currentMember?.photoUrl || currentUser.photoUrl}
                  alt={currentMember?.fullName}
                  className="w-full h-full object-cover rounded-[14px]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white">
                  {currentMember?.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                  Portal del Alumno
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    currentMember?.status === "frozen"
                      ? "bg-sky-500/20 text-sky-200 border border-sky-400/40"
                      : currentMember?.status === "active"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : currentMember?.status === "expiring_soon"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                  }`}
                >
                  {currentMember?.status === "frozen"
                    ? "❄️ Membresía Congelada"
                    : currentMember?.status === "active"
                    ? "● Membresía Activa"
                    : currentMember?.status === "expiring_soon"
                      ? "⚠️ Por Vencer"
                      : "⛔ Membresía Vencida"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ¡Hola, {currentMember?.fullName.split(" ")[0]}! 👋
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                DNI:{" "}
                <strong className="text-white font-mono">
                  {currentMember?.dni}
                </strong>{" "}
                · Plan:{" "}
                <strong className="text-cyan-300">
                  {currentMember?.planName}
                </strong>
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center min-w-[110px]">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Vigencia
              </span>
              <span
                className={`text-base sm:text-lg font-black ${daysLeft > 7 ? "text-emerald-400" : daysLeft > 0 ? "text-amber-400" : "text-rose-400"}`}
              >
                {daysLeft > 0 ? `${daysLeft} días` : "Vencido"}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center min-w-[110px]">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Peso Actual
              </span>
              <span className="text-base sm:text-lg font-black text-cyan-300">
                {latestAssessment?.weightKg ? `${latestAssessment.weightKg} kg` : "—"}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center min-w-[110px]">
              <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Citas Activas
              </span>
              <span className="text-base sm:text-lg font-black text-purple-300">
                {memberAppointments.filter((a) => !a.status || ["por_atender", "atendiendo", "pospuesto"].includes(a.status)).length}
              </span>
            </div>
          </div>
        </div>

        {/* Saldo pendiente de la membresía */}
        {currentMember?.debt > 0 && (
          <div
            className={`mt-5 rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              currentMember.debtStatus === "vencida"
                ? "bg-rose-500/20 border-rose-400/50"
                : "bg-amber-500/15 border-amber-400/40"
            }`}
          >
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-200">
                {currentMember.debtStatus === "vencida" ? "⛔ Pago pendiente vencido" : "💳 Tienes un saldo pendiente"}
              </p>
              <p className="text-2xl font-black text-white">S/ {currentMember.debt.toFixed(2)}</p>
              {currentMember.debtDueDate && (
                <p className="text-sm text-slate-200">
                  Fecha límite para cancelar: <strong className="text-white">{fechaCorta(currentMember.debtDueDate)}</strong>{" "}
                  <span className={currentMember.debtStatus === "vencida" ? "text-rose-300 font-bold" : "text-amber-200"}>
                    ({textoPlazo(currentMember)})
                  </span>
                </p>
              )}
            </div>
            <a
              href={`https://wa.me/${gymConfig?.gym_whatsapp || ""}?text=${encodeURIComponent(`Hola Recepción ${gymConfig?.gym_nombre || "RADICAL"}, soy ${currentMember?.fullName} (DNI: ${currentMember?.dni}) y deseo cancelar mi saldo pendiente de S/ ${currentMember.debt.toFixed(2)}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold text-center"
            >
              Coordinar pago por WhatsApp
            </a>
          </div>
        )}

        {/* Congelamiento de la membresía */}
        {currentMember?.freeze && (currentMember.freeze.allowed || currentMember.freeze.current) && (
          <MiCongelamiento member={currentMember} gymConfig={gymConfig} />
        )}

        {/* PORTAL NAV TABS */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/10 overflow-x-auto">
          <button
            onClick={() => handleTabClick("membership")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "membership"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4 text-cyan-300" />
            <span>1. Mi Membresía & Matrícula</span>
          </button>

          <button
            onClick={() => handleTabClick("appointments")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "appointments"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-300" />
            <span>2. Notificaciones & Citas (Fisio / Nutri)</span>
            {memberAppointments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-xs font-black">
                {memberAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick("measurements")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "measurements"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-300" />
            <span>3. Mis Medidas & Progreso</span>
          </button>

          <button
            onClick={() => handleTabClick("routine")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "routine"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Dumbbell className="w-4 h-4 text-blue-300" />
            <span>4. Mi Rutina</span>
          </button>

          <button
            onClick={() => handleTabClick("nutrition")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "nutrition"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Utensils className="w-4 h-4 text-emerald-300" />
            <span>5. Mi Alimentación</span>
          </button>

          <button
            onClick={() => handleTabClick("physio")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "physio"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <HeartPulse className="w-4 h-4 text-rose-300" />
            <span>6. Mi Fisioterapia</span>
          </button>

          <button
            onClick={() => handleTabClick("attendance")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "attendance"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400"
                : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-emerald-300" />
            <span>7. Mis Asistencias</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
           TAB 1: MI MEMBRESÍA & MATRÍCULA
          ========================================================================= */}
      {activeTab === "membership" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Digital Member Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-marino-800 via-marino-950 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden [&>*:not(img)]:relative">
              <img src="/logo-radical.png" alt="" className="absolute -right-10 -bottom-10 w-44 opacity-10 rounded-full pointer-events-none" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <img src="/logo-radical.png" alt="RADICAL" className="w-8 h-8 rounded-full" />
                  <span className="rd-marca text-sm">
                    RADICAL
                  </span>
                </div>
                <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                  CARNET DIGITAL DE SOCIO
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/40 border border-blue-400/40 overflow-hidden flex items-center justify-center">
                    {currentMember?.photoUrl ? (
                      <img
                        src={currentMember.photoUrl}
                        alt={currentMember.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">
                      {currentMember?.fullName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      DNI: {currentMember?.dni}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Plan:</span>
                    <strong className="text-cyan-300 font-bold">
                      {currentMember?.planName}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Vigencia:</span>
                    <strong className="text-white font-mono">
                      {currentMember?.membershipStartDate} al{" "}
                      {currentMember?.membershipEndDate}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Saldo pendiente:</span>
                    <strong className={currentMember?.debt > 0 ? "text-rose-300" : "text-emerald-400"}>
                      {currentMember?.debt > 0
                        ? `S/ ${currentMember.debt.toFixed(2)}${currentMember.debtDueDate ? ` · hasta ${fechaCorta(currentMember.debtDueDate)}` : ""}`
                        : "Al día"}
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Estado:</span>
                    <strong
                      className={
                        currentMember?.status === "active"
                          ? "text-emerald-400"
                          : currentMember?.status === "frozen"
                            ? "text-sky-300"
                            : currentMember?.status === "expired"
                              ? "text-rose-400"
                              : "text-amber-400"
                      }
                    >
                      {currentMember?.status === "active"
                        ? "VIGENTE"
                        : currentMember?.status === "frozen"
                          ? "CONGELADO"
                          : currentMember?.status === "expired"
                            ? "VENCIDO"
                            : "POR VENCER"}
                    </strong>
                  </div>
                </div>

                {/* Simulated Barcode / QR */}
                <div className="bg-white rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tu código de asistencia</span>
                  <span className="text-3xl font-black font-mono text-slate-900 tracking-wider">{currentMember?.codeLabel}</span>
                  <span className="text-[11px] text-slate-500">Dilo en recepción al llegar</span>
                </div>
              </div>
            </div>

            {/* Coach Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Tu Entrenador Asignado
              </span>
              <div className="flex items-center space-x-3">
                {assignedTrainer?.photoUrl ? (
                  <img
                    src={assignedTrainer.photoUrl}
                    alt={assignedTrainer.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                    {(assignedTrainer?.name || "?").charAt(0)}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {assignedTrainer?.name || "Por asignar"}
                  </h4>
                  <p className="text-xs text-blue-600 font-semibold">
                    {assignedTrainer?.specialization || ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {assignedTrainer?.availableSchedule ? `Horario: ${assignedTrainer.availableSchedule}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Membership Details & Tuition */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Detalles de Matrícula & Beneficios de tu Plan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Información oficial de tu suscripción en el gimnasio.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-black font-mono">
                  S/ {Number(memberPlan?.price || 0).toFixed(2)} / ciclo
                </span>
              </div>

              {/* Progress Bar of Days */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Progreso del Periodo</span>
                  <span>
                    {daysLeft > 0
                      ? `${daysLeft} días restantes`
                      : "Membresía caducada"}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                    style={{
                      width: `${Math.max(10, Math.min(100, (daysLeft / 30) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Grid of Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 font-bold block uppercase">
                    Fecha de Matrícula
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {String(currentMember?.registrationDate || currentMember?.membershipStartDate || "—").slice(0, 10)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 font-bold block uppercase">
                    Inicio de Vigencia
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {currentMember?.membershipStartDate}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 font-bold block uppercase">
                    Fin de Vigencia
                  </span>
                  <span className="text-xs font-extrabold text-blue-700">
                    {currentMember?.membershipEndDate}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 font-bold block uppercase">
                    Objetivo Deportivo
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 capitalize">
                    {String(currentMember?.objective || "—").replace("_", " ")}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 font-bold block uppercase">
                    Contacto Emergencia
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 truncate">
                    {currentMember?.emergencyContact?.name
                      ? `${currentMember.emergencyContact.name}${currentMember.emergencyContact.relationship ? ` (${currentMember.emergencyContact.relationship})` : ""}`
                      : "No registrado"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 font-bold block uppercase">
                    Teléfono Emergencia
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 font-mono">
                    {currentMember?.emergencyContact?.phone || "—"}
                  </span>
                </div>
              </div>

              {/* Included Benefits */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Beneficios Incluidos en tu Membresía:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(memberPlan?.features || []).map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-2 text-xs text-slate-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Renewal Action */}
              <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-extrabold text-blue-900">
                    ¿Deseas renovar o cambiar tu plan?
                  </h4>
                  <p className="text-xs text-blue-700">
                    Contáctate con Recepción o tu entrenador para promociones de
                    renovación anticipada.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${gymConfig?.gym_whatsapp || ""}?text=${encodeURIComponent(`Hola Recepción ${gymConfig?.gym_nombre || "RADICAL"}, soy el alumno ${currentMember?.fullName} (DNI: ${currentMember?.dni}) y deseo consultar por la renovación de mi plan ${currentMember?.planName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
           TAB 2: NOTIFICACIONES & CITAS (FISIOTERAPIA / NUTRICIÓN)
          ========================================================================= */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Tus Citas Programadas (Fisioterapia & Nutrición)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consultas agendadas con los especialistas del gimnasio.
                  </p>
                </div>
              </div>

              <a
                href={`https://wa.me/${gymConfig?.gym_whatsapp || ""}?text=${encodeURIComponent(`Hola Recepción ${gymConfig?.gym_nombre || "RADICAL"}, soy el alumno ${currentMember?.fullName} (DNI: ${currentMember?.dni}) y deseo agendar una nueva cita con Fisioterapia o Nutrición.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>+ Solicitar Nueva Cita</span>
              </a>
            </div>

            {memberAppointments.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">
                  No tienes citas pendientes agendadas
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Aprovecha las consultas de evaluación postural y nutrición
                  deportiva incluidas en tu membresía.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memberAppointments.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 transition-all shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            app.serviceType === "physiotherapy"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {app.serviceType === "physiotherapy" ? (
                            <HeartPulse className="w-4 h-4" />
                          ) : (
                            <Utensils className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase text-slate-500">
                            {app.serviceType === "physiotherapy"
                              ? "Fisioterapia & Readaptación"
                              : "Nutrición Deportiva"}
                          </span>
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {app.staffName || app.specialistName || "Especialista por confirmar"}
                          </h4>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {ESTADOS_CITA[app.status] || app.status || "Programada"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">
                          Fecha:
                        </span>
                        <strong className="text-slate-800 font-mono">
                          {app.date}
                        </strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">
                          Hora:
                        </span>
                        <strong className="text-blue-700 font-mono">
                          {app.timeSlot || (app.startTime ? `${app.startTime} - ${app.endTime || ""}` : "Por confirmar")}
                        </strong>
                      </div>
                    </div>

                    {(app.reason || app.notes) && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                        Motivo: {app.reason || app.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Clinical Records & PDF Reports */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tus Informes Clínicos & Cartillas de Fisioterapia
                </h3>
                <p className="text-xs text-slate-500">
                  Historial de evaluaciones con escala de dolor y ejercicios
                  asignados.
                </p>
              </div>
            </div>

            {memberPhysioRecords.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Aún no tienes sesiones de fisioterapia registradas.
              </p>
            ) : (
              <div className="space-y-3">
                {memberPhysioRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          Sesión del {rec.date} ({rec.time})
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                          Dolor EVA: {rec.painLevelEVA}/10
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Zonas:{" "}
                        <strong>
                          {rec.affectedZones?.join(", ") || rec.affectedZone}
                        </strong>{" "}
                        · Terapeuta: {rec.physiotherapistName}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        Indicaciones: {rec.homeIndications}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          alert(
                            `Ficha Clínica del ${rec.date}:\nDiagnóstico: ${rec.consultationReason}\nEjercicios: ${rec.exerciseDosage?.customCardTitle || "Movilidad y fortalecimiento"}\nRestricciones: ${rec.gymWorkoutRestrictions}`,
                          );
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ver Resumen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
           TAB 3: MIS MEDIDAS & PROGRESO EN HISTORIAL
          ========================================================================= */}
      {activeTab === "measurements" && (
        <div className="space-y-6">
          {/* Metrics Quick Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Peso Actual
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {latestAssessment?.weightKg ? `${latestAssessment.weightKg} kg` : "—"}
              </span>
              <span className="text-xs text-emerald-600 font-bold block flex items-center">
                {difTexto(cambioPeso, "kg", "desde la evaluación anterior")}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                % Grasa Corporal
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-600">
                {fatPct(latestAssessment) != null ? `${fatPct(latestAssessment)}%` : "—"}
              </span>
              <span className="text-xs text-blue-500 font-semibold block">
                {fatPct(latestAssessment) != null ? (difTexto(cambioGrasa, "%", "vs. anterior") || "Última evaluación") : "Sin evaluación"}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Masa Muscular
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600">
                {muscleKg(latestAssessment) != null ? `${muscleKg(latestAssessment)} kg` : "—"}
              </span>
              <span className="text-xs text-emerald-600 font-bold block flex items-center">
                {difTexto(cambioMusculo, "kg", "masa muscular")}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                IMC Actual
              </span>
              <span className="text-xl sm:text-2xl font-black text-purple-600">
                {imcActual ?? "—"}
              </span>
              <span className="text-xs text-slate-500 font-semibold block">
                {imcActual ? clasificarImc(imcActual) : "Sin datos de peso y talla"}
              </span>
            </div>
          </div>

          {latestAssessment && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Tu composición corporal</h3>
              <PanelComposicion a={latestAssessment} previo={previousAssessment} sexo={currentMember?.gender} edad={edadDe(currentMember?.birthDate)} />
              <h3 className="text-base font-extrabold text-slate-900 pt-2">Tus medidas</h3>
              <SiluetaMedidas p={latestAssessment.perimeters || {}} previo={previousAssessment?.perimeters || {}} sexo={currentMember?.gender} />
            </div>
          )}

          {/* =========================================================================
             INTERACTIVE PROGRESS & EVOLUTION CHART (RECHARTS)
            ========================================================================= */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>Tu Curva de Transformación & Progreso Corporal</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Explora tus avances interactuando con los puntos de evaluación
                  y alternando entre métricas.
                </p>
              </div>

              {/* Metric Selector Buttons */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProgressMetric("combined")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === "combined"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Integral
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMetric("weight")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === "weight"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Peso
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMetric("fat")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === "fat"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  % Grasa
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMetric("muscle")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === "muscle"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Músculo
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMetric("perimeter")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === "perimeter"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cintura
                </button>
              </div>
            </div>

            {/* Interactive Chart Canvas */}
            {studentChartData.length === 0 && (
              <p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
                Tu gráfico de progreso aparecerá cuando tengas al menos dos evaluaciones corporales.
              </p>
            )}
            <div className={`h-64 sm:h-72 w-full pt-2 ${studentChartData.length === 0 ? "hidden" : ""}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={studentChartData}
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="studentWeightGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#0c8794" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#0c8794"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient
                      id="studentFatGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#f59e0b"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient
                      id="studentMuscleGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient
                      id="studentPerimeterGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="fecha"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      padding: "10px 14px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                    }}
                    formatter={(val, name) => [
                      `${val} ${name === "grasaPct" ? "%" : name === "cintura" || name === "brazos" ? "cm" : "kg"}`,
                      name === "peso"
                        ? "Peso Corporal"
                        : name === "grasaPct"
                          ? "% Grasa"
                          : name === "musculoKg"
                            ? "Masa Muscular"
                            : name === "cintura"
                              ? "Cintura"
                              : "Brazos",
                    ]}
                    labelFormatter={(label) => `Fecha de Toma: ${label}`}
                  />

                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    formatter={(val) => (
                      <span className="text-slate-700 font-semibold uppercase text-xs tracking-wider">
                        {val === "peso"
                          ? "Peso (kg)"
                          : val === "grasaPct"
                            ? "% Grasa Corporal"
                            : val === "musculoKg"
                              ? "Masa Muscular (kg)"
                              : val === "cintura"
                                ? "Cintura (cm)"
                                : val}
                      </span>
                    )}
                  />

                  {/* Reference Goal Line */}
                  <ReferenceLine
                    y={
                      progressMetric === "fat"
                        ? 15
                        : progressMetric === "weight"
                          ? 72
                          : undefined
                    }
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value:
                        progressMetric === "fat"
                          ? "Meta Grasa: 15%"
                          : "Meta Peso: 72kg",
                      fill: "#059669",
                      fontSize: 12,
                      position: "top",
                    }}
                  />

                  {(progressMetric === "combined" ||
                    progressMetric === "weight") && (
                    <Area
                      type="monotone"
                      dataKey="peso"
                      name="peso"
                      stroke="#0c8794"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#studentWeightGrad)"
                      activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  )}

                  {(progressMetric === "combined" ||
                    progressMetric === "fat") && (
                    <Area
                      type="monotone"
                      dataKey="grasaPct"
                      name="grasaPct"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#studentFatGrad)"
                      activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  )}

                  {(progressMetric === "combined" ||
                    progressMetric === "muscle") && (
                    <Area
                      type="monotone"
                      dataKey="musculoKg"
                      name="musculoKg"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#studentMuscleGrad)"
                      activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  )}

                  {progressMetric === "perimeter" && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="cintura"
                        name="cintura"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#studentPerimeterGrad)"
                        activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="brazos"
                        name="brazos"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Achievements Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Cambio de Peso
                </span>
                <span className="text-sm font-black text-blue-600">
                  {totalPeso == null ? "—" : `${totalPeso > 0 ? "+" : ""}${totalPeso} kg`}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Cambio de Grasa
                </span>
                <span className="text-sm font-black text-amber-600">
                  {totalGrasa == null ? "—" : `${totalGrasa > 0 ? "+" : ""}${totalGrasa} %`}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Cambio Muscular
                </span>
                <span className="text-sm font-black text-emerald-600">
                  {totalMusculo == null ? "—" : `${totalMusculo > 0 ? "+" : ""}${totalMusculo} kg`}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-400 font-bold uppercase block">
                  Cintura
                </span>
                <span className="text-sm font-black text-purple-600">
                  {totalCintura == null ? "—" : `${totalCintura > 0 ? "+" : ""}${totalCintura} cm`}
                </span>
              </div>
            </div>
          </div>

          {/* Measurements History Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Historial Evolutivo de Cineantropometría & Bioimpedancia
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de tus evaluaciones corporales sesión tras sesión.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {memberAssessments.length} evaluaciones registradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-bold text-slate-500">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Peso</th>
                    <th className="p-3">% Grasa</th>
                    <th className="p-3">Masa Muscular</th>
                    <th className="p-3">Cintura</th>
                    <th className="p-3">Brazos</th>
                    <th className="p-3">Evaluador</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memberAssessments.map((ass) => (
                    <tr
                      key={ass.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-bold text-slate-900 font-mono">
                        {ass.date}
                      </td>
                      <td className="p-3 font-extrabold text-blue-700">
                        {ass.weightKg} kg
                      </td>
                      <td className="p-3">{fatPct(ass)}%</td>
                      <td className="p-3 font-semibold text-emerald-700">
                        {muscleKg(ass)} kg
                      </td>
                      <td className="p-3">
                        {waistCm(ass) ?? "—"} cm
                      </td>
                      <td className="p-3">
                        {armCm(ass) ?? "—"} cm
                      </td>
                      <td className="p-3 text-slate-600">
                        {ass.evaluatorTrainerName || ass.evaluatorName}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Progreso Favorable
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assigned Nutritional Meal Plan (Text + Weight Box) */}
          {memberNutritionPlan && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Tu Plan Nutricional Asignado ({memberNutritionPlan.title})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Meta calórica:{" "}
                      <strong className="text-emerald-700 font-mono">
                        {memberNutritionPlan.dailyCaloriesTarget} kcal
                      </strong>{" "}
                      · Agua recomendada:{" "}
                      <strong className="text-blue-600">
                        {memberNutritionPlan.waterLitersTarget} L/día
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    P: {memberNutritionPlan.proteinsTargetGrams}g
                  </span>
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    C: {memberNutritionPlan.carbsTargetGrams}g
                  </span>
                  <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    G: {memberNutritionPlan.fatsTargetGrams}g
                  </span>
                </div>
              </div>

              {/* Meals cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(memberNutritionPlan.meals || []).map((meal) => (
                  <div
                    key={meal.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          {meal.name}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ({meal.time})
                        </span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 font-mono">
                        {meal.totalCalories} kcal
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {(meal.items || []).map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                        >
                          <span className="font-semibold text-slate-800">
                            {it.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-xs">
                              {it.portion}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {it.calories} kcal
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "routine" && <MisIndicaciones memberId={currentMember?.id} />}
      {activeTab === "routine" && (
        <MiRutina
          routines={routines}
          memberId={currentMember?.id}
          assignedRoutineId={currentMember?.assignedRoutineId}
        />
      )}
      {activeTab === "nutrition" && <MiDieta plan={memberNutritionPlan} sexo={currentMember?.gender} />}
      {activeTab === "physio" && <MiFisioterapia records={memberPhysioRecords} />}
      {activeTab === "attendance" && currentMember && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-lg font-extrabold text-slate-900">📅 Mis asistencias</h3>
            <p className="text-sm text-slate-500">
              Los días en verde viniste al gimnasio; en rosado, días de tu membresía en los que no viniste. Tu código para marcar es{" "}
              <b className="font-mono text-blue-700">{currentMember.codeLabel}</b>.
            </p>
          </div>
          <CalendarioAsistencias memberId={currentMember.id} titulo={false} seguimiento={false} />
        </div>
      )}

    </div>
  );
};
