-- =====================================================================
-- RADICAL GYM - Actualización 13: CÓDIGO DE ALUMNO Y CALENDARIO DE ASISTENCIAS
-- Cada alumno recibe un número correlativo único (1, 2, 3...) por orden de
-- registro. El sistema lo muestra con las iniciales: David Flores -> DF-1.
-- En recepción basta con escribir el número (1) o el código (DF1 / DF-1).
-- Los alumnos que ya existen se numeran por orden de registro.
-- Además: sección "Mis Asistencias" del portal del alumno (calendario).
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'alumnos' AND column_name = 'codigo');
SET @sql := IF(@falta, 'ALTER TABLE alumnos ADD COLUMN codigo INT UNSIGNED NULL COMMENT ''Código para marcar asistencia (se muestra con iniciales: DF-1)'' AFTER idalumno,
  ADD CONSTRAINT uq_alumnos_codigo UNIQUE (codigo)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

-- Numera a los alumnos que aún no tienen código, por orden de registro
SET @n := (SELECT IFNULL(MAX(codigo), 0) FROM alumnos);
UPDATE alumnos SET codigo = (@n := @n + 1) WHERE idalumno > 0 AND codigo IS NULL ORDER BY fecha_registro, idalumno;

SET @falta := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'alumnos' AND column_name = 'codigo' AND is_nullable = 'YES');
SET @sql := IF(@falta, 'ALTER TABLE alumnos MODIFY codigo INT UNSIGNED NOT NULL COMMENT ''Código para marcar asistencia (se muestra con iniciales: DF-1)''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

-- Los alumnos nuevos reciben el siguiente número automáticamente
DROP TRIGGER IF EXISTS trg_alumnos_codigo;
CREATE TRIGGER trg_alumnos_codigo BEFORE INSERT ON alumnos FOR EACH ROW
  SET NEW.codigo = IFNULL(NEW.codigo, (SELECT IFNULL(MAX(a.codigo), 0) + 1 FROM alumnos a));

-- Sección "Mis Asistencias" del portal del alumno
INSERT IGNORE INTO modulos (codigo, nombre, grupo, icono, orden) VALUES
('mis_asistencias', 'Mis Asistencias', 'Portal del Alumno', 'CalendarCheck', 260);
INSERT IGNORE INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, 1, 0, 0, 0 FROM roles r JOIN modulos m ON m.codigo = 'mis_asistencias' WHERE r.codigo = 'student';

SELECT 'Actualizacion 13 aplicada' AS resultado,
       (SELECT COUNT(*) FROM alumnos) AS alumnos,
       (SELECT COUNT(*) FROM alumnos WHERE codigo IS NULL) AS sin_codigo,
       (SELECT IFNULL(MAX(codigo), 0) FROM alumnos) AS ultimo_codigo,
       (SELECT COUNT(*) FROM rol_permisos rp JOIN modulos m USING (idmodulo) WHERE m.codigo = 'mis_asistencias') AS permiso_asistencias;
