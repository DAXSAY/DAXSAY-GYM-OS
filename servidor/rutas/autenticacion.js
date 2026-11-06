// Inicio y cierre de sesión, datos del usuario conectado y cambio de clave
import { Router } from "express";
import bcrypt from "bcryptjs";
import { procedimiento, consultar } from "../db.js";
import { ErrorHttp, firmarToken, nuevoTokenId, requiereSesion, HORAS_SESION } from "../seguridad.js";

const router = Router();

// PHP/bcrypt usa el prefijo $2y$; bcryptjs entiende $2a$/$2b$ (mismo algoritmo)
const normalizarHash = (h) => h.replace(/^\$2y\$/, "$2b$");

/** Datos del usuario en el formato que usa la aplicación. */
async function perfil(idusuario) {
  const [filas] = await procedimiento("sp_login_buscar", [
    (await consultar("SELECT usuario FROM usuarios WHERE idusuario = ?", [idusuario]))[0]?.usuario ?? "",
  ]);
  const u = filas?.[0];
  if (!u) throw new ErrorHttp(404, "Usuario no encontrado");
  const [permisos] = await procedimiento("sp_usuario_permisos", [idusuario]);
  return {
    id: String(u.idusuario),
    username: u.usuario,
    fullName: u.nombre_completo,
    role: u.rol,
    roleName: u.rol_nombre,
    photoUrl: u.foto || null,
    memberId: u.idalumno ? String(u.idalumno) : null,
    staffId: u.idempleado ? String(u.idempleado) : null,
    trainerId: u.rol === "trainer" && u.idempleado ? String(u.idempleado) : null,
    mustChangePassword: Boolean(u.debe_cambiar_clave),
    modules: (permisos || []).map((p) => p.modulo),
    permissions: Object.fromEntries(
      (permisos || []).map((p) => [
        p.modulo,
        { ver: !!p.puede_ver, crear: !!p.puede_crear, editar: !!p.puede_editar, eliminar: !!p.puede_eliminar },
      ]),
    ),
  };
}

// POST /api/auth/ingresar  { usuario, clave }
router.post("/ingresar", async (req, res, next) => {
  try {
    const usuario = String(req.body?.usuario || "").trim().toLowerCase();
    const clave = String(req.body?.clave || "");
    if (!usuario || !clave) throw new ErrorHttp(400, "Ingresa tu usuario y contraseña");

    const [filas] = await procedimiento("sp_login_buscar", [usuario]);
    const u = filas?.[0];
    const correcta = u ? await bcrypt.compare(clave, normalizarHash(u.clave_hash)) : false;

    const tokenId = nuevoTokenId();
    const [resultado] = await procedimiento("sp_login_registrar", [
      usuario,
      correcta ? 1 : 0,
      tokenId,
      HORAS_SESION,
      req.ip,
      String(req.headers["user-agent"] || "").slice(0, 250),
    ]);
    const estado = resultado?.[0]?.resultado;

    if (estado === "bloqueado") {
      throw new ErrorHttp(423, "Cuenta bloqueada por varios intentos fallidos. Intenta de nuevo en 15 minutos o pide a administración que la desbloquee.");
    }
    if (estado === "inactivo") throw new ErrorHttp(403, "Este usuario está desactivado. Consulta con administración.");
    if (estado !== "exitoso") throw new ErrorHttp(401, "Usuario o contraseña incorrectos.");

    res.json({ token: firmarToken(u.idusuario, tokenId), usuario: await perfil(u.idusuario) });
  } catch (e) {
    next(e);
  }
});

// GET /api/auth/yo
router.get("/yo", requiereSesion, async (req, res, next) => {
  try {
    res.json({ usuario: await perfil(req.usuario.idusuario) });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/salir
router.post("/salir", requiereSesion, async (req, res, next) => {
  try {
    await procedimiento("sp_sesion_cerrar", [req.usuario.tokenId]);
    res.json({ mensaje: "Sesión cerrada" });
  } catch (e) {
    next(e);
  }
});

// PUT /api/auth/clave  { actual, nueva }
router.put("/clave", requiereSesion, async (req, res, next) => {
  try {
    const { actual = "", nueva = "" } = req.body || {};
    if (String(nueva).length < 8) throw new ErrorHttp(400, "La nueva contraseña debe tener al menos 8 caracteres");
    if (String(nueva) === String(actual)) throw new ErrorHttp(400, "La nueva contraseña debe ser distinta de la actual");
    if (/^\d+$/.test(String(nueva))) throw new ErrorHttp(400, "La contraseña no puede ser solo números (por ejemplo, tu DNI)");
    const [fila] = await consultar("SELECT clave_hash FROM usuarios WHERE idusuario = ?", [req.usuario.idusuario]);
    if (!fila || !(await bcrypt.compare(String(actual), normalizarHash(fila.clave_hash)))) {
      throw new ErrorHttp(400, "La contraseña actual no es correcta");
    }
    const hash = await bcrypt.hash(String(nueva), 10);
    await procedimiento("sp_usuario_cambiar_clave", [req.usuario.idusuario, hash]);
    res.json({ mensaje: "Contraseña actualizada" });
  } catch (e) {
    next(e);
  }
});

export default router;
