// =====================================================================
// RADICAL GYM - API (Node.js + Express + MySQL)
// Arranca junto con la web con:  npm run dev
// =====================================================================
import { archivoConfiguracion } from "./config.js";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { ErrorHttp, requiereSesion, limitarIntentos } from "./seguridad.js";
import autenticacion from "./rutas/autenticacion.js";
import alumnos from "./rutas/alumnos.js";
import { planes, entrenadores, caja, personal } from "./rutas/catalogos.js";
import registros from "./rutas/registros.js";
import turnosCaja from "./rutas/turnosCaja.js";
import usuarios from "./rutas/usuarios.js";
import tienda from "./rutas/tienda.js";
import reportes from "./rutas/reportes.js";
import metas from "./rutas/metas.js";
import configuracion from "./rutas/configuracion.js";
import alimentos from "./rutas/alimentos.js";
import alertas from "./rutas/alertas.js";
import indicaciones from "./rutas/indicaciones.js";
import mensajes from "./rutas/mensajes.js";
import archivos, { CARPETA_UPLOADS } from "./rutas/archivos.js";
import prospectos from "./rutas/prospectos.js";
import { verificarSincronizacion, sincronizarPendientes } from "./sincronizacion.js";
import { aplicarActualizaciones } from "./actualizaciones.js";

for (const clave of ["DB_USER", "DB_PASSWORD", "JWT_SECRET"]) {
  if (!process.env[clave]) {
    console.error(`Falta ${clave} en el archivo de configuración (.env o gestion_radicalgym.env).`);
    process.exit(1);
  }
}
const PRODUCCION = process.env.NODE_ENV === "production";
if (String(process.env.JWT_SECRET).length < 32) {
  const msg = "JWT_SECRET es corto: usa al menos 32 caracteres aleatorios (ver .env.example).";
  if (PRODUCCION) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`Aviso: ${msg}`);
}

const app = express();
app.disable("x-powered-by");
// Detrás de Nginx, Apache o el proxy del hosting: así req.ip es la IP real del visitante
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

// Cabeceras de seguridad básicas
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  });
  if (req.secure) res.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  if (req.path.startsWith("/api/")) res.set("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "3mb" }));

// Comprobación rápida de que la API y la base responden
app.get("/api/salud", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ api: "ok", baseDatos: "ok" });
  } catch (e) {
    res.status(500).json({ api: "ok", baseDatos: "sin conexión", detalle: e.code });
  }
});

app.use("/api/auth/ingresar", limitarIntentos({ maximo: 30, minutos: 15 }));
app.use("/api/auth", autenticacion);
app.use("/api/alumnos", requiereSesion, alumnos);
app.use("/api/planes", requiereSesion, planes);
app.use("/api/entrenadores", requiereSesion, entrenadores);
app.use("/api/caja", requiereSesion, caja);
app.use("/api/registros", requiereSesion, registros);
app.use("/api/personal", requiereSesion, personal);
app.use("/api/turnos-caja", requiereSesion, turnosCaja);
app.use("/api/usuarios", requiereSesion, usuarios);
app.use("/api/tienda", requiereSesion, tienda);
app.use("/api/reportes", requiereSesion, reportes);
app.use("/api/metas", requiereSesion, metas);
app.use("/api/configuracion", requiereSesion, configuracion);
app.use("/api/alimentos", requiereSesion, alimentos);
app.use("/api/alertas", requiereSesion, alertas);
app.use("/api/indicaciones", requiereSesion, indicaciones);
app.use("/api/mensajes", requiereSesion, mensajes);
app.use("/api/archivos", requiereSesion, archivos);
app.use("/api/prospectos", requiereSesion, prospectos);

// Imágenes subidas (públicas por enlace, nombres imposibles de adivinar)
app.use("/uploads", express.static(CARPETA_UPLOADS, { maxAge: "30d" }));
// Imagen que ya no existe: 404 (no error del servidor)
app.use("/uploads", (_req, res) => res.status(404).end());

