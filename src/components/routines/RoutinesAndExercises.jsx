import React, { useState, useMemo } from "react";
import {
  Dumbbell,
  Plus,
  Search,
  Layers,
  Sparkles,
  Trash2,
  Check,
  Printer,
  UserCheck,
  Zap,
  Video,
  PlayCircle,
  ExternalLink,
  Eye,
  Play,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import confetti from "canvas-confetti";
import {
  useExerciseBank,
  ExerciseLibrary,
  ExerciseDetail,
  ExercisePicker,
  ExerciseThumb,
  MUSCLE_LABELS,
} from "./ExerciseBank";
import { PanelIndicaciones } from "../indicaciones/Indicaciones";

export const RoutinesAndExercises = () => {
  const {
    exercises,
    routines,
    trainers,
    members,
    addExercise,
    updateExercise,
    deleteExercise,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    assignRoutineToMember,
  } = useGym();

  const [activeSubTab, setActiveSubTab] = useState("routines");

  // Exercise Filters
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedExerciseModal, setSelectedExerciseModal] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);

  // New Exercise Modal
  const [isNewExerciseOpen, setIsNewExerciseOpen] = useState(false);
  const [exName, setExName] = useState("");
  const [exMuscle, setExMuscle] = useState("pecho");
  const [exEquipment, setExEquipment] = useState("mancuernas");
  const [exDifficulty, setExDifficulty] = useState("intermedio");
  const [exInstructions, setExInstructions] = useState("");
  const [exTips, setExTips] = useState("");
  const [exDefaultReps, setExDefaultReps] = useState("4 series x 10-12 reps");
  const [exVideoUrl, setExVideoUrl] = useState("");
  const [exThumbnailUrl, setExThumbnailUrl] = useState("");

  // Active Routine Viewer / Printable Modal
  const [viewingRoutine, setViewingRoutine] = useState(null);

  // Routine Assign Modal
  const [assigningRoutine, setAssigningRoutine] = useState(null);
  const [studentToAssignId, setStudentToAssignId] = useState("");

  // Routine Builder State
  const [routineTitle, setRoutineTitle] = useState("");
  const [routineDesc, setRoutineDesc] = useState("");
  const [routineLevel, setRoutineLevel] = useState("intermedio");
  const [routineObjective, setRoutineObjective] = useState("hipertrofia");
  const [routineTrainerId, setRoutineTrainerId] = useState(
    trainers[0]?.id || "",
  );
  const [routineTargetMemberId, setRoutineTargetMemberId] = useState("");

  const [routineDays, setRoutineDays] = useState([
    { dayName: "Día 1", focus: "", notes: "", exercises: [] },
  ]);

  // Banco de ejercicios (GIF) + ejercicios propios del gimnasio
  const bank = useExerciseBank();
  const allExercises = useMemo(
    () => [
      ...exercises.map((e) => ({ ...e, gifUrl: e.gifUrl || e.videoUrl, custom: true })),
      ...bank,
    ],
    [exercises, bank],
  );

  // Helper to extract clean youtube embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      const id = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  // Exercise list filtering
  const filteredExercises = exercises.filter((ex) => {
    const matchesMuscle =
      selectedMuscle === "all" || ex.muscleGroup === selectedMuscle;
    const matchesSearch =
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.instructions.toLowerCase().includes(exerciseSearch.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  const muscleLabels = MUSCLE_LABELS;

  const handleCreateExerciseSubmit = (e) => {
    e.preventDefault();
    if (!exName.trim() || !exInstructions.trim()) return;

    addExercise({
      name: exName.trim(),
      muscleGroup: exMuscle,
      equipment: exEquipment,
      difficulty: exDifficulty,
      instructions: exInstructions.trim(),
      tips:
        exTips.trim() ||
        "Mantener control del tempo excéntrico y rango de movimiento completo.",
      targetSetsRepsDefault: exDefaultReps,
      gifUrl: exVideoUrl.trim() || undefined,
      thumbnailUrl: exThumbnailUrl.trim() || undefined,
    });

    setExName("");
    setExInstructions("");
    setExTips("");
    setExVideoUrl("");
    setExThumbnailUrl("");
    setIsNewExerciseOpen(false);

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Add new day to routine builder
  const handleAddDay = () => {
    const nextDayNum = routineDays.length + 1;
    setRoutineDays((prev) => [
      ...prev,
      {
        dayName: `Día ${nextDayNum}`,
        focus: "",
        exercises: [],
      },
    ]);
  };

  // Remove day from routine builder
  const handleRemoveDay = (dayIndex) => {
    setRoutineDays((prev) => prev.filter((_, i) => i !== dayIndex));
  };

  // Add exercise to day in builder
  const handleAddExerciseToDay = (dayIndex, exerciseId) => {
    const exObj = allExercises.find((e) => e.id === exerciseId);
    if (!exObj) return;

    const nuevo = {
      exerciseId: exObj.id,
      exerciseName: exObj.name,
      muscleGroup: exObj.muscleGroup,
      sets: 4,
      reps: "10-12",
      rir: "RIR 1-2",
      restSeconds: 60,
      notes: "",
      gifUrl: exObj.gifUrl,
      thumbnailUrl: exObj.thumbnailUrl,
      steps: exObj.steps || [],
    };
    // Actualización inmutable (evita que se agregue dos veces)
    setRoutineDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, exercises: [...d.exercises, nuevo] } : d)),
    );
  };

  // Remove exercise from day in builder
  const handleRemoveExerciseFromDay = (dayIndex, exIndex) => {
    setRoutineDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, exercises: d.exercises.filter((_, k) => k !== exIndex) } : d,
      ),
    );
  };

  // Save routine from builder
  const handleSaveRoutine = (e) => {
    e.preventDefault();
    if (!routineTitle.trim()) {
      alert("Por favor asigna un título a la rutina.");
      return;
    }

    const trainerObj = trainers.find((t) => t.id === routineTrainerId);
    const memberObj = members.find((m) => m.id === routineTargetMemberId);

    addRoutine({
      title: routineTitle.trim(),
      description:
        routineDesc.trim() || "Rutina personalizada diseñada en RADICAL.",
      level: routineLevel,
      objective: routineObjective,
      trainerId: routineTrainerId || undefined,
      trainerName: trainerObj?.name,
      targetStudentId: routineTargetMemberId || undefined,
      targetStudentName: memberObj?.fullName,
      days: routineDays,
    });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    setActiveSubTab("routines");
  };

  const handleConfirmAssignment = (e) => {
    e.preventDefault();
    if (!assigningRoutine || !studentToAssignId) return;

    assignRoutineToMember(studentToAssignId, assigningRoutine.id);
    setAssigningRoutine(null);
    setStudentToAssignId("");

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-4">
      {/* Sub Navigation Bar */}
      <div className="rd-portada flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-blue-600" />
            <span>Módulo de Rutinas & Base de Datos de Ejercicios</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Banco de {allExercises.length} ejercicios con animación GIF, creador de
            rutinas y asignación directa a alumnos.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab("routines")}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === "routines"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-gray-600 hover:text-slate-900"
            }`}
          >
            Rutinas ({routines.length})
          </button>

          <button
            onClick={() => setActiveSubTab("exercises")}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeSubTab === "exercises"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-gray-600 hover:text-slate-900"
            }`}
          >
            <span>Banco de ejercicios</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
              {allExercises.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("indicaciones")}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === "indicaciones"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-gray-600 hover:text-slate-900"
            }`}
          >
            Indicaciones
          </button>

          <button
            onClick={() => setActiveSubTab("builder")}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
              activeSubTab === "builder"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 hover:text-slate-900"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Rutina</span>
          </button>
        </div>
      </div>

      {/* SUBTAB: INDICACIONES (estiramientos, movilidad, calentamiento, postura y cuidados) */}
      {activeSubTab === "indicaciones" && <PanelIndicaciones />}

      {/* SUBTAB 1: ROUTINES LIST */}
      {activeSubTab === "routines" && (
        <div className="space-y-4">
          {routines.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">Aún no hay rutinas creadas</p>
              <p className="text-sm text-slate-500 mb-4">Arme la primera usando el banco de ejercicios con GIF.</p>
              <button
                onClick={() => setActiveSubTab("builder")}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold cursor-pointer"
              >
                Crear rutina
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {routines.map((routine) => {
              const assignedStudent = members.find(
                (m) => m.id === routine.targetStudentId,
              );
              const assignedTrainer = trainers.find(
                (t) => t.id === routine.trainerId,
              );
              const totalExercises = routine.days.reduce(
                (sum, d) => sum + d.exercises.length,
                0,
              );

              return (
                <div
                  key={routine.id}
                  className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                        {routine.level} • {routine.objective}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {routine.days.length} Días / sem
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2 mb-1 group-hover:text-blue-600 transition-colors">
                      {routine.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {routine.description}
                    </p>

                    {/* Breakdown */}
                    <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-gray-500">Total ejercicios:</span>
                        <span className="font-semibold">
                          {totalExercises} ejercicios
                        </span>
                      </div>

                      {routine.trainerName && (
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-gray-500">Coach:</span>
                          <span className="font-semibold text-blue-700">
                            {routine.trainerName}
                          </span>
                        </div>
                      )}

                      {assignedStudent ? (
                        <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-gray-200">
                          <span className="text-gray-500">Asignada a:</span>
                          <span className="font-bold text-emerald-700">
                            {assignedStudent.fullName}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-gray-200">
                          <span className="text-gray-500">Tipo:</span>
                          <span className="text-gray-500 font-medium">
                            Plantilla general
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1">
                    <button
                      onClick={() => setViewingRoutine(routine)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ver / Imprimir</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAssigningRoutine(routine)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Asignar a un alumno"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Asignar</span>
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm(`¿Eliminar la rutina "${routine.title}"?`)
                          ) {
                            deleteRoutine(routine.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Eliminar rutina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: BANCO DE EJERCICIOS */}
      {activeSubTab === "exercises" && (
        <ExerciseLibrary
          exercises={allExercises}
          onOpen={setSelectedExerciseModal}
          onNew={() => setIsNewExerciseOpen(true)}
        />
      )}

      {/* SUBTAB 3: ROUTINE BUILDER WIZARD */}
      {activeSubTab === "builder" && (
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-xs space-y-5 text-slate-800">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Creador Interactivo de Rutinas para Entrenadores</span>
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Diseñar programa personalizado (series, repeticiones y descansos)
              </h2>
            </div>

            <button
              onClick={() => setActiveSubTab("routines")}
              className="text-xs text-gray-500 hover:text-slate-800 cursor-pointer"
            >
              Cancelar y Volver
            </button>
          </div>

          <form onSubmit={handleSaveRoutine} className="space-y-5">
            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Título de la Rutina *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rutina Hipertrofia Push-Pull-Legs 4 Días"
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Objetivo del Alumno
                </label>
                <select
                  value={routineObjective}
                  onChange={(e) => setRoutineObjective(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="hipertrofia">
                    Ganancia Muscular / Hipertrofia
                  </option>
                  <option value="perdida_peso">
                    Pérdida de Grasa / Definición
                  </option>
                  <option value="fuerza">Fuerza Máxima</option>
                  <option value="tonificacion">Tonificación General</option>
                  <option value="resistencia">
                    Resistencia & Acondicionamiento
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nivel
                </label>
                <select
                  value={routineLevel}
                  onChange={(e) => setRoutineLevel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Descripción / Indicaciones Generales
                </label>
                <input
                  type="text"
                  placeholder="Ej. 4 días de entrenamiento a la semana. Descansar miércoles y domingos."
                  value={routineDesc}
                  onChange={(e) => setRoutineDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Entrenador Responsable
                </label>
                <select
                  value={routineTrainerId}
                  onChange={(e) => setRoutineTrainerId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="">Seleccionar Entrenador...</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}{t.specialization ? ` · ${t.specialization}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Asignar a Alumno Directo (Opcional)
                </label>
                <select
                  value={routineTargetMemberId}
                  onChange={(e) => setRoutineTargetMemberId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="">Dejar como plantilla general</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.planName}) - {m.objective}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Days Section */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Días de Entrenamiento y Ejercicios Seleccionados</span>
                </h3>

                <button
                  type="button"
                  onClick={handleAddDay}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-blue-700 font-semibold rounded-md text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Día</span>
                </button>
              </div>

              <div className="space-y-3">
                {routineDays.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2.5 flex-1">
                        <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {dIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={day.dayName}
                          onChange={(e) => {
                            const updated = [...routineDays];
                            updated[dIdx].dayName = e.target.value;
                            setRoutineDays(updated);
                          }}
                          className="bg-transparent font-bold text-slate-900 text-xs sm:text-sm focus:outline-none border-b border-dashed border-gray-300 focus:border-blue-600 w-full sm:w-80"
                        />
                      </div>

                      <div className="flex items-center gap-2">

                        {routineDays.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDay(dIdx)}
                            className="text-gray-400 hover:text-rose-600 text-xs px-1.5 py-0.5 cursor-pointer"
                            title="Eliminar este día"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <ExercisePicker
                      exercises={allExercises}
                      onPick={(ex) => handleAddExerciseToDay(dIdx, ex.id)}
                      picked={(day.exercises || []).map((e) => e.exerciseId)}
                    />

                    {/* Exercises in this Day */}
                    <div className="space-y-2">
                      {day.exercises.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-1.5">
                          No hay ejercicios en este día. Selecciona un ejercicio
                          del menú para añadir series, repeticiones y descanso.
                        </p>
                      ) : (
                        day.exercises.map((ex, exIdx) => {
                          const base = allExercises.find((e) => e.id === ex.exerciseId);
                          const pasos = ex.steps || base?.steps || [];
                          const upd = (patch) =>
                            setRoutineDays((prev) =>
                              prev.map((d, i) =>
                                i === dIdx
                                  ? {
                                      ...d,
                                      exercises: d.exercises.map((x, k) => (k === exIdx ? { ...x, ...patch } : x)),
                                    }
                                  : d,
                              ),
                            );
                          const campo =
                            "w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-center text-slate-900 font-bold text-sm";
                          return (
                            <div key={exIdx} className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs">
                              <div className="flex items-start gap-3">
                                <span className="text-gray-400 font-mono font-bold text-sm pt-1 w-5 shrink-0">
                                  {exIdx + 1}.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => base && setSelectedExerciseModal(base)}
                                  title="Ver ejecución"
                                  className="shrink-0 cursor-pointer"
                                >
                                  <ExerciseThumb
                                    ex={{ ...ex, name: ex.exerciseName }}
                                    className="w-16 h-16 rounded-lg border border-gray-200"
                                  />
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">{ex.exerciseName}</span>
                                    <span className="text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase border border-blue-100">
                                      {muscleLabels[ex.muscleGroup] || ex.muscleGroup}
                                    </span>
                                    {base?.equipment && (
                                      <span className="text-xs text-gray-500">{base.equipment}</span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                    <label className="block">
                                      <span className="block text-xs text-gray-500 mb-0.5">Series</span>
                                      <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={ex.sets}
                                        onChange={(e) => upd({ sets: Number(e.target.value) })}
                                        className={campo}
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="block text-xs text-gray-500 mb-0.5">Repeticiones</span>
                                      <input
                                        type="text"
                                        value={ex.reps}
                                        placeholder="10-12"
                                        onChange={(e) => upd({ reps: e.target.value })}
                                        className={campo}
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="block text-xs text-gray-500 mb-0.5">Descanso (seg)</span>
                                      <input
                                        type="number"
                                        step="15"
                                        value={ex.restSeconds}
                                        onChange={(e) => upd({ restSeconds: Number(e.target.value) })}
                                        className={campo}
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="block text-xs text-gray-500 mb-0.5">Esfuerzo (RIR / RPE)</span>
                                      <input
                                        type="text"
                                        value={ex.rir || ""}
                                        placeholder="RIR 1-2"
                                        onChange={(e) => upd({ rir: e.target.value })}
                                        className={campo}
                                      />
                                    </label>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExerciseFromDay(dIdx, exIdx)}
                                  className="shrink-0 w-8 h-8 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Quitar ejercicio"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="mt-3 sm:pl-[6.25rem] space-y-2">
                                {pasos.length > 0 && (
                                  <details className="bg-slate-50 border border-slate-200 rounded-lg">
                                    <summary className="px-3 py-2 text-sm font-semibold text-blue-700 cursor-pointer select-none">
                                      Indicaciones de ejecución ({pasos.length} pasos)
                                    </summary>
                                    <ol className="px-4 pb-3 space-y-1.5 list-decimal list-inside text-sm text-slate-700">
                                      {pasos.map((p, i) => (
                                        <li key={i}>{p}</li>
                                      ))}
                                    </ol>
                                  </details>
                                )}
                                <input
                                  type="text"
                                  value={ex.notes || ""}
                                  placeholder="Nota del entrenador para este alumno (opcional), ej. bajar en 3 segundos, cuidar rodilla derecha"
                                  onChange={(e) => upd({ notes: e.target.value })}
                                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-slate-800 text-sm"
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Routine Button */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveSubTab("routines")}
                className="px-3.5 py-1.5 text-gray-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Rutina Completa</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routine Detail / Print View Modal */}
      {viewingRoutine && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-6xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white overflow-y-auto p-5 text-slate-800">
            <div className="flex items-start justify-between border-b border-gray-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  {viewingRoutine.level} • {viewingRoutine.objective}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {viewingRoutine.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {viewingRoutine.description}
                </p>
                {viewingRoutine.targetStudentName && (
                  <p className="text-xs text-blue-700 font-semibold mt-1">
                    Asignado a: {viewingRoutine.targetStudentName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-md cursor-pointer"
                  title="Imprimir rutina para el alumno"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewingRoutine(null)}
                  className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 my-4 text-xs">
              {viewingRoutine.days.map((day, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl border border-gray-200 p-3.5"
                >
                  <div className="flex items-center justify-between mb-2.5 border-b border-gray-200 pb-1.5">
                    <h4 className="font-bold text-blue-700 text-xs sm:text-sm">
                      {day.dayName}
                    </h4>
                    {day.focus && (
                      <span className="text-xs text-gray-500">
                        {day.focus}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {day.exercises.map((ex, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-2.5 bg-white rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="rounded accent-blue-600 w-3.5 h-3.5"
                            title="Marcar al completar"
                          />
                          <ExerciseThumb
                            ex={{ ...ex, name: ex.exerciseName }}
                            alwaysGif
                            className="w-16 h-16 rounded-lg border border-gray-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">
                                {ex.exerciseName}
                              </p>
                              {ex.videoUrl && (
                                <button
                                  onClick={() =>
                                    setPreviewVideoUrl({
                                      url: ex.videoUrl,
                                      title: ex.exerciseName,
                                    })
                                  }
                                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                                >
                                  <PlayCircle className="w-3 h-3" />
                                  <span>Ver Demo</span>
                                </button>
                              )}
                            </div>
                            {ex.notes && (
                              <p className="text-xs text-gray-500">
                                {ex.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-blue-700 font-bold">
                            {ex.sets} series x {ex.reps}
                          </span>
                          <span className="text-gray-500 text-xs ml-2">
                            ⏱ {ex.restSeconds}s descanso
                          </span>
                          {ex.rir && (
                            <span className="text-amber-700 text-xs ml-2 font-semibold">
                              ({ex.rir})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setViewingRoutine(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-xs cursor-pointer shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routine Assignment Modal */}
      {assigningRoutine && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 text-slate-800">
            <h3 className="text-sm font-bold text-slate-900 mb-0.5">
              Asignar Rutina a Alumno
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Rutina seleccionada:{" "}
              <span className="text-blue-700 font-bold">
                {assigningRoutine.title}
              </span>
            </p>

            <form
              onSubmit={handleConfirmAssignment}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Seleccionar Alumno
                </label>
                <select
                  required
                  value={studentToAssignId}
                  onChange={(e) => setStudentToAssignId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">Seleccionar alumno de la lista...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.planName}) - {m.objective}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setAssigningRoutine(null)}
                  className="px-3 py-1.5 text-gray-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs cursor-pointer"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Exercise Modal */}
      {isNewExerciseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 text-slate-800 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Añadir Nuevo Ejercicio a la Base de Datos
                </h3>
                <p className="text-xs text-gray-500">
                  Con especificaciones técnicas y enlace a video de demostración
                </p>
              </div>
              <button
                onClick={() => setIsNewExerciseOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateExerciseSubmit}
              className="space-y-3 my-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Press Militar con Barra de Pie"
                  value={exName}
                  onChange={(e) => setExName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Grupo Muscular Principal
                  </label>
                  <select
                    value={exMuscle}
                    onChange={(e) => setExMuscle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {Object.entries(muscleLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Equipamiento
                  </label>
                  <select
                    value={exEquipment}
                    onChange={(e) => setExEquipment(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="mancuernas">Mancuernas</option>
                    <option value="barra">Barra Olímpica</option>
                    <option value="maquina">Máquina Guiada</option>
                    <option value="polea">Polea / Cables</option>
                    <option value="peso_corporal">
                      Peso Corporal / Calistenia
                    </option>
                    <option value="kettlebell">Kettlebell / Pesa Rusa</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Dificultad
                  </label>
                  <select
                    value={exDifficulty}
                    onChange={(e) => setExDifficulty(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Series / Reps Sugeridas
                  </label>
                  <input
                    type="text"
                    placeholder="4 series x 10-12 reps"
                    value={exDefaultReps}
                    onChange={(e) => setExDefaultReps(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Instrucciones de Ejecución *
                </label>
                <textarea
                  rows={2.5}
                  required
                  placeholder="Describe la postura inicial, fase concéntrica, excéntrica y respiración..."
                  value={exInstructions}
                  onChange={(e) => setExInstructions(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Consejo Biomecánico / Tip del Entrenador
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mantener retracción escapular y evitar arquear la zona lumbar"
                  value={exTips}
                  onChange={(e) => setExTips(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Video URL (Optional) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Enlace a GIF demostrativo (opcional)
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="https://… .gif"
                  value={exVideoUrl}
                  onChange={(e) => setExVideoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Thumbnail URL (Optional) */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  URL de Imagen de Miniatura (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={exThumbnailUrl}
                  onChange={(e) => setExThumbnailUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewExerciseOpen(false)}
                  className="px-3 py-1.5 text-gray-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs cursor-pointer transition-all"
                >
                  Guardar Ejercicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detalle de ejercicio (pantalla completa con GIF) */}
      {selectedExerciseModal && (
        <ExerciseDetail ex={selectedExerciseModal} onClose={() => setSelectedExerciseModal(null)} />
      )}

      {/* Floating Video Preview Player Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-4 text-slate-800">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {previewVideoUrl.title} - Video Demostrativo
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-3">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-gray-200 shadow-md">
                <iframe
                  src={getEmbedUrl(previewVideoUrl.url) || ""}
                  title={previewVideoUrl.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <a
                href={previewVideoUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <span>Ver en YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-800 rounded-md font-semibold cursor-pointer"
              >
                Cerrar Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
