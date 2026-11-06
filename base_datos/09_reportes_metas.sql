-- =====================================================================
-- RADICAL GYM - ACTUALIZACIÓN 09 (30-oct-2026)
-- Reportes, metas y logros, deudas de alumnos y configuración.
-- Para una base YA INSTALADA: NO borra datos. Se puede repetir.
--
--  * configuracion: WhatsApp del gimnasio y del administrador, etc.
--  * turnos_recepcion: Turno 1, Turno 2... (cada recepcionista tiene el suyo)
--  * metas: meta en soles por turno de recepción y meta de logros por
--    entrenador, con su bono.
--  * objetivos_alumno: objetivo de cada alumno que nutrición o fisioterapia
--    evalúa; si se consigue, el entrenador gana un logro (mancuerna).
--  * bonos: bonos aprobados y pagados.
--  * pagos_matricula + matriculas.precio_total: pagos a cuenta y deudas.
--  * Módulos "Reportes" y "Metas & Logros".
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

CREATE TABLE IF NOT EXISTS configuracion (
  clave             VARCHAR(60)   PRIMARY KEY,
  valor             VARCHAR(500)  NULL,
  descripcion       VARCHAR(200)  NULL,
  actualizado_por   INT           NULL,
  fecha_actualizacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_usuario FOREIGN KEY (actualizado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Turnos fijos de recepción (Turno 1 mañana, Turno 2 tarde...) para las metas
CREATE TABLE IF NOT EXISTS turnos_recepcion (
  idturno_recepcion INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(60)   NOT NULL UNIQUE,
  hora_inicio       TIME          NULL,
  hora_fin          TIME          NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Pagos posteriores de una matrícula (saldo / deuda)
CREATE TABLE IF NOT EXISTS pagos_matricula (
  idpago            INT AUTO_INCREMENT PRIMARY KEY,
  idmatricula       INT           NOT NULL,
  monto             DECIMAL(10,2) NOT NULL,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NOT NULL DEFAULT 'efectivo',
  idusuario         INT           NULL,
  notas             VARCHAR(200)  NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagos_matricula FOREIGN KEY (idmatricula) REFERENCES matriculas(idmatricula) ON DELETE CASCADE,
  CONSTRAINT fk_pagos_usuario   FOREIGN KEY (idusuario)   REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT chk_pagos_monto CHECK (monto > 0),
  INDEX idx_pagos_fecha (fecha)
) ENGINE=InnoDB;

-- Metas: de recepción (dinero por turno) y de entrenadores (logros)
CREATE TABLE IF NOT EXISTS metas (
  idmeta            INT AUTO_INCREMENT PRIMARY KEY,
  tipo              ENUM('recepcion','entrenador') NOT NULL,
  idturno_recepcion INT           NULL COMMENT 'Meta de recepción: turno',
  idempleado        INT           NULL COMMENT 'Meta de entrenador',
  categoria         ENUM('ingresos','composicion','lesion','general') NOT NULL DEFAULT 'ingresos'
                    COMMENT 'composicion = peso/masa (nutrición); lesion = dolor/lesión (fisioterapia)',
  fecha_inicio      DATE          NOT NULL,
  fecha_fin         DATE          NOT NULL,
  monto_meta        DECIMAL(10,2) NULL COMMENT 'Soles (recepción)',
  logros_meta       SMALLINT      NULL COMMENT 'Mancuernas a conseguir (entrenador)',
  bono              DECIMAL(10,2) NOT NULL DEFAULT 0,
  notas             VARCHAR(300)  NULL,
  creado_por        INT           NULL,
  fecha_creacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_metas_turno    FOREIGN KEY (idturno_recepcion) REFERENCES turnos_recepcion(idturno_recepcion),
  CONSTRAINT fk_metas_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  CONSTRAINT fk_metas_creador  FOREIGN KEY (creado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT chk_metas_fechas  CHECK (fecha_fin >= fecha_inicio),
  INDEX idx_metas_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB;

-- Objetivos de cada alumno (bajar de peso, ganar masa, mejorar una lesión...)
-- Nutrición o fisioterapia los evalúan; si se consigue, el entrenador gana un logro.
CREATE TABLE IF NOT EXISTS objetivos_alumno (
  idobjetivo        INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  identrenador      INT           NULL COMMENT 'Entrenador que recibe el logro',
  area              ENUM('nutricion','fisioterapia') NOT NULL,
  tipo              ENUM('bajar_peso','ganar_masa','reducir_grasa','mejorar_lesion','reducir_dolor','movilidad','otro') NOT NULL,
  descripcion       VARCHAR(255)  NOT NULL,
  valor_inicial     DECIMAL(7,2)  NULL,
  valor_meta        DECIMAL(7,2)  NULL,
  valor_final       DECIMAL(7,2)  NULL,
  unidad            VARCHAR(20)   NULL COMMENT 'kg, %, EVA 0-10, grados...',
  fecha_inicio      DATE          NOT NULL,
  fecha_control     DATE          NOT NULL COMMENT 'Fecha prevista del nuevo control',
  estado            ENUM('en_proceso','conseguida','no_conseguida','cancelada') NOT NULL DEFAULT 'en_proceso',
  logro_otorgado    TINYINT(1)    NOT NULL DEFAULT 0,
  evaluado_por      INT           NULL,
  fecha_evaluacion  DATETIME      NULL,
  observacion       VARCHAR(300)  NULL,
  creado_por        INT           NULL,
  fecha_creacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_obj_alumno     FOREIGN KEY (idalumno)     REFERENCES alumnos(idalumno),
  CONSTRAINT fk_obj_entrenador FOREIGN KEY (identrenador) REFERENCES empleados(idempleado) ON DELETE SET NULL,
  CONSTRAINT fk_obj_evaluador  FOREIGN KEY (evaluado_por) REFERENCES empleados(idempleado) ON DELETE SET NULL,
  CONSTRAINT fk_obj_creador    FOREIGN KEY (creado_por)   REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_obj_entrenador (identrenador, estado, fecha_evaluacion),
  INDEX idx_obj_alumno (idalumno, estado)
) ENGINE=InnoDB;

-- Bonos aprobados por administración al cumplir una meta
CREATE TABLE IF NOT EXISTS bonos (
  idbono            INT AUTO_INCREMENT PRIMARY KEY,
  idmeta            INT           NULL,
  idempleado        INT           NULL,
  beneficiario      VARCHAR(120)  NOT NULL,
  monto             DECIMAL(10,2) NOT NULL,
  motivo            VARCHAR(200)  NOT NULL,
  estado            ENUM('aprobado','pagado','anulado') NOT NULL DEFAULT 'aprobado',
  aprobado_por      INT           NULL,
  fecha_aprobacion  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_pago        DATETIME      NULL,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NULL,
  CONSTRAINT fk_bonos_meta     FOREIGN KEY (idmeta)     REFERENCES metas(idmeta) ON DELETE SET NULL,
  CONSTRAINT fk_bonos_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado) ON DELETE SET NULL,
  CONSTRAINT fk_bonos_usuario  FOREIGN KEY (aprobado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT chk_bonos_monto CHECK (monto > 0)
) ENGINE=InnoDB;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'matriculas' AND column_name = 'precio_total');
SET @sql := IF(@falta, 'ALTER TABLE matriculas ADD COLUMN precio_total DECIMAL(10,2) NULL COMMENT ''Precio acordado (plan - descuento). monto = lo pagado al matricular''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'matriculas' AND column_name = 'es_renovacion');
SET @sql := IF(@falta, 'ALTER TABLE matriculas ADD COLUMN es_renovacion TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'empleados' AND column_name = 'horario');
SET @sql := IF(@falta, 'ALTER TABLE empleados ADD COLUMN horario VARCHAR(120) NULL COMMENT ''Horario de atención visible para alumnos''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'usuarios' AND column_name = 'idturno_recepcion');
SET @sql := IF(@falta, 'ALTER TABLE usuarios ADD COLUMN idturno_recepcion INT NULL COMMENT ''Turno fijo de recepción (metas)''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'turnos_caja' AND column_name = 'idturno_recepcion');
SET @sql := IF(@falta, 'ALTER TABLE turnos_caja ADD COLUMN idturno_recepcion INT NULL COMMENT ''Turno de recepción al que suma este turno de caja''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'usuarios' AND constraint_name = 'fk_usuarios_turno_recepcion');
SET @sql := IF(@falta, 'ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_turno_recepcion FOREIGN KEY (idturno_recepcion) REFERENCES turnos_recepcion(idturno_recepcion) ON DELETE SET NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'turnos_caja' AND constraint_name = 'fk_turnos_caja_recepcion');
SET @sql := IF(@falta, 'ALTER TABLE turnos_caja ADD CONSTRAINT fk_turnos_caja_recepcion FOREIGN KEY (idturno_recepcion) REFERENCES turnos_recepcion(idturno_recepcion) ON DELETE SET NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

INSERT IGNORE INTO configuracion (clave, valor, descripcion) VALUES
('gym_nombre',      'RADICAL', 'Nombre del gimnasio'),
('gym_whatsapp',    '',            'WhatsApp de recepción (alumnos)'),
('admin_whatsapp',  '',            'WhatsApp del administrador (reportes)'),
('gym_direccion',   '',            'Dirección'),
('gym_ruc',         '',            'RUC');

INSERT IGNORE INTO turnos_recepcion (nombre, hora_inicio, hora_fin) VALUES
('Turno 1 - Mañana', '06:00:00', '14:00:00'),
('Turno 2 - Tarde',  '14:00:00', '22:00:00');

INSERT IGNORE INTO modulos (codigo, nombre, grupo, icono, orden) VALUES
('reports', 'Reportes',        'Gestión & Personal', 'FileBarChart', 15),
('goals',   'Metas & Logros',  'Gestión & Personal', 'Trophy',       16);

INSERT IGNORE INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, 1, 1, 1, 1
  FROM roles r JOIN modulos m
 WHERE r.codigo = 'admin' AND m.grupo <> 'Portal del Alumno';

-- Metas: recepción y entrenador ven su avance; nutrición y fisioterapia evalúan objetivos
INSERT IGNORE INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, p.ver, p.crear, p.editar, 0
  FROM (SELECT 'reception' rol, 1 ver, 0 crear, 0 editar UNION ALL
        SELECT 'trainer',      1, 0, 0 UNION ALL
        SELECT 'nutritionist', 1, 1, 1 UNION ALL
        SELECT 'physio',       1, 1, 1) p
  JOIN roles r ON r.codigo = p.rol
  JOIN modulos m ON m.codigo = 'goals';

-- Matrículas antiguas: precio acordado = lo pagado (sin deuda)
UPDATE matriculas SET precio_total = monto WHERE precio_total IS NULL AND idmatricula > 0;

SELECT 'Actualizacion 09 aplicada' AS resultado,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()
         AND table_name IN ('configuracion','turnos_recepcion','pagos_matricula','metas','objetivos_alumno','bonos')) AS tablas_nuevas,
       (SELECT COUNT(*) FROM modulos WHERE codigo IN ('reports','goals')) AS modulos_nuevos;
