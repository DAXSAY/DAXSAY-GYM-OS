// =====================================================================
// TIENDA (POS): productos, ventas, anulaciones, kárdex y reportes.
// La fuente de verdad es MySQL: `productos`, `ventas`, `venta_detalle` y
// `movimientos_inventario`. Los triggers de la base descuentan el stock
// (bloqueando la fila del producto), suman el total de la venta y
// registran el ingreso en caja dentro del turno abierto.
// =====================================================================
import { Router } from "express";
import { consultar, pool } from "../db.js";
import { ErrorHttp, exigirCajaAbierta, requierePermiso, soloPersonal, tienePermiso } from "../seguridad.js";

const router = Router();
router.use(soloPersonal);

const CATEGORIAS = ["bebidas", "suplementos", "snacks", "accesorios", "ropa"];
const METODOS = ["efectivo", "tarjeta", "transferencia", "yape_plin"];
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const vacio = (v) => v === undefined || v === null || String(v).trim() === "";
const txt = (v, max) => (vacio(v) ? null : String(v).trim().slice(0, max));
const fechaOk = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : null);

const aProducto = (f) => ({
  id: String(f.idproducto),
  name: f.nombre,
  category: f.categoria,
  brand: f.marca || "",
  purchaseCost: Number(f.precio_compra),
  salePrice: Number(f.precio_venta),
  stock: Number(f.stock),
  minStockAlert: Number(f.stock_minimo),
  barcode: f.codigo_barras || "",
  description: f.descripcion || "",
  image: f.imagen || "",
  soldLast30: Number(f.vendidos_30 || 0),
});

const SQL_PRODUCTOS = `
  SELECT p.*,
         (SELECT IFNULL(SUM(d.cantidad), 0) FROM venta_detalle d JOIN ventas v ON v.idventa = d.idventa
           WHERE d.idproducto = p.idproducto AND v.anulada = 0 AND v.fecha >= NOW() - INTERVAL 30 DAY) AS vendidos_30
    FROM productos p`;

async function producto(id) {
  const [f] = await consultar(`${SQL_PRODUCTOS} WHERE p.idproducto = ?`, [id]);
  if (!f) throw new ErrorHttp(404, "Producto no encontrado");
  return aProducto(f);
}

function datosProducto(d, parcial = false) {
  const nombre = txt(d.name, 100);
  if (!parcial && !nombre) throw new ErrorHttp(400, "Escribe el nombre del producto");
  const precio = Number(d.salePrice);
  const costo = Number(d.purchaseCost);
  if (!parcial && !(precio >= 0)) throw new ErrorHttp(400, "Precio de venta no válido");
  return {
    nombre,
    categoria: CATEGORIAS.includes(d.category) ? d.category : "accesorios",
    marca: txt(d.brand, 60),
    precio_compra: costo >= 0 ? r2(costo) : 0,
    precio_venta: precio >= 0 ? r2(precio) : 0,
    stock_minimo: Math.max(0, Math.round(Number(d.minStockAlert) || 0)),
    codigo_barras: txt(d.barcode, 40),
    descripcion: txt(d.description, 300),
    imagen: vacio(d.image) ? null : String(d.image).slice(0, 2_000_000),
  };
}

async function kardex(cx, { idproducto, tipo, cantidad, stock, costo = null, motivo = null, idventa = null, idusuario }) {
  await cx.query(
    `INSERT INTO movimientos_inventario (idproducto, tipo, cantidad, stock_resultante, costo_unitario, motivo, idventa, idusuario)
     VALUES (?,?,?,?,?,?,?,?)`,
    [idproducto, tipo, cantidad, stock, costo, motivo, idventa, idusuario],
  );
}

const errorDuplicado = (e) => {
  if (e.code !== "ER_DUP_ENTRY") return e;
  return new ErrorHttp(409, /codigo_barras/.test(e.sqlMessage) ? "Ese código de barras ya está en otro producto" : "Ya existe un producto con ese nombre");
};

