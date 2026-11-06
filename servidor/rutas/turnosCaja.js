// Caja por turnos: apertura, movimientos del turno, arqueo y cierre.
// Solo hay una caja física, por eso solo puede haber UN turno abierto.
// Los ingresos/egresos (ventas POS, matrículas, gastos) se asocian solos al
// turno abierto mediante el trigger trg_movimientos_caja_turno.
import { Router } from "express";
import { consultar, pool } from "../db.js";
import { ErrorHttp, requierePermiso, soloPersonal } from "../seguridad.js";

const router = Router();
router.use(soloPersonal);

const METODOS = ["efectivo", "tarjeta", "transferencia", "yape_plin"];
const CATEGORIAS_TURNO = {
  // ingresos que la recepción puede registrar a mano en su turno
  ingreso: ["otros", "entrenamiento_personal", "fisioterapia", "nutricion"],
  // egresos de caja chica
  egreso: ["insumos", "mantenimiento", "servicios", "otros"],
};
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;

async function nombreDe(idusuario) {
  const [f] = await consultar(
    `SELECT COALESCE(CONCAT_WS(' ', e.nombres, e.apellidos), CONCAT_WS(' ', a.nombres, a.apellidos), u.usuario) AS nombre
       FROM usuarios u
       LEFT JOIN empleados e ON e.idempleado = u.idempleado
       LEFT JOIN alumnos a   ON a.idalumno = u.idalumno
      WHERE u.idusuario = ?`,
    [idusuario],
  );
  return f?.nombre || "Usuario";
}

/** Totales del turno calculados con sus movimientos. */
async function resumen(idturno) {
  const filas = await consultar(
    `SELECT tipo, metodo_pago, categoria, COUNT(*) AS n, SUM(monto) AS total
       FROM movimientos_caja WHERE idturno = ?
      GROUP BY tipo, metodo_pago, categoria`,
    [idturno],
  );
  const r = {
    ingresos: { efectivo: 0, tarjeta: 0, transferencia: 0, yape_plin: 0 },
    egresos: { efectivo: 0, tarjeta: 0, transferencia: 0, yape_plin: 0 },
    porCategoria: {},
    operaciones: 0,
    ventas: 0,
    matriculas: 0,
  };
  for (const f of filas) {
    const lado = f.tipo === "ingreso" ? r.ingresos : r.egresos;
    lado[f.metodo_pago] = r2(lado[f.metodo_pago] + Number(f.total));
    const clave = `${f.tipo}:${f.categoria}`;
    r.porCategoria[clave] = r2((r.porCategoria[clave] || 0) + Number(f.total));
    r.operaciones += Number(f.n);
    if (f.categoria === "venta") r.ventas += Number(f.n);
    if (f.categoria === "matricula") r.matriculas += Number(f.n);
  }
  r.totalIngresos = r2(Object.values(r.ingresos).reduce((a, b) => a + b, 0));
  r.totalEgresos = r2(Object.values(r.egresos).reduce((a, b) => a + b, 0));
  return r;
}

function aTurno(t, res) {
  const esperado = r2(Number(t.monto_apertura) + res.ingresos.efectivo - res.egresos.efectivo);
  return {
    id: String(t.idturno),
    previousId: t.idturno_anterior ? String(t.idturno_anterior) : null,
    status: t.estado,
    openedBy: t.nombre_apertura,
    openedByUserId: String(t.idusuario_apertura),
    openedAt: t.fecha_apertura,
    receivedCash: Number(t.monto_recibido),
    openingCash: Number(t.monto_apertura),
    openingDifference: r2(Number(t.monto_apertura) - Number(t.monto_recibido)),
    openingNote: t.obs_apertura || "",
    receptionShiftId: t.idturno_recepcion ? String(t.idturno_recepcion) : null,
    closedBy: t.nombre_cierre || null,
    closedAt: t.fecha_cierre || null,
    // Mientras está abierto, el esperado se calcula en vivo
    expectedCash: t.estado === "cerrado" ? Number(t.efectivo_esperado) : esperado,
    countedCash: t.efectivo_contado != null ? Number(t.efectivo_contado) : null,
    difference: t.diferencia != null ? Number(t.diferencia) : null,
    deliveredCash: t.efectivo_entregado != null ? Number(t.efectivo_entregado) : null,
    nextShiftCash: t.efectivo_siguiente != null ? Number(t.efectivo_siguiente) : null,
    countDetail: typeof t.detalle_conteo === "string" ? JSON.parse(t.detalle_conteo) : t.detalle_conteo || null,
    closingNote: t.obs_cierre || "",
    summary: res,
  };
}

