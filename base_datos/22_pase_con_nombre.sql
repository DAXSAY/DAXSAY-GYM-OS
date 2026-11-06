-- =====================================================================
-- RADICAL - Actualización 22: CÓDIGO DEL PASE LIBRE CON EL NOMBRE
-- El código del pase ahora lleva el nombre del interesado, por ejemplo
-- DAVID-K7Q2M (antes PASE-K7Q2). Se amplía la columna para que quepan
-- nombres largos (ALEJANDRA-K7Q2M). Los códigos que ya existen siguen
-- funcionando igual.
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

ALTER TABLE prospectos
  MODIFY COLUMN pase_codigo VARCHAR(24) NULL COMMENT 'Código del pase libre / invitación (NOMBRE-XXXXX)';

SELECT 'pase_codigo ampliado a 24 caracteres' AS resultado;
