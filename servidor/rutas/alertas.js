// Alertas para el administrador (bandeja de la campanita).
// Hoy: cambios de la fecha límite de pago de una deuda hechos por recepción u otro usuario.
// Si el propio administrador hace el cambio, queda guardado como historial (ya visto).
import { Router } from "express";
import { consultar } from "../db.js";
import { ErrorHttp } from "../seguridad.js";

const router = Router();

const soloAdmin = (req, res, next) =>
  req.usuario?.rol === "admin" ? next() : next(new ErrorHttp(403, "Solo el administrador ve estas alertas"));

const fechaTexto = (f) => (f ? String(f).slice(0, 10).split("-").reverse().join("/") : "sin fecha");

/**
 * Registra el cambio de fecha límite de pago (dentro de la misma transacción del cambio).
 * @param cx conexión (o null para usar el pool)
 */
export async function alertaCambioFechaPago(cx, { idalumno, anterior, nueva, deuda, usuario, origen }) {
  if (!nueva || String(anterior || "").slice(0, 10) === nueva) return;
  const ejecutar = cx ? (sql, p) => cx.execute(sql, p).then(([r]) => r) : consultar;
  const [quien] = await ejecutar(
    `SELECT u.usuario, COALESCE(NULLIF(TRIM(CONCAT(IFNULL(e.nombres,''),' ',IFNULL(e.apellidos,''))),''), u.usuario) AS nombre, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.idrol = u.idrol LEFT JOIN empleados e ON e.idempleado = u.idempleado
      WHERE u.idusuario = ?`,
    [usuario.idusuario],
  );
  const [al] = await ejecutar("SELECT CONCAT(nombres,' ',apellidos) AS nombre FROM alumnos WHERE idalumno = ?", [idalumno]);
  const quienTxt = quien ? `${quien.nombre} (${quien.rol})` : "Un usuario";
  const mensaje =
    `${quienTxt} cambió la fecha límite de pago de ${al?.nombre || "un alumno"}: ` +
    `${fechaTexto(anterior)} → ${fechaTexto(nueva)}` +
    (deuda != null ? `. Deuda: S/ ${Number(deuda).toFixed(2)}` : "") +
    (origen === "abono" ? " (al registrar un abono)" : "");
  await ejecutar(
    `INSERT INTO alertas_administracion
       (tipo, titulo, mensaje, idalumno, idusuario_origen, fecha_anterior, fecha_nueva, monto_deuda, vista, fecha_vista, idusuario_vista)
     VALUES ('cambio_fecha_pago', 'Cambio de fecha de pago', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mensaje.slice(0, 500), idalumno, usuario.idusuario, anterior ? String(anterior).slice(0, 10) : null, nueva,
      deuda != null ? Math.round(Number(deuda) * 100) / 100 : null,
      usuario.rol === "admin" ? 1 : 0, usuario.rol === "admin" ? new Date() : null, usuario.rol === "admin" ? usuario.idusuario : null,
    ],
  );
}

const aAlerta = (f) => ({
  id: String(f.idalerta),
  type: f.tipo,
  title: f.titulo,
  message: f.mensaje,
  memberId: f.idalumno ? String(f.idalumno) : null,
  memberName: f.alumno || "",
  by: f.origen || "",
  previousDate: f.fecha_anterior,
  newDate: f.fecha_nueva,
  debt: f.monto_deuda != null ? Number(f.monto_deuda) : null,
  date: f.fecha,
  seen: !!f.vista,
});

// GET /api/alertas?limite=30  -> { pendientes, alertas[] }
router.get("/", soloAdmin, async (req, res, next) => {
  try {
    const limite = Math.min(Math.max(Number(req.query.limite) || 30, 1), 200);
    const filas = await consultar(
      `SELECT al.*, CONCAT(a.nombres,' ',a.apellidos) AS alumno, u.usuario AS origen
         FROM alertas_administracion al
         LEFT JOIN alumnos a ON a.idalumno = al.idalumno
         LEFT JOIN usuarios u ON u.idusuario = al.idusuario_origen
        ORDER BY al.vista, al.fecha DESC, al.idalerta DESC
        LIMIT ${limite}`,
    );
    const [{ n }] = await consultar("SELECT COUNT(*) AS n FROM alertas_administracion WHERE vista = 0");
    res.json({ pendientes: Number(n), alertas: filas.map(aAlerta) });
  } catch (e) {
    next(e);
  }
});

// PUT /api/alertas/:id/vista  -> marca una alerta como vista
// PUT /api/alertas/todas/vista -> marca todas
router.put("/:id/vista", soloAdmin, async (req, res, next) => {
  try {
    const todas = req.params.id === "todas";
    await consultar(
      `UPDATE alertas_administracion SET vista = 1, fecha_vista = NOW(), idusuario_vista = ?
        WHERE vista = 0 ${todas ? "" : "AND idalerta = ?"}`,
      todas ? [req.usuario.idusuario] : [req.usuario.idusuario, req.params.id],
    );
    const [{ n }] = await consultar("SELECT COUNT(*) AS n FROM alertas_administracion WHERE vista = 0");
    res.json({ pendientes: Number(n) });
  } catch (e) {
    next(e);
  }
});

export default router;
