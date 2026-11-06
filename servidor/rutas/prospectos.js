// =====================================================================
// CRM de prospectos: personas que preguntan por el gimnasio y todavía no
// se matriculan. Recepción registra sus datos, el plan que le interesa y
// cuándo contactarlo; el sistema avisa 30 minutos antes.
// =====================================================================
import { Router } from "express";
import crypto from "crypto";
import { consultar, transaccion } from "../db.js";
import { ErrorHttp, requierePermiso } from "../seguridad.js";

const router = Router();
const ESTADOS = ["nuevo", "seguimiento", "pase_entregado", "matriculado", "de_baja"];
const ORIGENES = ["visita", "whatsapp", "llamada", "redes", "referido", "web", "otro"];
const CONTACTOS = ["llamada", "whatsapp", "visita"];
const NOMBRE_ESTADO = {
  nuevo: "Nuevo", seguimiento: "En seguimiento", pase_entregado: "Pase libre entregado", matriculado: "Matriculado", de_baja: "De baja",
};

const txt = (v, max) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};
const fechaOk = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : null);
const horaOk = (v) => (/^\d{2}:\d{2}(:\d{2})?$/.test(String(v || "")) ? String(v).slice(0, 5) : null);

/** Fila de la base -> objeto para la app */
const aProspecto = (f) => ({
  id: String(f.idprospecto),
  fullName: f.nombres,
  phone: f.celular,
  email: f.correo || "",
  dni: f.dni || "",
  planId: f.idplan_interes ? String(f.idplan_interes) : "",
  planName: f.plan_nombre || "",
  planPrice: f.plan_precio != null ? Number(f.plan_precio) : null,
  objective: f.objetivo || "",
  source: f.origen,
  status: f.estado,
  contactType: f.contacto_tipo || "",
  contactDate: f.contacto_fecha || "",
  contactTime: f.contacto_hora ? String(f.contacto_hora).slice(0, 5) : "",
  reminderSeen: !!f.recordatorio_visto,
  passCode: f.pase_codigo || "",
  passDate: f.pase_fecha || "",
  passUsedAt: f.pase_usado_en || "",
  memberId: f.idalumno ? String(f.idalumno) : "",
  dropReason: f.motivo_baja || "",
  notes: f.notas || "",
  registeredBy: f.registrado_por || "",
  createdAt: f.fecha_registro,
  updatedAt: f.fecha_actualizacion,
  followUps: Number(f.seguimientos || 0),
});

const SELECT = `
  SELECT p.*, pl.nombre AS plan_nombre, pl.precio AS plan_precio,
         COALESCE(NULLIF(TRIM(CONCAT(COALESCE(e.nombres, ''), ' ', COALESCE(e.apellidos, ''))), ''), u.usuario) AS registrado_por,
         (SELECT COUNT(*) FROM prospecto_seguimientos s WHERE s.idprospecto = p.idprospecto) AS seguimientos
    FROM prospectos p
    LEFT JOIN planes pl   ON pl.idplan = p.idplan_interes
    LEFT JOIN usuarios u  ON u.idusuario = p.idusuario_registro
    LEFT JOIN empleados e ON e.idempleado = u.idempleado`;

async function uno(id) {
  const [f] = await consultar(`${SELECT} WHERE p.idprospecto = ?`, [id]);
  if (!f) throw new ErrorHttp(404, "Prospecto no encontrado");
  return aProspecto(f);
}

// ¿Existe la tabla pases_libres (script 23)? Sin ella el CRM funciona igual, sin historial de pases.
let tablaPases = null;
async function hayTablaPases() {
  if (tablaPases) return true;
  try {
    const [f] = await consultar(
      "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pases_libres'",
    );
    tablaPases = Number(f?.n) > 0 || null;
  } catch {
    tablaPases = null;
  }
  return !!tablaPases;
}
const SIN_TABLA_PASES = "Falta ejecutar base_datos/23_pases_libres.sql en MySQL Workbench para guardar el historial de pases.";

async function anotar(cx, idprospecto, tipo, detalle, idusuario) {
  await cx.query("INSERT INTO prospecto_seguimientos (idprospecto, tipo, detalle, idusuario) VALUES (?,?,?,?)", [
    idprospecto, tipo, String(detalle).slice(0, 300), idusuario || null,
  ]);
}

