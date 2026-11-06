import React, { useState, useMemo } from "react";
import {
  FileText,
  Clock,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Printer,
  Briefcase,
  HeartPulse,
  Utensils,
  Dumbbell,
  Store,
  Wrench,
  Trash2,
  X,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import confetti from "canvas-confetti";

export const StaffContractsModule = () => {
  const {
    staffContracts,
    addStaffContract,
    updateStaffContract,
    renewStaffContract,
    deleteStaffContract,
    attendances,
  } = useGym();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [selectedContractForDoc, setSelectedContractForDoc] = useState(null);
  const [renewingContract, setRenewingContract] = useState(null);
  const [renewDuration, setRenewDuration] = useState("6_months");
  const [renewSalary, setRenewSalary] = useState(0);

  // New Contract Form State
  const [formName, setFormName] = useState("");
  const [formDni, setFormDni] = useState("");
  const [formRole, setFormRole] = useState("trainer");
  const [formRoleTitle, setFormRoleTitle] = useState(
    "Entrenador de Musculación & Sala",
  );
  const [formPhone, setFormPhone] = useState("+51 ");
  const [formEmail, setFormEmail] = useState("");
  const [formContractType, setFormContractType] = useState("6_months");
  const [formStartDate, setFormStartDate] = useState("2026-09-01");
  const [formMonthlySalary, setFormMonthlySalary] = useState(2000);
  const [formWeeklyHours, setFormWeeklyHours] = useState(40);
  const [formWorkedHours, setFormWorkedHours] = useState(160);
  const [formModality, setFormModality] = useState("full_time");
  const [formBankAccount, setFormBankAccount] = useState("BCP: 193-");
  const [formNotes, setFormNotes] = useState("");

  // Auto calculate end date based on duration
  const calculatedEndDate = useMemo(() => {
    try {
      const start = new Date(formStartDate);
      const months =
        formContractType === "3_months"
          ? 3
          : formContractType === "6_months"
            ? 6
            : 12;
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      return end.toISOString().split("T")[0];
    } catch {
      return "2027-03-01";
    }
  }, [formStartDate, formContractType]);

  // Handle Role preset title
  const handleRoleChange = (role) => {
    setFormRole(role);
    switch (role) {
      case "trainer":
        setFormRoleTitle("Entrenador de Musculación & Fuerza");
        setFormMonthlySalary(2000);
        break;
      case "physiotherapist":
        setFormRoleTitle("Fisioterapeuta Colegiado & Kinesiólogo");
        setFormMonthlySalary(2600);
        break;
      case "nutritionist":
        setFormRoleTitle("Lic. en Nutrición Deportiva");
        setFormMonthlySalary(2400);
        break;
      case "receptionist":
        setFormRoleTitle("Recepcionista, Caja & Atención");
        setFormMonthlySalary(1400);
        break;
      case "maintenance":
        setFormRoleTitle("Mantenimiento General & Limpieza");
        setFormMonthlySalary(1300);
        break;
      case "manager":
        setFormRoleTitle("Coordinador General de Operaciones");
        setFormMonthlySalary(3200);
        break;
    }
  };

  // Filter staff contracts
  const filteredContracts = useMemo(() => {
    return staffContracts.filter((c) => {
      const matchSearch =
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.dni.includes(searchTerm) ||
        c.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = roleFilter === "all" || c.role === roleFilter;
      const matchDuration =
        durationFilter === "all" || c.contractType === durationFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;

      return matchSearch && matchRole && matchDuration && matchStatus;
    });
  }, [staffContracts, searchTerm, roleFilter, durationFilter, statusFilter]);

  // KPI Metrics
  const totalStaff = staffContracts.length;
  const count3Months = staffContracts.filter(
    (c) => c.contractType === "3_months",
  ).length;
  const count6Months = staffContracts.filter(
    (c) => c.contractType === "6_months",
  ).length;
  const count1Year = staffContracts.filter(
    (c) => c.contractType === "1_year",
  ).length;
  const totalMonthlyPayroll = staffContracts.reduce(
    (sum, c) => sum + Number(c.monthlySalary || 0),
    0,
  );
  const totalWorkedHours = staffContracts.reduce(
    (sum, c) => sum + Number(c.workedHoursThisMonth || 0),
    0,
  );
  const expiringSoonCount = staffContracts.filter(
    (c) => c.status === "expiring_soon",
  ).length;

  // Submit new contract
  const handleCreateContract = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formDni.trim()) return;

    const label =
      formContractType === "3_months"
        ? "Contrato 3 Meses"
        : formContractType === "6_months"
          ? "Contrato 6 Meses"
          : "Contrato 1 Año";

    const deptMap = {
      trainer: "Entrenamiento",
      physiotherapist: "Fisioterapia",
      nutritionist: "Nutrición",
      receptionist: "Recepción",
      maintenance: "Operaciones",
      manager: "Operaciones",
    };

    const hourly = Number(
      (formMonthlySalary / (formWeeklyHours * 4)).toFixed(2),
    );

    addStaffContract({
      staffId: `stf-${Date.now()}`,
      fullName: formName.trim(),
      dni: formDni.trim(),
      role: formRole,
      roleTitle: formRoleTitle.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      contractType: formContractType,
      contractDurationLabel: label,
      startDate: formStartDate,
      endDate: calculatedEndDate,
      status: "active",
      monthlySalary: formMonthlySalary,
      hourlyRate: hourly,
      assignedWeeklyHours: formWeeklyHours,
      workedHoursThisMonth: formWorkedHours,
      workModality: formModality,
      department: deptMap[formRole],
      bankAccount: formBankAccount.trim(),
      paymentStatus: "al_dia",
      notes: formNotes.trim() || undefined,
    });

    confetti({ particleCount: 50, spread: 60 });
    setIsNewContractModalOpen(false);
  };

  // Submit renewal
  const handleConfirmRenewal = () => {
    if (!renewingContract) return;
    renewStaffContract(
      renewingContract.id,
      renewDuration,
      renewSalary || renewingContract.monthlySalary,
    );
    confetti({ particleCount: 40, spread: 50 });
    setRenewingContract(null);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "trainer":
        return {
          bg: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Dumbbell,
          label: "Entrenador",
        };
      case "physiotherapist":
        return {
          bg: "bg-cyan-100 text-cyan-800 border-cyan-200",
          icon: HeartPulse,
          label: "Fisioterapia",
        };
      case "nutritionist":
        return {
          bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: Utensils,
          label: "Nutrición",
        };
      case "receptionist":
        return {
          bg: "bg-amber-100 text-amber-800 border-amber-200",
          icon: Store,
          label: "Recepción",
        };
      case "maintenance":
        return {
          bg: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Wrench,
          label: "Mantenimiento",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-200",
          icon: Briefcase,
          label: "Staff",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Briefcase className="w-4 h-4" />
              <span>Gestión de Recursos Humanos & Contratos Laborales</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Contratos de Personal & Nómina
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Administración integral del personal de trabajo (entrenadores,
              fisioterapeutas, nutricionistas, recepcionistas y operaciones) con
              contratos laborales de 3 meses, 6 meses o 1 año, sueldos y control
              de horas trabajadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewContractModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Contrato de Personal</span>
            </button>
          </div>
        </div>

        {/* HR KPI Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Personal Activo
            </span>
            <span className="text-xl font-extrabold text-white">
              {totalStaff}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Contratos 3 Meses
            </span>
            <span className="text-xl font-extrabold text-amber-400">
              {count3Months}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Contratos 6 Meses
            </span>
            <span className="text-xl font-extrabold text-cyan-400">
              {count6Months}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Contratos 1 Año
            </span>
            <span className="text-xl font-extrabold text-emerald-400">
              {count1Year}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Horas Trabajadas Mes
            </span>
            <span className="text-xl font-extrabold text-blue-300">
              {totalWorkedHours} h
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              Presupuesto Sueldos
            </span>
            <span className="text-xl font-extrabold text-white">
              S/. {totalMonthlyPayroll.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por colaborador, DNI o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los cargos</option>
            <option value="trainer">Entrenadores</option>
            <option value="physiotherapist">Fisioterapia</option>
            <option value="nutritionist">Nutrición</option>
            <option value="receptionist">Recepción / Caja</option>
            <option value="maintenance">Mantenimiento</option>
          </select>

          {/* Duration Filter */}
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las duraciones</option>
            <option value="3_months">Contrato 3 Meses</option>
            <option value="6_months">Contrato 6 Meses</option>
            <option value="1_year">Contrato 1 Año</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="expiring_soon">Por Vencer</option>
            <option value="expired">Vencidos</option>
          </select>
        </div>
      </div>

      {/* Contracts Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredContracts.map((contract) => {
          const roleBadge = getRoleBadge(contract.role);
          const RoleIcon = roleBadge.icon;
          const isExpiring = contract.status === "expiring_soon";

          return (
            <div
              key={contract.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all space-y-4 ${
                isExpiring
                  ? "border-amber-400 ring-1 ring-amber-400/50"
                  : "border-slate-200"
              }`}
            >
              {/* Top Row: Photo, Name, Role Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  {contract.photoUrl ? (
                    <img
                      src={contract.photoUrl}
                      alt={contract.fullName}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center shrink-0 text-sm">
                      {contract.fullName.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate">
                      {contract.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {contract.roleTitle}
                    </p>
                    <span className="text-xs text-slate-400">
                      DNI: {contract.dni}
                    </span>
                  </div>
                </div>

                {/* Role Icon Badge */}
                <span
                  className={`p-1.5 rounded-lg border text-xs shrink-0 ${roleBadge.bg}`}
                  title={roleBadge.label}
                >
                  <RoleIcon className="w-4 h-4" />
                </span>
              </div>

              {/* Contract Term Details */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">
                    Tipo de Contrato:
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                      contract.contractType === "1_year"
                        ? "bg-emerald-100 text-emerald-800"
                        : contract.contractType === "6_months"
                          ? "bg-cyan-100 text-cyan-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {contract.contractDurationLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Vigencia:</span>
                  <span className="font-medium text-slate-800">
                    {contract.startDate} al {contract.endDate}
                  </span>
                </div>

                {/* Expiration Alert */}
                {isExpiring && (
                  <div className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-1 rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>
                      ⚠️ Contrato próximo a vencer. Requiere renovación.
                    </span>
                  </div>
                )}
              </div>

              {/* Salary & Hours Worked breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <span className="text-xs font-semibold text-blue-800 block">
                    Sueldo Mensual
                  </span>
                  <span className="text-base font-extrabold text-blue-950">
                    S/. {Number(contract.monthlySalary || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-blue-700 block">
                    (S/. {Number(contract.hourlyRate || 0).toFixed(2)}/hora)
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-semibold text-slate-600 block">
                    Horas Trabajadas Mes
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {Number(contract.workedHoursThisMonth || 0)} h
                  </span>
                  <span className="text-xs text-slate-500 block">
                    de {Number(contract.assignedWeeklyHours || 0) * 4} h pactadas
                  </span>
                </div>
              </div>

              {/* Payment & Bank info */}
              <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="truncate">
                  Cuenta: {contract.bankAccount || "Efectivo / Recibo"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                    contract.paymentStatus === "al_dia"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {contract.paymentStatus === "al_dia"
                    ? "Pago Al Día"
                    : "Pago Pendiente"}
                </span>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedContractForDoc(contract)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ver Contrato</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setRenewingContract(contract);
                      setRenewDuration("6_months");
                      setRenewSalary(contract.monthlySalary);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                    title="Renovar contrato"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Renovar</span>
                  </button>

                  <button
                    onClick={() => deleteStaffContract(contract.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW CONTRACT DOCUMENT MODAL (FORMAL LEGAL AGREEMENT) */}
      {selectedContractForDoc && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-6xl mx-auto min-h-full bg-white overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
                  Documento Oficial de Recursos Humanos
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Contrato Individual de Trabajo a Plazo Determinado
                </h3>
              </div>
              <button
                onClick={() => setSelectedContractForDoc(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contract Body Document */}
            <div className="rd-claro bg-white p-5 sm:p-6 space-y-4 text-xs text-slate-800 max-h-[75vh] overflow-y-auto leading-relaxed">
              <div className="text-center pb-3 border-b border-slate-200">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  CONTRATO DE TRABAJO BAJO MODALIDAD DE SERVICIO (
                  {selectedContractForDoc.contractDurationLabel.toUpperCase()})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  GIMNASIO RADICAL GYM FITNESS CENTER S.A.C. • RUC: 20608945123
                </p>
              </div>

              <p>
                Conste por el presente documento el{" "}
                <strong>Contrato Individual de Trabajo</strong> que celebran, de
                una parte,
                <strong> RADICAL GYM FITNESS CENTER S.A.C.</strong>, en adelante{" "}
                <strong>LA EMPRESA</strong>, y de la otra parte
                <strong> Don/Doña {selectedContractForDoc.fullName}</strong>,
                con Documento Nacional de Identidad (DNI) N°{" "}
                <strong>{selectedContractForDoc.dni}</strong>, domiciliado para
                los efectos del presente contrato, en adelante{" "}
                <strong>EL TRABAJADOR</strong>, en los términos y condiciones
                siguientes:
              </p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p>
                  <strong>CLÁUSULA PRIMERA (OBJETO Y CARGO):</strong> LA EMPRESA
                  contrata los servicios de EL TRABAJADOR para que desempeñe las
                  funciones inherentes al cargo de{" "}
                  <strong>{selectedContractForDoc.roleTitle}</strong> en el
                  Departamento de{" "}
                  <strong>{selectedContractForDoc.department}</strong>.
                </p>

                <p>
                  <strong>CLÁUSULA SEGUNDA (DURACIÓN DEL CONTRATO):</strong> El
                  presente contrato se celebra por un periodo pactado de
                  <strong>
                    {" "}
                    {selectedContractForDoc.contractDurationLabel}
                  </strong>
                  , iniciando sus labores con fecha
                  <strong> {selectedContractForDoc.startDate}</strong> y
                  concluyendo indefectiblemente el
                  <strong> {selectedContractForDoc.endDate}</strong>.
                </p>

                <p>
                  <strong>CLÁUSULA TERCERA (REMUNERACIÓN Y HORAS):</strong> LA
                  EMPRESA abonará a EL TRABAJADOR una remuneración mensual fija
                  de
                  <strong>
                    {" "}
                    S/. {Number(selectedContractForDoc.monthlySalary || 0).toFixed(2)} Soles
                  </strong>{" "}
                  (tarifa proporcional de S/.{" "}
                  {Number(selectedContractForDoc.hourlyRate || 0).toFixed(2)} por hora),
                  sujeta a las deducciones de ley. La jornada laboral pactada
                  comprende{" "}
                  <strong>
                    {selectedContractForDoc.assignedWeeklyHours} horas semanales
                  </strong>{" "}
                  (
                  {selectedContractForDoc.workModality === "full_time"
                    ? "Jornada Completa"
                    : "Jornada Parcial"}
                  ).
                </p>

                <p>
                  <strong>
                    CLÁUSULA CUARTA (HORAS TRABAJADAS REGISTRADAS):
                  </strong>{" "}
                  Las horas trabajadas son registradas mediante el reloj
                  marcador biométrico y de código del gimnasio. En el presente
                  periodo mensual se registran acumuladas{" "}
                  <strong>
                    {selectedContractForDoc.workedHoursThisMonth} horas
                    laboradas
                  </strong>
                  .
                </p>

                <p>
                  <strong>CLÁUSULA QUINTA (MODALIDAD DE PAGO):</strong> La
                  remuneración será abonada vía abono en cuenta bancaria
                  declarada:
                  <strong>
                    {" "}
                    {selectedContractForDoc.bankAccount ||
                      "Abono directo de nómina"}
                  </strong>
                  .
                </p>
              </div>

              {/* ANEXO: HISTORIAL DE ASISTENCIAS, HORAS Y ESTADOS (Puntual, Tarde, Falta, Permiso & Motivo) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Anexo Laboral: Registro de Horas & Asistencias del
                      Colaborador
                    </span>
                  </h4>
                  <span className="text-xs text-slate-500 font-semibold">
                    Auditoría de Puntualidad y Faltas
                  </span>
                </div>

                {(() => {
                  const staffAtts = attendances.filter(
                    (a) =>
                      a.userDni === selectedContractForDoc.dni ||
                      a.userName === selectedContractForDoc.fullName ||
                      a.contractId === selectedContractForDoc.id,
                  );

                  if (staffAtts.length === 0) {
                    return (
                      <p className="text-xs text-slate-500 italic py-2">
                        Sin incidencias registradas en el reloj marcador para
                        este periodo. Jornada regular de{" "}
                        {selectedContractForDoc.assignedWeeklyHours}h semanales.
                      </p>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg bg-white">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-2.5">Fecha</th>
                            <th className="py-2 px-2.5">Hora Entrada</th>
                            <th className="py-2 px-2.5">Horas Laboradas</th>
                            <th className="py-2 px-2.5">Estado</th>
                            <th className="py-2 px-2.5">
                              Motivo de Incidencia
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {staffAtts.map((att) => {
                            const isPuntual =
                              att.status === "puntual" ||
                              att.status === "on_time" ||
                              att.status === "authorized";
                            const isTarde =
                              att.status === "tarde" || att.status === "late";
                            const isFalta = att.status === "falta";
                            const isPermiso = att.status === "permiso";

                            return (
                              <tr key={att.id} className="hover:bg-slate-50">
                                <td className="py-2 px-2.5 font-bold text-slate-900">
                                  {att.date}
                                </td>
                                <td className="py-2 px-2.5">{att.time}</td>
                                <td className="py-2 px-2.5 font-extrabold text-blue-700">
                                  {att.hoursWorked !== undefined
                                    ? `${att.hoursWorked} hrs`
                                    : "8 hrs"}
                                </td>
                                <td className="py-2 px-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-extrabold border ${
                                      isPuntual
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : isTarde
                                          ? "bg-amber-100 text-amber-800 border-amber-300"
                                          : isFalta
                                            ? "bg-rose-100 text-rose-800 border-rose-300"
                                            : "bg-blue-100 text-blue-800 border-blue-300"
                                    }`}
                                  >
                                    {isPuntual
                                      ? "Puntual"
                                      : isTarde
                                        ? "Tarde"
                                        : isFalta
                                          ? "Falta"
                                          : "Permiso"}
                                  </span>
                                </td>
                                <td className="py-2 px-2.5 text-slate-600">
                                  {att.reason || att.notes || "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Signatures Area */}
              <div className="grid grid-cols-2 gap-8 pt-8 pb-4 text-center">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">
                    RADICAL GYM FITNESS CENTER
                  </p>
                  <p className="text-xs text-slate-500">
                    Gerencia General / Recursos Humanos
                  </p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-900">
                    {selectedContractForDoc.fullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    DNI: {selectedContractForDoc.dni} (Colaborador)
                  </p>
                </div>
              </div>

              {/* Print / Export Bar */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedContractForDoc(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENEW CONTRACT MODAL */}
      {renewingContract && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-emerald-600" />
                <span>Renovación de Contrato Laboral</span>
              </h3>
              <button
                onClick={() => setRenewingContract(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Colaborador: <strong>{renewingContract.fullName}</strong> (
              {renewingContract.roleTitle})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nueva Duración de Contrato *
                </label>
                <select
                  value={renewDuration}
                  onChange={(e) => setRenewDuration(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="3_months">3 Meses</option>
                  <option value="6_months">6 Meses</option>
                  <option value="1_year">1 Año</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sueldo Mensual Acordado (S/.) *
                </label>
                <input
                  type="number"
                  value={renewSalary}
                  onChange={(e) => setRenewSalary(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRenewingContract(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRenewal}
                className="px-4 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Renovación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CONTRACT REGISTRATION MODAL */}
      {isNewContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-6xl mx-auto min-h-full bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider block">
                  Alta de Personal
                </span>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  Nuevo Contrato de Personal
                </h3>
              </div>
              <button
                onClick={() => setIsNewContractModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateContract}
              className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto"
            >
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ej. Lic. Roberto Gómez"
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    DNI / Documento *
                  </label>
                  <input
                    type="text"
                    value={formDni}
                    onChange={(e) => setFormDni(e.target.value)}
                    placeholder="8 dígitos"
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Role & Role Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Departamento / Área *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="trainer">
                      Entrenador de Sala / Musculación
                    </option>
                    <option value="physiotherapist">
                      Fisioterapia & Rehabilitación
                    </option>
                    <option value="nutritionist">Nutrición Deportiva</option>
                    <option value="receptionist">Recepción & Caja</option>
                    <option value="maintenance">
                      Mantenimiento & Limpieza
                    </option>
                    <option value="manager">Coordinación / Gestión</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Título del Cargo *
                  </label>
                  <input
                    type="text"
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Contract Duration: 3 months, 6 months, 1 year */}
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-2">
                <label className="block font-bold text-blue-900">
                  Duración Pactada del Contrato *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormContractType("3_months")}
                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                      formContractType === "3_months"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    3 Meses
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormContractType("6_months")}
                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                      formContractType === "6_months"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    6 Meses
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormContractType("1_year")}
                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                      formContractType === "1_year"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    1 Año
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-blue-800 pt-1">
                  <span>
                    Fecha de Inicio: <strong>{formStartDate}</strong>
                  </span>
                  <span>
                    Fecha de Fin Estimada: <strong>{calculatedEndDate}</strong>
                  </span>
                </div>
              </div>

              {/* Start Date & Modality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Modalidad de Trabajo *
                  </label>
                  <select
                    value={formModality}
                    onChange={(e) => setFormModality(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full_time">
                      Tiempo Completo (Full-time)
                    </option>
                    <option value="part_time">Medio Tiempo (Part-time)</option>
                    <option value="hourly">Por Horas / Honorarios</option>
                  </select>
                </div>
              </div>

              {/* Salary & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sueldo Mensual (S/.) *
                  </label>
                  <input
                    type="number"
                    value={formMonthlySalary}
                    onChange={(e) =>
                      setFormMonthlySalary(Number(e.target.value))
                    }
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Horas Semanales Asignadas *
                  </label>
                  <input
                    type="number"
                    value={formWeeklyHours}
                    onChange={(e) => setFormWeeklyHours(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Horas Trabajadas este Mes
                  </label>
                  <input
                    type="number"
                    value={formWorkedHours}
                    onChange={(e) => setFormWorkedHours(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bank Account, Phone & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cuenta Bancaria para Depósito
                  </label>
                  <input
                    type="text"
                    value={formBankAccount}
                    onChange={(e) => setFormBankAccount(e.target.value)}
                    placeholder="ej. BCP 193-XXXX-XX"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono Móvil
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewContractModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crear y Emitir Contrato</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
