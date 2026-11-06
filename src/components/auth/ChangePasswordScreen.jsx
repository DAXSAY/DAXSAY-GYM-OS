import React, { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { useGym } from "../../context/GymContext";

/**
 * Cambio de contraseña a pantalla completa.
 * obligatorio = true: el usuario no puede usar el sistema hasta cambiarla
 * (alumnos con su clave temporal = DNI).
 */
export const ChangePasswordScreen = ({ obligatorio = false, onClose }) => {
  const { currentUser, changePassword, logout } = useGym();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const reglas = [
    [nueva.length >= 8, "Al menos 8 caracteres"],
    [/[a-zA-Z]/.test(nueva), "Al menos una letra"],
    [/\d/.test(nueva), "Al menos un número"],
    [nueva && nueva === repetir, "Las dos contraseñas coinciden"],
  ];
  const valida = reglas.every(([ok]) => ok);

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!valida) return;
    setGuardando(true);
    try {
      await changePassword(actual, nueva);
      onClose && onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const campo = "w-full text-base p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-[60] bg-slate-100 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <form onSubmit={guardar} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-3">
              {obligatorio ? "Crea tu contraseña" : "Cambiar contraseña"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {obligatorio
                ? `Hola ${currentUser?.fullName || ""}. Por tu seguridad, reemplaza la contraseña temporal antes de continuar.`
                : "Usa una contraseña que no compartas con nadie."}
            </p>
          </div>
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-1.5">
              {obligatorio ? "Contraseña temporal" : "Contraseña actual"}
            </span>
            <input type={ver ? "text" : "password"} value={actual} onChange={(e) => setActual(e.target.value)} required className={campo} />
          </label>
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-1.5">Nueva contraseña</span>
            <div className="relative">
              <input type={ver ? "text" : "password"} value={nueva} onChange={(e) => setNueva(e.target.value)} required className={`${campo} pr-12`} />
              <button type="button" onClick={() => setVer(!ver)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                {ver ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="block text-sm font-bold text-slate-700 mb-1.5">Repite la nueva contraseña</span>
            <input type={ver ? "text" : "password"} value={repetir} onChange={(e) => setRepetir(e.target.value)} required className={campo} />
          </label>
          <ul className="space-y-1 text-sm">
            {reglas.map(([ok, t]) => (
              <li key={t} className={ok ? "text-emerald-600" : "text-slate-400"}>
                {ok ? "✓" : "○"} {t}
              </li>
            ))}
          </ul>
          {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
          <button
            type="submit"
            disabled={!valida || guardando}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold cursor-pointer"
          >
            {guardando ? "Guardando…" : "Guardar contraseña"}
          </button>
          <button
            type="button"
            onClick={() => (obligatorio ? logout() : onClose && onClose())}
            className="w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {obligatorio ? "Salir" : "Cancelar"}
          </button>
        </form>
      </div>
    </div>
  );
};
