-- =====================================================================
-- RADICAL GYM - Actualización 10: fecha límite para cancelar deudas
-- Si un alumno no paga completo, se registra hasta cuándo debe
-- cancelar el saldo. Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'matriculas' AND column_name = 'fecha_limite_pago');
SET @sql := IF(@falta, 'ALTER TABLE matriculas ADD COLUMN fecha_limite_pago DATE NULL COMMENT ''Fecha límite para cancelar el saldo (si no pagó completo)''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'matriculas' AND index_name = 'idx_matriculas_limite_pago');
SET @sql := IF(@falta, 'ALTER TABLE matriculas ADD INDEX idx_matriculas_limite_pago (fecha_limite_pago)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SELECT 'Actualizacion 10 aplicada' AS resultado,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE()
         AND table_name = 'matriculas' AND column_name = 'fecha_limite_pago') AS columna_nueva;
