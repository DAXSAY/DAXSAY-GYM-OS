import React, { useState, useMemo } from "react";
import { PanelComposicion, SiluetaMedidas, edadDe } from "./VisualMedidas";
import {
  Activity,
  Ruler,
  Scale,
  Plus,
  Search,
  User,
  Calendar,
  TrendingUp,
  Share2,
  Printer,
  Trash2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useGym } from "../../context/GymContext";
import { TelWhatsApp } from "../common/TelWhatsApp";
import confetti from "canvas-confetti";
import { hoyISO } from "../../utils/fecha";

const SECCION = "bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs";
const TITULO = "text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4";
const SUB = "block text-xs font-black uppercase tracking-widest text-slate-500 mb-2";
const ETQ = "block text-sm font-bold text-slate-700 mb-1.5";
const CAMPO =
  "w-full text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const Campo = ({ label, unit, value, onChange, step = "1", hint }) => (
  <label className="block">
    <span className={ETQ}>{label}</span>
    <div className="relative">
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${CAMPO} pr-14 font-semibold`}
      />
      {unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
          {unit}
        </span>
      )}
    </div>
    {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
  </label>
);

const Resultado = ({ titulo, valor, detalle, color }) => (
  <div className="flex items-center justify-between bg-slate-800 rounded-xl p-3">
    <div>
      <span className="block text-xs text-slate-400">{titulo}</span>
      <span className="text-sm font-semibold" style={{ color }}>
        {detalle}
      </span>
    </div>
    <span className="text-2xl font-black" style={{ color }}>
      {valor}
    </span>
  </div>
);

export const MeasurementsModule = () => {
  const {
    members,
    trainers,
    staffDirectory,
    currentUser,
    bodyAssessments,
    addBodyAssessment,
    deleteBodyAssessment,
  } = useGym();

  // Active Member Selection
  const [selectedMemberId, setSelectedMemberId] = useState(
    members[0]?.id || "",
  );
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [chartMetricFilter, setChartMetricFilter] = useState("all");

  // New Assessment Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formMemberId, setFormMemberId] = useState("");
  const [activeBodyZone, setActiveBodyZone] = useState("cintura");
  const [activeFocusZone, setActiveFocusZone] = useState(null);
  const [modalMemberSearch, setModalMemberSearch] = useState("");

  // Form Fields
  const [formDate, setFormDate] = useState(hoyISO());
  const [formTime, setFormTime] = useState("");
  const [formEvaluator, setFormEvaluator] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formHeight, setFormHeight] = useState("");

  // Perimeters
  const [perimNeck, setPerimNeck] = useState("");
  const [perimShoulders, setPerimShoulders] = useState("");
  const [perimChest, setPerimChest] = useState("");
  const [perimWaist, setPerimWaist] = useState("");
  const [perimAbdomen, setPerimAbdomen] = useState("");
  const [perimHip, setPerimHip] = useState("");
  const [perimBicepsRelL, setPerimBicepsRelL] = useState("");
  const [perimBicepsRelR, setPerimBicepsRelR] = useState("");
  const [perimBicepsFlexL, setPerimBicepsFlexL] = useState("");
  const [perimBicepsFlexR, setPerimBicepsFlexR] = useState("");
  const [perimForearm, setPerimForearm] = useState("");
  const [perimThighSup, setPerimThighSup] = useState("");
  const [perimThighMid, setPerimThighMid] = useState("");
  const [perimCalf, setPerimCalf] = useState("");

  // Bioimpedance
  const [biaFatPct, setBiaFatPct] = useState("");
  const [biaMusclePct, setBiaMusclePct] = useState("");
  const [biaVisceral, setBiaVisceral] = useState("");
  const [biaWaterPct, setBiaWaterPct] = useState("");
  const [biaBoneKg, setBiaBoneKg] = useState("");
  const [biaBmr, setBiaBmr] = useState("");
  const [biaMetabolicAge, setBiaMetabolicAge] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formGoals, setFormGoals] = useState("");

  // Current Selected Member
  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || members[0];
  }, [members, selectedMemberId]);

  // Current Member in Form
  const formMember = useMemo(() => {
    return members.find((m) => m.id === formMemberId) || selectedMember;
  }, [members, formMemberId, selectedMember]);

  // Previous assessment for member in form
  const formMemberPreviousAssessment = useMemo(() => {
    const list = bodyAssessments
      .filter((a) => a.memberId === formMemberId)
      .sort((a, b) => a.date.localeCompare(b.date));
    return list[list.length - 1] || null;
  }, [bodyAssessments, formMemberId]);

  // Assessments for this student sorted chronologically
  const memberAssessments = useMemo(() => {
    return bodyAssessments
      .filter((a) => a.memberId === selectedMemberId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [bodyAssessments, selectedMemberId]);

  // Current Active Detail Assessment (default to latest)
  const currentDetailAssessment = useMemo(() => {
    if (selectedAssessmentId) {
      const found = memberAssessments.find(
        (a) => a.id === selectedAssessmentId,
      );
      if (found) return found;
    }
    return memberAssessments[memberAssessments.length - 1] || null;
  }, [memberAssessments, selectedAssessmentId]);

  // History Comparisons / Deltas (first vs last)
  const historicalDeltas = useMemo(() => {
    if (memberAssessments.length < 2) return null;
    const first = memberAssessments[0];
    const latest = memberAssessments[memberAssessments.length - 1];

    const weightDelta = Number((latest.weightKg - first.weightKg).toFixed(1));
    const fatPctDelta = Number(
      (
        latest.bioimpedance.bodyFatPercentage -
        first.bioimpedance.bodyFatPercentage
      ).toFixed(1),
    );
    const muscleKgDelta = Number(
      (
        latest.bioimpedance.muscleMassKg - first.bioimpedance.muscleMassKg
      ).toFixed(1),
    );
    const waistDelta = Number(
      (latest.perimeters.waist - first.perimeters.waist).toFixed(1),
    );
    const visceralDelta =
      latest.bioimpedance.visceralFatLevel -
      first.bioimpedance.visceralFatLevel;

    return {
      firstDate: first.date,
      latestDate: latest.date,
      evalCount: memberAssessments.length,
      weightDelta,
      fatPctDelta,
      muscleKgDelta,
      waistDelta,
      visceralDelta,
    };
  }, [memberAssessments]);

  // Chart Dataset
  const chartData = useMemo(() => {
    return memberAssessments.map((a) => ({
      date: a.date.substring(5), // MM-DD
      fullDate: a.date,
      peso: a.weightKg,
      grasaPct: a.bioimpedance.bodyFatPercentage,
      musculoKg: a.bioimpedance.muscleMassKg,
      cintura: a.perimeters.waist,
      cadera: a.perimeters.hip,
      pecho: a.perimeters.chest,
      brazo: a.perimeters.bicepsFlexedRight,
    }));
  }, [memberAssessments]);

  // Auto-calculated fields in real-time for form
  const computedFormMetrics = useMemo(() => {
    const w = Number(formWeight) || 0;
    const hCm = Number(formHeight) || 0;
    const hM = hCm / 100;
    const bmi = w && hM ? Number((w / (hM * hM)).toFixed(2)) : 0;
    let bmiClassification = "Normal";
    if (bmi < 18.5) bmiClassification = "Bajo peso";
    else if (bmi < 25) bmiClassification = "Normal";
    else if (bmi < 30) bmiClassification = "Sobrepeso";
    else if (bmi < 35) bmiClassification = "Obesidad I";
    else if (bmi < 40) bmiClassification = "Obesidad II";
    else bmiClassification = "Obesidad III";

    const wa = Number(perimWaist) || 0;
    const hi = Number(perimHip) || 0;
    const waistHipRatio = wa && hi ? Number((wa / hi).toFixed(2)) : 0;
    let waistHipRisk = "Bajo";
    const isMale = formMember?.gender !== "F";
    if (isMale) {
      if (waistHipRatio > 0.95) waistHipRisk = "Alto";
      else if (waistHipRatio > 0.9) waistHipRisk = "Moderado";
    } else {
      if (waistHipRatio > 0.85) waistHipRisk = "Alto";
      else if (waistHipRatio > 0.8) waistHipRisk = "Moderado";
    }

    const waistHeightRatio = wa && hCm ? Number((wa / hCm).toFixed(2)) : 0;
    const fatKg = Number(((w * (Number(biaFatPct) || 0)) / 100).toFixed(2));
    const muscleKg = Number(((w * (Number(biaMusclePct) || 0)) / 100).toFixed(2));
    const leanMassKg = biaFatPct === "" ? 0 : Number((w - fatKg).toFixed(2));
    const waterLiters = Number(((w * (Number(biaWaterPct) || 0)) / 100).toFixed(1));

    return {
      bmi,
      bmiClassification,
      waistHipRatio,
      waistHipRisk,
      waistHeightRatio,
      fatKg,
      muscleKg,
      leanMassKg,
      waterLiters,
    };
  }, [
    formWeight,
    formHeight,
    perimWaist,
    perimHip,
    biaFatPct,
    biaMusclePct,
    biaWaterPct,
    formMember,
  ]);

  // Helper to load member metrics into the form
  const loadMemberValuesIntoForm = (memberId) => {
    const list = bodyAssessments
      .filter((a) => a.memberId === memberId)
      .sort((a, b) => a.date.localeCompare(b.date));
    const latest = list[list.length - 1];

    if (latest) {
      setFormWeight(latest.weightKg);
      setFormHeight(latest.heightCm);
      setPerimNeck(latest.perimeters.neck);
      setPerimShoulders(latest.perimeters.shoulders);
      setPerimChest(latest.perimeters.chest);
      setPerimWaist(latest.perimeters.waist);
      setPerimAbdomen(latest.perimeters.abdomen);
      setPerimHip(latest.perimeters.hip);
      setPerimBicepsRelL(latest.perimeters.bicepsRelaxedLeft);
      setPerimBicepsRelR(latest.perimeters.bicepsRelaxedRight);
      setPerimBicepsFlexL(latest.perimeters.bicepsFlexedLeft);
      setPerimBicepsFlexR(latest.perimeters.bicepsFlexedRight);
      setPerimForearm(latest.perimeters.forearm);
      setPerimThighSup(latest.perimeters.thighSuperior);
      setPerimThighMid(latest.perimeters.thighMid);
      setPerimCalf(latest.perimeters.calf);

      setBiaFatPct(latest.bioimpedance.bodyFatPercentage);
      setBiaMusclePct(latest.bioimpedance.muscleMassPercentage);
      setBiaVisceral(latest.bioimpedance.visceralFatLevel);
      setBiaWaterPct(latest.bioimpedance.totalBodyWaterPercentage);
      setBiaBoneKg(latest.bioimpedance.boneMassKg);
      setBiaBmr(latest.bioimpedance.basalMetabolicRateKcal);
      setBiaMetabolicAge(latest.bioimpedance.metabolicAge);
    } else {
      [
        setFormWeight, setFormHeight, setPerimNeck, setPerimShoulders, setPerimChest, setPerimWaist,
        setPerimAbdomen, setPerimHip, setPerimBicepsRelL, setPerimBicepsRelR, setPerimBicepsFlexL,
        setPerimBicepsFlexR, setPerimForearm, setPerimThighSup, setPerimThighMid, setPerimCalf,
        setBiaFatPct, setBiaMusclePct, setBiaVisceral, setBiaWaterPct, setBiaBoneKg, setBiaBmr,
        setBiaMetabolicAge,
      ].forEach((fn) => fn(""));
    }
  };

  // Open modal for new assessment
  const handleOpenNewAssessment = (initialMemberId) => {
    const memId = initialMemberId || selectedMemberId || "";
    setFormMemberId(memId);
    loadMemberValuesIntoForm(memId);
    setFormDate(hoyISO());
    setFormTime(
      new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", timeZone: "America/Lima" }),
    );
    setFormNotes("");
    setFormGoals("");
    if (!formEvaluator && currentUser?.fullName) setFormEvaluator(currentUser.fullName);
    setIsNewModalOpen(true);
  };

  // Save new assessment
  const handleSaveAssessment = (e) => {
    e.preventDefault();
    const targetMember = members.find((m) => m.id === formMemberId);
    if (!targetMember) {
      alert("Seleccione el alumno a evaluar.");
      return;
    }
    if (!formWeight || !formHeight) {
      alert("Ingrese al menos el peso y la estatura.");
      return;
    }

    const perimeters = {
      neck: Number(perimNeck),
      shoulders: Number(perimShoulders),
      chest: Number(perimChest),
      waist: Number(perimWaist),
      abdomen: Number(perimAbdomen),
      hip: Number(perimHip),
      bicepsRelaxedLeft: Number(perimBicepsRelL),
      bicepsRelaxedRight: Number(perimBicepsRelR),
      bicepsFlexedLeft: Number(perimBicepsFlexL),
      bicepsFlexedRight: Number(perimBicepsFlexR),
      forearm: Number(perimForearm),
      thighSuperior: Number(perimThighSup),
      thighMid: Number(perimThighMid),
      calf: Number(perimCalf),
    };

    const bioimpedance = {
      bodyFatPercentage: Number(biaFatPct),
      bodyFatKg: computedFormMetrics.fatKg,
      muscleMassPercentage: Number(biaMusclePct),
      muscleMassKg: computedFormMetrics.muscleKg,
      leanMassKg: computedFormMetrics.leanMassKg,
      visceralFatLevel: Number(biaVisceral),
      totalBodyWaterPercentage: Number(biaWaterPct),
      totalBodyWaterLiters: computedFormMetrics.waterLiters,
      boneMassKg: Number(biaBoneKg),
      basalMetabolicRateKcal: Number(biaBmr),
      metabolicAge: Number(biaMetabolicAge),
      physicalRatingScore: biaVisceral <= 7 ? 6 : 4,
    };

    addBodyAssessment({
      memberId: targetMember.id,
      memberName: targetMember.fullName,
      date: formDate,
      time: formTime,
      evaluatorTrainerName: formEvaluator,
      weightKg: Number(formWeight),
      heightCm: Number(formHeight),
      bmi: computedFormMetrics.bmi,
      bmiClassification: computedFormMetrics.bmiClassification,
      waistHipRatio: computedFormMetrics.waistHipRatio,
      waistHipRisk: computedFormMetrics.waistHipRisk,
      waistHeightRatio: computedFormMetrics.waistHeightRatio,
      perimeters,
      bioimpedance,
      notes: formNotes,
      targetGoalNotes: formGoals,
    });

    // Keep active student in sync
    setSelectedMemberId(targetMember.id);

    confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
    setIsNewModalOpen(false);
  };

  // WhatsApp share report
  const handleShareWhatsApp = (assessment) => {
    let cleanPhone = selectedMember?.phone
      ? selectedMember.phone.replace(/[^0-9]/g, "")
      : "";
    if (cleanPhone.length === 9 && !cleanPhone.startsWith("51")) {
      cleanPhone = "51" + cleanPhone;
    }

    let msg = `📊 *INFORME DE EVALUACIÓN FÍSICA & BIOIMPEDANCIA*\n`;
    msg += `¡Hola ${selectedMember?.fullName.split(" ")[0]}!\n\n`;
    msg += `📅 *Fecha de Evaluación:* ${assessment.date} (${assessment.time || ""})\n`;
    msg += `👨‍🏫 *Evaluador:* ${assessment.evaluatorTrainerName}\n\n`;

    msg += `⚖️ *COMPOSICIÓN CORPORAL (BIOIMPEDANCIA):*\n`;
    msg += `• Peso Corporal: *${assessment.weightKg} kg* (IMC: ${assessment.bmi} - ${assessment.bmiClassification})\n`;
    msg += `• % Grasa Corporal: *${assessment.bioimpedance.bodyFatPercentage}%* (${assessment.bioimpedance.bodyFatKg} kg grasa)\n`;
    msg += `• Masa Muscular Esquelética: *${assessment.bioimpedance.muscleMassKg} kg* (${assessment.bioimpedance.muscleMassPercentage}%)\n`;
    msg += `• Grasa Visceral: *Nivel ${assessment.bioimpedance.visceralFatLevel}* (Saludable ≤ 9)\n`;
    msg += `• Agua Corporal Total: *${assessment.bioimpedance.totalBodyWaterPercentage}%* (${assessment.bioimpedance.totalBodyWaterLiters} L)\n`;
    msg += `• Edad Metabólica: *${assessment.bioimpedance.metabolicAge} años*\n\n`;

    msg += `📏 *MEDIDAS ANTROPOMÉTRICAS CLAVE:*\n`;
    msg += `• Cintura: ${assessment.perimeters.waist} cm | Abdomen: ${assessment.perimeters.abdomen} cm\n`;
    msg += `• Cadera / Glúteos: ${assessment.perimeters.hip} cm (ICC: ${assessment.waistHipRatio})\n`;
    msg += `• Pecho / Tórax: ${assessment.perimeters.chest} cm\n`;
    msg += `• Brazo Flexionado: ${assessment.perimeters.bicepsFlexedRight} cm (Der)\n`;
    msg += `• Muslo: ${assessment.perimeters.thighSuperior} cm\n\n`;

    if (historicalDeltas) {
      msg += `📈 *EVOLUCIÓN EN EL HISTORIAL:*\n`;
      msg += `• Variación de Peso: ${historicalDeltas.weightDelta > 0 ? "+" : ""}${historicalDeltas.weightDelta} kg\n`;
      msg += `• Variación % Grasa: ${historicalDeltas.fatPctDelta > 0 ? "+" : ""}${historicalDeltas.fatPctDelta}%\n`;
      msg += `• Variación Músculo: ${historicalDeltas.muscleKgDelta > 0 ? "+" : ""}${historicalDeltas.muscleKgDelta} kg\n`;
      msg += `• Reducción Cintura: ${historicalDeltas.waistDelta > 0 ? "+" : ""}${historicalDeltas.waistDelta} cm\n\n`;
    }

    msg += `💬 *Comentarios del Coach:*\n${assessment.notes || "¡Gran disciplina y constancia!"}\n\n`;
    msg += `¡Sigue con todo en RADICAL! 💪🔥`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
        m.dni.includes(searchMemberQuery),
    );
  }, [members, searchMemberQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Medidas Antropométricas & Bioimpedancia
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Evaluaciones periódicas, composición corporal, comparativas de
                evolución e historial médico-deportivo.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenNewAssessment}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Medición</span>
        </button>
      </div>

      {/* Main Grid: Student Selector Left + History & Details Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Seleccionar Alumno para ver Historial:</span>
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por DNI o nombre..."
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredMembers.map((member) => {
              const isSelected = member.id === selectedMemberId;
              const evalCount = bodyAssessments.filter(
                (a) => a.memberId === member.id,
              ).length;

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    setSelectedMemberId(member.id);
                    setSelectedAssessmentId(null);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/60 border-indigo-500 shadow-xs ring-1 ring-indigo-500"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {member.fullName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        DNI: {member.dni} · {member.planName}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-bold ${
                        evalCount > 0
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {evalCount} tomas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Historical Analysis, Chart & Detailed Sheet */}
        <div className="lg:col-span-8 space-y-6">
          {selectedMember ? (
            <>
              {/* Member Summary Card with Historical Deltas */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      Historial Antropométrico & BIA
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">
                      {selectedMember.fullName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedMember.gender === "F" ? "Mujer" : "Varón"} · DNI{" "}
                      {selectedMember.dni} · <TelWhatsApp tel={selectedMember.phone} />
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">
                      Total Evaluaciones
                    </span>
                    <span className="text-2xl font-black text-indigo-600">
                      {memberAssessments.length}
                    </span>
                  </div>
                </div>

                {/* Progress Deltas (Comparison of Evolution) */}
                {historicalDeltas ? (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Evolución Temporal ({historicalDeltas.firstDate} ➔{" "}
                        {historicalDeltas.latestDate})
                      </span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {/* Peso Delta */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 font-semibold block">
                          Variación Peso
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {historicalDeltas.weightDelta < 0 ? (
                            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-amber-600" />
                          )}
                          <span
                            className={`text-base font-black ${
                              historicalDeltas.weightDelta < 0
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            {historicalDeltas.weightDelta > 0
                              ? `+${historicalDeltas.weightDelta}`
                              : historicalDeltas.weightDelta}{" "}
                            kg
                          </span>
                        </div>
                      </div>

                      {/* Grasa % Delta */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 font-semibold block">
                          % Grasa Corporal
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {historicalDeltas.fatPctDelta < 0 ? (
                            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-rose-600" />
                          )}
                          <span
                            className={`text-base font-black ${
                              historicalDeltas.fatPctDelta < 0
                                ? "text-emerald-700"
                                : "text-rose-700"
                            }`}
                          >
                            {historicalDeltas.fatPctDelta > 0
                              ? `+${historicalDeltas.fatPctDelta}`
                              : historicalDeltas.fatPctDelta}
                            %
                          </span>
                        </div>
                      </div>

                      {/* Músculo Kg Delta */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 font-semibold block">
                          Masa Muscular
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {historicalDeltas.muscleKgDelta > 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-slate-400" />
                          )}
                          <span
                            className={`text-base font-black ${
                              historicalDeltas.muscleKgDelta > 0
                                ? "text-emerald-700"
                                : "text-slate-700"
                            }`}
                          >
                            {historicalDeltas.muscleKgDelta > 0
                              ? `+${historicalDeltas.muscleKgDelta}`
                              : historicalDeltas.muscleKgDelta}{" "}
                            kg
                          </span>
                        </div>
                      </div>

                      {/* Cintura Delta */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 font-semibold block">
                          Cintura
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          {historicalDeltas.waistDelta < 0 ? (
                            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-amber-600" />
                          )}
                          <span
                            className={`text-base font-black ${
                              historicalDeltas.waistDelta < 0
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            {historicalDeltas.waistDelta > 0
                              ? `+${historicalDeltas.waistDelta}`
                              : historicalDeltas.waistDelta}{" "}
                            cm
                          </span>
                        </div>
                      </div>

                      {/* Grasa Visceral Delta */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs text-slate-500 font-semibold block">
                          Grasa Visceral
                        </span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="text-base font-black text-indigo-700">
                            {historicalDeltas.visceralDelta > 0
                              ? `+${historicalDeltas.visceralDelta}`
                              : historicalDeltas.visceralDelta}{" "}
                            nivel
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    💡 Registra al menos dos evaluaciones en el tiempo para que
                    el sistema calcule los avances, reducción de grasa y
                    ganancia de masa magra de este alumno.
                  </div>
                )}

                {/* Evolution Chart with Recharts */}
                {chartData.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-600" />
                          <span>Curva de Evolución & Composición Corporal</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Haz clic en los filtros para aislar peso, grasa, masa
                          muscular o perímetros
                        </p>
                      </div>

                      {/* Filter Buttons */}
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setChartMetricFilter("all")}
                          className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                            chartMetricFilter === "all"
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Integral
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMetricFilter("weight")}
                          className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                            chartMetricFilter === "weight"
                              ? "bg-blue-600 text-white"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Peso
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMetricFilter("composition")}
                          className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                            chartMetricFilter === "composition"
                              ? "bg-emerald-600 text-white"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Grasa vs Músculo
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMetricFilter("perimeters")}
                          className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                            chartMetricFilter === "perimeters"
                              ? "bg-purple-600 text-white"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Perímetros
                        </button>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 13 }}
                            stroke="#94a3b8"
                          />
                          <YAxis
                            tick={{ fontSize: 13 }}
                            stroke="#94a3b8"
                            domain={["dataMin - 3", "dataMax + 3"]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderColor: "#1e293b",
                              borderRadius: "10px",
                              color: "#fff",
                              fontSize: "11px",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                            }}
                            formatter={(val, name) => [
                              `${val} ${name === "grasaPct" ? "%" : name === "cintura" || name === "cadera" || name === "pecho" || name === "brazo" ? "cm" : "kg"}`,
                              name === "peso"
                                ? "Peso Corporal"
                                : name === "musculoKg"
                                  ? "Masa Muscular"
                                  : name === "grasaPct"
                                    ? "% Grasa"
                                    : name === "cintura"
                                      ? "Cintura"
                                      : name === "cadera"
                                        ? "Cadera"
                                        : name === "pecho"
                                          ? "Pecho"
                                          : "Brazo",
                            ]}
                            labelFormatter={(lbl) => `Fecha: ${lbl}`}
                          />

                          <Legend
                            wrapperStyle={{
                              fontSize: "11px",
                              paddingTop: "8px",
                            }}
                          />

                          {(chartMetricFilter === "all" ||
                            chartMetricFilter === "weight") && (
                            <Line
                              type="monotone"
                              dataKey="peso"
                              name="Peso (kg)"
                              stroke="#0c8794"
                              strokeWidth={2.5}
                              dot={{ r: 4 }}
                              activeDot={{
                                r: 7,
                                stroke: "#ffffff",
                                strokeWidth: 2,
                              }}
                            />
                          )}

                          {(chartMetricFilter === "all" ||
                            chartMetricFilter === "composition") && (
                            <>
                              <Line
                                type="monotone"
                                dataKey="musculoKg"
                                name="Masa Muscular (kg)"
                                stroke="#10b981"
                                strokeWidth={2.2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />

                              <Line
                                type="monotone"
                                dataKey="grasaPct"
                                name="% Grasa Corporal"
                                stroke="#f59e0b"
                                strokeWidth={2.2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </>
                          )}

                          {(chartMetricFilter === "all" ||
                            chartMetricFilter === "perimeters") && (
                            <>
                              <Line
                                type="monotone"
                                dataKey="cintura"
                                name="Cintura (cm)"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                dot={{ r: 3 }}
                              />

                              <Line
                                type="monotone"
                                dataKey="brazo"
                                name="Brazo (cm)"
                                stroke="#ec4899"
                                strokeWidth={1.8}
                                dot={{ r: 3 }}
                              />
                            </>
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Assessment Timeline Buttons */}
              {memberAssessments.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    Tomas del Alumno:
                  </span>
                  {memberAssessments.map((a, idx) => {
                    const isSelected = currentDetailAssessment?.id === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAssessmentId(a.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Toma #{idx + 1} ({a.date})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Detailed Sheet of Selected Assessment */}
              {currentDetailAssessment ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Sheet Header */}
                  <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-blue-400 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Evaluación del {currentDetailAssessment.date}{" "}
                          {currentDetailAssessment.time &&
                            `a las ${currentDetailAssessment.time}`}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">
                        Ficha Clínica Antropométrica & Bioimpedancia
                      </h3>
                      <p className="text-xs text-slate-400">
                        Evaluador:{" "}
                        <strong className="text-white">
                          {currentDetailAssessment.evaluatorTrainerName}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleShareWhatsApp(currentDetailAssessment)
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar WhatsApp</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                        title="Imprimir Ficha"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm("¿Eliminar esta evaluación del historial?")
                          ) {
                            deleteBodyAssessment(currentDetailAssessment.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-900/40 hover:bg-red-800 text-red-300 text-xs cursor-pointer"
                        title="Eliminar Toma"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sheet Content */}
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* Composición corporal visual */}
                    {(() => {
                      const idx = memberAssessments.findIndex((x) => x.id === currentDetailAssessment.id);
                      const prev = idx > 0 ? memberAssessments[idx - 1] : null;
                      return (
                        <div className="space-y-3">
                          <PanelComposicion a={currentDetailAssessment} previo={prev} sexo={selectedMember?.gender} edad={edadDe(selectedMember?.birthDate)} />
                          <SiluetaMedidas p={currentDetailAssessment.perimeters || {}} previo={prev?.perimeters || {}} sexo={selectedMember?.gender} />
                        </div>
                      );
                    })()}
                    {/* General Metrics & Bioimpedance Highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Peso & Estatura
                        </span>
                        <div className="text-lg font-black text-slate-900 mt-0.5">
                          {currentDetailAssessment.weightKg} kg
                        </div>
                        <span className="text-xs text-slate-500">
                          {currentDetailAssessment.heightCm} cm
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          IMC (OMS)
                        </span>
                        <div className="text-lg font-black text-slate-900 mt-0.5">
                          {currentDetailAssessment.bmi}
                        </div>
                        <span className="text-xs font-semibold text-blue-600">
                          {currentDetailAssessment.bmiClassification}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          % Grasa Corporal
                        </span>
                        <div className="text-lg font-black text-amber-600 mt-0.5">
                          {
                            currentDetailAssessment.bioimpedance
                              .bodyFatPercentage
                          }
                          %
                        </div>
                        <span className="text-xs text-slate-500">
                          {currentDetailAssessment.bioimpedance.bodyFatKg} kg
                          grasa
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Masa Muscular
                        </span>
                        <div className="text-lg font-black text-emerald-600 mt-0.5">
                          {currentDetailAssessment.bioimpedance.muscleMassKg} kg
                        </div>
                        <span className="text-xs text-slate-500">
                          {
                            currentDetailAssessment.bioimpedance
                              .muscleMassPercentage
                          }
                          % masa esquelética
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Detailed Bioimpedance (BIA) Metrics */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                        <Scale className="w-4 h-4 text-indigo-600" />
                        <span>
                          Composición Corporal por Bioimpedancia Eléctrica (BIA)
                        </span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                          <span className="text-xs text-slate-600">
                            Grasa Visceral
                          </span>
                          <p className="text-base font-black text-slate-900">
                            Nivel{" "}
                            {
                              currentDetailAssessment.bioimpedance
                                .visceralFatLevel
                            }
                          </p>
                          <span className="text-xs text-emerald-700 font-semibold">
                            {currentDetailAssessment.bioimpedance
                              .visceralFatLevel <= 9
                              ? "Rango Saludable (≤ 9)"
                              : "Nivel de Alerta (≥ 10)"}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                          <span className="text-xs text-slate-600">
                            Agua Corporal Total
                          </span>
                          <p className="text-base font-black text-slate-900">
                            {
                              currentDetailAssessment.bioimpedance
                                .totalBodyWaterPercentage
                            }
                            %
                          </p>
                          <span className="text-xs text-slate-500">
                            {
                              currentDetailAssessment.bioimpedance
                                .totalBodyWaterLiters
                            }{" "}
                            Litros hidratación
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                          <span className="text-xs text-slate-600">
                            Masa Libre de Grasa (Magra)
                          </span>
                          <p className="text-base font-black text-slate-900">
                            {currentDetailAssessment.bioimpedance.leanMassKg} kg
                          </p>
                          <span className="text-xs text-slate-500">
                            Masa ósea:{" "}
                            {currentDetailAssessment.bioimpedance.boneMassKg} kg
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                          <span className="text-xs text-slate-600">
                            Tasa Metabólica Basal (BMR)
                          </span>
                          <p className="text-base font-black text-slate-900">
                            {
                              currentDetailAssessment.bioimpedance
                                .basalMetabolicRateKcal
                            }{" "}
                            kcal
                          </p>
                          <span className="text-xs text-slate-500">
                            Gasto en reposo
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                          <span className="text-xs text-slate-600">
                            Edad Metabólica
                          </span>
                          <p className="text-base font-black text-slate-900">
                            {currentDetailAssessment.bioimpedance.metabolicAge}{" "}
                            años
                          </p>
                          <span className="text-xs text-emerald-700 font-semibold">
                            Condición celular óptima
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                          <span className="text-xs text-slate-600">
                            Índice Cintura - Cadera (ICC)
                          </span>
                          <p className="text-base font-black text-slate-900">
                            {currentDetailAssessment.waistHipRatio}
                          </p>
                          <span
                            className={`text-xs font-bold ${
                              currentDetailAssessment.waistHipRisk === "Bajo"
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            Riesgo CV: {currentDetailAssessment.waistHipRisk}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Detailed Anthropometric Perimeters */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                        <Ruler className="w-4 h-4 text-blue-600" />
                        <span>Perímetros Antropométricos (cm)</span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Cuello:
                          </span>
                          <strong className="text-slate-900 font-black">
                            {currentDetailAssessment.perimeters.neck} cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Hombros:
                          </span>
                          <strong className="text-slate-900 font-black">
                            {currentDetailAssessment.perimeters.shoulders} cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Pecho / Tórax:
                          </span>
                          <strong className="text-slate-900 font-black">
                            {currentDetailAssessment.perimeters.chest} cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Cintura (mínima):
                          </span>
                          <strong className="text-slate-900 font-black text-blue-600">
                            {currentDetailAssessment.perimeters.waist} cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Abdomen (umbilical):
                          </span>
                          <strong className="text-slate-900 font-black">
                            {currentDetailAssessment.perimeters.abdomen} cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Cadera / Glúteos:
                          </span>
                          <strong className="text-slate-900 font-black text-blue-600">
                            {currentDetailAssessment.perimeters.hip} cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Bíceps Relajado (I / D):
                          </span>
                          <strong className="text-slate-900 font-bold">
                            {
                              currentDetailAssessment.perimeters
                                .bicepsRelaxedLeft
                            }{" "}
                            /{" "}
                            {
                              currentDetailAssessment.perimeters
                                .bicepsRelaxedRight
                            }{" "}
                            cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Bíceps Flexionado (I / D):
                          </span>
                          <strong className="text-slate-900 font-bold">
                            {
                              currentDetailAssessment.perimeters
                                .bicepsFlexedLeft
                            }{" "}
                            /{" "}
                            {
                              currentDetailAssessment.perimeters
                                .bicepsFlexedRight
                            }{" "}
                            cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Antebrazo:
                          </span>
                          <strong className="text-slate-900 font-bold">
                            {currentDetailAssessment.perimeters.forearm} cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Muslo Superior:
                          </span>
                          <strong className="text-slate-900 font-bold">
                            {currentDetailAssessment.perimeters.thighSuperior}{" "}
                            cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Muslo Medio:
                          </span>
                          <strong className="text-slate-900 font-bold">
                            {currentDetailAssessment.perimeters.thighMid} cm
                          </strong>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 block text-xs">
                            Pantorrilla:
                          </span>
                          <strong className="text-slate-900 font-bold">
                            {currentDetailAssessment.perimeters.calf} cm
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Notes & Goals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold text-slate-600 block mb-1">
                          Observaciones del Evaluador
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {currentDetailAssessment.notes ||
                            "Sin anotaciones adicionales registradas."}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold text-slate-600 block mb-1">
                          Objetivos Próxima Medición
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {currentDetailAssessment.targetGoalNotes ||
                            "Mantener constancia y registrar avances en 4 semanas."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  No hay evaluaciones registradas para este alumno. Presiona
                  "Registrar Nueva Medición" para iniciar su historial.
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              Selecciona un alumno para revisar su historial antropométrico y de
              bioimpedancia.
            </div>
          )}
        </div>
      </div>

      {/* EVALUACIÓN ANTROPOMÉTRICA: PANTALLA COMPLETA */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white px-4 sm:px-8 py-4 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                  Evaluación antropométrica y bioimpedancia
                </span>
                <h3 className="text-lg font-extrabold truncate">
                  {members.find((m) => m.id === formMemberId)?.fullName || "Nueva evaluación"}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
              title="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSaveAssessment} className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* COLUMNA IZQUIERDA: DATOS */}
              <div className="xl:col-span-2 space-y-6">
                {/* 1. Datos generales */}
                <section className={SECCION}>
                  <h4 className={TITULO}>
                    <User className="w-5 h-5 text-blue-600" /> 1. Datos de la evaluación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className={ETQ}>Alumno *</label>
                      <select
                        value={formMemberId}
                        onChange={(e) => {
                          setFormMemberId(e.target.value);
                          loadMemberValuesIntoForm(e.target.value);
                        }}
                        required
                        className={CAMPO}
                      >
                        <option value="">Seleccione…</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName} · DNI {m.dni}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={ETQ}>Fecha</label>
                      <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className={CAMPO} />
                    </div>
                    <div>
                      <label className={ETQ}>Hora</label>
                      <input type="text" value={formTime} onChange={(e) => setFormTime(e.target.value)} className={CAMPO} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={ETQ}>Evaluador</label>
                      <input
                        list="lista-evaluadores"
                        value={formEvaluator}
                        onChange={(e) => setFormEvaluator(e.target.value)}
                        placeholder="Nombre del evaluador"
                        className={CAMPO}
                      />
                      <datalist id="lista-evaluadores">
                        {currentUser?.fullName && <option value={currentUser.fullName} />}
                        {trainers.map((t) => (
                          <option key={t.id} value={t.name} />
                        ))}
                      {staffDirectory.map((p) => (
                      <option key={`st-${p.id}`} value={p.fullName} />
                    ))}
                  </datalist>
                    </div>
                    <Campo label="Peso *" unit="kg" value={formWeight} onChange={setFormWeight} step="0.1" />
                    <Campo label="Estatura *" unit="cm" value={formHeight} onChange={setFormHeight} step="0.5" />
                  </div>
                  {formMemberPreviousAssessment && (
                    <p className="mt-3 text-sm text-slate-500">
                      Se precargaron los valores de la última evaluación ({formMemberPreviousAssessment.date}). Actualice
                      solo lo que cambió.
                    </p>
                  )}
                </section>

                {/* 2. Bioimpedancia */}
                <section className={SECCION}>
                  <h4 className={TITULO}>
                    <Scale className="w-5 h-5 text-violet-600" /> 2. Composición corporal (báscula de bioimpedancia)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Campo label="Grasa corporal" unit="%" value={biaFatPct} onChange={setBiaFatPct} step="0.1" />
                    <Campo label="Masa muscular" unit="%" value={biaMusclePct} onChange={setBiaMusclePct} step="0.1" />
                    <Campo label="Agua corporal" unit="%" value={biaWaterPct} onChange={setBiaWaterPct} step="0.1" />
                    <Campo label="Grasa visceral" unit="nivel" value={biaVisceral} onChange={setBiaVisceral} />
                    <Campo label="Masa ósea" unit="kg" value={biaBoneKg} onChange={setBiaBoneKg} step="0.1" />
                    <Campo label="Metabolismo basal" unit="kcal" value={biaBmr} onChange={setBiaBmr} />
                    <Campo label="Edad metabólica" unit="años" value={biaMetabolicAge} onChange={setBiaMetabolicAge} />
                  </div>
                  {biaVisceral !== "" && (
                    <div className="mt-5">
                      <div className="flex justify-between text-sm font-semibold mb-1.5">
                        <span className="text-slate-700">Grasa visceral</span>
                        <span
                          className={
                            Number(biaVisceral) <= 9
                              ? "text-emerald-600"
                              : Number(biaVisceral) <= 14
                                ? "text-amber-600"
                                : "text-rose-600"
                          }
                        >
                          Nivel {biaVisceral} ·{" "}
                          {Number(biaVisceral) <= 9 ? "Saludable" : Number(biaVisceral) <= 14 ? "Elevado" : "Muy elevado"}
                        </span>
                      </div>
                      <div className="relative h-3 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500" style={{ width: "30%" }} />
                        <div className="bg-amber-400" style={{ width: "17%" }} />
                        <div className="bg-rose-500 flex-1" />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-4 border-slate-900"
                          style={{ left: `calc(${Math.min(100, (Number(biaVisceral) / 30) * 100)}% - 8px)` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>1</span>
                        <span>9</span>
                        <span>14</span>
                        <span>30</span>
                      </div>
                    </div>
                  )}
                </section>

                {/* 3. Perímetros */}
                <section className={SECCION}>
                  <h4 className={TITULO}>
                    <Ruler className="w-5 h-5 text-cyan-600" /> 3. Perímetros corporales (cinta métrica, cm)
                  </h4>
                  <div className="space-y-5">
                    <div>
                      <span className={SUB}>Tronco</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Campo label="Cuello" unit="cm" value={perimNeck} onChange={setPerimNeck} step="0.1" />
                        <Campo label="Hombros" unit="cm" value={perimShoulders} onChange={setPerimShoulders} step="0.1" />
                        <Campo label="Pecho / tórax" unit="cm" value={perimChest} onChange={setPerimChest} step="0.1" />
                        <Campo
                          label="Cintura mínima"
                          unit="cm"
                          value={perimWaist}
                          onChange={setPerimWaist}
                          step="0.1"
                          hint="Punto más estrecho"
                        />
                        <Campo
                          label="Abdomen"
                          unit="cm"
                          value={perimAbdomen}
                          onChange={setPerimAbdomen}
                          step="0.1"
                          hint="A nivel del ombligo"
                        />
                        <Campo
                          label="Cadera / glúteos"
                          unit="cm"
                          value={perimHip}
                          onChange={setPerimHip}
                          step="0.1"
                          hint="Máxima protuberancia glútea"
                        />
                      </div>
                    </div>
                    <div>
                      <span className={SUB}>Miembro superior</span>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Campo label="Brazo relajado I" unit="cm" value={perimBicepsRelL} onChange={setPerimBicepsRelL} step="0.1" />
                        <Campo label="Brazo relajado D" unit="cm" value={perimBicepsRelR} onChange={setPerimBicepsRelR} step="0.1" />
                        <Campo label="Brazo contraído I" unit="cm" value={perimBicepsFlexL} onChange={setPerimBicepsFlexL} step="0.1" />
                        <Campo label="Brazo contraído D" unit="cm" value={perimBicepsFlexR} onChange={setPerimBicepsFlexR} step="0.1" />
                        <Campo label="Antebrazo" unit="cm" value={perimForearm} onChange={setPerimForearm} step="0.1" />
                      </div>
                    </div>
                    <div>
                      <span className={SUB}>Miembro inferior</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Campo label="Muslo superior" unit="cm" value={perimThighSup} onChange={setPerimThighSup} step="0.1" />
                        <Campo label="Muslo medio" unit="cm" value={perimThighMid} onChange={setPerimThighMid} step="0.1" />
                        <Campo label="Pantorrilla" unit="cm" value={perimCalf} onChange={setPerimCalf} step="0.1" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Observaciones */}
                <section className={SECCION}>
                  <h4 className={TITULO}>4. Observaciones y objetivos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={ETQ}>Observaciones</label>
                      <textarea
                        rows={3}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Condiciones de la medición, hidratación, comentarios…"
                        className={CAMPO}
                      />
                    </div>
                    <div>
                      <label className={ETQ}>Objetivo para la próxima evaluación</label>
                      <textarea
                        rows={3}
                        value={formGoals}
                        onChange={(e) => setFormGoals(e.target.value)}
                        placeholder="Ej. Reducir 2 cm de cintura y bajar 1,5 % de grasa en 6 semanas"
                        className={CAMPO}
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* COLUMNA DERECHA: RESULTADOS CALCULADOS (fija) */}
              <aside className="space-y-4 xl:sticky xl:top-6 self-start">
                <div className="bg-slate-900 text-white rounded-2xl p-5">
                  <h4 className="text-sm font-black uppercase tracking-widest text-cyan-300 mb-4">
                    Resultados calculados
                  </h4>
                  <div className="space-y-3">
                    <Resultado
                      titulo="IMC"
                      valor={computedFormMetrics.bmi || "–"}
                      detalle={computedFormMetrics.bmi ? computedFormMetrics.bmiClassification : "Falta peso y estatura"}
                      color={
                        !computedFormMetrics.bmi
                          ? "#64748b"
                          : computedFormMetrics.bmi < 18.5 || computedFormMetrics.bmi >= 30
                            ? "#f43f5e"
                            : computedFormMetrics.bmi >= 25
                              ? "#f59e0b"
                              : "#10b981"
                      }
                    />
                    <Resultado
                      titulo="Índice cintura / cadera"
                      valor={computedFormMetrics.waistHipRatio || "–"}
                      detalle={computedFormMetrics.waistHipRatio ? `Riesgo ${computedFormMetrics.waistHipRisk.toLowerCase()}` : "Falta cintura y cadera"}
                      color={
                        computedFormMetrics.waistHipRisk === "Alto"
                          ? "#f43f5e"
                          : computedFormMetrics.waistHipRisk === "Moderado"
                            ? "#f59e0b"
                            : "#10b981"
                      }
                    />
                    <Resultado
                      titulo="Índice cintura / talla"
                      valor={computedFormMetrics.waistHeightRatio || "–"}
                      detalle={
                        computedFormMetrics.waistHeightRatio
                          ? computedFormMetrics.waistHeightRatio < 0.5
                            ? "Saludable (< 0,50)"
                            : "Riesgo cardiometabólico (≥ 0,50)"
                          : "Falta cintura y estatura"
                      }
                      color={computedFormMetrics.waistHeightRatio >= 0.5 ? "#f43f5e" : "#10b981"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700">
                    {[
                      ["Masa grasa", computedFormMetrics.fatKg, "kg"],
                      ["Masa muscular", computedFormMetrics.muscleKg, "kg"],
                      ["Masa libre de grasa", computedFormMetrics.leanMassKg, "kg"],
                      ["Agua corporal", computedFormMetrics.waterLiters, "L"],
                    ].map(([t, v, u]) => (
                      <div key={t} className="bg-slate-800 rounded-xl p-3">
                        <span className="block text-xs text-slate-400">{t}</span>
                        <span className="text-xl font-black">
                          {v ? v : "–"} <span className="text-sm text-slate-400">{v ? u : ""}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {formMemberPreviousAssessment && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">
                      Cambio vs. {formMemberPreviousAssessment.date}
                    </h4>
                    {[
                      ["Peso", formWeight, formMemberPreviousAssessment.weightKg, "kg"],
                      ["Grasa", biaFatPct, formMemberPreviousAssessment.bioimpedance?.bodyFatPercentage, "%"],
                      ["Músculo", computedFormMetrics.muscleKg, formMemberPreviousAssessment.bioimpedance?.muscleMassKg, "kg", true],
                      ["Cintura", perimWaist, formMemberPreviousAssessment.perimeters?.waist, "cm"],
                    ].map(([t, now, prev, u, upIsGood]) => {
                      const d = now !== "" && prev != null ? Number((Number(now) - Number(prev)).toFixed(1)) : null;
                      const good = d == null || d === 0 ? null : upIsGood ? d > 0 : d < 0;
                      return (
                        <div key={t} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <span className="text-sm font-semibold text-slate-700">{t}</span>
                          <span
                            className={`text-sm font-black ${
                              good == null ? "text-slate-500" : good ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {d == null ? "–" : `${d > 0 ? "+" : ""}${d} ${u}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold shadow-md cursor-pointer"
                  >
                    Guardar evaluación
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="w-full py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
