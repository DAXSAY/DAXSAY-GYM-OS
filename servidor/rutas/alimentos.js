// =====================================================================
// CATÁLOGO DE ALIMENTOS (nutrición)
// Valores por 100 g + porción habitual (medida casera / de mano).
// El nutricionista agrega y edita; los del catálogo base solo se ocultan.
// =====================================================================
import { Router } from "express";
import { consultar } from "../db.js";
import { ErrorHttp, requierePermiso, soloPersonal, tienePermiso } from "../seguridad.js";

const router = Router();
router.use(soloPersonal);

export const CATEGORIAS = ["proteinas", "lacteos", "cereales", "tuberculos", "legumbres", "verduras", "frutas", "grasas", "bebidas", "suplementos", "platos", "otros"];

const aAlimento = (f) => ({
  id: String(f.idalimento),
  name: f.nombre,
  category: f.categoria,
  emoji: f.emoji || "",
  kcal100: Number(f.kcal_100g),
  protein100: Number(f.proteinas_100g),
  carbs100: Number(f.carbohidratos_100g),
  fats100: Number(f.grasas_100g),
  fiber100: Number(f.fibra_100g),
  portionGrams: Number(f.porcion_g),
  portionText: f.porcion_texto || "",
  sugar100: f.azucares_100g != null ? Number(f.azucares_100g) : null,
  sodium100: f.sodio_mg_100g != null ? Number(f.sodio_mg_100g) : null,
  glycemic: f.indice_glucemico || "",
  tags: f.etiquetas || "",
  notes: f.notas || "",
  custom: !!f.es_propio,
  active: !!f.activo,
  createdBy: f.creado_por_usuario || "",
});

const SQL = `SELECT a.*, u.usuario AS creado_por_usuario FROM alimentos a LEFT JOIN usuarios u ON u.idusuario = a.creado_por`;

function validar(d) {
  const nombre = String(d.name || "").trim().replace(/\s+/g, " ");
  if (nombre.length < 2 || nombre.length > 80) throw new ErrorHttp(400, "El nombre del alimento debe tener entre 2 y 80 caracteres");
  if (!CATEGORIAS.includes(d.category)) throw new ErrorHttp(400, "Elige la categoría del alimento");
  const num = (v, max, campo) => {
    const n = Number(v);
    if (v === "" || v === null || v === undefined || !Number.isFinite(n) || n < 0 || n > max) {
      throw new ErrorHttp(400, `Revisa ${campo} (0 a ${max})`);
    }
    return Math.round(n * 10) / 10;
  };
  const p = num(d.protein100, 100, "las proteínas por 100 g");
  const c = num(d.carbs100, 100, "los carbohidratos por 100 g");
  const g = num(d.fats100, 100, "las grasas por 100 g");
  if (p + c + g > 100.5) throw new ErrorHttp(400, "Proteínas + carbohidratos + grasas no pueden pasar de 100 g en 100 g de alimento");
  // Si no indican calorías, se calculan con Atwater (4/4/9)
  const kcal = d.kcal100 === "" || d.kcal100 === undefined || d.kcal100 === null ? Math.round(p * 4 + c * 4 + g * 9) : num(d.kcal100, 900, "las calorías por 100 g");
  const porcion = num(d.portionGrams || 100, 2000, "la porción en gramos");
  if (porcion <= 0) throw new ErrorHttp(400, "La porción debe ser mayor a 0 g");
  return [
    nombre,
    d.category,
    String(d.emoji || "").trim().slice(0, 8) || null,
    kcal,
    p,
    c,
    g,
    num(d.fiber100 || 0, 100, "la fibra por 100 g"),
    porcion,
    String(d.portionText || "").trim().slice(0, 60) || null,
    d.sugar100 === "" || d.sugar100 == null ? null : num(d.sugar100, 100, "los azúcares por 100 g"),
    d.sodium100 === "" || d.sodium100 == null ? null : num(d.sodium100, 40000, "el sodio (mg) por 100 g"),
    ["bajo", "medio", "alto"].includes(d.glycemic) ? d.glycemic : null,
    String(d.tags || "").trim().replace(/\s+/g, " ").slice(0, 120) || null,
    String(d.notes || "").trim().slice(0, 200) || null,
  ];
}

// GET /api/alimentos?todos=1  (todos=1 incluye los ocultos, para el nutricionista)
router.get("/", async (req, res, next) => {
  try {
    const todos = req.query.todos === "1" && (await tienePermiso(req.usuario.idusuario, "nutrition", "editar"));
    const filas = await consultar(`${SQL} ${todos ? "" : "WHERE a.activo = 1"} ORDER BY FIELD(a.categoria, ${CATEGORIAS.map(() => "?").join(",")}), a.nombre`, CATEGORIAS);
    res.json(filas.map(aAlimento));
  } catch (e) {
    next(e);
  }
});

// POST /api/alimentos  -> alimento propio del nutricionista
router.post("/", requierePermiso("nutrition", "crear"), async (req, res, next) => {
  try {
    const v = validar(req.body || {});
    const r = await consultar(
      `INSERT INTO alimentos (nombre, categoria, emoji, kcal_100g, proteinas_100g, carbohidratos_100g, grasas_100g, fibra_100g,
                              porcion_g, porcion_texto, azucares_100g, sodio_mg_100g, indice_glucemico, etiquetas, notas, es_propio, creado_por)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
      [...v, req.usuario.idusuario],
    );
    const [f] = await consultar(`${SQL} WHERE a.idalimento = ?`, [r.insertId]);
    res.status(201).json(aAlimento(f));
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return next(new ErrorHttp(409, "Ya existe un alimento con ese nombre (puede estar oculto)"));
    next(e);
  }
});

// PUT /api/alimentos/:id
router.put("/:id", requierePermiso("nutrition", "editar"), async (req, res, next) => {
  try {
    const v = validar(req.body || {});
    const r = await consultar(
      `UPDATE alimentos SET nombre=?, categoria=?, emoji=?, kcal_100g=?, proteinas_100g=?, carbohidratos_100g=?, grasas_100g=?,
              fibra_100g=?, porcion_g=?, porcion_texto=?, azucares_100g=?, sodio_mg_100g=?, indice_glucemico=?, etiquetas=?, notas=?,
              activo = IF(? IS NULL, activo, ?) WHERE idalimento = ?`,
      [...v, req.body?.active ?? null, req.body?.active === false ? 0 : 1, req.params.id],
    );
    if (!r.affectedRows) throw new ErrorHttp(404, "Alimento no encontrado");
    const [f] = await consultar(`${SQL} WHERE a.idalimento = ?`, [req.params.id]);
    res.json(aAlimento(f));
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return next(new ErrorHttp(409, "Ya existe un alimento con ese nombre"));
    next(e);
  }
});

// DELETE /api/alimentos/:id  -> lo oculta (las dietas que ya lo usan no cambian)
router.delete("/:id", requierePermiso("nutrition", "editar"), async (req, res, next) => {
  try {
    const [f] = await consultar("SELECT es_propio FROM alimentos WHERE idalimento = ?", [req.params.id]);
    if (!f) throw new ErrorHttp(404, "Alimento no encontrado");
    if (!f.es_propio && !(await tienePermiso(req.usuario.idusuario, "users", "editar"))) {
      throw new ErrorHttp(403, "Los alimentos del catálogo base solo los puede ocultar el administrador");
    }
    await consultar("UPDATE alimentos SET activo = 0 WHERE idalimento = ?", [req.params.id]);
    res.json({ mensaje: "Alimento ocultado" });
  } catch (e) {
    next(e);
  }
});

export default router;