// ---------------------------------------------------------------------
// PRODUCTOS
// ---------------------------------------------------------------------
router.get("/productos", requierePermiso(["store", "finance", "dashboard"], "ver"), async (req, res, next) => {
  try {
    res.json((await consultar(`${SQL_PRODUCTOS} WHERE p.activo = 1 ORDER BY p.categoria, p.nombre`)).map(aProducto));
  } catch (e) {
    next(e);
  }
});

router.post("/productos", requierePermiso("store", "crear"), async (req, res, next) => {
  const cx = await pool.getConnection();
  try {
    const d = datosProducto(req.body || {});
    const stock = Math.max(0, Math.round(Number(req.body?.stock) || 0));
    await cx.beginTransaction();
    const [r] = await cx.query(
      `INSERT INTO productos (nombre, categoria, marca, precio_compra, precio_venta, stock, stock_minimo, codigo_barras, descripcion, imagen)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [d.nombre, d.categoria, d.marca, d.precio_compra, d.precio_venta, stock, d.stock_minimo, d.codigo_barras, d.descripcion, d.imagen],
    );
    await kardex(cx, { idproducto: r.insertId, tipo: "inicial", cantidad: stock, stock, costo: d.precio_compra, motivo: "Producto nuevo", idusuario: req.usuario.idusuario });
    await cx.commit();
    res.status(201).json(await producto(r.insertId));
  } catch (e) {
    await cx.rollback().catch(() => {});
    next(errorDuplicado(e));
  } finally {
    cx.release();
  }
});

router.put("/productos/:id(\\d+)", requierePermiso("store", "editar"), async (req, res, next) => {
  const cx = await pool.getConnection();
  try {
    const d = datosProducto(req.body || {});
    await cx.beginTransaction();
    const [[actual]] = await cx.query("SELECT stock FROM productos WHERE idproducto = ? AND activo = 1 FOR UPDATE", [req.params.id]);
    if (!actual) throw new ErrorHttp(404, "Producto no encontrado");
    await cx.query(
      `UPDATE productos SET nombre = ?, categoria = ?, marca = ?, precio_compra = ?, precio_venta = ?, stock_minimo = ?,
              codigo_barras = ?, descripcion = ?, imagen = ? WHERE idproducto = ?`,
      [d.nombre, d.categoria, d.marca, d.precio_compra, d.precio_venta, d.stock_minimo, d.codigo_barras, d.descripcion, d.imagen, req.params.id],
    );
    // Si en la edición se cambió el stock, queda como ajuste en el kárdex
    const nuevo = req.body?.stock;
    if (nuevo !== undefined && Math.round(Number(nuevo)) !== Number(actual.stock) && Number(nuevo) >= 0) {
      const stock = Math.round(Number(nuevo));
      await cx.query("UPDATE productos SET stock = ? WHERE idproducto = ?", [stock, req.params.id]);
      await kardex(cx, { idproducto: Number(req.params.id), tipo: "ajuste", cantidad: stock - Number(actual.stock), stock, motivo: "Edición del producto", idusuario: req.usuario.idusuario });
    }
    await cx.commit();
    res.json(await producto(req.params.id));
  } catch (e) {
    await cx.rollback().catch(() => {});
    next(errorDuplicado(e));
  } finally {
    cx.release();
  }
});

// Se desactiva (no se borra) para conservar el historial de ventas
router.delete("/productos/:id(\\d+)", requierePermiso("store", "eliminar"), async (req, res, next) => {
  try {
    await consultar("UPDATE productos SET activo = 0, codigo_barras = NULL WHERE idproducto = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /productos/:id/movimiento { tipo: entrada|merma|ajuste, cantidad, costo, motivo }
//  entrada: suma unidades (recepción puede registrar mercadería)
//  merma:   resta unidades (vencido, roto, consumo interno)
//  ajuste:  "cantidad" es el stock contado en el inventario físico
router.post("/productos/:id(\\d+)/movimiento", async (req, res, next) => {
  const cx = await pool.getConnection();
  try {
    const d = req.body || {};
    const tipo = ["entrada", "merma", "ajuste"].includes(d.tipo) ? d.tipo : null;
    if (!tipo) throw new ErrorHttp(400, "Tipo de movimiento no válido");
    if (!(await tienePermiso(req.usuario.idusuario, "store", tipo === "entrada" ? "crear" : "editar"))) {
      throw new ErrorHttp(403, "No tienes permiso para este movimiento de inventario");
    }
    const cantidad = Math.round(Number(d.cantidad));
    if (!(cantidad >= 0) || (tipo !== "ajuste" && cantidad === 0)) throw new ErrorHttp(400, "Ingresa una cantidad válida");
    const motivo = txt(d.motivo, 200);
    if (tipo !== "entrada" && !motivo) throw new ErrorHttp(400, "Escribe el motivo");

    await cx.beginTransaction();
    const [[p]] = await cx.query("SELECT stock, nombre FROM productos WHERE idproducto = ? AND activo = 1 FOR UPDATE", [req.params.id]);
    if (!p) throw new ErrorHttp(404, "Producto no encontrado");
    const delta = tipo === "entrada" ? cantidad : tipo === "merma" ? -cantidad : cantidad - Number(p.stock);
    const stock = Number(p.stock) + delta;
    if (stock < 0) throw new ErrorHttp(400, `Solo hay ${p.stock} unidades de ${p.nombre}`);
    const costo = tipo === "entrada" && Number(d.costo) > 0 ? r2(d.costo) : null;
    await cx.query(
      `UPDATE productos SET stock = ?${costo ? ", precio_compra = ?" : ""} WHERE idproducto = ?`,
      costo ? [stock, costo, req.params.id] : [stock, req.params.id],
    );
    await kardex(cx, { idproducto: Number(req.params.id), tipo, cantidad: delta, stock, costo, motivo: motivo || "Ingreso de mercadería", idusuario: req.usuario.idusuario });
    await cx.commit();
    res.json(await producto(req.params.id));
  } catch (e) {
    await cx.rollback().catch(() => {});
    next(e);
  } finally {
    cx.release();
  }
});

router.get("/productos/:id(\\d+)/kardex", requierePermiso(["store", "finance"], "ver"), async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT m.*, u.usuario, v.comprobante
         FROM movimientos_inventario m
         LEFT JOIN usuarios u ON u.idusuario = m.idusuario
         LEFT JOIN ventas v ON v.idventa = m.idventa
        WHERE m.idproducto = ? ORDER BY m.fecha DESC, m.idmovimiento_inv DESC LIMIT 300`,
      [req.params.id],
    );
    res.json(
      filas.map((f) => ({
        id: String(f.idmovimiento_inv),
        type: f.tipo,
        quantity: Number(f.cantidad),
        stockAfter: Number(f.stock_resultante),
        unitCost: f.costo_unitario != null ? Number(f.costo_unitario) : null,
        reason: f.motivo || "",
        receipt: f.comprobante || null,
        user: f.usuario || "",
        dateTime: f.fecha,
      })),
    );
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------
// VENTAS
// ---------------------------------------------------------------------
async function ventasCompletas(where, params) {
  const ventas = await consultar(
    `SELECT v.*, CONCAT_WS(' ', a.nombres, a.apellidos) AS alumno,
            COALESCE(CONCAT_WS(' ', e.nombres, e.apellidos), u.usuario) AS vendedor,
            mc.idturno
       FROM ventas v
       LEFT JOIN alumnos a ON a.idalumno = v.idalumno
       LEFT JOIN usuarios u ON u.idusuario = v.idusuario
       LEFT JOIN empleados e ON e.idempleado = v.idempleado
       LEFT JOIN movimientos_caja mc ON mc.categoria = 'venta' AND mc.idreferencia = v.idventa
      WHERE ${where}
      ORDER BY v.fecha DESC, v.idventa DESC LIMIT 1000`,
    params,
  );
  if (!ventas.length) return [];
  const ids = ventas.map((v) => v.idventa);
  const detalle = await consultar(
    `SELECT d.*, p.nombre, p.precio_compra FROM venta_detalle d JOIN productos p ON p.idproducto = d.idproducto
      WHERE d.idventa IN (${ids.map(() => "?").join(",")}) ORDER BY d.idventa_detalle`,
    ids,
  );
  return ventas.map((v) => ({
    id: String(v.idventa),
    receiptNumber: v.comprobante,
    dateTime: v.fecha,
    date: String(v.fecha).slice(0, 10),
    paymentMethod: v.metodo_pago,
    total: Number(v.total),
    customer: v.alumno || v.cliente || "Cliente general",
    memberId: v.idalumno ? String(v.idalumno) : null,
    seller: v.vendedor || "",
    shiftId: v.idturno ? String(v.idturno) : null,
    voided: !!v.anulada,
    voidReason: v.motivo_anulacion || "",
    voidedAt: v.fecha_anulacion || null,
    items: detalle
      .filter((d) => d.idventa === v.idventa)
      .map((d) => ({
        productId: String(d.idproducto),
        productName: d.nombre,
        quantity: Number(d.cantidad),
        unitPrice: Number(d.precio_unitario),
        total: Number(d.subtotal),
        unitCost: Number(d.precio_compra),
      })),
  }));
}

// POST /ventas { items: [{productId, quantity}], paymentMethod, memberId?, customerName? }
router.post("/ventas", requierePermiso(["store", "finance"], "crear"), async (req, res, next) => {
  const cx = await pool.getConnection();
  try {
    const d = req.body || {};
    // Suma cantidades del mismo producto
    const mapa = new Map();
    for (const it of Array.isArray(d.items) ? d.items : []) {
      const id = Number(it.productId);
      const q = Math.round(Number(it.quantity));
      if (!Number.isInteger(id) || !(q > 0)) throw new ErrorHttp(400, "Hay un producto o cantidad no válida en el carrito");
      mapa.set(id, (mapa.get(id) || 0) + q);
    }
    if (!mapa.size) throw new ErrorHttp(400, "El carrito está vacío");
    await exigirCajaAbierta(req);

    await cx.beginTransaction();
    // Bloquea los productos (orden fijo para evitar bloqueos cruzados) y valida stock
    const ids = [...mapa.keys()].sort((a, b) => a - b);
    const [prods] = await cx.query(
      `SELECT idproducto, nombre, stock FROM productos WHERE activo = 1 AND idproducto IN (${ids.map(() => "?").join(",")}) FOR UPDATE`,
      ids,
    );
    for (const id of ids) {
      const p = prods.find((x) => x.idproducto === id);
      if (!p) throw new ErrorHttp(400, "Un producto del carrito ya no existe. Actualiza la pantalla.");
      if (Number(p.stock) < mapa.get(id)) {
        throw new ErrorHttp(409, `Stock insuficiente: ${p.nombre} tiene ${p.stock} unidad(es)`);
      }
    }
    let idalumno = null;
    if (/^\d+$/.test(String(d.memberId || ""))) {
      const [[a]] = await cx.query("SELECT idalumno FROM alumnos WHERE idalumno = ?", [Number(d.memberId)]);
      idalumno = a?.idalumno || null;
    }
    const [[u]] = await cx.query("SELECT idempleado FROM usuarios WHERE idusuario = ?", [req.usuario.idusuario]);
    const [rv] = await cx.query(
      `INSERT INTO ventas (idalumno, idempleado, idusuario, metodo_pago, cliente, comprobante) VALUES (?,?,?,?,?, 'T001-PEND')`,
      [idalumno, u?.idempleado || null, req.usuario.idusuario, METODOS.includes(d.paymentMethod) ? d.paymentMethod : "efectivo", idalumno ? null : txt(d.customerName, 120)],
    );
    const idventa = rv.insertId;
    // Ticket correlativo (interno, no es comprobante SUNAT)
    await cx.query("UPDATE ventas SET comprobante = CONCAT('T001-', LPAD(idventa, 6, '0')) WHERE idventa = ?", [idventa]);
    for (const id of ids) {
      // El trigger toma el precio del producto, descuenta stock y suma el total;
      // al cambiar el total se registra el ingreso en caja (turno abierto).
      await cx.query("INSERT INTO venta_detalle (idventa, idproducto, cantidad) VALUES (?,?,?)", [idventa, id, mapa.get(id)]);
      const [[p]] = await cx.query("SELECT stock FROM productos WHERE idproducto = ?", [id]);
      await kardex(cx, { idproducto: id, tipo: "venta", cantidad: -mapa.get(id), stock: Number(p.stock), idventa, idusuario: req.usuario.idusuario });
    }
    await cx.commit();
    const [venta] = await ventasCompletas("v.idventa = ?", [idventa]);
    res.status(201).json(venta);
  } catch (e) {
    await cx.rollback().catch(() => {});
    next(e);
  } finally {
    cx.release();
  }
});

// GET /ventas?desde=&hasta=
router.get("/ventas", requierePermiso(["store", "finance"], "ver"), async (req, res, next) => {
  try {
    const desde = fechaOk(req.query.desde) || new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
    const hasta = fechaOk(req.query.hasta) || "2999-12-31";
    res.json(await ventasCompletas("v.fecha >= ? AND v.fecha < ? + INTERVAL 1 DAY", [desde, hasta]));
  } catch (e) {
    next(e);
  }
});

// POST /ventas/:id/anular { motivo }  (administración)
// Solo ventas del turno de caja abierto: lo cobrado en un turno ya cerrado
// se devuelve con un egreso en "Caja por Turnos".
router.post("/ventas/:id(\\d+)/anular", requierePermiso(["store", "finance"], "eliminar"), async (req, res, next) => {
  const cx = await pool.getConnection();
  try {
    const motivo = txt(req.body?.motivo, 200);
    if (!motivo) throw new ErrorHttp(400, "Escribe el motivo de la anulación");
    await cx.beginTransaction();
    const [[v]] = await cx.query("SELECT * FROM ventas WHERE idventa = ? FOR UPDATE", [req.params.id]);
    if (!v) throw new ErrorHttp(404, "Venta no encontrada");
    if (v.anulada) throw new ErrorHttp(400, "Esta venta ya fue anulada");
    const [[mov]] = await cx.query(
      `SELECT mc.idturno, t.estado FROM movimientos_caja mc LEFT JOIN turnos_caja t ON t.idturno = mc.idturno
        WHERE mc.categoria = 'venta' AND mc.idreferencia = ? LIMIT 1`,
      [v.idventa],
    );
    if (mov?.idturno && mov.estado !== "abierto") {
      throw new ErrorHttp(409, "Esta venta pertenece a un turno de caja ya cerrado. Registra la devolución como gasto en 'Caja por Turnos'.");
    }
    const [det] = await cx.query("SELECT idproducto, cantidad FROM venta_detalle WHERE idventa = ? ORDER BY idproducto", [v.idventa]);
    for (const d of det) {
      await cx.query("UPDATE productos SET stock = stock + ? WHERE idproducto = ?", [d.cantidad, d.idproducto]);
      const [[p]] = await cx.query("SELECT stock FROM productos WHERE idproducto = ?", [d.idproducto]);
      await kardex(cx, { idproducto: d.idproducto, tipo: "anulacion", cantidad: Number(d.cantidad), stock: Number(p.stock), motivo, idventa: v.idventa, idusuario: req.usuario.idusuario });
    }
    // El trigger de ventas retira el ingreso de caja al marcarla anulada
    await cx.query(
      "UPDATE ventas SET anulada = 1, motivo_anulacion = ?, fecha_anulacion = NOW(), anulada_por = ? WHERE idventa = ?",
      [motivo, req.usuario.idusuario, v.idventa],
    );
    await cx.commit();
    const [venta] = await ventasCompletas("v.idventa = ?", [v.idventa]);
    res.json(venta);
  } catch (e) {
    await cx.rollback().catch(() => {});
    next(e);
  } finally {
    cx.release();
  }
});

// GET /resumen?desde=&hasta=  -> totales, métodos, productos más vendidos y margen
router.get("/resumen", requierePermiso(["store", "finance"], "ver"), async (req, res, next) => {
  try {
    const desde = fechaOk(req.query.desde) || new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
    const hasta = fechaOk(req.query.hasta) || "2999-12-31";
    const rango = "v.fecha >= ? AND v.fecha < ? + INTERVAL 1 DAY";
    const [t] = await consultar(
      `SELECT COUNT(*) AS ventas, IFNULL(SUM(v.total), 0) AS total,
              (SELECT COUNT(*) FROM ventas v WHERE v.anulada = 1 AND ${rango}) AS anuladas
         FROM ventas v WHERE v.anulada = 0 AND ${rango}`,
      [desde, hasta, desde, hasta],
    );
    const metodos = await consultar(
      `SELECT v.metodo_pago AS metodo, COUNT(*) AS n, SUM(v.total) AS total FROM ventas v
        WHERE v.anulada = 0 AND ${rango} GROUP BY v.metodo_pago`,
      [desde, hasta],
    );
    const top = await consultar(
      `SELECT p.idproducto, p.nombre, p.categoria, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS total,
              SUM(d.subtotal - d.cantidad * p.precio_compra) AS ganancia
         FROM venta_detalle d JOIN ventas v ON v.idventa = d.idventa JOIN productos p ON p.idproducto = d.idproducto
        WHERE v.anulada = 0 AND ${rango}
        GROUP BY p.idproducto ORDER BY unidades DESC LIMIT 10`,
      [desde, hasta],
    );
    const [g] = await consultar(
      `SELECT IFNULL(SUM(d.subtotal - d.cantidad * p.precio_compra), 0) AS ganancia, IFNULL(SUM(d.cantidad), 0) AS unidades
         FROM venta_detalle d JOIN ventas v ON v.idventa = d.idventa JOIN productos p ON p.idproducto = d.idproducto
        WHERE v.anulada = 0 AND ${rango}`,
      [desde, hasta],
    );
    const [inv] = await consultar(
      `SELECT IFNULL(SUM(stock * precio_compra), 0) AS costo, IFNULL(SUM(stock * precio_venta), 0) AS venta,
              SUM(stock <= stock_minimo) AS bajos, SUM(stock = 0) AS agotados
         FROM productos WHERE activo = 1`,
    );
    res.json({
      desde,
      hasta,
      sales: Number(t.ventas),
      total: r2(t.total),
      voided: Number(t.anuladas),
      units: Number(g.unidades),
      profit: r2(g.ganancia),
      avgTicket: Number(t.ventas) ? r2(t.total / t.ventas) : 0,
      byMethod: metodos.map((m) => ({ method: m.metodo, count: Number(m.n), total: r2(m.total) })),
      topProducts: top.map((p) => ({
        id: String(p.idproducto),
        name: p.nombre,
        category: p.categoria,
        units: Number(p.unidades),
        total: r2(p.total),
        profit: r2(p.ganancia),
      })),
      inventory: {
        costValue: r2(inv.costo),
        saleValue: r2(inv.venta),
        low: Number(inv.bajos || 0),
        outOfStock: Number(inv.agotados || 0),
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
