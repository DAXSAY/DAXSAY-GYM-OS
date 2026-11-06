// ============================================================
// ROLES Y PERMISOS DE RADICAL
// Aquí se define qué módulos ve cada rol y en qué orden.
// Para dar o quitar acceso a un módulo, edita solo este archivo.
// ============================================================
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BadgeDollarSign,
  Briefcase,
  Store,
  BellRing,
  Utensils,
  HeartPulse,
  Calendar,
  UserCheck,
  Dumbbell,
  Activity,
  Vault,
  ShieldCheck,
  FileBarChart,
  Trophy,
  CalendarCheck,
  Contact,
} from "lucide-react";

// Catálogo de módulos (pestañas) del sistema
export const MODULES = {
  dashboard: { label: "Dashboard General", code: "DB", icon: LayoutDashboard },
  members: { label: "Alumnos / Socios", code: "AL", icon: Users },
  staff: { label: "Contratos de Personal", code: "CP", icon: Briefcase },
  memberships: { label: "Planes & Tarifas", code: "MB", icon: CreditCard },
  nutrition: { label: "Nutrición & Medidas", code: "NM", icon: Utensils },
  physiotherapy: { label: "Fisioterapia", code: "FT", icon: HeartPulse },
  routines: { label: "Rutinas & Ejercicios", code: "RT", icon: Dumbbell },
  appointments: { label: "Horarios & Citas", code: "HC", icon: Calendar },
  attendances: { label: "Control Asistencias", code: "AS", icon: UserCheck },
  store: { label: "Ventas / POS", code: "SL", icon: Store },
  cash: { label: "Caja por Turnos", code: "CJ", icon: Vault },
  users: { label: "Usuarios & Accesos", code: "US", icon: ShieldCheck },
  reports: { label: "Reportes", code: "RP", icon: FileBarChart },
  goals: { label: "Metas & Logros", code: "MT", icon: Trophy },
  finance: { label: "Finanzas & Caja", code: "FN", icon: BadgeDollarSign },
  alerts: { label: "Notificaciones & Alertas", code: "NT", icon: BellRing },
  crm: { label: "Prospectos (CRM)", code: "CR", icon: Contact },
  // Portal del alumno
  mi_membresia: { label: "Mi Membresía", code: "MB", icon: CreditCard },
  mis_citas: { label: "Notificaciones & Citas", code: "CT", icon: Calendar },
  mis_asistencias: { label: "Mis Asistencias", code: "AS", icon: CalendarCheck },
  mis_medidas: { label: "Mis Medidas & Progreso", code: "MD", icon: Activity },
  mi_rutina: { label: "Mi Rutina", code: "RT", icon: Dumbbell },
  mi_dieta: { label: "Mi Alimentación", code: "DT", icon: Utensils },
  mi_fisioterapia: { label: "Mi Fisioterapia", code: "FS", icon: HeartPulse },
};

// Definición de cada rol: etiqueta, color y grupos de menú
export const ROLES = {
  admin: {
    label: "Administrador",
    short: "Admin",
    color: "purple",
    defaultTab: "dashboard",
    groups: [
      { title: "Gestión & Clientes", tabs: ["dashboard", "reports", "members", "crm", "memberships", "goals"] },
      { title: "Salud & Entrenamiento", tabs: ["routines", "nutrition", "physiotherapy", "appointments"] },
      { title: "Operativo & Caja", tabs: ["cash", "store", "attendances", "finance", "alerts"] },
      { title: "Personal & Accesos", tabs: ["staff", "users"] },
    ],
  },
  trainer: {
    label: "Entrenador",
    short: "Coach",
    color: "blue",
    defaultTab: "routines",
    groups: [
      { title: "Entrenamiento", tabs: ["routines", "appointments", "goals"] },
      { title: "Alumnos & Asistencia", tabs: ["members", "attendances"] },
    ],
  },
  physio: {
    label: "Fisioterapia",
    short: "Fisio",
    color: "cyan",
    defaultTab: "physiotherapy",
    groups: [
      { title: "Gabinete de Fisioterapia", tabs: ["physiotherapy", "appointments"] },
      { title: "Alumnos", tabs: ["members", "goals"] },
    ],
  },
  nutritionist: {
    label: "Nutrición",
    short: "Nutri",
    color: "emerald",
    defaultTab: "nutrition",
    groups: [
      { title: "Consultorio de Nutrición", tabs: ["nutrition", "appointments"] },
      { title: "Alumnos", tabs: ["members", "goals"] },
    ],
  },
  reception: {
    label: "Recepción",
    short: "Recepción",
    color: "amber",
    defaultTab: "cash",
    groups: [
      { title: "Clientes", tabs: ["members", "crm", "memberships", "goals"] },
      { title: "Operativo & Caja", tabs: ["cash", "store", "attendances"] },
      { title: "Servicios & Avisos", tabs: ["appointments", "alerts"] },
    ],
  },
  student: {
    label: "Alumno / Socio",
    short: "Alumno",
    color: "teal",
    defaultTab: "mi_membresia",
    groups: [
      { title: "Mi Membresía", tabs: ["mi_membresia", "mis_asistencias", "mis_citas"] },
      { title: "Entrenamiento & Salud", tabs: ["mi_rutina", "mi_dieta", "mis_medidas", "mi_fisioterapia"] },
    ],
  },
};

// Clases de Tailwind por color (escritas completas para que Tailwind las detecte)
export const ROLE_COLORS = {
  purple: { dot: "bg-purple-400", badge: "bg-purple-100 text-purple-700", title: "text-purple-400" },
  blue: { dot: "bg-blue-400", badge: "bg-blue-100 text-blue-700", title: "text-blue-400" },
  cyan: { dot: "bg-cyan-400", badge: "bg-cyan-100 text-cyan-700", title: "text-cyan-400" },
  emerald: { dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700", title: "text-emerald-400" },
  amber: { dot: "bg-amber-400", badge: "bg-amber-100 text-amber-700", title: "text-amber-400" },
  teal: { dot: "bg-teal-400", badge: "bg-teal-100 text-teal-700", title: "text-teal-400" },
};

export const getRole = (role) => ROLES[role] || ROLES.student;

export const getAllowedTabs = (role) =>
  getRole(role).groups.flatMap((g) => g.tabs);

export const canAccess = (role, tab) => getAllowedTabs(role).includes(tab);

// Permiso real del usuario conectado: el menú de su rol, filtrado por los
// módulos que la base de datos le permite ver (rol_permisos / usuario_permisos)
export const userCanAccess = (user, tab) =>
  !!user && canAccess(user.role, tab) && (!Array.isArray(user.modules) || user.modules.includes(tab));

// Permiso de acción: ver | crear | editar | eliminar
export const userCan = (user, tab, accion = "ver") =>
  userCanAccess(user, tab) && (!user.permissions || !!user.permissions[tab]?.[accion]);
