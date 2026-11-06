import React, { useState, useMemo } from "react";
import {
  BadgeDollarSign,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Trash2,
  PieChart as PieIcon,
  CreditCard,
  Wrench,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Paperclip,
  Upload,
  FileCheck,
  BarChart3,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  Line,
} from "recharts";
import confetti from "canvas-confetti";
import { hoyISO } from "../../utils/fecha";
import { ReporteFinanciero } from "./ReporteFinanciero";
import { RegistroIngreso } from "./RegistroIngreso";

export const FinanceModule = ({ onOpenNewExpenseModal }) => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    metrics,
    payrollEntries,
    payStaffSalary,
    staffContracts,
    attendances,
  } = useGym();

  const [activeTab, setActiveTab] = useState("ledger");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  // Interactive Chart Controls
  const [financeChartView, setFinanceChartView] = useState("bars");
  const [financePeriod, setFinancePeriod] = useState("30d");
  const [hoveredExpenseSlice, setHoveredExpenseSlice] = useState(null);

  // Comparativo con los movimientos reales de caja
  const financeComparativeData = useMemo(() => {
    const hoy = hoyISO();
    const mas = (iso, n) => {
      const [y, m, d] = iso.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
    };
    const tramo = (periodo, a, b) => {
      const enT = transactions.filter((t) => t.date >= a && t.date <= b);
      const ingresos = Math.round(enT.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) * 100) / 100;
      const egresos = Math.round(enT.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) * 100) / 100;
      return { periodo, ingresos, egresos, margen: Math.round((ingresos - egresos) * 100) / 100 };
    };
    if (financePeriod === "30d") {
      return [3, 2, 1, 0].map((k, i) => tramo(`Sem ${i + 1}`, mas(hoy, -(k * 7 + 6)), mas(hoy, -k * 7)));
    }
    const MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const [y, m] = hoy.split("-").map(Number);
    const mesDe = (k) => {
      const ini = new Date(Date.UTC(y, m - 1 - k, 1));
      const fin = new Date(Date.UTC(y, m - k, 0));
      return [ini.toISOString().slice(0, 10), fin.toISOString().slice(0, 10), ini];
    };
    if (financePeriod === "quarter") {
      return [2, 1, 0].map((k) => {
        const [a, b, ini] = mesDe(k);
        return tramo(MES[ini.getUTCMonth()], a, b);
      });
    }
    return [1, 2, 3, 4].map((q) => tramo(`T${q} ${y}`, `${y}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01`, new Date(Date.UTC(y, q * 3, 0)).toISOString().slice(0, 10)));
  }, [financePeriod, transactions]);
  // Custom New Income modal
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("membership");
  const [incomeDesc, setIncomeDesc] = useState("");
  const [incomeMethod, setIncomeMethod] = useState("efectivo");

  // Custom Specific Expense Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("staff_payroll");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseMethod, setExpenseMethod] = useState("transferencia");

  // Staff Payroll payment modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState(null);
  const [payMethod, setPayMethod] = useState("transferencia");
  const [payReceipt, setPayReceipt] = useState("");

  // Case 1: Pagar al Personal de Trabajo con autocompletado y descuento por tardanza
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [selectedStaffContract, setSelectedStaffContract] = useState(
    staffContracts[0] || null,
  );
  const [applyTardinessDiscount, setApplyTardinessDiscount] = useState(true);
  const [tardinessDiscountVal, setTardinessDiscountVal] = useState(30);

  // Case 2: Avería de Equipo
  const [equipmentName, setEquipmentName] = useState(
    "Trotadora Pro-Form Mod. Carbon T7 #2",
  );
  const [breakdownDetails, setBreakdownDetails] = useState("");
  const [technicianOrWorkshop, setTechnicianOrWorkshop] = useState(
    "Servicio Técnico Especializado Lima Fit",
  );

  // Case 3: Gasto Libre con comentario y archivo adjunto
  const [freeExpenseComment, setFreeExpenseComment] = useState("");
  const [attachedFileName, setAttachedFileName] = useState(null);

  // Detect staff tardiness from attendances
  const selectedStaffTardiness = useMemo(() => {
    if (!selectedStaffContract) return [];
    return attendances.filter(
      (a) =>
        (a.userDni === selectedStaffContract.dni ||
          a.userName === selectedStaffContract.fullName) &&
        (a.status === "tarde" || a.status === "late"),
    );
  }, [selectedStaffContract, attendances]);

  // Handle staff selection in expense modal
  const handleSelectStaff = (staff) => {
    setSelectedStaffContract(staff);
    setStaffSearchQuery(staff.fullName);
    setIsStaffDropdownOpen(false);
    // Check if staff has tardiness
    const tardy = attendances.some(
      (a) =>
        (a.userDni === staff.dni || a.userName === staff.fullName) &&
        (a.status === "tarde" || a.status === "late"),
    );

    const base = staff.monthlySalary;
    const finalAmount =
      tardy && applyTardinessDiscount
        ? Math.max(0, base - tardinessDiscountVal)
        : base;
    setExpenseAmount(finalAmount.toString());
    setExpenseDesc(
      `Pago de sueldo a ${staff.fullName} (${staff.roleTitle}) - Contrato ${staff.contractDurationLabel}`,
    );
  };

  // Filtered staff for autocomplete
  const filteredStaffList = useMemo(() => {
    if (!staffSearchQuery) return staffContracts;
    return staffContracts.filter(
      (s) =>
        s.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        s.dni.includes(staffSearchQuery) ||
        s.roleTitle.toLowerCase().includes(staffSearchQuery.toLowerCase()),
    );
  }, [staffContracts, staffSearchQuery]);

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.relatedMemberName &&
        t.relatedMemberName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesCategory && matchesSearch;
  });

  // Calculate category aggregates for expenses
  const expenseCategoriesAgg = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expenseCategoriesAgg[t.category] =
        (expenseCategoriesAgg[t.category] || 0) + t.amount;
    });

  const expensePieData = [
    {
      name: "Sueldos / Nómina Personal",
      value:
        (expenseCategoriesAgg["salary"] || 0) +
        (expenseCategoriesAgg["staff_payroll"] || 0),
      color: "#0ea7b3",
    },
    {
      name: "Avería / Mantenimiento",
      value:
        (expenseCategoriesAgg["maintenance"] || 0) +
        (expenseCategoriesAgg["equipment_breakdown"] || 0),
      color: "#f59e0b",
    },
    {
      name: "Gasto Libre / Compras",
      value: expenseCategoriesAgg["free_expense"] || 0,
      color: "#10b981",
    },
    {
      name: "Alquiler Local",
      value: expenseCategoriesAgg["rent"] || 0,
      color: "#f43f5e",
    },
    {
      name: "Stock / Suplementos",
      value: expenseCategoriesAgg["supplies"] || 0,
      color: "#38bdf8",
    },
    {
      name: "Servicios (Luz/Agua)",
      value: expenseCategoriesAgg["utilities"] || 0,
      color: "#a855f7",
    },
    {
      name: "Otros Gastos",
      value: expenseCategoriesAgg["other"] || 0,
      color: "#64748b",
    },
  ].filter((item) => item.value > 0);

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case "membership":
        return "Membresía Alumno";
      case "pos_sale":
        return "Venta Tienda POS";
      case "personal_training":
        return "Personal Training";
      case "physiotherapy":
        return "Fisioterapia";
      case "nutrition":
        return "Nutrición";
      case "rent":
        return "Alquiler Local";
      case "salary":
      case "staff_payroll":
        return "Pago a Personal de Trabajo";
      case "supplies":
        return "Compra de Suplementos / Stock";
      case "utilities":
        return "Servicios Básicos (Luz, Agua, Net)";
      case "maintenance":
        return "Limpieza y Mantenimiento";
      case "equipment_breakdown":
        return "Avería de Equipo / Máquina";
      case "free_expense":
        return "Gasto Libre con Comprobante";
      case "marketing":
        return "Publicidad & Redes";
      default:
        return "Otros Gastos";
    }
  };

  const handleCreateIncome = (e) => {
    e.preventDefault();
    if (!incomeAmount || isNaN(Number(incomeAmount)) || !incomeDesc) return;

    addTransaction({
      type: "income",
      category: incomeCategory,
      amount: Number(incomeAmount),
      date: hoyISO(),
      paymentMethod: incomeMethod,
      description: incomeDesc,
    });

    setIncomeAmount("");
    setIncomeDesc("");
    setIsIncomeModalOpen(false);
  };

  const handleCreateExpense = (e) => {
    e.preventDefault();
    if (!expenseAmount || isNaN(Number(expenseAmount))) return;

    let finalDesc = expenseDesc;
    let tardinessDiscountApplied = 0;
    let hasDiscount = false;

    // Specific formatting per case
    if (expenseCategory === "staff_payroll" && selectedStaffContract) {
      if (selectedStaffTardiness.length > 0 && applyTardinessDiscount) {
        hasDiscount = true;
        tardinessDiscountApplied = tardinessDiscountVal;
        finalDesc = `Pago de sueldo a ${selectedStaffContract.fullName} (${selectedStaffContract.roleTitle}) — Descuento de S/ ${tardinessDiscountVal} por tardanza aplicado`;
      } else {
        finalDesc = `Pago de sueldo a ${selectedStaffContract.fullName} (${selectedStaffContract.roleTitle}) — Sin descuentos`;
      }
    } else if (expenseCategory === "equipment_breakdown") {
      finalDesc = `Reparación por avería: ${equipmentName} — ${breakdownDetails || "Mantenimiento correctivo urgente"}`;
    } else if (expenseCategory === "free_expense") {
      finalDesc = `Gasto libre: ${freeExpenseComment} ${attachedFileName ? `[Adjunto: ${attachedFileName}]` : ""}`;
    }

    addTransaction({
      type: "expense",
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: hoyISO(),
      paymentMethod: expenseMethod,
      description: finalDesc,
      staffId: selectedStaffContract?.id,
      staffName: selectedStaffContract?.fullName,
      hasTardinessDiscount: hasDiscount,
      tardinessDiscountAmount: tardinessDiscountApplied,
      equipmentName:
        expenseCategory === "equipment_breakdown" ? equipmentName : undefined,
      breakdownDescription:
        expenseCategory === "equipment_breakdown"
          ? breakdownDetails
          : undefined,
      attachmentName: attachedFileName || undefined,
      expenseComment:
        expenseCategory === "free_expense" ? freeExpenseComment : undefined,
    });

    confetti({ particleCount: 50, spread: 70 });
    setExpenseAmount("");
    setExpenseDesc("");
    setBreakdownDetails("");
    setFreeExpenseComment("");
    setAttachedFileName(null);
    setIsExpenseModalOpen(false);
  };

  // Open pay modal
  // Tipos de gasto (tarjetas del formulario de egresos)
  const TIPOS_GASTO = [
    { k: "staff_payroll", icono: "👤", titulo: "Pagar al personal", sub: "Sueldos y planilla", grupo: "principal" },
    { k: "equipment_breakdown", icono: "🛠️", titulo: "Avería de equipo", sub: "Reparación de máquinas", grupo: "principal" },
    { k: "free_expense", icono: "📎", titulo: "Gasto con comprobante", sub: "Con foto o PDF", grupo: "principal" },
    { k: "rent", icono: "🏠", titulo: "Alquiler del local", sub: "Pago mensual", grupo: "fijo" },
    { k: "utilities", icono: "💡", titulo: "Servicios básicos", sub: "Luz, agua, internet", grupo: "fijo" },
    { k: "supplies", icono: "🥤", titulo: "Compra de stock", sub: "Suplementos, bebidas", grupo: "fijo" },
    { k: "marketing", icono: "📢", titulo: "Publicidad", sub: "Redes, volantes", grupo: "fijo" },
    { k: "maintenance", icono: "🧹", titulo: "Limpieza y mantenimiento", sub: "Insumos, ferretería", grupo: "fijo" },
    { k: "other", icono: "📦", titulo: "Otro gasto", sub: "Gastos menores", grupo: "fijo" },
  ];
  const ATAJOS_GASTO = {
    rent: ["Alquiler del local – mes actual", "Garantía / adelanto"],
    utilities: ["Recibo de luz", "Recibo de agua", "Internet y teléfono", "Gas"],
    supplies: ["Compra de suplementos", "Compra de bebidas", "Compra de snacks", "Accesorios para la tienda"],
    marketing: ["Anuncios en Facebook / Instagram", "Volantes e impresiones", "Banner o letrero", "Sorteo / promoción"],
    maintenance: ["Productos de limpieza", "Ferretería", "Pintura / arreglos", "Mantenimiento de baños y duchas"],
    other: ["Agua de mesa", "Movilidad / delivery", "Útiles de oficina", "Bolsas y descartables"],
  };
  const METODOS_GASTO = [
    ["efectivo", "💵", "Efectivo (caja chica)"],
    ["transferencia", "🏦", "Transferencia"],
    ["yape_plin", "📱", "Yape / Plin"],
    ["tarjeta", "💳", "Tarjeta"],
  ];
  const elegirCategoriaGasto = (cat) => {
    setExpenseCategory(cat);
    if (cat === "staff_payroll" && selectedStaffContract) {
      setExpenseAmount(selectedStaffContract.monthlySalary.toString());
      setExpenseDesc(`Pago de sueldo a ${selectedStaffContract.fullName} (${selectedStaffContract.roleTitle})`);
    } else if (cat === "equipment_breakdown") {
      setExpenseAmount("280");
      setExpenseDesc(`Reparación técnica de ${equipmentName}`);
    } else {
      setExpenseAmount("");
      setExpenseDesc("");
    }
  };

  const handleOpenPayModal = (item) => {
    setSelectedPayrollItem(item);
    setPayMethod("transferencia");
    setPayReceipt(
      item.receiptNumber || `REC-RH-${Math.floor(1000 + Math.random() * 9000)}`,
    );
    setIsPayModalOpen(true);
  };

  // Submit payroll payment
  const handleConfirmSalaryPayment = (e) => {
    e.preventDefault();
    if (!selectedPayrollItem) return;

    payStaffSalary(selectedPayrollItem.id, payMethod, payReceipt);
    confetti({ particleCount: 50, spread: 70 });
    setIsPayModalOpen(false);
    setSelectedPayrollItem(null);
  };

  // Payroll Metrics
  const totalPayrollBudget = payrollEntries.reduce(
    (sum, p) => sum + p.netPay,
    0,
  );
  const paidPayrollTotal = payrollEntries
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.netPay, 0);
  const pendingPayrollTotal = payrollEntries
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.netPay, 0);
  const totalHoursWorkedAll = payrollEntries.reduce(
    (sum, p) => sum + p.workedHours,
    0,
  );
  const pendingCount = payrollEntries.filter(
    (p) => p.status === "pending",
  ).length;

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header */}
      <div className="rd-portada flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-0.5">
            <BadgeDollarSign className="w-3.5 h-3.5" />
            <span>Finanzas, Caja & Nómina de Personal</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Control de Caja, Ingresos, Egresos & Planilla
          </h1>
          <p className="text-xs text-gray-500">
            Libro de caja diario, cobros de membresías, ventas en tienda y
            liquidación de sueldos por horas trabajadas del personal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Ingreso</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher: Flujo de Caja vs Reporte detallado vs Planilla & Sueldos */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("detalle")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer order-2 ${
            activeTab === "detalle" ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-md" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart3 className={`w-3.5 h-3.5 ${activeTab === "detalle" ? "text-white" : "text-emerald-600"}`} />
          <span>Reporte detallado de ingresos y egresos</span>
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ledger"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-blue-600" />
          <span>Flujo de Caja & Transacciones</span>
          <span className="text-xs px-1.5 py-0.2 rounded-full bg-slate-100 font-bold">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("payroll")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "payroll"
              ? "bg-white text-blue-900 shadow-xs ring-1 ring-blue-400/40"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-600" />
          <span>Planilla & Sueldos de Personal</span>
          {pendingCount > 0 && (
            <span className="text-xs px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black">
              {pendingCount} pendientes
            </span>
          )}
        </button>
      </div>

      {activeTab === "detalle" && <ReporteFinanciero transactions={transactions} />}

      {/* SECTION 1: LEDGER & OVERVIEW */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Incomes */}
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ingresos Totales
                </span>
                <div className="w-7 h-7 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-green-700">
                  S/{" "}
                  {metrics.totalIncome.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Membresías S/ {metrics.membershipsRevenue} • Tienda S/{" "}
                {metrics.posSalesTotal}
              </p>
            </div>

            {/* Total Expenses */}
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Egresos / Gastos
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-rose-700">
                  S/{" "}
                  {metrics.totalExpense.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Alquiler, sueldos de personal, mantenimiento y servicios
              </p>
            </div>

            {/* Net Profit */}
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Utilidad Neta
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span
                  className={`text-2xl font-bold ${metrics.netProfit >= 0 ? "text-blue-700" : "text-rose-700"}`}
                >
                  S/{" "}
                  {metrics.netProfit.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Margen operativo de la gestión actual
              </p>
            </div>
          </div>

          {/* =========================================================================
             INTERACTIVE FINANCIAL ANALYTICS & CHARTS SUITE
            ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 1. Comparative Flow Chart (Ingresos vs Egresos vs Margen) - Col 7 */}
            <div className="lg:col-span-7 bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Evolución Financiera & Flujo Operativo</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspección dinámica de ingresos, gastos y margen de
                    rentabilidad
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View Type Toggle */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFinanceChartView("bars")}
                      className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        financeChartView === "bars"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Barras
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinanceChartView("area")}
                      className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        financeChartView === "area"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Área
                    </button>
                  </div>

                  {/* Period Toggle */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFinancePeriod("30d")}
                      className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        financePeriod === "30d"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      30 Días
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinancePeriod("quarter")}
                      className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        financePeriod === "quarter"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Trimestre
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinancePeriod("year")}
                      className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        financePeriod === "year"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Año
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-60 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  {financeChartView === "bars" ? (
                    <BarChart
                      data={financeComparativeData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="periodo"
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
                        tickFormatter={(v) => `S/${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "11px",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                        }}
                        formatter={(val, name) => [
                          `S/ ${Number(val).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
                          name === "ingresos"
                            ? "Ingresos"
                            : name === "egresos"
                              ? "Egresos"
                              : "Margen Neto",
                        ]}
                      />

                      <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        formatter={(v) => (
                          <span className="text-slate-700 font-semibold uppercase text-xs tracking-wider">
                            {v === "ingresos"
                              ? "Ingresos"
                              : v === "egresos"
                                ? "Egresos"
                                : "Margen Neto"}
                          </span>
                        )}
                      />

                      <Bar
                        dataKey="ingresos"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                      <Bar
                        dataKey="egresos"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                      <Bar
                        dataKey="margen"
                        fill="#0ea7b3"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={financeComparativeData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="finIngresosGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                        <linearGradient
                          id="finEgresosGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f43f5e"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f43f5e"
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
                        dataKey="periodo"
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
                        tickFormatter={(v) => `S/${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "11px",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                        }}
                        formatter={(val, name) => [
                          `S/ ${Number(val).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
                          name === "ingresos"
                            ? "Ingresos"
                            : name === "egresos"
                              ? "Egresos"
                              : "Margen Neto",
                        ]}
                      />

                      <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        formatter={(v) => (
                          <span className="text-slate-700 font-semibold uppercase text-xs tracking-wider">
                            {v === "ingresos"
                              ? "Ingresos"
                              : v === "egresos"
                                ? "Egresos"
                                : "Margen"}
                          </span>
                        )}
                      />

                      <Area
                        type="monotone"
                        dataKey="ingresos"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#finIngresosGrad)"
                        activeDot={{ r: 5 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="egresos"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#finEgresosGrad)"
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="margen"
                        stroke="#0ea7b3"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ r: 3 }}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Interactive Expense Distribution Donut - Col 5 */}
            <div className="lg:col-span-5 bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-blue-600" />
                    <span>Distribución de Gastos</span>
                  </h3>
                  {categoryFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("all")}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded"
                    >
                      Limpiar Filtro
                    </button>
                  )}
                </div>

                <div className="h-44 w-full relative flex items-center justify-center my-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        onMouseEnter={(_, index) =>
                          setHoveredExpenseSlice(index)
                        }
                        onMouseLeave={() => setHoveredExpenseSlice(null)}
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{
                              filter:
                                hoveredExpenseSlice === index
                                  ? "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))"
                                  : "none",
                              cursor: "pointer",
                              transform:
                                hoveredExpenseSlice === index
                                  ? "scale(1.05)"
                                  : "scale(1)",
                              transformOrigin: "center center",
                              transition: "all 0.2s ease-out",
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          borderRadius: "10px",
                          fontSize: "11px",
                          color: "#fff",
                        }}
                        formatter={(val) => [
                          `S/ ${Number(val || 0).toFixed(2)}`,
                          "Monto",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs uppercase font-bold text-slate-400">
                      Total Egresos
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      S/ {metrics.totalExpense.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Clickable Category Filter Chips */}
                <div className="space-y-1 divide-y divide-gray-100 text-xs max-h-36 overflow-y-auto">
                  {expensePieData.map((item, idx) => {
                    const isHovered = hoveredExpenseSlice === idx;
                    return (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => {
                          // Find corresponding category code
                          const matchCat = Object.keys(
                            expenseCategoriesAgg,
                          ).find((k) => getCategoryLabel(k) === item.name);
                          if (matchCat) {
                            setCategoryFilter(
                              categoryFilter === matchCat ? "all" : matchCat,
                            );
                          }
                        }}
                        onMouseEnter={() => setHoveredExpenseSlice(idx)}
                        onMouseLeave={() => setHoveredExpenseSlice(null)}
                        className={`w-full flex items-center justify-between py-1 px-1.5 rounded transition-all text-left cursor-pointer ${
                          isHovered
                            ? "bg-slate-100 font-bold"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-700 truncate max-w-[150px]">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          S/ {(item.value || 0).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Ledger Full Width */}
          <div className="bg-white border border-gray-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  Libro Mayor de Transacciones ({filteredTransactions.length})
                </h3>

                {/* Type Filter */}
                <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md border border-gray-200 self-start sm:self-auto">
                  <button
                    onClick={() => setTypeFilter("all")}
                    className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${typeFilter === "all" ? "bg-white text-slate-900 font-bold shadow-xs" : "text-gray-600 hover:text-slate-900"}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setTypeFilter("income")}
                    className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${typeFilter === "income" ? "bg-green-600 text-white font-bold" : "text-gray-600 hover:text-slate-900"}`}
                  >
                    Ingresos
                  </button>
                  <button
                    onClick={() => setTypeFilter("expense")}
                    className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${typeFilter === "expense" ? "bg-rose-600 text-white font-bold" : "text-gray-600 hover:text-slate-900"}`}
                  >
                    Egresos
                  </button>
                </div>
              </div>

              {/* Filter & Search */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2" />
                  <input
                    type="text"
                    placeholder="Buscar por descripción, alumno o N° Comprobante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-gray-50 border border-gray-300 rounded-md text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Transactions List */}
              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No hay transacciones que coincidan con la búsqueda.
                  </div>
                ) : (
                  filteredTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 bg-gray-50/70 border border-gray-200 rounded-lg flex items-center justify-between gap-3 text-xs hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            t.type === "income"
                              ? "bg-green-100 text-green-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {t.type === "income" ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {t.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                            <span>{t.date}</span>
                            <span>•</span>
                            <span className="text-blue-700 font-medium">
                              {getCategoryLabel(t.category)}
                            </span>
                            <span>•</span>
                            <span className="font-mono">{t.receiptNumber}</span>
                            <span>•</span>
                            <span className="uppercase text-slate-600 font-semibold">
                              {t.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            t.type === "income"
                              ? "text-green-700"
                              : "text-rose-700"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"} S/{" "}
                          {(t.amount || 0).toFixed(2)}
                        </span>

                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `¿Eliminar la transacción "${t.description}"?`,
                              )
                            ) {
                              deleteTransaction(t.id);
                            }
                          }}
                          className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STAFF PAYROLL, SALARIES & HOURS */}
      {activeTab === "payroll" && (
        <div className="space-y-4">
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Presupuesto Nómina Mes
              </span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                S/{" "}
                {totalPayrollBudget.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-slate-500">
                {payrollEntries.length} colaboradores activos
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Horas Totales Trabajadas
              </span>
              <span className="text-xl font-extrabold text-blue-700 mt-1 block">
                {totalHoursWorkedAll} horas
              </span>
              <span className="text-xs text-slate-500">
                Registradas en reloj marcador
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Sueldos Pagados
              </span>
              <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                S/{" "}
                {paidPayrollTotal.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">
                Egresos registrados en caja
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Sueldos Pendientes
              </span>
              <span className="text-xl font-extrabold text-amber-700 mt-1 block">
                S/{" "}
                {pendingPayrollTotal.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-amber-700 font-semibold">
                {pendingCount} colaboradores por liquidar
              </span>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>
                    Desglose de Nómina por Colaborador & Horas Trabajadas
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Especificación de personal: Entrenadores, Fisioterapeutas,
                  Nutricionistas, Recepcionistas y Mantenimiento con vinculación
                  a caja.
                </p>
              </div>

              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Periodo: Agosto 2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Colaborador</th>
                    <th className="py-3 px-3">Cargo & Área</th>
                    <th className="py-3 px-3">Tipo Contrato</th>
                    <th className="py-3 px-3 text-center">Horas Trabajadas</th>
                    <th className="py-3 px-3 text-right">Sueldo Base</th>
                    <th className="py-3 px-3 text-right">Sueldo Neto</th>
                    <th className="py-3 px-3 text-center">Estado de Pago</th>
                    <th className="py-3 px-3 text-right">Acción en Caja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollEntries.map((item) => {
                    const contract = staffContracts.find(
                      (c) => c.id === item.contractId,
                    );
                    const isPaid = item.status === "paid";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {item.staffName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {contract
                              ? `DNI: ${contract.dni}`
                              : "Personal de planta"}
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {contract?.roleTitle || item.role}
                          </span>
                          <div className="text-xs text-slate-500">
                            {item.department}
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              contract?.contractType === "1_year"
                                ? "bg-emerald-100 text-emerald-800"
                                : contract?.contractType === "6_months"
                                  ? "bg-cyan-100 text-cyan-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {contract?.contractDurationLabel ||
                              "Contrato Estándar"}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-extrabold text-blue-900 text-sm">
                            {item.workedHours} h
                          </span>
                          <div className="text-xs text-slate-500">
                            S/. {item.hourlyRate.toFixed(2)}/h
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                          S/. {item.baseSalary.toFixed(2)}
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 text-sm">
                            S/. {item.netPay.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pagado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pendiente</span>
                            </span>
                          )}
                          {isPaid && item.receiptNumber && (
                            <div className="text-xs font-mono text-slate-500 mt-0.5">
                              {item.receiptNumber}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isPaid ? (
                            <span className="text-xs text-slate-400 font-semibold italic">
                              Comprobante emitido
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenPayModal(item)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 ml-auto"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Liquidar / Pagar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAYROLL SALARY PAYMENT TO CASH EXPENSE */}
      {isPayModalOpen && selectedPayrollItem && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Registrar Pago de Sueldo en Caja</span>
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100 text-xs space-y-1">
              <p>
                <strong>Colaborador:</strong> {selectedPayrollItem.staffName}
              </p>
              <p>
                <strong>Cargo / Área:</strong> {selectedPayrollItem.role} (
                {selectedPayrollItem.department})
              </p>
              <p>
                <strong>Horas Trabajadas:</strong>{" "}
                {selectedPayrollItem.workedHours} horas
              </p>
              <div className="pt-1 text-sm font-extrabold text-blue-950">
                Monto Total a Desembolsar: S/.{" "}
                {selectedPayrollItem.netPay.toFixed(2)}
              </div>
            </div>

            <form
              onSubmit={handleConfirmSalaryPayment}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Medio de Pago Empleado *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="transferencia">
                    🏦 Transferencia Bancaria (Abono en cuenta)
                  </option>
                  <option value="efectivo">💵 Efectivo de Caja Chica</option>
                  <option value="yape_plin">📱 Yape / Plin</option>
                  <option value="tarjeta">💳 Tarjeta Débito Empresarial</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  N° Recibo de Honorarios / Comprobante de Egreso *
                </label>
                <input
                  type="text"
                  required
                  value={payReceipt}
                  onChange={(e) => setPayReceipt(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Al confirmar, se creará un egreso directo en el libro mayor de
                  caja bajo la categoría "Sueldos / Nómina" descontándose del
                  saldo neto.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Desembolsar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registro de ingreso (con tipo, alumno, sesiones y medio de pago) */}
      {isIncomeModalOpen && (
        <RegistroIngreso
          onCerrar={() => setIsIncomeModalOpen(false)}
          onGuardar={(tx) => {
            addTransaction({ ...tx, date: hoyISO() });
            confetti({ particleCount: 50, spread: 70, colors: ["#10b981", "#34d399", "#a7f3d0"] });
            setIsIncomeModalOpen(false);
          }}
        />
      )}

      {/* Specialized New Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto min-h-full sm:px-8 sm:py-8 bg-white p-5 sm:p-6 text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
                  Caja Chica & Egresos de Gimnasio
                </span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  Registro de Gasto Específico
                </h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateExpense}
              className="space-y-4 my-3 text-xs"
            >
              {/* 1. Tipo de gasto (tarjetas) */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">1. ¿En qué se gastó? *</p>
                {[
                  ["principal", "Casos principales"],
                  ["fijo", "Gastos fijos y del día a día"],
                ].map(([g, titulo]) => (
                  <div key={g} className="space-y-1.5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{titulo}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIPOS_GASTO.filter((t) => t.grupo === g).map((t) => (
                        <button
                          key={t.k}
                          type="button"
                          onClick={() => elegirCategoriaGasto(t.k)}
                          className={`text-left rounded-2xl border-2 p-3 cursor-pointer transition-all ${
                            expenseCategory === t.k ? "border-rose-500 bg-rose-50 shadow-sm" : "border-slate-200 bg-white hover:border-rose-300"
                          }`}
                        >
                          <span className="text-2xl leading-none">{t.icono}</span>
                          <span className={`block mt-1.5 text-sm font-black ${expenseCategory === t.k ? "text-rose-800" : "text-slate-900"}`}>{t.titulo}</span>
                          <span className="block text-[11px] text-slate-500">{t.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ---------------- CASO 1: PAGAR AL PERSONAL DE TRABAJO ---------------- */}
              {expenseCategory === "staff_payroll" && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-blue-900 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>Seleccionar Colaborador (Autocompletado)</span>
                    </span>
                    <span className="text-xs text-blue-600 font-normal">
                      Contratos de Personal
                    </span>
                  </div>

                  {/* Autocomplete Input for Staff */}
                  <div className="relative">
                    <div className="flex items-center border border-blue-300 bg-white rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                      <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="Escribe el nombre del colaborador o DNI..."
                        value={staffSearchQuery}
                        onChange={(e) => {
                          setStaffSearchQuery(e.target.value);
                          setIsStaffDropdownOpen(true);
                        }}
                        onFocus={() => setIsStaffDropdownOpen(true)}
                        className="w-full bg-transparent text-slate-900 font-bold focus:outline-none text-xs"
                      />
                    </div>

                    {/* Autocomplete Suggestions Dropdown */}
                    {isStaffDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {filteredStaffList.length === 0 ? (
                          <div className="p-3 text-slate-400 text-center">
                            No se encontraron colaboradores coincidentes.
                          </div>
                        ) : (
                          filteredStaffList.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => handleSelectStaff(s)}
                              className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                            >
                              <div>
                                <span className="font-extrabold text-slate-900 block">
                                  {s.fullName}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {s.roleTitle} • DNI: {s.dni}
                                </span>
                              </div>
                              <span className="text-blue-700 font-extrabold text-xs">
                                S/ {s.monthlySalary.toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Staff Info Card */}
                  {selectedStaffContract && (
                    <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs space-y-1.5 shadow-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-900 font-extrabold text-xs block">
                            {selectedStaffContract.fullName}
                          </strong>
                          <span className="text-slate-600">
                            {selectedStaffContract.roleTitle} • Contrato:{" "}
                            {selectedStaffContract.contractDurationLabel}
                          </span>
                        </div>
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          Horas: {selectedStaffContract.workedHoursThisMonth} h
                        </span>
                      </div>

                      <div className="text-slate-600 flex justify-between pt-1 border-t border-slate-100">
                        <span>Sueldo Base Mensual:</span>
                        <span className="font-extrabold text-slate-900">
                          S/ {selectedStaffContract.monthlySalary.toFixed(2)}
                        </span>
                      </div>

                      {/* TARDINESS DETECTION & MANAGER DECISION SWITCH */}
                      {selectedStaffTardiness.length > 0 ? (
                        <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-300 space-y-2">
                          <div className="flex items-start gap-1.5 text-amber-900">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-bold block text-xs">
                                Tardanza Registrada para este Colaborador
                              </strong>
                              <span className="text-xs text-amber-800 block">
                                {selectedStaffTardiness[0].reason ||
                                  "Marcó con retraso en el reloj de asistencia."}
                              </span>
                            </div>
                          </div>

                          {/* Manager Toggle Option to Apply or Skip Discount */}
                          <div className="bg-white p-2 rounded-md border border-amber-200 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={applyTardinessDiscount}
                                onChange={(e) => {
                                  const apply = e.target.checked;
                                  setApplyTardinessDiscount(apply);
                                  const base =
                                    selectedStaffContract.monthlySalary;
                                  const final = apply
                                    ? Math.max(0, base - tardinessDiscountVal)
                                    : base;
                                  setExpenseAmount(final.toString());
                                }}
                                className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
                              />

                              <span className="font-bold text-slate-800 text-xs">
                                Opción de Gerencia: Aplicar descuento por
                                tardanza
                              </span>
                            </label>

                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 text-xs">
                                Descuento: S/
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={tardinessDiscountVal}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setTardinessDiscountVal(val);
                                  if (applyTardinessDiscount) {
                                    setExpenseAmount(
                                      (
                                        selectedStaffContract.monthlySalary -
                                        val
                                      ).toString(),
                                    );
                                  }
                                }}
                                className="w-14 p-1 border border-slate-300 rounded font-bold text-center text-xs text-rose-700"
                              />
                            </div>
                          </div>

                          <div className="text-xs text-slate-500 italic">
                            {applyTardinessDiscount
                              ? "✔️ Descuento activado por gerencia. Se restará del sueldo neto en caja."
                              : "ℹ️ Descuento dispensado por gerencia. Se pagará el sueldo completo."}
                          </div>
                        </div>
                      ) : (
                        <div className="text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-xs flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            Sin tardanzas registradas en este periodo.
                            Asistencia al 100%.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- CASO 2: AVERÍA DE EQUIPO / MÁQUINAS ---------------- */}
              {expenseCategory === "equipment_breakdown" && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>Mantenimiento Correctivo por Avería</span>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      Equipo o Máquina Afectada *
                    </label>
                    <select
                      value={equipmentName}
                      onChange={(e) => setEquipmentName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Trotadora Pro-Form Mod. Carbon T7 #2">
                        Trotadora Pro-Form Mod. Carbon T7 #2
                      </option>
                      <option value="Prensa Inclinada 45° Iron Master">
                        Prensa Inclinada 45° Iron Master
                      </option>
                      <option value="Máquina Hack Squat / Sentadilla">
                        Máquina Hack Squat / Sentadilla
                      </option>
                      <option value="Polea Doble Crossover Cable">
                        Polea Doble Crossover Cable
                      </option>
                      <option value="Equipo de Sonido & Consola Principal">
                        Equipo de Sonido & Consola Principal
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      Descripción de la Falla / Repuestos Requeridos *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={breakdownDetails}
                      onChange={(e) => setBreakdownDetails(e.target.value)}
                      placeholder="Ej. Cambio de faja motora desgastada, reemplazo de rodamientos blindados y calibración de tensión..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      Taller o Técnico Responsable
                    </label>
                    <input
                      type="text"
                      value={technicianOrWorkshop}
                      onChange={(e) => setTechnicianOrWorkshop(e.target.value)}
                      placeholder="Servicio Técnico Especializado..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* ---------------- CASO 3: GASTO LIBRE CON COMENTARIO Y ADJUNTOS ---------------- */}
              {expenseCategory === "free_expense" && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <span>Gasto Libre con Comprobante Adjunto</span>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      Comentario del Tipo de Gasto & Justificación *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={freeExpenseComment}
                      onChange={(e) => setFreeExpenseComment(e.target.value)}
                      placeholder="Especifica el tipo de gasto (ej. Compra de insumos de limpieza para vestuarios, recarga de botellones de agua ozonizada, ferretería)..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Attachment selector */}
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      Adjuntar Foto o PDF como Prueba *
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span className="text-slate-700 font-bold text-xs">
                          {attachedFileName
                            ? `Archivo: ${attachedFileName}`
                            : "Seleccionar comprobante (PDF o Foto)"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAttachedFileName(e.target.files[0].name);
                            }
                          }}
                        />
                      </label>

                      {/* Quick demo presets */}
                      <button
                        type="button"
                        onClick={() =>
                          setAttachedFileName("factura_ferreteria_f001_842.pdf")
                        }
                        className="px-2.5 py-3 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                        title="Usar comprobante demo PDF"
                      >
                        PDF Demo
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachedFileName("recibo_caja_foto_evidencia.jpg")
                        }
                        className="px-2.5 py-3 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                        title="Usar comprobante demo Foto"
                      >
                        Foto Demo
                      </button>
                    </div>

                    {attachedFileName && (
                      <div className="mt-2 bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 truncate">
                          <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="truncate">{attachedFileName}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachedFileName(null)}
                          className="text-emerald-700 hover:text-emerald-950 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Monto */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-800">2. ¿Cuánto sale de caja? *</p>
                <div className="flex items-center rounded-xl border-2 border-rose-300 bg-white px-3 focus-within:ring-2 focus-within:ring-rose-500 max-w-xs">
                  <span className="text-lg font-black text-rose-700">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full px-2 py-2.5 text-2xl font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Medio de pago */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">3. ¿Cómo se pagó?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {METODOS_GASTO.map(([k, ic, l]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setExpenseMethod(k)}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-bold cursor-pointer ${
                        expenseMethod === k ? "border-rose-500 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-700 hover:border-rose-300"
                      }`}
                    >
                      {ic} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Detalle (gastos fijos) */}
              {expenseCategory !== "staff_payroll" &&
                expenseCategory !== "equipment_breakdown" &&
                expenseCategory !== "free_expense" && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-800">4. Detalle / proveedor *</p>
                    {ATAJOS_GASTO[expenseCategory] && (
                      <div className="flex flex-wrap gap-1.5">
                        {ATAJOS_GASTO[expenseCategory].map((o) => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => setExpenseDesc(o)}
                            className={`px-2.5 py-1 rounded-full border text-xs font-bold cursor-pointer ${
                              expenseDesc === o ? "bg-rose-600 border-rose-600 text-white" : "border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-300"
                            }`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      required
                      placeholder="Ej. Recibo de luz de noviembre – Electro Sur Este"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                    />
                  </div>
                )}

              {/* Resumen */}
              <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-700 space-y-0.5 min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-rose-700">Saldrá de caja</p>
                  <p className="text-3xl font-black text-rose-700 leading-tight">S/ {(Number(expenseAmount) || 0).toFixed(2)}</p>
                  <p className="truncate">
                    {TIPOS_GASTO.find((t) => t.k === expenseCategory)?.icono} {TIPOS_GASTO.find((t) => t.k === expenseCategory)?.titulo} ·{" "}
                    {METODOS_GASTO.find((m) => m[0] === expenseMethod)?.[2]}
                    {expenseCategory === "staff_payroll" && selectedStaffContract ? ` · ${selectedStaffContract.fullName}` : ""}
                    {expenseCategory === "equipment_breakdown" ? ` · ${equipmentName}` : ""}
                    {!["staff_payroll", "equipment_breakdown", "free_expense"].includes(expenseCategory) && expenseDesc ? ` · ${expenseDesc}` : ""}
                  </p>
                </div>
                <TrendingDown className={`w-10 h-10 shrink-0 ${Number(expenseAmount) > 0 ? "text-rose-500" : "text-slate-300"}`} />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Salida en Caja</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
