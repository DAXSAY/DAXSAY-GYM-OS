// Aviso de stock mínimo: cuando un producto llega a su stock mínimo
// (por una venta en cualquier caja, ya que los datos se refrescan cada minuto)
// aparece una tarjeta naranja y una notificación del navegador.
import React, { useEffect, useRef, useState } from "react";
import { PackageX, X } from "lucide-react";
import { useGym } from "../../context/GymContext";

const CLAVE = "radical_stock_avisado";
const leer = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE) || "{}");
  } catch {
    return {};
  }
};

export const AvisoStockBajo = ({ onAbrir }) => {
  const { lowStockProducts = [] } = useGym();
  const [visibles, setVisibles] = useState([]);
  const avisados = useRef(leer());

  useEffect(() => {
    // Clave por producto y stock: si vuelve a bajar, se avisa de nuevo
    const nuevos = lowStockProducts.filter((p) => avisados.current[p.id] !== Number(p.stock));
    // Si se repuso, se olvida para avisar la próxima vez
    Object.keys(avisados.current).forEach((id) => {
      if (!lowStockProducts.some((p) => String(p.id) === String(id))) delete avisados.current[id];
    });
    if (nuevos.length) {
      nuevos.forEach((p) => (avisados.current[p.id] = Number(p.stock)));
      setVisibles(nuevos);
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("RADICAL · Stock mínimo", {
            body: nuevos.map((p) => `${p.name}: ${Number(p.stock) <= 0 ? "sin stock" : `quedan ${p.stock}`}`).join("\n"),
            icon: "/logo-radical.png",
          });
        }
      } catch {
        /* sin notificaciones */
      }
    }
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(avisados.current));
    } catch {
      /* sin almacenamiento */
    }
  }, [lowStockProducts]);

  if (!visibles.length) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[60] w-80 rounded-2xl border border-orange-300 bg-orange-50 shadow-xl p-3 rd-aparece">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-black uppercase text-orange-800 flex items-center gap-1.5">
          <PackageX className="w-4 h-4" /> Stock mínimo ({visibles.length})
        </p>
        <button type="button" onClick={() => setVisibles([])} className="text-orange-400 hover:text-orange-700 cursor-pointer" title="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </div>
      <ul className="mt-1 space-y-0.5 text-xs text-orange-900 max-h-40 overflow-y-auto">
        {visibles.slice(0, 8).map((p) => (
          <li key={p.id}>
            <b>{p.name}</b>: {Number(p.stock) <= 0 ? "¡sin stock!" : `quedan ${p.stock}`} (mínimo {p.minStockAlert})
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          setVisibles([]);
          onAbrir?.();
        }}
        className="mt-2 w-full py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold cursor-pointer"
      >
        Ir a la tienda
      </button>
    </div>
  );
};
