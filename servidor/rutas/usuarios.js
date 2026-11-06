// Usuarios y accesos del personal (solo administración: módulo "users").
// Crear cuentas para cada recepcionista, entrenador, etc.; restablecer
// claves, cambiar rol y activar/desactivar. Las cuentas de alumnos se
// gestionan desde la ficha de cada alumno.
import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { consultar, transaccion } from "../db.js";
import { ErrorHttp, requierePermiso } from "../seguridad.js";

const router = Router();

// rol de la app -> cargo del empleado
const CARGO = {
  admin: "administrador",
  trainer: "entrenador",
  physio: "fisioterapeuta",
  nutritionist: "nutricionista",
  reception: "recepcion",
};

const claveTemporal = () => {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const l = () => letras[crypto.randomInt(letras.length)];
  return `${l()}${l().toLowerCase()}${l().toLowerCase()}${crypto.randomInt(1000, 9999)}${l()}`;
};

const validarClave = (c) => {
  if (c.length < 8) throw new ErrorHttp(400, "La contraseña debe tener al menos 8 caracteres");
  if (!/[A-Za-z]/.test(c) || !/\d/.test(c)) throw new ErrorHttp(400, "La contraseña debe tener letras y números");
};

const SQL_USUARIOS = `
  SELECT u.idusuario, u.usuario, u.activo, u.debe_cambiar_clave, u.ultimo_acceso, u.fecha_creacion,
         u.bloqueado_hasta, r.codigo AS rol, r.nombre AS rol_nombre,
         e.idempleado, e.nombres, e.apellidos, e.dni, e.telefono, e.correo, e.cargo, e.titulo_cargo,
         e.especialidad, e.horario, e.biografia, e.colegiatura, u.idturno_recepcion, tr.nombre AS turno_recepcion
    FROM usuarios u
    JOIN roles r ON r.idrol = u.idrol
    LEFT JOIN empleados e ON e.idempleado = u.idempleado
    LEFT JOIN turnos_recepcion tr ON tr.idturno_recepcion = u.idturno_recepcion
   WHERE u.idalumno IS NULL`;

const aUsuario = (f) => ({
  id: String(f.idusuario),
  username: f.usuario,
  active: !!f.activo,
  mustChangePassword: !!f.debe_cambiar_clave,
  lastAccess: f.ultimo_acceso,
  createdAt: f.fecha_creacion,
  locked: !!(f.bloqueado_hasta && new Date(f.bloqueado_hasta) > new Date()),
  role: f.rol,
  roleName: f.rol_nombre,
  staffId: f.idempleado ? String(f.idempleado) : null,
  firstName: f.nombres || "",
  lastName: f.apellidos || "",
  fullName: [f.nombres, f.apellidos].filter(Boolean).join(" ") || f.usuario,
  dni: f.dni || "",
  phone: f.telefono || "",
  email: f.correo || "",
  title: f.titulo_cargo || "",
  specialty: f.especialidad || "",
  schedule: f.horario || "",
  bio: f.biografia || "",
  license: f.colegiatura || "",
  receptionShiftId: f.idturno_recepcion ? String(f.idturno_recepcion) : "",
  receptionShift: f.turno_recepcion || "",
});

async function obtener(id) {
  const [f] = await consultar(`${SQL_USUARIOS} AND u.idusuario = ?`, [id]);
  if (!f) throw new ErrorHttp(404, "Usuario no encontrado");
  return aUsuario(f);
}

