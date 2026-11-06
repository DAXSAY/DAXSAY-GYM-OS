// Celular que abre el chat de WhatsApp (alumnos, prospectos, contactos).
// Se puede poner dentro de filas clicables: no dispara el clic de la fila.
import React from "react";
import { MessageCircle } from "lucide-react";

/** 987654321 -> 51987654321 (Perú); si ya trae código de país, se deja igual */
export const numeroWhatsApp = (t) => {
  const n = String(t || "").replace(/\D/g, "");
  return n.length === 9 ? `51${n}` : n;
};

export const enlaceWhatsApp = (tel, mensaje = "") =>
  `https://wa.me/${numeroWhatsApp(tel)}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;

export const TelWhatsApp = ({ tel, mensaje = "", className = "", children }) => {
  const n = numeroWhatsApp(tel);
  if (n.length < 7) return <span className={className}>{children ?? (tel || "—")}</span>;
  const abrir = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(enlaceWhatsApp(tel, mensaje), "_blank", "noopener");
  };
  return (
    <span
      role="link"
      tabIndex={0}
      title="Abrir chat de WhatsApp"
      onClick={abrir}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && abrir(e)}
      className={`inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer ${className}`}
    >
      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
      {children ?? tel}
    </span>
  );
};
