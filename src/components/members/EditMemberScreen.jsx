// Editar los datos personales del alumno (se guardan en la tabla alumnos)
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useGym } from "../../context/GymContext";

const OBJETIVOS = [
  ["hipertrofia", "Ganancia muscular / Hipertrofia"],
  ["perdida_peso", "Pérdida de grasa / peso"],
  ["fuerza", "Aumento de fuerza"],
  ["tonificacion", "Tonificación general"],
  ["resistencia", "Resistencia"],
  ["rehabilitacion", "Salud / Rehabilitación"],
];

export const EditMemberScreen = ({ member, onVolver }) => {
  const { updateMember, trainers } = useGym();
  const [f, setF] = useState({
    fullName: member.fullName || "",
    dni: member.dni || "",
    phone: member.phone || "",
    email: member.email || "",
    gender: member.gender === "F" ? "F" : "M",
    birthDate: member.birthDate ? String(member.birthDate).slice(0, 10) : "",
    address: member.address || "",
    emergencyName: member.emergencyContact?.name || "",
    emergencyPhone: member.emergencyContact?.phone || "",
    emergencyRel: member.emergencyContact?.relationship || "Familiar",
    medicalNotes: member.medicalNotes || "",
    objective: member.objective || "tonificacion",
    assignedTrainerId: member.assignedTrainerId || "",
    notes: member.notes || "",
  });
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const campo = "mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const ok = await updateMember(member.id, {
      fullName: f.fullName.trim(),
      dni: f.dni.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      gender: f.gender,
      birthDate: f.birthDate,
      address: f.address.trim(),
      emergencyContact: { name: f.emergencyName.trim(), phone: f.emergencyPhone.trim(), relationship: f.emergencyRel },
      medicalNotes: f.medicalNotes.trim(),
      objective: f.objective,
      assignedTrainerId: f.assignedTrainerId,
      notes: f.notes.trim(),
    });
    setGuardando(false);
    if (ok !== false) onVolver();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto min-h-full p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-bold flex items-center gap-1.5 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <h2 className="text-lg font-black text-slate-900">Editar datos · {member.fullName}</h2>
        </div>
        <form onSubmit={guardar} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <label className="block sm:col-span-2"><span className="font-bold text-slate-700">Nombres y apellidos *</span><input required value={f.fullName} onChange={set("fullName")} className={campo} /></label>
            <label className="block"><span className="font-bold text-slate-700">DNI *</span><input required pattern="\d{8}" maxLength={8} value={f.dni} onChange={set("dni")} className={campo} /></label>
            <label className="block"><span className="font-bold text-slate-700">Celular *</span><input required value={f.phone} onChange={set("phone")} className={campo} /></label>
            <label className="block"><span className="font-bold text-slate-700">Correo</span><input type="email" value={f.email} onChange={set("email")} className={campo} /></label>
            <label className="block"><span className="font-bold text-slate-700">Sexo *</span>
              <select value={f.gender} onChange={set("gender")} className={campo}><option value="M">Masculino</option><option value="F">Femenino</option></select>
            </label>
            <label className="block"><span className="font-bold text-slate-700">Fecha de nacimiento *</span><input type="date" required value={f.birthDate} onChange={set("birthDate")} className={campo} /></label>
            <label className="block sm:col-span-2"><span className="font-bold text-slate-700">Dirección</span><input value={f.address} onChange={set("address")} className={campo} /></label>
            <label className="block"><span className="font-bold text-slate-700">Contacto de emergencia</span><input value={f.emergencyName} onChange={set("emergencyName")} className={campo} /></label>
            <label className="block"><span className="font-bold text-slate-700">Celular de emergencia</span><input value={f.emergencyPhone} onChange={set("emergencyPhone")} className={campo} /></label>
            <label className="block"><span className="font-bold text-slate-700">Parentesco</span>
              <select value={f.emergencyRel} onChange={set("emergencyRel")} className={campo}>
                {["Madre", "Padre", "Pareja", "Hermano(a)", "Hijo(a)", "Familiar", "Amigo(a)", "Otro"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="block"><span className="font-bold text-slate-700">Objetivo</span>
              <select value={f.objective} onChange={set("objective")} className={campo}>{OBJETIVOS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </label>
            <label className="block"><span className="font-bold text-slate-700">Entrenador asignado</span>
              <select value={f.assignedTrainerId} onChange={set("assignedTrainerId")} className={campo}>
                <option value="">Sin entrenador</option>
                {trainers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2 lg:col-span-3"><span className="font-bold text-slate-700">Restricciones médicas / lesiones</span><input value={f.medicalNotes} onChange={set("medicalNotes")} className={campo} /></label>
            <label className="block sm:col-span-2 lg:col-span-3"><span className="font-bold text-slate-700">Notas</span><textarea rows={2} value={f.notes} onChange={set("notes")} className={campo} /></label>
          </div>
          <button disabled={guardando} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black cursor-pointer">
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
};