// GET /api/usuarios
router.get("/", requierePermiso("users", "ver"), async (req, res, next) => {
  try {
    const filas = await consultar(`${SQL_USUARIOS} ORDER BY u.activo DESC, r.idrol, e.nombres`);
    const [alumnos] = await consultar(
      "SELECT COUNT(*) AS total, SUM(activo) AS activos FROM usuarios WHERE idalumno IS NOT NULL",
    );
    res.json({
      usuarios: filas.map(aUsuario),
      cuentasAlumnos: { total: Number(alumnos.total || 0), activas: Number(alumnos.activos || 0) },
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/usuarios { nombres, apellidos, dni, telefono, correo, rol, usuario, clave?, titulo }
router.post("/", requierePermiso("users", "crear"), async (req, res, next) => {
  try {
    const d = req.body || {};
    const nombres = String(d.nombres || "").trim();
    const apellidos = String(d.apellidos || "").trim();
    if (!nombres || !apellidos) throw new ErrorHttp(400, "Ingresa nombres y apellidos");
    if (!/^\+?\d[\d\s-]{6,}$/.test(String(d.telefono || "").trim())) throw new ErrorHttp(400, "Ingresa el celular del trabajador");
    if (!CARGO[d.rol]) throw new ErrorHttp(400, "Elige un rol válido");
    const usuario = String(d.usuario || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) {
      throw new ErrorHttp(400, "El usuario debe tener de 3 a 40 caracteres (letras, números, punto o guion)");
    }
    const dni = String(d.dni || "").trim();
    if (dni && !/^\d{8}$/.test(dni)) throw new ErrorHttp(400, "El DNI debe tener 8 dígitos");
    const clave = String(d.clave || "").trim() || claveTemporal();
    validarClave(clave);

    if ((await consultar("SELECT 1 FROM usuarios WHERE usuario = ?", [usuario])).length) {
      throw new ErrorHttp(409, `El usuario "${usuario}" ya existe`);
    }
    if (dni && (await consultar("SELECT 1 FROM empleados WHERE dni = ?", [dni])).length) {
      throw new ErrorHttp(409, "Ya hay un trabajador registrado con ese DNI");
    }
    const hash = await bcrypt.hash(clave, 10);
    const id = await transaccion(async (cx) => {
      const [e] = await cx.execute(
        `INSERT INTO empleados (dni, nombres, apellidos, telefono, correo, cargo, titulo_cargo, especialidad, horario,
                                biografia, colegiatura, fecha_ingreso)
         VALUES (?,?,?,?,?,?,?,?,?,?,?, CURDATE())`,
        [
          dni || null,
          nombres.slice(0, 80),
          apellidos.slice(0, 80),
          String(d.telefono || "").trim().slice(0, 20) || null,
          String(d.correo || "").trim().slice(0, 120) || null,
          CARGO[d.rol],
          String(d.titulo || "").trim().slice(0, 120) || null,
          String(d.especialidad || "").trim().slice(0, 120) || null,
          String(d.horario || "").trim().slice(0, 120) || null,
          String(d.biografia || "").trim().slice(0, 500) || null,
          String(d.colegiatura || "").trim().slice(0, 30) || null,
        ],
      );
      const [u] = await cx.execute(
        `INSERT INTO usuarios (usuario, clave_hash, idrol, idempleado, debe_cambiar_clave, creado_por, idturno_recepcion)
         SELECT ?, ?, idrol, ?, 1, ?, ? FROM roles WHERE codigo = ?`,
        [usuario, hash, e.insertId, req.usuario.idusuario, d.rol === "reception" ? Number(d.turnoRecepcion) || null : null, d.rol],
      );
      return u.insertId;
    });
    res.status(201).json({ ...(await obtener(id)), claveTemporal: clave });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return next(new ErrorHttp(409, "El usuario, DNI o correo ya está registrado"));
    next(e);
  }
});

// PUT /api/usuarios/:id { nombres, apellidos, telefono, correo, titulo, rol, activo }
router.put("/:id", requierePermiso("users", "editar"), async (req, res, next) => {
  try {
    const d = req.body || {};
    const actual = await obtener(req.params.id);
    const esUnoMismo = String(req.usuario.idusuario) === actual.id;
    if (esUnoMismo && (d.activo === false || (d.rol && d.rol !== actual.role))) {
      throw new ErrorHttp(400, "No puedes desactivar ni cambiar el rol de tu propia cuenta");
    }
    if (d.rol && !CARGO[d.rol]) throw new ErrorHttp(400, "Rol no válido");
    // Siempre debe quedar al menos un administrador activo
    if (actual.role === "admin" && ((d.rol && d.rol !== "admin") || d.activo === false)) {
      const [n] = await consultar(
        `SELECT COUNT(*) AS n FROM usuarios u JOIN roles r ON r.idrol = u.idrol
          WHERE r.codigo = 'admin' AND u.activo = 1 AND u.idusuario <> ?`,
        [actual.id],
      );
      if (!Number(n.n)) throw new ErrorHttp(400, "Debe quedar al menos un administrador activo");
    }
    await transaccion(async (cx) => {
      if (actual.staffId) {
        await cx.execute(
          `UPDATE empleados SET nombres = COALESCE(?, nombres), apellidos = COALESCE(?, apellidos),
                  telefono = ?, correo = ?, titulo_cargo = ?, cargo = COALESCE(?, cargo),
                  especialidad = ?, horario = ?, biografia = ?, colegiatura = ?
            WHERE idempleado = ?`,
          [
            String(d.nombres || "").trim() || null,
            String(d.apellidos || "").trim() || null,
            String(d.telefono ?? actual.phone).trim().slice(0, 20) || null,
            String(d.correo ?? actual.email).trim().slice(0, 120) || null,
            String(d.titulo ?? actual.title).trim().slice(0, 120) || null,
            d.rol ? CARGO[d.rol] : null,
            String(d.especialidad ?? actual.specialty).trim().slice(0, 120) || null,
            String(d.horario ?? actual.schedule).trim().slice(0, 120) || null,
            String(d.biografia ?? actual.bio).trim().slice(0, 500) || null,
            String(d.colegiatura ?? actual.license).trim().slice(0, 30) || null,
            actual.staffId,
          ],
        );
      }
      if (d.turnoRecepcion !== undefined) {
        const rolFinal = d.rol || actual.role;
        await cx.execute("UPDATE usuarios SET idturno_recepcion = ? WHERE idusuario = ?", [
          rolFinal === "reception" ? Number(d.turnoRecepcion) || null : null,
          actual.id,
        ]);
      }
      if (d.rol && d.rol !== actual.role) {
        await cx.execute("UPDATE usuarios SET idrol = (SELECT idrol FROM roles WHERE codigo = ?) WHERE idusuario = ?", [
          d.rol,
          actual.id,
        ]);
        // con otro rol, debe volver a ingresar
        await cx.execute("UPDATE sesiones SET fecha_cierre = NOW() WHERE idusuario = ? AND fecha_cierre IS NULL", [actual.id]);
      }
      if (typeof d.activo === "boolean") {
        await cx.execute("UPDATE usuarios SET activo = ? WHERE idusuario = ?", [d.activo ? 1 : 0, actual.id]);
      }
    });
    res.json(await obtener(actual.id));
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return next(new ErrorHttp(409, "Ese correo ya está registrado"));
    next(e);
  }
});

// POST /api/usuarios/:id/clave  { clave? }  -> restablece y obliga a cambiarla
router.post("/:id/clave", requierePermiso("users", "editar"), async (req, res, next) => {
  try {
    const actual = await obtener(req.params.id);
    const clave = String(req.body?.clave || "").trim() || claveTemporal();
    validarClave(clave);
    await consultar(
      `UPDATE usuarios SET clave_hash = ?, debe_cambiar_clave = 1, intentos_fallidos = 0, bloqueado_hasta = NULL
        WHERE idusuario = ?`,
      [await bcrypt.hash(clave, 10), actual.id],
    );
    if (String(req.usuario.idusuario) !== actual.id) {
      await consultar("UPDATE sesiones SET fecha_cierre = NOW() WHERE idusuario = ? AND fecha_cierre IS NULL", [actual.id]);
    }
    res.json({ usuario: actual.username, claveTemporal: clave });
  } catch (e) {
    next(e);
  }
});

export default router;
