// Código QR (sin internet): dibuja el QR en SVG y permite descargarlo
// como imagen (tarjeta de invitación) para enviarlo por WhatsApp.
import React, { useMemo } from "react";
import qrcode from "../../vendor/qrcode-generator.mjs";

/** Matriz de módulos (true = negro) */
export const matrizQR = (texto, nivel = "M") => {
  const q = qrcode(0, nivel);
  q.addData(String(texto));
  q.make();
  const n = q.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => q.isDark(r, c)));
};

export const QrCodigo = ({ texto, tam = 168, className = "" }) => {
  const { n, d } = useMemo(() => {
    const m = matrizQR(texto);
    let path = "";
    m.forEach((fila, r) => fila.forEach((v, c) => v && (path += `M${c + 4},${r + 4}h1v1h-1z`)));
    return { n: m.length + 8, d: path };
  }, [texto]);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={tam} height={tam} className={`rd-claro bg-white rounded-xl ${className}`} shapeRendering="crispEdges" role="img" aria-label={`Código QR ${texto}`}>
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#0b1f2a" />
    </svg>
  );
};

/** Dibuja la tarjeta (canvas) con el QR, el código y los datos de la invitación */
function dibujarTarjetaQR({ texto, titulo = "PASE LIBRE", nombre = "", detalle = "" }) {
  const m = matrizQR(texto);
  const escala = 10;
  const lado = (m.length + 8) * escala;
  const W = Math.max(lado + 80, 560);
  const H = lado + 300;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#062a33");
  grad.addColorStop(1, "#0d7d74");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.font = "900 44px Arial, sans-serif";
  g.fillText("RADICAL", W / 2, 64);
  g.font = "700 22px Arial, sans-serif";
  g.fillStyle = "#5eead4";
  g.fillText(titulo, W / 2, 98);
  const x0 = (W - lado) / 2;
  const y0 = 120;
  g.fillStyle = "#fff";
  g.fillRect(x0, y0, lado, lado);
  g.fillStyle = "#0b1f2a";
  m.forEach((fila, r) => fila.forEach((v, c) => v && g.fillRect(x0 + (c + 4) * escala, y0 + (r + 4) * escala, escala, escala)));
  g.fillStyle = "#fff";
  g.font = "900 40px 'Courier New', monospace";
  g.fillText(texto, W / 2, y0 + lado + 56);
  g.font = "700 22px Arial, sans-serif";
  if (nombre) g.fillText(nombre, W / 2, y0 + lado + 96);
  g.font = "400 19px Arial, sans-serif";
  g.fillStyle = "#ccfbf1";
  if (detalle) g.fillText(detalle, W / 2, y0 + lado + 128);
  g.fillText("Muestra este código en recepción", W / 2, y0 + lado + 160);
  return cv;
}

const bajarCanvas = (cv, archivo) => {
  const a = document.createElement("a");
  a.href = cv.toDataURL("image/png");
  a.download = archivo;
  a.click();
};

/** Descarga una tarjeta PNG con el QR, el código y los datos de la invitación */
export function descargarTarjetaQR({ archivo = "pase-libre.png", ...datos }) {
  bajarCanvas(dibujarTarjetaQR(datos), archivo);
}

/** Descarga la tarjeta del QR como PDF (una página del tamaño de la tarjeta) */
export async function descargarPdfQR({ archivo = "pase-libre.pdf", ...datos }) {
  const { default: jsPDF } = await import("jspdf");
  const cv = dibujarTarjetaQR(datos);
  const ancho = 90; // mm
  const alto = (cv.height / cv.width) * ancho;
  const doc = new jsPDF({ unit: "mm", format: [ancho, alto], orientation: alto >= ancho ? "portrait" : "landscape" });
  doc.addImage(cv.toDataURL("image/png"), "PNG", 0, 0, ancho, alto);
  doc.save(archivo);
}

/** Envía la tarjeta del QR por WhatsApp.
 *  - En el celular abre el menú "Compartir" con la imagen (se elige WhatsApp).
 *  - En la PC copia la imagen y abre el chat de WhatsApp con el mensaje:
 *    allí solo se pega con Ctrl+V. Si no se puede copiar, la descarga.
 *  Devuelve "compartido" | "copiado" | "descargado" | "cancelado". */
export async function compartirTarjetaQR({ telefono = "", mensaje = "", archivo = "pase-libre.png", ...datos }) {
  const cv = dibujarTarjetaQR(datos);
  const blob = new Promise((ok) => cv.toBlob(ok, "image/png"));
  const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  if (esMovil && navigator.canShare) {
    try {
      const file = new File([await blob], archivo, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: mensaje });
        return "compartido";
      }
    } catch (e) {
      if (e?.name === "AbortError") return "cancelado";
    }
  }
  let modo = "copiado";
  try {
    await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
  } catch {
    modo = "descargado";
    bajarCanvas(cv, archivo);
  }
  window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
  return modo;
}

/** Lector con la cámara (solo navegadores con BarcodeDetector, p. ej. Chrome en Android).
 *  En la PC de recepción se usa el lector USB, que escribe el código como un teclado. */
export const camaraQRDisponible = () => typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

export const EscanerQR = ({ onLeido, onCerrar }) => {
  const video = React.useRef(null);
  const [error, setError] = React.useState("");
  const avisar = React.useRef(onLeido);
  avisar.current = onLeido;
  React.useEffect(() => {
    let flujo;
    let vivo = true;
    let timer;
    (async () => {
      try {
        const det = new window.BarcodeDetector({ formats: ["qr_code"] });
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!vivo) return;
        video.current.srcObject = flujo;
        await video.current.play();
        const buscar = async () => {
          if (!vivo) return;
          try {
            const r = await det.detect(video.current);
            if (r[0]?.rawValue) return avisar.current(r[0].rawValue);
          } catch {
            /* sigue intentando */
          }
          timer = setTimeout(buscar, 250);
        };
        buscar();
      } catch (e) {
        setError(e?.message || "No se pudo abrir la cámara");
      }
    })();
    return () => {
      vivo = false;
      clearTimeout(timer);
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl p-4 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
        <p className="font-black text-slate-900">Apunta la cámara al QR del pase</p>
        {error ? <p className="text-sm text-rose-600">{error}</p> : <video ref={video} className="w-full rounded-xl bg-black aspect-square object-cover" muted playsInline />}
        <button type="button" onClick={onCerrar} className="w-full py-2 rounded-xl bg-slate-800 text-white text-sm font-bold cursor-pointer">
          Cerrar
        </button>
      </div>
    </div>
  );
};
