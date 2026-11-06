// =====================================================================
// INDICACIONES PARA EL ALUMNO
// Catálogo predeterminado (estiramientos 3 x 30 s, movilidad y calentamiento 2 x 15,
// postura y cuidados), plantillas para aplicar con un clic y asignación por alumno.
// Cada indicación va "antes" (calentamiento), "despues" (post entrenamiento) o "casa".
// =====================================================================
import { Router } from "express";
import { consultar, transaccion } from "../db.js";
import { ErrorHttp, soloPersonal, tienePermiso } from "../seguridad.js";
import { puedeVerAlumno } from "./alumnos.js";

const router = Router();
// Si la base de datos aún no tiene la actualización, se avisa qué script ejecutar
const faltaTabla = (e) =>
  e?.code === "ER_NO_SUCH_TABLE" ? new ErrorHttp(503, "Falta actualizar la base de datos: ejecuta base_datos/15_indicaciones.sql en MySQL Workbench") : e;

export const CATEGORIAS = ["calentamiento", "movilidad", "estiramiento", "postura", "cuidado"];
export const LUGARES = ["antes", "despues", "casa"];
const MODULOS = ["routines", "physiotherapy"];

const puedeIndicar = (req) => tienePermiso(req.usuario.idusuario, MODULOS, "editar");
async function exigirIndicar(req) {
  if (req.usuario.rol === "student" || !(await puedeIndicar(req))) {
    throw new ErrorHttp(403, "Solo el entrenador o el fisioterapeuta pueden dar indicaciones");
  }
}

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const aIndicacion = (f) => ({
  id: String(f.idindicacion),
  name: f.nombre,
  category: f.categoria,
  zone: f.zona,
  order: Number(f.orden),
  sets: num(f.series),
  reps: num(f.repeticiones),
  seconds: num(f.segundos),
  place: f.lugar_sugerido,
  detail: f.detalle || "",
  custom: !!f.es_propia,
});

/** Valida la dosis: series 1-10, repeticiones 1-100, segundos 5-600 (null = no aplica) */
function dosis(d) {
  const ent = (v, min, max, campo) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < min || n > max) throw new ErrorHttp(400, `Revisa ${campo} (${min} a ${max})`);
    return n;
  };
  return {
    series: ent(d.sets, 1, 10, "las series"),
    repeticiones: ent(d.reps, 1, 100, "las repeticiones"),
    segundos: ent(d.seconds, 5, 600, "los segundos"),
  };
}
const texto = (v, max) => {
  const t = String(v ?? "").trim().replace(/\s+/g, " ");
  return t ? t.slice(0, max) : null;
};

// ---------------------------------------------------------------------
// CATÁLOGO Y PLANTILLAS (solo personal)
// ---------------------------------------------------------------------
// GET /api/indicaciones/catalogo -> { items, plantillas, puedeIndicar }
router.get("/catalogo", soloPersonal, async (req, res, next) => {
  try {
    const [items, plantillas, pitems, permiso] = await Promise.all([
      consultar("SELECT * FROM indicaciones WHERE activo = 1 ORDER BY FIELD(categoria,'calentamiento','movilidad','estiramiento','postura','cuidado'), orden, nombre"),
      consultar("SELECT * FROM indicaciones_plantillas WHERE activo = 1 ORDER BY es_propia, idplantilla"),
      consultar(
        `SELECT pi.idplantilla, pi.idindicacion, pi.lugar FROM indicaciones_plantilla_items pi
           JOIN indicaciones i ON i.idindicacion = pi.idindicacion AND i.activo = 1
          ORDER BY pi.idplantilla, pi.orden`,
      ),
      puedeIndicar(req),
    ]);
    res.json({
      items: items.map(aIndicacion),
      plantillas: plantillas.map((p) => ({
        id: String(p.idplantilla),
        name: p.nombre,
        description: p.descripcion || "",
        custom: !!p.es_propia,
        items: pitems.filter((x) => x.idplantilla === p.idplantilla).map((x) => ({ id: String(x.idindicacion), place: x.lugar })),
      })),
      puedeIndicar: permiso,
    });
  } catch (e) {
    next(faltaTabla(e));
  }
});

