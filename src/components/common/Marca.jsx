import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTema } from "../../utils/tema";

// Logo circular de RADICAL
export const LogoRadical = ({ size = 36, className = "" }) => (
  <img
    src="/logo-radical.png"
    alt="RADICAL"
    width={size}
    height={size}
    className={`rounded-full shrink-0 select-none ${className}`}
    style={{ width: size, height: size }}
    draggable={false}
  />
);

// Nombre de la marca con degradado turquesa → naranja
export const NombreRadical = ({ className = "text-base" }) => (
  <span className={`rd-marca font-extrabold ${className}`}>RADICAL</span>
);

// Botón sol / luna para cambiar entre modo claro y oscuro
export const BotonTema = ({ className = "" }) => {
  const [tema, alternar] = useTema();
  const oscuro = tema === "dark";
  return (
    <button
      type="button"
      onClick={alternar}
      title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`relative w-14 h-8 rounded-full border transition-colors cursor-pointer shrink-0 ${
        oscuro ? "bg-marino-900 border-blue-700" : "bg-slate-100 border-slate-200"
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 w-6.5 h-6.5 rounded-full flex items-center justify-center shadow transition-all duration-300 ${
          oscuro ? "left-[1.6rem] bg-blue-500 text-marino-950" : "left-0.5 bg-white text-amber-500"
        }`}
        style={{ width: "1.65rem", height: "1.65rem" }}
      >
        {oscuro ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
};

// Firma del sistema (marca de agua): RADICAL funciona con DAXSAY Gym OS
export const FirmaDaxsay = ({ className = "", claro = false, apilada = false }) => (
  <span className={`inline-flex items-center gap-1.5 select-none ${apilada ? "flex-col gap-0.5" : "whitespace-nowrap"} ${className}`}>
    <span className={`flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] ${claro ? "text-slate-400/80" : "text-slate-400"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-orange-400" />
      con tecnología
    </span>
    <b className="text-[10px] font-black uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">DAXSAY Gym OS</b>
  </span>
);
