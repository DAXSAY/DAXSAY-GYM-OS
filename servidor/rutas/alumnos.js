// Alumnos, matrículas y renovaciones
import { Router } from "express";
import bcrypt from "bcryptjs";
import { consultar, transaccion } from "../db.js";
import { ErrorHttp, exigirCajaAbierta, requierePermiso, tienePermiso } from "../seguridad.js";
import {
  SQL_CONGELAMIENTOS, aCongelamiento, diasEntre as diasCal, hoyLima as hoy, estadoCongelamiento, moverMembresia, reglas, saldo, sumarDias, validarDias,
} from "../congelamiento.js";
import { codigoAlumno } from "../codigoAlumno.js";
import { alertaCambioFechaPago } from "./alertas.js";

const router = Router();

// Deuda del alumno: precio acordado - lo pagado al matricular - pagos posteriores
export const SQL_DEUDA = `GREATEST(0,
   (SELECT IFNULL(SUM(GREATEST(IFNULL(md.precio_total, md.monto) - md.monto, 0)), 0)
      FROM matriculas md WHERE md.idalumno = a.idalumno AND md.estado <> 'anulada')
 - (SELECT IFNULL(SUM(pg.monto), 0) FROM pagos_matricula pg JOIN matriculas mp ON mp.idmatricula = pg.idmatricula
     WHERE mp.idalumno = a.idalumno AND mp.estado <> 'anulada'))`;

// Saldo pendiente de una matrícula (alias de la matrícula como parámetro)
export const saldoMatricula = (m) => `(IFNULL(${m}.precio_total, ${m}.monto) - ${m}.monto
   - (SELECT IFNULL(SUM(px.monto), 0) FROM pagos_matricula px WHERE px.idmatricula = ${m}.idmatricula))`;

// Fecha límite más próxima para cancelar la deuda (si no se fijó, el fin de la membresía)
export const SQL_VENCE_DEUDA = `(SELECT MIN(IFNULL(mv.fecha_limite_pago, mv.fecha_fin)) FROM matriculas mv
   WHERE mv.idalumno = a.idalumno AND mv.estado <> 'anulada' AND ${saldoMatricula("mv")} > 0.004)`;

// Última matrícula (no anulada) de cada alumno
const SQL_ALUMNOS = `
  SELECT a.*, m.idmatricula, m.idplan, m.fecha_inicio, m.fecha_fin, m.monto, m.precio_total, m.estado AS estado_matricula,
         DATE(m.fecha_registro) AS fecha_pago, p.nombre AS plan,
         ua.usuario AS usuario_acceso, ua.activo AS usuario_activo,
         (SELECT COUNT(*) FROM matriculas mc WHERE mc.idalumno = a.idalumno AND mc.estado <> 'anulada') AS num_matriculas,
         ${SQL_DEUDA} AS deuda, ${SQL_VENCE_DEUDA} AS vence_deuda,
         IFNULL(mg.fecha_fin, m.fecha_fin) AS cong_fin_membresia,
         COALESCE(mg.congelamiento_dias, pg.congelamiento_dias, m.congelamiento_dias, p.congelamiento_dias, 0) AS cong_total,
         COALESCE(mg.congelamiento_partes, pg.congelamiento_partes, m.congelamiento_partes, p.congelamiento_partes, 1) AS cong_partes,
         COALESCE(mg.congelamiento_min_dias, pg.congelamiento_min_dias, m.congelamiento_min_dias, p.congelamiento_min_dias, 0) AS cong_min,
         (SELECT IFNULL(SUM(cu.dias), 0) FROM congelamientos cu
           WHERE cu.idmatricula = IFNULL(mg.idmatricula, m.idmatricula) AND cu.estado <> 'anulado') AS cong_usados,
         (SELECT COUNT(*) FROM congelamientos cu
           WHERE cu.idmatricula = IFNULL(mg.idmatricula, m.idmatricula) AND cu.estado <> 'anulado') AS cong_partes_usadas,
         (SELECT CONCAT(cv.idcongelamiento, '|', cv.fecha_inicio, '|', cv.fecha_fin) FROM congelamientos cv
           WHERE cv.idalumno = a.idalumno AND cv.estado = 'vigente' AND cv.fecha_fin >= CURDATE()
           ORDER BY cv.fecha_inicio LIMIT 1) AS cong_vigente
    FROM alumnos a
    LEFT JOIN usuarios ua ON ua.idalumno = a.idalumno
    LEFT JOIN matriculas m ON m.idmatricula = (
         SELECT m2.idmatricula FROM matriculas m2
          WHERE m2.idalumno = a.idalumno AND m2.estado <> 'anulada'
          ORDER BY m2.fecha_fin DESC, m2.idmatricula DESC LIMIT 1)
    LEFT JOIN planes p ON p.idplan = m.idplan
    -- Membresía en curso (sobre ella se congela; puede ser distinta de la última si renovó por adelantado)
    LEFT JOIN matriculas mg ON mg.idmatricula = (
         SELECT m3.idmatricula FROM matriculas m3
          WHERE m3.idalumno = a.idalumno AND m3.estado <> 'anulada' AND m3.fecha_inicio <= CURDATE() AND m3.fecha_fin >= CURDATE()
          ORDER BY m3.fecha_inicio LIMIT 1)
    LEFT JOIN planes pg ON pg.idplan = mg.idplan
   WHERE a.activo = 1`;

// hoy() = fecha de hoy en Lima (en caché, ver congelamiento.js)

const diasEntre = (desde, hasta) => Math.round((new Date(hasta) - new Date(desde)) / 86400000);

/** Estado de una deuda según su fecha límite */
export function estadoDeuda(fecha) {
  if (!fecha) return "sin_fecha";
  const d = diasEntre(hoy(), fecha);
  if (d < 0) return "vencida";
  if (d <= 3) return "por_vencer";
  return "al_dia";
}

/** Valida la fecha límite para cancelar un saldo (obligatoria si queda deuda) */
function validarFechaLimite(fecha) {
  const f = String(fecha || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) throw new ErrorHttp(400, "Indica hasta qué fecha cancelará el saldo");
  if (f < hoy()) throw new ErrorHttp(400, "La fecha límite de pago no puede ser anterior a hoy");
  if (diasEntre(hoy(), f) > 180) throw new ErrorHttp(400, "La fecha límite de pago no puede pasar de 6 meses");
  return f;
}

function estado(fechaFin) {
  if (!fechaFin) return "expired";
  const dias = Math.ceil((new Date(fechaFin) - new Date(hoy())) / 86400000);
  if (dias < 0) return "expired";
  if (dias <= 7) return "expiring_soon";
  return "active";
}

