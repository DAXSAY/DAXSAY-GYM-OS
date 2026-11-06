// Tokens de sesión y control de permisos
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { consultar, procedimiento } from "./db.js";

const SECRETO = process.env.JWT_SECRET;
export const HORAS_SESION = Number(process.env.SESION_HORAS || 10);

export class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

export function nuevoTokenId() {
  return crypto.randomBytes(16).toString("hex"); // 32 caracteres
}

export function firmarToken(idusuario, tokenId) {
  return jwt.sign({ sub: idusuario, jti: tokenId }, SECRETO, { expiresIn: `${HORAS_SESION}h` });
}

/** Middleware: exige una sesión válida y abierta en la base de datos. */
export async function requiereSesion(req, res, next) {
  try {
    const cabecera = req.headers.authorization || "";
    const token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : null;
    if (!token) throw new ErrorHttp(401, "Debes iniciar sesión");

    let carga;
    try {
      carga = jwt.verify(token, SECRETO);
    } catch {
      throw new ErrorHttp(401, "La sesión expiró. Vuelve a iniciar sesión");
    }

    const [filas] = await procedimiento("sp_sesion_validar", [carga.jti]);
    if (!filas || filas.length === 0) throw new ErrorHttp(401, "La sesión fue cerrada. Vuelve a iniciar sesión");

    req.usuario = { idusuario: filas[0].idusuario, rol: filas[0].rol, tokenId: carga.jti };
    next();
  } catch (e) {
    next(e);
  }
}

/** ¿Tiene el usuario este permiso? accion: ver | crear | editar | eliminar */
export async function tienePermiso(idusuario, modulos, accion = "ver") {
  const lista = Array.isArray(modulos) ? modulos : [modulos];
  const columna = { ver: "puede_ver", crear: "puede_crear", editar: "puede_editar", eliminar: "puede_eliminar" }[accion];
  const marcas = lista.map(() => "?").join(",");
  const filas = await consultar(
    `SELECT 1
       FROM usuarios u
       JOIN modulos m ON m.codigo IN (${marcas}) AND m.activo = 1
       LEFT JOIN rol_permisos rp     ON rp.idrol = u.idrol AND rp.idmodulo = m.idmodulo
       LEFT JOIN usuario_permisos up ON up.idusuario = u.idusuario AND up.idmodulo = m.idmodulo
      WHERE u.idusuario = ? AND COALESCE(up.${columna}, rp.${columna}, 0) = 1
      LIMIT 1`,
    [...lista, idusuario],
  );
  return filas.length > 0;
}

/** Middleware: exige permiso sobre al menos uno de los módulos indicados. */
export function requierePermiso(modulos, accion = "ver") {
  return async (req, res, next) => {
    try {
      if (!(await tienePermiso(req.usuario.idusuario, modulos, accion))) {
        throw new ErrorHttp(403, "No tienes permiso para realizar esta acción");
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Middleware: bloquea a los alumnos (solo personal). */
export function soloPersonal(req, res, next) {
  if (req.usuario.rol === "student") return next(new ErrorHttp(403, "Acceso solo para el personal"));
  next();
}

/** Recepción solo cobra con un turno de caja abierto. */
export async function exigirCajaAbierta(req) {
  if (req.usuario.rol !== "reception") return;
  const filas = await consultar("SELECT 1 FROM turnos_caja WHERE estado = 'abierto' LIMIT 1");
  if (!filas.length) {
    throw new ErrorHttp(409, "La caja está cerrada. Abre tu turno en 'Caja por Turnos' antes de cobrar.");
  }
}

/**
 * Límite de intentos FALLIDOS por IP (además del bloqueo por usuario de sp_login_registrar).
 * Solo cuentan los ingresos rechazados: en el gimnasio muchas personas comparten la misma IP
 * (WiFi), así que los ingresos correctos nunca bloquean a nadie. En memoria (un servidor).
 */
export function limitarIntentos({ maximo = 30, minutos = 15 } = {}) {
  const fallos = new Map();
  setInterval(() => {
    const ahora = Date.now();
    for (const [ip, v] of fallos) if (v.hasta < ahora) fallos.delete(ip);
  }, 60_000).unref();
  return (req, res, next) => {
    const ahora = Date.now();
    const v = fallos.get(req.ip);
    if (v && v.hasta > ahora && v.n >= maximo) {
      res.set("Retry-After", String(Math.ceil((v.hasta - ahora) / 1000)));
      return res.status(429).json({ error: `Demasiados intentos fallidos desde esta conexión. Espera ${minutos} minutos.` });
    }
    res.on("finish", () => {
      if (res.statusCode !== 401 && res.statusCode !== 423) return;
      const actual = fallos.get(req.ip);
      if (!actual || actual.hasta < Date.now()) fallos.set(req.ip, { n: 1, hasta: Date.now() + minutos * 60_000 });
      else actual.n += 1;
    });
    next();
  };
}
