// =====================================================================
// MENSAJES PREDETERMINADOS POR CATEGORÍA (Notificaciones)
// 15 mensajes por categoría, editables, y la lista de alumnos de cada categoría
// para enviarles el mensaje personalizado por WhatsApp.
// =====================================================================
import { Router } from "express";
import { consultar } from "../db.js";
import { ErrorHttp, requierePermiso } from "../seguridad.js";
import { SQL_DEUDA, SQL_VENCE_DEUDA } from "./alumnos.js";
import { codigoAlumno } from "../codigoAlumno.js";
import { hoyLima } from "../congelamiento.js";

const router = Router();
// Si la base de datos aún no tiene la actualización, se avisa qué script ejecutar
const faltaTabla = (e) =>
  e?.code === "ER_NO_SUCH_TABLE" ? new ErrorHttp(503, "Falta actualizar la base de datos: ejecuta base_datos/16_mensajes.sql en MySQL Workbench") : e;

export const CATEGORIAS = ["por_vencer", "vencidos", "no_vienen", "renovaron", "bienvenida", "cumpleanos", "deuda", "congelamiento", "constancia", "exalumnos"];

const aPlantilla = (f) => ({
  id: String(f.idplantilla),
  category: f.categoria,
  title: f.titulo,
  message: f.mensaje,
  order: Number(f.orden),
  custom: !!f.es_propia,
  editedAt: f.fecha_edicion,
});

function validar(d) {
  const titulo = String(d?.title || "").trim().replace(/\s+/g, " ");
  const mensaje = String(d?.message || "").trim();
  if (!CATEGORIAS.includes(d?.category)) throw new ErrorHttp(400, "Elige la categoría del mensaje");
  if (titulo.length < 2 || titulo.length > 80) throw new ErrorHttp(400, "El título debe tener entre 2 y 80 caracteres");
  if (mensaje.length < 5 || mensaje.length > 1000) throw new ErrorHttp(400, "El mensaje debe tener entre 5 y 1000 caracteres");
  return { titulo, mensaje };
}

// GET /api/mensajes/plantillas
router.get("/plantillas", requierePermiso("alerts", "ver"), async (req, res, next) => {
  try {
    const filas = await consultar("SELECT * FROM plantillas_mensajes WHERE activo = 1 ORDER BY categoria, es_propia DESC, orden, idplantilla");
    res.json(filas.map(aPlantilla));
  } catch (e) {
    next(faltaTabla(e));
  }
});

// POST /api/mensajes/plantillas { category, title, message }
router.post("/plantillas", requierePermiso("alerts", "editar"), async (req, res, next) => {
  try {
    const { titulo, mensaje } = validar(req.body);
    try {
      const r = await consultar(
        "INSERT INTO plantillas_mensajes (categoria, titulo, mensaje, orden, es_propia, creado_por) VALUES (?,?,?,0,1,?)",
        [req.body.category, titulo, mensaje, req.usuario.idusuario],
      );
      const [f] = await consultar("SELECT * FROM plantillas_mensajes WHERE idplantilla = ?", [r.insertId]);
      res.status(201).json(aPlantilla(f));
    } catch (e) {
      if (e.code !== "ER_DUP_ENTRY") throw e;
      const r = await consultar(
        "UPDATE plantillas_mensajes SET mensaje = ?, activo = 1, fecha_edicion = NOW() WHERE categoria = ? AND titulo = ? AND activo = 0",
        [mensaje, req.body.category, titulo],
      );
      if (!r.affectedRows) throw new ErrorHttp(409, "Ya hay un mensaje con ese título en la categoría");
      const [f] = await consultar("SELECT * FROM plantillas_mensajes WHERE categoria = ? AND titulo = ?", [req.body.category, titulo]);
      res.status(201).json(aPlantilla(f));
    }
  } catch (e) {
    next(faltaTabla(e));
  }
});

// PUT /api/mensajes/plantillas/:id { category, title, message }
router.put("/plantillas/:id", requierePermiso("alerts", "editar"), async (req, res, next) => {
  try {
    const { titulo, mensaje } = validar(req.body);
    try {
      const r = await consultar(
        "UPDATE plantillas_mensajes SET categoria = ?, titulo = ?, mensaje = ?, fecha_edicion = NOW() WHERE idplantilla = ? AND activo = 1",
        [req.body.category, titulo, mensaje, req.params.id],
      );
      if (!r.affectedRows) throw new ErrorHttp(404, "Mensaje no encontrado");
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") throw new ErrorHttp(409, "Ya hay un mensaje con ese título en la categoría");
      throw e;
    }
    const [f] = await consultar("SELECT * FROM plantillas_mensajes WHERE idplantilla = ?", [req.params.id]);
    res.json(aPlantilla(f));
  } catch (e) {
    next(faltaTabla(e));
  }
});

