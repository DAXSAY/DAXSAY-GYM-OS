-- =====================================================================
-- RADICAL GYM - ACTUALIZACIÓN 06 (30-oct-2026)
-- Caja por turnos (apertura, arqueo y cierre) y gestión de usuarios.
-- Para una base YA INSTALADA: NO borra datos, solo agrega.
-- Se puede ejecutar más de una vez sin problemas.
--
--  1. Tabla `turnos_caja`: cada recepcionista abre su caja, registra sus
--     ventas/cobros y la cierra con un arqueo. El siguiente turno ve lo
--     que dejó el anterior y continúa desde ese efectivo.
--  2. Columna `movimientos_caja.idturno` + trigger que asocia cada
--     movimiento al turno abierto.
--  3. Módulo "Apertura & Cierre de Caja" (cash) para recepción y admin.
--  4. Recepción inicia sesión directamente en su caja.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

-- Turnos de caja (apertura, arqueo y cierre por recepcionista).
-- Solo puede haber UN turno abierto a la vez (columna abierto_unico).
-- Cada ingreso o egreso que se registre mientras el turno está abierto
-- queda asociado a él (trigger trg_movimientos_caja_turno).
CREATE TABLE IF NOT EXISTS turnos_caja (
  idturno            INT AUTO_INCREMENT PRIMARY KEY,
  idturno_anterior   INT           NULL COMMENT 'Turno que entregó la caja',
  idusuario_apertura INT           NOT NULL,
  nombre_apertura    VARCHAR(120)  NOT NULL,
  fecha_apertura     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  monto_recibido     DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Efectivo que dejó el turno anterior',
  monto_apertura     DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Efectivo contado al abrir',
  obs_apertura       VARCHAR(300)  NULL,
  estado             ENUM('abierto','cerrado') NOT NULL DEFAULT 'abierto',
  abierto_unico      TINYINT       AS (IF(estado = 'abierto', 1, NULL)) STORED,
  idusuario_cierre   INT           NULL,
  nombre_cierre      VARCHAR(120)  NULL,
  fecha_cierre       DATETIME      NULL,
  ingresos_efectivo  DECIMAL(10,2) NULL,
  egresos_efectivo   DECIMAL(10,2) NULL,
  ingresos_tarjeta   DECIMAL(10,2) NULL,
  ingresos_yape_plin DECIMAL(10,2) NULL,
  ingresos_transferencia DECIMAL(10,2) NULL,
  egresos_otros      DECIMAL(10,2) NULL COMMENT 'Egresos pagados con otros medios',
  efectivo_esperado  DECIMAL(10,2) NULL,
  efectivo_contado   DECIMAL(10,2) NULL,
  diferencia         DECIMAL(10,2) NULL COMMENT 'Contado - esperado (+ sobra, - falta)',
  efectivo_entregado DECIMAL(10,2) NULL COMMENT 'Entregado a administración',
  efectivo_siguiente DECIMAL(10,2) NULL COMMENT 'Queda en caja para el siguiente turno',
  detalle_conteo     JSON          NULL COMMENT 'Billetes y monedas contados',
  obs_cierre         VARCHAR(300)  NULL,
  UNIQUE KEY uq_turno_abierto (abierto_unico),
  INDEX idx_turnos_apertura (fecha_apertura),
  CONSTRAINT fk_turno_anterior FOREIGN KEY (idturno_anterior)   REFERENCES turnos_caja(idturno) ON DELETE SET NULL,
  CONSTRAINT fk_turno_apertura FOREIGN KEY (idusuario_apertura) REFERENCES usuarios(idusuario),
  CONSTRAINT fk_turno_cierre   FOREIGN KEY (idusuario_cierre)   REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT chk_turno_montos  CHECK (monto_apertura >= 0 AND monto_recibido >= 0)
) ENGINE=InnoDB;


-- Columna idturno en movimientos_caja (solo si aún no existe)
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = 'movimientos_caja' AND column_name = 'idturno');
SET @sql := IF(@falta,
  'ALTER TABLE movimientos_caja
     ADD COLUMN idturno INT NULL COMMENT ''Turno de caja en que se registró'' AFTER idusuario_registro,
     ADD INDEX idx_mov_turno (idturno),
     ADD CONSTRAINT fk_mov_turno FOREIGN KEY (idturno) REFERENCES turnos_caja(idturno) ON DELETE SET NULL',
  'SELECT ''idturno ya existe'' AS aviso');
PREPARE paso FROM @sql;
EXECUTE paso;
DEALLOCATE PREPARE paso;

-- Cada ingreso o egreso se asocia al turno de caja que esté abierto
DROP TRIGGER IF EXISTS trg_movimientos_caja_turno;
CREATE TRIGGER trg_movimientos_caja_turno BEFORE INSERT ON movimientos_caja
FOR EACH ROW
  SET NEW.idturno = IFNULL(NEW.idturno, (SELECT t.idturno FROM turnos_caja t WHERE t.estado = 'abierto' LIMIT 1));

-- Módulo de caja por turnos
INSERT IGNORE INTO modulos (codigo, nombre, grupo, icono, orden) VALUES
('cash', 'Caja por Turnos', 'Operativo & Caja', 'Vault', 105);

-- Administrador: todo (menos el portal del alumno)
INSERT IGNORE INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, 1, 1, 1, 1
  FROM roles r JOIN modulos m
 WHERE r.codigo = 'admin' AND m.grupo <> 'Portal del Alumno';

-- Recepción: abrir, registrar y cerrar caja (no elimina turnos)
INSERT IGNORE INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, 1, 1, 1, 0
  FROM roles r JOIN modulos m
 WHERE r.codigo = 'reception' AND m.codigo = 'cash';

UPDATE roles SET modulo_inicio = 'cash',
       descripcion = 'Mostrador, caja por turnos, asistencias y ventas'
 WHERE codigo = 'reception';

SELECT 'Actualización 06 aplicada' AS resultado,
       (SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'turnos_caja') AS tabla_turnos,
       (SELECT COUNT(*) FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = 'movimientos_caja' AND column_name = 'idturno') AS columna_idturno,
       (SELECT COUNT(*) FROM modulos WHERE codigo = 'cash') AS modulo_caja;
