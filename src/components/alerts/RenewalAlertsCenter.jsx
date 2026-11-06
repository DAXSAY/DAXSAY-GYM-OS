import React, { useState } from "react";
import {
  BellRing,
  Clock,
  XCircle,
  CheckCircle2,
  Phone,
  Send,
  RotateCw,
  Calendar,
  Search,
} from "lucide-react";
import { useGym } from "../../context/GymContext";
import { TelWhatsApp } from "../common/TelWhatsApp";
import confetti from "canvas-confetti";

export const RenewalAlertsCenter = ({ onOpenRenewModal }) => {
  const { renewalAlerts, members, renewMembership } = useGym();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAlerts = renewalAlerts.filter((alert) => {
    if (filterType === "expired" && !alert.isExpired) return false;
    if (filterType === "urgent" && (alert.isExpired || alert.daysLeft > 3))
      return false;
    if (filterType === "warning" && (alert.isExpired || alert.daysLeft <= 3))
      return false;

    const term = searchTerm.toLowerCase();
    return (
      alert.memberName.toLowerCase().includes(term) ||
      alert.phone.includes(term) ||
      alert.planName.toLowerCase().includes(term)
    );
  });

  const handleSendWhatsApp = (alert) => {
    const cleanPhone = alert.phone.replace(/\D/g, "");
    const msg = alert.isExpired
      ? `¡Hola ${alert.memberName}! 👋 Te saludamos de RADICAL. Te recordamos que tu membresía (${alert.planName}) venció el ${alert.endDate}. ¡Renueva hoy mismo para no perder tu progreso ni tus beneficios!`
      : `¡Hola ${alert.memberName}! 👋 Te saludamos de RADICAL. Queremos avisarte que tu membresía (${alert.planName}) está próxima a vencer este ${alert.endDate} (${alert.daysLeft} días restantes). ¡Acércate a recepción o contáctanos para renovarla!`;

    const encoded = encodeURIComponent(msg);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    window.open(url, "_blank");
  };

  const handleQuickRenew = (alert) => {
    const member = members.find((m) => m.id === alert.memberId);
    if (!member) return;

    renewMembership(member.id, member.planId, "efectivo");
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.5 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BellRing className="w-3.5 h-3.5" />
            <span>Sistema Preventivo de Fidelización & Renovaciones</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif]">
            Alertas de Próximos Vencimientos ({renewalAlerts.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Detección automática de membresías por expirar (≤7 días) o vencidas
            para envío directo de recordatorios por WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-extrabold rounded-xl">
            {renewalAlerts.filter((a) => a.isExpired).length} Vencidos
          </span>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-extrabold rounded-xl">
            {renewalAlerts.filter((a) => !a.isExpired).length} Próximos
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              filterType === "all"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            Todos ({renewalAlerts.length})
          </button>

          <button
            onClick={() => setFilterType("expired")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              filterType === "expired"
                ? "bg-rose-600 text-white font-bold"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            ⛔ Ya Vencidos
          </button>

          <button
            onClick={() => setFilterType("urgent")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              filterType === "urgent"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            ⚠️ Crítico (1 a 3 días)
          </button>

          <button
            onClick={() => setFilterType("warning")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              filterType === "warning"
                ? "bg-slate-700 text-white font-bold"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            📅 Próximos (4 a 7 días)
          </button>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">
              ¡No hay alertas pendientes!
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Todos los alumnos cuentan con membresías vigentes sin vencimientos
              inmediatos.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.memberId}
              className={`bg-slate-900/90 border rounded-3xl p-5 flex flex-col justify-between transition-all ${
                alert.isExpired
                  ? "border-rose-800/80 shadow-lg shadow-rose-950/20"
                  : alert.daysLeft <= 3
                    ? "border-amber-500/80 shadow-lg shadow-amber-950/20"
                    : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                      alert.isExpired
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : alert.daysLeft <= 3
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                    }`}
                  >
                    {alert.isExpired ? (
                      <>
                        <XCircle className="w-3 h-3" />
                        Vencido hace {Math.abs(alert.daysLeft)} días
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        Vence en {alert.daysLeft}{" "}
                        {alert.daysLeft === 1 ? "día" : "días"}
                      </>
                    )}
                  </span>

                  <span className="text-xs font-mono text-slate-400">
                    {alert.endDate}
                  </span>
                </div>

                {/* Member Info */}
                <h3 className="font-bold text-base text-white font-['Outfit',sans-serif]">
                  {alert.memberName}
                </h3>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  Plan actual: {alert.planName}
                </p>

                <div className="mt-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs space-y-1 text-slate-300">
                  <div className="flex items-center gap-2">
                    <TelWhatsApp tel={alert.phone} className="text-emerald-400 hover:text-emerald-300" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Fecha límite:{" "}
                      <strong className="text-white">{alert.endDate}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleSendWhatsApp(alert)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Enviar mensaje personalizado por WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleQuickRenew(alert)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 transition-all cursor-pointer"
                  title="Renovar membresía ahora"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Renovar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