/** Fila de la base -> alumno en el formato de la aplicación */
function aAlumno(f) {
  return {
    id: String(f.idalumno),
    dni: f.dni,
    fullName: [f.nombres, f.apellidos].filter(Boolean).join(" "),
    firstName: f.nombres,
    lastName: f.apellidos,
    email: f.correo || "",
    phone: f.telefono || "",
    gender: f.sexo,
    birthDate: f.fecha_nacimiento,
    address: f.direccion || "",
    emergencyContact: {
      name: f.contacto_emergencia || "",
      phone: f.telefono_emergencia || "",
      relationship: f.parentesco_emergencia || "",
    },
    medicalNotes: f.restricciones_medicas || "",
    objective: f.objetivo,
    planId: f.idplan ? String(f.idplan) : "",
    planName: f.plan || "Sin plan",
    membershipStartDate: f.fecha_inicio,
    membershipEndDate: f.fecha_fin,
    status:
      f.cong_vigente && String(f.cong_vigente).split("|")[1] <= hoy()
        ? "frozen"
        : f.estado_matricula === "congelada" ? "frozen" : estado(f.fecha_fin),
    assignedTrainerId: f.identrenador ? String(f.identrenador) : "",
    registrationDate: f.fecha_registro,
    notes: f.notas || "",
    photoUrl: f.foto || null,
    lastPaymentAmount: f.monto != null ? Number(f.monto) : 0,
    lastPaymentDate: f.fecha_pago,
    accessUser: f.usuario_acceso && f.usuario_activo ? f.usuario_acceso : null,
    debt: Number(f.deuda || 0),
    debtDueDate: Number(f.deuda || 0) > 0 ? f.vence_deuda || null : null,
    debtStatus: Number(f.deuda || 0) > 0 ? estadoDeuda(f.vence_deuda) : null,
    debtDaysLeft: Number(f.deuda || 0) > 0 && f.vence_deuda ? diasEntre(hoy(), f.vence_deuda) : null,
    planPrice: f.precio_total != null ? Number(f.precio_total) : null,
    enrollmentsCount: Number(f.num_matriculas || 0),
    freeze: resumenCongelamiento(f),
    code: f.codigo != null ? Number(f.codigo) : null,
    codeLabel: codigoAlumno(f.codigo, f.nombres, f.apellidos),
  };
}


/** Congelamiento del alumno para listas y portal (derecho + congelamiento actual o programado) */
function resumenCongelamiento(f) {
  const s = saldo(
    { congelamiento_dias: f.cong_total, congelamiento_partes: f.cong_partes, congelamiento_min_dias: f.cong_min, fecha_fin: f.cong_fin_membresia },
    Array.from({ length: Number(f.cong_partes_usadas || 0) }, (_, i) => ({
      dias: i === 0 ? Number(f.cong_usados || 0) : 0,
      estado: "vigente",
    })),
  );
  let actual = null;
  if (f.cong_vigente) {
    const [id, ini, fin] = String(f.cong_vigente).split("|");
    const est = estadoCongelamiento({ estado: "vigente", fecha_inicio: ini, fecha_fin: fin }, hoy());
    actual = {
      id, startDate: ini, endDate: fin, returnDate: sumarDias(fin, 1), status: est,
      daysLeft: est === "activo" ? diasCal(hoy(), fin) + 1 : diasCal(hoy(), ini),
    };
  }
  return {
    allowed: s.total > 0,
    totalDays: s.total, maxParts: s.partes, minDays: s.minimo, rules: s.texto,
    usedDays: s.usados, usedParts: s.partesUsadas, daysLeft: s.restante, partsLeft: s.partesRestantes,
    expiresOn: s.caducaEl, canFreeze: s.puede, reasonNot: s.motivoNo,
    current: actual,
  };
}

/** Separa "Nombre Completo" en nombres y apellidos (convención peruana) */
function separarNombre(completo) {
  const p = String(completo || "").trim().split(/\s+/).filter(Boolean);
  if (p.length <= 1) return [p[0] || "", ""];
  if (p.length === 2) return [p[0], p[1]];
  if (p.length === 3) return [p[0], `${p[1]} ${p[2]}`];
  return [p.slice(0, p.length - 2).join(" "), p.slice(-2).join(" ")];
}

const METODOS = ["efectivo", "tarjeta", "transferencia", "yape_plin"];

/** Datos obligatorios de la ficha (para reportes completos y sin vacíos) */
function validarFicha(d, parcial = false) {
  const tiene = (k) => !parcial || d[k] !== undefined;
  if (tiene("fullName") && String(d.fullName || "").trim().split(/\s+/).length < 2) {
    throw new ErrorHttp(400, "Escribe nombres y apellidos del alumno");
  }
  if (tiene("gender") && !["M", "F"].includes(d.gender)) throw new ErrorHttp(400, "Indica el sexo del alumno");
  if (tiene("birthDate")) {
    const f = String(d.birthDate || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || f > hoy() || f < "1920-01-01") {
      throw new ErrorHttp(400, "Ingresa una fecha de nacimiento válida");
    }
  }
  if (tiene("phone") && !/^\+?\d[\d\s-]{6,}$/.test(String(d.phone || "").trim())) {
    throw new ErrorHttp(400, "Ingresa un celular válido");
  }
}
const OBJETIVOS = ["hipertrofia", "perdida_peso", "fuerza", "resistencia", "tonificacion", "rehabilitacion"];
const vacio = (v) => (v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim());

/**
 * Crea (o restablece) la cuenta de acceso del alumno.
 * Usuario = DNI. Clave temporal = DNI (debe cambiarla en su primer ingreso).
 */
async function crearOCambiarCuenta(cx, idalumno, dni, creadoPor) {
  const hash = await bcrypt.hash(dni, 10);
  const ejecutar = cx ? (sql, p) => cx.execute(sql, p).then(([r]) => r) : consultar;
  const existentes = await ejecutar("SELECT idusuario FROM usuarios WHERE idalumno = ?", [idalumno]);
  if (existentes.length) {
    await ejecutar(
      `UPDATE usuarios SET usuario = ?, clave_hash = ?, activo = 1, debe_cambiar_clave = 1,
              intentos_fallidos = 0, bloqueado_hasta = NULL WHERE idalumno = ?`,
      [dni, hash, idalumno],
    );
    await ejecutar("UPDATE sesiones SET fecha_cierre = NOW() WHERE idusuario = ? AND fecha_cierre IS NULL", [existentes[0].idusuario]);
  } else {
    const ocupado = await ejecutar("SELECT idusuario FROM usuarios WHERE usuario = ?", [dni]);
    if (ocupado.length) throw new ErrorHttp(409, `El usuario ${dni} ya existe para otra persona`);
    await ejecutar(
      `INSERT INTO usuarios (usuario, clave_hash, idrol, idalumno, debe_cambiar_clave, creado_por)
       SELECT ?, ?, idrol, ?, 1, ? FROM roles WHERE codigo = 'student'`,
      [dni, hash, idalumno, creadoPor],
    );
  }
  return { usuario: dni, claveTemporal: dni };
}

async function obtener(id) {
  const filas = await consultar(`${SQL_ALUMNOS} AND a.idalumno = ?`, [id]);
  if (!filas.length) throw new ErrorHttp(404, "Alumno no encontrado");
  return aAlumno(filas[0]);
}

