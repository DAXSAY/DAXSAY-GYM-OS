-- =====================================================================
-- RADICAL - Actualización 19: MÁS MEDIDAS CON LA MANO EN LOS PLATOS
-- * dieta_platos: porciones opcionales de fruta (puño), queso/lácteo
--   (dos dedos), frutos secos (puñado chico) y aceite (punta del dedo).
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'dieta_platos' AND column_name = 'punos_fruta');
SET @sql := IF(@falta, 'ALTER TABLE dieta_platos ADD COLUMN punos_fruta DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT ''Puños de fruta'' AFTER pulgares_grasa', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'dieta_platos' AND column_name = 'dedos_lacteo');
SET @sql := IF(@falta, 'ALTER TABLE dieta_platos ADD COLUMN dedos_lacteo DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT ''Porciones de queso/lácteo (dos dedos)'' AFTER punos_fruta', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'dieta_platos' AND column_name = 'punados_frutos_secos');
SET @sql := IF(@falta, 'ALTER TABLE dieta_platos ADD COLUMN punados_frutos_secos DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT ''Puñados chicos de frutos secos'' AFTER dedos_lacteo', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'dieta_platos' AND column_name = 'puntas_aceite');
SET @sql := IF(@falta, 'ALTER TABLE dieta_platos ADD COLUMN puntas_aceite DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT ''Cucharaditas de aceite (punta del dedo)'' AFTER punados_frutos_secos', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SELECT 'Actualización 19 lista' AS resultado;
