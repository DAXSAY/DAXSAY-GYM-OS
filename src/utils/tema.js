// Modo claro / oscuro de RADICAL. Se guarda en este navegador.
import { useEffect, useState } from "react";

const CLAVE = "radical:tema";

export const temaGuardado = () => {
  try {
    const t = localStorage.getItem(CLAVE);
    if (t === "dark" || t === "light") return t;
  } catch { /* sin almacenamiento */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const aplicarTema = (t) => {
  document.documentElement.classList.toggle("dark", t === "dark");
};

export const useTema = () => {
  const [tema, setTema] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  useEffect(() => {
    aplicarTema(tema);
    try { localStorage.setItem(CLAVE, tema); } catch { /* sin almacenamiento */ }
    window.dispatchEvent(new CustomEvent("radical:tema", { detail: tema }));
  }, [tema]);
  useEffect(() => {
    const sync = (e) => setTema(e.detail);
    window.addEventListener("radical:tema", sync);
    return () => window.removeEventListener("radical:tema", sync);
  }, []);
  return [tema, () => setTema((t) => (t === "dark" ? "light" : "dark"))];
};