// GET /api/alumnos  (el alumno solo ve su propio registro)
router.get("/", async (req, res, next) => {
  try {
    if (req.usuario.rol === "student") {
      const [u] = await consultar("SELECT idalumno FROM usuarios WHERE idusuario = ?", [req.usuario.idusuario]);
      if (!u?.idalumno) return res.json([]);
      return res.json([await obtener(u.idalumno)]);
    }
    const filas = await consultar(`${SQL_ALUMNOS} ORDER BY a.idalumno DESC`);
    res.json(filas.map(aAlumno));
  } catch (e) {
    next(e);
  }
});

// POST /api/alumnos  -> registra alumno + primera matrícula (el pago entra solo a caja)
router.post("/", requierePermiso("members", "crear"), async (req, res, next) => {
  try {
    const d = req.body || {};
    const dni = String(d.dni || "").trim();
    if (!/^\d{8}$/.test(dni)) throw new ErrorHttp(400, "El DNI debe tener 8 dígitos");
    validarFicha(d);
    if (!d.planId) throw new ErrorHttp(400, "Selecciona un plan");
    const [plan] = await consultar("SELECT idplan, precio, congelamiento_dias, congelamiento_partes, congelamiento_min_dias FROM planes WHERE idplan = ? AND activo = 1", [d.planId]);
    if (!plan) throw new ErrorHttp(400, "El plan no existe");
    const precio = Math.max(0, Number(plan.precio) - Number(d.discount || 0));
    const pagado = d.amountPaid === undefined || d.amountPaid === "" ? precio : Number(d.amountPaid);
    if (!(pagado > 0) || pagado > precio + 0.001) {
      throw new ErrorHttp(400, `El pago de hoy debe ser mayor a 0 y como máximo S/ ${precio.toFixed(2)}`);
    }
    const limite = pagado < precio - 0.004 ? validarFechaLimite(d.debtDueDate) : null;
    const [nombres, apellidos] = separarNombre(d.fullName);
    const correo = vacio(d.email);

    await exigirCajaAbierta(req);
    const id = await transaccion(async (cx) => {
      const [r] = await cx.execute(
        `INSERT INTO alumnos (dni, nombres, apellidos, sexo, fecha_nacimiento, telefono, correo, direccion,
                              contacto_emergencia, telefono_emergencia, parentesco_emergencia,
                              restricciones_medicas, objetivo, identrenador, notas, fecha_registro)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE())`,
        [
          dni, nombres, apellidos,
          d.gender,
          vacio(d.birthDate), vacio(d.phone), correo, vacio(d.address),
          vacio(d.emergencyContact?.name), vacio(d.emergencyContact?.phone), vacio(d.emergencyContact?.relationship),
          vacio(d.medicalNotes),
          OBJETIVOS.includes(d.objective) ? d.objective : "tonificacion",
          vacio(d.assignedTrainerId), vacio(d.notes),
        ],
      );
      await cx.execute(
        `INSERT INTO matriculas (idalumno, idplan, identrenador, fecha_inicio, monto, precio_total, fecha_limite_pago, metodo_pago, idusuario_registro,
                                 congelamiento_dias, congelamiento_partes, congelamiento_min_dias)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          r.insertId, plan.idplan, vacio(d.assignedTrainerId),
          vacio(d.membershipStartDate) || hoy(),
          Math.round(pagado * 100) / 100,
          Math.round(precio * 100) / 100,
          limite,
          METODOS.includes(d.paymentMethod) ? d.paymentMethod : "efectivo",
          req.usuario.idusuario,
          plan.congelamiento_dias, plan.congelamiento_partes, plan.congelamiento_min_dias,
        ],
      );
      await crearOCambiarCuenta(cx, r.insertId, dni, req.usuario.idusuario);
      return r.insertId;
    });
    res.status(201).json({ ...(await obtener(id)), cuentaNueva: { usuario: dni, claveTemporal: dni } });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY" && e.message.includes("codigo")) {
      return next(new ErrorHttp(409, "Se registraron dos alumnos al mismo tiempo. Vuelve a guardar."));
    }
    if (e.code === "ER_DUP_ENTRY") {
      return next(new ErrorHttp(409, e.message.includes("correo") ? "Ya existe un alumno con ese correo" : "Ya existe un alumno con ese DNI"));
    }
    next(e);
  }
});

// PUT /api/alumnos/:id  -> datos personales y entrenador asignado
router.put("/:id", requierePermiso("members", "editar"), async (req, res, next) => {
  try {
    const d = req.body || {};
    const campos = [];
    const valores = [];
    const poner = (col, val) => { campos.push(`${col} = ?`); valores.push(val); };

    if (d.fullName !== undefined) { const [n, a] = separarNombre(d.fullName); poner("nombres", n); poner("apellidos", a); }
    if (d.dni !== undefined) poner("dni", String(d.dni).trim());
    if (d.email !== undefined) poner("correo", vacio(d.email));
    validarFicha(d, true);
    if (d.phone !== undefined) poner("telefono", vacio(d.phone));
    if (d.address !== undefined) poner("direccion", vacio(d.address));
    if (d.gender !== undefined) poner("sexo", d.gender);
    if (d.birthDate !== undefined) poner("fecha_nacimiento", vacio(d.birthDate));
    if (d.medicalNotes !== undefined) poner("restricciones_medicas", vacio(d.medicalNotes));
    if (d.objective !== undefined && OBJETIVOS.includes(d.objective)) poner("objetivo", d.objective);
    if (d.notes !== undefined) poner("notas", vacio(d.notes));
    if (d.assignedTrainerId !== undefined) poner("identrenador", vacio(d.assignedTrainerId));
    if (d.emergencyContact) {
      poner("contacto_emergencia", vacio(d.emergencyContact.name));
      poner("telefono_emergencia", vacio(d.emergencyContact.phone));
      poner("parentesco_emergencia", vacio(d.emergencyContact.relationship));
    }
    if (campos.length) {
      await consultar(`UPDATE alumnos SET ${campos.join(", ")} WHERE idalumno = ? AND activo = 1`, [...valores, req.params.id]);
    }
    res.json(await obtener(req.params.id));
  } catch (e) {
    next(e);
  }
});

// POST /api/alumnos/:id/cuenta  -> crea o restablece el acceso del alumno (usuario y clave = DNI)
router.post("/:id/cuenta", requierePermiso("members", "editar"), async (req, res, next) => {
  try {
    const [a] = await consultar("SELECT idalumno, dni FROM alumnos WHERE idalumno = ? AND activo = 1", [req.params.id]);
    if (!a) throw new ErrorHttp(404, "Alumno no encontrado");
    const cuenta = await crearOCambiarCuenta(null, a.idalumno, a.dni, req.usuario.idusuario);
    res.json({ ...(await obtener(a.idalumno)), cuentaNueva: cuenta });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/alumnos/:id  -> baja del alumno (no se borra su historial)
router.delete("/:id", requierePermiso("members", "eliminar"), async (req, res, next) => {
  try {
    await consultar("UPDATE alumnos SET activo = 0 WHERE idalumno = ?", [req.params.id]);
    await consultar("UPDATE usuarios SET activo = 0 WHERE idalumno = ?", [req.params.id]);
    res.json({ mensaje: "Alumno dado de baja" });
  } catch (e) {
    next(e);
  }
});

// POST /api/alumnos/:id/renovar  { planId, paymentMethod, discount }
router.post("/:id/renovar", requierePermiso(["members", "alerts"], "crear"), async (req, res, next) => {
  try {
    const { planId, paymentMethod, discount = 0, amountPaid, debtDueDate } = req.body || {};
    const [plan] = await consultar("SELECT idplan, precio, congelamiento_dias, congelamiento_partes, congelamiento_min_dias FROM planes WHERE idplan = ? AND activo = 1", [planId]);
    if (!plan) throw new ErrorHttp(400, "El plan no existe");
    const actual = await obtener(req.params.id);

    // Si la membresía sigue vigente, la nueva empieza al día siguiente del fin
    let inicio = hoy();
    if (actual.membershipEndDate && actual.membershipEndDate >= inicio) {
      const d = new Date(actual.membershipEndDate);
      d.setUTCDate(d.getUTCDate() + 1);
      inicio = d.toISOString().slice(0, 10);
    }
    const precio = Math.max(0, Number(plan.precio) - Number(discount || 0));
    const monto = amountPaid === undefined || amountPaid === "" ? precio : Number(amountPaid);
    if (!(monto > 0) || monto > precio + 0.001) {
      throw new ErrorHttp(400, `El pago debe ser mayor a 0 y como máximo S/ ${precio.toFixed(2)}`);
    }
    const limite = monto < precio - 0.004 ? validarFechaLimite(debtDueDate) : null;
    await exigirCajaAbierta(req);
    await consultar(
      `INSERT INTO matriculas (idalumno, idplan, identrenador, fecha_inicio, monto, precio_total, fecha_limite_pago, es_renovacion, metodo_pago, idusuario_registro,
                              congelamiento_dias, congelamiento_partes, congelamiento_min_dias)
       VALUES (?,?,?,?,?,?,?,1,?,?,?,?,?)`,
      [req.params.id, plan.idplan, vacio(actual.assignedTrainerId), inicio, Math.round(monto * 100) / 100, Math.round(precio * 100) / 100, limite,
       METODOS.includes(paymentMethod) ? paymentMethod : "efectivo", req.usuario.idusuario,
       plan.congelamiento_dias, plan.congelamiento_partes, plan.congelamiento_min_dias],
    );
    res.json(await obtener(req.params.id));
  } catch (e) {
    next(e);
  }
});

// GET /api/alumnos/:id/ficha  -> ficha deportiva para el personal
// Resumen de lo que el entrenador necesita al atender al alumno: rutina,
// lesiones / restricciones de fisioterapia, dieta y asistencia reciente.
// Solo un resumen (no la historia clínica completa).
router.get("/:id/ficha", async (req, res, next) => {
  try {
    if (req.usuario.rol === "student") throw new ErrorHttp(403, "Solo para el personal del gimnasio");
    const permitido = await tienePermiso(req.usuario.idusuario, ["members", "routines", "physiotherapy", "nutrition"], "ver");
    if (!permitido) throw new ErrorHttp(403, "No tienes permiso para ver este alumno");
    const id = String(req.params.id);
    const [al] = await consultar("SELECT idalumno, restricciones_medicas, objetivo FROM alumnos WHERE idalumno = ?", [id]);
    if (!al) throw new ErrorHttp(404, "Alumno no encontrado");
    const filas = await consultar(
      `SELECT modulo, datos FROM registros_app
        WHERE idalumno = ? AND modulo IN ('fisioterapia', 'planes_nutricion', 'asignaciones_rutina')`,
      [id],
    );
    const leer = (f) => (typeof f.datos === "string" ? JSON.parse(f.datos) : f.datos);
    const fis = filas.filter((f) => f.modulo === "fisioterapia").map(leer).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const dietas = filas.filter((f) => f.modulo === "planes_nutricion").map(leer).filter((d) => d.active !== false);
    const asign = filas.filter((f) => f.modulo === "asignaciones_rutina").map(leer)[0];
    let rutina = null;
    if (asign?.routineId) {
      const [r] = await consultar("SELECT datos FROM registros_app WHERE modulo = 'rutinas' AND idregistro = ?", [String(asign.routineId)]);
      if (r) rutina = leer(r);
    }
    if (!rutina) {
      const [r] = await consultar("SELECT datos FROM registros_app WHERE modulo = 'rutinas' AND idalumno = ? ORDER BY fecha_actualizacion DESC LIMIT 1", [id]);
      if (r) rutina = leer(r);
    }
    const [asis] = await consultar(
      `SELECT COUNT(DISTINCT fecha) AS dias30, MAX(fecha) AS ultima,
              (SELECT COUNT(DISTINCT fecha) FROM asistencias_alumno WHERE idalumno = ? AND tipo = 'entrada') AS total
         FROM asistencias_alumno WHERE idalumno = ? AND tipo = 'entrada' AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [id, id],
    );
    const ultimaFis = fis[0];
    const resumenFis = ultimaFis
      ? {
          fecha: ultimaFis.date,
          fisioterapeuta: ultimaFis.physiotherapistName,
          sesiones: fis.length,
          motivo: ultimaFis.consultationReason,
          zonas: ultimaFis.affectedZones || (ultimaFis.affectedZone ? [ultimaFis.affectedZone] : []),
          dolorEVA: ultimaFis.painLevelEVA,
          puntosGatillo: (ultimaFis.functionalEvaluation?.palpationPainZone?.triggerPoints || []).map((x) => String(x || "").trim()).filter(Boolean),
          zonaSensible: ultimaFis.functionalEvaluation?.palpationPainZone?.tenderZoneNotes || "",
          postura: (ultimaFis.physicalEvaluation?.posturalVisualEvaluation?.postureFindings || []).filter(Boolean),
          tonoMuscular: ultimaFis.functionalEvaluation?.palpationPainZone?.muscleTone || "",
          antecedentes: ultimaFis.physicalEvaluation?.medicalAntecedents || [],
          restriccionesSala: ultimaFis.gymWorkoutRestrictions || "",
          indicaciones: (ultimaFis.studentIndications || []).map((i) => ({
            nombre: i.name, categoria: i.category, series: i.sets, reps: i.reps, segundos: i.seconds, detalle: i.detail,
          })),
          enCasa: ultimaFis.homeIndications || "",
          evolucion: ultimaFis.evolutionNotes || "",
        }
      : null;
    const d = dietas.sort((a, b) => String(b.createdDate || "").localeCompare(String(a.createdDate || "")))[0];
    const resumenDieta = d
      ? {
          titulo: d.title, objetivo: d.objective, nutricionista: d.trainerName, desde: d.createdDate,
          kcal: d.dailyCaloriesTarget, proteinas: d.proteinsTargetGrams, carbohidratos: d.carbsTargetGrams, grasas: d.fatsTargetGrams, agua: d.waterLitersTarget,
          comidas: (d.plates?.length ? d.plates : d.meals || []).map((m) => ({ nombre: m.name, hora: m.time, notas: m.notes || "" })),
          suplementos: d.supplements || [], recomendaciones: d.recommendations || "",
        }
      : null;
    res.json({
      restriccionesFicha: al.restricciones_medicas || "",
      fisioterapia: resumenFis,
      dieta: resumenDieta,
      rutina,
      asistencia: { ultimos30: Number(asis?.dias30 || 0), ultima: asis?.ultima || null, total: Number(asis?.total || 0) },
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/alumnos/:id/pagos  -> matrículas y pagos (estado de cuenta)
router.get("/:id/pagos", requierePermiso(["members", "finance"], "ver"), async (req, res, next) => {
  try {
    const mats = await consultar(
      `SELECT m.idmatricula, m.fecha_inicio, m.fecha_fin, m.monto, IFNULL(m.precio_total, m.monto) AS precio_total,
              m.metodo_pago, m.estado, m.fecha_registro, m.es_renovacion, p.nombre AS plan,
              IFNULL(m.fecha_limite_pago, m.fecha_fin) AS fecha_limite, m.fecha_limite_pago
         FROM matriculas m JOIN planes p ON p.idplan = m.idplan
        WHERE m.idalumno = ? ORDER BY m.fecha_registro DESC`,
      [req.params.id],
    );
    const pagos = await consultar(
      `SELECT pg.*, u.usuario FROM pagos_matricula pg JOIN matriculas m ON m.idmatricula = pg.idmatricula
         LEFT JOIN usuarios u ON u.idusuario = pg.idusuario
        WHERE m.idalumno = ? ORDER BY pg.fecha DESC`,
      [req.params.id],
    );
    res.json({
      matriculas: mats.map((m) => {
        const extra = pagos.filter((p) => p.idmatricula === m.idmatricula).reduce((a, p) => a + Number(p.monto), 0);
        const saldo = m.estado === "anulada" ? 0 : Math.max(0, Number(m.precio_total) - Number(m.monto) - extra);
        return {
          id: String(m.idmatricula),
          plan: m.plan,
          start: m.fecha_inicio,
          end: m.fecha_fin,
          price: Number(m.precio_total),
          paid: Number(m.monto) + extra,
          balance: saldo,
          dueDate: saldo > 0.004 ? m.fecha_limite : null,
          dueDateSet: !!m.fecha_limite_pago,
          dueStatus: saldo > 0.004 ? estadoDeuda(m.fecha_limite) : null,
          status: m.estado,
          renewal: !!m.es_renovacion,
          date: m.fecha_registro,
        };
      }),
      pagos: pagos.map((p) => ({
        id: String(p.idpago),
        enrollmentId: String(p.idmatricula),
        amount: Number(p.monto),
        method: p.metodo_pago,
        notes: p.notas || "",
        user: p.usuario || "",
        date: p.fecha,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/alumnos/:id/pagos { monto, metodoPago, notas }  -> cobra saldo pendiente
router.post("/:id/pagos", requierePermiso(["members", "finance"], "crear"), async (req, res, next) => {
  try {
    const monto = Math.round(Number(req.body?.monto) * 100) / 100;
    if (!(monto > 0)) throw new ErrorHttp(400, "Ingresa el monto a cobrar");
    const metodo = METODOS.includes(req.body?.metodoPago) ? req.body.metodoPago : "efectivo";
    const nuevaFecha = req.body?.fechaLimite ? validarFechaLimite(req.body.fechaLimite) : null;
    await exigirCajaAbierta(req);
    await transaccion(async (cx) => {
      // Saldos por matrícula, de la más antigua a la más reciente
      const [mats] = await cx.execute(
        `SELECT m.idmatricula, p.nombre AS plan, CONCAT(a.nombres, ' ', a.apellidos) AS alumno,
                IFNULL(m.precio_total, m.monto) - m.monto
                - (SELECT IFNULL(SUM(pg.monto), 0) FROM pagos_matricula pg WHERE pg.idmatricula = m.idmatricula) AS saldo
           FROM matriculas m JOIN planes p ON p.idplan = m.idplan JOIN alumnos a ON a.idalumno = m.idalumno
          WHERE m.idalumno = ? AND m.estado <> 'anulada'
          ORDER BY m.fecha_registro FOR UPDATE`,
        [req.params.id],
      );
      const conSaldo = mats.filter((m) => Number(m.saldo) > 0.004);
      const total = conSaldo.reduce((a, m) => a + Number(m.saldo), 0);
      if (!conSaldo.length) throw new ErrorHttp(400, "Este alumno no tiene deuda");
      if (monto > total + 0.001) throw new ErrorHttp(400, `La deuda es S/ ${total.toFixed(2)}; no puedes cobrar más`);
      let resto = monto;
      for (const m of conSaldo) {
        if (resto <= 0) break;
        const parte = Math.min(resto, Math.round(Number(m.saldo) * 100) / 100);
        await cx.execute(
          "INSERT INTO pagos_matricula (idmatricula, monto, metodo_pago, idusuario, notas) VALUES (?,?,?,?,?)",
          [m.idmatricula, parte, metodo, req.usuario.idusuario, vacio(req.body?.notas)],
        );
        await cx.execute(
          `INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, idreferencia, metodo_pago, idalumno,
                                         nombre_relacionado, idusuario_registro)
           VALUES ('ingreso', 'matricula', ?, ?, ?, ?, ?, ?, ?)`,
          [parte, `Pago de saldo - ${m.plan} - ${m.alumno}`.slice(0, 255), m.idmatricula, metodo, req.params.id, m.alumno, req.usuario.idusuario],
        );
        resto = Math.round((resto - parte) * 100) / 100;
      }
      // Si aún queda saldo, se puede reprogramar la fecha límite del resto (avisa al administrador)
      if (nuevaFecha && monto < total - 0.004) {
        const ids = conSaldo.map((m) => m.idmatricula);
        const [[ant]] = await cx.query(
          "SELECT MIN(IFNULL(fecha_limite_pago, fecha_fin)) AS f FROM matriculas WHERE idmatricula IN (?)", [ids],
        );
        await cx.query("UPDATE matriculas SET fecha_limite_pago = ? WHERE idmatricula IN (?)", [nuevaFecha, ids]);
        await alertaCambioFechaPago(cx, {
          idalumno: req.params.id, anterior: ant?.f, nueva: nuevaFecha, deuda: total - monto, usuario: req.usuario, origen: "abono",
        });
      }
    });
    res.json(await obtener(req.params.id));
  } catch (e) {
    next(e);
  }
});

// PUT /api/alumnos/:id/fecha-limite { fecha }  -> reprograma hasta cuándo cancela el saldo
router.put("/:id/fecha-limite", requierePermiso(["members", "finance"], "editar"), async (req, res, next) => {
  try {
    const fecha = validarFechaLimite(req.body?.fecha);
    await transaccion(async (cx) => {
      const [[antes]] = await cx.execute(
        `SELECT MIN(IFNULL(m.fecha_limite_pago, m.fecha_fin)) AS anterior,
                SUM(GREATEST(${saldoMatricula("m")}, 0)) AS deuda, COUNT(*) AS n
           FROM matriculas m
          WHERE m.idalumno = ? AND m.estado <> 'anulada' AND ${saldoMatricula("m")} > 0.004`,
        [req.params.id],
      );
      if (!Number(antes?.n)) throw new ErrorHttp(400, "Este alumno no tiene deuda");
      await cx.execute(
        `UPDATE matriculas m SET m.fecha_limite_pago = ?
          WHERE m.idalumno = ? AND m.estado <> 'anulada' AND ${saldoMatricula("m")} > 0.004`,
        [fecha, req.params.id],
      );
      // Queda registrado y, si no lo hizo el administrador, le llega como alerta
      await alertaCambioFechaPago(cx, {
        idalumno: req.params.id, anterior: antes.anterior, nueva: fecha, deuda: antes.deuda, usuario: req.usuario, origen: "reprogramacion",
      });
    });
    res.json(await obtener(req.params.id));
  } catch (e) {
    next(e);
  }
});

// =====================================================================
// CALENDARIO DE ASISTENCIAS
// =====================================================================
// GET /api/alumnos/:id/asistencias?desde=AAAA-MM-DD&hasta=AAAA-MM-DD
//  -> días que vino (primera entrada del día), membresías y congelamientos del rango
router.get("/:id/asistencias", async (req, res, next) => {
  try {
    if (!(await puedeVerAlumno(req, req.params.id))) throw new ErrorHttp(403, "No tienes permiso para ver este alumno");
    const ok = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : null);
    const h = hoy();
    const hasta = ok(req.query.hasta) || h;
    const desde = ok(req.query.desde) || `${hasta.slice(0, 7)}-01`;
    if (desde > hasta || diasCal(desde, hasta) > 400) throw new ErrorHttp(400, "Rango de fechas inválido (máximo 400 días)");
    const [dias, mats, congs, [al]] = await Promise.all([
      consultar(
        `SELECT fecha, MIN(hora) AS hora, COUNT(*) AS marcas,
                SUM(resultado = 'autorizado') AS autorizadas, SUM(resultado = 'advertencia') AS advertencias,
                SUM(resultado = 'denegado') AS denegadas
           FROM asistencias_alumno
          WHERE idalumno = ? AND tipo = 'entrada' AND fecha BETWEEN ? AND ?
          GROUP BY fecha ORDER BY fecha`,
        [req.params.id, desde, hasta],
      ),
      consultar(
        `SELECT m.fecha_inicio, m.fecha_fin, p.nombre AS plan FROM matriculas m JOIN planes p ON p.idplan = m.idplan
          WHERE m.idalumno = ? AND m.estado <> 'anulada' AND m.fecha_inicio <= ? AND m.fecha_fin >= ? ORDER BY m.fecha_inicio`,
        [req.params.id, hasta, desde],
      ),
      consultar(
        `SELECT fecha_inicio, IF(estado = 'terminado_antes', DATE_SUB(DATE_ADD(fecha_inicio, INTERVAL dias_usados DAY), INTERVAL 1 DAY), fecha_fin) AS fecha_fin
           FROM congelamientos WHERE idalumno = ? AND estado <> 'anulado' AND fecha_inicio <= ? AND fecha_fin >= ?`,
        [req.params.id, hasta, desde],
      ),
      consultar("SELECT codigo, nombres, apellidos, fecha_registro FROM alumnos WHERE idalumno = ?", [req.params.id]),
    ]);
    if (!al) throw new ErrorHttp(404, "Alumno no encontrado");
    res.json({
      desde,
      hasta,
      hoy: h,
      alumno: { id: String(req.params.id), name: `${al.nombres} ${al.apellidos}`.trim(), codeLabel: codigoAlumno(al.codigo, al.nombres, al.apellidos), registeredAt: fISO(al.fecha_registro) },
      days: dias.map((d) => ({
        date: fISO(d.fecha),
        time: String(d.hora || "").slice(0, 5),
        marks: Number(d.marcas),
        status: Number(d.autorizadas) > 0 ? "ok" : Number(d.advertencias) > 0 ? "warning" : "denied",
      })),
      memberships: mats.map((m) => ({ start: fISO(m.fecha_inicio), end: fISO(m.fecha_fin), plan: m.plan })),
      freezes: congs.map((c) => ({ start: fISO(c.fecha_inicio), end: fISO(c.fecha_fin) })),
      metaSemanal: await metaSemanalAlumno(req.params.id),
    });
  } catch (e) {
    next(e);
  }
});

/** Cuántas veces por semana debería venir: los días de su rutina asignada (o 3 si no tiene) */
async function metaSemanalAlumno(idalumno) {
  const leer = (f) => (typeof f.datos === "string" ? JSON.parse(f.datos) : f.datos);
  let rutina = null;
  try {
    const [asig] = await consultar("SELECT datos FROM registros_app WHERE modulo = 'asignaciones_rutina' AND idalumno = ? ORDER BY fecha_actualizacion DESC LIMIT 1", [idalumno]);
    const rid = asig ? leer(asig)?.routineId : null;
    if (rid) [rutina] = await consultar("SELECT datos FROM registros_app WHERE modulo = 'rutinas' AND idregistro = ?", [String(rid)]);
    if (!rutina) [rutina] = await consultar("SELECT datos FROM registros_app WHERE modulo = 'rutinas' AND idalumno = ? ORDER BY fecha_actualizacion DESC LIMIT 1", [idalumno]);
  } catch {
    rutina = null;
  }
  const r = rutina ? leer(rutina) : null;
  const n = Math.min(7, (r?.days || []).length);
  return n ? { dias: n, fuente: "rutina", rutina: r.name || r.title || "Rutina" } : { dias: 3, fuente: "general", rutina: null };
}

// =====================================================================
// SEGUIMIENTO DE ASISTENCIA (por qué no viene) - script 21
// =====================================================================
const MOTIVOS_AUSENCIA = ["salud", "lesion", "viaje", "trabajo", "estudios", "economico", "motivacion", "horario", "otro"];
const MEDIOS = ["llamada", "whatsapp", "presencial", "ninguno"];
const aNota = (n) => ({
  id: String(n.idseguimiento),
  date: fISO(n.fecha),
  until: n.fecha_hasta ? fISO(n.fecha_hasta) : null,
  reason: n.motivo,
  detail: n.detalle || "",
  contacted: Boolean(n.contactado),
  channel: n.medio,
  registeredBy: n.registrado_por || "",
  registeredById: n.idusuario_registro ? String(n.idusuario_registro) : null,
  createdAt: n.fecha_registro,
});

router.get("/:id/seguimiento-asistencia", async (req, res, next) => {
  try {
    if (req.usuario.rol === "student") throw new ErrorHttp(403, "Solo para el personal del gimnasio");
    if (!(await puedeVerAlumno(req, req.params.id)) && !(await tienePermiso(req.usuario.idusuario, "routines", "ver")))
      throw new ErrorHttp(403, "No tienes permiso para ver este alumno");
    const filas = await consultar(
      `SELECT s.*, COALESCE(NULLIF(TRIM(CONCAT(COALESCE(e.nombres,''),' ',COALESCE(e.apellidos,''))),''), u.usuario) AS registrado_por
         FROM seguimiento_asistencia s
         LEFT JOIN usuarios u ON u.idusuario = s.idusuario_registro
         LEFT JOIN empleados e ON e.idempleado = u.idempleado
        WHERE s.idalumno = ? ORDER BY s.fecha DESC, s.idseguimiento DESC LIMIT 200`,
      [req.params.id],
    );
    res.json(filas.map(aNota));
  } catch (e) {
    if (e?.code === "ER_NO_SUCH_TABLE") return res.json([]);
    next(e);
  }
});

router.post("/:id/seguimiento-asistencia", async (req, res, next) => {
  try {
    if (req.usuario.rol === "student") throw new ErrorHttp(403, "Solo para el personal del gimnasio");
    if (!(await puedeVerAlumno(req, req.params.id)) && !(await tienePermiso(req.usuario.idusuario, "routines", "ver")))
      throw new ErrorHttp(403, "No tienes permiso para este alumno");
    const b = req.body || {};
    const f = /^\d{4}-\d{2}-\d{2}$/.test(b.date || "") ? b.date : hoy();
    const hasta = /^\d{4}-\d{2}-\d{2}$/.test(b.until || "") && b.until >= f ? b.until : null;
    const motivo = MOTIVOS_AUSENCIA.includes(b.reason) ? b.reason : "otro";
    const medio = MEDIOS.includes(b.channel) ? b.channel : "ninguno";
    const detalle = String(b.detail || "").trim().slice(0, 300) || null;
    const [al] = await consultar("SELECT idalumno FROM alumnos WHERE idalumno = ?", [req.params.id]);
    if (!al) throw new ErrorHttp(404, "Alumno no encontrado");
    const r = await consultar(
      `INSERT INTO seguimiento_asistencia (idalumno, fecha, fecha_hasta, motivo, detalle, contactado, medio, idusuario_registro)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.params.id, f, hasta, motivo, detalle, medio !== "ninguno" || b.contacted ? 1 : 0, medio, req.usuario.idusuario],
    );
    const [n] = await consultar("SELECT s.*, NULL AS registrado_por FROM seguimiento_asistencia s WHERE idseguimiento = ?", [r.insertId]);
    res.status(201).json(aNota(n));
  } catch (e) {
    if (e?.code === "ER_NO_SUCH_TABLE") return next(new ErrorHttp(400, "Falta ejecutar el script 21_seguimiento_asistencia.sql"));
    next(e);
  }
});

router.delete("/seguimiento-asistencia/:idnota(\\d+)", async (req, res, next) => {
  try {
    const [n] = await consultar("SELECT idusuario_registro FROM seguimiento_asistencia WHERE idseguimiento = ?", [req.params.idnota]);
    if (!n) throw new ErrorHttp(404, "Nota no encontrada");
    const propio = String(n.idusuario_registro) === String(req.usuario.idusuario);
    if (!propio && !(await tienePermiso(req.usuario.idusuario, "users", "editar"))) throw new ErrorHttp(403, "Solo quien la registró o administración puede borrarla");
    await consultar("DELETE FROM seguimiento_asistencia WHERE idseguimiento = ?", [req.params.idnota]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// =====================================================================
// CONGELAMIENTO
// =====================================================================
const esAdmin = (req) => tienePermiso(req.usuario.idusuario, "users", "editar");

/** Matrícula con las reglas de congelamiento resueltas (las de la venta, o las del plan si es antigua) */
const SQL_MATRICULA_CONG = `
  SELECT m.idmatricula, m.idalumno, m.idplan, m.fecha_inicio, m.fecha_fin, m.estado, p.nombre AS plan,
         COALESCE(m.congelamiento_dias, p.congelamiento_dias, 0) AS congelamiento_dias,
         COALESCE(m.congelamiento_partes, p.congelamiento_partes, 1) AS congelamiento_partes,
         COALESCE(m.congelamiento_min_dias, p.congelamiento_min_dias, 0) AS congelamiento_min_dias
    FROM matriculas m JOIN planes p ON p.idplan = m.idplan`;

const fISO = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

/** El alumno solo puede consultar lo suyo; el personal necesita ver Alumnos */
export async function puedeVerAlumno(req, idalumno) {
  if (req.usuario.rol === "student") {
    const [u] = await consultar("SELECT idalumno FROM usuarios WHERE idusuario = ?", [req.usuario.idusuario]);
    return String(u?.idalumno) === String(idalumno);
  }
  return tienePermiso(req.usuario.idusuario, ["members", "attendances", "reports"], "ver");
}

// GET /api/alumnos/:id/congelamientos -> derecho por matrícula + historial
router.get("/:id/congelamientos", async (req, res, next) => {
  try {
    if (!(await puedeVerAlumno(req, req.params.id))) throw new ErrorHttp(403, "No tienes permiso para ver este alumno");
    const mats = await consultar(
      `${SQL_MATRICULA_CONG} WHERE m.idalumno = ? AND m.estado <> 'anulada' ORDER BY m.fecha_fin DESC, m.idmatricula DESC`,
      [req.params.id],
    );
    const lista = await consultar(`${SQL_CONGELAMIENTOS} WHERE c.idalumno = ? ORDER BY c.fecha_inicio DESC, c.idcongelamiento DESC`, [req.params.id]);
    const h = hoy();
    // Matrícula sobre la que se congelaría hoy: la vigente; si no hay, la próxima
    const vigente = mats.find((m) => fISO(m.fecha_inicio) <= h && fISO(m.fecha_fin) >= h)
      || [...mats].reverse().find((m) => fISO(m.fecha_inicio) > h) || mats[0];
    res.json({
      enrollments: mats.map((m) => {
        const s = saldo(m, lista.filter((c) => String(c.idmatricula) === String(m.idmatricula)), h);
        return {
          id: String(m.idmatricula), plan: m.plan, startDate: fISO(m.fecha_inicio), endDate: fISO(m.fecha_fin),
          current: vigente && m.idmatricula === vigente.idmatricula, ...s,
        };
      }),
      history: lista.map((c) => aCongelamiento(c, h)),
      isAdmin: req.usuario.rol === "student" ? false : await esAdmin(req),
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/alumnos/:id/congelamientos { startDate, days, reason }
router.post("/:id/congelamientos", requierePermiso("members", "editar"), async (req, res, next) => {
  try {
    const inicio = String(req.body?.startDate || "");
    const dias = Number(req.body?.days);
    const motivo = String(req.body?.reason || "").trim();
    const h = hoy();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) throw new ErrorHttp(400, "Indica desde qué fecha se congela");
    if (inicio < h) throw new ErrorHttp(400, "El congelamiento no puede empezar en una fecha pasada");
    if (diasCal(h, inicio) > 60) throw new ErrorHttp(400, "Solo se puede programar con hasta 60 días de anticipación");
    if (motivo.length < 5) throw new ErrorHttp(400, "Escribe el motivo del congelamiento (viaje, lesión, trabajo...)");
    const fin = sumarDias(inicio, dias - 1);

    const id = await transaccion(async (cx) => {
      // Bloquea las matrículas del alumno para evitar dos congelamientos a la vez
      const [mats] = await cx.query(
        `${SQL_MATRICULA_CONG} WHERE m.idalumno = ? AND m.estado <> 'anulada' AND m.fecha_inicio <= ? AND m.fecha_fin >= ?
          ORDER BY m.fecha_inicio LIMIT 1 FOR UPDATE`,
        [req.params.id, inicio, inicio],
      );
      const m = mats[0];
      if (!m) throw new ErrorHttp(400, "La fecha de inicio debe estar dentro de una membresía vigente");
      const [previos] = await cx.query("SELECT * FROM congelamientos WHERE idmatricula = ? FOR UPDATE", [m.idmatricula]);
      const s = saldo(m, previos, h);
      validarDias(s, dias);
      const [cruce] = await cx.query(
        `SELECT fecha_inicio, fecha_fin FROM congelamientos
          WHERE idalumno = ? AND estado = 'vigente' AND fecha_inicio <= ? AND fecha_fin >= ? LIMIT 1`,
        [req.params.id, fin, inicio],
      );
      if (cruce.length) {
        throw new ErrorHttp(409, `Ya tiene un congelamiento del ${fISO(cruce[0].fecha_inicio)} al ${fISO(cruce[0].fecha_fin)}`);
      }
      const finAntes = fISO(m.fecha_fin);
      const finDespues = sumarDias(finAntes, dias);
      await moverMembresia(cx, m, dias);
      const [r] = await cx.query(
        `INSERT INTO congelamientos (idmatricula, idalumno, fecha_inicio, fecha_fin, dias, motivo, fin_membresia_antes, fin_membresia_despues, idusuario_registro)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [m.idmatricula, m.idalumno, inicio, fin, dias, motivo.slice(0, 200), finAntes, finDespues, req.usuario.idusuario],
      );
      await cx.query(
        "INSERT INTO auditoria (idusuario, tabla, accion, idregistro, detalle) VALUES (?, 'congelamientos', 'insertar', ?, ?)",
        [req.usuario.idusuario, r.insertId, `Congela ${dias} días (${inicio} a ${fin}). Vence ${finAntes} -> ${finDespues}`],
      );
      return r.insertId;
    });
    const [c] = await consultar(`${SQL_CONGELAMIENTOS} WHERE c.idcongelamiento = ?`, [id]);
    res.status(201).json({ freeze: aCongelamiento(c), member: await obtener(req.params.id) });
  } catch (e) {
    next(e);
  }
});

async function cerrarCongelamiento(req, accion) {
  const nota = String(req.body?.reason || "").trim();
  if (nota.length < 3) throw new ErrorHttp(400, accion === "anular" ? "Escribe por qué se anula" : "Escribe una observación");
  const h = hoy();
  const admin = await esAdmin(req);
  await transaccion(async (cx) => {
    const [filas] = await cx.query(
      "SELECT * FROM congelamientos WHERE idcongelamiento = ? AND idalumno = ? FOR UPDATE",
      [req.params.cid, req.params.id],
    );
    const c = filas[0];
    if (!c) throw new ErrorHttp(404, "Congelamiento no encontrado");
    const est = estadoCongelamiento(c, h);
    const [mats] = await cx.query(`${SQL_MATRICULA_CONG} WHERE m.idmatricula = ? FOR UPDATE`, [c.idmatricula]);
    const m = mats[0];
    let mover = 0;
    let cambios;
    if (accion === "terminar") {
      if (est !== "activo") throw new ErrorHttp(400, "Solo se puede terminar antes un congelamiento que está en curso");
      const usados = diasCal(c.fecha_inicio, h); // días congelados antes de hoy
      if (usados < 1) throw new ErrorHttp(400, "Empezó hoy: si no se usó, anúlalo en lugar de terminarlo");
      mover = -(Number(c.dias) - usados);
      cambios = { estado: "terminado_antes", dias_usados: usados, fecha_fin: sumarDias(h, -1) };
    } else {
      if (est === "anulado" || est === "terminado_antes") throw new ErrorHttp(400, "Este congelamiento ya está cerrado");
      if (est !== "programado" && !admin) {
        throw new ErrorHttp(403, "Solo el administrador puede anular un congelamiento que ya empezó");
      }
      mover = -Number(c.dias);
      cambios = { estado: "anulado" };
    }
    await moverMembresia(cx, m, mover);
    const sets = Object.keys(cambios).map((k) => `${k} = ?`).join(", ");
    await cx.query(
      `UPDATE congelamientos SET ${sets}, idusuario_cierre = ?, fecha_cierre = NOW(), observacion_cierre = ? WHERE idcongelamiento = ?`,
      [...Object.values(cambios), req.usuario.idusuario, nota.slice(0, 200), c.idcongelamiento],
    );
    await cx.query(
      "INSERT INTO auditoria (idusuario, tabla, accion, idregistro, detalle) VALUES (?, 'congelamientos', 'actualizar', ?, ?)",
      [req.usuario.idusuario, c.idcongelamiento, `${accion === "anular" ? "Anulado" : "Terminado antes"}; vencimiento movido ${mover} días. ${nota}`.slice(0, 250)],
    );
  });
  return obtener(req.params.id);
}

// POST /api/alumnos/:id/congelamientos/:cid/terminar { reason } -> el alumno vuelve antes (los días no usados se pierden)
router.post("/:id/congelamientos/:cid/terminar", requierePermiso("members", "editar"), async (req, res, next) => {
  try {
    res.json({ member: await cerrarCongelamiento(req, "terminar") });
  } catch (e) {
    next(e);
  }
});

// POST /api/alumnos/:id/congelamientos/:cid/anular { reason } -> se deshace y se devuelven los días
router.post("/:id/congelamientos/:cid/anular", requierePermiso("members", "editar"), async (req, res, next) => {
  try {
    res.json({ member: await cerrarCongelamiento(req, "anular") });
  } catch (e) {
    next(e);
  }
});

export default router;