// DELETE /api/mensajes/plantillas/:id -> lo oculta
router.delete("/plantillas/:id", requierePermiso("alerts", "editar"), async (req, res, next) => {
  try {
    await consultar("UPDATE plantillas_mensajes SET activo = 0 WHERE idplantilla = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(faltaTabla(e));
  }
});

// ---------------------------------------------------------------------
// GET /api/mensajes/destinatarios -> { hoy, categorias: { por_vencer: [...], ... } }
// ---------------------------------------------------------------------
const dias = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const sumar = (f, n) => new Date(Date.parse(`${f}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

router.get("/destinatarios", requierePermiso("alerts", "ver"), async (req, res, next) => {
  try {
    const hoy = hoyLima();
    const filas = await consultar(
      `SELECT a.idalumno, a.codigo, a.nombres, a.apellidos, a.telefono, a.fecha_nacimiento, DATE(a.fecha_registro) AS registro,
              m.fecha_fin, p.nombre AS plan,
              ${SQL_DEUDA} AS deuda, ${SQL_VENCE_DEUDA} AS vence_deuda,
              (SELECT MAX(aa.fecha) FROM asistencias_alumno aa WHERE aa.idalumno = a.idalumno AND aa.tipo = 'entrada') AS ultima_asistencia,
              (SELECT COUNT(DISTINCT aa.fecha) FROM asistencias_alumno aa WHERE aa.idalumno = a.idalumno AND aa.tipo = 'entrada'
                  AND aa.fecha >= CURDATE() - INTERVAL 30 DAY) AS asistencias_30d,
              (SELECT MAX(DATE(mr.fecha_registro)) FROM matriculas mr WHERE mr.idalumno = a.idalumno AND mr.es_renovacion = 1 AND mr.estado <> 'anulada') AS ultima_renovacion,
              (SELECT MIN(c.fecha_fin) FROM congelamientos c WHERE c.idalumno = a.idalumno AND c.estado = 'vigente'
                  AND c.fecha_inicio <= CURDATE() + INTERVAL 1 DAY AND c.fecha_fin >= CURDATE()) AS cong_fin
         FROM alumnos a
         LEFT JOIN matriculas m ON m.idmatricula = (
              SELECT m2.idmatricula FROM matriculas m2 WHERE m2.idalumno = a.idalumno AND m2.estado <> 'anulada'
               ORDER BY m2.fecha_fin DESC, m2.idmatricula DESC LIMIT 1)
         LEFT JOIN planes p ON p.idplan = m.idplan
        WHERE a.activo = 1 AND a.idalumno > 0`,
    );
    const cat = Object.fromEntries(CATEGORIAS.map((c) => [c, []]));
    const mes = hoy.slice(5, 7);
    for (const f of filas) {
      const fin = f.fecha_fin ? String(f.fecha_fin).slice(0, 10) : null;
      const base = {
        id: String(f.idalumno),
        name: `${f.nombres} ${f.apellidos}`.trim(),
        firstName: String(f.nombres || "").split(" ")[0],
        codeLabel: codigoAlumno(f.codigo, f.nombres, f.apellidos),
        phone: f.telefono || "",
        plan: f.plan || "",
        endDate: fin,
        debt: Number(f.deuda || 0),
        debtDueDate: f.vence_deuda ? String(f.vence_deuda).slice(0, 10) : null,
        attendances30: Number(f.asistencias_30d || 0),
      };
      const congelado = !!f.cong_fin;
      if (congelado && dias(hoy, String(f.cong_fin).slice(0, 10)) <= 7) {
        const ff = String(f.cong_fin).slice(0, 10);
        cat.congelamiento.push({ ...base, returnDate: sumar(ff, 1), days: dias(hoy, ff) + 1 });
      }
      if (fin && !congelado) {
        const d = dias(hoy, fin);
        if (d >= 0 && d <= 7) cat.por_vencer.push({ ...base, days: d });
        else if (d < 0 && d >= -30) cat.vencidos.push({ ...base, days: -d });
        else if (d < -30) cat.exalumnos.push({ ...base, days: -d });
        if (d >= 0) {
          const ult = f.ultima_asistencia ? String(f.ultima_asistencia).slice(0, 10) : null;
          const sin = ult ? dias(ult, hoy) : dias(String(f.registro).slice(0, 10), hoy);
          if (sin >= 15) cat.no_vienen.push({ ...base, days: sin, lastAttendance: ult });
        }
      }
      const reg = String(f.registro).slice(0, 10);
      if (dias(reg, hoy) <= 7) cat.bienvenida.push({ ...base, days: dias(reg, hoy) });
      if (f.ultima_renovacion && dias(String(f.ultima_renovacion).slice(0, 10), hoy) <= 7) cat.renovaron.push(base);
      if (f.fecha_nacimiento && String(f.fecha_nacimiento).slice(5, 7) === mes) {
        const dia = String(f.fecha_nacimiento).slice(8, 10);
        cat.cumpleanos.push({ ...base, birthday: `${dia}/${mes}`, today: dia === hoy.slice(8, 10), day: Number(dia) });
      }
      if (base.debt > 0.004) cat.deuda.push({ ...base, days: base.debtDueDate ? dias(hoy, base.debtDueDate) : null });
      if (base.attendances30 >= 12) cat.constancia.push(base);
    }
    cat.por_vencer.sort((a, b) => a.days - b.days);
    cat.vencidos.sort((a, b) => a.days - b.days);
    cat.exalumnos.sort((a, b) => a.days - b.days);
    cat.no_vienen.sort((a, b) => b.days - a.days);
    cat.cumpleanos.sort((a, b) => a.day - b.day);
    cat.deuda.sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
    cat.constancia.sort((a, b) => b.attendances30 - a.attendances30);
    cat.congelamiento.sort((a, b) => a.days - b.days);
    const [cfg] = await consultar("SELECT valor FROM configuracion WHERE clave = 'gym_nombre'");
    res.json({ hoy, gym: cfg?.valor || "Radical Gym", categorias: cat });
  } catch (e) {
    next(faltaTabla(e));
  }
});

export default router;