/** Valida y limpia los datos que llegan del formulario */
function datosDe(b, parcial = false) {
  const d = {};
  if (!parcial || b.fullName !== undefined) {
    d.nombres = txt(b.fullName, 120);
    if (!d.nombres || d.nombres.length < 3) throw new ErrorHttp(400, "Escribe el nombre del interesado");
  }
  if (!parcial || b.phone !== undefined) {
    d.celular = txt(String(b.phone || "").replace(/[^\d+ ]/g, ""), 20);
    if (!d.celular || d.celular.replace(/\D/g, "").length < 6) throw new ErrorHttp(400, "Escribe un número de celular válido");
  }
  if (b.email !== undefined) d.correo = txt(b.email, 120);
  if (b.dni !== undefined) d.dni = txt(String(b.dni).replace(/\D/g, ""), 15);
  if (b.planId !== undefined) d.idplan_interes = /^\d+$/.test(String(b.planId)) ? Number(b.planId) : null;
  if (b.objective !== undefined) d.objetivo = txt(b.objective, 60);
  if (b.source !== undefined) {
    if (!ORIGENES.includes(b.source)) throw new ErrorHttp(400, "Origen no válido");
    d.origen = b.source;
  }
  if (b.notes !== undefined) d.notas = txt(b.notes, 500);
  if (b.contactType !== undefined) {
    if (b.contactType && !CONTACTOS.includes(b.contactType)) throw new ErrorHttp(400, "Tipo de contacto no válido");
    d.contacto_tipo = b.contactType || null;
  }
  if (b.contactDate !== undefined) d.contacto_fecha = fechaOk(b.contactDate);
  if (b.contactTime !== undefined) d.contacto_hora = horaOk(b.contactTime);
  if (d.contacto_tipo && (!d.contacto_fecha || !d.contacto_hora) && !parcial) {
    throw new ErrorHttp(400, "Indica el día y la hora para contactarlo");
  }
  return d;
}

const describirAgenda = (t, f, h) =>
  t && f && h ? `${t === "llamada" ? "Llamada" : t === "whatsapp" ? "Mensaje por WhatsApp" : "Visita al gimnasio"} el ${f.split("-").reverse().join("/")} a las ${h}` : "";

// GET /api/prospectos?estado=
router.get("/", requierePermiso("crm", "ver"), async (req, res, next) => {
  try {
    const estado = ESTADOS.includes(req.query.estado) ? req.query.estado : null;
    const filas = await consultar(
      `${SELECT} ${estado ? "WHERE p.estado = ?" : ""} ORDER BY (p.estado IN ('matriculado','de_baja')), p.contacto_fecha IS NULL, p.contacto_fecha, p.contacto_hora, p.idprospecto DESC LIMIT 2000`,
      estado ? [estado] : [],
    );
    res.json(filas.map(aProspecto));
  } catch (e) {
    next(e);
  }
});

// GET /api/prospectos/recordatorios -> contactos que vencen en los próximos 30 min (o ya pasaron hoy)
router.get("/recordatorios", requierePermiso("crm", "ver"), async (req, res, next) => {
  try {
    const filas = await consultar(
      `${SELECT}
        WHERE p.estado IN ('nuevo','seguimiento','pase_entregado') AND p.recordatorio_visto = 0
          AND p.contacto_fecha IS NOT NULL AND p.contacto_hora IS NOT NULL
          AND TIMESTAMP(p.contacto_fecha, p.contacto_hora) <= DATE_ADD(NOW(), INTERVAL 30 MINUTE)
          AND TIMESTAMP(p.contacto_fecha, p.contacto_hora) >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
        ORDER BY p.contacto_fecha, p.contacto_hora`,
    );
    res.json(filas.map(aProspecto));
  } catch (e) {
    next(e);
  }
});

// GET /api/prospectos/pases-sin-usar -> invitados que no vinieron con su pase libre
// (el día ya pasó, o es hoy y pasó más de 1 hora de la hora acordada). Siguen
// apareciendo hasta que se reprograme el pase, se use o se cierre el caso.
router.get("/pases-sin-usar", requierePermiso("crm", "ver"), async (req, res, next) => {
  try {
    const filas = await consultar(
      `${SELECT}
        WHERE p.estado = 'pase_entregado' AND p.pase_codigo IS NOT NULL AND p.pase_usado_en IS NULL
          AND p.pase_fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          AND (p.pase_fecha < CURDATE()
               OR (p.pase_fecha = CURDATE() AND p.contacto_fecha = p.pase_fecha AND p.contacto_hora IS NOT NULL
                   AND TIMESTAMP(p.pase_fecha, p.contacto_hora) < DATE_SUB(NOW(), INTERVAL 1 HOUR)))
        ORDER BY p.pase_fecha DESC`,
    );
    res.json(filas.map(aProspecto));
  } catch (e) {
    next(e);
  }
});

