-- =====================================================================
-- RADICAL GYM - Actualización 11: CONGELAMIENTO DE MEMBRESÍAS
--
-- * Cada plan define si permite congelar y cómo:
--     congelamiento_dias      total de días que se pueden congelar (0 = no permite)
--     congelamiento_partes    en cuántas veces como máximo (1 = todo de una vez)
--     congelamiento_min_dias  mínimo de días por cada congelamiento
--   Ej.: Promo S/150 -> 0 días (sin congelamiento)
--        Anual S/900 -> 30 días, 2 partes, mínimo 15 (30 seguidos o 15 + 15)
-- * Cada matrícula guarda las condiciones del plan el día que se vendió
--   (si después se cambia el plan, al alumno se le respeta lo que compró).
-- * Cada congelamiento tiene fecha de inicio y fecha de fin (caducidad):
--   ese día el alumno se reactiva solo. La membresía se alarga los mismos días.
-- * El derecho a congelar caduca cuando vence la membresía.
--
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

-- 1) Reglas de congelamiento en cada plan -------------------------------
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'planes' AND column_name = 'congelamiento_dias');
SET @sql := IF(@falta, 'ALTER TABLE planes
  ADD COLUMN congelamiento_dias SMALLINT NOT NULL DEFAULT 0 COMMENT ''Días de congelamiento permitidos (0 = no permite)'',
  ADD COLUMN congelamiento_partes TINYINT NOT NULL DEFAULT 1 COMMENT ''Máximo de congelamientos (1 = todo de una vez)'',
  ADD COLUMN congelamiento_min_dias SMALLINT NOT NULL DEFAULT 0 COMMENT ''Mínimo de días por congelamiento'',
  ADD CONSTRAINT chk_planes_congelamiento CHECK (congelamiento_dias >= 0 AND congelamiento_partes BETWEEN 1 AND 12
       AND congelamiento_min_dias >= 0 AND congelamiento_min_dias <= congelamiento_dias)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @recien_creado := @falta;

-- 2) Condiciones congeladas en la matrícula (lo que el alumno compró) ----
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'matriculas' AND column_name = 'congelamiento_dias');
SET @sql := IF(@falta, 'ALTER TABLE matriculas
  ADD COLUMN congelamiento_dias SMALLINT NULL COMMENT ''Días de congelamiento que trae esta matrícula (copia del plan)'',
  ADD COLUMN congelamiento_partes TINYINT NULL,
  ADD COLUMN congelamiento_min_dias SMALLINT NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

-- 3) Historial de congelamientos ----------------------------------------
CREATE TABLE IF NOT EXISTS congelamientos (
  idcongelamiento   INT AUTO_INCREMENT PRIMARY KEY,
  idmatricula       INT           NOT NULL,
  idalumno          INT           NOT NULL,
  fecha_inicio      DATE          NOT NULL,
  fecha_fin         DATE          NOT NULL COMMENT 'Último día congelado; al día siguiente se reactiva solo',
  dias              SMALLINT      NOT NULL,
  dias_usados       SMALLINT      NULL COMMENT 'Solo si se terminó antes: días realmente congelados',
  motivo            VARCHAR(200)  NOT NULL,
  estado            ENUM('vigente','terminado_antes','anulado') NOT NULL DEFAULT 'vigente'
                    COMMENT 'vigente = programado, activo o cumplido según las fechas',
  fin_membresia_antes   DATE      NOT NULL COMMENT 'Vencimiento antes de congelar',
  fin_membresia_despues DATE      NOT NULL COMMENT 'Vencimiento después de congelar',
  idusuario_registro INT          NULL,
  fecha_registro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idusuario_cierre  INT           NULL,
  fecha_cierre      DATETIME      NULL,
  observacion_cierre VARCHAR(200) NULL,
  CONSTRAINT fk_cong_matricula FOREIGN KEY (idmatricula) REFERENCES matriculas(idmatricula),
  CONSTRAINT fk_cong_alumno    FOREIGN KEY (idalumno)    REFERENCES alumnos(idalumno),
  CONSTRAINT fk_cong_usuario   FOREIGN KEY (idusuario_registro) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT fk_cong_cierre    FOREIGN KEY (idusuario_cierre)   REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT chk_cong_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT chk_cong_dias   CHECK (dias > 0),
  INDEX idx_cong_alumno (idalumno, estado, fecha_inicio, fecha_fin),
  INDEX idx_cong_matricula (idmatricula, estado),
  INDEX idx_cong_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB;

-- 4) Ejemplo de reglas en los planes largos (solo la primera vez que se ejecuta;
--    luego cada plan se configura en Planes & Tarifas)
UPDATE planes SET congelamiento_dias = 30, congelamiento_partes = 2, congelamiento_min_dias = 15
 WHERE idplan > 0 AND @recien_creado = 1 AND duracion_meses >= 12;
UPDATE planes SET congelamiento_dias = 15, congelamiento_partes = 1, congelamiento_min_dias = 15
 WHERE idplan > 0 AND @recien_creado = 1 AND duracion_meses = 6;

-- 5) Las matrículas ya vendidas toman las reglas actuales de su plan
UPDATE matriculas m JOIN planes p ON p.idplan = m.idplan
   SET m.congelamiento_dias = p.congelamiento_dias,
       m.congelamiento_partes = p.congelamiento_partes,
       m.congelamiento_min_dias = p.congelamiento_min_dias
 WHERE m.idmatricula > 0 AND m.congelamiento_dias IS NULL;

SELECT 'Actualizacion 11 aplicada' AS resultado,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()
         AND table_name = 'congelamientos') AS tabla_nueva,
       (SELECT COUNT(*) FROM planes WHERE congelamiento_dias > 0) AS planes_con_congelamiento;
