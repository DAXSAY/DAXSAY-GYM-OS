-- =====================================================================
-- RADICAL - 99: DEJAR LA BASE EN CERO PARA PRODUCCIÓN
-- ¡ATENCIÓN! Borra TODOS los datos de prueba y de demostración:
--   alumnos, matrículas, pagos, congelamientos, asistencias (alumnos y
--   personal), seguimientos, rutinas, dietas, fisioterapia, medidas,
--   citas, clases, ventas, productos, kárdex, caja y turnos de caja,
--   contratos, planilla, metas, CRM (prospectos), notificaciones,
--   alertas, auditoría, historial de accesos y sesiones abiertas.
--
-- SE CONSERVA (configuración del sistema):
--   roles, módulos y permisos; usuarios del PERSONAL (admin, recepción,
--   entrenador...) y sus fichas de empleado; datos del gimnasio
--   (configuracion); planes (menos los "Prueba" de las pruebas
--   automáticas); catálogos: alimentos, ejercicios, técnicas y
--   plantillas de fisioterapia, indicaciones y sus plantillas,
--   plantillas de mensajes, reglas de notificación y turnos de recepción.
--
-- Uso: ANTES de abrir el gimnasio con datos reales.
--   1) Saca un respaldo (Server > Data Export) por si acaso.
--   2) Abre este archivo en MySQL Workbench y ejecútalo completo (rayo ⚡).
--   3) Entra con admin y cambia las contraseñas de todo el personal.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- Alumnos y todo lo que cuelga de ellos ----------
DELETE FROM seguimiento_asistencia;
DELETE FROM asistencias_alumno;
DELETE FROM congelamientos;
DELETE FROM pagos_matricula;
DELETE FROM matriculas;
DELETE FROM objetivos_alumno;
DELETE FROM medidas;
DELETE FROM alumno_indicacion_items;
DELETE FROM alumno_indicaciones;
DELETE FROM dieta_alimentos;
DELETE FROM dieta_platos;
DELETE FROM dieta_comidas;
DELETE FROM dietas;
DELETE FROM rutina_ejercicios;
DELETE FROM rutina_dias;
DELETE FROM rutinas;
DELETE FROM sesion_tecnicas;
DELETE FROM sesion_zonas;
DELETE FROM sesiones_fisioterapia;
DELETE FROM clase_inscripciones;
DELETE FROM clases;
DELETE FROM citas;
DELETE FROM recuperacion_clave;
DELETE FROM usuario_permisos WHERE idusuario IN (SELECT idusuario FROM usuarios WHERE idalumno IS NOT NULL);
DELETE FROM sesiones;
DELETE FROM usuarios WHERE idalumno IS NOT NULL;
DELETE FROM alumnos;

-- ---------- CRM ----------
DELETE FROM prospecto_seguimientos;
DELETE FROM prospectos;

-- ---------- Tienda, caja y finanzas ----------
DELETE FROM venta_detalle;
DELETE FROM ventas;
DELETE FROM movimientos_inventario;
DELETE FROM productos;
DELETE FROM movimientos_caja;
DELETE FROM turnos_caja;
DELETE FROM metas;
DELETE FROM bonos;

-- ---------- Personal: asistencias, contratos y planilla ----------
DELETE FROM asistencias_empleado;
DELETE FROM permisos_laborales;
DELETE FROM horarios_empleado;
DELETE FROM planilla;
DELETE FROM contratos;
-- Fichas de empleado que no tienen usuario (las creó la demo o las pruebas)
DELETE FROM empleados WHERE idempleado NOT IN (SELECT idempleado FROM usuarios WHERE idempleado IS NOT NULL);

-- ---------- Avisos ----------
DELETE FROM notificaciones;
DELETE FROM alertas_administracion;

-- ---------- Registros de la app (copia JSON) ----------
-- Solo quedan las plantillas de fisioterapia y las reglas de notificación
DELETE FROM registros_app WHERE modulo NOT IN ('plantillas_fisioterapia', 'reglas_notificacion');

-- ---------- Planes creados por las pruebas automáticas ----------
DELETE FROM planes WHERE nombre REGEXP '^(Promo|Anual) Prueba [0-9]+( [0-9]+)?$';

-- ---------- Bitácoras ----------
DELETE FROM historial_accesos;
DELETE FROM auditoria;

SET FOREIGN_KEY_CHECKS = 1;

-- La numeración de alumnos vuelve a empezar (código DF-1, DF-2...)
ALTER TABLE alumnos AUTO_INCREMENT = 1000;
ALTER TABLE matriculas AUTO_INCREMENT = 1;
ALTER TABLE ventas AUTO_INCREMENT = 1;
ALTER TABLE movimientos_caja AUTO_INCREMENT = 1;
ALTER TABLE turnos_caja AUTO_INCREMENT = 1;
ALTER TABLE prospectos AUTO_INCREMENT = 1;

-- Comprobación: todo en 0 menos lo que se conserva
SELECT
  (SELECT COUNT(*) FROM alumnos) AS alumnos,
  (SELECT COUNT(*) FROM matriculas) AS matriculas,
  (SELECT COUNT(*) FROM asistencias_alumno) AS asistencias,
  (SELECT COUNT(*) FROM ventas) AS ventas,
  (SELECT COUNT(*) FROM productos) AS productos,
  (SELECT COUNT(*) FROM movimientos_caja) AS caja,
  (SELECT COUNT(*) FROM prospectos) AS prospectos,
  (SELECT COUNT(*) FROM registros_app) AS registros_app_quedan,
  (SELECT COUNT(*) FROM usuarios) AS usuarios_personal,
  (SELECT COUNT(*) FROM planes) AS planes;
