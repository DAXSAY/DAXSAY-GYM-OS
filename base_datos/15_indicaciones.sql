-- =====================================================================
-- RADICAL GYM - Actualización 15: INDICACIONES PARA EL ALUMNO
-- Estiramientos, movilidad, calentamiento articular, postura y cuidados
-- ya predeterminados para que el entrenador o fisioterapeuta solo elija.
-- * Dosis estándar: estiramientos 3 x 30 s; movilidad y calentamiento 2 x 15.
-- * Cada indicación va "antes" (calentamiento), "despues" (post entrenamiento)
--   o "casa"; el profesional la cambia con un clic.
-- * Plantillas (ej. "Rectificación postural básica" = estiramiento pectoral +
--   movilización escapular) y cada profesional puede crear las suyas.
-- * Cada asignación al alumno queda guardada (historial); el alumno ve la vigente.
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

-- Catálogo de indicaciones (orden = de la cabeza a los pies)
CREATE TABLE IF NOT EXISTS indicaciones (
  idindicacion      INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(80)   NOT NULL UNIQUE,
  categoria         ENUM('calentamiento','movilidad','estiramiento','postura','cuidado') NOT NULL,
  zona              VARCHAR(20)   NOT NULL DEFAULT 'general',
  orden             SMALLINT      NOT NULL DEFAULT 0 COMMENT 'Orden cefalocaudal (cabeza -> pies)',
  series            TINYINT UNSIGNED  NULL,
  repeticiones      SMALLINT UNSIGNED NULL,
  segundos          SMALLINT UNSIGNED NULL COMMENT 'Duración por serie (estiramientos)',
  lugar_sugerido    ENUM('antes','despues','casa') NOT NULL DEFAULT 'despues',
  detalle           VARCHAR(255)  NULL COMMENT 'Cómo se hace',
  es_propia         TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1 = la agregó un profesional del gimnasio',
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  creado_por        INT           NULL,
  fecha_registro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ind_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_ind_cat (categoria, orden)
) ENGINE=InnoDB;

