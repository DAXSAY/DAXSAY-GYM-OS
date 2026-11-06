// =====================================================================
// METAS & LOGROS
//  * Turnos de recepción (Turno 1, Turno 2...) y su meta en soles por mes.
//    El avance suma los ingresos de los turnos de caja de ese turno.
//  * Objetivos de alumnos: nutrición o fisioterapia los crean y evalúan.
//    Si se consigue, el entrenador del alumno gana un logro (mancuerna).
//  * Metas de entrenadores: cantidad de logros (peso/masa o lesión/dolor).
//  * Bonos: administración los aprueba al cumplirse una meta y los paga.
// =====================================================================
import { Router } from "express";
import { consultar, transaccion } from "../db.js";
import { hoyLima } from "../congelamiento.js";
import { ErrorHttp, requierePermiso, soloPersonal, tienePermiso } from "../seguridad.js";

const router = Router();
router.use(soloPersonal);

const hoy = hoyLima;
const fechaOk = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : null);
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const txt = (v, max) => (v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim().slice(0, max));
const dias = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 864e5);
const sumarDias = (f, n) => {
  const d = new Date(`${f}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const mesARango = (mes) => {
  if (!/^\d{4}-\d{2}$/.test(mes || "")) return null;
  const [a, m] = mes.split("-").map(Number);
  const fin = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
  return [`${mes}-01`, fin];
};

async function esAdmin(req) {
  return tienePermiso(req.usuario.idusuario, "users", "editar");
}
async function yo(req) {
  const [u] = await consultar(
    `SELECT u.idempleado, u.idturno_recepcion, r.codigo AS rol FROM usuarios u JOIN roles r ON r.idrol = u.idrol
      WHERE u.idusuario = ?`,
    [req.usuario.idusuario],
  );
  return u || {};
}
const soloAdmin = async (req, res, next) => {
  try {
    if (!(await esAdmin(req))) throw new ErrorHttp(403, "Solo administración puede hacer esto");
    next();
  } catch (e) {
    next(e);
  }
};

// ---------------------------------------------------------------------
// TURNOS DE RECEPCIÓN
// ---------------------------------------------------------------------
router.get("/turnos-recepcion", requierePermiso(["goals", "cash"], "ver"), async (req, res, next) => {
  try {
    const turnos = await consultar("SELECT * FROM turnos_recepcion ORDER BY activo DESC, hora_inicio, nombre");
    const personas = await consultar(
      `SELECT u.idusuario, u.idturno_recepcion, u.idempleado, COALESCE(CONCAT_WS(' ', e.nombres, e.apellidos), u.usuario) AS nombre
         FROM usuarios u LEFT JOIN empleados e ON e.idempleado = u.idempleado
        WHERE u.activo = 1 AND u.idturno_recepcion IS NOT NULL`,
    );
    res.json(
      turnos.map((t) => ({
        id: String(t.idturno_recepcion),
        name: t.nombre,
        start: t.hora_inicio ? String(t.hora_inicio).slice(0, 5) : "",
        end: t.hora_fin ? String(t.hora_fin).slice(0, 5) : "",
        active: !!t.activo,
        people: personas
          .filter((p) => p.idturno_recepcion === t.idturno_recepcion)
          .map((p) => ({ userId: String(p.idusuario), staffId: p.idempleado ? String(p.idempleado) : null, name: p.nombre })),
      })),
    );
  } catch (e) {
    next(e);
  }
});

router.post("/turnos-recepcion", soloAdmin, async (req, res, next) => {
  try {
    const nombre = txt(req.body?.name, 60);
    if (!nombre) throw new ErrorHttp(400, "Escribe el nombre del turno");
    await consultar("INSERT INTO turnos_recepcion (nombre, hora_inicio, hora_fin) VALUES (?,?,?)", [
      nombre,
      txt(req.body?.start, 5),
      txt(req.body?.end, 5),
    ]);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return next(new ErrorHttp(409, "Ya existe un turno con ese nombre"));
    next(e);
  }
});

router.put("/turnos-recepcion/:id(\\d+)", soloAdmin, async (req, res, next) => {
  try {
    await consultar("UPDATE turnos_recepcion SET nombre = ?, hora_inicio = ?, hora_fin = ?, activo = ? WHERE idturno_recepcion = ?", [
      txt(req.body?.name, 60),
      txt(req.body?.start, 5),
      txt(req.body?.end, 5),
      req.body?.active === false ? 0 : 1,
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return next(new ErrorHttp(409, "Ya existe un turno con ese nombre"));
    next(e);
  }
});

// ---------------------------------------------------------------------
// METAS
// ---------------------------------------------------------------------
const AREA_DE = { composicion: ["nutricion"], lesion: ["fisioterapia"], general: ["nutricion", "fisioterapia"] };

async function avance(m) {
  const inicio = String(m.fecha_inicio).slice(0, 10);
  const fin = String(m.fecha_fin).slice(0, 10);
  const h = hoy();
  const totalDias = dias(inicio, fin) + 1;
  const transcurridos = h < inicio ? 0 : h > fin ? totalDias : dias(inicio, h) + 1;
  const restantes = h > fin ? 0 : h < inicio ? totalDias : dias(h, fin) + 1;
  const objetivo = m.tipo === "recepcion" ? Number(m.monto_meta || 0) : Number(m.logros_meta || 0);

  let porDia = [];
  let logros = [];
  if (m.tipo === "recepcion") {
    porDia = await consultar(
      `SELECT DATE(mc.fecha) AS dia, SUM(mc.monto) AS total
         FROM movimientos_caja mc JOIN turnos_caja tc ON tc.idturno = mc.idturno
         LEFT JOIN usuarios ua ON ua.idusuario = tc.idusuario_apertura
        WHERE (tc.idturno_recepcion = ? OR (tc.idturno_recepcion IS NULL AND ua.idturno_recepcion = ?))
          AND mc.tipo = 'ingreso' AND mc.fecha >= ? AND mc.fecha < ? + INTERVAL 1 DAY
        GROUP BY DATE(mc.fecha)`,
      [m.idturno_recepcion, m.idturno_recepcion, inicio, fin],
    );
  } else {
    const areas = AREA_DE[m.categoria] || AREA_DE.general;
    logros = await consultar(
      `SELECT o.idobjetivo, o.area, o.tipo, o.descripcion, o.valor_inicial, o.valor_final, o.unidad,
              DATE(o.fecha_evaluacion) AS dia, CONCAT(a.nombres, ' ', a.apellidos) AS alumno,
              CONCAT_WS(' ', ev.nombres, ev.apellidos) AS evaluador
         FROM objetivos_alumno o JOIN alumnos a ON a.idalumno = o.idalumno
         LEFT JOIN empleados ev ON ev.idempleado = o.evaluado_por
        WHERE o.identrenador = ? AND o.estado = 'conseguida' AND o.logro_otorgado = 1
          AND o.area IN (${areas.map(() => "?").join(",")})
          AND o.fecha_evaluacion >= ? AND o.fecha_evaluacion < ? + INTERVAL 1 DAY
        ORDER BY o.fecha_evaluacion`,
      [m.idempleado, ...areas, inicio, fin],
    );
    const conteo = {};
    logros.forEach((l) => (conteo[String(l.dia).slice(0, 10)] = (conteo[String(l.dia).slice(0, 10)] || 0) + 1));
    porDia = Object.entries(conteo).map(([dia, total]) => ({ dia, total }));
  }

  // Serie diaria con acumulado e ideal (para el gráfico)
  const mapa = Object.fromEntries(porDia.map((d) => [String(d.dia).slice(0, 10), Number(d.total)]));
  const diario = [];
  let acumulado = 0;
  for (let i = 0; i < totalDias; i++) {
    const dia = sumarDias(inicio, i);
    const valor = mapa[dia] || 0;
    acumulado += valor;
    diario.push({
      dia,
      valor: r2(valor),
      acumulado: dia <= h ? r2(acumulado) : null,
      ideal: r2((objetivo * (i + 1)) / totalDias),
    });
  }
  const logrado = r2(acumulado);
  // Semanas del periodo (bloques de 7 días desde el inicio)
  const semanas = [];
  for (let i = 0; i < totalDias; i += 7) {
    const bloque = diario.slice(i, i + 7);
    semanas.push({
      numero: semanas.length + 1,
      desde: bloque[0].dia,
      hasta: bloque[bloque.length - 1].dia,
      total: r2(bloque.reduce((a, d) => a + d.valor, 0)),
      meta: r2((objetivo * bloque.length) / totalDias),
    });
  }
  const faltante = Math.max(0, r2(objetivo - logrado));
  const hoyFila = diario.find((d) => d.dia === h);
  const semanaActual = semanas.find((s) => s.desde <= h && s.hasta >= h) || null;
  return {
    objetivo,
    logrado,
    porcentaje: objetivo > 0 ? Math.min(100, Math.round((logrado / objetivo) * 1000) / 10) : 0,
    faltante,
    cumplida: objetivo > 0 && logrado >= objetivo,
    totalDias,
    diasTranscurridos: transcurridos,
    diasRestantes: restantes,
    necesarioPorDia: restantes > 0 ? r2(faltante / restantes) : faltante,
    ritmoIdeal: r2((objetivo * transcurridos) / totalDias),
    hoy: hoyFila ? hoyFila.valor : 0,
    semanaActual,
    diario,
    semanas,
    logros: logros.map((l) => ({
      id: String(l.idobjetivo),
      area: l.area,
      tipo: l.tipo,
      descripcion: l.descripcion,
      alumno: l.alumno,
      evaluador: l.evaluador || "",
      inicial: l.valor_inicial != null ? Number(l.valor_inicial) : null,
      final: l.valor_final != null ? Number(l.valor_final) : null,
      unidad: l.unidad || "",
      dia: String(l.dia).slice(0, 10),
    })),
  };
}

async function metasCompletas(where, params) {
  const filas = await consultar(
    `SELECT m.*, tr.nombre AS turno, CONCAT_WS(' ', e.nombres, e.apellidos) AS empleado,
            b.idbono, b.estado AS bono_estado, b.monto AS bono_monto
       FROM metas m
       LEFT JOIN turnos_recepcion tr ON tr.idturno_recepcion = m.idturno_recepcion
       LEFT JOIN empleados e ON e.idempleado = m.idempleado
       LEFT JOIN bonos b ON b.idbono = (SELECT MAX(b2.idbono) FROM bonos b2 WHERE b2.idmeta = m.idmeta AND b2.estado <> 'anulado')
      WHERE ${where}
      ORDER BY m.tipo DESC, m.fecha_inicio DESC, tr.nombre, e.nombres`,
    params,
  );
  return Promise.all(
    filas.map(async (m) => ({
      id: String(m.idmeta),
      type: m.tipo,
      category: m.categoria,
      receptionShiftId: m.idturno_recepcion ? String(m.idturno_recepcion) : null,
      staffId: m.idempleado ? String(m.idempleado) : null,
      name: m.tipo === "recepcion" ? m.turno : m.empleado,
      start: String(m.fecha_inicio).slice(0, 10),
      end: String(m.fecha_fin).slice(0, 10),
      bonus: Number(m.bono),
      notes: m.notas || "",
      bonusId: m.idbono ? String(m.idbono) : null,
      bonusStatus: m.bono_estado || null,
      progress: await avance(m),
    })),
  );
}

// GET /api/metas/metas?mes=YYYY-MM  -> admin: todas; recepción: su turno; entrenador: las suyas
router.get("/metas", requierePermiso("goals", "ver"), async (req, res, next) => {
  try {
    const [ini, fin] = mesARango(req.query.mes) || mesARango(hoy().slice(0, 7));
    const base = "m.fecha_inicio <= ? AND m.fecha_fin >= ?";
    if (await esAdmin(req)) return res.json(await metasCompletas(base, [fin, ini]));
    const u = await yo(req);
    const cond = [];
    const params = [fin, ini];
    if (u.idturno_recepcion) {
      cond.push("(m.tipo = 'recepcion' AND m.idturno_recepcion = ?)");
      params.push(u.idturno_recepcion);
    }
    if (u.idempleado) {
      cond.push("(m.tipo = 'entrenador' AND m.idempleado = ?)");
      params.push(u.idempleado);
    }
    if (!cond.length) return res.json([]);
    res.json(await metasCompletas(`${base} AND (${cond.join(" OR ")})`, params));
  } catch (e) {
    next(e);
  }
});

function datosMeta(d) {
  const tipo = d.type === "entrenador" ? "entrenador" : "recepcion";
  let [ini, fin] = d.month ? mesARango(d.month) || [] : [fechaOk(d.start), fechaOk(d.end)];
  if (!ini || !fin || fin < ini) throw new ErrorHttp(400, "Indica el mes o las fechas de la meta");
  const categoria = tipo === "recepcion" ? "ingresos" : ["composicion", "lesion", "general"].includes(d.category) ? d.category : "general";
  const monto = tipo === "recepcion" ? r2(d.amount) : null;
  const logros = tipo === "entrenador" ? Math.round(Number(d.achievements)) : null;
  if (tipo === "recepcion" && !(monto > 0)) throw new ErrorHttp(400, "Indica el monto de la meta");
  if (tipo === "entrenador" && !(logros > 0)) throw new ErrorHttp(400, "Indica cuántos logros (mancuernas) debe conseguir");
  const idturno = tipo === "recepcion" ? Number(d.receptionShiftId) || null : null;
  const idemp = tipo === "entrenador" ? Number(d.staffId) || null : null;
  if (tipo === "recepcion" && !idturno) throw new ErrorHttp(400, "Elige el turno de recepción");
  if (tipo === "entrenador" && !idemp) throw new ErrorHttp(400, "Elige el entrenador");
  return { tipo, categoria, ini, fin, monto, logros, idturno, idemp, bono: Math.max(0, r2(d.bonus)), notas: txt(d.notes, 300) };
}

async function validarCruce(m, excluir = 0) {
  const [f] = await consultar(
    `SELECT idmeta FROM metas
      WHERE tipo = ? AND categoria = ? AND idmeta <> ?
        AND ((? IS NOT NULL AND idturno_recepcion = ?) OR (? IS NOT NULL AND idempleado = ?))
        AND fecha_inicio <= ? AND fecha_fin >= ? LIMIT 1`,
    [m.tipo, m.categoria, excluir, m.idturno, m.idturno, m.idemp, m.idemp, m.fin, m.ini],
  );
  if (f) throw new ErrorHttp(409, "Ya hay una meta igual que se cruza con esas fechas. Edítala en lugar de crear otra.");
}

router.post("/metas", soloAdmin, async (req, res, next) => {
  try {
    const m = datosMeta(req.body || {});
    await validarCruce(m);
    const r = await consultar(
      `INSERT INTO metas (tipo, idturno_recepcion, idempleado, categoria, fecha_inicio, fecha_fin, monto_meta, logros_meta, bono, notas, creado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [m.tipo, m.idturno, m.idemp, m.categoria, m.ini, m.fin, m.monto, m.logros, m.bono, m.notas, req.usuario.idusuario],
    );
    res.status(201).json((await metasCompletas("m.idmeta = ?", [r.insertId]))[0]);
  } catch (e) {
    next(e);
  }
});