// POST /api/indicaciones/catalogo { name, category, zone, order, sets, reps, seconds, place, detail }
router.post("/catalogo", soloPersonal, async (req, res, next) => {
  try {
    await exigirIndicar(req);
    const d = req.body || {};
    const nombre = texto(d.name, 80);
    if (!nombre || nombre.length < 3) throw new ErrorHttp(400, "Escribe el nombre de la indicación");
    if (!CATEGORIAS.includes(d.category)) throw new ErrorHttp(400, "Elige el tipo de indicación");
    const lugar = LUGARES.includes(d.place) ? d.place : d.category === "cuidado" ? "casa" : d.category === "estiramiento" ? "despues" : "antes";
    const { series, repeticiones, segundos } = dosis(d);
    const ORDEN_ZONA = { general: 0, cuello: 10, hombro: 20, brazo: 30, pecho: 40, espalda: 50, tronco: 60, cadera: 70, gluteo: 75, muslo: 80, pierna: 90, tobillo: 95 };
    const zona = Object.hasOwn(ORDEN_ZONA, d.zone) ? d.zone : "general";
    try {
      const r = await consultar(
        `INSERT INTO indicaciones (nombre, categoria, zona, orden, series, repeticiones, segundos, lugar_sugerido, detalle, es_propia, creado_por)
         VALUES (?,?,?,?,?,?,?,?,?,1,?)`,
        [nombre, d.category, zona, ORDEN_ZONA[zona] + 5, series, repeticiones, segundos, lugar, texto(d.detail, 255), req.usuario.idusuario],
      );
      const [f] = await consultar("SELECT * FROM indicaciones WHERE idindicacion = ?", [r.insertId]);
      res.status(201).json(aIndicacion(f));
    } catch (e) {
      if (e.code !== "ER_DUP_ENTRY") throw e;
      // Si existía y se había quitado, se reactiva con los datos nuevos
      const r = await consultar(
        `UPDATE indicaciones SET categoria = ?, zona = ?, orden = ?, series = ?, repeticiones = ?, segundos = ?, lugar_sugerido = ?,
                detalle = ?, activo = 1, creado_por = ? WHERE nombre = ? AND activo = 0 AND es_propia = 1`,
        [d.category, zona, ORDEN_ZONA[zona] + 5, series, repeticiones, segundos, lugar, texto(d.detail, 255), req.usuario.idusuario, nombre],
      );
      if (!r.affectedRows) throw new ErrorHttp(409, "Ya existe una indicación con ese nombre");
      const [f] = await consultar("SELECT * FROM indicaciones WHERE nombre = ?", [nombre]);
      res.status(201).json(aIndicacion(f));
    }
  } catch (e) {
    next(faltaTabla(e));
  }
});

// DELETE /api/indicaciones/catalogo/:id -> la oculta (las asignaciones antiguas se conservan)
router.delete("/catalogo/:id", soloPersonal, async (req, res, next) => {
  try {
    await exigirIndicar(req);
    const r = await consultar("UPDATE indicaciones SET activo = 0 WHERE idindicacion = ? AND es_propia = 1", [req.params.id]);
    if (!r.affectedRows) throw new ErrorHttp(400, "Solo se pueden quitar las indicaciones agregadas por el gimnasio");
    res.json({ ok: true });
  } catch (e) {
    next(faltaTabla(e));
  }
});

