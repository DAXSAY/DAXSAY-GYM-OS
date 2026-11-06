import React, { useState } from "react";
import { Eye, EyeOff, LogIn, Lock, User, AlertCircle } from "lucide-react";
import { useGym } from "../../context/GymContext";
import { LogoRadical, NombreRadical, BotonTema, FirmaDaxsay } from "../common/Marca";

export const LoginScreen = () => {
  const { login } = useGym();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }
    setLoading(true);
    login(username, password).then((result) => {
      if (!result.success) {
        setError(result.message);
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Panel izquierdo: marca */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-marino-800 via-marino-950 to-[#04101e] p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
        <img src="/logo-radical.png" alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] max-w-[80%] opacity-[0.07] rounded-full pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <LogoRadical size={52} className="ring-2 ring-blue-400/40" />
          <NombreRadical className="text-3xl" />
        </div>

        <div className="relative space-y-4 max-w-md">
          <h1 className="font-['Outfit',sans-serif] text-4xl font-extrabold leading-tight">
            Entrena, mide y <span className="text-blue-300">avanza</span>.
            <span className="block text-2xl font-semibold text-slate-300 mt-1">Sistema de gestión del gimnasio</span>
          </h1>
          <p className="text-slate-300/90 text-sm leading-relaxed">
            Alumnos, membresías, rutinas, nutrición, fisioterapia, asistencias,
            ventas y caja en un solo lugar. Cada miembro del equipo ve solo lo
            que necesita para su trabajo.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400/70">© {new Date().getFullYear()} RADICAL</p>
          <FirmaDaxsay claro />
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="relative flex-1 flex items-center justify-center p-6 rd-fondo text-slate-900">
        <div className="absolute top-4 right-4"><BotonTema /></div>
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-8">
            <LogoRadical size={44} />
            <NombreRadical className="text-2xl" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-7">
            <h2 className="text-xl font-extrabold text-slate-900">Iniciar sesión</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Ingresa con el usuario asignado a tu área.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Usuario
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. recepcion"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-70 text-white text-sm font-bold rounded-lg rd-brillo transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            ¿Olvidaste tu contraseña? Comunícate con administración.
          </p>
          <div className="text-center mt-6"><FirmaDaxsay /></div>
        </div>
      </div>
    </div>
  );
};
