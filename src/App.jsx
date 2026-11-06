import React, { useState, useEffect, useRef, useCallback } from "react";
import { GymProvider, useGym } from "./context/GymContext";
import { Header } from "./components/common/Header";
import { Sidebar } from "./components/common/Sidebar";
import { DashboardOverview } from "./components/dashboard/DashboardOverview";
import { MembersManagement } from "./components/members/MembersManagement";
import { NewMemberModal } from "./components/members/NewMemberModal";
import { MembershipsPlans } from "./components/memberships/MembershipsPlans";
import { FinanceModule } from "./components/finance/FinanceModule";
import { StaffContractsModule } from "./components/staff/StaffContractsModule";
import { PhysiotherapyModule } from "./components/physiotherapy/PhysiotherapyModule";
import { AppointmentsScheduleModule } from "./components/appointments/AppointmentsScheduleModule";
import { NutritionMeasurementsModule } from "./components/nutrition_measurements/NutritionMeasurementsModule";
import { StorePOS } from "./components/store/StorePOS";
import { CashShiftsModule } from "./components/cash/CashShiftsModule";
import { UsersAccessModule } from "./components/users/UsersAccessModule";
import { ReportsModule } from "./components/reports/ReportsModule";
import { GoalsModule } from "./components/goals/GoalsModule";
import { NotificationCenter } from "./components/notifications/NotificationCenter";
import { AttendanceModule } from "./components/attendances/AttendanceModule";
import { LoginScreen } from "./components/auth/LoginScreen";
import { ChangePasswordScreen } from "./components/auth/ChangePasswordScreen";
import { userCanAccess, getRole, getAllowedTabs } from "./config/roles";
import { StudentPortalModule } from "./components/student_portal/StudentPortalModule";

// Specialized modules
import { RoutinesAndExercises } from "./components/routines/RoutinesAndExercises";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { ErrorModulo } from "./components/common/ErrorModulo";
import { CrmModule } from "./components/crm/CrmModule";
import { CrmRecordatorios } from "./components/crm/CrmRecordatorios";
import { AvisoStockBajo } from "./components/store/AvisoStockBajo";

