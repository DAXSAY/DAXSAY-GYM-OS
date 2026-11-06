-- =====================================================================
-- RADICAL GYM - ACTUALIZACIÓN 07 (30-oct-2026)
-- Sincroniza el sistema con las tablas reales de la base.
-- Para una base YA INSTALADA: NO borra datos. Se puede repetir.
--
-- Desde ahora cada cita, rutina, dieta, medida, sesión de fisioterapia,
-- asistencia, producto, contrato, planilla, clase y aviso que se guarde en
-- el sistema queda TAMBIÉN en su tabla (citas, rutinas + rutina_dias +
-- rutina_ejercicios, dietas + dieta_comidas + dieta_alimentos, medidas,
-- sesiones_fisioterapia + sesion_zonas + sesion_tecnicas, etc.), como
-- historial consultable desde Workbench.
--
--  1. Columna `idregistro_app` en cada tabla: une la fila con el registro
--     del sistema.
--  2. `registros_app.sync_estado`: ok / pendiente / error de cada registro.
--  3. Se permiten vacíos donde el sistema no siempre tiene el dato
--     (por ejemplo, la talla en una medida o el especialista en una cita).
--
-- Al reiniciar la API, todo lo que ya estaba guardado se copia solo a sus
-- tablas (estado "pendiente" -> "ok").
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

-- 1. Enlace con los registros del sistema
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'citas' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE citas ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_citas_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'rutinas' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE rutinas ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_rutinas_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'dietas' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE dietas ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_dietas_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'medidas' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE medidas ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_medidas_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'sesiones_fisioterapia' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE sesiones_fisioterapia ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_sesiones_fisioterapia_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'asistencias_alumno' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE asistencias_alumno ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_asistencias_alumno_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'asistencias_empleado' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE asistencias_empleado ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD INDEX idx_asistencias_empleado_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'productos' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE productos ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_productos_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'contratos' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE contratos ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_contratos_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'planilla' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE planilla ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_planilla_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'clases' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE clases ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_clases_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'reglas_notificacion' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE reglas_notificacion ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_reglas_notificacion_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'notificaciones' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE notificaciones ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_notificaciones_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'plantillas_fisioterapia' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE plantillas_fisioterapia ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_plantillas_fisioterapia_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ejercicios' AND column_name = 'idregistro_app');
SET @sql := IF(@falta, 'ALTER TABLE ejercicios ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT ''Id del registro en el sistema (registros_app)'', ADD UNIQUE INDEX idx_ejercicios_origen (idregistro_app)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

-- 2. Estado de sincronización de cada registro
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'registros_app' AND column_name = 'sync_estado');
SET @sql := IF(@falta, 'ALTER TABLE registros_app ADD COLUMN sync_estado ENUM(''pendiente'',''ok'',''error'') NOT NULL DEFAULT ''pendiente'' COMMENT ''Copia en su tabla'', ADD INDEX idx_registros_sync (sync_estado)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'registros_app' AND column_name = 'sync_detalle');
SET @sql := IF(@falta, 'ALTER TABLE registros_app ADD COLUMN sync_detalle VARCHAR(300) NULL COMMENT ''Motivo si no se pudo copiar''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'registros_app' AND column_name = 'sync_fecha');
SET @sql := IF(@falta, 'ALTER TABLE registros_app ADD COLUMN sync_fecha DATETIME NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

-- 3. Ejercicios del banco (GIF) dentro de las rutinas
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'rutina_ejercicios' AND column_name = 'codigo_ejercicio');
SET @sql := IF(@falta, 'ALTER TABLE rutina_ejercicios ADD COLUMN codigo_ejercicio VARCHAR(64) NULL COMMENT ''Código del ejercicio en el banco de GIFs''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'rutina_ejercicios' AND column_name = 'nombre_ejercicio');
SET @sql := IF(@falta, 'ALTER TABLE rutina_ejercicios ADD COLUMN nombre_ejercicio VARCHAR(150) NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'rutina_ejercicios' AND column_name = 'grupo_muscular');
SET @sql := IF(@falta, 'ALTER TABLE rutina_ejercicios ADD COLUMN grupo_muscular VARCHAR(40) NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'rutina_ejercicios' AND column_name = 'gif_url');
SET @sql := IF(@falta, 'ALTER TABLE rutina_ejercicios ADD COLUMN gif_url VARCHAR(300) NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

-- 4. Datos que el sistema no siempre tiene: se permiten vacíos
ALTER TABLE citas MODIFY idalumno INT NULL, MODIFY idempleado INT NULL;
ALTER TABLE dietas MODIFY idalumno INT NULL COMMENT 'NULL = plantilla general',
                   MODIFY idnutricionista INT NULL;
ALTER TABLE medidas MODIFY idevaluador INT NULL, MODIFY peso_kg DECIMAL(5,2) NULL,
                    MODIFY talla_cm DECIMAL(5,1) NULL, MODIFY cintura DECIMAL(5,1) NULL,
                    MODIFY cadera DECIMAL(5,1) NULL;
ALTER TABLE sesiones_fisioterapia MODIFY idfisioterapeuta INT NULL;
ALTER TABLE sesion_zonas MODIFY zona VARCHAR(40) NOT NULL;
ALTER TABLE rutina_ejercicios MODIFY idejercicio INT NULL COMMENT 'Ejercicio propio (NULL = del banco de GIFs)';
ALTER TABLE ejercicios MODIFY grupo_muscular VARCHAR(40) NOT NULL, MODIFY equipo VARCHAR(40) NOT NULL;
ALTER TABLE clases MODIFY hora_inicio TIME NULL, MODIFY hora_fin TIME NULL, MODIFY sala VARCHAR(60) NULL;

-- Lo ya guardado se copiará a sus tablas al reiniciar la API
UPDATE registros_app SET sync_estado = 'pendiente' WHERE sync_estado <> 'ok';

SELECT 'Actualización 07 aplicada' AS resultado,
       (SELECT COUNT(*) FROM information_schema.columns
         WHERE table_schema = DATABASE() AND column_name = 'idregistro_app') AS tablas_enlazadas,
       (SELECT COUNT(*) FROM registros_app) AS registros_por_copiar;
