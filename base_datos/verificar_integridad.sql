-- =====================================================================
-- RADICAL - VERIFICAR INTEGRIDAD Y SINCRONIZACIÓN (solo lectura)
-- No cambia nada. Ejecútalo cuando quieras comprobar que todo lo que
-- se registra en el sistema quedó bien guardado en sus tablas.
-- Cada fila muestra una comprobación y cuántos problemas encontró:
-- "problemas = 0" es lo correcto.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

SELECT * FROM (
  -- 1) Registros de la app que no se copiaron a su tabla
  SELECT '01 Registros de la app sin sincronizar' AS comprobacion,
         (SELECT COUNT(*) FROM registros_app WHERE sync_estado <> 'ok') AS problemas
  UNION ALL
  -- 2) Registros "ok" cuya fila ya no existe en su tabla
  SELECT '02 Rutinas sin su fila en rutinas',
         (SELECT COUNT(*) FROM registros_app r WHERE r.modulo = 'rutinas' AND r.sync_estado = 'ok'
             AND NOT EXISTS (SELECT 1 FROM rutinas t WHERE t.idregistro_app = r.idregistro))
  UNION ALL
  SELECT '03 Dietas sin su fila en dietas',
         (SELECT COUNT(*) FROM registros_app r WHERE r.modulo = 'planes_nutricion' AND r.sync_estado = 'ok'
             AND NOT EXISTS (SELECT 1 FROM dietas t WHERE t.idregistro_app = r.idregistro))
  UNION ALL
  SELECT '04 Fisioterapia sin su fila en sesiones_fisioterapia',
         (SELECT COUNT(*) FROM registros_app r WHERE r.modulo = 'fisioterapia' AND r.sync_estado = 'ok'
             AND NOT EXISTS (SELECT 1 FROM sesiones_fisioterapia t WHERE t.idregistro_app = r.idregistro))
  UNION ALL
  SELECT '05 Asistencias de alumnos sin su fila',
         (SELECT COUNT(*) FROM registros_app r WHERE r.modulo = 'asistencias' AND r.sync_estado = 'ok'
             AND JSON_UNQUOTE(JSON_EXTRACT(r.datos, '$.category')) <> 'staff'
             AND NOT EXISTS (SELECT 1 FROM asistencias_alumno t WHERE t.idregistro_app = r.idregistro))
  UNION ALL
  -- (el personal tiene una fila por día: varias marcas del mismo día van a la misma fila)
  SELECT '06 Días de asistencia del personal sin su fila',
         (SELECT COUNT(*) FROM (
            SELECT JSON_UNQUOTE(JSON_EXTRACT(r.datos, '$.contractId')) AS c, JSON_UNQUOTE(JSON_EXTRACT(r.datos, '$.date')) AS f
              FROM registros_app r
             WHERE r.modulo = 'asistencias' AND r.sync_estado = 'ok' AND JSON_UNQUOTE(JSON_EXTRACT(r.datos, '$.category')) = 'staff'
             GROUP BY c, f
            HAVING NOT EXISTS (SELECT 1 FROM asistencias_empleado t JOIN registros_app r2 ON r2.modulo = 'asistencias' AND r2.idregistro = t.idregistro_app
                                WHERE JSON_UNQUOTE(JSON_EXTRACT(r2.datos, '$.contractId')) = c AND t.fecha = f)) x)
  UNION ALL
  SELECT '07 Contratos sin su fila en contratos',
         (SELECT COUNT(*) FROM registros_app r WHERE r.modulo = 'contratos' AND r.sync_estado = 'ok'
             AND NOT EXISTS (SELECT 1 FROM contratos t WHERE t.idregistro_app = r.idregistro))
  UNION ALL
  SELECT '08 Planilla sin su fila en planilla',
         (SELECT COUNT(*) FROM registros_app r WHERE r.modulo = 'planilla' AND r.sync_estado = 'ok'
             AND NOT EXISTS (SELECT 1 FROM planilla t WHERE t.idregistro_app = r.idregistro))
  UNION ALL
  SELECT '09 Citas sin su fila en citas',
         (SELECT COUNT(*) FROM registros_app r WHERE r.modulo = 'citas' AND r.sync_estado = 'ok'
             AND NOT EXISTS (SELECT 1 FROM citas t WHERE t.idregistro_app = r.idregistro))
  UNION ALL
  -- 3) Filas copiadas cuyo registro de la app ya no existe (quedaron sueltas)
  SELECT '10 Asistencias de alumnos sueltas (sin registro)',
         (SELECT COUNT(*) FROM asistencias_alumno t WHERE t.idregistro_app IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM registros_app r WHERE r.modulo = 'asistencias' AND r.idregistro = t.idregistro_app))
  UNION ALL
  SELECT '11 Rutinas sueltas (sin registro)',
         (SELECT COUNT(*) FROM rutinas t WHERE t.idregistro_app IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM registros_app r WHERE r.modulo = 'rutinas' AND r.idregistro = t.idregistro_app))
  UNION ALL
  SELECT '12 Dietas sueltas (sin registro)',
         (SELECT COUNT(*) FROM dietas t WHERE t.idregistro_app IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM registros_app r WHERE r.modulo = 'planes_nutricion' AND r.idregistro = t.idregistro_app))
  UNION ALL
  -- 4) Dinero: cada cobro debe estar en la caja
  SELECT '13 Matrículas sin su ingreso en caja',
         (SELECT COUNT(*) FROM matriculas m WHERE m.estado <> 'anulada' AND m.monto > 0
             AND NOT EXISTS (SELECT 1 FROM movimientos_caja c WHERE c.categoria = 'matricula' AND c.idreferencia = m.idmatricula))
  UNION ALL
  SELECT '14 Matrículas cuyo monto no coincide con la caja',
         (SELECT COUNT(*) FROM matriculas m WHERE m.estado <> 'anulada' AND m.monto > 0
             AND ABS(m.monto - (SELECT IFNULL(SUM(c.monto), 0) FROM movimientos_caja c
                                 WHERE c.categoria = 'matricula' AND c.idreferencia = m.idmatricula AND c.descripcion NOT LIKE 'Pago de saldo%')) > 0.01)
  UNION ALL
  SELECT '15 Abonos (pagos por partes) sin su ingreso en caja',
         (SELECT COUNT(*) FROM (SELECT p.idmatricula, SUM(p.monto) AS s FROM pagos_matricula p GROUP BY p.idmatricula) p
           WHERE ABS(p.s - (SELECT IFNULL(SUM(c.monto), 0) FROM movimientos_caja c
                             WHERE c.categoria = 'matricula' AND c.idreferencia = p.idmatricula AND c.descripcion LIKE 'Pago de saldo%')) > 0.01)
  UNION ALL
  SELECT '16 Matrículas pagadas de más (saldo negativo)',
         (SELECT COUNT(*) FROM matriculas m WHERE m.estado <> 'anulada'
             AND IFNULL(m.precio_total, m.monto) - m.monto - (SELECT IFNULL(SUM(p.monto), 0) FROM pagos_matricula p WHERE p.idmatricula = m.idmatricula) < -0.01)
  UNION ALL
  SELECT '17 Ventas sin su ingreso en caja',
         (SELECT COUNT(*) FROM ventas v WHERE v.anulada = 0
             AND NOT EXISTS (SELECT 1 FROM movimientos_caja c WHERE c.categoria = 'venta' AND c.idreferencia = v.idventa))
  UNION ALL
  SELECT '18 Ventas cuyo total no coincide con su detalle',
         (SELECT COUNT(*) FROM ventas v
           WHERE ABS(v.total - (SELECT IFNULL(SUM(d.subtotal), 0) FROM venta_detalle d WHERE d.idventa = v.idventa)) > 0.01)
  UNION ALL
  SELECT '19 Ventas sin productos',
         (SELECT COUNT(*) FROM ventas v WHERE NOT EXISTS (SELECT 1 FROM venta_detalle d WHERE d.idventa = v.idventa))
  UNION ALL
  -- 5) Stock: el stock del producto debe ser el del último movimiento del kárdex
  SELECT '20 Productos cuyo stock no coincide con el kárdex',
         (SELECT COUNT(*) FROM productos p
           WHERE EXISTS (SELECT 1 FROM movimientos_inventario k WHERE k.idproducto = p.idproducto)
             AND p.stock <> (SELECT k.stock_resultante FROM movimientos_inventario k WHERE k.idproducto = p.idproducto
                              ORDER BY k.fecha DESC, k.idmovimiento_inv DESC LIMIT 1))
  UNION ALL
  SELECT '21 Productos con stock negativo',
         (SELECT COUNT(*) FROM productos WHERE stock < 0)
  UNION ALL
  -- 6) Alumnos
  SELECT '22 Alumnos sin ninguna matrícula',
         (SELECT COUNT(*) FROM alumnos a WHERE NOT EXISTS (SELECT 1 FROM matriculas m WHERE m.idalumno = a.idalumno))
  UNION ALL
  SELECT '23 Alumnos sin usuario del portal',
         (SELECT COUNT(*) FROM alumnos a WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.idalumno = a.idalumno))
  UNION ALL
  SELECT '24 Alumnos sin código de asistencia',
         (SELECT COUNT(*) FROM alumnos WHERE codigo IS NULL)
  UNION ALL
  SELECT '25 Congelamientos fuera de su matrícula',
         (SELECT COUNT(*) FROM congelamientos c JOIN matriculas m ON m.idmatricula = c.idmatricula
           WHERE c.estado <> 'anulado' AND (c.idalumno <> m.idalumno OR c.fecha_inicio < m.fecha_inicio))
  UNION ALL
  SELECT '26 Registros de la app de alumnos que ya no existen',
         (SELECT COUNT(*) FROM registros_app r
           WHERE r.idalumno IS NULL AND r.modulo IN ('asignaciones_rutina', 'planes_nutricion', 'fisioterapia', 'evaluaciones_corporales')
             AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.datos, '$.memberId')), JSON_UNQUOTE(JSON_EXTRACT(r.datos, '$.targetStudentId'))) REGEXP '^[0-9]+$')
  UNION ALL
  -- 7) CRM
  SELECT '27 Prospectos matriculados sin alumno enlazado',
         (SELECT COUNT(*) FROM prospectos WHERE estado = 'matriculado' AND idalumno IS NULL)
  UNION ALL
  -- 8) Caja
  SELECT '28 Más de un turno de caja abierto a la vez',
         (SELECT GREATEST(COUNT(*) - 1, 0) FROM turnos_caja WHERE estado = 'abierto')
) chequeos
ORDER BY comprobacion;

-- Detalle de los registros que no se pudieron sincronizar (si hay)
SELECT modulo, idregistro, sync_estado, sync_detalle, fecha_actualizacion
  FROM registros_app WHERE sync_estado <> 'ok' ORDER BY fecha_actualizacion DESC LIMIT 50;

-- Resumen de cantidades
SELECT
  (SELECT COUNT(*) FROM alumnos) AS alumnos,
  (SELECT COUNT(*) FROM matriculas) AS matriculas,
  (SELECT COUNT(*) FROM pagos_matricula) AS abonos,
  (SELECT COUNT(*) FROM congelamientos) AS congelamientos,
  (SELECT COUNT(*) FROM asistencias_alumno) AS asistencias_alumnos,
  (SELECT COUNT(*) FROM asistencias_empleado) AS asistencias_personal,
  (SELECT COUNT(*) FROM seguimiento_asistencia) AS notas_ausencia,
  (SELECT COUNT(*) FROM ventas) AS ventas,
  (SELECT COUNT(*) FROM movimientos_caja) AS movimientos_caja,
  (SELECT COUNT(*) FROM prospectos) AS prospectos,
  (SELECT COUNT(*) FROM registros_app) AS registros_app;
