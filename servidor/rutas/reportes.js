// =====================================================================
// REPORTES (administración): datos completos para filtrar en pantalla y
// exportar a Excel/PDF. Cada consulta sale de las tablas reales.
// =====================================================================
import { Router } from "express";
import { readFile } from "node:fs/promises";
import { consultar } from "../db.js";
import { ErrorHttp, requierePermiso, tienePermiso } from "../seguridad.js";
import { SQL_DEUDA, SQL_VENCE_DEUDA, estadoDeuda, saldoMatricula } from "./alumnos.js";
import { SQL_CONGELAMIENTOS, aCongelamiento, hoyLima, reglas, saldo, textoReglas } from "../congelamiento.js";
import { codigoAlumno } from "../codigoAlumno.js";

const router = Router();
router.use(requierePermiso("reports", "ver"));

const fechaOk = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v : null);
const hoy = hoyLima;
const rango = (req, diasAtras = 29) => {
  const hasta = fechaOk(req.query.hasta) || hoy();
  const d = new Date(`${hasta}T12:00:00`);
  d.setDate(d.getDate() - diasAtras);
  return [fechaOk(req.query.desde) || d.toISOString().slice(0, 10), hasta];
};
const OBJETIVO = {
  hipertrofia: "Hipertrofia", perdida_peso: "Pérdida de peso", fuerza: "Fuerza",
  resistencia: "Resistencia", tonificacion: "Tonificación", rehabilitacion: "Rehabilitación",
};

const ESTADO_DEUDA = { vencida: "Vencida", por_vencer: "Por vencer", al_dia: "En plazo", sin_fecha: "Sin fecha" };