// GET /api/prospectos/:id/seguimientos
router.get("/:id(\\d+)/seguimientos", requierePermiso("crm", "ver"), async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT s.idseguimiento, s.fecha, s.tipo, s.detalle,
              COALESCE(NULLIF(TRIM(CONCAT(COALESCE(e.nombres, ''), ' ', COALESCE(e.apellidos, ''))), ''), u.usuario) AS usuario
         FROM prospecto_seguimientos s
         LEFT JOIN usuarios u ON u.idusuario = s.idusuario
         LEFT JOIN empleados e ON e.idempleado = u.idempleado
        WHERE s.idprospecto = ? ORDER BY s.fecha DESC, s.idseguimiento DESC LIMIT 200`,
      [req.params.id],
    );
    res.json(filas.map((f) => ({ id: String(f.idseguimiento), date: f.fecha, type: f.tipo, detail: f.detalle, by: f.usuario || "" })));
  } catch (e) {
    next(e);
  }
});

// POST /api/prospectos
router.post("/", requierePermiso("crm", "crear"), async (req, res, next) => {
  try {
    const d = datosDe(req.body || {});
    const id = await transaccion(async (cx) => {
      const [r] = await cx.query(
        `INSERT INTO prospectos (nombres, celular, correo, dni, idplan_interes, objetivo, origen, notas,
                                 contacto_tipo, contacto_fecha, contacto_hora, estado, idusuario_registro)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [d.nombres, d.celular, d.correo ?? null, d.dni ?? null, d.idplan_interes ?? null, d.objetivo ?? null, d.origen || "visita",
          d.notas ?? null, d.contacto_tipo ?? null, d.contacto_fecha ?? null, d.contacto_hora ?? null,
          d.contacto_tipo ? "seguimiento" : "nuevo", req.usuario.idusuario],
      );
      await anotar(cx, r.insertId, "nota", "Registrado como interesado", req.usuario.idusuario);
      const ag = describirAgenda(d.contacto_tipo, d.contacto_fecha, d.contacto_hora);
      if (ag) await anotar(cx, r.insertId, "agenda", `Quedamos: ${ag}`, req.usuario.idusuario);
      return r.insertId;
    });
    res.status(201).json(await uno(id));
  } catch (e) {
    next(e);
  }
});

// PUT /api/prospectos/:id  (datos y agenda)
router.put("/:id(\\d+)", requierePermiso("crm", "editar"), async (req, res, next) => {
  try {
    const antes = await uno(req.params.id);
    const d = datosDe(req.body || {}, true);
    const cambioAgenda =
      ("contacto_tipo" in d && (d.contacto_tipo || "") !== antes.contactType) ||
      ("contacto_fecha" in d && (d.contacto_fecha || "") !== antes.contactDate) ||
      ("contacto_hora" in d && (d.contacto_hora || "") !== antes.contactTime);
    if (cambioAgenda) d.recordatorio_visto = 0;
    const campos = Object.keys(d);
    if (!campos.length) return res.json(antes);
    await transaccion(async (cx) => {
      await cx.query(`UPDATE prospectos SET ${campos.map((c) => `${c} = ?`).join(", ")} WHERE idprospecto = ?`, [...campos.map((c) => d[c]), req.params.id]);
      if (cambioAgenda) {
        const ag = describirAgenda(d.contacto_tipo ?? antes.contactType, d.contacto_fecha ?? antes.contactDate, d.contacto_hora ?? antes.contactTime);
        await anotar(cx, req.params.id, "agenda", ag ? `Nueva cita: ${ag}` : "Se quitó la cita de contacto", req.usuario.idusuario);
        if (ag && antes.status === "nuevo") await cx.query("UPDATE prospectos SET estado = 'seguimiento' WHERE idprospecto = ?", [req.params.id]);
      }
    });
    res.json(await uno(req.params.id));
  } catch (e) {
    next(e);
  }
});