async function turnoCompleto(t) {
  return t ? aTurno(t, await resumen(t.idturno)) : null;
}

async function movimientosDe(idturno) {
  const filas = await consultar(
    `SELECT m.idmovimiento, m.tipo, m.categoria, m.monto, m.descripcion, m.metodo_pago, m.comprobante,
            m.nombre_relacionado, m.fecha, u.usuario
       FROM movimientos_caja m
       LEFT JOIN usuarios u ON u.idusuario = m.idusuario_registro
      WHERE m.idturno = ? ORDER BY m.fecha DESC, m.idmovimiento DESC`,
    [idturno],
  );
  return filas.map((f) => ({
    id: String(f.idmovimiento),
    type: f.tipo === "ingreso" ? "income" : "expense",
    category: f.categoria,
    amount: Number(f.monto),
    description: f.descripcion,
    paymentMethod: f.metodo_pago,
    receiptNumber: f.comprobante,
    relatedName: f.nombre_relacionado,
    dateTime: f.fecha,
    user: f.usuario,
  }));
}

// GET /api/turnos-caja/actual  -> turno abierto + último cerrado
router.get("/actual", requierePermiso(["cash", "finance"], "ver"), async (req, res, next) => {
  try {
    const [abierto] = await consultar("SELECT * FROM turnos_caja WHERE estado = 'abierto' LIMIT 1");
    const [ultimo] = await consultar(
      "SELECT * FROM turnos_caja WHERE estado = 'cerrado' ORDER BY idturno DESC LIMIT 1",
    );
    res.json({
      open: await turnoCompleto(abierto),
      openMovements: abierto ? await movimientosDe(abierto.idturno) : [],
      lastClosed: await turnoCompleto(ultimo),
      // movimientos registrados sin caja abierta en las últimas 24 h
      unassigned: Number(
        (await consultar(
          "SELECT COUNT(*) AS n FROM movimientos_caja WHERE idturno IS NULL AND fecha >= NOW() - INTERVAL 1 DAY",
        ))[0].n,
      ),
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/turnos-caja?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  -> historial
router.get("/", requierePermiso(["cash", "finance"], "ver"), async (req, res, next) => {
  try {
    const fecha = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : null);
    const desde = fecha(req.query.desde);
    const hasta = fecha(req.query.hasta);
    const filas = await consultar(
      `SELECT * FROM turnos_caja
        WHERE fecha_apertura >= IFNULL(?, CURDATE() - INTERVAL 30 DAY)
          AND fecha_apertura <  IFNULL(? + INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY)
        ORDER BY fecha_apertura DESC LIMIT 300`,
      [desde, hasta],
    );
    res.json(await Promise.all(filas.map(turnoCompleto)));
  } catch (e) {
    next(e);
  }
});

// GET /api/turnos-caja/:id  -> detalle con movimientos
router.get("/:id(\\d+)", requierePermiso(["cash", "finance"], "ver"), async (req, res, next) => {
  try {
    const [t] = await consultar("SELECT * FROM turnos_caja WHERE idturno = ?", [req.params.id]);
    if (!t) throw new ErrorHttp(404, "Turno no encontrado");
    res.json({ ...(await turnoCompleto(t)), movements: await movimientosDe(t.idturno) });
  } catch (e) {
    next(e);
  }
});

// POST /api/turnos-caja/abrir { montoApertura, observacion }
router.post("/abrir", requierePermiso("cash", "crear"), async (req, res, next) => {
  const cx = await pool.getConnection();
  try {
    const monto = Number(req.body?.montoApertura);
    if (!(monto >= 0) || Number.isNaN(monto)) throw new ErrorHttp(400, "Ingresa el efectivo con el que abres la caja");
    await cx.beginTransaction();
    const [[abierto]] = await cx.query("SELECT nombre_apertura FROM turnos_caja WHERE estado = 'abierto' FOR UPDATE");
    if (abierto) {
      throw new ErrorHttp(409, `La caja ya está abierta por ${abierto.nombre_apertura}. Debe cerrarla antes de abrir un nuevo turno.`);
    }
    const [[anterior]] = await cx.query(
      "SELECT idturno, efectivo_siguiente FROM turnos_caja WHERE estado = 'cerrado' ORDER BY idturno DESC LIMIT 1",
    );
    const obsApertura = String(req.body?.observacion || "").trim().slice(0, 300) || null;
    if (anterior && Math.abs(r2(monto) - r2(anterior.efectivo_siguiente || 0)) >= 0.01 && !obsApertura) {
      throw new ErrorHttp(400, "El efectivo no coincide con lo que dejó el turno anterior: escribe una observación.");
    }
    // Turno de recepción (para metas): el elegido o el asignado al usuario
    const [[u]] = await cx.query("SELECT idturno_recepcion FROM usuarios WHERE idusuario = ?", [req.usuario.idusuario]);
    const turnoRecepcion = Number(req.body?.turnoRecepcion) || u?.idturno_recepcion || null;
    const nombre = await nombreDe(req.usuario.idusuario);
    const [r] = await cx.query(
      `INSERT INTO turnos_caja (idturno_anterior, idusuario_apertura, nombre_apertura, monto_recibido, monto_apertura, obs_apertura,
                                idturno_recepcion)
       VALUES (?,?,?,?,?,?,?)`,
      [
        anterior?.idturno || null,
        req.usuario.idusuario,
        nombre,
        r2(anterior?.efectivo_siguiente || 0),
        r2(monto),
        obsApertura,
        turnoRecepcion,
      ],
    );
    await cx.commit();
    const [t] = await consultar("SELECT * FROM turnos_caja WHERE idturno = ?", [r.insertId]);
    res.status(201).json(await turnoCompleto(t));
  } catch (e) {
    await cx.rollback().catch(() => {});
    if (e.code === "ER_DUP_ENTRY") return next(new ErrorHttp(409, "Ya hay una caja abierta"));
    next(e);
  } finally {
    cx.release();
  }
});

// POST /api/turnos-caja/:id/movimiento  { tipo: ingreso|egreso, categoria, monto, descripcion, metodoPago }
router.post("/:id(\\d+)/movimiento", requierePermiso("cash", "crear"), async (req, res, next) => {
  try {
    const d = req.body || {};
    const [t] = await consultar("SELECT estado FROM turnos_caja WHERE idturno = ?", [req.params.id]);
    if (!t) throw new ErrorHttp(404, "Turno no encontrado");
    if (t.estado !== "abierto") throw new ErrorHttp(400, "Este turno ya está cerrado");
    const tipo = d.tipo === "egreso" ? "egreso" : "ingreso";
    const categoria = CATEGORIAS_TURNO[tipo].includes(d.categoria) ? d.categoria : "otros";
    const monto = r2(d.monto);
    if (!(monto > 0)) throw new ErrorHttp(400, "El monto debe ser mayor a cero");
    const descripcion = String(d.descripcion || "").trim();
    if (descripcion.length < 3) throw new ErrorHttp(400, "Describe el motivo del movimiento");
    const r = await consultar(
      `INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, metodo_pago, nombre_relacionado,
                                     idusuario_registro, idturno)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        tipo,
        categoria,
        monto,
        descripcion.slice(0, 255),
        METODOS.includes(d.metodoPago) ? d.metodoPago : "efectivo",
        String(d.relacionado || "").trim().slice(0, 120) || null,
        req.usuario.idusuario,
        req.params.id,
      ],
    );
    res.status(201).json({ id: String(r.insertId) });
  } catch (e) {
    next(e);
  }
});

// POST /api/turnos-caja/:id/cerrar { efectivoContado, efectivoSiguiente, detalleConteo, observacion }
router.post("/:id(\\d+)/cerrar", requierePermiso("cash", "editar"), async (req, res, next) => {
  const cx = await pool.getConnection();
  try {
    const d = req.body || {};
    const contado = Number(d.efectivoContado);
    if (Number.isNaN(contado) || contado < 0) throw new ErrorHttp(400, "Ingresa el efectivo contado en caja");
    const siguiente = d.efectivoSiguiente === undefined || d.efectivoSiguiente === "" ? contado : Number(d.efectivoSiguiente);
    if (Number.isNaN(siguiente) || siguiente < 0 || siguiente > contado + 0.001) {
      throw new ErrorHttp(400, "El efectivo que queda para el siguiente turno no puede ser mayor al contado");
    }
    const obs = String(d.observacion || "").trim().slice(0, 300) || null;

    await cx.beginTransaction();
    const [[t]] = await cx.query("SELECT * FROM turnos_caja WHERE idturno = ? FOR UPDATE", [req.params.id]);
    if (!t) throw new ErrorHttp(404, "Turno no encontrado");
    if (t.estado !== "abierto") throw new ErrorHttp(400, "Este turno ya fue cerrado");

    const res0 = await resumen(t.idturno);
    const esperado = r2(Number(t.monto_apertura) + res0.ingresos.efectivo - res0.egresos.efectivo);
    const diferencia = r2(contado - esperado);
    if (Math.abs(diferencia) >= 0.01 && !obs) {
      throw new ErrorHttp(400, `Hay una diferencia de S/ ${diferencia.toFixed(2)}. Escribe una observación que la explique.`);
    }
    const nombre = await nombreDe(req.usuario.idusuario);
    await cx.query(
      `UPDATE turnos_caja SET
         estado = 'cerrado', idusuario_cierre = ?, nombre_cierre = ?, fecha_cierre = NOW(),
         ingresos_efectivo = ?, egresos_efectivo = ?, ingresos_tarjeta = ?, ingresos_yape_plin = ?,
         ingresos_transferencia = ?, egresos_otros = ?, efectivo_esperado = ?, efectivo_contado = ?,
         diferencia = ?, efectivo_entregado = ?, efectivo_siguiente = ?, detalle_conteo = ?, obs_cierre = ?
       WHERE idturno = ?`,
      [
        req.usuario.idusuario,
        nombre,
        res0.ingresos.efectivo,
        res0.egresos.efectivo,
        res0.ingresos.tarjeta,
        res0.ingresos.yape_plin,
        res0.ingresos.transferencia,
        r2(res0.egresos.tarjeta + res0.egresos.yape_plin + res0.egresos.transferencia),
        esperado,
        r2(contado),
        diferencia,
        r2(contado - siguiente),
        r2(siguiente),
        d.detalleConteo && typeof d.detalleConteo === "object" ? JSON.stringify(d.detalleConteo) : null,
        obs,
        t.idturno,
      ],
    );
    await cx.commit();
    const [cerrado] = await consultar("SELECT * FROM turnos_caja WHERE idturno = ?", [t.idturno]);
    res.json(await turnoCompleto(cerrado));
  } catch (e) {
    await cx.rollback().catch(() => {});
    next(e);
  } finally {
    cx.release();
  }
});

export default router;
