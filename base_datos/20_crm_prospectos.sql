-- =====================================================================
-- RADICAL - Actualización 20: CRM DE PROSPECTOS
-- Personas que vienen o escriben a preguntar (todavía no son alumnos):
-- * prospectos: nombre, celular, plan que le interesa, cuándo y cómo
--   contactarlo (llamada / WhatsApp / visita), pase libre con código,
--   estado (nuevo, en seguimiento, pase entregado, matriculado, de baja).
-- * prospecto_seguimientos: historial de cada contacto o cambio.
-- * Nuevo módulo "crm" (Prospectos) para administración y recepción.
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

CREATE TABLE IF NOT EXISTS prospectos (
  idprospecto           INT AUTO_INCREMENT PRIMARY KEY,
  nombres               VARCHAR(120) NOT NULL,
  celular               VARCHAR(20)  NOT NULL,
  correo                VARCHAR(120) NULL,
  dni                   VARCHAR(15)  NULL,
  idplan_interes        INT          NULL COMMENT 'Plan que le interesa',
  objetivo              VARCHAR(60)  NULL,
  origen                ENUM('visita','whatsapp','llamada','redes','referido','web','otro') NOT NULL DEFAULT 'visita',
  estado                ENUM('nuevo','seguimiento','pase_entregado','matriculado','de_baja') NOT NULL DEFAULT 'nuevo',
  contacto_tipo         ENUM('llamada','whatsapp','visita') NULL COMMENT 'Cómo quedó en que lo contactemos',
  contacto_fecha        DATE         NULL,
  contacto_hora         TIME         NULL,
  recordatorio_visto    TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Ya se mostró el aviso de 30 minutos antes',
  pase_codigo           VARCHAR(12)  NULL COMMENT 'Código del pase libre / invitación',
  pase_fecha            DATE         NULL COMMENT 'Día en que puede usar el pase',
  pase_usado_en         DATETIME     NULL,
  idalumno              INT          NULL COMMENT 'Alumno creado al matricularse',
  motivo_baja           VARCHAR(200) NULL,
  notas                 VARCHAR(500) NULL,
  idusuario_registro    INT          NULL,
  fecha_registro        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_prospecto_pase (pase_codigo),
  KEY ix_prospecto_estado (estado),
  KEY ix_prospecto_contacto (contacto_fecha, contacto_hora),
  KEY ix_prospecto_celular (celular),
  CONSTRAINT fk_prospecto_plan    FOREIGN KEY (idplan_interes)     REFERENCES planes (idplan)       ON DELETE SET NULL,
  CONSTRAINT fk_prospecto_alumno  FOREIGN KEY (idalumno)           REFERENCES alumnos (idalumno)    ON DELETE SET NULL,
  CONSTRAINT fk_prospecto_usuario FOREIGN KEY (idusuario_registro) REFERENCES usuarios (idusuario)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM: personas interesadas que aún no se matriculan';

CREATE TABLE IF NOT EXISTS prospecto_seguimientos (
  idseguimiento  INT AUTO_INCREMENT PRIMARY KEY,
  idprospecto    INT NOT NULL,
  fecha          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo           ENUM('nota','llamada','whatsapp','visita','estado','pase','agenda') NOT NULL DEFAULT 'nota',
  detalle        VARCHAR(300) NOT NULL,
  idusuario      INT NULL,
  KEY ix_seg_prospecto (idprospecto, fecha),
  CONSTRAINT fk_seg_prospecto FOREIGN KEY (idprospecto) REFERENCES prospectos (idprospecto) ON DELETE CASCADE,
  CONSTRAINT fk_seg_usuario   FOREIGN KEY (idusuario)   REFERENCES usuarios (idusuario)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historial de contactos con cada prospecto';

-- Módulo nuevo y permisos: administración (todo) y recepción (ver, crear, editar)
INSERT IGNORE INTO modulos (codigo, nombre, grupo, icono, orden) VALUES
('crm', 'Prospectos (CRM)', 'Operativo & Caja', 'Contact', 95);

INSERT IGNORE INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, p.ver, p.crear, p.editar, p.eliminar
  FROM (SELECT 'admin' rol, 1 ver, 1 crear, 1 editar, 1 eliminar UNION ALL
        SELECT 'reception',  1, 1, 1, 0) p
  JOIN roles r ON r.codigo = p.rol
  JOIN modulos m ON m.codigo = 'crm';

SELECT 'Actualización 20 lista' AS resultado,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()
         AND table_name IN ('prospectos', 'prospecto_seguimientos')) AS tablas_nuevas,
       (SELECT COUNT(*) FROM rol_permisos rp JOIN modulos m ON m.idmodulo = rp.idmodulo WHERE m.codigo = 'crm') AS permisos_crm;