// POST /api/indicaciones/plantillas { name, description, items: [{ id, place }] }
router.post("/plantillas", soloPersonal, async (req, res, next) => {
  try {
    await exigirIndicar(req);
    const d = req.body || {};
    const nombre = texto(d.name, 80);
    if (!nombre || nombre.length < 3) throw new ErrorHttp(400, "Ponle un nombre a la plantilla");
    const items = (Array.isArray(d.items) ? d.items : []).filter((x) => /^\d+$/.test(String(x?.id)) && LUGARES.includes(x?.place));
    if (!items.length) throw new ErrorHttp(400, "La plantilla no tiene indicaciones");
    const id = await transaccion(async (cx) => {
      let idp;
      try {
        const [r] = await cx.execute(
          "INSERT INTO indicaciones_plantillas (nombre, descripcion, es_propia, creado_por) VALUES (?,?,1,?)",
          [nombre, texto(d.description, 200), req.usuario.idusuario],
        );
        idp = r.insertId;
      } catch (e) {
        if (e.code !== "ER_DUP_ENTRY") throw e;
        // Una plantilla propia que se había quitado se reactiva con el contenido nuevo
        const [[viejo]] = await cx.execute("SELECT idplantilla FROM indicaciones_plantillas WHERE nombre = ? AND activo = 0 AND es_propia = 1", [nombre]);
        if (!viejo) throw new ErrorHttp(409, "Ya existe una plantilla con ese nombre");
        idp = viejo.idplantilla;
        await cx.execute("UPDATE indicaciones_plantillas SET activo = 1, descripcion = ?, creado_por = ? WHERE idplantilla = ?", [texto(d.description, 200), req.usuario.idusuario, idp]);
        await cx.execute("DELETE FROM indicaciones_plantilla_items WHERE idplantilla = ?", [idp]);
      }
      let orden = 0;
      for (const it of items.slice(0, 80)) {
        await cx.execute(
          "INSERT IGNORE INTO indicaciones_plantilla_items (idplantilla, idindicacion, lugar, orden) VALUES (?,?,?,?)",
          [idp, it.id, it.place, ++orden],
        );
      }
      return idp;
    });
    res.status(201).json({ id: String(id) });
  } catch (e) {
    next(faltaTabla(e));
  }
});

router.delete("/plantillas/:id", soloPersonal, async (req, res, next) => {
  try {
    await exigirIndicar(req);
    const r = await consultar("UPDATE indicaciones_plantillas SET activo = 0 WHERE idplantilla = ? AND es_propia = 1", [req.params.id]);
    if (!r.affectedRows) throw new ErrorHttp(400, "Solo se pueden quitar las plantillas creadas por el gimnasio");
    res.json({ ok: true });
  } catch (e) {
    next(faltaTabla(e));
  }
});

// ---------------------------------------------------------------------
// INDICACIONES DE UN ALUMNO
// ---------------------------------------------------------------------
async function asignaciones(idalumno, soloVigente) {
  const cab = await consultar(
    `SELECT ai.*, u.usuario, COALESCE(NULLIF(TRIM(CONCAT(IFNULL(e.nombres,''),' ',IFNULL(e.apellidos,''))),''), u.usuario) AS profesional,
            r.nombre AS rol
       FROM alumno_indicaciones ai
       LEFT JOIN usuarios u ON u.idusuario = ai.idusuario
       LEFT JOIN empleados e ON e.idempleado = u.idempleado
       LEFT JOIN roles r ON r.idrol = u.idrol
      WHERE ai.idalumno = ? ${soloVigente ? "AND ai.vigente = 1" : ""}
      ORDER BY ai.vigente DESC, ai.fecha DESC, ai.idasignacion DESC
      LIMIT ${soloVigente ? 1 : 20}`,
    [idalumno],
  );
  if (!cab.length) return [];
  const ids = cab.map((c) => Number(c.idasignacion));
  const items = await consultar(
    `SELECT * FROM alumno_indicacion_items WHERE idasignacion IN (${ids.map(() => "?").join(",")}) ORDER BY idasignacion, orden`,
    ids,
  );
  return cab.map((c) => ({
    id: String(c.idasignacion),
    date: c.fecha,
    current: !!c.vigente,
    notes: c.notas || "",
    by: c.profesional || "",
    byRole: c.rol || "",
    items: items
      .filter((i) => i.idasignacion === c.idasignacion)
      .map((i) => ({
        id: i.idindicacion ? String(i.idindicacion) : null,
        name: i.nombre,
        category: i.categoria,
        place: i.lugar,
        sets: num(i.series),
        reps: num(i.repeticiones),
        seconds: num(i.segundos),
        detail: i.detalle || "",
      })),
  }));
}

