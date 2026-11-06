import React, { useState } from "react";
import { Zap, Check, Plus, Trash2, Edit3, Sliders } from "lucide-react";

export const DEFAULT_TREATMENT_ITEMS = [
  {
    id: "trt-1",
    name: "Electroterapia TENS Convencional",
    category: "agentes_fisicos",
    dosage: "100 Hz, 80 µs, 15 min, intensidad sensitiva",
    notes: "Bloqueo de compuerta para dolor agudo / subagudo.",
    applied: true,
  },
  {
    id: "trt-2",
    name: "Crioterapia con Compresa Fría / Ice Pack",
    category: "agentes_fisicos",
    dosage: "12 a 15 min con toalla de protección",
    notes: "Vasoconstricción y disminución de mediadores inflamatorios.",
    applied: true,
  },
  {
    id: "trt-3",
    name: "Terapia Manual Miofascial & Trigger Points",
    category: "terapia_manual",
    dosage: "15 min de presión isquémica y deslizamiento longitudinal",
    notes: "Desactivación de puntos gatillo miofasciales activos.",
    applied: true,
  },
  {
    id: "trt-4",
    name: "Punción Seca Superficial / Profunda",
    category: "puncion_seca",
    dosage: "Aguja 0.25x40mm, técnica de entrada-salida rápida",
    notes: "Respuesta de espasmo local (REL) en vientre muscular.",
    applied: false,
  },
  {
    id: "trt-5",
    name: "Vendaje Neuromuscular (Kinesiotaping)",
    category: "vendaje",
    dosage: "Corte en abanico con tensión al 15% para drenaje",
    notes: "Facilitación propioceptiva y descompresión tisular.",
    applied: false,
  },
  {
    id: "trt-6",
    name: "Reeducación Postural & Ejercicios Terapéuticos",
    category: "ejercicio_terapeutico",
    dosage: "20 min de control motor y estabilización lumbo-pélvica",
    notes: "Activación del core profundo y transverso abdominal.",
    applied: true,
  },
];