-- Plantillas: grupos de indicaciones que se aplican con un clic
CREATE TABLE IF NOT EXISTS indicaciones_plantillas (
  idplantilla       INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(80)   NOT NULL UNIQUE,
  descripcion       VARCHAR(200)  NULL,
  es_propia         TINYINT(1)    NOT NULL DEFAULT 0,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  creado_por        INT           NULL,
  fecha_registro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_indp_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS indicaciones_plantilla_items (
  idplantilla       INT           NOT NULL,
  idindicacion      INT           NOT NULL,
  lugar             ENUM('antes','despues','casa') NOT NULL,
  orden             SMALLINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (idplantilla, idindicacion),
  CONSTRAINT fk_indpi_plantilla FOREIGN KEY (idplantilla)  REFERENCES indicaciones_plantillas(idplantilla) ON DELETE CASCADE,
  CONSTRAINT fk_indpi_ind       FOREIGN KEY (idindicacion) REFERENCES indicaciones(idindicacion) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indicaciones asignadas a cada alumno (la última vigente; las anteriores quedan de historial)
CREATE TABLE IF NOT EXISTS alumno_indicaciones (
  idasignacion      INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idusuario         INT           NULL COMMENT 'Profesional que la indicó',
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notas             VARCHAR(500)  NULL,
  vigente           TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT fk_aind_alumno  FOREIGN KEY (idalumno)  REFERENCES alumnos(idalumno)   ON DELETE CASCADE,
  CONSTRAINT fk_aind_usuario FOREIGN KEY (idusuario) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_aind_alumno (idalumno, vigente, fecha)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alumno_indicacion_items (
  iditem            INT AUTO_INCREMENT PRIMARY KEY,
  idasignacion      INT           NOT NULL,
  idindicacion      INT           NULL,
  nombre            VARCHAR(80)   NOT NULL COMMENT 'Copia del nombre al momento de indicar',
  categoria         ENUM('calentamiento','movilidad','estiramiento','postura','cuidado') NOT NULL,
  lugar             ENUM('antes','despues','casa') NOT NULL,
  series            TINYINT UNSIGNED  NULL,
  repeticiones      SMALLINT UNSIGNED NULL,
  segundos          SMALLINT UNSIGNED NULL,
  detalle           VARCHAR(255)  NULL,
  orden             SMALLINT      NOT NULL DEFAULT 0,
  CONSTRAINT fk_aindi_asig FOREIGN KEY (idasignacion) REFERENCES alumno_indicaciones(idasignacion) ON DELETE CASCADE,
  CONSTRAINT fk_aindi_ind  FOREIGN KEY (idindicacion) REFERENCES indicaciones(idindicacion) ON DELETE SET NULL
) ENGINE=InnoDB;


INSERT IGNORE INTO indicaciones (nombre, categoria, zona, orden, series, repeticiones, segundos, lugar_sugerido, detalle) VALUES
('Movilidad de cabeza y cuello', 'calentamiento', 'cuello', 10, 2, 15, NULL, 'antes', 'Flexión, extensión, inclinaciones y giros suaves'),
('Movilidad de hombros', 'calentamiento', 'hombro', 20, 2, 15, NULL, 'antes', 'Círculos hacia adelante y hacia atrás'),
('Movilidad de codos y muñecas', 'calentamiento', 'brazo', 30, 2, 15, NULL, 'antes', 'Flexión-extensión y círculos'),
('Movilidad de tronco', 'calentamiento', 'tronco', 60, 2, 15, NULL, 'antes', 'Rotaciones e inclinaciones laterales'),
('Movilidad de cadera', 'calentamiento', 'cadera', 70, 2, 15, NULL, 'antes', 'Círculos de cadera de pie'),
('Movilidad de rodillas y tobillos', 'calentamiento', 'pierna', 90, 2, 15, NULL, 'antes', 'Flexión-extensión y círculos'),
('Movilización escapular', 'movilidad', 'hombro', 25, 2, 15, NULL, 'antes', 'Elevar, bajar, juntar y separar escápulas'),
('Rotaciones de hombro', 'movilidad', 'hombro', 22, 2, 15, NULL, 'antes', 'Rotación interna y externa, codo a 90°'),
('Movilización de dorsal', 'movilidad', 'espalda', 50, 2, 15, NULL, 'antes', 'Gato-camello / flexión de tronco con brazos extendidos'),
('Movilidad de cintura pélvica', 'movilidad', 'cadera', 68, 2, 15, NULL, 'antes', 'Báscula pélvica anterior y posterior'),
('Movilización de cadera', 'movilidad', 'cadera', 72, 2, 15, NULL, 'antes', 'Aperturas y rotaciones de cadera'),
('Movilización de tobillo', 'movilidad', 'tobillo', 95, 2, 15, NULL, 'antes', 'Rodilla al frente sin levantar el talón'),
('Estiramiento de trapecio lateral', 'estiramiento', 'cuello', 11, 3, NULL, 30, 'despues', 'Oreja al hombro, sin elevar el hombro contrario'),
('Estiramiento de trapecio frontal', 'estiramiento', 'cuello', 12, 3, NULL, 30, 'despues', 'Mentón al pecho, manos detrás de la cabeza sin jalar'),
('Estiramiento de hombro', 'estiramiento', 'hombro', 21, 3, NULL, 30, 'despues', 'Brazo cruzado al pecho'),
('Estiramiento de bíceps', 'estiramiento', 'brazo', 31, 3, NULL, 30, 'despues', 'Brazo extendido atrás, palma apoyada en la pared'),
('Estiramiento de tríceps', 'estiramiento', 'brazo', 32, 3, NULL, 30, 'despues', 'Codo arriba, mano a la espalda'),
('Estiramiento de pectoral', 'estiramiento', 'pecho', 40, 3, NULL, 30, 'despues', 'Antebrazo en el marco de la puerta, girar el tronco'),
('Estiramiento de dorsal frontal', 'estiramiento', 'espalda', 51, 3, NULL, 30, 'despues', 'Manos al frente, llevar la cadera atrás'),
('Estiramiento de dorsal lateral', 'estiramiento', 'espalda', 52, 3, NULL, 30, 'despues', 'Brazo arriba e inclinación al lado contrario'),
('Estiramiento lumbar', 'estiramiento', 'tronco', 62, 3, NULL, 30, 'despues', 'Rodillas al pecho, acostado boca arriba'),
('Estiramiento de glúteo', 'estiramiento', 'gluteo', 75, 3, NULL, 30, 'despues', 'Tobillo sobre la rodilla contraria (figura 4)'),
('Estiramiento de psoas', 'estiramiento', 'cadera', 76, 3, NULL, 30, 'despues', 'Zancada con rodilla atrás apoyada, cadera adelante'),
('Estiramiento de cuádriceps', 'estiramiento', 'muslo', 80, 3, NULL, 30, 'despues', 'Talón al glúteo, rodillas juntas'),
('Estiramiento de isquiotibiales', 'estiramiento', 'muslo', 81, 3, NULL, 30, 'despues', 'Pierna extendida, inclinar el tronco con espalda recta'),
('Estiramiento de aductores', 'estiramiento', 'muslo', 82, 3, NULL, 30, 'despues', 'Piernas abiertas o posición de mariposa'),
('Estiramiento de abductores', 'estiramiento', 'muslo', 83, 3, NULL, 30, 'despues', 'Cruzar la pierna por detrás e inclinar la cadera'),
('Estiramiento de pantorrilla', 'estiramiento', 'pierna', 91, 3, NULL, 30, 'despues', 'Talón apoyado, pierna de atrás extendida contra la pared'),
('Trasnuca con liga', 'postura', 'hombro', 23, 2, 15, NULL, 'despues', 'Liga tensa, pasar de adelante hacia atrás por encima de la cabeza'),
('Apertura de liga al pecho (pull apart)', 'postura', 'hombro', 24, 2, 15, NULL, 'despues', 'Brazos al frente, separar la liga juntando escápulas'),
('Retracción de mentón (chin tuck)', 'postura', 'cuello', 13, 2, 15, NULL, 'despues', 'Llevar el mentón atrás sin inclinar la cabeza'),
('Hielo en la zona de dolor', 'cuidado', 'general', 1, NULL, NULL, NULL, 'casa', '15 a 20 minutos sobre la zona, con un paño'),
('Diclofenaco en gel', 'cuidado', 'general', 2, NULL, NULL, NULL, 'casa', 'Aplicar en la zona según indicación'),
('Usar rodilleras al entrenar', 'cuidado', 'general', 3, NULL, NULL, NULL, 'casa', 'En ejercicios de piernas o de impacto'),
('Usar vendaje en la zona si es necesario', 'cuidado', 'general', 4, NULL, NULL, NULL, 'casa', 'Vendaje de soporte durante el entrenamiento');

INSERT IGNORE INTO indicaciones_plantillas (nombre, descripcion) VALUES
('Rectificación postural básica', 'Solo rectificación postural, sin patología'),
('Postura completa', 'Rectificación postural con trabajo de ligas'),
('Calentamiento articular general', 'Personas que inician: 2 x 15 de cada articulación'),
('Estiramientos básicos (patología crónica)', 'Toda la gama básica, de la cabeza a los pies'),
('Estiramientos básicos en casa', 'Cuando no le alcanza el tiempo en el gimnasio'),
('Dolor agudo: cuidados', 'Hielo, gel y protección para entrenar');

INSERT IGNORE INTO indicaciones_plantilla_items (idplantilla, idindicacion, lugar, orden)
SELECT p.idplantilla, i.idindicacion, x.l, x.o
  FROM (
    SELECT 'Rectificación postural básica' p, 'Estiramiento de pectoral' i, 'despues' l, 1 o UNION ALL
    SELECT 'Rectificación postural básica' p, 'Movilización escapular' i, 'despues' l, 2 o UNION ALL
    SELECT 'Postura completa' p, 'Movilización escapular' i, 'antes' l, 1 o UNION ALL
    SELECT 'Postura completa' p, 'Rotaciones de hombro' i, 'antes' l, 2 o UNION ALL
    SELECT 'Postura completa' p, 'Trasnuca con liga' i, 'despues' l, 3 o UNION ALL
    SELECT 'Postura completa' p, 'Apertura de liga al pecho (pull apart)' i, 'despues' l, 4 o UNION ALL
    SELECT 'Postura completa' p, 'Estiramiento de pectoral' i, 'despues' l, 5 o UNION ALL
    SELECT 'Postura completa' p, 'Estiramiento de trapecio lateral' i, 'despues' l, 6 o UNION ALL
    SELECT 'Calentamiento articular general' p, 'Movilidad de cabeza y cuello' i, 'antes' l, 1 o UNION ALL
    SELECT 'Calentamiento articular general' p, 'Movilidad de hombros' i, 'antes' l, 2 o UNION ALL
    SELECT 'Calentamiento articular general' p, 'Movilización escapular' i, 'antes' l, 3 o UNION ALL
    SELECT 'Calentamiento articular general' p, 'Movilidad de tronco' i, 'antes' l, 4 o UNION ALL
    SELECT 'Calentamiento articular general' p, 'Movilidad de cintura pélvica' i, 'antes' l, 5 o UNION ALL
    SELECT 'Calentamiento articular general' p, 'Movilidad de cadera' i, 'antes' l, 6 o UNION ALL
    SELECT 'Calentamiento articular general' p, 'Movilidad de rodillas y tobillos' i, 'antes' l, 7 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de trapecio lateral' i, 'despues' l, 1 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de trapecio frontal' i, 'despues' l, 2 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de hombro' i, 'despues' l, 3 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de bíceps' i, 'despues' l, 4 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de pectoral' i, 'despues' l, 5 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de dorsal frontal' i, 'despues' l, 6 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de dorsal lateral' i, 'despues' l, 7 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Movilización de dorsal' i, 'despues' l, 8 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Movilización escapular' i, 'despues' l, 9 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de glúteo' i, 'despues' l, 10 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Movilización de cadera' i, 'despues' l, 11 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de cuádriceps' i, 'despues' l, 12 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de isquiotibiales' i, 'despues' l, 13 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de aductores' i, 'despues' l, 14 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Estiramiento de pantorrilla' i, 'despues' l, 15 o UNION ALL
    SELECT 'Estiramientos básicos (patología crónica)' p, 'Movilización de tobillo' i, 'despues' l, 16 o UNION ALL
    SELECT 'Estiramientos básicos en casa' p, 'Estiramiento de trapecio lateral' i, 'casa' l, 1 o UNION ALL
    SELECT 'Estiramientos básicos en casa' p, 'Estiramiento de hombro' i, 'casa' l, 2 o UNION ALL
    SELECT 'Estiramientos básicos en casa' p, 'Estiramiento de pectoral' i, 'casa' l, 3 o UNION ALL
    SELECT 'Estiramientos básicos en casa' p, 'Estiramiento de dorsal lateral' i, 'casa' l, 4 o UNION ALL
    SELECT 'Estiramientos básicos en casa' p, 'Estiramiento de glúteo' i, 'casa' l, 5 o UNION ALL
    SELECT 'Estiramientos básicos en casa' p, 'Estiramiento de cuádriceps' i, 'casa' l, 6 o UNION ALL
    SELECT 'Estiramientos básicos en casa' p, 'Estiramiento de isquiotibiales' i, 'casa' l, 7 o UNION ALL
    SELECT 'Estiramientos básicos en casa' p, 'Estiramiento de pantorrilla' i, 'casa' l, 8 o UNION ALL
    SELECT 'Dolor agudo: cuidados' p, 'Hielo en la zona de dolor' i, 'casa' l, 1 o UNION ALL
    SELECT 'Dolor agudo: cuidados' p, 'Diclofenaco en gel' i, 'casa' l, 2 o UNION ALL
    SELECT 'Dolor agudo: cuidados' p, 'Usar rodilleras al entrenar' i, 'casa' l, 3 o UNION ALL
    SELECT 'Dolor agudo: cuidados' p, 'Usar vendaje en la zona si es necesario' i, 'casa' l, 4 o
  ) x
  JOIN indicaciones_plantillas p ON p.nombre = x.p
  JOIN indicaciones i ON i.nombre = x.i;

SELECT 'Actualizacion 15 aplicada' AS resultado,
       (SELECT COUNT(*) FROM indicaciones) AS indicaciones,
       (SELECT COUNT(*) FROM indicaciones_plantillas) AS plantillas,
       (SELECT COUNT(*) FROM indicaciones_plantilla_items) AS items_plantillas;
