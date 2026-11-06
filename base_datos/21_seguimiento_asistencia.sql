-- =====================================================================
-- RADICAL - Actualización 21: SEGUIMIENTO DE ASISTENCIA DEL ALUMNO
-- Cuando un alumno deja de venir, administración, recepción o el
-- entrenador anotan el motivo (salud, viaje, trabajo, lesión...) y si
-- ya lo contactaron. Se ve en el calendario de asistencias del alumno.
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

CREATE TABLE IF NOT EXISTS seguimiento_asistencia (
  idseguimiento      INT AUTO_INCREMENT PRIMARY KEY,
  idalumno           INT          NOT NULL,
  fecha              DATE         NOT NULL COMMENT 'Día (o inicio del periodo) al que se refiere',
  fecha_hasta        DATE         NULL COMMENT 'Fin del periodo, si avisó que faltará varios días',
  motivo             ENUM('salud','lesion','viaje','trabajo','estudios','economico','motivacion','horario','otro') NOT NULL DEFAULT 'otro',
  detalle            VARCHAR(300) NULL,
  contactado         TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Se le llamó o escribió',
  medio              ENUM('llamada','whatsapp','presencial','ninguno') NOT NULL DEFAULT 'ninguno',
  idusuario_registro INT          NULL,
  fecha_registro     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_seg_asis_alumno (idalumno, fecha),
  CONSTRAINT fk_seg_asis_alumno FOREIGN KEY (idalumno) REFERENCES alumnos(idalumno) ON DELETE CASCADE,
  CONSTRAINT fk_seg_asis_usuario FOREIGN KEY (idusuario_registro) REFERENCES usuarios(idusuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT 'seguimiento_asistencia lista' AS resultado;
