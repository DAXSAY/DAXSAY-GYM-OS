-- =====================================================================
-- RADICAL GYM - ACTUALIZACIÓN 05 (30-oct-2026)
-- Para una base YA INSTALADA: NO borra nada, solo agrega.
-- Se puede ejecutar más de una vez sin problemas.
--
--  1. Tabla `registros_app`: guarda en MySQL lo que antes quedaba solo en
--     el navegador (rutinas, dietas, evaluaciones, fisioterapia, citas,
--     asistencias, productos, avisos, contratos y planilla).
--  2. Portal del alumno: nuevos módulos Mi Rutina, Mi Plan de
--     Alimentación y Mi Fisioterapia (solo lectura de sus propios datos).
--  3. El administrador recibe permiso sobre todo menos el portal del alumno.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

-- =====================================================================
-- 11. REGISTROS DE LOS MÓDULOS DEL SISTEMA
-- Aquí se guarda todo lo que el sistema registra en sus pantallas
-- (rutinas, asignaciones, dietas, evaluaciones corporales, fisioterapia,
-- citas, asistencias, productos, avisos, contratos y planilla) para que
-- nada se pierda al cerrar el navegador y se vea desde cualquier equipo.
-- `idalumno` indica a qué alumno pertenece el registro: el portal del
-- alumno solo muestra los registros con su idalumno.
-- =====================================================================
CREATE TABLE IF NOT EXISTS registros_app (
  modulo            VARCHAR(40)   NOT NULL COMMENT 'rutinas, citas, fisioterapia, planes_nutricion, ...',
  idregistro        VARCHAR(64)   NOT NULL COMMENT 'Id del registro en el sistema',
  idalumno          INT           NULL COMMENT 'Alumno dueño del registro (si aplica)',
  datos             JSON          NOT NULL,
  creado_por        INT           NULL,
  actualizado_por   INT           NULL,
  fecha_creacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (modulo, idregistro),
  INDEX idx_registros_alumno (idalumno, modulo),
  CONSTRAINT fk_registros_alumno  FOREIGN KEY (idalumno)        REFERENCES alumnos(idalumno)   ON DELETE SET NULL,
  CONSTRAINT fk_registros_creador FOREIGN KEY (creado_por)      REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT fk_registros_editor  FOREIGN KEY (actualizado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Módulos del portal del alumno
INSERT IGNORE INTO modulos (codigo, nombre, grupo, icono, orden) VALUES
('mi_rutina',       'Mi Rutina',                'Portal del Alumno', 'Dumbbell',   230),
('mi_dieta',        'Mi Plan de Alimentación',  'Portal del Alumno', 'Utensils',   240),
('mi_fisioterapia', 'Mi Fisioterapia',          'Portal del Alumno', 'HeartPulse', 250);

-- Permisos del alumno: solo ver su portal
INSERT IGNORE INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, 1, 0, 0, 0
  FROM roles r JOIN modulos m
 WHERE r.codigo = 'student' AND m.grupo = 'Portal del Alumno';

-- El administrador ve y gestiona todo, menos el portal del alumno
INSERT IGNORE INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, 1, 1, 1, 1
  FROM roles r JOIN modulos m
 WHERE r.codigo = 'admin' AND m.grupo <> 'Portal del Alumno';

SELECT 'Actualización 05 aplicada' AS resultado,
       (SELECT COUNT(*) FROM modulos) AS modulos,
       (SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = 'gestion_radicalgym' AND table_name = 'registros_app') AS tabla_registros;
