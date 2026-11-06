import React, { useState } from "react";
import { Utensils, Activity, Sparkles } from "lucide-react";
import { NutritionModule } from "../nutrition/NutritionModule";
import { MeasurementsModule } from "../measurements/MeasurementsModule";
import { useGym } from "../../context/GymContext";

export const NutritionMeasurementsModule = () => {
  const [subTab, setSubTab] = useState("nutrition_plans");
  const { nutritionPlans, bodyAssessments, members } = useGym();

  const totalDietPlans = nutritionPlans.length;
  const totalAssessments = bodyAssessments.length;
  const evaluatedStudentsCount = new Set(bodyAssessments.map((a) => a.memberId))
    .size;

  return (
    <div className="space-y-5">
      {/* Unified Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Área de Salud, Dietética & Cineantropometría</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Nutrición, Dietas & Medidas
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Planes de alimentación personalizados, cálculo de macronutrientes,
              evaluaciones antropométricas con bioimpedancia y seguimiento
              evolutivo del alumno en un solo lugar.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-center shadow-sm">
              <span className="block text-xs text-slate-400 font-medium">
                Planes de Dieta
              </span>
              <span className="text-lg font-bold text-emerald-400">
                {totalDietPlans}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-center shadow-sm">
              <span className="block text-xs text-slate-400 font-medium">
                Evaluaciones
              </span>
              <span className="text-lg font-bold text-cyan-400">
                {totalAssessments}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-center shadow-sm">
              <span className="block text-xs text-slate-400 font-medium">
                Alumnos con Ficha
              </span>
              <span className="text-lg font-bold text-amber-400">
                {evaluatedStudentsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setSubTab("nutrition_plans")}
            className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
              subTab === "nutrition_plans"
                ? "bg-emerald-600 text-white shadow-emerald-900/30"
                : "bg-slate-800/90 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/50"
            }`}
          >
            <Utensils className="w-4 h-4 text-emerald-300" />
            <span>Planes nutricionales</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
              {totalDietPlans}
            </span>
          </button>

          <button
            onClick={() => setSubTab("measurements_bio")}
            className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
              subTab === "measurements_bio"
                ? "bg-cyan-600 text-white shadow-cyan-900/30"
                : "bg-slate-800/90 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/50"
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-300" />
            <span>Evaluación corporal (antropometría y bioimpedancia)</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
              {totalAssessments}
            </span>
          </button>
        </div>
      </div>

      {/* Embedded Sub-views */}
      <div className="transition-opacity duration-200">
        {subTab === "nutrition_plans" && (
          <div>
            <NutritionModule />
          </div>
        )}

        {subTab === "measurements_bio" && (
          <div>
            <MeasurementsModule />
          </div>
        )}
      </div>
    </div>
  );
};
