import React from "react";
import { LogOut } from "lucide-react";
import { useGym } from "../../context/GymContext";
import { MODULES, ROLE_COLORS, getRole, userCanAccess } from "../../config/roles";
import { FirmaDaxsay } from "./Marca";

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const {
    renewalAlerts,
    lowStockProducts,
    currentUser,
    appointments,
    staffContracts,
    members,
    logout,
  } = useGym();

  const role = getRole(currentUser.role);
  const colors = ROLE_COLORS[role.color];
  const isStudent = currentUser.role === "student";
  const isAdmin = currentUser.role === "admin";

  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
  const expiringContractsCount = staffContracts.filter(
    (c) => c.status === "expiring_soon",
  ).length;

  // Contadores (badges) que se muestran junto a algunos módulos
  const badges = {
    staff: expiringContractsCount,
    store: lowStockProducts.length,
    alerts: renewalAlerts.length,
    appointments: scheduledCount,
    mis_citas: scheduledCount,
  };

  const currentMember = isStudent
    ? members.find((m) => m.id === currentUser.memberId)
    : null;

  const renderNavButton = (tabId) => {
    const item = MODULES[tabId];
    if (!item) return null;
    const Icon = item.icon;
    const isActive = activeTab === tabId;
    const badge = badges[tabId];

    return (
      <button
        key={tabId}
        onClick={() => setActiveTab(tabId)}
        className={`relative w-full flex items-center justify-between space-x-2.5 px-2.5 py-2 rounded-lg text-xs lg:text-sm transition-all text-left cursor-pointer ${
          isActive
            ? "bg-gradient-to-r from-blue-500/25 to-blue-500/5 text-white font-semibold ring-1 ring-blue-400/40 shadow-[0_0_18px_-6px_rgba(38,194,205,0.7)]"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-blue-400" />}
          <Icon
            className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-300" : "text-slate-400"}`}
          />
          <span className="truncate text-xs">{item.label}</span>
        </div>
        {badge > 0 && (
          <span className="px-1.5 py-0.2 text-xs font-extrabold rounded-full bg-amber-500 text-slate-950">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-full lg:w-56 bg-gradient-to-b from-marino-900 via-marino-950 to-[#050e1a] text-white min-h-full border-r border-white/5 flex flex-col justify-between shrink-0 shadow-xl select-none relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -left-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -right-20 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="relative p-3 lg:p-4 space-y-4">
        {/* Rol conectado */}
        <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center space-x-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
          <div className="min-w-0">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Rol conectado
            </span>
            <span className="text-xs font-black text-white truncate block">
              {role.label}
            </span>
          </div>
        </div>

        {/* Grupos de menú según el rol */}
        {role.groups
          .map((g) => ({ ...g, tabs: g.tabs.filter((t) => userCanAccess(currentUser, t)) }))
          .filter((g) => g.tabs.length > 0)
          .map((group, gi) => (
          <div key={group.title} className={gi > 0 ? "pt-3 border-t border-white/10" : ""}>
            <div
              className={`text-xs font-bold uppercase tracking-wider px-2 pb-1.5 ${colors.title}`}
            >
              {group.title}
            </div>
            <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
              {group.tabs.map(renderNavButton)}
            </nav>
          </div>
        ))}

        {/* Resumen de membresía (solo alumnos) */}
        {isStudent && currentMember && (
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Tu membresía actual
            </span>
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="font-bold text-white truncate">
                {currentMember.planName}
              </span>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded shrink-0">
                {currentMember.status === "frozen"
                  ? "CONGELADO"
                  : currentMember.status === "active"
                  ? "ACTIVO"
                  : currentMember.status === "expired"
                    ? "VENCIDO"
                    : "POR VENCER"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Vence: {currentMember.membershipEndDate}
            </p>
          </div>
        )}
      </div>

      {/* Usuario conectado y cierre de sesión */}
      <div className="relative p-3 lg:p-4 border-t border-white/10 space-y-2">
        <div className="bg-white/5 rounded-xl p-3 text-xs border border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              {currentUser.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.fullName.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-200 text-xs font-bold truncate">
                {currentUser.fullName}
              </div>
              <div className="text-xs text-slate-400 truncate">
                @{currentUser.username}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
        <div className="text-center pt-1"><FirmaDaxsay claro apilada /></div>

      </div>
    </aside>
  );
};