function MainAppContent() {
  const { currentUser, authChecked } = useGym();
  const [activeTab, setTabInterno] = useState(
    () => (currentUser ? getRole(currentUser.role).defaultTab : "dashboard"),
  );
  const tabActual = useRef(activeTab);
  const tabInicio = useRef(activeTab);

  // Navegación entre apartados con historial del navegador:
  // el botón "atrás" vuelve al apartado anterior y nunca saca del sistema.
  const setActiveTab = useCallback((tab) => {
    if (!tab || tab === tabActual.current) return;
    tabActual.current = tab;
    window.history.pushState({ radical: tab }, "");
    setTabInterno(tab);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const alVolver = (e) => {
      const st = e.state;
      if (!st || st.raiz) {
        // Llegó al inicio del historial: se queda en el apartado principal
        window.history.pushState({ radical: tabInicio.current }, "");
        tabActual.current = tabInicio.current;
        setTabInterno(tabInicio.current);
        return;
      }
      if (st.radical) {
        tabActual.current = st.radical;
        setTabInterno(st.radical);
      }
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [cambiarClave, setCambiarClave] = useState(false);
  const [avisoClaveOculto, setAvisoClaveOculto] = useState(false);
  const [avisos, setAvisos] = useState([]);

  // Avisos del sistema (por ejemplo, si algo no se pudo guardar en la base)
  useEffect(() => {
    const escuchar = (e) => {
      const id = Date.now() + Math.random();
      setAvisos((prev) => [...prev.slice(-2), { id, ...e.detail }]);
      setTimeout(() => setAvisos((prev) => prev.filter((a) => a.id !== id)), 7000);
    };
    const abrirClave = () => setCambiarClave(true);
    window.addEventListener("radicalgym:aviso", escuchar);
    window.addEventListener("radicalgym:cambiar-clave", abrirClave);
    return () => {
      window.removeEventListener("radicalgym:aviso", escuchar);
      window.removeEventListener("radicalgym:cambiar-clave", abrirClave);
    };
  }, []);

  const roleKey = currentUser?.role;

  // Al iniciar sesión (o cambiar de usuario) se abre el módulo principal del rol
  useEffect(() => {
    if (!roleKey) return;
    // Si la base aún no le da acceso al módulo principal, abre el primero permitido
    const base = getRole(roleKey).defaultTab;
    const inicio = userCanAccess(currentUser, base)
      ? base
      : getAllowedTabs(roleKey).find((t) => userCanAccess(currentUser, t)) || base;
    tabInicio.current = inicio;
    tabActual.current = inicio;
    window.history.replaceState({ radical: inicio, raiz: true }, "");
    window.history.pushState({ radical: inicio }, "");
    setTabInterno(inicio);
  }, [currentUser?.id]);

  // Verificando la sesión guardada con la API
  if (!authChecked) {
    return (
      <div className="min-h-screen rd-fondo flex flex-col items-center justify-center gap-3 text-slate-500 text-sm font-semibold">
        <img src="/logo-radical.png" alt="RADICAL" className="w-16 h-16 rounded-full animate-pulse" />
        <span className="rd-marca text-lg">RADICAL</span>
        <span className="text-xs">Cargando...</span>
      </div>
    );
  }

  // Sin sesión: pantalla de login
  if (!currentUser) {
    return <LoginScreen />;
  }

  const role = getRole(roleKey);
  const isStudent = roleKey === "student";

  // El alumno con clave temporal debe crear su contraseña antes de entrar
  if (isStudent && currentUser.mustChangePassword) {
    return <ChangePasswordScreen obligatorio />;
  }
  const allowed = userCanAccess(currentUser, activeTab);

  // Mapa de pestañas del alumno a secciones del portal
  const SECCIONES_ALUMNO = {
    mi_membresia: "membership",
    mis_citas: "appointments",
    mis_medidas: "measurements",
    mi_rutina: "routine",
    mi_dieta: "nutrition",
    mi_fisioterapia: "physio",
    mis_asistencias: "attendance",
  };
  const studentSection = SECCIONES_ALUMNO[activeTab] || "membership";

  const renderModule = () => {
    if (!allowed) {
      return (
        <AccessDeniedNotice
          roleTitle={role.label}
          onGoBack={() => setActiveTab(role.defaultTab)}
        />
      );
    }

    if (isStudent) {
      return (
        <StudentPortalModule
          currentSection={studentSection}
          onSectionChange={(sec) => {
            const tabMap = Object.fromEntries(
              Object.entries(SECCIONES_ALUMNO).map(([tab, seccion]) => [seccion, tab]),
            );
            setActiveTab(tabMap[sec] || "mi_membresia");
          }}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            setActiveTab={setActiveTab}
            onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
            onOpenQuickSaleModal={() => setActiveTab("store")}
            onOpenNewExpenseModal={() => setActiveTab("finance")}
          />
        );
      case "members":
        return (
          <MembersManagement
            onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
          />
        );
      case "staff":
        return <StaffContractsModule />;
      case "memberships":
        return <MembershipsPlans />;
      case "nutrition":
        return <NutritionMeasurementsModule />;
      case "physiotherapy":
        return <PhysiotherapyModule />;
      case "appointments":
        return <AppointmentsScheduleModule />;
      case "attendances":
        return <AttendanceModule />;
      case "store":
        return <StorePOS onAbrirCaja={() => setActiveTab("cash")} />;
      case "cash":
        return <CashShiftsModule />;
      case "users":
        return <UsersAccessModule />;
      case "reports":
        return <ReportsModule />;
      case "goals":
        return <GoalsModule />;
      case "finance":
        return (
          <FinanceModule
            onOpenNewExpenseModal={() => setIsNewExpenseModalOpen(true)}
          />
        );
      case "alerts":
        return <NotificationCenter />;
      case "crm":
        return <CrmModule />;
      case "routines":
        return <RoutinesAndExercises />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen rd-fondo text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col selection:bg-blue-600 selection:text-white"
    >
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
        onOpenQuickSaleModal={() => setActiveTab("store")}
        onOpenNewExpenseModal={() => setActiveTab("finance")}
      />

      <div className="flex-1 flex flex-col lg:flex-row w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto min-w-0">
          {currentUser.mustChangePassword && !avisoClaveOculto && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>
                Estás usando la contraseña inicial. Por seguridad, cámbiala por una propia.
              </span>
              <span className="flex gap-2">
                <button
                  onClick={() => setCambiarClave(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold cursor-pointer"
                >
                  Cambiar ahora
                </button>
                <button
                  onClick={() => setAvisoClaveOculto(true)}
                  className="px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  Más tarde
                </button>
              </span>
            </div>
          )}
          <ErrorModulo key={activeTab}>{renderModule()}</ErrorModulo>
        </main>
      </div>

      {userCanAccess(currentUser, "crm") && <CrmRecordatorios onAbrir={() => setActiveTab("crm")} />}
      {userCanAccess(currentUser, "store") && currentUser.role !== "student" && <AvisoStockBajo onAbrir={() => setActiveTab("store")} />}

      <NewMemberModal
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
      />

      {cambiarClave && <ChangePasswordScreen onClose={() => setCambiarClave(false)} />}

      <div className="fixed bottom-4 right-4 z-[70] space-y-2 max-w-sm">
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
              a.tipo === "error" ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
            }`}
          >
            {a.mensaje}
          </div>
        ))}
      </div>
    </div>
  );
}

// Access Denied Component for Restricted Roles
function AccessDeniedNotice({ roleTitle, onGoBack }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div>
        <span className="text-xs font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
          Módulo Restringido
        </span>
        <h2 className="text-lg font-black text-slate-900 mt-2">
          Acceso no permitido para {roleTitle}
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Tu usuario no tiene permiso para este módulo. Si lo necesitas,
          solicita el acceso a administración.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoBack}
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm"
      >
        <span>Volver a tu módulo principal</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <GymProvider>
      <MainAppContent />
    </GymProvider>
  );
}
