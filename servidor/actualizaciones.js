// Actualizaciones de la base que el servidor aplica solo al iniciar (si faltan).
// Son las mismas de base_datos/22_pase_con_nombre.sql y 23_pases_libres.sql:
// así el sistema queda al día aunque nadie ejecute el script en Workbench.
// Todo es idempotente: si ya está aplicado, no hace nada.
import { consultar, pool } from "./db.js";

async function existeTabla(nombre) {
  const [f] = await consultar(
    "SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [nombre],
  );
  return Number(f?.n) > 0;
}

async function largoColumna(tabla, columna) {
  const [f] = await consultar(
    `SELECT CHARACTER_MAXIMUM_LENGTH AS n FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tabla, columna],
  );
  return f ? Number(f.n) : null;
}

const CREAR_PASES = `
CREATE TABLE IF NOT EXISTS pases_libres (
  idpase              INT AUTO_INCREMENT PRIMARY KEY,
  idprospecto         INT          NOT NULL,
  codigo              VARCHAR(24)  NOT NULL,
  fecha_visita        DATE         NOT NULL,
  hora_visita         TIME         NULL,
  estado              ENUM('pendiente','usado','no_concretado') NOT NULL DEFAULT 'pendiente',
  motivo_tipo         VARCHAR(30)  NULL,
  motivo              VARCHAR(300) NULL,
  volver_a_llamar     DATE         NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM: pases libres entregados y su resultado'`;

const RELLENAR_PASES = `
INSERT INTO pases_libres (idprospecto, codigo, fecha_visita, hora_visita, estado, usado_en, fecha_registro)
SELECT p.idprospecto, p.pase_codigo, p.pase_fecha,
       IF(p.contacto_fecha = p.pase_fecha, p.contacto_hora, NULL),
       IF(p.pase_usado_en IS NOT NULL, 'usado', IF(p.estado = 'de_baja', 'no_concretado', 'pendiente')),
       p.pase_usado_en, p.fecha_actualizacion
  FROM prospectos p
 WHERE p.pase_codigo IS NOT NULL AND p.pase_fecha IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM pases_libres x WHERE x.codigo = p.pase_codigo)`;

/** Aplica lo que falte. Devuelve la lista de cambios hechos. */
export async function aplicarActualizaciones() {
  const hechos = [];
  if (!(await existeTabla("prospectos"))) return hechos; // falta el script 20: no hay CRM todavía
  const largo = await largoColumna("prospectos", "pase_codigo");
  if (largo != null && largo < 24) {
    await pool.query("ALTER TABLE prospectos MODIFY COLUMN pase_codigo VARCHAR(24) NULL COMMENT 'Código del pase libre / invitación (NOMBRE-XXXXX)'");
    hechos.push("prospectos.pase_codigo ampliado a 24 (script 22)");
  }
  if (!(await existeTabla("pases_libres"))) {
    await pool.query(CREAR_PASES);
    hechos.push("tabla pases_libres creada (script 23)");
  }
  const [r] = await pool.query(RELLENAR_PASES);
  if (r.affectedRows) hechos.push(`${r.affectedRows} pases anteriores copiados a pases_libres`);
  return hechos;
}