router.put("/metas/:id(\\d+)", soloAdmin, async (req, res, next) => {
  try {
    const m = datosMeta(req.body || {});
    await validarCruce(m, Number(req.params.id));
    await consultar(
      `UPDATE metas SET tipo = ?, idturno_recepcion = ?, idempleado = ?, categoria = ?, fecha_inicio = ?, fecha_fin = ?,
              monto_meta = ?, logros_meta = ?, bono = ?, notas = ? WHERE idmeta = ?`,
      [m.tipo, m.idturno, m.idemp, m.categoria, m.ini, m.fin, m.monto, m.logros, m.bono, m.notas, req.params.id],
    );
    res.json((await metasCompletas("m.idmeta = ?", [req.params.id]))[0]);
  } catch (e) {
    next(e);
  }
});

router.delete("/metas/:id(\\d+)", soloAdmin, async (req, res, next) => {
  try {
    const [b] = await consultar("SELECT 1 FROM bonos WHERE idmeta = ? AND estado <> 'anulado' LIMIT 1", [req.params.id]);
    if (b) throw new ErrorHttp(400, "Esta meta ya tiene un bono aprobado; anula el bono primero");
    await consultar("DELETE FROM metas WHERE idmeta = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------
// OBJETIVOS DE ALUMNOS
// ---------------------------------------------------------------------
const TIPOS_OBJ = ["bajar_peso", "ganar_masa", "reducir_grasa", "mejorar_lesion", "reducir_dolor", "movilidad", "otro"];

function aObjetivo(f) {
  return {
    id: String(f.idobjetivo),
    memberId: String(f.idalumno),
    memberName: f.alumno,
    memberDni: f.dni,
    trainerId: f.identrenador ? String(f.identrenador) : null,
    trainerName: f.entrenador || "",
    area: f.area,
    type: f.tipo,
    description: f.descripcion,
    initialValue: f.valor_inicial != null ? Number(f.valor_inicial) : null,
    targetValue: f.valor_meta != null ? Number(f.valor_meta) : null,
    finalValue: f.valor_final != null ? Number(f.valor_final) : null,
    unit: f.unidad || "",
    start: String(f.fecha_inicio).slice(0, 10),
    controlDate: String(f.fecha_control).slice(0, 10),
    status: f.estado,
    achievementGranted: !!f.logro_otorgado,
    evaluatedBy: f.evaluador || "",
    evaluatedAt: f.fecha_evaluacion || null,
    observation: f.observacion || "",
    createdBy: f.creador || "",
  };
}

const SQL_OBJ = `
  SELECT o.*, a.dni, CONCAT(a.nombres, ' ', a.apellidos) AS alumno,
         CONCAT_WS(' ', e.nombres, e.apellidos) AS entrenador,
         CONCAT_WS(' ', ev.nombres, ev.apellidos) AS evaluador, u.usuario AS creador
    FROM objetivos_alumno o
    JOIN alumnos a ON a.idalumno = o.idalumno
    LEFT JOIN empleados e  ON e.idempleado  = o.identrenador
    LEFT JOIN empleados ev ON ev.idempleado = o.evaluado_por
    LEFT JOIN usuarios u   ON u.idusuario   = o.creado_por`;

/** Área que el usuario puede gestionar (admin: cualquiera) */
async function areaPermitida(req) {
  if (await esAdmin(req)) return null; // todas
  const u = await yo(req);
  if (u.rol === "nutritionist") return "nutricion";
  if (u.rol === "physio") return "fisioterapia";
  return "ninguna";
}

router.get("/objetivos", requierePermiso("goals", "ver"), async (req, res, next) => {
  try {
    const u = await yo(req);
    const cond = ["1 = 1"];
    const params = [];
    if (!(await esAdmin(req)) && u.rol === "trainer") {
      cond.push("o.identrenador = ?");
      params.push(u.idempleado || 0);
    } else if (!(await esAdmin(req)) && !["nutritionist", "physio"].includes(u.rol)) {
      return res.json([]);
    }
    if (/^\d+$/.test(req.query.alumno || "")) {
      cond.push("o.idalumno = ?");
      params.push(Number(req.query.alumno));
    }
    res.json((await consultar(`${SQL_OBJ} WHERE ${cond.join(" AND ")} ORDER BY o.estado = 'en_proceso' DESC, o.fecha_control, o.idobjetivo DESC LIMIT 2000`, params)).map(aObjetivo));
  } catch (e) {
    next(e);
  }
});

router.post("/objetivos", requierePermiso("goals", "crear"), async (req, res, next) => {
  try {
    const d = req.body || {};
    const permitida = await areaPermitida(req);
    if (permitida === "ninguna") throw new ErrorHttp(403, "Solo nutrición, fisioterapia o administración registran objetivos");
    const area = permitida || (d.area === "fisioterapia" ? "fisioterapia" : "nutricion");
    const [a] = await consultar("SELECT idalumno, identrenador FROM alumnos WHERE idalumno = ? AND activo = 1", [d.memberId]);
    if (!a) throw new ErrorHttp(400, "Elige un alumno");
    if (!TIPOS_OBJ.includes(d.type)) throw new ErrorHttp(400, "Elige el tipo de objetivo");
    const descripcion = txt(d.description, 255);
    if (!descripcion) throw new ErrorHttp(400, "Describe el objetivo (ej. bajar de 90 a 85 kg)");
    const control = fechaOk(d.controlDate);
    if (!control) throw new ErrorHttp(400, "Indica la fecha del próximo control");
    const u = await yo(req);
    const r = await consultar(
      `INSERT INTO objetivos_alumno (idalumno, identrenador, area, tipo, descripcion, valor_inicial, valor_meta, unidad,
                                     fecha_inicio, fecha_control, creado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        a.idalumno,
        Number(d.trainerId) || a.identrenador || null,
        area,
        d.type,
        descripcion,
        d.initialValue === "" || d.initialValue == null ? null : r2(d.initialValue),
        d.targetValue === "" || d.targetValue == null ? null : r2(d.targetValue),
        txt(d.unit, 20),
        fechaOk(d.start) || hoy(),
        control,
        req.usuario.idusuario,
      ],
    );
    void u;
    const [f] = await consultar(`${SQL_OBJ} WHERE o.idobjetivo = ?`, [r.insertId]);
    res.status(201).json(aObjetivo(f));
  } catch (e) {
    next(e);
  }
});

// POST /objetivos/:id/evaluar { status: conseguida|no_conseguida, finalValue, observation, grant }
router.post("/objetivos/:id(\\d+)/evaluar", requierePermiso("goals", "editar"), async (req, res, next) => {
  try {
    const d = req.body || {};
    const [o] = await consultar("SELECT * FROM objetivos_alumno WHERE idobjetivo = ?", [req.params.id]);
    if (!o) throw new ErrorHttp(404, "Objetivo no encontrado");
    const permitida = await areaPermitida(req);
    if (permitida === "ninguna" || (permitida && permitida !== o.area)) {
      throw new ErrorHttp(403, `Este objetivo lo evalúa ${o.area === "nutricion" ? "nutrición" : "fisioterapia"}`);
    }
    if (o.estado !== "en_proceso") throw new ErrorHttp(400, "Este objetivo ya fue evaluado");
    const estado = d.status === "conseguida" ? "conseguida" : d.status === "no_conseguida" ? "no_conseguida" : null;
    if (!estado) throw new ErrorHttp(400, "Indica si la meta se consiguió o no");
    const obs = txt(d.observation, 300);
    if (!obs) throw new ErrorHttp(400, "Escribe una observación del control");
    const u = await yo(req);
    const otorga = estado === "conseguida" && d.grant !== false && !!(Number(d.trainerId) || o.identrenador);
    await consultar(
      `UPDATE objetivos_alumno SET estado = ?, valor_final = ?, observacion = ?, logro_otorgado = ?, identrenador = COALESCE(?, identrenador),
              evaluado_por = ?, fecha_evaluacion = NOW() WHERE idobjetivo = ?`,
      [
        estado,
        d.finalValue === "" || d.finalValue == null ? null : r2(d.finalValue),
        obs,
        otorga ? 1 : 0,
        Number(d.trainerId) || null,
        u.idempleado || null,
        o.idobjetivo,
      ],
    );
    const [f] = await consultar(`${SQL_OBJ} WHERE o.idobjetivo = ?`, [o.idobjetivo]);
    res.json(aObjetivo(f));
  } catch (e) {
    next(e);
  }
});

router.post("/objetivos/:id(\\d+)/cancelar", requierePermiso("goals", "editar"), async (req, res, next) => {
  try {
    const [o] = await consultar("SELECT area, estado FROM objetivos_alumno WHERE idobjetivo = ?", [req.params.id]);
    if (!o) throw new ErrorHttp(404, "Objetivo no encontrado");
    const permitida = await areaPermitida(req);
    if (permitida === "ninguna" || (permitida && permitida !== o.area)) throw new ErrorHttp(403, "No puedes cancelar este objetivo");
    await consultar("UPDATE objetivos_alumno SET estado = 'cancelada', logro_otorgado = 0, observacion = ? WHERE idobjetivo = ?", [
      txt(req.body?.observation, 300) || "Cancelado",
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------
// LOGROS (ranking de entrenadores)
// ---------------------------------------------------------------------
router.get("/logros", requierePermiso("goals", "ver"), async (req, res, next) => {
  try {
    const [ini, fin] = mesARango(req.query.mes) || [fechaOk(req.query.desde) || "2000-01-01", fechaOk(req.query.hasta) || "2999-12-31"];
    const filas = await consultar(
      `SELECT e.idempleado, CONCAT_WS(' ', e.nombres, e.apellidos) AS nombre,
              SUM(o.area = 'nutricion') AS composicion, SUM(o.area = 'fisioterapia') AS lesion, COUNT(o.idobjetivo) AS total,
              (SELECT COUNT(*) FROM alumnos al WHERE al.identrenador = e.idempleado AND al.activo = 1) AS alumnos,
              (SELECT COUNT(*) FROM objetivos_alumno ox WHERE ox.identrenador = e.idempleado AND ox.estado = 'en_proceso') AS en_proceso
         FROM empleados e
         LEFT JOIN objetivos_alumno o ON o.identrenador = e.idempleado AND o.estado = 'conseguida' AND o.logro_otorgado = 1
              AND o.fecha_evaluacion >= ? AND o.fecha_evaluacion < ? + INTERVAL 1 DAY
        WHERE e.cargo = 'entrenador' AND e.activo = 1
        GROUP BY e.idempleado ORDER BY total DESC, nombre`,
      [ini, fin],
    );
    res.json(
      filas.map((f) => ({
        staffId: String(f.idempleado),
        name: f.nombre,
        composition: Number(f.composicion || 0),
        injury: Number(f.lesion || 0),
        total: Number(f.total || 0),
        students: Number(f.alumnos || 0),
        inProgress: Number(f.en_proceso || 0),
      })),
    );
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------
// BONOS
// ---------------------------------------------------------------------
router.get("/bonos", requierePermiso("goals", "ver"), async (req, res, next) => {
  try {
    const admin = await esAdmin(req);
    const u = await yo(req);
    const filas = await consultar(
      `SELECT b.*, m.tipo, m.fecha_inicio, m.fecha_fin, uu.usuario AS aprobador
         FROM bonos b LEFT JOIN metas m ON m.idmeta = b.idmeta LEFT JOIN usuarios uu ON uu.idusuario = b.aprobado_por
        ${admin ? "" : "WHERE b.idempleado = ?"}
        ORDER BY b.fecha_aprobacion DESC LIMIT 500`,
      admin ? [] : [u.idempleado || 0],
    );
    res.json(
      filas.map((b) => ({
        id: String(b.idbono),
        goalId: b.idmeta ? String(b.idmeta) : null,
        staffId: b.idempleado ? String(b.idempleado) : null,
        beneficiary: b.beneficiario,
        amount: Number(b.monto),
        reason: b.motivo,
        status: b.estado,
        approvedBy: b.aprobador || "",
        approvedAt: b.fecha_aprobacion,
        paidAt: b.fecha_pago,
        method: b.metodo_pago,
        period: b.fecha_inicio ? `${String(b.fecha_inicio).slice(0, 10)} a ${String(b.fecha_fin).slice(0, 10)}` : "",
      })),
    );
  } catch (e) {
    next(e);
  }
});

// POST /bonos { goalId, staffId?, amount? }  -> aprueba el bono de una meta cumplida
router.post("/bonos", soloAdmin, async (req, res, next) => {
  try {
    const d = req.body || {};
    const [meta] = await metasCompletas("m.idmeta = ?", [d.goalId]);
    if (!meta) throw new ErrorHttp(404, "Meta no encontrada");
    if (!meta.progress.cumplida) throw new ErrorHttp(400, "La meta aún no se cumple");
    const monto = r2(d.amount ?? meta.bonus);
    if (!(monto > 0)) throw new ErrorHttp(400, "Indica el monto del bono");
    let idemp = meta.type === "entrenador" ? Number(meta.staffId) : Number(d.staffId) || null;
    let beneficiario = meta.name;
    if (idemp) {
      const [e] = await consultar("SELECT CONCAT_WS(' ', nombres, apellidos) AS n FROM empleados WHERE idempleado = ?", [idemp]);
      if (!e) throw new ErrorHttp(400, "Trabajador no encontrado");
      beneficiario = e.n;
    }
    const [dup] = await consultar(
      "SELECT 1 FROM bonos WHERE idmeta = ? AND estado <> 'anulado' AND IFNULL(idempleado, 0) = IFNULL(?, 0) LIMIT 1",
      [meta.id, idemp],
    );
    if (dup) throw new ErrorHttp(409, "Ya se aprobó el bono de esta meta para esa persona");
    const motivo =
      meta.type === "recepcion"
        ? `Meta ${meta.name}: S/ ${meta.progress.objetivo} (${meta.start} a ${meta.end})`
        : `Meta de logros: ${meta.progress.logrado} de ${meta.progress.objetivo} (${meta.start} a ${meta.end})`;
    await consultar(
      "INSERT INTO bonos (idmeta, idempleado, beneficiario, monto, motivo, aprobado_por) VALUES (?,?,?,?,?,?)",
      [meta.id, idemp, beneficiario.slice(0, 120), monto, motivo.slice(0, 200), req.usuario.idusuario],
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /bonos/:id/pagar { method }  -> egreso en caja y bono pagado
router.post("/bonos/:id(\\d+)/pagar", soloAdmin, async (req, res, next) => {
  try {
    const metodo = ["efectivo", "tarjeta", "transferencia", "yape_plin"].includes(req.body?.method) ? req.body.method : "transferencia";
    await transaccion(async (cx) => {
      const [[b]] = await cx.query("SELECT * FROM bonos WHERE idbono = ? FOR UPDATE", [req.params.id]);
      if (!b) throw new ErrorHttp(404, "Bono no encontrado");
      if (b.estado !== "aprobado") throw new ErrorHttp(400, "Este bono no está pendiente de pago");
      await cx.query("UPDATE bonos SET estado = 'pagado', fecha_pago = NOW(), metodo_pago = ? WHERE idbono = ?", [metodo, b.idbono]);
      const [mov] = await cx.query(
        `INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, idreferencia, metodo_pago, idempleado, nombre_relacionado, idusuario_registro)
         VALUES ('egreso', 'sueldo', ?, ?, ?, ?, ?, ?, ?)`,
        [b.monto, `Bono: ${b.motivo}`.slice(0, 255), b.idbono, metodo, b.idempleado, b.beneficiario, req.usuario.idusuario],
      );
      // Solo el efectivo sale de la caja de recepción
      if (metodo !== "efectivo") await cx.query("UPDATE movimientos_caja SET idturno = NULL WHERE idmovimiento = ?", [mov.insertId]);
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/bonos/:id(\\d+)/anular", soloAdmin, async (req, res, next) => {
  try {
    const [b] = await consultar("SELECT estado FROM bonos WHERE idbono = ?", [req.params.id]);
    if (!b) throw new ErrorHttp(404, "Bono no encontrado");
    if (b.estado === "pagado") throw new ErrorHttp(400, "El bono ya fue pagado; regístralo como corrección en Finanzas");
    await consultar("UPDATE bonos SET estado = 'anulado' WHERE idbono = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