// POST /api/prospectos/:id/seguimiento {tipo, detalle}
router.post("/:id(\\d+)/seguimiento", requierePermiso("crm", "editar"), async (req, res, next) => {
  try {
    const p = await uno(req.params.id);
    const tipo = ["nota", "llamada", "whatsapp", "visita"].includes(req.body?.tipo) ? req.body.tipo : "nota";
    const detalle = txt(req.body?.detalle, 300);
    if (!detalle) throw new ErrorHttp(400, "Escribe qué pasó en el contacto");
    await transaccion(async (cx) => {
      await anotar(cx, req.params.id, tipo, detalle, req.usuario.idusuario);
      if (p.status === "nuevo") await cx.query("UPDATE prospectos SET estado = 'seguimiento' WHERE idprospecto = ?", [req.params.id]);
      if (req.body?.cerrarRecordatorio) await cx.query("UPDATE prospectos SET recordatorio_visto = 1 WHERE idprospecto = ?", [req.params.id]);
    });
    res.json(await uno(req.params.id));
  } catch (e) {
    next(e);
  }
});

// POST /api/prospectos/:id/estado {estado, motivo, memberId}
router.post("/:id(\\d+)/estado", requierePermiso("crm", "editar"), async (req, res, next) => {
  try {
    const p = await uno(req.params.id);
    const estado = req.body?.estado;
    if (!ESTADOS.includes(estado)) throw new ErrorHttp(400, "Estado no válido");
    const motivo = txt(req.body?.motivo, 200);
    if (estado === "de_baja" && !motivo) throw new ErrorHttp(400, "Indica el motivo de la baja (por ejemplo: no contesta)");
    let idalumno = null;
    if (estado === "matriculado" && req.body?.memberId) {
      const [a] = await consultar("SELECT idalumno FROM alumnos WHERE idalumno = ?", [req.body.memberId]);
      if (!a) throw new ErrorHttp(400, "El alumno indicado no existe");
      idalumno = a.idalumno;
    }
    await transaccion(async (cx) => {
      await cx.query(
        `UPDATE prospectos SET estado = ?, motivo_baja = ?, idalumno = COALESCE(?, idalumno),
                recordatorio_visto = IF(? IN ('matriculado','de_baja'), 1, recordatorio_visto) WHERE idprospecto = ?`,
        [estado, estado === "de_baja" ? motivo : null, idalumno, estado, req.params.id],
      );
      if (estado === "de_baja" && (await hayTablaPases())) {
        await cx.query(
          `UPDATE pases_libres SET estado = 'no_concretado', motivo_tipo = COALESCE(motivo_tipo, 'otro'), motivo = COALESCE(motivo, ?),
                  cerrado_en = NOW(), idusuario_cierre = ? WHERE idprospecto = ? AND estado = 'pendiente'`,
          [motivo, req.usuario.idusuario, req.params.id],
        );
      }
      await anotar(cx, req.params.id, "estado", `${NOMBRE_ESTADO[p.status]} → ${NOMBRE_ESTADO[estado]}${motivo ? ` (${motivo})` : ""}`, req.usuario.idusuario);
    });
    res.json(await uno(req.params.id));
  } catch (e) {
    next(e);
  }
});

