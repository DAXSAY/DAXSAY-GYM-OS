import React, { useState, useEffect } from "react";
import { X, UserPlus, CreditCard, IdCard, Dumbbell } from "lucide-react";
import { useGym } from "../../context/GymContext";
import confetti from "canvas-confetti";
import { hoyISO } from "../../utils/fecha";
import { DebtDueDatePicker } from "./DebtDueDate";

export const NewMemberModal = ({ isOpen, onClose, inicial = null, onCreado }) => {
  const { plans, trainers, routines, addMember } = useGym();
  const [cuenta, setCuenta] = useState(null);

  const todayStr = hoyISO();

  const [dni, setDni] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+51");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("M");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRel, setEmergencyRel] = useState("Familiar");

  const [medicalNotes, setMedicalNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [objective, setObjective] = useState("hipertrofia");

  const [selectedPlanId, setSelectedPlanId] = useState(
    plans[1]?.id || plans[0]?.id || "",
  );
  const [startDate, setStartDate] = useState(todayStr);
  const [assignedTrainerId, setAssignedTrainerId] = useState("");
  const [assignedRoutineId, setAssignedRoutineId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("efectivo");

  // Matrícula desde el CRM: llega con los datos del prospecto ya escritos
  useEffect(() => {
    if (!isOpen || !inicial) return;
    if (inicial.fullName) setFullName(inicial.fullName);
    if (inicial.phone) setPhone(inicial.phone.startsWith("+") ? inicial.phone : `+51${inicial.phone.replace(/\D/g, "")}`);
    if (inicial.dni) setDni(inicial.dni);
    if (inicial.email) setEmail(inicial.email);
    if (inicial.planId) setSelectedPlanId(String(inicial.planId));
    if (inicial.objective) setObjective(inicial.objective);
    if (inicial.notes) setNotes(inicial.notes);
  }, [isOpen, inicial]);

  // Los planes llegan desde la base de datos: elegir uno por defecto al cargar
  useEffect(() => {
    if (!plans.find((p) => p.id === selectedPlanId) && plans.length > 0) {
      setSelectedPlanId((plans.find((p) => p.popular) || plans[0]).id);
    }
  }, [plans]);

  if (!isOpen) return null;

  const currentPlan = plans.find((p) => p.id === selectedPlanId);

  // Compute calculated end date
  const computeEndDate = () => {
    if (!currentPlan) return todayStr;
    const start = new Date(startDate || todayStr);
    const end = new Date(start);
    end.setDate(end.getDate() + currentPlan.durationDays);
    return end.toISOString().split("T")[0];
  };

  const calculatedEndDate = computeEndDate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !dni.trim() || !phone.trim() || !currentPlan) {
      alert(
        "Por favor completa los campos obligatorios: Nombre, DNI, Teléfono y Plan.",
      );
      return;
    }

    const debeSaldo = amountPaid !== "" && Number(amountPaid) < currentPlan.price - 0.004;
    if (debeSaldo && !debtDueDate) {
      setErrorForm("Indica hasta qué fecha cancelará el saldo pendiente.");
      return;
    }
    setErrorForm("");
    const nuevo = await addMember({
      dni: dni.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gender,
      birthDate,
      emergencyContact: {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
        relationship: emergencyRel || "Familiar",
      },
      address: address.trim(),
      amountPaid: amountPaid === "" ? undefined : Number(amountPaid),
      debtDueDate: debeSaldo ? debtDueDate : undefined,
      medicalNotes: medicalNotes.trim() || undefined,
      objective,
      planId: currentPlan.id,
      planName: currentPlan.name,
      membershipStartDate: startDate,
      membershipEndDate: calculatedEndDate,
      assignedTrainerId: assignedTrainerId || undefined,
      assignedRoutineId: assignedRoutineId || undefined,
      notes: notes.trim() || undefined,
      lastPaymentAmount: amountPaid === "" ? currentPlan.price : Number(amountPaid),
      lastPaymentDate: startDate,
      paymentMethod,
    });
    if (!nuevo) return; // el error ya se mostró
    onCreado?.(nuevo);

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.5 },
    });

    if (nuevo.cuentaNueva) setCuenta({ ...nuevo.cuentaNueva, nombre: nuevo.fullName, telefono: nuevo.phone, codigo: nuevo.codeLabel });
    else onClose();
  };

  if (cuenta) {
    const texto = `¡Bienvenido(a) a RADICAL, ${cuenta.nombre}!\nTu código para marcar asistencia: ${cuenta.codigo}\nTu acceso al portal del alumno:\nUsuario: ${cuenta.usuario}\nContraseña temporal: ${cuenta.claveTemporal}\nAl ingresar por primera vez el sistema te pedirá crear tu propia contraseña.`;
    const tel = String(cuenta.telefono || "").replace(/\D/g, "");
    return (
      <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto min-h-full bg-white p-6 sm:p-10 text-slate-800 flex flex-col justify-center gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl">
              ✓
            </div>
            <h2 className="text-2xl font-extrabold mt-3">Alumno registrado</h2>
            <p className="text-slate-500">{cuenta.nombre} ya tiene su acceso al portal del alumno.</p>
          </div>
          <div className="rounded-2xl bg-slate-900 text-white p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Código para marcar asistencia</p>
            <p className="text-5xl font-black font-mono tracking-wider mt-1">{cuenta.codigo}</p>
            <p className="text-sm text-slate-300 mt-1">En recepción basta con decir o escribir el número.</p>
          </div>
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-slate-500">Usuario</span>
              <span className="font-mono font-black">{cuenta.usuario}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-slate-500">Contraseña temporal</span>
              <span className="font-mono font-black">{cuenta.claveTemporal}</span>
            </div>
            <p className="text-sm text-slate-600">
              En su primer ingreso el sistema le pedirá crear su propia contraseña. Solo verá su membresía, rutina,
              plan de alimentación, medidas, fisioterapia y citas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/${tel.length === 9 ? "51" + tel : tel}?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Enviar por WhatsApp
            </a>
            <button
              type="button"
              onClick={() => {
                setCuenta(null);
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto min-h-full bg-white flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Registro de Nuevo Alumno
              </h2>
              <p className="text-xs text-gray-500">
                Inscripción, asignación de plan y registro de pago inicial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-5 space-y-4 text-xs"
        >
          {/* Section 1: Personal Data */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-2.5">
              <IdCard className="w-3.5 h-3.5" />
              1. Datos Personales
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombres y Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez Ramos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  DNI / Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 74829103"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. +51987654321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="alumno@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Género
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  required
                  max={todayStr}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Ej. Av. Los Álamos 123, Urb. ..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fitness Objective & Health */}
          <div className="pt-2 border-t border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-2.5">
              <Dumbbell className="w-3.5 h-3.5" />
              2. Objetivo & Salud
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Objetivo de Entrenamiento
                </label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="hipertrofia">
                    💪 Ganancia Muscular / Hipertrofia
                  </option>
                  <option value="perdida_peso">
                    🔥 Pérdida de Grasa / Peso
                  </option>
                  <option value="fuerza">⚡ Aumento de Fuerza</option>
                  <option value="tonificacion">✨ Tonificación General</option>
                  <option value="resistencia">
                    🏃 Resistencia Cardiovascular & Funcional
                  </option>
                  <option value="rehabilitacion">
                    🩺 Salud & Postura / Rehabilitación
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Contacto de Emergencia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre del familiar o contacto"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Celular de emergencia *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9XX XXX XXX"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Parentesco</label>
                  <select
                    value={emergencyRel}
                    onChange={(e) => setEmergencyRel(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {["Madre", "Padre", "Pareja", "Hermano(a)", "Hijo(a)", "Familiar", "Amigo(a)", "Otro"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Restricciones Médicas / Lesiones
                </label>
                <input
                  type="text"
                  placeholder="Ej. Lesión previa en hombro derecho, hipertensión, asma, etc."
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Membership Plan & Staff Assignment */}
          <div className="pt-2 border-t border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-2.5">
              <CreditCard className="w-3.5 h-3.5" />
              3. Plan de Membresía & Asignaciones
            </span>

            {/* Plans choice */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2.5">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedPlanId === p.id
                      ? "bg-blue-50/70 border-blue-600 ring-1 ring-blue-600"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.durationDays} días
                  </p>
                  <p className="text-blue-700 font-bold font-mono text-xs mt-0.5">
                    S/ {p.price}
                  </p>
                  <p className={`text-[10px] font-bold mt-0.5 ${p.freezeDays ? "text-sky-700" : "text-gray-400"}`}>
                    ❄️ {p.freezeDays ? `${p.freezeDays} días congelamiento` : "Sin congelamiento"}
                  </p>
                </div>
              ))}
            </div>
            {currentPlan && (
              <p className={`text-xs mb-2.5 px-2.5 py-1.5 rounded-md border ${currentPlan.freezeDays ? "bg-sky-50 text-sky-800 border-sky-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                ❄️ {currentPlan.freezeRules || "Sin congelamiento"}
                {currentPlan.freezeDays ? " · todo o nada; caduca al vencer la membresía." : "."}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Fecha Fin (Calculada)
                </label>
                <input
                  type="text"
                  disabled
                  value={calculatedEndDate}
                  className="w-full px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-blue-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Entrenador Personal Asignado
                </label>
                <select
                  value={assignedTrainerId}
                  onChange={(e) => setAssignedTrainerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">Opcional: Sin Asignar</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Rutina Inicial Asignada
                </label>
                <select
                  value={assignedRoutineId}
                  onChange={(e) => setAssignedRoutineId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">Opcional: Sin Rutina</option>
                  {routines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="yape_plin">📱 Yape / Plin</option>
                  <option value="tarjeta">💳 Tarjeta Débito / Crédito</option>
                  <option value="transferencia">
                    🏦 Transferencia Bancaria
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Bar Summary */}
          {currentPlan && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                  Total a Pagar e Ingreso de Caja:
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {currentPlan.name} • Vence: {calculatedEndDate}
                </p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-lg font-bold text-blue-700 font-mono block">
                  S/ {(currentPlan?.price || 0).toFixed(2)}
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 justify-end">
                  Paga hoy S/
                  <input
                    type="number"
                    min="0.1"
                    step="0.10"
                    max={currentPlan?.price || 0}
                    placeholder={(currentPlan?.price || 0).toFixed(2)}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-24 px-2 py-1 rounded-md border border-gray-300 text-right font-mono font-bold"
                  />
                </label>
                {amountPaid !== "" && Number(amountPaid) < (currentPlan?.price || 0) && (
                  <span className="text-xs font-bold text-rose-600 block">
                    Queda debiendo S/ {((currentPlan?.price || 0) - Number(amountPaid || 0)).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}
          {currentPlan && amountPaid !== "" && Number(amountPaid) < (currentPlan?.price || 0) && (
            <DebtDueDatePicker value={debtDueDate} onChange={setDebtDueDate} membershipEnd={calculatedEndDate} />
          )}
          {errorForm && <p className="text-xs font-bold text-rose-600">{errorForm}</p>}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-gray-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs transition-all cursor-pointer"
            >
              Completar Inscripción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
