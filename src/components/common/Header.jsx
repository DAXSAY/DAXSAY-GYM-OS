import React, { useState } from "react";
import {
  Dumbbell,
  CreditCard,
  UserCheck,
  ShoppingBag,
  Bell,
  Plus,
  Search,
  AlertTriangle,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  KeyRound,
  Activity,
  Vault,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import { ROLE_COLORS, getRole, userCan, userCanAccess } from "../../config/roles";
import { buscarAlumno } from "../../utils/codigo";
import { esCodigoPase, validarPaseLibre } from "../../utils/pase";
import confetti from "canvas-confetti";
import { useAlertasAdmin, AlertaFechaPago } from "../alerts/AlertasAdmin";
import { LogoRadical, NombreRadical, BotonTema } from "./Marca";

const fc = (f) => (f ? String(f).slice(0, 10).split("-").reverse().join("/") : "");

export const Header = ({
  activeTab,
  setActiveTab,
  onOpenNewMemberModal,
  onOpenQuickSaleModal,
  onOpenNewExpenseModal,
}) => {
  const {
    renewalAlerts,
    lowStockProducts,
    members,
    exportDataJSON,
    resetToDefaults,
    currentUser,
    logout,
    recordAttendance,
    cashShift,
  } = useGym();
  const role = getRole(currentUser.role);
  const roleColors = ROLE_COLORS[role.color];
  const isStudent = currentUser.role === "student";
  const can = (tab) => userCanAccess(currentUser, tab);
  const canRegisterMembers = userCan(currentUser, "members", "crear");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchCheckIn, setSearchCheckIn] = useState("");
  const [checkInResult, setCheckInResult] = useState(null);

  const esAdmin = currentUser.role === "admin";
  const alertasAdmin = useAlertasAdmin(esAdmin, 10);
  const nuevasAdmin = alertasAdmin.alertas.filter((a) => !a.seen);
  const totalUrgentAlerts = renewalAlerts.length + lowStockProducts.length + (esAdmin ? alertasAdmin.pendientes : 0);

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    if (!searchCheckIn.trim()) return;

    // Pase libre del CRM (lo escribe el lector de QR)
    if (esCodigoPase(searchCheckIn)) {
      const r = await validarPaseLibre(searchCheckIn);
      setCheckInResult({ found: false, pase: r.prospecto || null, status: r.ok ? "active" : "expired", message: r.mensaje });
      if (r.ok) confetti({ particleCount: 40, spread: 60, origin: { y: 0.1 } });
      setSearchCheckIn("");
      return;
    }

    const hallado = buscarAlumno(members, searchCheckIn);
    const foundMember = hallado?.member;

    if (foundMember) {
      setCheckInResult({
        found: true,
        member: foundMember,
        status: foundMember.status,
        message:
          foundMember.status === "frozen"
            ? `❄️ Acceso Denegado. Membresía congelada hasta el ${fc(foundMember.freeze?.current?.endDate)} (vuelve el ${fc(foundMember.freeze?.current?.returnDate)}). Si regresó antes, termina el congelamiento en Alumnos.`
            : foundMember.status === "active"
            ? `¡Acceso Autorizado! Membresía vigente hasta ${foundMember.membershipEndDate}`
            : foundMember.status === "expiring_soon"
              ? `⚠️ Acceso permitido. Membresía por vencer el ${foundMember.membershipEndDate}`
              : `⛔ Acceso Denegado. Membresía vencida el ${foundMember.membershipEndDate}`,
      });

      if (foundMember.status === "active") {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.1 },
        });
      }

      // Record in attendance log
      recordAttendance({
        userId: foundMember.id,
        userName: foundMember.fullName,
        userRole: "student",
        userDni: foundMember.dni,
        type: "in",
        status: foundMember.status === "expired" || foundMember.status === "frozen" ? "warning" : "authorized",
        checkInMethod: "quick_pass",
        membershipPlan: foundMember.planName,
        notes: `Check-in rápido en barra superior (${foundMember.status})`,
      });
    } else {
      setCheckInResult({
        found: false,
        message: "No se encontró ningún alumno con ese código, DNI o nombre.",
      });
    }
  };

  return (
    <header className="sticky top-0 z-30 rd-vidrio border-b border-slate-200/80 px-4 lg:px-6 py-2 text-slate-800 shadow-[0_1px_0_rgba(16,181,167,0.15)] transition-all">
      <div className="w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand logo */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div
            onClick={() => setActiveTab(role.defaultTab)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <LogoRadical size={38} className="ring-2 ring-blue-500/30 group-hover:ring-blue-500/70 transition-all" />
            <div className="leading-none">
              <NombreRadical className="text-lg" />
              <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 mt-0.5">
                Gestión del gym
              </span>
            </div>
          </div>

          {/* Mobile alerts icon */}
          <div className="flex items-center gap-2 md:hidden">
            {can("alerts") && (
            <button
              onClick={() => setActiveTab("alerts")}
              className="relative p-1.5 rounded-lg bg-gray-100 text-slate-700 hover:bg-gray-200"
            >
              <Bell className="w-4 h-4" />
              {totalUrgentAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                  {totalUrgentAlerts}
                </span>
              )}
            </button>
            )}
          </div>
        </div>

        {/* Middle Section: Staff Check-in bar OR Student Quick Navigator */}
        {can("attendances") ? (
          <div className="w-full md:w-80 lg:w-96 relative">
            <form onSubmit={handleQuickCheckIn} className="relative">
              <input
                type="text"
                placeholder="Check-in: código, DNI, nombre o pase"
                value={searchCheckIn}
                onChange={(e) => setSearchCheckIn(e.target.value)}
                className="w-full pl-8 pr-20 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-colors"
              />

              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
              >
                Validar
              </button>
            </form>

            {/* Quick Check-in Result Popover */}
            {checkInResult && (
              <div className="absolute left-0 mt-2 w-80 lg:w-96 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-slate-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {checkInResult.status === "active" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : checkInResult.status === "expiring_soon" ? (
                      <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {checkInResult.member
                          ? checkInResult.member.fullName
                          : checkInResult.pase
                            ? `Pase libre · ${checkInResult.pase.fullName}`
                            : "Resultado de búsqueda"}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {checkInResult.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCheckInResult(null)}
                    className="text-gray-400 hover:text-gray-700 text-xs px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                {checkInResult.member && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      <strong className="text-blue-700 font-mono">{checkInResult.member.codeLabel}</strong> · DNI{" "}
                      <strong className="text-slate-800">
                        {checkInResult.member.dni}
                      </strong>
                    </span>
                    <span className="font-semibold text-blue-600">
                      {checkInResult.member.planName}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isStudent ? (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab("mis_medidas")}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mis Medidas</span>
            </button>
            <button
              onClick={() => setActiveTab("mi_membresia")}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-600" />
              <span>Mi Membresía</span>
            </button>
          </div>
        ) : (
          <div className="hidden md:block flex-1" />
        )}

        {/* Action buttons, Avatars & Role Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Estado de la caja por turnos */}
          {can("cash") && cashShift && (
            <button
              onClick={() => setActiveTab("cash")}
              className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                cashShift.open
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
              }`}
              title={cashShift.open ? `Caja abierta por ${cashShift.open.openedBy}` : "La caja está cerrada"}
            >
              <Vault className="w-3.5 h-3.5" />
              <span>
                {cashShift.open
                  ? `Caja: ${cashShift.open.openedBy.split(" ")[0]} · S/ ${Number(cashShift.open.expectedCash).toFixed(2)}`
                  : "Caja cerrada"}
              </span>
            </button>
          )}

          {/* Asistencias Quick Button */}
          {can("attendances") && (
            <button
              onClick={() => setActiveTab("attendances")}
              className={`p-2 rounded-md transition-colors cursor-pointer border ${
                activeTab === "attendances"
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                  : "bg-slate-100/80 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Control de Asistencias (Alumnos & Personal)"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}

          {/* Usuario conectado */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 transition-colors"
            title={`${currentUser.fullName} (${role.label})`}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
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
            <div className="hidden sm:block text-left">
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-xs text-slate-900 leading-tight">
                  {currentUser.fullName.split(" ")[0]}
                </span>
                <span
                  className={`px-1 rounded text-xs font-black uppercase ${roleColors.badge}`}
                >
                  {role.short}
                </span>
              </div>
            </div>
          </div>

          {/* Venta rápida (admin y recepción) */}
          {can("store") && (
            <button
              onClick={onOpenQuickSaleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Venta rápida en tienda / POS"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Venta POS</span>
            </button>
          )}

          {/* Nuevo alumno (admin y recepción) */}
          {canRegisterMembers && (
            <button
              onClick={onOpenNewMemberModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg text-xs font-bold rd-brillo transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nuevo Registro</span>
            </button>
          )}

          {/* Notifications Center button */}
          {can("alerts") && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-100/80 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              title="Centro de Alertas de Vencimiento"
            >
              <Bell className="w-4 h-4" />
              {totalUrgentAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-xs font-extrabold flex items-center justify-center animate-pulse">
                  {totalUrgentAlerts}
                </span>
              )}
            </button>

            {/* Notification drop */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in text-slate-800">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Alertas del Gimnasio
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full">
                    {totalUrgentAlerts} pendientes
                  </span>
                </div>

                {esAdmin && nuevasAdmin.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                        Cambios de fecha de pago ({alertasAdmin.pendientes})
                      </p>
                      <button type="button" onClick={() => alertasAdmin.marcarVista("todas")} className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer">
                        Marcar vistas
                      </button>
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {nuevasAdmin.map((a) => (
                        <AlertaFechaPago key={a.id} alerta={a} onVista={alertasAdmin.marcarVista} compacta />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {renewalAlerts.length === 0 &&
                  lowStockProducts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      ¡Todo al día! No hay vencimientos urgentes ni falta de
                      stock.
                    </p>
                  ) : (
                    <>
                      {renewalAlerts.slice(0, 4).map((alert) => (
                        <div
                          key={alert.memberId}
                          onClick={() => {
                            setActiveTab("alerts");
                            setShowNotifications(false);
                          }}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            alert.isExpired
                              ? "bg-red-50/60 border-red-200 hover:bg-red-50 text-red-900"
                              : "bg-amber-50/60 border-amber-200 hover:bg-amber-50 text-amber-900"
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{alert.memberName}</span>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white border border-gray-200">
                              {alert.daysLeft < 0
                                ? `Venció hace ${Math.abs(alert.daysLeft)}d`
                                : `Vence en ${alert.daysLeft}d`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Plan: {alert.planName} • Fin: {alert.endDate}
                          </p>
                        </div>
                      ))}

                      {lowStockProducts.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setActiveTab("store");
                            setShowNotifications(false);
                          }}
                          className="p-2.5 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 text-xs cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>Bajo Stock: {prod.name}</span>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white border border-yellow-300 text-yellow-800">
                              Quedan: {prod.stock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveTab("alerts");
                      setShowNotifications(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    Ver todas las alertas →
                  </button>
                  <button
                    onClick={exportDataJSON}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    title="Exportar copia de seguridad"
                  >
                    <Download className="w-3 h-3" /> Backup
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          <BotonTema />

          {/* Cambiar contraseña */}
          <button
            onClick={() => window.dispatchEvent(new Event("radicalgym:cambiar-clave"))}
            className="p-2 rounded-lg bg-slate-100/80 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-gray-200 transition-colors cursor-pointer"
            title="Cambiar contraseña"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-slate-100/80 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 border border-gray-200 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
