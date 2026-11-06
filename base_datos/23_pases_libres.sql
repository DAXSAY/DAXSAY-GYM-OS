-- =====================================================================
-- RADICAL - Actualización 23: HISTORIAL DE PASES LIBRES (CRM)
-- Cada pase libre que se entrega queda guardado con su resultado:
--   pendiente      -> aún no viene
--   usado          -> vino y recepción validó su QR
--   no_concretado  -> no vino / se canceló, con el MOTIVO (viaje, vacaciones,
--                     no le interesa...) y, si se quiere, la fecha para
--                     volver a llamarlo.
-- Sirve para el apartado "Pases libres" y el reporte del CRM (cuántas
-- personas vienen a preguntar por turno, cuántos pases se usan, motivos...).
-- El servidor también aplica este script solo al iniciar, si falta.
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

CREATE TABLE IF NOT EXISTS pases_libres (
  idpase              INT AUTO_INCREMENT PRIMARY KEY,
  idprospecto         INT          NOT NULL,
  codigo              VARCHAR(24)  NOT NULL,
  fecha_visita        DATE         NOT NULL COMMENT 'Día en que puede usar el pase',
  hora_visita         TIME         NULL,
  estado              ENUM('pendiente','usado','no_concretado') NOT NULL DEFAULT 'pendiente',
  motivo_tipo         VARCHAR(30)  NULL COMMENT 'viaje, vacaciones, no_interesa, salud, trabajo, horario, precio, no_contesta, otro',
  motivo              VARCHAR(300) NULL COMMENT 'Lo que dijo el interesado, en texto libre',
  volver_a_llamar     DATE         NULL COMMENT 'Fecha acordada para volver a contactarlo',
  reprogramaciones    INT          NOT NULL DEFAULT 0,
  usado_en            DATETIME     NULL,
  cerrado_en          DATETIME     NULL,
  idusuario_registro  INT          NULL,
  idusuario_cierre    INT          NULL,
  fecha_registro      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_pase_prospecto (idprospecto),
  KEY ix_pase_estado (estado, fecha_visita),
  KEY ix_pase_codigo (codigo),
  CONSTRAINT fk_pase_prospecto FOREIGN KEY (idprospecto) REFERENCES prospectos (idprospecto) ON DELETE CASCADE,
  CONSTRAINT fk_pase_usuario   FOREIGN KEY (idusuario_registro) REFERENCES usuarios (idusuario) ON DELETE SET NULL,
  CONSTRAINT fk_pase_cierre    FOREIGN KEY (idusuario_cierre)   REFERENCES usuarios (idusuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM: pases libres entregados y su resultado';

-- El código del pase lleva el nombre (DAVID-K7Q2M): columna más ancha (igual que el script 22)
ALTER TABLE prospectos MODIFY COLUMN pase_codigo VARCHAR(24) NULL COMMENT 'Código del pase libre / invitación (NOMBRE-XXXXX)';

-- Pases que ya existían antes de este script
INSERT INTO pases_libres (idprospecto, codigo, fecha_visita, hora_visita, estado, usado_en, fecha_registro)
SELECT p.idprospecto, p.pase_codigo, p.pase_fecha,
       IF(p.contacto_fecha = p.pase_fecha, p.contacto_hora, NULL),
       IF(p.pase_usado_en IS NOT NULL, 'usado', IF(p.estado = 'de_baja', 'no_concretado', 'pendiente')),
       p.pase_usado_en, p.fecha_actualizacion
  FROM prospectos p
 WHERE p.pase_codigo IS NOT NULL AND p.pase_fecha IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM pases_libres x WHERE x.codigo = p.pase_codigo);

SELECT 'pases_libres lista' AS resultado;