app.use("/api", (req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Web ya compilada (npm run build -> dist/): la API la sirve en el mismo dominio
const carpetaWeb = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const hayWeb = fs.existsSync(path.join(carpetaWeb, "index.html"));
if (hayWeb) {
  app.use("/assets", express.static(path.join(carpetaWeb, "assets"), { immutable: true, maxAge: "365d" }));
  app.use(express.static(carpetaWeb, { index: false, maxAge: "1h" }));
  // Cualquier otra ruta abre la aplicación (React decide qué mostrar)
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(carpetaWeb, "index.html"));
  });
}

// Errores internos también en servidor/errores.log (para revisarlos después)
const ARCHIVO_ERRORES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "errores.log");
function registrarError(donde, err) {
  try {
    const linea = `[${new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })}] ${donde} :: ${err?.code || ""} ${err?.sqlMessage || err?.message || err}\n`;
    fs.appendFileSync(ARCHIVO_ERRORES, linea);
  } catch {
    /* sin registro */
  }
}

// Manejo central de errores
app.use((err, req, res, next) => {
  if (err instanceof ErrorHttp) return res.status(err.estado).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Datos enviados con formato inválido" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Los datos enviados son demasiado grandes" });
  if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage }); // reglas de los triggers
  console.error(err);
  registrarError(`${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: "Error interno del servidor. Revisa la consola de la API." });
});

const puerto = Number(process.env.PORT || process.env.API_PORT || 4000);
// HOST=0.0.0.0 si el hosting lo pide; por defecto solo escucha en la propia máquina (detrás de Nginx)
const host = process.env.HOST || "127.0.0.1";
const servidor = app.listen(puerto, host, async () => {
  console.log(`API de Radical Gym en http://${host === "0.0.0.0" ? "localhost" : host}:${puerto} (config: ${archivoConfiguracion})`);
  if (hayWeb) console.log("Sirviendo también la web compilada (carpeta dist).");
  try {
    await pool.query("SELECT 1");
    console.log(`Conectada a MySQL: ${process.env.DB_NAME || "gestion_radicalgym"}`);
    // Actualizaciones de la base que falten (scripts 22 y 23: pases libres del CRM)
    try {
      const hechos = await aplicarActualizaciones();
      hechos.forEach((h) => console.log(`Base actualizada: ${h}`));
    } catch (e) {
      console.warn(`No se pudo actualizar la base (${e.code || e.message}). Ejecuta base_datos/23_pases_libres.sql en Workbench.`);
      registrarError("actualizaciones de la base", e);
    }
    // Mantenimiento: estados de matrículas/contratos y limpieza de sesiones viejas (al iniciar y cada 6 h)
    const mantenimiento = () =>
      pool.query("CALL sp_estados_actualizar()").catch((e) => console.warn(`Mantenimiento no ejecutado: ${e.code || e.message}`));
    await mantenimiento();
    setInterval(mantenimiento, 6 * 60 * 60 * 1000).unref();
    // Copia a sus tablas (citas, rutinas, dietas...) lo que aún no se copió
    if (await verificarSincronizacion()) {
      const r = await sincronizarPendientes();
      if (r.ok || r.error) console.log(`Sincronización con tablas: ${r.ok} copiados, ${r.error} con error`);
    } else {
      console.warn("Falta ejecutar base_datos/07_sincronizacion_tablas.sql: los registros solo se guardan en registros_app.");
    }
  } catch (e) {
    console.error(`No se pudo conectar a MySQL (${e.code}). Revisa el archivo de configuración (${archivoConfiguracion})`);
  }
});

// Apagado ordenado (el hosting reinicia o despliega una versión nueva)
for (const senal of ["SIGTERM", "SIGINT"]) {
  process.on(senal, () => {
    servidor.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 8000).unref();
  });
}
