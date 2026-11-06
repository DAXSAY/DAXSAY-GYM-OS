// Planes, entrenadores y caja (movimientos de dinero)
import { Router } from "express";
import { consultar } from "../db.js";
import { ErrorHttp, exigirCajaAbierta, requierePermiso, soloPersonal, tienePermiso } from "../seguridad.js";
import { reglas, textoReglas } from "../congelamiento.js";

export const planes = Router();
export const entrenadores = Router();
export const caja = Router();
export const personal = Router();

// ---------------------------------------------------------------------
// PLANES
// ---------------------------------------------------------------------
function aPlan(f) {
  return {
    id: String(f.idplan),
    name: f.nombre,
    durationMonths: f.duracion_meses,
    durationDays: f.duracion_dias > 0 ? f.duracion_dias : f.duracion_meses * 30,
    price: Number(f.precio),
    description: f.descripcion || "",
    includesTrainer: !!f.incluye_entrenador,
    includesNutrition: !!f.incluye_nutricion,
    includesPhysio: !!f.incluye_fisioterapia,
    popular: !!f.destacado,
    features: f.caracteristicas ? f.caracteristicas.split("|").filter(Boolean) : [],
    freezeDays: Number(f.congelamiento_dias || 0),
    freezeParts: Number(f.congelamiento_partes || 1),
    freezeMinDays: Number(f.congelamiento_min_dias || 0),
    freezeRules: textoReglas(reglas(f)),
  };
}

/** Valida y normaliza las reglas de congelamiento que llegan del formulario */
function reglasCongelamiento(d) {
  const total = d.freezeDays === undefined || d.freezeDays === "" ? 0 : Number(d.freezeDays);
  if (!Number.isInteger(total) || total < 0 || total > 365) throw new ErrorHttp(400, "Los días de congelamiento deben estar entre 0 y 365");
  if (!total) return [0, 1, 0];
  const partes = Number(d.freezeParts || 1);
  if (!Number.isInteger(partes) || partes < 1 || partes > 12) throw new ErrorHttp(400, "Las partes de congelamiento deben ser de 1 a 12");
  if (partes === 1) return [total, 1, total];
  const minimo = Number(d.freezeMinDays || Math.floor(total / partes));
  if (!Number.isInteger(minimo) || minimo < 1) throw new ErrorHttp(400, "Indica el mínimo de días por congelamiento");
  if (minimo * 1 > total) throw new ErrorHttp(400, "El mínimo por congelamiento no puede ser mayor que el total de días");
  if (minimo * partes > total) {
    throw new ErrorHttp(400, `Con ${partes} partes de mínimo ${minimo} días se necesitan ${minimo * partes} días: sube el total o baja el mínimo/partes`);
  }
  return [total, partes, minimo];
}

function aFilaPlan(d) {
  const dias = Math.max(1, Number(d.durationDays || 0));
  const esMensual = dias >= 28 && dias % 30 === 0;
  return [
    String(d.name || "").trim(),
    esMensual ? dias / 30 : 0,
    esMensual ? 0 : dias,
    Number(d.price || 0),
    d.includesTrainer ? 1 : 0,
    d.includesNutrition ? 1 : 0,
    d.includesPhysio ? 1 : 0,
    d.description || null,
    Array.isArray(d.features) ? d.features.filter(Boolean).join("|") : null,
    d.popular ? 1 : 0,
    ...reglasCongelamiento(d),
  ];
}

planes.get("/", async (req, res, next) => {
  try {
    res.json((await consultar("SELECT * FROM planes WHERE activo = 1 ORDER BY precio")).map(aPlan));
  } catch (e) { next(e); }
});