// GET /api/indicaciones/alumno/:id -> { vigente, historial }
router.get("/alumno/:id", async (req, res, next) => {
  try {
    if (!(await puedeVerAlumno(req, req.params.id))) throw new ErrorHttp(403, "No tienes permiso para ver este alumno");
    const todas = await asignaciones(req.params.id, req.usuario.rol === "student");
    res.json({ vigente: todas.find((a) => a.current) || null, historial: req.usuario.rol === "student" ? [] : todas.filter((a) => !a.current) });
  } catch (e) {
    next(faltaTabla(e));
  }
});

// POST /api/indicaciones/alumno/:id { items: [{ id, name, category, place, sets, reps, seconds, detail }], notes }
//  -> reemplaza la indicación vigente (la anterior queda en el historial)
router.post("/alumno/:id", soloPersonal, async (req, res, next) => {
  try {
    await exigirIndicar(req);
    const d = req.body || {};
    const lista = Array.isArray(d.items) ? d.items.slice(0, 80) : [];
    const notas = texto(d.notes, 500);
    if (!lista.length && !notas) throw new ErrorHttp(400, "Elige al menos una indicación");
    const items = lista.map((it, i) => {
      const nombre = texto(it.name, 80);
      if (!nombre) throw new ErrorHttp(400, "Hay una indicación sin nombre");
      if (!CATEGORIAS.includes(it.category)) throw new ErrorHttp(400, `Tipo inválido en "${nombre}"`);
      if (!LUGARES.includes(it.place)) throw new ErrorHttp(400, `Indica si "${nombre}" es antes, después o en casa`);
      return { id: /^\d+$/.test(String(it.id)) ? it.id : null, nombre, categoria: it.category, lugar: it.place, ...dosis(it), detalle: texto(it.detail, 255), orden: i + 1 };
    });
    await transaccion(async (cx) => {
      const [[al]] = await cx.execute("SELECT idalumno FROM alumnos WHERE idalumno = ? FOR UPDATE", [req.params.id]);
      if (!al) throw new ErrorHttp(404, "Alumno no encontrado");
      await cx.execute("UPDATE alumno_indicaciones SET vigente = 0 WHERE idalumno = ? AND vigente = 1", [req.params.id]);
      const [r] = await cx.execute(
        "INSERT INTO alumno_indicaciones (idalumno, idusuario, notas) VALUES (?,?,?)",
        [req.params.id, req.usuario.idusuario, notas],
      );
      for (const it of items) {
        await cx.execute(
          `INSERT INTO alumno_indicacion_items (idasignacion, idindicacion, nombre, categoria, lugar, series, repeticiones, segundos, detalle, orden)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [r.insertId, it.id, it.nombre, it.categoria, it.lugar, it.series, it.repeticiones, it.segundos, it.detalle, it.orden],
        );
      }
    });
    const todas = await asignaciones(req.params.id, false);
    res.status(201).json({ vigente: todas.find((a) => a.current) || null, historial: todas.filter((a) => !a.current) });
  } catch (e) {
    next(faltaTabla(e));
  }
});

// DELETE /api/indicaciones/alumno/:id -> deja al alumno sin indicaciones vigentes (queda en historial)
router.delete("/alumno/:id", soloPersonal, async (req, res, next) => {
  try {
    await exigirIndicar(req);
    await consultar("UPDATE alumno_indicaciones SET vigente = 0 WHERE idalumno = ? AND vigente = 1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(faltaTabla(e));
  }
});

export default router;
