// =====================================================================
// IMÁGENES SUBIDAS (fotos de ejercicios, pautas, etc.)
// Se reciben como data URL (la web las achica antes de enviarlas) y se guardan en
// /uploads/<carpeta>/<año-mes>/<nombre>.<ext>. Se sirven en /uploads/...
// En un hosting, la carpeta "uploads" debe conservarse entre despliegues.
// =====================================================================
import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ErrorHttp, soloPersonal } from "../seguridad.js";

export const CARPETA_UPLOADS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "uploads");
const CARPETAS = ["ejercicios", "pautas", "alimentos", "medidas", "general"];
const TIPOS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAXIMO = 1.5 * 1024 * 1024; // 1,5 MB ya comprimida

const router = Router();
router.use(soloPersonal);

// POST /api/archivos/imagen { data: "data:image/jpeg;base64,...", carpeta }
router.post("/imagen", async (req, res, next) => {
  try {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body?.data || ""));
    if (!m) throw new ErrorHttp(400, "Formato de imagen no válido (usa JPG, PNG, WEBP o GIF)");
    const datos = Buffer.from(m[2], "base64");
    if (!datos.length) throw new ErrorHttp(400, "La imagen está vacía");
    if (datos.length > MAXIMO) throw new ErrorHttp(413, "La imagen es muy pesada (máximo 1,5 MB)");
    const carpeta = CARPETAS.includes(req.body?.carpeta) ? req.body.carpeta : "general";
    const mes = new Date().toISOString().slice(0, 7);
    const dir = path.join(CARPETA_UPLOADS, carpeta, mes);
    await fs.promises.mkdir(dir, { recursive: true });
    const nombre = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${TIPOS[m[1]]}`;
    await fs.promises.writeFile(path.join(dir, nombre), datos);
    res.status(201).json({ url: `/uploads/${carpeta}/${mes}/${nombre}`, bytes: datos.length });
  } catch (e) {
    next(e);
  }
});

export default router;