// POST /api/prospectos/:id/recordatorio-visto
router.post("/:id(\\d+)/recordatorio-visto", requierePermiso("crm", "ver"), async (req, res, next) => {
  try {
    await consultar("UPDATE prospectos SET recordatorio_visto = 1 WHERE idprospecto = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Código del pase: NOMBRE + 5 caracteres al azar (DAVID-K7Q2M). La parte final
// siempre lleva al menos una letra, así nunca se confunde con el código de
// asistencia de un alumno (DF-1, MS-21), que termina en números.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0 ni I/1
const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
function codigoPase(nombreCompleto, largoMax = 12) {
  const nombre =
    String(nombreCompleto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^A-Z]/g, ""))
      .find((w) => w.length >= 2) || "PASE";
  let sufijo = "";
  for (let i = 0; i < 5; i++) sufijo += ALFABETO[crypto.randomInt(0, ALFABETO.length)];
  if (!/[A-Z]/.test(sufijo)) sufijo = LETRAS[crypto.randomInt(0, LETRAS.length)] + sufijo.slice(1);
  return `${nombre.slice(0, Math.max(2, largoMax - 6))}-${sufijo}`;
}
// Largo de la columna pase_codigo (12 antes del script 22, 24 después)
let largoPase = null;
async function largoCodigoPase() {
  if (largoPase) return largoPase;
  try {
    const [f] = await consultar(
      `SELECT CHARACTER_MAXIMUM_LENGTH AS n FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'prospectos' AND COLUMN_NAME = 'pase_codigo'`,
    );
    largoPase = Number(f?.n) || 12;
  } catch {
    largoPase = 12;
  }
  return largoPase;
}

// POST /api/prospectos/:id/pase {fecha, hora?}  -> genera el código de invitación.
// Con hora, la visita queda agendada (aviso 30 min antes y aviso si no viene).
router.post("/:id(\\d+)/pase", requierePermiso("crm", "editar"), async (req, res, next) => {
  try {
    const p = await uno(req.params.id);
    if (["matriculado", "de_baja"].includes(p.status)) throw new ErrorHttp(400, "Este prospecto ya está cerrado");
    const fecha = fechaOk(req.body?.fecha);
    if (!fecha) throw new ErrorHttp(400, "Elige el día en que podrá usar el pase");
    const hora = horaOk(req.body?.hora);
    let codigo = p.passCode;
    if (!codigo) {
      const largo = await largoCodigoPase();
      for (let i = 0; i < 8 && !codigo; i++) {
        const c = codigoPase(p.fullName, largo);
        const [ya] = await consultar("SELECT 1 FROM prospectos WHERE pase_codigo = ?", [c]);
        if (!ya) codigo = c;
      }
      if (!codigo) throw new ErrorHttp(500, "No se pudo generar un código único, inténtalo otra vez");
    }
    const historial = await hayTablaPases();
    await transaccion(async (cx) => {
      await cx.query("UPDATE prospectos SET pase_codigo = ?, pase_fecha = ?, pase_usado_en = NULL, estado = 'pase_entregado' WHERE idprospecto = ?", [codigo, fecha, req.params.id]);
      if (hora) {
        await cx.query(
          "UPDATE prospectos SET contacto_tipo = 'visita', contacto_fecha = ?, contacto_hora = ?, recordatorio_visto = 0 WHERE idprospecto = ?",
          [fecha, hora, req.params.id],
        );
      }
      // Historial del pase (pases_libres): se actualiza el pendiente o se crea uno nuevo
      const [pend] = historial
        ? await cx.query("SELECT idpase, fecha_visita, hora_visita FROM pases_libres WHERE codigo = ? AND estado = 'pendiente' ORDER BY idpase DESC LIMIT 1", [codigo])
        : [[]];
      if (!historial) {
        /* sin historial de pases (falta el script 23) */
      } else if (pend.length) {
        const cambio = String(pend[0].fecha_visita).slice(0, 10) !== fecha || String(pend[0].hora_visita || "").slice(0, 5) !== (hora || "");
        await cx.query("UPDATE pases_libres SET fecha_visita = ?, hora_visita = ?, reprogramaciones = reprogramaciones + ? WHERE idpase = ?", [
          fecha, hora, cambio ? 1 : 0, pend[0].idpase,
        ]);
      } else {
        await cx.query("INSERT INTO pases_libres (idprospecto, codigo, fecha_visita, hora_visita, idusuario_registro) VALUES (?,?,?,?,?)", [
          req.params.id, codigo, fecha, hora, req.usuario.idusuario,
        ]);
      }
      await anotar(cx, req.params.id, "pase", `Pase libre ${codigo} para el ${fecha.split("-").reverse().join("/")}${hora ? ` a las ${hora}` : ""}`, req.usuario.idusuario);
    });
    res.json(await uno(req.params.id));
  } catch (e) {
    next(e);
  }
});

// Motivos de un pase no concretado
export const MOTIVOS_PASE = {
  viaje: "Viaje", vacaciones: "Vacaciones", no_interesa: "Ya no le interesa", salud: "Salud / lesión", trabajo: "Trabajo o estudios",
  horario: "No le acomoda el horario", precio: "Precio", no_contesta: "No contesta", otro_gimnasio: "Eligió otro gimnasio", otro: "Otro motivo",
};

// POST /api/prospectos/:id/pase/no-concretado {motivoTipo, motivo, accion: 'volver_a_llamar'|'baja', fecha?, hora?}
// El interesado no vino (o canceló): se guarda el motivo en su pase. Con
// "volver a llamar" queda agendada una llamada; con "baja" se cierra el caso.
router.post("/:id(\\d+)/pase/no-concretado", requierePermiso("crm", "editar"), async (req, res, next) => {
  try {
    const p = await uno(req.params.id);
    if (!p.passCode) throw new ErrorHttp(400, "Este interesado no tiene pase libre");
    const tipo = Object.keys(MOTIVOS_PASE).includes(req.body?.motivoTipo) ? req.body.motivoTipo : "otro";
    const motivo = txt(req.body?.motivo, 300);
    if (tipo === "otro" && !motivo) throw new ErrorHttp(400, "Escribe el motivo (por ejemplo: viaja a Lima por un mes)");
    const accion = req.body?.accion === "baja" ? "baja" : "volver_a_llamar";
    const fecha = fechaOk(req.body?.fecha);
    const hora = horaOk(req.body?.hora) || "16:00";
    if (accion === "volver_a_llamar" && !fecha) throw new ErrorHttp(400, "Elige el día para volver a llamarlo");
    const texto = `${MOTIVOS_PASE[tipo]}${motivo ? `: ${motivo}` : ""}`;
    if (!(await hayTablaPases())) throw new ErrorHttp(503, SIN_TABLA_PASES);
    await transaccion(async (cx) => {
      const [r] = await cx.query(
        `UPDATE pases_libres SET estado = 'no_concretado', motivo_tipo = ?, motivo = ?, volver_a_llamar = ?, cerrado_en = NOW(), idusuario_cierre = ?
          WHERE idprospecto = ? AND estado = 'pendiente'`,
        [tipo, motivo, accion === "volver_a_llamar" ? fecha : null, req.usuario.idusuario, req.params.id],
      );
      if (!r.affectedRows) {
        // pase anterior al historial: se registra ya cerrado
        await cx.query(
          `INSERT INTO pases_libres (idprospecto, codigo, fecha_visita, estado, motivo_tipo, motivo, volver_a_llamar, cerrado_en, idusuario_registro, idusuario_cierre)
           VALUES (?,?,?,'no_concretado',?,?,?,NOW(),?,?)`,
          [req.params.id, p.passCode, p.passDate || fecha || new Date().toISOString().slice(0, 10), tipo, motivo, accion === "volver_a_llamar" ? fecha : null, req.usuario.idusuario, req.usuario.idusuario],
        );
      }
      if (accion === "baja") {
        await cx.query("UPDATE prospectos SET estado = 'de_baja', motivo_baja = ?, recordatorio_visto = 1 WHERE idprospecto = ?", [texto.slice(0, 200), req.params.id]);
        await anotar(cx, req.params.id, "estado", `Pase ${p.passCode} no concretado → De baja (${texto})`, req.usuario.idusuario);
      } else {
        await cx.query(
          "UPDATE prospectos SET estado = 'seguimiento', contacto_tipo = 'llamada', contacto_fecha = ?, contacto_hora = ?, recordatorio_visto = 0 WHERE idprospecto = ?",
          [fecha, hora, req.params.id],
        );
        await anotar(
          cx, req.params.id, "pase",
          `Pase ${p.passCode} no concretado (${texto}). Volver a llamar el ${fecha.split("-").reverse().join("/")} a las ${hora}`,
          req.usuario.idusuario,
        );
      }
    });
    res.json(await uno(req.params.id));
  } catch (e) {
    next(e);
  }
});

// GET /api/prospectos/pases?estado=&desde=&hasta=  -> historial de pases libres
router.get("/pases", requierePermiso("crm", "ver"), async (req, res, next) => {
  try {
    if (!(await hayTablaPases())) throw new ErrorHttp(503, SIN_TABLA_PASES);
    const where = [];
    const params = [];
    if (["pendiente", "usado", "no_concretado"].includes(req.query.estado)) (where.push("x.estado = ?"), params.push(req.query.estado));
    if (fechaOk(req.query.desde)) (where.push("x.fecha_visita >= ?"), params.push(req.query.desde));
    if (fechaOk(req.query.hasta)) (where.push("x.fecha_visita <= ?"), params.push(req.query.hasta));
    const filas = await consultar(
      `SELECT x.*, p.nombres, p.celular, p.estado AS estado_prospecto, pl.nombre AS plan_nombre,
              COALESCE(NULLIF(TRIM(CONCAT(COALESCE(e.nombres, ''), ' ', COALESCE(e.apellidos, ''))), ''), u.usuario) AS entregado_por,
              COALESCE(NULLIF(TRIM(CONCAT(COALESCE(e2.nombres, ''), ' ', COALESCE(e2.apellidos, ''))), ''), u2.usuario) AS cerrado_por
         FROM pases_libres x
         JOIN prospectos p     ON p.idprospecto = x.idprospecto
         LEFT JOIN planes pl   ON pl.idplan = p.idplan_interes
         LEFT JOIN usuarios u  ON u.idusuario = x.idusuario_registro
         LEFT JOIN empleados e ON e.idempleado = u.idempleado
         LEFT JOIN usuarios u2 ON u2.idusuario = x.idusuario_cierre
         LEFT JOIN empleados e2 ON e2.idempleado = u2.idempleado
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY x.fecha_visita DESC, x.idpase DESC LIMIT 1000`,
      params,
    );
    res.json(
      filas.map((f) => ({
        id: String(f.idpase),
        prospectId: String(f.idprospecto),
        fullName: f.nombres,
        phone: f.celular,
        planName: f.plan_nombre || "",
        prospectStatus: f.estado_prospecto,
        code: f.codigo,
        visitDate: String(f.fecha_visita).slice(0, 10),
        visitTime: f.hora_visita ? String(f.hora_visita).slice(0, 5) : "",
        status: f.estado,
        reasonType: f.motivo_tipo || "",
        reasonLabel: f.motivo_tipo ? MOTIVOS_PASE[f.motivo_tipo] || f.motivo_tipo : "",
        reason: f.motivo || "",
        callBackDate: f.volver_a_llamar ? String(f.volver_a_llamar).slice(0, 10) : "",
        reschedules: Number(f.reprogramaciones || 0),
        usedAt: f.usado_en || "",
        closedAt: f.cerrado_en || "",
        givenBy: f.entregado_por || "",
        closedBy: f.cerrado_por || "",
        createdAt: f.fecha_registro,
      })),
    );
  } catch (e) {
    next(e);
  }
});

// Turnos para el reporte: los de recepción con horario; si no hay, mañana / tarde / noche
const TURNOS_BASE = [
  { nombre: "Mañana", inicio: 5, fin: 12 },
  { nombre: "Tarde", inicio: 12, fin: 18 },
  { nombre: "Noche", inicio: 18, fin: 24 },
];
async function turnosReporte() {
  try {
    const f = await consultar(
      "SELECT nombre, hora_inicio, hora_fin FROM turnos_recepcion WHERE activo = 1 AND hora_inicio IS NOT NULL AND hora_fin IS NOT NULL ORDER BY hora_inicio",
    );
    const t = f.map((x) => ({ nombre: x.nombre, inicio: Number(String(x.hora_inicio).slice(0, 2)), fin: Number(String(x.hora_fin).slice(0, 2)) || 24 }));
    return t.length ? t : TURNOS_BASE;
  } catch {
    return TURNOS_BASE;
  }
}
const turnoDe = (turnos, h) =>
  (turnos.find((t) => (t.inicio <= t.fin ? h >= t.inicio && h < t.fin : h >= t.inicio || h < t.fin)) || { nombre: "Fuera de turno" }).nombre;

// GET /api/prospectos/reporte?desde=&hasta=  -> afluencia de interesados y resultado de los pases
router.get("/reporte", requierePermiso("crm", "ver"), async (req, res, next) => {
  try {
    const hoy = new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
    const desde = fechaOk(req.query.desde) || `${hoy.slice(0, 7)}-01`;
    const hasta = fechaOk(req.query.hasta) || hoy;
    const turnos = await turnosReporte();
    const interesados = await consultar(
      `SELECT p.idprospecto, HOUR(p.fecha_registro) AS h, DAYOFWEEK(p.fecha_registro) AS dsem, DATE(p.fecha_registro) AS dia,
              p.origen, p.estado, p.idplan_interes, pl.nombre AS plan,
              COALESCE(NULLIF(TRIM(CONCAT(COALESCE(e.nombres, ''), ' ', COALESCE(e.apellidos, ''))), ''), u.usuario, 'Sin registrar') AS quien
         FROM prospectos p
         LEFT JOIN planes pl   ON pl.idplan = p.idplan_interes
         LEFT JOIN usuarios u  ON u.idusuario = p.idusuario_registro
         LEFT JOIN empleados e ON e.idempleado = u.idempleado
        WHERE DATE(p.fecha_registro) BETWEEN ? AND ?`,
      [desde, hasta],
    );
    const pases = (await hayTablaPases())
      ? await consultar(
          `SELECT estado, motivo_tipo, HOUR(fecha_registro) AS h, reprogramaciones FROM pases_libres WHERE DATE(fecha_registro) BETWEEN ? AND ?`,
          [desde, hasta],
        )
      : [];
    const contar = (lista, clave) => {
      const m = new Map();
      lista.forEach((x) => {
        const k = clave(x);
        m.set(k, (m.get(k) || 0) + 1);
      });
      return [...m.entries()].map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
    };
    const ORIGEN = { visita: "Vino al gimnasio", whatsapp: "WhatsApp", llamada: "Llamada", redes: "Redes sociales", referido: "Referido", web: "Página web", otro: "Otro" };
    const DIAS = ["", "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const porTurno = [...turnos.map((t) => t.nombre), "Fuera de turno"].map((n) => {
      const del = interesados.filter((x) => turnoDe(turnos, Number(x.h)) === n);
      return {
        nombre: n,
        interesados: del.length,
        pases: pases.filter((x) => turnoDe(turnos, Number(x.h)) === n).length,
        matriculados: del.filter((x) => x.estado === "matriculado").length,
      };
    }).filter((t) => t.nombre !== "Fuera de turno" || t.interesados || t.pases);
    const porHora = Array.from({ length: 24 }, (_, h) => ({ hora: `${String(h).padStart(2, "0")}:00`, total: interesados.filter((x) => Number(x.h) === h).length }))
      .filter((x, i, arr) => x.total || (i >= 6 && i <= 22));
    const porDia = [2, 3, 4, 5, 6, 7, 1].map((d) => ({ nombre: DIAS[d], total: interesados.filter((x) => Number(x.dsem) === d).length }));
    const totalPases = pases.length;
    const usados = pases.filter((x) => x.estado === "usado").length;
    const noConcretados = pases.filter((x) => x.estado === "no_concretado").length;
    const matriculados = interesados.filter((x) => x.estado === "matriculado").length;
    res.json({
      desde, hasta,
      turnos: turnos.map((t) => ({ nombre: t.nombre, horario: `${String(t.inicio).padStart(2, "0")}:00 – ${String(t.fin % 24).padStart(2, "0")}:00` })),
      resumen: {
        interesados: interesados.length,
        matriculados,
        conversion: interesados.length ? Math.round((matriculados / interesados.length) * 100) : 0,
        pases: totalPases,
        pasesUsados: usados,
        pasesNoConcretados: noConcretados,
        pasesPendientes: totalPases - usados - noConcretados,
        asistenciaPases: totalPases ? Math.round((usados / totalPases) * 100) : 0,
        reprogramaciones: pases.reduce((s, x) => s + Number(x.reprogramaciones || 0), 0),
      },
      porTurno,
      porHora,
      porDia,
      porOrigen: contar(interesados, (x) => ORIGEN[x.origen] || x.origen),
      porPlan: contar(interesados, (x) => x.plan || "Aún no sabe"),
      porQuien: contar(interesados, (x) => x.quien),
      motivos: contar(pases.filter((x) => x.estado === "no_concretado"), (x) => MOTIVOS_PASE[x.motivo_tipo] || "Otro motivo"),
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/prospectos/pase/validar {codigo}  -> en recepción, al llegar con su invitación
router.post("/pase/validar", requierePermiso("crm", "ver"), async (req, res, next) => {
  try {
    const codigo = String(req.body?.codigo || "").trim().toUpperCase();
    const [f] = await consultar(`${SELECT} WHERE p.pase_codigo = ?`, [codigo]);
    if (!f) throw new ErrorHttp(404, "No existe una invitación con ese código");
    const p = aProspecto(f);
    const [{ hoy }] = await consultar("SELECT CURDATE() AS hoy");
    if (p.passUsedAt) throw new ErrorHttp(400, `Este pase ya se usó (${String(p.passUsedAt).slice(0, 16)})`);
    if (p.passDate && p.passDate !== hoy) throw new ErrorHttp(400, `Este pase es para el ${p.passDate.split("-").reverse().join("/")}`);
    await transaccion(async (cx) => {
      await cx.query("UPDATE prospectos SET pase_usado_en = NOW() WHERE idprospecto = ?", [f.idprospecto]);
      if (await hayTablaPases()) {
        await cx.query("UPDATE pases_libres SET estado = 'usado', usado_en = NOW(), cerrado_en = NOW(), idusuario_cierre = ? WHERE codigo = ? AND estado = 'pendiente'", [
          req.usuario.idusuario, codigo,
        ]);
      }
      await anotar(cx, f.idprospecto, "visita", `Usó su pase libre ${codigo} y probó las instalaciones`, req.usuario.idusuario);
    });
    res.json(await uno(f.idprospecto));
  } catch (e) {
    next(e);
  }
});

// DELETE /api/prospectos/:id
router.delete("/:id(\\d+)", requierePermiso("crm", "eliminar"), async (req, res, next) => {
  try {
    await uno(req.params.id);
    await consultar("DELETE FROM prospectos WHERE idprospecto = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