planes.post("/", requierePermiso("memberships", "crear"), async (req, res, next) => {
  try {
    if (!String(req.body?.name || "").trim()) throw new ErrorHttp(400, "El nombre del plan es obligatorio");
    const r = await consultar(
      `INSERT INTO planes (nombre, duracion_meses, duracion_dias, precio, incluye_entrenador, incluye_nutricion,
                           incluye_fisioterapia, descripcion, caracteristicas, destacado,
                           congelamiento_dias, congelamiento_partes, congelamiento_min_dias)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, aFilaPlan(req.body));
    const [f] = await consultar("SELECT * FROM planes WHERE idplan = ?", [r.insertId]);
    res.status(201).json(aPlan(f));
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return next(new ErrorHttp(409, "Ya existe un plan con ese nombre"));
    next(e);
  }
});

planes.put("/:id", requierePermiso("memberships", "editar"), async (req, res, next) => {
  try {
    await consultar(
      `UPDATE planes SET nombre=?, duracion_meses=?, duracion_dias=?, precio=?, incluye_entrenador=?, incluye_nutricion=?,
                         incluye_fisioterapia=?, descripcion=?, caracteristicas=?, destacado=?,
                         congelamiento_dias=?, congelamiento_partes=?, congelamiento_min_dias=?
        WHERE idplan = ?`, [...aFilaPlan(req.body), req.params.id]);
    const [f] = await consultar("SELECT * FROM planes WHERE idplan = ?", [req.params.id]);
    res.json(aPlan(f));
  } catch (e) { next(e); }
});

// Se desactiva (no se borra) para conservar el historial de matrículas
planes.delete("/:id", requierePermiso("memberships", "eliminar"), async (req, res, next) => {
  try {
    await consultar("UPDATE planes SET activo = 0 WHERE idplan = ?", [req.params.id]);
    res.json({ mensaje: "Plan desactivado" });
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------------
// ENTRENADORES (personal con cargo entrenador)
// ---------------------------------------------------------------------
entrenadores.get("/", async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT * FROM empleados WHERE cargo = 'entrenador' AND activo = 1 ORDER BY nombres`);
    res.json(filas.map((f) => ({
      id: String(f.idempleado),
      name: `${f.nombres} ${f.apellidos}`.trim(),
      specialization: f.especialidad || f.titulo_cargo || "Entrenador",
      phone: f.telefono || "",
      email: f.correo || "",
      photoUrl: f.foto || null,
      bio: f.biografia || "",
      rating: Number(f.calificacion || 5),
      availableSchedule: f.horario || "",
    })));
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------------
// CAJA (ingresos y egresos)
// ---------------------------------------------------------------------
// Categorías de la app <-> categorías de la base
const A_BASE = {
  membership: "matricula", pos_sale: "venta", personal_training: "entrenamiento_personal",
  salary: "sueldo", staff_payroll: "sueldo", equipment_breakdown: "averia_equipo",
  rent: "alquiler", utilities: "servicios", supplies: "insumos", marketing: "marketing",
  maintenance: "mantenimiento", physiotherapy: "fisioterapia", nutrition: "nutricion",
  free_expense: "otros", other: "otros",
};
const A_APP = {
  matricula: "membership", venta: "pos_sale", entrenamiento_personal: "personal_training",
  sueldo: "salary", averia_equipo: "equipment_breakdown", alquiler: "rent", servicios: "utilities",
  insumos: "supplies", marketing: "marketing", mantenimiento: "maintenance",
  fisioterapia: "physiotherapy", nutricion: "nutrition", otros: "other",
};
const METODOS = ["efectivo", "tarjeta", "transferencia", "yape_plin"];

function aMovimiento(f) {
  return {
    id: String(f.idmovimiento),
    type: f.tipo === "ingreso" ? "income" : "expense",
    category: A_APP[f.categoria] || "other",
    amount: Number(f.monto),
    date: String(f.fecha).slice(0, 10),
    dateTime: f.fecha,
    paymentMethod: f.metodo_pago,
    description: f.descripcion,
    receiptNumber: f.comprobante,
    relatedMemberId: f.idalumno ? String(f.idalumno) : undefined,
    relatedMemberName: f.nombre_relacionado || undefined,
    equipmentName: f.equipo || undefined,
    automatic: ["matricula"].includes(f.categoria) && f.idreferencia != null,
    registeredBy: f.registrado_por || undefined,
    shiftId: f.idturno ? String(f.idturno) : undefined,
    shiftOpenedBy: f.turno_de || undefined,
  };
}

caja.get("/", soloPersonal, async (req, res, next) => {
  try {
    if (!(await tienePermiso(req.usuario.idusuario, ["finance", "dashboard"], "ver"))) return res.json([]);
    res.json(
      (
        await consultar(
          `SELECT m.*, TRIM(CONCAT(COALESCE(e.nombres, ''), ' ', COALESCE(e.apellidos, ''))) AS nombre_emp, u.usuario AS usuario_reg,
                  t.nombre_apertura AS turno_de
             FROM movimientos_caja m
             LEFT JOIN usuarios u ON u.idusuario = m.idusuario_registro
             LEFT JOIN empleados e ON e.idempleado = u.idempleado
             LEFT JOIN turnos_caja t ON t.idturno = m.idturno
            ORDER BY m.fecha DESC, m.idmovimiento DESC LIMIT 5000`,
        )
      ).map((f) => aMovimiento({ ...f, registrado_por: f.nombre_emp || f.usuario_reg })),
    );
  } catch (e) { next(e); }
});

caja.post("/", soloPersonal, async (req, res, next) => {
  try {
    const d = req.body || {};
    // Las ventas del POS las registra quien tiene acceso a la tienda; el resto, finanzas
    const modulo = d.category === "pos_sale" ? ["store", "finance"] : ["finance"];
    if (!(await tienePermiso(req.usuario.idusuario, modulo, "crear"))) {
      throw new ErrorHttp(403, "No tienes permiso para registrar movimientos de caja");
    }
    const monto = Number(d.amount);
    if (!(monto > 0)) throw new ErrorHttp(400, "El monto debe ser mayor a cero");
    await exigirCajaAbierta(req);
    const r = await consultar(
      `INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, metodo_pago, comprobante, idalumno,
                                     nombre_relacionado, equipo, idusuario_registro, fecha)
       VALUES (?,?,?,?,?,?,?,?,?,?, IFNULL(?, NOW()))`,
      [
        d.type === "income" ? "ingreso" : "egreso",
        A_BASE[d.category] || "otros",
        monto,
        String(d.description || "Movimiento de caja").slice(0, 255),
        METODOS.includes(d.paymentMethod) ? d.paymentMethod : "efectivo",
        d.receiptNumber || null,
        d.relatedMemberId && /^\d+$/.test(d.relatedMemberId) ? d.relatedMemberId : null,
        d.relatedMemberName || d.staffName || null,
        d.equipmentName || null,
        req.usuario.idusuario,
        d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? `${d.date} ${new Date().toTimeString().slice(0, 8)}` : null,
      ],
    );
    const [f] = await consultar("SELECT * FROM movimientos_caja WHERE idmovimiento = ?", [r.insertId]);
    res.status(201).json(aMovimiento(f));
  } catch (e) { next(e); }
});

caja.delete("/:id", requierePermiso("finance", "eliminar"), async (req, res, next) => {
  try {
    const [f] = await consultar("SELECT categoria, idreferencia FROM movimientos_caja WHERE idmovimiento = ?", [req.params.id]);
    if (f?.categoria === "matricula" && f.idreferencia) {
      throw new ErrorHttp(400, "Este ingreso pertenece a una matrícula. Para quitarlo, anula la matrícula.");
    }
    await consultar("DELETE FROM movimientos_caja WHERE idmovimiento = ?", [req.params.id]);
    res.json({ mensaje: "Movimiento eliminado" });
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------------
// PERSONAL (solo nombre y cargo; sin sueldos ni datos privados)
// Sirve para elegir especialistas en citas, fisioterapia y nutrición.
// ---------------------------------------------------------------------
personal.get("/", soloPersonal, async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT idempleado, nombres, apellidos, cargo, titulo_cargo
         FROM empleados WHERE activo = 1 ORDER BY nombres`,
    );
    res.json(
      filas.map((f) => ({
        id: String(f.idempleado),
        fullName: [f.nombres, f.apellidos].filter(Boolean).join(" "),
        cargo: f.cargo,
        title: f.titulo_cargo || f.cargo,
      })),
    );
  } catch (e) {
    next(e);
  }
});