export const EditableTreatments = ({
  treatments,
  onChange,
  readOnly = false,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states for new/edit
  const [nameInput, setNameInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("agentes_fisicos");
  const [dosageInput, setDosageInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  const currentList =
    treatments.length > 0 ? treatments : DEFAULT_TREATMENT_ITEMS;

  const handleToggleApplied = (id) => {
    if (readOnly) return;
    const updated = currentList.map((t) =>
      t.id === id ? { ...t, applied: !t.applied } : t,
    );
    onChange(updated);
  };

  const handleDelete = (id) => {
    if (readOnly) return;
    const updated = currentList.filter((t) => t.id !== id);
    onChange(updated);
  };

  const handleStartEdit = (t) => {
    setEditingId(t.id);
    setNameInput(t.name);
    setCategoryInput(t.category);
    setDosageInput(t.dosage);
    setNotesInput(t.notes || "");
    setIsAddingNew(false);
  };

  const handleSaveEdit = () => {
    if (!nameInput.trim()) return;
    const updated = currentList.map((t) => {
      if (t.id === editingId) {
        return {
          ...t,
          name: nameInput.trim(),
          category: categoryInput,
          dosage: dosageInput.trim() || "Dosificación estándar",
          notes: notesInput.trim() || undefined,
        };
      }
      return t;
    });
    onChange(updated);
    setEditingId(null);
  };

  const handleAddNew = () => {
    if (!nameInput.trim()) return;
    const newItem = {
      id: `trt-custom-${Date.now()}`,
      name: nameInput.trim(),
      category: categoryInput,
      dosage: dosageInput.trim() || "15 min de aplicación terapéutica",
      notes: notesInput.trim() || undefined,
      applied: true,
    };
    onChange([...currentList, newItem]);
    setNameInput("");
    setDosageInput("");
    setNotesInput("");
    setIsAddingNew(false);
  };

  const categoryBadges = {
    agentes_fisicos: {
      label: "Agentes Físicos",
      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    },
    terapia_manual: {
      label: "Terapia Manual",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    ejercicio_terapeutico: {
      label: "Ejercicio",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    puncion_seca: {
      label: "Punción Seca",
      color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    },
    vendaje: {
      label: "Kinesiotaping",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    otro: {
      label: "Técnica Especial",
      color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
  };

  return (
    <div className="space-y-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Tratamiento y Técnicas de Fisioterapia</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Totalmente Editable
            </span>
          </h4>
          <p className="text-xs text-slate-400">
            Personaliza las técnicas aplicadas, parámetros dosimétricos
            (frecuencia, tiempo, intensidad) y notas clínicas.
          </p>
        </div>

        {!readOnly && !isAddingNew && (
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(true);
              setEditingId(null);
              setNameInput("");
              setDosageInput("");
              setNotesInput("");
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Técnica Personalizada</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form Modal / Inline Box */}
      {(isAddingNew || editingId) && (
        <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              <span>
                {editingId
                  ? "Editar Parámetros de Técnica"
                  : "Nueva Técnica Terapéutica"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingId(null);
              }}
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase block">
                Nombre de la Técnica:
              </label>
              <input
                type="text"
                placeholder="ej. TENS Burst, Punción profunda, Movilización Maitland..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase block">
                Categoría Terapéutica:
              </label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
              >
                <option value="agentes_fisicos">
                  Agentes Físicos (Electro, Frío, Calor, US)
                </option>
                <option value="terapia_manual">
                  Terapia Manual & Masoterapia
                </option>
                <option value="ejercicio_terapeutico">
                  Ejercicio Terapéutico & RPG
                </option>
                <option value="puncion_seca">Punción Seca & Invasiva</option>
                <option value="vendaje">
                  Kinesiotaping & Vendaje Funcional
                </option>
                <option value="otro">Otras Técnicas Especializadas</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase block">
                Dosificación & Parámetros (Tiempo, Hz, mA, repeticiones):
              </label>
              <input
                type="text"
                placeholder="ej. 100 Hz, 15 minutos, 20 mA o 3 series de 10 reps..."
                value={dosageInput}
                onChange={(e) => setDosageInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase block">
                Observaciones Clínicas:
              </label>
              <input
                type="text"
                placeholder="ej. Buena tolerancia, alivio del dolor agudo al finalizar la sesión..."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={editingId ? handleSaveEdit : handleAddNew}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              {editingId ? "Guardar Cambios" : "Agregar a la Sesión"}
            </button>
          </div>
        </div>
      )}

      {/* Treatments List */}
      <div className="space-y-2.5">
        {currentList.map((t) => {
          const badge = categoryBadges[t.category] || categoryBadges.otro;
          return (
            <div
              key={t.id}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                t.applied
                  ? "bg-slate-950/80 border-amber-500/40 shadow-sm"
                  : "bg-slate-950/40 border-slate-800 opacity-60"
              }`}
            >
              {/* Checkbox and Info */}
              <div className="flex items-start gap-3 flex-1">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleToggleApplied(t.id)}
                  className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    t.applied
                      ? "bg-amber-400 text-slate-950 font-black"
                      : "border border-slate-700 bg-slate-900 text-transparent hover:border-slate-500"
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5
                      className={`text-xs font-black ${t.applied ? "text-white" : "text-slate-400"}`}
                    >
                      {t.name}
                    </h5>
                    <span
                      className={`text-xs font-bold px-2 py-0.2 rounded-full border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    {t.applied && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        ● Aplicado hoy
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-amber-200/90 font-mono font-medium">
                    ⚡ {t.dosage}
                  </p>

                  {t.notes && (
                    <p className="text-xs text-slate-400 leading-snug">
                      {t.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!readOnly && (
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(t)}
                    className="p-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Editar parámetros y dosificación"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 px-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Eliminar técnica"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
