import React, { useState, useMemo, useEffect } from "react";
import {
  Utensils,
  Plus,
  Search,
  User,
  Flame,
  Droplet,
  Pill,
  Share2,
  Printer,
  Edit3,
  Trash2,
  Calculator,
  Sparkles,
  Clock,
  Info,
  X,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import confetti from "canvas-confetti";
import {
  EditorPlatos, VistaPlatos, PlatoSVG, porcionesBase, LeyendaPlato, GuiaPorciones, TablaCarbosEjercicio, MODELOS_PLATO, MANOS, MANOS_EXTRA, normalizarPlato, platosDePlan,
} from "./PlatoNutricional";
import { EditorComidas, totalesComida } from "./EditorComidas";
import { CatalogoAlimentos } from "./CatalogoAlimentos";

const OBJECTIVE_LABELS = {
  hipertrofia: "Hipertrofia Muscular",
  perdida_peso: "Pérdida de Grasa / Déficit",
  fuerza: "Fuerza & Rendimiento",
  resistencia: "Resistencia / Cardio",
  tonificacion: "Tonificación / Definición",
  salud_rehabilitacion: "Salud & Mantenimiento",
};

const OBJECTIVE_COLORS = {
  hipertrofia: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  perdida_peso: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  fuerza: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  resistencia: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  tonificacion: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  salud_rehabilitacion: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

const COMMON_FOODS = [
  {
    name: "Pechuga de Pollo a la plancha",
    portion: "150g",
    calories: 247,
    proteins: 46,
    carbs: 0,
    fats: 5,
  },
  {
    name: "Huevos enteros cocidos/revueltos",
    portion: "2 unidades",
    calories: 143,
    proteins: 13,
    carbs: 1,
    fats: 10,
  },
  {
    name: "Claras de huevo",
    portion: "4 unidades (130g)",
    calories: 68,
    proteins: 14,
    carbs: 1,
    fats: 0.2,
  },
  {
    name: "Avena en hojuelas",
    portion: "60g",
    calories: 225,
    proteins: 8,
    carbs: 41,
    fats: 4,
  },
  {
    name: "Arroz blanco cocido",
    portion: "150g",
    calories: 195,
    proteins: 4,
    carbs: 43,
    fats: 0.5,
  },
  {
    name: "Batido Whey Protein Isolate",
    portion: "1 scoop (30g)",
    calories: 115,
    proteins: 25,
    carbs: 2,
    fats: 1,
  },
  {
    name: "Filete de Salmón fresco",
    portion: "150g",
    calories: 312,
    proteins: 30,
    carbs: 0,
    fats: 19,
  },
  {
    name: "Lata de Atún al agua",
    portion: "1 lata (120g)",
    calories: 130,
    proteins: 28,
    carbs: 0,
    fats: 1,
  },
  {
    name: "Camote o Papa cocida",
    portion: "150g",
    calories: 130,
    proteins: 2,
    carbs: 30,
    fats: 0.2,
  },
  {
    name: "Palta / Aguacate",
    portion: "60g",
    calories: 96,
    proteins: 1,
    carbs: 5,
    fats: 9,
  },
  {
    name: "Yogurt Griego natural 0%",
    portion: "150g",
    calories: 88,
    proteins: 15,
    carbs: 6,
    fats: 0.3,
  },
  {
    name: "Almendras / Frutos secos",
    portion: "25g",
    calories: 145,
    proteins: 5,
    carbs: 5,
    fats: 12,
  },
  {
    name: "Plátano mediano",
    portion: "1 unidad (100g)",
    calories: 89,
    proteins: 1,
    carbs: 23,
    fats: 0.3,
  },
];

export const NutritionModule = () => {
  const {
    nutritionPlans,
    members,
    trainers,
    staffDirectory,
    currentUser,
    addNutritionPlan,
    updateNutritionPlan,
    deleteNutritionPlan,
  } = useGym();
  const [selectedPlanId, setSelectedPlanId] = useState(
    nutritionPlans[0]?.id || "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterObjective, setFilterObjective] = useState("all");
  const [viewMode, setViewMode] = useState("plans");

  // Modal State for New/Edit Plan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formStudentId, setFormStudentId] = useState("");
  const [formObjective, setFormObjective] = useState("hipertrofia");
  const [formDailyCalories, setFormDailyCalories] = useState(2400);
  const [formProteins, setFormProteins] = useState(160);
  const [formCarbs, setFormCarbs] = useState(260);
  const [formFats, setFormFats] = useState(65);
  const [formWater, setFormWater] = useState(3.0);
  const [formTrainerName, setFormTrainerName] = useState("");
  const [formSupplements, setFormSupplements] = useState("");
  const [formHydration, setFormHydration] = useState("");
  const [formRecommendations, setFormRecommendations] = useState("");
  const comidasVacias = () =>
    [
      ["Desayuno", "07:30"],
      ["Media mañana", "10:30"],
      ["Almuerzo", "13:30"],
      ["Merienda / post-entreno", "17:30"],
      ["Cena", "20:30"],
    ].map(([name, time], i) => ({
      id: `m${Date.now()}-${i}`,
      name,
      time,
      totalCalories: 0,
      totalProteins: 0,
      totalCarbs: 0,
      totalFats: 0,
      items: [],
    }));
  const [formMeals, setFormMeals] = useState([]);
  const [formPlates, setFormPlates] = useState([]); // platos que el nutricionista asigna (con porciones con la mano)
  const [guiaPeso, setGuiaPeso] = useState(70);
  const sexoAlumno = (id) => members.find((m) => m.id === id)?.gender;
  // Al elegir al alumno, los platos que aún tienen las porciones base del otro sexo se ajustan
  useEffect(() => {
    if (!isModalOpen || !formStudentId) return;
    const sexo = sexoAlumno(formStudentId);
    const base = porcionesBase(sexo);
    const otra = porcionesBase(sexo === "F" ? "M" : "F");
    const igual = (p, b) => p.palms === b.palms && p.fists === b.fists && p.hands === b.hands && p.thumbs === b.thumbs;
    setFormPlates((prev) => prev.map((p) => (igual(p, otra) ? { ...p, ...base } : p)));
  }, [formStudentId]);

  // Calculator State
  const [calcGender, setCalcGender] = useState("M");
  const [calcWeight, setCalcWeight] = useState(75);
  const [calcHeight, setCalcHeight] = useState(175);
  const [calcAge, setCalcAge] = useState(28);
  const [calcActivity, setCalcActivity] = useState(1.55); // Moderately active
  const [calcGoal, setCalcGoal] = useState("hipertrofia");
  const [calcSelectedStudentId, setCalcSelectedStudentId] = useState("");

  // Selected Plan Object
  const selectedPlan = useMemo(() => {
    return (
      nutritionPlans.find((p) => p.id === selectedPlanId) || nutritionPlans[0]
    );
  }, [nutritionPlans, selectedPlanId]);

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return nutritionPlans.filter((plan) => {
      const matchesSearch =
        plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plan.targetStudentName &&
          plan.targetStudentName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (plan.trainerName &&
          plan.trainerName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesObjective =
        filterObjective === "all" || plan.objective === filterObjective;
      return matchesSearch && matchesObjective;
    });
  }, [nutritionPlans, searchQuery, filterObjective]);

  // Calculator Calculations (Mifflin - St Jeor)
  const calculatedMetrics = useMemo(() => {
    // BMR
    let bmr = 10 * calcWeight + 6.25 * calcHeight - 5 * calcAge;
    bmr = calcGender === "M" ? bmr + 5 : bmr - 161;

    // TDEE
    const tdee = Math.round(bmr * calcActivity);

    // Goal adjustment
    let targetCalories = tdee;
    if (calcGoal === "perdida_peso") targetCalories = Math.round(tdee - 450);
    else if (calcGoal === "tonificacion")
      targetCalories = Math.round(tdee - 250);
    else if (calcGoal === "hipertrofia")
      targetCalories = Math.round(tdee + 350);
    else if (calcGoal === "fuerza") targetCalories = Math.round(tdee + 450);

    // Protein: 2.0g/kg for strength/hypertrophy, 1.8g/kg for weight loss
    const proteinFactor =
      calcGoal === "hipertrofia" || calcGoal === "fuerza" ? 2.2 : 2.0;
    const proteinsGrams = Math.round(calcWeight * proteinFactor);
    const proteinKcal = proteinsGrams * 4;

    // Fats: 25% of target calories
    const fatsKcal = targetCalories * 0.25;
    const fatsGrams = Math.round(fatsKcal / 9);

    // Carbs: Remaining calories
    const remainingKcal = Math.max(0, targetCalories - proteinKcal - fatsKcal);
    const carbsGrams = Math.round(remainingKcal / 4);

    return {
      bmr: Math.round(bmr),
      tdee,
      targetCalories,
      proteinsGrams,
      fatsGrams,
      carbsGrams,
      waterLiters: Number((calcWeight * 0.04).toFixed(1)),
    };
  }, [calcGender, calcWeight, calcHeight, calcAge, calcActivity, calcGoal]);

  // Quick populate calculator from a member
  const handleSelectMemberForCalc = (memberId) => {
    setCalcSelectedStudentId(memberId);
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (member.objective) setCalcGoal(member.objective);
    if (member.gender === "F") setCalcGender("F");
    else setCalcGender("M");

    // Estimate age from birthDate
    if (member.birthDate) {
      const birthYear = new Date(member.birthDate).getFullYear();
      const age = new Date().getFullYear() - birthYear;
      if (age > 10 && age < 90) setCalcAge(age);
    }
  };

  // Open modal for new plan
  const handleOpenCreateModal = (fromCalculator = false) => {
    setEditingPlanId(null);
    if (fromCalculator) {
      const student = members.find((m) => m.id === calcSelectedStudentId);
      setFormTitle(
        `Plan Personalizado - ${student ? student.fullName : "Nuevo Alumno"} (${calculatedMetrics.targetCalories} kcal)`,
      );
      setFormStudentId(calcSelectedStudentId);
      setFormObjective(calcGoal);
      setFormDailyCalories(calculatedMetrics.targetCalories);
      setFormProteins(calculatedMetrics.proteinsGrams);
      setFormCarbs(calculatedMetrics.carbsGrams);
      setFormFats(calculatedMetrics.fatsGrams);
      setFormWater(calculatedMetrics.waterLiters);
    } else {
      setFormTitle("");
      setFormStudentId("");
      setFormObjective("hipertrofia");
      setFormDailyCalories(0);
      setFormProteins(0);
      setFormCarbs(0);
      setFormFats(0);
      setFormWater(0);
    }
    setFormMeals(comidasVacias());
    setFormPlates([normalizarPlato({ name: "Almuerzo", time: "13:30" }, sexoAlumno(fromCalculator ? calcSelectedStudentId : ""))]);
    setFormSupplements("");
    setFormHydration("");
    setFormRecommendations("");
    if (!formTrainerName) setFormTrainerName(currentUser?.fullName || trainers[0]?.name || "");
    setIsModalOpen(true);
  };

  // Open modal to edit existing plan
  const handleOpenEditModal = (plan) => {
    setEditingPlanId(plan.id);
    setFormTitle(plan.title);
    setFormStudentId(plan.targetStudentId || "");
    setFormObjective(plan.objective);
    setFormDailyCalories(plan.dailyCaloriesTarget);
    setFormProteins(plan.proteinsTargetGrams);
    setFormCarbs(plan.carbsTargetGrams);
    setFormFats(plan.fatsTargetGrams);
    setFormWater(plan.waterLitersTarget);
    setFormTrainerName(plan.trainerName || "");
    setFormSupplements((plan.supplements || []).join(", "));
    setFormHydration(plan.hydrationGuidelines || "");
    setFormRecommendations(plan.recommendations || "");
    setFormMeals((plan.meals || []).map(totalesComida));
    setFormPlates(platosDePlan(plan, sexoAlumno(plan.targetStudentId)));
    setIsModalOpen(true);
  };

  // Save Plan
  const handleSavePlan = (e) => {
    e.preventDefault();
    const student = members.find((m) => m.id === formStudentId);
    const supplementsArray = formSupplements
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const planPayload = {
      title: formTitle,
      targetStudentId: formStudentId || undefined,
      targetStudentName: student ? student.fullName : undefined,
      objective: formObjective,
      dailyCaloriesTarget: Math.round(Number(formProteins) * 4 + Number(formCarbs) * 4 + Number(formFats) * 9) || Number(formDailyCalories),
      proteinsTargetGrams: Number(formProteins),
      carbsTargetGrams: Number(formCarbs),
      fatsTargetGrams: Number(formFats),
      waterLitersTarget: Number(formWater),
      trainerName: formTrainerName,
      supplements: supplementsArray,
      hydrationGuidelines: formHydration,
      recommendations: formRecommendations,
      meals: formMeals,
      plates: formPlates.map((p) => normalizarPlato(p, student?.gender)),
      plate: undefined,
      active: true,
    };

    if (editingPlanId) {
      updateNutritionPlan(editingPlanId, planPayload);
    } else {
      addNutritionPlan(planPayload);
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    }

    setIsModalOpen(false);
  };

  // WhatsApp share generator
  const handleShareWhatsApp = (plan) => {
    const student = members.find((m) => m.id === plan.targetStudentId);
    let cleanPhone = student?.phone ? student.phone.replace(/[^0-9]/g, "") : "";
    if (cleanPhone.length === 9 && !cleanPhone.startsWith("51")) {
      cleanPhone = "51" + cleanPhone;
    }

    let msg = `🥗 *PLAN NUTRICIONAL RADICAL*\n`;
    msg += `Hola ${plan.targetStudentName || "Campeón(a)"}!\n\n`;
    msg += `📋 *${plan.title}*\n`;
    msg += `🎯 *Objetivo:* ${OBJECTIVE_LABELS[plan.objective]}\n`;
    msg += `🔥 *Calorías Diarias:* ${plan.dailyCaloriesTarget} kcal\n`;
    msg += `📊 *Macronutrientes:* P: ${plan.proteinsTargetGrams}g | C: ${plan.carbsTargetGrams}g | G: ${plan.fatsTargetGrams}g\n`;
    msg += `💧 *Agua Recomendada:* ${plan.waterLitersTarget} L/día\n\n`;
    const platosMsg = platosDePlan(plan);
    if (platosMsg.length) {
      msg += `🍽️ *TUS PLATOS:*\n`;
      platosMsg.forEach((pl) => {
        msg += `\n*${pl.name}${pl.time ? ` (${pl.time})` : ""}:* ${pl.veg}% verduras · ${pl.protein}% proteína · ${pl.carbs}% carbohidratos · ${pl.fats}% grasas\n`;
        msg += `  ✋ ${pl.palms} palma(s) proteína · ✊ ${pl.fists} puño(s) verduras · 🤲 ${pl.hands} mano(s) carbohidratos · 👍 ${pl.thumbs} pulgar(es) grasa\n`;
        const extras = Object.values(MANOS_EXTRA).filter((m) => Number(pl[m.campo]) > 0);
        if (extras.length) msg += `  ${extras.map((m) => `${m.emoji} ${pl[m.campo]} ${m.nombre.toLowerCase()} ${m.que.toLowerCase()}`).join(" · ")}\n`;
      });
      msg += `\n`;
    }

    msg += `🍽️ *DISTRIBUCIÓN DE COMIDAS:*\n`;
    plan.meals.forEach((meal, i) => {
      msg += `\n*${i + 1}. ${meal.name} (${meal.time})* - ${meal.totalCalories} kcal\n`;
      meal.items.forEach((it) => {
        msg += `  • ${it.name} (${it.portion})\n`;
      });
    });

    if (plan.supplements && plan.supplements.length > 0) {
      msg += `\n💊 *Suplementos Recomendados:*\n`;
      plan.supplements.forEach((s) => {
        msg += `  - ${s}\n`;
      });
    }

    msg += `\n💬 *Recomendación del Coach (${plan.trainerName || "RADICAL"}):*\n${plan.recommendations}\n`;
    msg += `\n¡A darlo todo con tu alimentación! 💪`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Add Item to Meal
  const handleAddItemToMeal = (mealIndex, food) => {
    setFormMeals((prev) => {
      const copy = [...prev];
      const targetMeal = { ...copy[mealIndex] };
      const newItem = {
        ...food,
        id: `item-${Date.now()}-${Math.random()}`,
      };
      targetMeal.items = [...targetMeal.items, newItem];
      targetMeal.totalCalories += food.calories;
      targetMeal.totalProteins += food.proteins;
      targetMeal.totalCarbs += food.carbs;
      targetMeal.totalFats += food.fats;
      copy[mealIndex] = targetMeal;
      return copy;
    });
  };

  // Remove Item from Meal
  const handleRemoveItemFromMeal = (mealIndex, itemId) => {
    setFormMeals((prev) => {
      const copy = [...prev];
      const targetMeal = { ...copy[mealIndex] };
      const itemToRemove = targetMeal.items.find((it) => it.id === itemId);
      if (itemToRemove) {
        targetMeal.totalCalories -= itemToRemove.calories;
        targetMeal.totalProteins -= itemToRemove.proteins;
        targetMeal.totalCarbs -= itemToRemove.carbs;
        targetMeal.totalFats -= itemToRemove.fats;
      }
      targetMeal.items = targetMeal.items.filter((it) => it.id !== itemId);
      copy[mealIndex] = targetMeal;
      return copy;
    });
  };

  // Add Blank/Custom Food Row for text + weight typing
  const handleAddBlankFoodRow = (mealIndex) => {
    setFormMeals((prev) => {
      const copy = [...prev];
      const targetMeal = { ...copy[mealIndex] };
      const newItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        name: "",
        portion: "150g",
        weightGrams: 150,
        calories: 180,
        proteins: 18,
        carbs: 20,
        fats: 3,
      };
      targetMeal.items = [...targetMeal.items, newItem];
      targetMeal.totalCalories += newItem.calories;
      targetMeal.totalProteins += newItem.proteins;
      targetMeal.totalCarbs += newItem.carbs;
      targetMeal.totalFats += newItem.fats;
      copy[mealIndex] = targetMeal;
      return copy;
    });
  };

  // Update specific field of a food item in a meal
  const handleUpdateFoodItem = (mealIndex, itemId, field, value) => {
    setFormMeals((prev) => {
      const copy = [...prev];
      const targetMeal = { ...copy[mealIndex] };
      targetMeal.items = targetMeal.items.map((it) => {
        if (it.id === itemId) {
          const updated = { ...it, [field]: value };
          if (field === "portion") {
            const numeric = parseInt(String(value).replace(/[^0-9]/g, ""), 10);
            if (!isNaN(numeric)) updated.weightGrams = numeric;
          }
          return updated;
        }
        return it;
      });

      // Recalculate totals
      targetMeal.totalCalories = targetMeal.items.reduce(
        (s, it) => s + (Number(it.calories) || 0),
        0,
      );
      targetMeal.totalProteins = targetMeal.items.reduce(
        (s, it) => s + (Number(it.proteins) || 0),
        0,
      );
      targetMeal.totalCarbs = targetMeal.items.reduce(
        (s, it) => s + (Number(it.carbs) || 0),
        0,
      );
      targetMeal.totalFats = targetMeal.items.reduce(
        (s, it) => s + (Number(it.fats) || 0),
        0,
      );
      copy[mealIndex] = targetMeal;
      return copy;
    });
  };

  // Print Plan
  const handlePrintPlan = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Módulo de Nutrición & Dietas
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Pautas alimentarias personalizadas, cálculo de requerimientos
                calóricos y macronutrientes por alumno.
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle & New Plan Button */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode("plans")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "plans"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🥗 Planes & Dietas ({nutritionPlans.length})
            </button>
            <button
              onClick={() => setViewMode("calculator")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === "calculator"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculadora TDEE</span>
            </button>
            <button
              onClick={() => setViewMode("guide")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "guide" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ✋ Guía de porciones y platos
            </button>
            <button
              onClick={() => setViewMode("foods")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "foods" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🥗 Catálogo de alimentos
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal(false)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear / Asignar Dieta</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PLANS AND ASSIGNED DIETS */}
      {viewMode === "plans" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Plan Selector & Filters */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search and Filters */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por alumno o nombre de plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterObjective}
                onChange={(e) => setFilterObjective(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-hidden"
              >
                <option value="all">🎯 Todos los objetivos</option>
                <option value="hipertrofia">Hipertrofia Muscular</option>
                <option value="perdida_peso">Pérdida de Peso / Grasa</option>
                <option value="fuerza">Fuerza & Rendimiento</option>
                <option value="tonificacion">Tonificación & Definición</option>
              </select>
            </div>

            {/* Plans List */}
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredPlans.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  No se encontraron planes con los filtros aplicados.
                </div>
              ) : (
                filteredPlans.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  const objColor =
                    OBJECTIVE_COLORS[plan.objective] ||
                    OBJECTIVE_COLORS.hipertrofia;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/50 border-blue-500 shadow-xs ring-1 ring-blue-500"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold border ${objColor.bg} ${objColor.text} ${objColor.border} mb-1.5`}
                          >
                            {OBJECTIVE_LABELS[plan.objective]}
                          </span>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-1">
                            {plan.title}
                          </h3>
                        </div>
                        <span className="shrink-0 text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                          {plan.dailyCaloriesTarget} kcal
                        </span>
                      </div>

                      {/* Student info */}
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-1 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">
                            {plan.targetStudentName || "Plantilla General"}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          {plan.meals.length} comidas
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Plan Detailed Blueprint */}
          <div className="lg:col-span-8">
            {selectedPlan ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Plan Header */}
                <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 to-slate-800 text-white">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {OBJECTIVE_LABELS[selectedPlan.objective]}
                        </span>
                        <span className="text-xs text-slate-300">
                          • Actualizado: {selectedPlan.createdDate}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white">
                        {selectedPlan.title}
                      </h2>
                      <div className="flex items-center space-x-3 text-xs text-slate-300 mt-2">
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <strong className="text-white">Alumno:</strong>{" "}
                          {selectedPlan.targetStudentName ||
                            "Sin asignar (Plantilla Base)"}
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-white">Coach:</strong>{" "}
                          {selectedPlan.trainerName || "Carlos Mendoza"}
                        </span>
                      </div>
                    </div>

                    {/* Actions toolbar */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleShareWhatsApp(selectedPlan)}
                        title="Enviar por WhatsApp"
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button
                        onClick={handlePrintPlan}
                        title="Imprimir Pauta"
                        className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(selectedPlan)}
                        title="Editar Dieta"
                        className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `¿Estás seguro de eliminar el plan "${selectedPlan.title}"?`,
                            )
                          ) {
                            deleteNutritionPlan(selectedPlan.id);
                          }
                        }}
                        title="Eliminar Dieta"
                        className="p-2 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Macro Targets Visual Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                        <span>Calorías Diarias</span>
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="text-xl font-black text-white">
                        {selectedPlan.dailyCaloriesTarget}{" "}
                        <span className="text-xs text-slate-400 font-normal">
                          kcal
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                        <span>Proteínas</span>
                        <span className="text-xs text-emerald-400 font-bold">
                          4 kcal/g
                        </span>
                      </div>
                      <div className="text-xl font-black text-emerald-400">
                        {selectedPlan.proteinsTargetGrams}{" "}
                        <span className="text-xs text-slate-400 font-normal">
                          g
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                        <span>Carbohidratos</span>
                        <span className="text-xs text-cyan-400 font-bold">
                          4 kcal/g
                        </span>
                      </div>
                      <div className="text-xl font-black text-cyan-400">
                        {selectedPlan.carbsTargetGrams}{" "}
                        <span className="text-xs text-slate-400 font-normal">
                          g
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                        <span>Grasas Saludables</span>
                        <span className="text-xs text-rose-400 font-bold">
                          9 kcal/g
                        </span>
                      </div>
                      <div className="text-xl font-black text-rose-400">
                        {selectedPlan.fatsTargetGrams}{" "}
                        <span className="text-xs text-slate-400 font-normal">
                          g
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body: Meals Breakdown */}
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Platos asignados (gráficos) y porciones con la mano */}
                  {(() => {
                    const platos = platosDePlan(selectedPlan, sexoAlumno(selectedPlan.targetStudentId));
                    return (
                      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-4">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-3">🍽️ Platos asignados ({platos.length})</h3>
                        {platos.length ? (
                          <VistaPlatos
                            plates={platos}
                            metas={{ proteinas: selectedPlan.proteinsTargetGrams, carbohidratos: selectedPlan.carbsTargetGrams, grasas: selectedPlan.fatsTargetGrams }}
                          />
                        ) : (
                          <p className="text-sm text-slate-500">Esta dieta aún no tiene platos. Edítala para asignarlos.</p>
                        )}
                      </div>
                    );
                  })()}
                  {/* Meals Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
                      <span>🍽️ Cronograma de Comidas Diarias</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {selectedPlan.meals.length} tiempos
                      </span>
                    </h3>
                  </div>

                  {/* Meals Timeline */}
                  <div className="space-y-4">
                    {selectedPlan.meals.map((meal, index) => (
                      <div
                        key={meal.id || index}
                        className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                      >
                        {/* Meal Header */}
                        <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-black text-xs sm:text-sm text-slate-900">
                              {meal.name}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{meal.time}</span>
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 text-xs font-bold">
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {meal.totalCalories} kcal
                            </span>
                            <span className="text-slate-600 font-medium hidden sm:inline">
                              P: {meal.totalProteins}g | C: {meal.totalCarbs}g |
                              G: {meal.totalFats}g
                            </span>
                          </div>
                        </div>

                        {/* Items in meal */}
                        <div className="p-3 divide-y divide-slate-100">
                          {meal.items.map((item, itIdx) => (
                            <div
                              key={item.id || itIdx}
                              className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-3">
                                <p className="font-bold text-slate-800 truncate">
                                  {item.emoji ? `${item.emoji} ` : ""}{item.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Porción sugerida:{" "}
                                  <span className="font-medium text-slate-700">
                                    {item.portion}
                                  </span>
                                  {item.notes && (
                                    <span className="text-slate-400 italic">
                                      {" "}
                                      — {item.notes}
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-black text-slate-900 text-xs">
                                  {item.calories} kcal
                                </span>
                                <span className="block text-xs text-slate-400">
                                  {item.proteins}g P · {item.carbs}g C ·{" "}
                                  {item.fats}g G
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendations & Guidelines */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Hydration & Supplements */}
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3">
                      <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs uppercase tracking-wide">
                        <Droplet className="w-4 h-4 text-blue-600" />
                        <span>
                          Hidratación ({selectedPlan.waterLitersTarget} L / Día)
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {selectedPlan.hydrationGuidelines ||
                          "Consumir agua en intervalos regulares durante toda la jornada."}
                      </p>

                      {selectedPlan.supplements &&
                        selectedPlan.supplements.length > 0 && (
                          <div className="pt-2 border-t border-blue-200/60">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 mb-1.5">
                              <Pill className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Suplementación Pautada</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedPlan.supplements.map((sup, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-xs font-medium text-slate-700"
                                >
                                  {sup}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Coach Notes */}
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
                      <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                        <Info className="w-4 h-4 text-amber-600" />
                        <span>Instrucciones & Notas del Nutricionista</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {selectedPlan.recommendations ||
                          "Consistencia con el pesaje de alimentos en crudo y mantener los horarios programados."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                Selecciona un plan nutricional a la izquierda o crea uno nuevo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: CATÁLOGO DE ALIMENTOS */}
      {viewMode === "foods" && <CatalogoAlimentos />}

      {/* VIEW 3: GUÍA DE PORCIONES CON LA MANO Y MODELOS DE PLATO */}
      {viewMode === "guide" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-extrabold text-slate-900 mb-1">✋ Porciones con la mano</h3>
            <p className="text-xs text-slate-500 mb-4">Esta misma guía la ve el alumno en su portal (Mi Alimentación), junto con su plato.</p>
            <GuiaPorciones />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-extrabold text-slate-900 mb-3">🍽️ Modelos de plato</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Object.entries(MODELOS_PLATO).map(([k, m]) => (
                <div key={k} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-black text-slate-900 text-sm">{m.nombre}</p>
                  <div className="flex justify-center">
                    <PlatoSVG plate={normalizarPlato({ model: k })} size={220} />
                  </div>
                  <LeyendaPlato plate={normalizarPlato({ model: k })} />
                  <p className="text-[11px] text-slate-500 mt-2">{m.nota}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900">⚡ Carbohidratos según el ejercicio</h3>
                <p className="text-xs text-slate-500">Cuánto carbohidrato al día según las horas de entrenamiento.</p>
              </div>
              <label className="text-xs font-bold text-slate-600">
                Peso del alumno (kg)
                <input type="number" min="30" max="250" value={guiaPeso} onChange={(e) => setGuiaPeso(Number(e.target.value))} className="ml-2 w-20 p-1.5 rounded-lg border border-slate-300 text-sm" />
              </label>
            </div>
            <TablaCarbosEjercicio peso={guiaPeso} />
            <p className="text-[11px] text-slate-500">
              Referencia rápida: 1 {MANOS.palma.nombre.toLowerCase()} ≈ {MANOS.palma.g} g de proteína · 1 mano ahuecada ≈ {MANOS.mano.g} g de carbohidratos · 1 pulgar ≈ {MANOS.pulgar.g} g de grasa.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 2: TDEE CALCULATOR & MACRO ESTIMATOR */}
      {viewMode === "calculator" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span>
                Calculadora Nutricional de Calorías y Macronutrientes (TDEE)
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Basado en el algoritmo estándar Mifflin-St Jeor para calcular la
              Tasa Metabólica Basal (BMR), Gasto Energético Total Diario (TDEE)
              y la distribución óptima de macronutrientes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form */}
            <div className="lg:col-span-6 space-y-4">
              {/* Optional: Load from member */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
                <label className="block text-xs font-bold text-blue-900 mb-1.5">
                  Cargar datos de un alumno registrado (opcional):
                </label>
                <select
                  value={calcSelectedStudentId}
                  onChange={(e) => handleSelectMemberForCalc(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="">-- Seleccionar Alumno --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} (DNI: {m.dni}) - {m.planName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sexo & Edad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Género biológico
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcGender("M")}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        calcGender === "M"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcGender("F")}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        calcGender === "F"
                          ? "bg-pink-600 text-white border-pink-600"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      Femenino
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Edad (años)
                  </label>
                  <input
                    type="number"
                    value={calcAge}
                    onChange={(e) => setCalcAge(Number(e.target.value))}
                    min={12}
                    max={90}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Peso & Altura */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peso actual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estatura (cm)
                  </label>
                  <input
                    type="number"
                    value={calcHeight}
                    onChange={(e) => setCalcHeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Nivel de Actividad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nivel de Actividad Física
                </label>
                <select
                  value={calcActivity}
                  onChange={(e) => setCalcActivity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value={1.2}>
                    Sedentario (Poco o ningún ejercicio de oficina)
                  </option>
                  <option value={1.375}>
                    Ligero (Entrenamiento 1-3 días por semana)
                  </option>
                  <option value={1.55}>
                    Moderado (Entrena en gym 3-5 días/semana)
                  </option>
                  <option value={1.725}>
                    Intenso (Entrena fuerte 6-7 días/semana)
                  </option>
                  <option value={1.9}>
                    Atleta de Alto Rendimiento (Doble sesión diaria)
                  </option>
                </select>
              </div>

              {/* Objetivo Fitness */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Objetivo Físico
                </label>
                <select
                  value={calcGoal}
                  onChange={(e) => setCalcGoal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="perdida_peso">
                    Pérdida de Grasa (Déficit -450 kcal)
                  </option>
                  <option value="tonificacion">
                    Definición / Recomposición (Déficit suave -250 kcal)
                  </option>
                  <option value="salud_rehabilitacion">
                    Mantenimiento Energético
                  </option>
                  <option value="hipertrofia">
                    Ganancia Muscular Limpia (Superávit +350 kcal)
                  </option>
                  <option value="fuerza">
                    Fuerza Máxima (Superávit +450 kcal)
                  </option>
                </select>
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="lg:col-span-6 flex flex-col justify-between bg-linear-to-br from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">
                    Resultado Calculado
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-4xl font-black text-white">
                      {calculatedMetrics.targetCalories}
                    </span>
                    <span className="text-slate-400 font-semibold text-sm">
                      kcal / día sugeridas
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Gasto Metabólico Basal (BMR):{" "}
                    <strong className="text-white">
                      {calculatedMetrics.bmr} kcal
                    </strong>{" "}
                    · Mantenimiento (TDEE):{" "}
                    <strong className="text-white">
                      {calculatedMetrics.tdee} kcal
                    </strong>
                  </p>
                </div>

                {/* Macro Split Card */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-300">
                    Distribución de Macronutrientes Óptima:
                  </span>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <span className="text-xs font-semibold text-emerald-400">
                        Proteínas
                      </span>
                      <p className="text-xl font-black text-white mt-0.5">
                        {calculatedMetrics.proteinsGrams}g
                      </p>
                      <span className="text-xs text-slate-400">
                        {calculatedMetrics.proteinsGrams * 4} kcal
                      </span>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <span className="text-xs font-semibold text-cyan-400">
                        Carbos
                      </span>
                      <p className="text-xl font-black text-white mt-0.5">
                        {calculatedMetrics.carbsGrams}g
                      </p>
                      <span className="text-xs text-slate-400">
                        {calculatedMetrics.carbsGrams * 4} kcal
                      </span>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <span className="text-xs font-semibold text-rose-400">
                        Grasas
                      </span>
                      <p className="text-xl font-black text-white mt-0.5">
                        {calculatedMetrics.fatsGrams}g
                      </p>
                      <span className="text-xs text-slate-400">
                        {calculatedMetrics.fatsGrams * 9} kcal
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-950/50 rounded-xl border border-blue-900/60 flex items-center justify-between text-xs">
                    <span className="text-blue-300 flex items-center space-x-1.5">
                      <Droplet className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ingesta mínima de agua recomendada:</span>
                    </span>
                    <strong className="text-white font-bold">
                      {calculatedMetrics.waterLiters} Litros / día
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action: Convert to Plan */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(true)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Crear y Asignar Dieta con estos Valores</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE OR EDIT NUTRITION PLAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-50">
          <div className="bg-white w-full h-full flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingPlanId
                      ? "Editar Pauta Nutricional"
                      : "Crear y Asignar Pauta Nutricional"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configura los requerimientos calóricos, macronutrientes y
                    comidas del alumno.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSavePlan}
              className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 w-full max-w-[1400px] mx-auto"
            >
              {/* General info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre o Título del Plan
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej. Plan Hipertrofia Limpia 2600 kcal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Asignar a Alumno del Gimnasio
                  </label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-hidden"
                  >
                    <option value="">
                      -- Sin asignar (Plantilla Base / General) --
                    </option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} - {m.planName} (DNI: {m.dni})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Objective & Trainer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Objetivo Nutricional
                  </label>
                  <select
                    value={formObjective}
                    onChange={(e) => setFormObjective(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-hidden"
                  >
                    <option value="hipertrofia">Hipertrofia Muscular</option>
                    <option value="perdida_peso">
                      Pérdida de Grasa / Déficit
                    </option>
                    <option value="fuerza">Fuerza & Rendimiento</option>
                    <option value="tonificacion">
                      Tonificación & Definición
                    </option>
                    <option value="salud_rehabilitacion">
                      Salud & Mantenimiento
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Entrenador o Nutricionista a cargo
                  </label>
                  <input
                    list="lista-nutri-responsables"
                    value={formTrainerName}
                    onChange={(e) => setFormTrainerName(e.target.value)}
                    placeholder="Nombre del responsable"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-hidden"
                  />
                  <datalist id="lista-nutri-responsables">
                    {currentUser?.fullName && <option value={currentUser.fullName} />}
                    {trainers.map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                  {staffDirectory.map((p) => (
                      <option key={`st-${p.id}`} value={p.fullName} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Macros Target Banner */}
              <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3">
                <span className="text-xs font-black uppercase text-blue-400">
                  Metas Diarias de Macronutrientes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                    <span className="block text-xs text-slate-400">Calorías (calculadas)</span>
                    <span className="text-lg font-black text-white">
                      {Math.round(Number(formProteins) * 4 + Number(formCarbs) * 4 + Number(formFats) * 9)} kcal
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs text-emerald-400 mb-1">
                      Proteínas (g)
                    </label>
                    <input
                      type="number"
                      required
                      value={formProteins}
                      onChange={(e) => setFormProteins(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-cyan-400 mb-1">
                      Carbohidratos (g)
                    </label>
                    <input
                      type="number"
                      required
                      value={formCarbs}
                      onChange={(e) => setFormCarbs(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-rose-400 mb-1">
                      Grasas (g)
                    </label>
                    <input
                      type="number"
                      required
                      value={formFats}
                      onChange={(e) => setFormFats(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-blue-300 mb-1">
                      Agua (Litros/día)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formWater}
                      onChange={(e) => setFormWater(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-bold text-blue-300"
                    />
                  </div>
                </div>
              </div>

              {/* Platos del alumno (gráficos) y porciones con la mano */}
              <EditorPlatos
                value={formPlates}
                onChange={setFormPlates}
                sexo={sexoAlumno(formStudentId)}
                comidas={formMeals}
                metas={{ proteinas: Number(formProteins), carbohidratos: Number(formCarbs), grasas: Number(formFats) }}
              />

              {/* Comidas y alimentos (catálogo) */}
              <EditorComidas
                meals={formMeals}
                setMeals={setFormMeals}
                metas={{ kcal: Number(formProteins) * 4 + Number(formCarbs) * 4 + Number(formFats) * 9, p: Number(formProteins), c: Number(formCarbs), g: Number(formFats) }}
              />

              {/* Extra guidelines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Suplementos Recomendados
                  </label>
                  <input
                    type="text"
                    value={formSupplements}
                    onChange={(e) => setFormSupplements(e.target.value)}
                    placeholder="Creatina 5g, Proteína Whey, Multivitamínico..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pautas de Hidratación
                  </label>
                  <input
                    type="text"
                    value={formHydration}
                    onChange={(e) => setFormHydration(e.target.value)}
                    placeholder="Beber 500ml al despertar y durante el entreno..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas y Recomendaciones del Entrenador
                </label>
                <textarea
                  rows={2}
                  value={formRecommendations}
                  onChange={(e) => setFormRecommendations(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingPlanId
                    ? "Guardar Cambios"
                    : "Guardar y Asignar Dieta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
