import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { aplicarTema, temaGuardado } from "./utils/tema";

// Aplica el modo claro/oscuro guardado antes de pintar (evita parpadeo)
aplicarTema(temaGuardado());

// Campos numéricos: al entrar se selecciona el valor (escribir lo reemplaza)
// y se quitan los ceros a la izquierda (evita "012").
document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (el instanceof HTMLInputElement && el.type === "number") {
    requestAnimationFrame(() => el.select());
  }
});
document.addEventListener(
  "input",
  (e) => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.type === "number" && /^-?0\d/.test(el.value)) {
      el.value = el.value.replace(/^(-?)0+(?=\d)/, "$1");
    }
  },
  true,
);

// Imagen que no carga (borrada o sin internet): se muestra un recuadro neutro
const IMAGEN_RESPALDO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" rx="12" fill="#e2eef1"/><g fill="none" stroke="#0ea7b3" stroke-width="5" stroke-linecap="round"><path d="M52 60h56"/><path d="M44 46v28M36 52v16M116 46v28M124 52v16"/></g><text x="80" y="102" font-family="sans-serif" font-size="11" fill="#5b7a88" text-anchor="middle">Imagen no disponible</text></svg>',
  );
document.addEventListener(
  "error",
  (e) => {
    const el = e.target;
    if (el instanceof HTMLImageElement && !el.dataset.respaldo && !el.src.startsWith("data:")) {
      el.dataset.respaldo = "1";
      el.src = IMAGEN_RESPALDO;
    }
  },
  true,
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
