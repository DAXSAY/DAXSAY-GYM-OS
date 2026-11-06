// Subir, copiar y descargar imágenes desde el navegador
import { api } from "../api/cliente";

const leer = (archivo) =>
  new Promise((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => mal(new Error("No se pudo leer la imagen"));
    r.readAsDataURL(archivo);
  });

/** Achica la imagen (lado mayor ≤ max px) y la pasa a JPEG; los GIF se envían tal cual para conservar la animación */
async function preparar(archivo, max = 1000) {
  if (!/^image\//.test(archivo.type)) throw new Error("Elige un archivo de imagen");
  if (archivo.type === "image/gif") {
    if (archivo.size > 1.5 * 1024 * 1024) throw new Error("El GIF pesa más de 1,5 MB");
    return leer(archivo);
  }
  const url = await leer(archivo);
  const img = await new Promise((ok, mal) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => mal(new Error("La imagen no se pudo abrir"));
    i.src = url;
  });
  const escala = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * escala);
  c.height = Math.round(img.height * escala);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

/** Sube un archivo de imagen y devuelve la URL donde quedó guardada */
export async function subirImagen(archivo, carpeta = "general") {
  const data = await preparar(archivo);
  const r = await api("/archivos/imagen", { method: "POST", body: { data, carpeta } });
  return r.url;
}

/** URL absoluta (para copiar o compartir) */
export const urlCompleta = (url) => (!url ? "" : /^https?:\/\//.test(url) || url.startsWith("data:") ? url : `${window.location.origin}${url}`);

export async function copiarEnlace(url) {
  await navigator.clipboard.writeText(urlCompleta(url));
}

/** Descarga la imagen; si el sitio de origen no lo permite, la abre en otra pestaña */
export async function descargarImagen(url, nombre = "imagen") {
  try {
    const r = await fetch(urlCompleta(url));
    if (!r.ok) throw new Error();
    const blob = await r.blob();
    const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombre.replace(/[^\w\-áéíóúñ ]/gi, "").trim().replace(/\s+/g, "_") || "imagen"}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch {
    window.open(urlCompleta(url), "_blank", "noopener");
  }
}
