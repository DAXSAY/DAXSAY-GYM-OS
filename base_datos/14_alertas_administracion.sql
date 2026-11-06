-- =====================================================================
-- RADICAL GYM - Actualización 14: ALERTAS PARA EL ADMINISTRADOR
-- Recepción puede cambiar la fecha límite de pago de una deuda; cada cambio
-- queda registrado y le llega al administrador como alerta en la campanita
-- (quién lo cambió, alumno, fecha anterior -> fecha nueva y deuda).
-- Si el cambio lo hace el propio administrador, queda solo como historial.
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

CREATE TABLE IF NOT EXISTS alertas_administracion (
  idalerta          INT AUTO_INCREMENT PRIMARY KEY,
  tipo              VARCHAR(40)   NOT NULL DEFAULT 'cambio_fecha_pago' COMMENT 'cambio_fecha_pago (se pueden agregar otros tipos)',
  titulo            VARCHAR(150)  NOT NULL,
  mensaje           VARCHAR(500)  NOT NULL,
  idalumno          INT           NULL,
  idusuario_origen  INT           NULL COMMENT 'Quién hizo el cambio',
  fecha_anterior    DATE          NULL,
  fecha_nueva       DATE          NULL,
  monto_deuda       DECIMAL(10,2) NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vista             TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1 = el administrador ya la vio',
  fecha_vista       DATETIME      NULL,
  idusuario_vista   INT           NULL,
  CONSTRAINT fk_alerta_alumno  FOREIGN KEY (idalumno)         REFERENCES alumnos(idalumno)   ON DELETE CASCADE,
  CONSTRAINT fk_alerta_origen  FOREIGN KEY (idusuario_origen) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT fk_alerta_vista   FOREIGN KEY (idusuario_vista)  REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_alerta_pendiente (vista, fecha)
) ENGINE=InnoDB;

SELECT 'Actualizacion 14 aplicada' AS resultado,
       (SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'alertas_administracion') AS tabla_alertas,
       (SELECT COUNT(*) FROM alertas_administracion WHERE vista = 0) AS alertas_pendientes;