// GET /api/reportes/deudas  -> saldos pendientes por matrícula + cobros de saldo del periodo
router.get("/deudas", async (req, res, next) => {
  try {
    const [desde, hasta] = rango(req, 179);
    const filas = await consultar(
      `SELECT m.idmatricula, m.idalumno, a.dni, CONCAT(a.nombres, ' ', a.apellidos) AS alumno, a.telefono, a.activo,
              p.nombre AS plan, m.fecha_inicio, m.fecha_fin, DATE(m.fecha_registro) AS fecha_matricula, m.es_renovacion,
              IFNULL(m.precio_total, m.monto) AS precio,
              m.monto + (SELECT IFNULL(SUM(pg.monto), 0) FROM pagos_matricula pg WHERE pg.idmatricula = m.idmatricula) AS pagado,
              ${saldoMatricula("m")} AS saldo,
              IFNULL(m.fecha_limite_pago, m.fecha_fin) AS limite, m.fecha_limite_pago,
              DATEDIFF(IFNULL(m.fecha_limite_pago, m.fecha_fin), CURDATE()) AS dias,
              u.usuario AS registrado_por,
              CONCAT_WS(' ', e.nombres, e.apellidos) AS entrenador
         FROM matriculas m
         JOIN alumnos a ON a.idalumno = m.idalumno
         JOIN planes p ON p.idplan = m.idplan
         LEFT JOIN usuarios u ON u.idusuario = m.idusuario_registro
         LEFT JOIN empleados e ON e.idempleado = m.identrenador
        WHERE m.estado <> 'anulada' AND ${saldoMatricula("m")} > 0.004
        ORDER BY limite, alumno`,
    );
    const cobros = await consultar(
      `SELECT DATE(pg.fecha) AS fecha, pg.monto, pg.metodo_pago, CONCAT(a.nombres, ' ', a.apellidos) AS alumno,
              p.nombre AS plan, u.usuario
         FROM pagos_matricula pg
         JOIN matriculas m ON m.idmatricula = pg.idmatricula
         JOIN alumnos a ON a.idalumno = m.idalumno
         JOIN planes p ON p.idplan = m.idplan
         LEFT JOIN usuarios u ON u.idusuario = pg.idusuario
        WHERE DATE(pg.fecha) BETWEEN ? AND ? AND m.estado <> 'anulada'
        ORDER BY pg.fecha DESC`,
      [desde, hasta],
    );
    res.json({
      desde,
      hasta,
      deudas: filas.map((f) => ({
        id: String(f.idmatricula),
        alumnoId: String(f.idalumno),
        dni: f.dni,
        alumno: f.alumno,
        telefono: f.telefono || "",
        deBaja: !f.activo,
        plan: f.plan,
        tipo: f.es_renovacion ? "Renovación" : "Matrícula",
        fechaMatricula: f.fecha_matricula,
        inicio: f.fecha_inicio,
        vence: f.fecha_fin,
        precio: Number(f.precio),
        pagado: Number(f.pagado),
        saldo: Math.round(Number(f.saldo) * 100) / 100,
        limite: f.limite,
        limiteFijado: !!f.fecha_limite_pago,
        dias: f.dias != null ? Number(f.dias) : null,
        estado: ESTADO_DEUDA[estadoDeuda(f.limite)],
        entrenador: f.entrenador || "",
        registradoPor: f.registrado_por || "",
      })),
      cobros: cobros.map((c) => ({
        fecha: c.fecha,
        monto: Number(c.monto),
        metodo: c.metodo_pago,
        alumno: c.alumno,
        plan: c.plan,
        usuario: c.usuario || "",
      })),
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/reportes/congelamientos?desde&hasta
//  -> congelamientos que se cruzan con el periodo + derecho pendiente de cada membresía vigente
router.get("/congelamientos", async (req, res, next) => {
  try {
    const [desde, hasta] = rango(req, 89);
    const h = hoy();
    const filas = await consultar(
      `${SQL_CONGELAMIENTOS}
        WHERE (c.fecha_inicio <= ? AND c.fecha_fin >= ?) OR DATE(c.fecha_registro) BETWEEN ? AND ? OR c.fecha_inicio > ?
        ORDER BY c.fecha_inicio DESC, c.idcongelamiento DESC`,
      [hasta, desde, desde, hasta, h],
    );
    // Membresías vigentes con días de congelamiento sin usar (y cuándo caducan)
    const mats = await consultar(
      `SELECT m.idmatricula, m.idalumno, m.fecha_inicio, m.fecha_fin, p.nombre AS plan,
              CONCAT(a.nombres, ' ', a.apellidos) AS alumno, a.dni, a.telefono,
              COALESCE(m.congelamiento_dias, p.congelamiento_dias, 0) AS congelamiento_dias,
              COALESCE(m.congelamiento_partes, p.congelamiento_partes, 1) AS congelamiento_partes,
              COALESCE(m.congelamiento_min_dias, p.congelamiento_min_dias, 0) AS congelamiento_min_dias
         FROM matriculas m JOIN planes p ON p.idplan = m.idplan JOIN alumnos a ON a.idalumno = m.idalumno
        WHERE m.estado <> 'anulada' AND a.activo = 1 AND m.fecha_fin >= CURDATE()
          AND COALESCE(m.congelamiento_dias, p.congelamiento_dias, 0) > 0`,
    );
    const usados = await consultar(
      `SELECT c.idmatricula, c.dias, c.estado FROM congelamientos c JOIN matriculas m ON m.idmatricula = c.idmatricula
        WHERE c.estado <> 'anulado' AND m.fecha_fin >= CURDATE()`,
    );
    const porMat = {};
    usados.forEach((u) => (porMat[u.idmatricula] = porMat[u.idmatricula] || []).push(u));
    const derechos = mats.map((m) => {
      const s = saldo(m, porMat[m.idmatricula] || [], h);
      return {
        enrollmentId: String(m.idmatricula), memberId: String(m.idalumno), memberName: m.alumno, memberDni: m.dni,
        memberPhone: m.telefono || "", planName: m.plan, rules: textoReglas(reglas(m)),
        totalDays: s.total, usedDays: s.usados, daysLeft: s.restante, partsLeft: s.partesRestantes, expiresOn: s.caducaEl,
      };
    });
    res.json({ desde, hasta, congelamientos: filas.map((c) => aCongelamiento(c, h)), derechos });
  } catch (e) {
    next(e);
  }
});

// GET /api/reportes/alumnos  -> todos los alumnos con su situación actual
router.get("/alumnos", async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT a.idalumno, a.codigo, a.dni, a.nombres, a.apellidos, a.sexo, a.fecha_nacimiento, a.telefono, a.correo, a.direccion,
              a.objetivo, a.restricciones_medicas, a.fecha_registro, a.activo,
              TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) AS edad,
              CONCAT_WS(' ', e.nombres, e.apellidos) AS entrenador, a.identrenador,
              m.fecha_inicio, m.fecha_fin, m.estado AS estado_matricula, p.nombre AS plan, p.idplan,
              DATEDIFF(m.fecha_fin, CURDATE()) AS dias_restantes,
              (SELECT COUNT(*) FROM matriculas mc WHERE mc.idalumno = a.idalumno AND mc.estado <> 'anulada') AS matriculas,
              (SELECT IFNULL(SUM(mc.monto), 0) FROM matriculas mc WHERE mc.idalumno = a.idalumno AND mc.estado <> 'anulada')
                + (SELECT IFNULL(SUM(pg.monto), 0) FROM pagos_matricula pg JOIN matriculas mp ON mp.idmatricula = pg.idmatricula
                    WHERE mp.idalumno = a.idalumno AND mp.estado <> 'anulada') AS total_pagado,
              ${SQL_DEUDA} AS deuda, ${SQL_VENCE_DEUDA} AS vence_deuda,
              (SELECT cv.fecha_fin FROM congelamientos cv WHERE cv.idalumno = a.idalumno AND cv.estado = 'vigente'
                 AND CURDATE() BETWEEN cv.fecha_inicio AND cv.fecha_fin LIMIT 1) AS congelado_hasta,
              COALESCE(m.congelamiento_dias, p.congelamiento_dias, 0) AS cong_total,
              (SELECT IFNULL(SUM(cu.dias), 0) FROM congelamientos cu WHERE cu.idmatricula = m.idmatricula AND cu.estado <> 'anulado') AS cong_usados,
              (SELECT MAX(aa.fecha) FROM asistencias_alumno aa WHERE aa.idalumno = a.idalumno) AS ultima_asistencia,
              (SELECT COUNT(*) FROM asistencias_alumno aa WHERE aa.idalumno = a.idalumno
                 AND aa.tipo = 'entrada' AND aa.fecha >= CURDATE() - INTERVAL 30 DAY) AS asistencias_30d
         FROM alumnos a
         LEFT JOIN empleados e ON e.idempleado = a.identrenador
         LEFT JOIN matriculas m ON m.idmatricula = (
              SELECT m2.idmatricula FROM matriculas m2 WHERE m2.idalumno = a.idalumno AND m2.estado <> 'anulada'
               ORDER BY m2.fecha_fin DESC, m2.idmatricula DESC LIMIT 1)
         LEFT JOIN planes p ON p.idplan = m.idplan
        ORDER BY a.apellidos, a.nombres`,
    );
    res.json(
      filas.map((f) => {
        let estado = "Sin matrícula";
        if (!f.activo) estado = "De baja";
        else if (f.congelado_hasta || f.estado_matricula === "congelada") estado = "Congelado";
        else if (f.fecha_fin) estado = f.dias_restantes < 0 ? "Vencido" : f.dias_restantes <= 7 ? "Por vencer" : "Activo";
        return {
          id: String(f.idalumno),
          codigo: codigoAlumno(f.codigo, f.nombres, f.apellidos),
          dni: f.dni,
          nombre: `${f.nombres} ${f.apellidos}`.trim(),
          sexo: f.sexo === "F" ? "Mujer" : f.sexo === "M" ? "Varón" : "Otro",
          fechaNacimiento: f.fecha_nacimiento,
          edad: f.edad != null ? Number(f.edad) : null,
          telefono: f.telefono || "",
          correo: f.correo || "",
          direccion: f.direccion || "",
          objetivo: OBJETIVO[f.objetivo] || f.objetivo,
          restricciones: f.restricciones_medicas || "",
          entrenadorId: f.identrenador ? String(f.identrenador) : "",
          entrenador: f.entrenador || "",
          planId: f.idplan ? String(f.idplan) : "",
          plan: f.plan || "",
          inicio: f.fecha_inicio,
          vence: f.fecha_fin,
          diasRestantes: f.dias_restantes != null ? Number(f.dias_restantes) : null,
          estado,
          registro: f.fecha_registro,
          matriculas: Number(f.matriculas),
          totalPagado: Number(f.total_pagado),
          deuda: Number(f.deuda),
          limitePago: Number(f.deuda) > 0 ? f.vence_deuda : null,
          estadoDeuda: Number(f.deuda) > 0 ? ESTADO_DEUDA[estadoDeuda(f.vence_deuda)] : "",
          ultimaAsistencia: f.ultima_asistencia,
          asistencias30: Number(f.asistencias_30d),
          congeladoHasta: f.congelado_hasta || null,
          congelamientoDias: Number(f.cong_total || 0),
          congelamientoRestante: Math.max(0, Number(f.cong_total || 0) - Number(f.cong_usados || 0)),
        };
      }),
    );
  } catch (e) {
    next(e);
  }
});

// GET /api/reportes/matriculas?desde&hasta  -> matrículas y renovaciones del periodo
router.get("/matriculas", async (req, res, next) => {
  try {
    const [desde, hasta] = rango(req);
    const filas = await consultar(
      `SELECT m.idmatricula, m.fecha_registro, m.fecha_inicio, m.fecha_fin, m.monto, IFNULL(m.precio_total, m.monto) AS precio,
              m.metodo_pago, m.estado, m.es_renovacion, p.nombre AS plan, p.idplan,
              a.idalumno, a.dni, CONCAT(a.nombres, ' ', a.apellidos) AS alumno, a.sexo,
              TIMESTAMPDIFF(YEAR, a.fecha_nacimiento, CURDATE()) AS edad,
              u.usuario AS registro_usuario,
              (SELECT IFNULL(SUM(pg.monto), 0) FROM pagos_matricula pg WHERE pg.idmatricula = m.idmatricula) AS pagos
         FROM matriculas m
         JOIN alumnos a ON a.idalumno = m.idalumno
         JOIN planes p ON p.idplan = m.idplan
         LEFT JOIN usuarios u ON u.idusuario = m.idusuario_registro
        WHERE m.fecha_registro >= ? AND m.fecha_registro < ? + INTERVAL 1 DAY
        ORDER BY m.fecha_registro DESC`,
      [desde, hasta],
    );
    res.json({
      desde,
      hasta,
      filas: filas.map((f) => {
        const pagado = Number(f.monto) + Number(f.pagos);
        return {
          id: String(f.idmatricula),
          fecha: f.fecha_registro,
          dia: String(f.fecha_registro).slice(0, 10),
          alumnoId: String(f.idalumno),
          dni: f.dni,
          alumno: f.alumno,
          sexo: f.sexo === "F" ? "Mujer" : f.sexo === "M" ? "Varón" : "Otro",
          edad: f.edad != null ? Number(f.edad) : null,
          planId: String(f.idplan),
          plan: f.plan,
          tipo: f.es_renovacion ? "Renovación" : "Nueva",
          inicio: f.fecha_inicio,
          vence: f.fecha_fin,
          precio: Number(f.precio),
          pagado,
          saldo: f.estado === "anulada" ? 0 : Math.max(0, Number(f.precio) - pagado),
          metodo: f.metodo_pago,
          estado: f.estado,
          registradoPor: f.registro_usuario || "",
        };
      }),
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/reportes/ingresos?desde&hasta  -> movimientos de caja con su turno
router.get("/ingresos", async (req, res, next) => {
  try {
    const [desde, hasta] = rango(req);
    const filas = await consultar(
      `SELECT mc.idmovimiento, mc.fecha, mc.tipo, mc.categoria, mc.monto, mc.metodo_pago, mc.descripcion, mc.comprobante,
              mc.nombre_relacionado, tc.nombre_apertura AS cajero, tr.nombre AS turno_recepcion
         FROM movimientos_caja mc
         LEFT JOIN turnos_caja tc ON tc.idturno = mc.idturno
         LEFT JOIN turnos_recepcion tr ON tr.idturno_recepcion = tc.idturno_recepcion
        WHERE mc.fecha >= ? AND mc.fecha < ? + INTERVAL 1 DAY
        ORDER BY mc.fecha DESC, mc.idmovimiento DESC`,
      [desde, hasta],
    );
    res.json({
      desde,
      hasta,
      filas: filas.map((f) => ({
        id: String(f.idmovimiento),
        fecha: f.fecha,
        dia: String(f.fecha).slice(0, 10),
        tipo: f.tipo === "ingreso" ? "Ingreso" : "Egreso",
        categoria: f.categoria,
        monto: Number(f.monto),
        metodo: f.metodo_pago,
        descripcion: f.descripcion,
        comprobante: f.comprobante || "",
        relacionado: f.nombre_relacionado || "",
        cajero: f.cajero || "Sin turno",
        turnoRecepcion: f.turno_recepcion || "Sin turno",
      })),
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/reportes/asistencias?desde&hasta  -> ingresos de alumnos al gimnasio
router.get("/asistencias", async (req, res, next) => {
  try {
    const [desde, hasta] = rango(req, 6);
    const filas = await consultar(
      `SELECT aa.idasistencia_alumno, aa.fecha, aa.hora, aa.metodo, aa.resultado, a.dni,
              CONCAT(a.nombres, ' ', a.apellidos) AS alumno, a.sexo
         FROM asistencias_alumno aa JOIN alumnos a ON a.idalumno = aa.idalumno
        WHERE aa.tipo = 'entrada' AND aa.fecha BETWEEN ? AND ?
        ORDER BY aa.fecha DESC, aa.hora DESC`,
      [desde, hasta],
    );
    res.json({
      desde,
      hasta,
      filas: filas.map((f) => ({
        id: String(f.idasistencia_alumno),
        dia: f.fecha,
        hora: String(f.hora).slice(0, 5),
        dni: f.dni,
        alumno: f.alumno,
        sexo: f.sexo === "F" ? "Mujer" : f.sexo === "M" ? "Varón" : "Otro",
        metodo: f.metodo,
        resultado: f.resultado,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/reportes/integridad  -> (solo administración) misma revisión que
// base_datos/verificar_integridad.sql: sincronización, caja, stock, alumnos.
router.get("/integridad", async (req, res, next) => {
  try {
    if (!(await tienePermiso(req.usuario.idusuario, "users", "editar"))) throw new ErrorHttp(403, "Solo administración");
    const sql = await readFile(new URL("../../base_datos/verificar_integridad.sql", import.meta.url), "utf8");
    const ini = sql.indexOf("SELECT * FROM (");
    const fin = sql.indexOf("ORDER BY comprobacion;");
    if (ini < 0 || fin < 0) throw new ErrorHttp(500, "No se encontró la consulta de verificación");
    const consulta = sql
      .slice(ini, fin + "ORDER BY comprobacion".length)
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n");
    const filas = await consultar(consulta);
    const sinSync = await consultar(
      "SELECT modulo, idregistro, sync_detalle, fecha_actualizacion FROM registros_app WHERE sync_estado <> 'ok' ORDER BY fecha_actualizacion DESC LIMIT 50",
    );
    res.json({
      ok: filas.every((f) => Number(f.problemas) === 0),
      comprobaciones: filas.map((f) => ({ nombre: f.comprobacion, problemas: Number(f.problemas) })),
      sinSincronizar: sinSync,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
