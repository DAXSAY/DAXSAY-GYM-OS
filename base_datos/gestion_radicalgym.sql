-- =====================================================================
-- RADICAL GYM - INSTALACIÓN COMPLETA (une los scripts 01 a 04)
-- Abre este archivo en MySQL Workbench y ejecútalo completo (rayo ⚡).
-- ATENCIÓN: borra y vuelve a crear la base gestion_radicalgym.
-- =====================================================================

-- =====================================================================
-- RADICAL GYM - Esquema de base de datos  (MySQL 8 o superior)
-- Base: gestion_radicalgym
--
-- Basado en el diseño de Darío (tablas y columnas en español,
-- identificadores idalumno / idempleado, numeración desde 1000),
-- con estos cambios:
--   * Sin salón de spinning (el gimnasio no lo tiene).
--   * Seguridad nueva: roles, módulos, permisos por rol y por usuario,
--     sesiones, historial de accesos y bloqueo por intentos fallidos.
--   * Fisioterapia ampliada para guardar la evaluación postural,
--     funcional y la dosificación de ejercicios que usa el sistema.
--
-- ATENCIÓN: este script BORRA y vuelve a crear la base completa.
-- Úsalo solo para la instalación inicial o en desarrollo.
-- =====================================================================

DROP DATABASE IF EXISTS gestion_radicalgym;
SET NAMES utf8mb4;
CREATE DATABASE gestion_radicalgym CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_radicalgym;

-- =====================================================================
-- 1. SEGURIDAD Y ADMINISTRACIÓN DE USUARIOS
-- =====================================================================

-- Roles del sistema. Se pueden crear roles nuevos sin tocar el código.
CREATE TABLE roles (
  idrol             INT AUTO_INCREMENT PRIMARY KEY,
  codigo            VARCHAR(30)   NOT NULL UNIQUE COMMENT 'Clave usada por la app: admin, trainer, physio...',
  nombre            VARCHAR(60)   NOT NULL,
  descripcion       VARCHAR(255)  NULL,
  modulo_inicio     VARCHAR(40)   NULL COMMENT 'Módulo que se abre al iniciar sesión',
  es_sistema        TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1 = rol base, no se puede eliminar',
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  fecha_creacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Módulos (pantallas) del sistema, en el orden del menú.
CREATE TABLE modulos (
  idmodulo          INT AUTO_INCREMENT PRIMARY KEY,
  codigo            VARCHAR(40)   NOT NULL UNIQUE COMMENT 'Igual al id de pestaña en src/config/roles.js',
  nombre            VARCHAR(80)   NOT NULL,
  grupo             VARCHAR(60)   NULL COMMENT 'Sección del menú',
  icono             VARCHAR(40)   NULL,
  orden             SMALLINT      NOT NULL DEFAULT 0,
  activo            TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Qué puede hacer cada rol en cada módulo.
CREATE TABLE rol_permisos (
  idrol             INT           NOT NULL,
  idmodulo          INT           NOT NULL,
  puede_ver         TINYINT(1)    NOT NULL DEFAULT 1,
  puede_crear       TINYINT(1)    NOT NULL DEFAULT 0,
  puede_editar      TINYINT(1)    NOT NULL DEFAULT 0,
  puede_eliminar    TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (idrol, idmodulo),
  CONSTRAINT fk_rp_rol    FOREIGN KEY (idrol)    REFERENCES roles(idrol)     ON DELETE CASCADE,
  CONSTRAINT fk_rp_modulo FOREIGN KEY (idmodulo) REFERENCES modulos(idmodulo) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 2. PERSONAS: PERSONAL Y ALUMNOS
-- =====================================================================
CREATE TABLE planes (
  idplan            INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(80)   NOT NULL UNIQUE,
  duracion_meses    TINYINT       NOT NULL DEFAULT 0,
  duracion_dias     SMALLINT      NOT NULL DEFAULT 0 COMMENT 'Para pases diarios o semanales',
  precio            DECIMAL(10,2) NOT NULL,
  incluye_entrenador TINYINT(1)   NOT NULL DEFAULT 0,
  incluye_nutricion  TINYINT(1)   NOT NULL DEFAULT 0,
  incluye_fisioterapia TINYINT(1) NOT NULL DEFAULT 0,
  descripcion       VARCHAR(255)  NULL,
  caracteristicas   VARCHAR(600)  NULL COMMENT 'Lista separada por |',
  destacado         TINYINT(1)    NOT NULL DEFAULT 0,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT chk_planes_precio CHECK (precio >= 0),
  CONSTRAINT chk_planes_duracion CHECK (duracion_meses > 0 OR duracion_dias > 0)
) ENGINE=InnoDB;

CREATE TABLE empleados (
  idempleado        INT AUTO_INCREMENT PRIMARY KEY,
  dni               CHAR(8)       NULL UNIQUE,
  nombres           VARCHAR(80)   NOT NULL,
  apellidos         VARCHAR(80)   NOT NULL,
  sexo              ENUM('M','F') NOT NULL DEFAULT 'M',
  fecha_nacimiento  DATE          NULL,
  telefono          VARCHAR(20)   NULL,
  correo            VARCHAR(120)  NULL UNIQUE,
  cargo             ENUM('administrador','entrenador','recepcion','nutricionista','fisioterapeuta','mantenimiento') NOT NULL,
  titulo_cargo      VARCHAR(120)  NULL,
  especialidad      VARCHAR(120)  NULL,
  biografia         VARCHAR(500)  NULL,
  calificacion      DECIMAL(2,1)  NOT NULL DEFAULT 5.0,
  colegiatura       VARCHAR(30)   NULL COMMENT 'N° de colegiatura (nutrición / fisioterapia)',
  cuenta_bancaria   VARCHAR(40)   NULL,
  foto              VARCHAR(200)  NULL,
  fecha_ingreso     DATE          NOT NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  INDEX idx_empleados_cargo (cargo)
) ENGINE=InnoDB AUTO_INCREMENT=1000;

CREATE TABLE alumnos (
  idalumno          INT AUTO_INCREMENT PRIMARY KEY,
  codigo            INT UNSIGNED  NOT NULL UNIQUE COMMENT 'Código para marcar asistencia (se muestra con iniciales: DF-1); lo pone el trigger',
  dni               CHAR(8)       NOT NULL UNIQUE,
  nombres           VARCHAR(80)   NOT NULL,
  apellidos         VARCHAR(80)   NOT NULL,
  sexo              ENUM('M','F','O') NOT NULL,
  fecha_nacimiento  DATE          NULL,
  telefono          VARCHAR(20)   NULL,
  correo            VARCHAR(120)  NULL UNIQUE,
  direccion         VARCHAR(200)  NULL,
  contacto_emergencia   VARCHAR(120) NULL,
  telefono_emergencia   VARCHAR(20)  NULL,
  parentesco_emergencia VARCHAR(40)  NULL,
  restricciones_medicas VARCHAR(255) NULL,
  objetivo          ENUM('hipertrofia','perdida_peso','fuerza','resistencia','tonificacion','rehabilitacion') NOT NULL DEFAULT 'tonificacion',
  identrenador      INT           NULL COMMENT 'Entrenador asignado',
  idrutina          INT           NULL COMMENT 'Rutina asignada (FK al final del script)',
  notas             VARCHAR(300)  NULL,
  foto              VARCHAR(200)  NULL,
  fecha_registro    DATE          NOT NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT fk_alumnos_entrenador FOREIGN KEY (identrenador) REFERENCES empleados(idempleado) ON DELETE SET NULL,
  INDEX idx_alumnos_nombre (apellidos, nombres)
) ENGINE=InnoDB AUTO_INCREMENT=1000;

-- Cuentas de acceso. Un usuario es personal (idempleado) o alumno (idalumno).
CREATE TABLE usuarios (
  idusuario         INT AUTO_INCREMENT PRIMARY KEY,
  usuario           VARCHAR(40)   NOT NULL UNIQUE,
  clave_hash        VARCHAR(255)  NOT NULL COMMENT 'bcrypt. Nunca guardar la clave en texto plano',
  idrol             INT           NOT NULL,
  idempleado        INT           NULL UNIQUE,
  idalumno          INT           NULL UNIQUE,
  correo            VARCHAR(120)  NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  debe_cambiar_clave TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'Obliga a cambiar la clave en el próximo ingreso',
  intentos_fallidos TINYINT       NOT NULL DEFAULT 0,
  bloqueado_hasta   DATETIME      NULL COMMENT 'Bloqueo temporal tras varios intentos fallidos',
  ultimo_acceso     DATETIME      NULL,
  fecha_cambio_clave DATETIME     NULL,
  creado_por        INT           NULL,
  fecha_creacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_rol      FOREIGN KEY (idrol)      REFERENCES roles(idrol),
  CONSTRAINT fk_usuarios_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  CONSTRAINT fk_usuarios_alumno   FOREIGN KEY (idalumno)   REFERENCES alumnos(idalumno),
  CONSTRAINT fk_usuarios_creador  FOREIGN KEY (creado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT chk_usuarios_persona CHECK (idempleado IS NULL OR idalumno IS NULL)
) ENGINE=InnoDB;

-- Excepciones de permiso por usuario (dar o quitar un módulo a una persona).
CREATE TABLE usuario_permisos (
  idusuario         INT           NOT NULL,
  idmodulo          INT           NOT NULL,
  puede_ver         TINYINT(1)    NOT NULL DEFAULT 1,
  puede_crear       TINYINT(1)    NOT NULL DEFAULT 0,
  puede_editar      TINYINT(1)    NOT NULL DEFAULT 0,
  puede_eliminar    TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (idusuario, idmodulo),
  CONSTRAINT fk_up_usuario FOREIGN KEY (idusuario) REFERENCES usuarios(idusuario) ON DELETE CASCADE,
  CONSTRAINT fk_up_modulo  FOREIGN KEY (idmodulo)  REFERENCES modulos(idmodulo)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sesiones abiertas (token). Permite cerrar sesiones a distancia.
CREATE TABLE sesiones (
  idsesion          BIGINT AUTO_INCREMENT PRIMARY KEY,
  idusuario         INT           NOT NULL,
  token_id          CHAR(32)      NOT NULL UNIQUE COMMENT 'Identificador del token (jti), no el token completo',
  ip                VARCHAR(45)   NULL,
  dispositivo       VARCHAR(255)  NULL,
  fecha_inicio      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_expira      DATETIME      NOT NULL,
  fecha_cierre      DATETIME      NULL,
  CONSTRAINT fk_sesiones_usuario FOREIGN KEY (idusuario) REFERENCES usuarios(idusuario) ON DELETE CASCADE,
  INDEX idx_sesiones_activas (idusuario, fecha_cierre, fecha_expira)
) ENGINE=InnoDB;

-- Registro de cada intento de ingreso (correcto o no).
CREATE TABLE historial_accesos (
  idacceso          BIGINT AUTO_INCREMENT PRIMARY KEY,
  idusuario         INT           NULL,
  usuario_ingresado VARCHAR(40)   NOT NULL,
  resultado         ENUM('exitoso','clave_incorrecta','usuario_inexistente','bloqueado','inactivo') NOT NULL,
  ip                VARCHAR(45)   NULL,
  dispositivo       VARCHAR(255)  NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_accesos_usuario FOREIGN KEY (idusuario) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_accesos_fecha (fecha)
) ENGINE=InnoDB;

-- Solicitudes para restablecer la clave.
CREATE TABLE recuperacion_clave (
  idrecuperacion    INT AUTO_INCREMENT PRIMARY KEY,
  idusuario         INT           NOT NULL,
  token_hash        CHAR(64)      NOT NULL UNIQUE COMMENT 'SHA-256 del código enviado',
  fecha_expira      DATETIME      NOT NULL,
  usado             TINYINT(1)    NOT NULL DEFAULT 0,
  fecha_creacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recup_usuario FOREIGN KEY (idusuario) REFERENCES usuarios(idusuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Auditoría de cambios importantes (quién hizo qué y cuándo).
CREATE TABLE auditoria (
  idauditoria       BIGINT AUTO_INCREMENT PRIMARY KEY,
  idusuario         INT           NULL COMMENT 'Usuario que hizo el cambio (si la app lo informa)',
  tabla             VARCHAR(40)   NOT NULL,
  accion            ENUM('insertar','actualizar','eliminar') NOT NULL,
  idregistro        INT           NOT NULL,
  detalle           VARCHAR(255)  NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_tabla (tabla, idregistro)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. MEMBRESÍAS Y ASISTENCIA DE ALUMNOS
-- =====================================================================
CREATE TABLE matriculas (
  idmatricula       INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idplan            INT           NOT NULL,
  identrenador      INT           NULL,
  fecha_inicio      DATE          NOT NULL,
  fecha_fin         DATE          NULL COMMENT 'Si llega vacía, el trigger la calcula según el plan',
  monto             DECIMAL(10,2) NULL COMMENT 'Si llega vacío, toma el precio del plan',
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NOT NULL DEFAULT 'efectivo',
  estado            ENUM('activa','por_vencer','vencida','congelada','anulada') NOT NULL DEFAULT 'activa',
  idusuario_registro INT          NULL,
  fecha_registro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_matriculas_alumno     FOREIGN KEY (idalumno)     REFERENCES alumnos(idalumno),
  CONSTRAINT fk_matriculas_plan       FOREIGN KEY (idplan)       REFERENCES planes(idplan),
  CONSTRAINT fk_matriculas_entrenador FOREIGN KEY (identrenador) REFERENCES empleados(idempleado),
  CONSTRAINT fk_matriculas_usuario    FOREIGN KEY (idusuario_registro) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_matriculas_estado (estado, fecha_fin)
) ENGINE=InnoDB;

CREATE TABLE asistencias_alumno (
  idasistencia_alumno INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora              TIME          NOT NULL,
  tipo              ENUM('entrada','salida') NOT NULL DEFAULT 'entrada',
  metodo            ENUM('qr_app','dni_manual','codigo_barras','pase_rapido') NOT NULL DEFAULT 'dni_manual',
  resultado         ENUM('autorizado','advertencia','denegado') NOT NULL DEFAULT 'autorizado',
  notas             VARCHAR(200)  NULL,
  CONSTRAINT fk_asis_alumno FOREIGN KEY (idalumno) REFERENCES alumnos(idalumno),
  INDEX idx_asis_alumno_dia (idalumno, fecha)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. PERSONAL: CONTRATOS, HORARIOS, ASISTENCIA, PERMISOS Y PLANILLA
-- =====================================================================
CREATE TABLE contratos (
  idcontrato        INT AUTO_INCREMENT PRIMARY KEY,
  idempleado        INT           NOT NULL,
  tipo              ENUM('3_meses','6_meses','1_anio','indefinido') NOT NULL,
  modalidad         ENUM('tiempo_completo','medio_tiempo','por_horas') NOT NULL,
  fecha_inicio      DATE          NOT NULL,
  fecha_fin         DATE          NULL,
  sueldo_mensual    DECIMAL(10,2) NOT NULL DEFAULT 0,
  tarifa_hora       DECIMAL(10,2) NOT NULL DEFAULT 0,
  horas_semanales   TINYINT       NOT NULL,
  documento         VARCHAR(200)  NULL,
  notas             VARCHAR(300)  NULL,
  estado            ENUM('vigente','por_vencer','vencido','renovado') NOT NULL DEFAULT 'vigente',
  CONSTRAINT fk_contratos_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado)
) ENGINE=InnoDB;

CREATE TABLE horarios_empleado (
  idhorario         INT AUTO_INCREMENT PRIMARY KEY,
  idempleado        INT           NOT NULL,
  dia_semana        TINYINT       NOT NULL COMMENT '1=lunes ... 7=domingo',
  hora_inicio       TIME          NOT NULL,
  hora_fin          TIME          NOT NULL,
  CONSTRAINT fk_horarios_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  CONSTRAINT chk_horario_dia  CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT chk_horario_hora CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

CREATE TABLE asistencias_empleado (
  idasistencia_empleado INT AUTO_INCREMENT PRIMARY KEY,
  idempleado        INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora_entrada      TIME          NULL,
  hora_salida       TIME          NULL,
  estado            ENUM('puntual','tarde','falta','permiso') NOT NULL DEFAULT 'puntual',
  horas_trabajadas  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  observacion       VARCHAR(200)  NULL,
  metodo            ENUM('qr_app','dni_manual','codigo_barras','pase_rapido') NOT NULL DEFAULT 'dni_manual',
  CONSTRAINT fk_asis_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  UNIQUE KEY uq_asis_empleado_dia (idempleado, fecha)
) ENGINE=InnoDB;

-- Permisos laborales (vacaciones, salud...). No confundir con permisos de acceso.
CREATE TABLE permisos_laborales (
  idpermiso_laboral INT AUTO_INCREMENT PRIMARY KEY,
  idempleado        INT           NOT NULL,
  tipo              ENUM('personal','salud','vacaciones','capacitacion') NOT NULL,
  fecha_inicio      DATE          NOT NULL,
  fecha_fin         DATE          NOT NULL,
  motivo            VARCHAR(255)  NOT NULL,
  sustento          VARCHAR(200)  NULL,
  estado            ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  aprobado_por      INT           NULL,
  fecha_solicitud   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_permlab_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  CONSTRAINT fk_permlab_aprobador FOREIGN KEY (aprobado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT chk_permlab_fechas CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB;

CREATE TABLE planilla (
  idplanilla        INT AUTO_INCREMENT PRIMARY KEY,
  idcontrato        INT           NOT NULL,
  periodo           CHAR(7)       NOT NULL COMMENT 'AAAA-MM',
  sueldo_base       DECIMAL(10,2) NOT NULL DEFAULT 0,
  horas_trabajadas  DECIMAL(6,2)  NOT NULL DEFAULT 0,
  tarifa_hora       DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonificacion      DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuentos        DECIMAL(10,2) NOT NULL DEFAULT 0,
  neto              DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Calculado por trigger',
  estado            ENUM('pendiente','pagado') NOT NULL DEFAULT 'pendiente',
  fecha_pago        DATE          NULL,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NULL,
  comprobante       VARCHAR(30)   NULL,
  CONSTRAINT fk_planilla_contrato FOREIGN KEY (idcontrato) REFERENCES contratos(idcontrato) ON DELETE CASCADE,
  UNIQUE KEY uq_planilla_periodo (idcontrato, periodo)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. CITAS (NUTRICIÓN Y FISIOTERAPIA)
-- =====================================================================
CREATE TABLE citas (
  idcita            INT AUTO_INCREMENT PRIMARY KEY,
  servicio          ENUM('nutricion','fisioterapia','entrenamiento') NOT NULL,
  idalumno          INT           NOT NULL,
  idempleado        INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora_inicio       TIME          NOT NULL,
  hora_fin          TIME          NOT NULL,
  motivo            VARCHAR(200)  NULL,
  consultorio       VARCHAR(60)   NULL,
  notas             VARCHAR(255)  NULL,
  recordatorio_enviado TINYINT(1) NOT NULL DEFAULT 0,
  estado            ENUM('programada','confirmada','atendiendo','atendida','pospuesta','falta','cancelada') NOT NULL DEFAULT 'programada',
  CONSTRAINT fk_citas_alumno   FOREIGN KEY (idalumno)   REFERENCES alumnos(idalumno),
  CONSTRAINT fk_citas_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado),
  CONSTRAINT chk_citas_horas CHECK (hora_fin > hora_inicio),
  INDEX idx_citas_agenda (idempleado, fecha, hora_inicio)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. NUTRICIÓN: DIETAS Y MEDIDAS CORPORALES
-- =====================================================================
CREATE TABLE alimentos (
  idalimento        INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(80)   NOT NULL UNIQUE,
  kcal_100g         DECIMAL(6,1)  NOT NULL,
  proteinas_100g    DECIMAL(5,1)  NOT NULL DEFAULT 0,
  carbohidratos_100g DECIMAL(5,1) NOT NULL DEFAULT 0,
  grasas_100g       DECIMAL(5,1)  NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE dietas (
  iddieta           INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idnutricionista   INT           NOT NULL,
  titulo            VARCHAR(120)  NOT NULL,
  objetivo          ENUM('hipertrofia','perdida_peso','fuerza','resistencia','tonificacion','rehabilitacion') NOT NULL,
  calorias_meta     INT           NOT NULL,
  proteinas_g       INT           NOT NULL DEFAULT 0,
  carbohidratos_g   INT           NOT NULL DEFAULT 0,
  grasas_g          INT           NOT NULL DEFAULT 0,
  agua_litros       DECIMAL(3,1)  NOT NULL DEFAULT 2.0,
  comidas_por_dia   TINYINT       NOT NULL DEFAULT 3,
  calorias_totales  INT           NOT NULL DEFAULT 0 COMMENT 'Calculado por trigger',
  recomendaciones   VARCHAR(500)  NULL,
  suplementos       VARCHAR(300)  NULL COMMENT 'Lista separada por |',
  pautas_hidratacion VARCHAR(300) NULL,
  fecha             DATE          NOT NULL,
  activa            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT fk_dietas_alumno        FOREIGN KEY (idalumno)        REFERENCES alumnos(idalumno),
  CONSTRAINT fk_dietas_nutricionista FOREIGN KEY (idnutricionista) REFERENCES empleados(idempleado),
  CONSTRAINT chk_dietas_comidas CHECK (comidas_por_dia BETWEEN 1 AND 8)
) ENGINE=InnoDB;

CREATE TABLE dieta_comidas (
  iddieta_comida    INT AUTO_INCREMENT PRIMARY KEY,
  iddieta           INT           NOT NULL,
  orden             TINYINT       NOT NULL,
  nombre            VARCHAR(60)   NOT NULL,
  hora              TIME          NULL,
  CONSTRAINT fk_comidas_dieta FOREIGN KEY (iddieta) REFERENCES dietas(iddieta) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dieta_alimentos (
  iddieta_alimento  INT AUTO_INCREMENT PRIMARY KEY,
  iddieta_comida    INT           NOT NULL,
  alimento          VARCHAR(80)   NOT NULL,
  porcion           VARCHAR(40)   NULL COMMENT 'Texto libre: 1 taza, 3 unidades...',
  gramos            DECIMAL(6,1)  NOT NULL,
  kilocalorias      DECIMAL(7,1)  NULL COMMENT 'Si llega vacío, el trigger lo calcula con el catálogo',
  proteinas_g       DECIMAL(6,1)  NOT NULL DEFAULT 0,
  carbohidratos_g   DECIMAL(6,1)  NOT NULL DEFAULT 0,
  grasas_g          DECIMAL(6,1)  NOT NULL DEFAULT 0,
  notas             VARCHAR(150)  NULL,
  CONSTRAINT fk_alimentos_comida FOREIGN KEY (iddieta_comida) REFERENCES dieta_comidas(iddieta_comida) ON DELETE CASCADE,
  CONSTRAINT chk_alimentos_gramos CHECK (gramos > 0)
) ENGINE=InnoDB;

CREATE TABLE medidas (
  idmedida          INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idevaluador       INT           NOT NULL,
  fecha             DATE          NOT NULL,
  hora              TIME          NULL,
  peso_kg           DECIMAL(5,2)  NOT NULL,
  talla_cm          DECIMAL(5,1)  NOT NULL,
  imc               DECIMAL(5,2)  NULL COMMENT 'Calculado por trigger',
  clasificacion_imc VARCHAR(20)   NULL COMMENT 'Calculado por trigger',
  -- Perímetros (cm)
  cuello            DECIMAL(5,1)  NULL,
  hombros           DECIMAL(5,1)  NULL,
  pecho             DECIMAL(5,1)  NULL,
  cintura           DECIMAL(5,1)  NOT NULL,
  abdomen           DECIMAL(5,1)  NULL,
  cadera            DECIMAL(5,1)  NOT NULL,
  indice_cintura_cadera DECIMAL(4,2) NULL COMMENT 'Calculado por trigger',
  indice_cintura_talla  DECIMAL(4,2) NULL COMMENT 'Calculado por trigger',
  biceps_relajado_der   DECIMAL(5,1) NULL,
  biceps_relajado_izq   DECIMAL(5,1) NULL,
  biceps_contraido_der  DECIMAL(5,1) NULL,
  biceps_contraido_izq  DECIMAL(5,1) NULL,
  antebrazo         DECIMAL(5,1)  NULL,
  muslo_superior    DECIMAL(5,1)  NULL,
  muslo_medio       DECIMAL(5,1)  NULL,
  pantorrilla       DECIMAL(5,1)  NULL,
  -- Pliegues cutáneos (mm)
  pliegue_triceps      DECIMAL(4,1) NULL,
  pliegue_subescapular DECIMAL(4,1) NULL,
  pliegue_suprailiaco  DECIMAL(4,1) NULL,
  pliegue_abdominal    DECIMAL(4,1) NULL,
  pliegue_muslo        DECIMAL(4,1) NULL,
  pliegue_pantorrilla  DECIMAL(4,1) NULL,
  -- Bioimpedancia
  grasa_porcentaje  DECIMAL(4,1)  NULL,
  grasa_kg          DECIMAL(5,2)  NULL,
  masa_muscular_porcentaje DECIMAL(4,1) NULL,
  masa_muscular_kg  DECIMAL(5,2)  NULL,
  masa_magra_kg     DECIMAL(5,2)  NULL,
  grasa_visceral    TINYINT       NULL,
  agua_porcentaje   DECIMAL(4,1)  NULL,
  agua_litros       DECIMAL(4,1)  NULL,
  masa_osea_kg      DECIMAL(4,2)  NULL,
  metabolismo_basal INT           NULL,
  edad_metabolica   TINYINT       NULL,
  puntuacion_fisica TINYINT       NULL,
  observaciones     VARCHAR(300)  NULL,
  notas_objetivo    VARCHAR(300)  NULL,
  CONSTRAINT fk_medidas_alumno    FOREIGN KEY (idalumno)    REFERENCES alumnos(idalumno),
  CONSTRAINT fk_medidas_evaluador FOREIGN KEY (idevaluador) REFERENCES empleados(idempleado),
  INDEX idx_medidas_alumno (idalumno, fecha)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. FISIOTERAPIA
-- =====================================================================
CREATE TABLE tecnicas_fisioterapia (
  idtecnica         INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100)  NOT NULL UNIQUE,
  descripcion       VARCHAR(255)  NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Plantillas clínicas reutilizables (protocolos por diagnóstico).
CREATE TABLE plantillas_fisioterapia (
  idplantilla       INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)  NOT NULL UNIQUE,
  zona              VARCHAR(40)   NULL,
  contenido         JSON          NOT NULL COMMENT 'Diagnóstico, tratamientos, ejercicios y restricciones',
  creado_por        INT           NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT fk_plantillas_creador FOREIGN KEY (creado_por) REFERENCES empleados(idempleado) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE sesiones_fisioterapia (
  idsesion_fisioterapia INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NOT NULL,
  idfisioterapeuta  INT           NOT NULL,
  idcita            INT           NULL,
  fecha             DATE          NOT NULL,
  hora              TIME          NULL,
  numero_sesion     SMALLINT      NOT NULL DEFAULT 1 COMMENT 'Calculado por trigger',
  motivo_consulta   VARCHAR(255)  NOT NULL,
  restricciones_iniciales VARCHAR(300) NULL,
  evaluacion_postural   VARCHAR(500) NULL COMMENT 'Resumen en texto',
  rango_movimiento  VARCHAR(300)  NULL,
  pruebas_funcionales VARCHAR(300) NULL,
  -- Datos detallados que usa la pantalla de fisioterapia
  evaluacion_fisica     JSON      NULL COMMENT 'Evaluación postural anterior/lateral/posterior',
  evaluacion_funcional  JSON      NULL COMMENT 'Pruebas funcionales y puntuaciones',
  dosificacion_ejercicios JSON    NULL COMMENT 'Ejercicios prescritos: series, repeticiones, frecuencia',
  restricciones_gym VARCHAR(300)  NULL,
  indicaciones_casa VARCHAR(300)  NULL,
  evolucion         VARCHAR(300)  NULL,
  proxima_cita      DATE          NULL,
  reporte_enviado_en DATETIME     NULL,
  reporte_medio     ENUM('whatsapp','correo','impreso') NULL,
  CONSTRAINT fk_fisio_alumno         FOREIGN KEY (idalumno)         REFERENCES alumnos(idalumno),
  CONSTRAINT fk_fisio_fisioterapeuta FOREIGN KEY (idfisioterapeuta) REFERENCES empleados(idempleado),
  CONSTRAINT fk_fisio_cita           FOREIGN KEY (idcita)           REFERENCES citas(idcita) ON DELETE SET NULL,
  INDEX idx_fisio_alumno (idalumno, fecha)
) ENGINE=InnoDB;

CREATE TABLE sesion_zonas (
  idsesion_zona     INT AUTO_INCREMENT PRIMARY KEY,
  idsesion_fisioterapia INT       NOT NULL,
  zona              ENUM('cervical','hombro','columna_dorsal','lumbar','cadera','rodilla','tobillo_pie','codo_muneca','muscular_general') NOT NULL,
  nivel_dolor       TINYINT       NOT NULL COMMENT 'Escala EVA 0-10',
  CONSTRAINT fk_zonas_sesion FOREIGN KEY (idsesion_fisioterapia) REFERENCES sesiones_fisioterapia(idsesion_fisioterapia) ON DELETE CASCADE,
  CONSTRAINT chk_zonas_dolor CHECK (nivel_dolor BETWEEN 0 AND 10),
  UNIQUE KEY uq_sesion_zona (idsesion_fisioterapia, zona)
) ENGINE=InnoDB;

CREATE TABLE sesion_tecnicas (
  idsesion_fisioterapia INT       NOT NULL,
  idtecnica         INT           NOT NULL,
  PRIMARY KEY (idsesion_fisioterapia, idtecnica),
  CONSTRAINT fk_st_sesion  FOREIGN KEY (idsesion_fisioterapia) REFERENCES sesiones_fisioterapia(idsesion_fisioterapia) ON DELETE CASCADE,
  CONSTRAINT fk_st_tecnica FOREIGN KEY (idtecnica) REFERENCES tecnicas_fisioterapia(idtecnica)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. ENTRENAMIENTO: EJERCICIOS Y RUTINAS
-- =====================================================================
CREATE TABLE ejercicios (
  idejercicio       INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)  NOT NULL UNIQUE,
  grupo_muscular    ENUM('pecho','espalda','cuadriceps','isquiotibiales_gluteos','hombros','biceps','triceps','core_abdomen','cardio_funcional') NOT NULL,
  musculos_secundarios VARCHAR(200) NULL COMMENT 'Lista separada por |',
  equipo            ENUM('mancuernas','barra','maquina','polea','peso_corporal','kettlebell','otro') NOT NULL,
  dificultad        ENUM('principiante','intermedio','avanzado') NOT NULL,
  instrucciones     VARCHAR(1000) NULL,
  consejos          VARCHAR(500)  NULL,
  series_repeticiones VARCHAR(40) NULL,
  video_url         VARCHAR(300)  NULL,
  miniatura_url     VARCHAR(300)  NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE rutinas (
  idrutina          INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(150)  NOT NULL,
  descripcion       VARCHAR(500)  NULL,
  nivel             ENUM('principiante','intermedio','avanzado') NOT NULL,
  objetivo          ENUM('hipertrofia','perdida_peso','fuerza','resistencia','tonificacion','rehabilitacion') NOT NULL,
  dias_por_semana   TINYINT       NULL,
  identrenador      INT           NULL,
  idalumno          INT           NULL COMMENT 'Alumno para quien se diseñó (opcional)',
  fecha             DATE          NOT NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT fk_rutinas_entrenador FOREIGN KEY (identrenador) REFERENCES empleados(idempleado),
  CONSTRAINT fk_rutinas_alumno     FOREIGN KEY (idalumno)     REFERENCES alumnos(idalumno)
) ENGINE=InnoDB;

CREATE TABLE rutina_dias (
  idrutina_dia      INT AUTO_INCREMENT PRIMARY KEY,
  idrutina          INT           NOT NULL,
  orden             TINYINT       NOT NULL,
  nombre            VARCHAR(120)  NOT NULL,
  enfoque           VARCHAR(120)  NULL,
  notas             VARCHAR(300)  NULL,
  CONSTRAINT fk_dias_rutina FOREIGN KEY (idrutina) REFERENCES rutinas(idrutina) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rutina_ejercicios (
  idrutina_ejercicio INT AUTO_INCREMENT PRIMARY KEY,
  idrutina_dia      INT           NOT NULL,
  idejercicio       INT           NOT NULL,
  orden             TINYINT       NOT NULL DEFAULT 1,
  series            TINYINT       NOT NULL,
  repeticiones      VARCHAR(20)   NOT NULL,
  rir               VARCHAR(10)   NULL,
  descanso_seg      SMALLINT      NOT NULL DEFAULT 60,
  notas             VARCHAR(200)  NULL,
  CONSTRAINT fk_re_dia       FOREIGN KEY (idrutina_dia) REFERENCES rutina_dias(idrutina_dia) ON DELETE CASCADE,
  CONSTRAINT fk_re_ejercicio FOREIGN KEY (idejercicio)  REFERENCES ejercicios(idejercicio)
) ENGINE=InnoDB;

ALTER TABLE alumnos ADD CONSTRAINT fk_alumnos_rutina
  FOREIGN KEY (idrutina) REFERENCES rutinas(idrutina) ON DELETE SET NULL;

-- =====================================================================
-- 9. TIENDA (POS) Y CAJA
-- =====================================================================
CREATE TABLE productos (
  idproducto        INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(100)  NOT NULL UNIQUE,
  categoria         ENUM('bebidas','suplementos','snacks','accesorios','ropa') NOT NULL,
  precio_compra     DECIMAL(10,2) NOT NULL,
  precio_venta      DECIMAL(10,2) NOT NULL,
  stock             INT           NOT NULL DEFAULT 0,
  stock_minimo      INT           NOT NULL DEFAULT 5,
  marca             VARCHAR(60)   NULL,
  codigo_barras     VARCHAR(40)   NULL UNIQUE,
  descripcion       VARCHAR(300)  NULL,
  imagen            VARCHAR(300)  NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT chk_productos_stock  CHECK (stock >= 0),
  CONSTRAINT chk_productos_precio CHECK (precio_venta >= 0 AND precio_compra >= 0)
) ENGINE=InnoDB;

CREATE TABLE ventas (
  idventa           INT AUTO_INCREMENT PRIMARY KEY,
  idalumno          INT           NULL COMMENT 'NULL = cliente general',
  idempleado        INT           NOT NULL COMMENT 'Quien registró la venta',
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NOT NULL,
  total             DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Acumulado por trigger',
  comprobante       VARCHAR(20)   NULL,
  anulada           TINYINT(1)    NOT NULL DEFAULT 0,
  CONSTRAINT fk_ventas_alumno   FOREIGN KEY (idalumno)   REFERENCES alumnos(idalumno),
  CONSTRAINT fk_ventas_empleado FOREIGN KEY (idempleado) REFERENCES empleados(idempleado)
) ENGINE=InnoDB;

CREATE TABLE venta_detalle (
  idventa_detalle   INT AUTO_INCREMENT PRIMARY KEY,
  idventa           INT           NOT NULL,
  idproducto        INT           NOT NULL,
  cantidad          INT           NOT NULL,
  precio_unitario   DECIMAL(10,2) NULL COMMENT 'Si llega vacío, toma el precio del producto',
  subtotal          DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Calculado por trigger',
  CONSTRAINT fk_detalle_venta    FOREIGN KEY (idventa)    REFERENCES ventas(idventa) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (idproducto) REFERENCES productos(idproducto),
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- Turnos de caja (apertura, arqueo y cierre por recepcionista).
-- Solo puede haber UN turno abierto a la vez (columna abierto_unico).
-- Cada ingreso o egreso que se registre mientras el turno está abierto
-- queda asociado a él (trigger trg_movimientos_caja_turno).
CREATE TABLE turnos_caja (
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

CREATE TABLE movimientos_caja (
  idmovimiento      INT AUTO_INCREMENT PRIMARY KEY,
  tipo              ENUM('ingreso','egreso') NOT NULL,
  categoria         ENUM('matricula','venta','entrenamiento_personal','fisioterapia','nutricion',
                         'insumos','sueldo','mantenimiento','servicios','alquiler','marketing',
                         'averia_equipo','otros') NOT NULL,
  monto             DECIMAL(10,2) NOT NULL,
  descripcion       VARCHAR(255)  NOT NULL,
  metodo_pago       ENUM('efectivo','tarjeta','transferencia','yape_plin') NOT NULL DEFAULT 'efectivo',
  comprobante       VARCHAR(30)   NULL,
  idreferencia      INT           NULL COMMENT 'idmatricula, idventa, idplanilla... según categoría',
  idalumno          INT           NULL,
  idempleado        INT           NULL,
  nombre_relacionado VARCHAR(120) NULL,
  equipo            VARCHAR(100)  NULL COMMENT 'Para averías de equipo',
  adjunto           VARCHAR(200)  NULL,
  idusuario_registro INT          NULL,
  idturno           INT           NULL COMMENT 'Turno de caja en que se registró',
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_mov_monto CHECK (monto >= 0),
  CONSTRAINT fk_mov_turno FOREIGN KEY (idturno) REFERENCES turnos_caja(idturno) ON DELETE SET NULL,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (idusuario_registro) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_mov_fecha (fecha),
  INDEX idx_mov_referencia (categoria, idreferencia),
  INDEX idx_mov_turno (idturno)
) ENGINE=InnoDB;

-- =====================================================================
-- 10. NOTIFICACIONES Y CLASES GRUPALES
-- =====================================================================
CREATE TABLE reglas_notificacion (
  idregla           INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)  NOT NULL,
  categoria         ENUM('vencimiento','clase','promocion','aviso','cumpleanos') NOT NULL,
  activa            TINYINT(1)    NOT NULL DEFAULT 1,
  canales           VARCHAR(60)   NOT NULL COMMENT 'Lista separada por | (push, correo, whatsapp, sms)',
  momento           VARCHAR(80)   NOT NULL,
  dias              SMALLINT      NOT NULL DEFAULT 0,
  titulo_plantilla  VARCHAR(150)  NOT NULL,
  cuerpo_plantilla  VARCHAR(600)  NOT NULL
) ENGINE=InnoDB;

CREATE TABLE notificaciones (
  idnotificacion    INT AUTO_INCREMENT PRIMARY KEY,
  titulo            VARCHAR(120)  NOT NULL,
  mensaje           VARCHAR(500)  NOT NULL,
  destino           ENUM('todos','alumnos','personal','alumno','usuario') NOT NULL DEFAULT 'todos',
  idalumno          INT           NULL,
  idusuario         INT           NULL COMMENT 'Destinatario cuando destino = usuario',
  idregla           INT           NULL,
  tipo              ENUM('vencimiento','aviso','promocion','cumpleanos','clase','stock') NOT NULL DEFAULT 'aviso',
  canal             ENUM('push','correo','whatsapp','sms','sistema') NOT NULL DEFAULT 'sistema',
  estado_envio      ENUM('programado','enviado','entregado','leido','fallido') NOT NULL DEFAULT 'entregado',
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leida             TINYINT(1)    NOT NULL DEFAULT 0,
  CONSTRAINT fk_notif_alumno  FOREIGN KEY (idalumno)  REFERENCES alumnos(idalumno) ON DELETE CASCADE,
  CONSTRAINT fk_notif_usuario FOREIGN KEY (idusuario) REFERENCES usuarios(idusuario) ON DELETE CASCADE,
  CONSTRAINT fk_notif_regla   FOREIGN KEY (idregla)   REFERENCES reglas_notificacion(idregla) ON DELETE SET NULL,
  INDEX idx_notif_fecha (fecha)
) ENGINE=InnoDB;

-- Alertas para el administrador (p. ej. recepción cambió la fecha límite de pago de una deuda)
CREATE TABLE alertas_administracion (
  idalerta          INT AUTO_INCREMENT PRIMARY KEY,
  tipo              VARCHAR(40)   NOT NULL DEFAULT 'cambio_fecha_pago' COMMENT 'cambio_fecha_pago (se pueden agregar otros tipos)',
  titulo            VARCHAR(150)  NOT NULL,
  mensaje           VARCHAR(500)  NOT NULL,
  idalumno          INT           NULL,
  idusuario_origen  INT           NULL COMMENT 'Quién hizo el cambio',
  fecha_anterior    DATE          NULL,
  fecha_nueva       DATE          NULL,
  monto_deuda       DECIMAL(10,2) NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vista             TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1 = el administrador ya la vio',
  fecha_vista       DATETIME      NULL,
  idusuario_vista   INT           NULL,
  CONSTRAINT fk_alerta_alumno  FOREIGN KEY (idalumno)         REFERENCES alumnos(idalumno)   ON DELETE CASCADE,
  CONSTRAINT fk_alerta_origen  FOREIGN KEY (idusuario_origen) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT fk_alerta_vista   FOREIGN KEY (idusuario_vista)  REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_alerta_pendiente (vista, fecha)
) ENGINE=InnoDB;

-- Catálogo de indicaciones (orden = de la cabeza a los pies)
CREATE TABLE indicaciones (
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
CREATE TABLE indicaciones_plantillas (
  idplantilla       INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(80)   NOT NULL UNIQUE,
  descripcion       VARCHAR(200)  NULL,
  es_propia         TINYINT(1)    NOT NULL DEFAULT 0,
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  creado_por        INT           NULL,
  fecha_registro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_indp_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE indicaciones_plantilla_items (
  idplantilla       INT           NOT NULL,
  idindicacion      INT           NOT NULL,
  lugar             ENUM('antes','despues','casa') NOT NULL,
  orden             SMALLINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (idplantilla, idindicacion),
  CONSTRAINT fk_indpi_plantilla FOREIGN KEY (idplantilla)  REFERENCES indicaciones_plantillas(idplantilla) ON DELETE CASCADE,
  CONSTRAINT fk_indpi_ind       FOREIGN KEY (idindicacion) REFERENCES indicaciones(idindicacion) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indicaciones asignadas a cada alumno (la última vigente; las anteriores quedan de historial)
CREATE TABLE alumno_indicaciones (
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

CREATE TABLE alumno_indicacion_items (
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

CREATE TABLE clases (
  idclase           INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120)  NOT NULL,
  idinstructor      INT           NULL,
  dia_semana        TINYINT       NULL COMMENT '1=lunes ... 7=domingo (clase recurrente)',
  fecha             DATE          NULL COMMENT 'Fecha puntual (clase única)',
  hora_inicio       TIME          NOT NULL,
  hora_fin          TIME          NOT NULL,
  sala              VARCHAR(60)   NOT NULL,
  capacidad         SMALLINT      NOT NULL DEFAULT 20,
  activa            TINYINT(1)    NOT NULL DEFAULT 1,
  CONSTRAINT fk_clases_instructor FOREIGN KEY (idinstructor) REFERENCES empleados(idempleado) ON DELETE SET NULL,
  CONSTRAINT chk_clases_horas CHECK (hora_fin > hora_inicio),
  CONSTRAINT chk_clases_cuando CHECK (dia_semana IS NOT NULL OR fecha IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE clase_inscripciones (
  idclase           INT           NOT NULL,
  idalumno          INT           NOT NULL,
  fecha_clase       DATE          NOT NULL,
  asistio           TINYINT(1)    NOT NULL DEFAULT 0,
  fecha_inscripcion DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idclase, idalumno, fecha_clase),
  CONSTRAINT fk_insc_clase  FOREIGN KEY (idclase)  REFERENCES clases(idclase)   ON DELETE CASCADE,
  CONSTRAINT fk_insc_alumno FOREIGN KEY (idalumno) REFERENCES alumnos(idalumno) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 11. REGISTROS DE LOS MÓDULOS DEL SISTEMA
-- Aquí se guarda todo lo que el sistema registra en sus pantallas
-- (rutinas, asignaciones, dietas, evaluaciones corporales, fisioterapia,
-- citas, asistencias, productos, avisos, contratos y planilla) para que
-- nada se pierda al cerrar el navegador y se vea desde cualquier equipo.
-- `idalumno` indica a qué alumno pertenece el registro: el portal del
-- alumno solo muestra los registros con su idalumno.
-- =====================================================================
CREATE TABLE IF NOT EXISTS registros_app (
  modulo            VARCHAR(40)   NOT NULL COMMENT 'rutinas, citas, fisioterapia, planes_nutricion, ...',
  idregistro        VARCHAR(64)   NOT NULL COMMENT 'Id del registro en el sistema',
  idalumno          INT           NULL COMMENT 'Alumno dueño del registro (si aplica)',
  datos             JSON          NOT NULL,
  creado_por        INT           NULL,
  actualizado_por   INT           NULL,
  fecha_creacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (modulo, idregistro),
  INDEX idx_registros_alumno (idalumno, modulo),
  CONSTRAINT fk_registros_alumno  FOREIGN KEY (idalumno)        REFERENCES alumnos(idalumno)   ON DELETE SET NULL,
  CONSTRAINT fk_registros_creador FOREIGN KEY (creado_por)      REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  CONSTRAINT fk_registros_editor  FOREIGN KEY (actualizado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 12. SINCRONIZACIÓN CON LAS TABLAS
-- Cada registro que el sistema guarda en registros_app se copia también a
-- su tabla real (citas, rutinas, dietas, medidas, fisioterapia,
-- asistencias, productos, contratos, planilla, clases, avisos).
-- `idregistro_app` une cada fila con el registro del sistema.
-- =====================================================================
ALTER TABLE citas ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_citas_origen (idregistro_app);
ALTER TABLE rutinas ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_rutinas_origen (idregistro_app);
ALTER TABLE dietas ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_dietas_origen (idregistro_app);
ALTER TABLE medidas ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_medidas_origen (idregistro_app);
ALTER TABLE sesiones_fisioterapia ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_sesiones_fisioterapia_origen (idregistro_app);
ALTER TABLE asistencias_alumno ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_asistencias_alumno_origen (idregistro_app);
ALTER TABLE asistencias_empleado ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD INDEX idx_asistencias_empleado_origen (idregistro_app);
ALTER TABLE productos ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_productos_origen (idregistro_app);
ALTER TABLE contratos ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_contratos_origen (idregistro_app);
ALTER TABLE planilla ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_planilla_origen (idregistro_app);
ALTER TABLE clases ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_clases_origen (idregistro_app);
ALTER TABLE reglas_notificacion ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_reglas_notificacion_origen (idregistro_app);
ALTER TABLE notificaciones ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_notificaciones_origen (idregistro_app);
ALTER TABLE plantillas_fisioterapia ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_plantillas_fisioterapia_origen (idregistro_app);
ALTER TABLE ejercicios ADD COLUMN idregistro_app VARCHAR(64) NULL COMMENT 'Id del registro en el sistema (registros_app)', ADD UNIQUE INDEX idx_ejercicios_origen (idregistro_app);
ALTER TABLE registros_app ADD COLUMN sync_estado ENUM('pendiente','ok','error') NOT NULL DEFAULT 'pendiente' COMMENT 'Copia en su tabla', ADD INDEX idx_registros_sync (sync_estado);
ALTER TABLE registros_app ADD COLUMN sync_detalle VARCHAR(300) NULL COMMENT 'Motivo si no se pudo copiar';
ALTER TABLE registros_app ADD COLUMN sync_fecha DATETIME NULL;
ALTER TABLE rutina_ejercicios ADD COLUMN codigo_ejercicio VARCHAR(64) NULL COMMENT 'Código del ejercicio en el banco de GIFs';
ALTER TABLE rutina_ejercicios ADD COLUMN nombre_ejercicio VARCHAR(150) NULL;
ALTER TABLE rutina_ejercicios ADD COLUMN grupo_muscular VARCHAR(40) NULL;
ALTER TABLE rutina_ejercicios ADD COLUMN gif_url VARCHAR(300) NULL;

ALTER TABLE citas MODIFY idalumno INT NULL, MODIFY idempleado INT NULL;
ALTER TABLE dietas MODIFY idalumno INT NULL COMMENT 'NULL = plantilla general',
                   MODIFY idnutricionista INT NULL;
ALTER TABLE medidas MODIFY idevaluador INT NULL, MODIFY peso_kg DECIMAL(5,2) NULL,
                    MODIFY talla_cm DECIMAL(5,1) NULL, MODIFY cintura DECIMAL(5,1) NULL,
                    MODIFY cadera DECIMAL(5,1) NULL;
ALTER TABLE sesiones_fisioterapia MODIFY idfisioterapeuta INT NULL;
ALTER TABLE sesion_zonas MODIFY zona VARCHAR(40) NOT NULL;
ALTER TABLE rutina_ejercicios MODIFY idejercicio INT NULL COMMENT 'Ejercicio propio (NULL = del banco de GIFs)';
ALTER TABLE ejercicios MODIFY grupo_muscular VARCHAR(40) NOT NULL, MODIFY equipo VARCHAR(40) NOT NULL;
ALTER TABLE clases MODIFY hora_inicio TIME NULL, MODIFY hora_fin TIME NULL, MODIFY sala VARCHAR(60) NULL;

-- =====================================================================
-- 13. TIENDA: KÁRDEX Y DATOS DE VENTA
-- =====================================================================
CREATE TABLE movimientos_inventario (
  idmovimiento_inv  INT AUTO_INCREMENT PRIMARY KEY,
  idproducto        INT           NOT NULL,
  tipo              ENUM('inicial','entrada','venta','anulacion','ajuste','merma') NOT NULL,
  cantidad          INT           NOT NULL COMMENT 'Positivo entra, negativo sale',
  stock_resultante  INT           NOT NULL,
  costo_unitario    DECIMAL(10,2) NULL COMMENT 'Costo de compra en las entradas',
  motivo            VARCHAR(200)  NULL,
  idventa           INT           NULL,
  idusuario         INT           NULL,
  fecha             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_producto FOREIGN KEY (idproducto) REFERENCES productos(idproducto),
  CONSTRAINT fk_inv_venta    FOREIGN KEY (idventa)    REFERENCES ventas(idventa) ON DELETE SET NULL,
  CONSTRAINT fk_inv_usuario  FOREIGN KEY (idusuario)  REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  INDEX idx_inv_producto (idproducto, fecha)
) ENGINE=InnoDB;
ALTER TABLE ventas ADD COLUMN cliente VARCHAR(120) NULL COMMENT 'Nombre del cliente si no es alumno';
ALTER TABLE ventas ADD COLUMN idusuario INT NULL COMMENT 'Usuario que cobró';
ALTER TABLE ventas ADD COLUMN motivo_anulacion VARCHAR(200) NULL;
ALTER TABLE ventas ADD COLUMN fecha_anulacion DATETIME NULL;
ALTER TABLE ventas ADD COLUMN anulada_por INT NULL;
ALTER TABLE productos MODIFY imagen MEDIUMTEXT NULL COMMENT 'URL o imagen subida';
ALTER TABLE ventas MODIFY idempleado INT NULL COMMENT 'Trabajador que registró la venta';

-- =====================================================================
-- 14. REPORTES, METAS, LOGROS, DEUDAS Y CONFIGURACIÓN
-- =====================================================================
CREATE TABLE configuracion (
  clave             VARCHAR(60)   PRIMARY KEY,
  valor             VARCHAR(500)  NULL,
  descripcion       VARCHAR(200)  NULL,
  actualizado_por   INT           NULL,
  fecha_actualizacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_usuario FOREIGN KEY (actualizado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Turnos fijos de recepción (Turno 1 mañana, Turno 2 tarde...) para las metas
CREATE TABLE turnos_recepcion (
  idturno_recepcion INT AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(60)   NOT NULL UNIQUE,
  hora_inicio       TIME          NULL,
  hora_fin          TIME          NULL,
  activo            TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Pagos posteriores de una matrícula (saldo / deuda)
CREATE TABLE pagos_matricula (
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
CREATE TABLE metas (
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
CREATE TABLE objetivos_alumno (
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
CREATE TABLE bonos (
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
ALTER TABLE matriculas ADD COLUMN precio_total DECIMAL(10,2) NULL COMMENT 'Precio acordado (plan - descuento). monto = lo pagado al matricular';
ALTER TABLE matriculas ADD COLUMN es_renovacion TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE empleados ADD COLUMN horario VARCHAR(120) NULL COMMENT 'Horario de atención visible para alumnos';
ALTER TABLE usuarios ADD COLUMN idturno_recepcion INT NULL COMMENT 'Turno fijo de recepción (metas)';
ALTER TABLE turnos_caja ADD COLUMN idturno_recepcion INT NULL COMMENT 'Turno de recepción al que suma este turno de caja';
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_turno_recepcion FOREIGN KEY (idturno_recepcion) REFERENCES turnos_recepcion(idturno_recepcion) ON DELETE SET NULL;
ALTER TABLE turnos_caja ADD CONSTRAINT fk_turnos_caja_recepcion FOREIGN KEY (idturno_recepcion) REFERENCES turnos_recepcion(idturno_recepcion) ON DELETE SET NULL;

-- =====================================================================
-- 15. DEUDAS: FECHA LÍMITE PARA CANCELAR EL SALDO
-- =====================================================================
ALTER TABLE matriculas ADD COLUMN fecha_limite_pago DATE NULL COMMENT 'Fecha límite para cancelar el saldo (si no pagó completo)';
ALTER TABLE matriculas ADD INDEX idx_matriculas_limite_pago (fecha_limite_pago);

-- =====================================================================
-- 16. CONGELAMIENTO DE MEMBRESÍAS (reglas por plan + historial)
-- =====================================================================
ALTER TABLE planes
  ADD COLUMN congelamiento_dias SMALLINT NOT NULL DEFAULT 0 COMMENT 'Días de congelamiento permitidos (0 = no permite)',
  ADD COLUMN congelamiento_partes TINYINT NOT NULL DEFAULT 1 COMMENT 'Máximo de congelamientos (1 = todo de una vez)',
  ADD COLUMN congelamiento_min_dias SMALLINT NOT NULL DEFAULT 0 COMMENT 'Mínimo de días por congelamiento',
  ADD CONSTRAINT chk_planes_congelamiento CHECK (congelamiento_dias >= 0 AND congelamiento_partes BETWEEN 1 AND 12
       AND congelamiento_min_dias >= 0 AND congelamiento_min_dias <= congelamiento_dias);

ALTER TABLE matriculas
  ADD COLUMN congelamiento_dias SMALLINT NULL COMMENT 'Días de congelamiento que trae esta matrícula (copia del plan)',
  ADD COLUMN congelamiento_partes TINYINT NULL,
  ADD COLUMN congelamiento_min_dias SMALLINT NULL;

CREATE TABLE congelamientos (
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

-- =====================================================================
-- 17. NUTRICIÓN: PLATOS POR DIETA Y CATÁLOGO DE ALIMENTOS AMPLIADO
-- =====================================================================
CREATE TABLE dieta_platos (
  iddieta_plato     INT AUTO_INCREMENT PRIMARY KEY,
  iddieta           INT           NOT NULL,
  orden             TINYINT       NOT NULL,
  nombre            VARCHAR(60)   NOT NULL COMMENT 'Desayuno, Almuerzo, Plato 1...',
  hora              TIME          NULL,
  modelo            VARCHAR(20)   NOT NULL DEFAULT 'equilibrado' COMMENT 'equilibrado, mediterraneo, perdida_grasa, masa_muscular, deportivo, cetogenico, paleo, personalizado',
  verduras_pct      TINYINT       NOT NULL,
  proteina_pct      TINYINT       NOT NULL,
  carbohidratos_pct TINYINT       NOT NULL,
  grasas_pct        TINYINT       NOT NULL,
  palmas_proteina   DECIMAL(3,1)  NOT NULL DEFAULT 0 COMMENT 'Porciones con la mano',
  punos_verduras    DECIMAL(3,1)  NOT NULL DEFAULT 0,
  manos_carbohidratos DECIMAL(3,1) NOT NULL DEFAULT 0,
  pulgares_grasa    DECIMAL(3,1)  NOT NULL DEFAULT 0,
  indicaciones      VARCHAR(200)  NULL,
  CONSTRAINT fk_platos_dieta FOREIGN KEY (iddieta) REFERENCES dietas(iddieta) ON DELETE CASCADE,
  CONSTRAINT uq_platos_orden UNIQUE (iddieta, orden),
  CONSTRAINT chk_platos_pct CHECK ((verduras_pct + proteina_pct + carbohidratos_pct + grasas_pct) BETWEEN 95 AND 105)
) ENGINE=InnoDB;

ALTER TABLE alimentos
  ADD COLUMN categoria ENUM('proteinas','lacteos','cereales','tuberculos','legumbres','verduras','frutas','grasas','bebidas','suplementos','platos','otros') NOT NULL DEFAULT 'otros' AFTER nombre,
  ADD COLUMN emoji VARCHAR(8) NULL AFTER categoria,
  ADD COLUMN fibra_100g DECIMAL(5,1) NOT NULL DEFAULT 0,
  ADD COLUMN azucares_100g DECIMAL(5,1) NULL COMMENT 'Azúcares por 100 g',
  ADD COLUMN sodio_mg_100g DECIMAL(7,1) NULL COMMENT 'Sodio (mg) por 100 g',
  ADD COLUMN indice_glucemico ENUM('bajo','medio','alto') NULL,
  ADD COLUMN etiquetas VARCHAR(120) NULL COMMENT 'Ej. andino, vegano, sin gluten, omega 3',
  ADD COLUMN notas VARCHAR(200) NULL COMMENT 'Dato útil para el alumno',
  ADD COLUMN porcion_g DECIMAL(6,1) NOT NULL DEFAULT 100 COMMENT 'Porción habitual en gramos',
  ADD COLUMN porcion_texto VARCHAR(60) NULL COMMENT 'Medida casera y de mano: 1 palma, ½ taza...',
  ADD COLUMN es_propio TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = agregado por el nutricionista',
  ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN creado_por INT NULL,
  ADD COLUMN fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD CONSTRAINT fk_alimentos_creador FOREIGN KEY (creado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  ADD CONSTRAINT chk_alimentos_valores CHECK (kcal_100g >= 0 AND proteinas_100g >= 0 AND carbohidratos_100g >= 0 AND grasas_100g >= 0 AND porcion_g > 0),
  ADD INDEX idx_alimentos_categoria (activo, categoria, nombre);

ALTER TABLE dieta_alimentos
  ADD COLUMN idalimento INT NULL AFTER iddieta_comida,
  ADD CONSTRAINT fk_dieta_alimentos_catalogo FOREIGN KEY (idalimento) REFERENCES alimentos(idalimento) ON DELETE SET NULL;

-- Mensajes predeterminados por categoría (Notificaciones), editables
CREATE TABLE plantillas_mensajes (
  idplantilla       INT AUTO_INCREMENT PRIMARY KEY,
  categoria         VARCHAR(30)   NOT NULL COMMENT 'por_vencer, vencidos, no_vienen, renovaron, bienvenida, cumpleanos, deuda, congelamiento, constancia, exalumnos',
  titulo            VARCHAR(80)   NOT NULL,
  mensaje           VARCHAR(1000) NOT NULL COMMENT 'Admite {{nombre}}, {{plan}}, {{fecha_vencimiento}}, {{dias}}, {{deuda}}, {{fecha_limite}}, {{gym}}, {{codigo}}, {{fecha_regreso}}, {{asistencias}}',
  orden             SMALLINT      NOT NULL DEFAULT 0,
  es_propia         TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '1 = la escribió el gimnasio',
  activo            TINYINT(1)    NOT NULL DEFAULT 1,
  creado_por        INT           NULL,
  fecha_registro    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_edicion     DATETIME      NULL,
  CONSTRAINT fk_plmsg_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(idusuario) ON DELETE SET NULL,
  UNIQUE KEY uq_plmsg (categoria, titulo),
  INDEX idx_plmsg_cat (categoria, activo, orden)
) ENGINE=InnoDB;


-- =====================================================================
-- RADICAL GYM - Triggers (reglas automáticas)
-- Adaptados del diseño de Darío, sin spinning, con seguridad añadida.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

DELIMITER $$

-- ---------------------------------------------------------------------
-- SEGURIDAD: auditoría de usuarios y roles
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_usuarios_despues_insertar AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (idusuario, tabla, accion, idregistro, detalle)
  VALUES (NEW.creado_por, 'usuarios', 'insertar', NEW.idusuario, CONCAT('Usuario creado: ', NEW.usuario));
END $$

CREATE TRIGGER trg_usuarios_antes_actualizar BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
  -- Si cambia la clave, se registra la fecha y se reinician los intentos
  IF NEW.clave_hash <> OLD.clave_hash THEN
    SET NEW.fecha_cambio_clave = NOW();
    SET NEW.intentos_fallidos = 0;
    SET NEW.bloqueado_hasta = NULL;
  END IF;
END $$

CREATE TRIGGER trg_usuarios_despues_actualizar AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
  IF NEW.clave_hash <> OLD.clave_hash THEN
    INSERT INTO auditoria (tabla, accion, idregistro, detalle)
    VALUES ('usuarios', 'actualizar', NEW.idusuario, 'Cambio de clave');
  END IF;
  IF NEW.idrol <> OLD.idrol THEN
    INSERT INTO auditoria (tabla, accion, idregistro, detalle)
    VALUES ('usuarios', 'actualizar', NEW.idusuario, CONCAT('Cambio de rol: ', OLD.idrol, ' -> ', NEW.idrol));
  END IF;
  IF NEW.activo <> OLD.activo THEN
    INSERT INTO auditoria (tabla, accion, idregistro, detalle)
    VALUES ('usuarios', 'actualizar', NEW.idusuario, IF(NEW.activo = 1, 'Usuario activado', 'Usuario desactivado'));
    -- Al desactivar un usuario se cierran todas sus sesiones
    IF NEW.activo = 0 THEN
      UPDATE sesiones SET fecha_cierre = NOW() WHERE idusuario = NEW.idusuario AND fecha_cierre IS NULL;
    END IF;
  END IF;
END $$

CREATE TRIGGER trg_roles_antes_eliminar BEFORE DELETE ON roles
FOR EACH ROW
BEGIN
  IF OLD.es_sistema = 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los roles base del sistema no se pueden eliminar';
  END IF;
END $$

-- ---------------------------------------------------------------------
-- ALUMNOS Y PERSONAL: auditoría
-- ---------------------------------------------------------------------
-- Código correlativo para marcar asistencia (1, 2, 3...; el sistema lo muestra con iniciales: DF-1)
CREATE TRIGGER trg_alumnos_codigo BEFORE INSERT ON alumnos
FOR EACH ROW
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = 0 THEN
    SET NEW.codigo = (SELECT IFNULL(MAX(a.codigo), 0) + 1 FROM alumnos a);
  END IF;
END $$

CREATE TRIGGER trg_alumnos_despues_insertar AFTER INSERT ON alumnos
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (tabla, accion, idregistro, detalle)
  VALUES ('alumnos', 'insertar', NEW.idalumno, CONCAT(NEW.nombres, ' ', NEW.apellidos));
END $$

CREATE TRIGGER trg_alumnos_despues_actualizar AFTER UPDATE ON alumnos
FOR EACH ROW
BEGIN
  IF NEW.activo <> OLD.activo THEN
    INSERT INTO auditoria (tabla, accion, idregistro, detalle)
    VALUES ('alumnos', 'actualizar', NEW.idalumno, CONCAT('activo: ', OLD.activo, ' -> ', NEW.activo));
    -- Si el alumno se da de baja, también se desactiva su cuenta
    IF NEW.activo = 0 THEN
      UPDATE usuarios SET activo = 0 WHERE idalumno = NEW.idalumno;
    END IF;
  END IF;
END $$

CREATE TRIGGER trg_empleados_despues_insertar AFTER INSERT ON empleados
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (tabla, accion, idregistro, detalle)
  VALUES ('empleados', 'insertar', NEW.idempleado, CONCAT(NEW.cargo, ': ', NEW.nombres, ' ', NEW.apellidos));
END $$

CREATE TRIGGER trg_empleados_despues_actualizar AFTER UPDATE ON empleados
FOR EACH ROW
BEGIN
  -- Si el trabajador deja el gimnasio, su cuenta se desactiva
  IF NEW.activo = 0 AND OLD.activo = 1 THEN
    UPDATE usuarios SET activo = 0 WHERE idempleado = NEW.idempleado;
    INSERT INTO auditoria (tabla, accion, idregistro, detalle)
    VALUES ('empleados', 'actualizar', NEW.idempleado, 'Empleado dado de baja');
  END IF;
END $$

-- ---------------------------------------------------------------------
-- MATRÍCULAS: fecha fin, monto, estado e ingreso a caja
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_matriculas_antes_insertar BEFORE INSERT ON matriculas
FOR EACH ROW
BEGIN
  DECLARE v_meses TINYINT;
  DECLARE v_dias SMALLINT;
  DECLARE v_precio DECIMAL(10,2);
  SELECT duracion_meses, duracion_dias, precio INTO v_meses, v_dias, v_precio
    FROM planes WHERE idplan = NEW.idplan;
  IF v_meses IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El plan indicado no existe';
  END IF;
  IF NEW.fecha_fin IS NULL OR NEW.fecha_fin < NEW.fecha_inicio THEN
    SET NEW.fecha_fin = IF(v_meses > 0,
        DATE_SUB(DATE_ADD(NEW.fecha_inicio, INTERVAL v_meses MONTH), INTERVAL 1 DAY),
        DATE_ADD(NEW.fecha_inicio, INTERVAL GREATEST(v_dias, 1) - 1 DAY));
  END IF;
  IF NEW.monto IS NULL OR NEW.monto = 0 THEN
    SET NEW.monto = v_precio;
  END IF;
  SET NEW.estado = CASE
    WHEN NEW.estado IN ('congelada','anulada') THEN NEW.estado
    WHEN NEW.fecha_fin < CURDATE() THEN 'vencida'
    WHEN NEW.fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'por_vencer'
    ELSE 'activa' END;
END $$

CREATE TRIGGER trg_matriculas_despues_insertar AFTER INSERT ON matriculas
FOR EACH ROW
BEGIN
  INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, idreferencia, fecha, metodo_pago,
                                comprobante, idalumno, nombre_relacionado, idusuario_registro)
  SELECT 'ingreso', 'matricula', NEW.monto,
         CONCAT('Membresía ', p.nombre, ' - ', a.nombres, ' ', a.apellidos), NEW.idmatricula, NEW.fecha_registro,
         NEW.metodo_pago, CONCAT('REC-', LPAD(NEW.idmatricula, 6, '0')), NEW.idalumno,
         CONCAT(a.nombres, ' ', a.apellidos), NEW.idusuario_registro
    FROM planes p JOIN alumnos a ON a.idalumno = NEW.idalumno
   WHERE p.idplan = NEW.idplan;

  INSERT INTO auditoria (idusuario, tabla, accion, idregistro, detalle)
  VALUES (NEW.idusuario_registro, 'matriculas', 'insertar', NEW.idmatricula,
          CONCAT('alumno ', NEW.idalumno, ' plan ', NEW.idplan));
END $$

CREATE TRIGGER trg_matriculas_despues_actualizar AFTER UPDATE ON matriculas
FOR EACH ROW
BEGIN
  -- Al anular una matrícula se retira su ingreso de caja
  IF NEW.estado = 'anulada' AND OLD.estado <> 'anulada' THEN
    DELETE FROM movimientos_caja WHERE categoria = 'matricula' AND idreferencia = NEW.idmatricula;
    INSERT INTO auditoria (tabla, accion, idregistro, detalle)
    VALUES ('matriculas', 'actualizar', NEW.idmatricula, 'Matrícula anulada');
  END IF;
END $$

-- ---------------------------------------------------------------------
-- CONTRATOS: fecha fin según tipo, tarifa por hora y estado
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_contratos_antes_insertar BEFORE INSERT ON contratos
FOR EACH ROW
BEGIN
  IF NEW.fecha_fin IS NULL AND NEW.tipo <> 'indefinido' THEN
    SET NEW.fecha_fin = CASE NEW.tipo
      WHEN '3_meses' THEN DATE_ADD(NEW.fecha_inicio, INTERVAL 3 MONTH)
      WHEN '6_meses' THEN DATE_ADD(NEW.fecha_inicio, INTERVAL 6 MONTH)
      ELSE DATE_ADD(NEW.fecha_inicio, INTERVAL 1 YEAR) END;
  END IF;
  IF NEW.tarifa_hora = 0 AND NEW.sueldo_mensual > 0 AND NEW.horas_semanales > 0 THEN
    SET NEW.tarifa_hora = ROUND(NEW.sueldo_mensual / (NEW.horas_semanales * 4.33), 2);
  END IF;
  SET NEW.estado = CASE
    WHEN NEW.fecha_fin IS NULL THEN 'vigente'
    WHEN NEW.fecha_fin < CURDATE() THEN 'vencido'
    WHEN NEW.fecha_fin <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'por_vencer'
    ELSE 'vigente' END;
END $$

-- ---------------------------------------------------------------------
-- ASISTENCIA DEL PERSONAL: puntual/tarde y horas trabajadas
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_asis_empleado_antes_insertar BEFORE INSERT ON asistencias_empleado
FOR EACH ROW
BEGIN
  DECLARE v_inicio TIME;
  IF NEW.estado NOT IN ('falta','permiso') AND NEW.hora_entrada IS NOT NULL THEN
    SELECT MIN(hora_inicio) INTO v_inicio FROM horarios_empleado
     WHERE idempleado = NEW.idempleado AND dia_semana = WEEKDAY(NEW.fecha) + 1;
    -- 10 minutos de tolerancia
    SET NEW.estado = IF(v_inicio IS NOT NULL AND NEW.hora_entrada > ADDTIME(v_inicio, '00:10:00'), 'tarde', 'puntual');
  END IF;
  IF NEW.hora_entrada IS NOT NULL AND NEW.hora_salida IS NOT NULL THEN
    SET NEW.horas_trabajadas = ROUND(TIME_TO_SEC(TIMEDIFF(NEW.hora_salida, NEW.hora_entrada)) / 3600, 2);
  ELSE
    SET NEW.horas_trabajadas = 0;
  END IF;
END $$

CREATE TRIGGER trg_asis_empleado_antes_actualizar BEFORE UPDATE ON asistencias_empleado
FOR EACH ROW
BEGIN
  IF NEW.hora_entrada IS NOT NULL AND NEW.hora_salida IS NOT NULL THEN
    IF NEW.hora_salida <= NEW.hora_entrada THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La hora de salida debe ser posterior a la de entrada';
    END IF;
    SET NEW.horas_trabajadas = ROUND(TIME_TO_SEC(TIMEDIFF(NEW.hora_salida, NEW.hora_entrada)) / 3600, 2);
  END IF;
END $$

-- Permisos laborales aprobados: los días quedan marcados como 'permiso'
CREATE TRIGGER trg_permlab_despues_actualizar AFTER UPDATE ON permisos_laborales
FOR EACH ROW
BEGIN
  DECLARE v_dia DATE;
  IF NEW.estado = 'aprobado' AND OLD.estado <> 'aprobado' THEN
    SET v_dia = NEW.fecha_inicio;
    WHILE v_dia <= NEW.fecha_fin DO
      INSERT INTO asistencias_empleado (idempleado, fecha, estado, observacion)
      VALUES (NEW.idempleado, v_dia, 'permiso', CONCAT('Permiso ', NEW.tipo))
      ON DUPLICATE KEY UPDATE estado = 'permiso', observacion = CONCAT('Permiso ', NEW.tipo);
      SET v_dia = DATE_ADD(v_dia, INTERVAL 1 DAY);
    END WHILE;
  END IF;
END $$

-- ---------------------------------------------------------------------
-- PLANILLA: neto calculado y egreso en caja al pagar
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_planilla_antes_insertar BEFORE INSERT ON planilla
FOR EACH ROW
BEGIN
  SET NEW.neto = ROUND(IF(NEW.sueldo_base > 0, NEW.sueldo_base, NEW.horas_trabajadas * NEW.tarifa_hora)
                       + NEW.bonificacion - NEW.descuentos, 2);
END $$

CREATE TRIGGER trg_planilla_antes_actualizar BEFORE UPDATE ON planilla
FOR EACH ROW
BEGIN
  SET NEW.neto = ROUND(IF(NEW.sueldo_base > 0, NEW.sueldo_base, NEW.horas_trabajadas * NEW.tarifa_hora)
                       + NEW.bonificacion - NEW.descuentos, 2);
  IF NEW.estado = 'pagado' AND OLD.estado <> 'pagado' THEN
    SET NEW.fecha_pago = IFNULL(NEW.fecha_pago, CURDATE());
    SET NEW.comprobante = IFNULL(NEW.comprobante, CONCAT('REC-RH-', LPAD(NEW.idplanilla, 5, '0')));
  END IF;
END $$

CREATE TRIGGER trg_planilla_despues_actualizar AFTER UPDATE ON planilla
FOR EACH ROW
BEGIN
  IF NEW.estado = 'pagado' AND OLD.estado <> 'pagado' THEN
    INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, idreferencia, metodo_pago, comprobante,
                                  idempleado, nombre_relacionado, fecha)
    SELECT 'egreso', 'sueldo', NEW.neto,
           CONCAT('Pago de sueldo: ', e.nombres, ' ', e.apellidos, ' (', NEW.periodo, ')'),
           NEW.idplanilla, IFNULL(NEW.metodo_pago, 'transferencia'), NEW.comprobante, e.idempleado,
           CONCAT(e.nombres, ' ', e.apellidos), NEW.fecha_pago
      FROM contratos c JOIN empleados e ON e.idempleado = c.idempleado
     WHERE c.idcontrato = NEW.idcontrato;
  END IF;
END $$

-- ---------------------------------------------------------------------
-- CITAS: evita cruces de horario del profesional
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_citas_antes_insertar BEFORE INSERT ON citas
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM citas
              WHERE idempleado = NEW.idempleado AND fecha = NEW.fecha
                AND estado IN ('programada','confirmada','atendiendo','atendida')
                AND NEW.hora_inicio < hora_fin AND NEW.hora_fin > hora_inicio) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El profesional ya tiene una cita en ese horario';
  END IF;
END $$

CREATE TRIGGER trg_citas_antes_actualizar BEFORE UPDATE ON citas
FOR EACH ROW
BEGIN
  IF (NEW.fecha <> OLD.fecha OR NEW.hora_inicio <> OLD.hora_inicio OR NEW.hora_fin <> OLD.hora_fin
      OR NEW.idempleado <> OLD.idempleado)
     AND NEW.estado IN ('programada','confirmada')
     AND EXISTS (SELECT 1 FROM citas
                  WHERE idcita <> NEW.idcita AND idempleado = NEW.idempleado AND fecha = NEW.fecha
                    AND estado IN ('programada','confirmada','atendiendo','atendida')
                    AND NEW.hora_inicio < hora_fin AND NEW.hora_fin > hora_inicio) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El profesional ya tiene una cita en ese horario';
  END IF;
END $$

-- ---------------------------------------------------------------------
-- DIETAS: kilocalorías por gramos y total de la dieta
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_dieta_alimentos_antes_insertar BEFORE INSERT ON dieta_alimentos
FOR EACH ROW
BEGIN
  DECLARE v_kcal DECIMAL(6,1);
  DECLARE v_p DECIMAL(5,1);
  DECLARE v_c DECIMAL(5,1);
  DECLARE v_g DECIMAL(5,1);
  IF NEW.kilocalorias IS NULL OR NEW.kilocalorias = 0 THEN
    SELECT kcal_100g, proteinas_100g, carbohidratos_100g, grasas_100g INTO v_kcal, v_p, v_c, v_g
      FROM alimentos WHERE nombre = NEW.alimento LIMIT 1;
    SET NEW.kilocalorias = IFNULL(ROUND(v_kcal * NEW.gramos / 100, 1), 0);
    IF NEW.proteinas_g = 0 THEN SET NEW.proteinas_g = IFNULL(ROUND(v_p * NEW.gramos / 100, 1), 0); END IF;
    IF NEW.carbohidratos_g = 0 THEN SET NEW.carbohidratos_g = IFNULL(ROUND(v_c * NEW.gramos / 100, 1), 0); END IF;
    IF NEW.grasas_g = 0 THEN SET NEW.grasas_g = IFNULL(ROUND(v_g * NEW.gramos / 100, 1), 0); END IF;
  END IF;
END $$

CREATE TRIGGER trg_dieta_alimentos_despues_insertar AFTER INSERT ON dieta_alimentos
FOR EACH ROW
BEGIN
  UPDATE dietas d
     JOIN dieta_comidas c ON c.iddieta = d.iddieta
     SET d.calorias_totales = (SELECT IFNULL(ROUND(SUM(a.kilocalorias)), 0)
                                 FROM dieta_alimentos a JOIN dieta_comidas c2 ON c2.iddieta_comida = a.iddieta_comida
                                WHERE c2.iddieta = d.iddieta)
   WHERE c.iddieta_comida = NEW.iddieta_comida;
END $$

CREATE TRIGGER trg_dieta_alimentos_despues_eliminar AFTER DELETE ON dieta_alimentos
FOR EACH ROW
BEGIN
  UPDATE dietas d
     JOIN dieta_comidas c ON c.iddieta = d.iddieta
     SET d.calorias_totales = (SELECT IFNULL(ROUND(SUM(a.kilocalorias)), 0)
                                 FROM dieta_alimentos a JOIN dieta_comidas c2 ON c2.iddieta_comida = a.iddieta_comida
                                WHERE c2.iddieta = d.iddieta)
   WHERE c.iddieta_comida = OLD.iddieta_comida;
END $$

-- ---------------------------------------------------------------------
-- MEDIDAS: IMC, clasificación e índices cintura/cadera y cintura/talla
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_medidas_antes_insertar BEFORE INSERT ON medidas
FOR EACH ROW
BEGIN
  SET NEW.imc = ROUND(NEW.peso_kg / POW(NEW.talla_cm / 100, 2), 2);
  SET NEW.clasificacion_imc = CASE
    WHEN NEW.imc < 18.5 THEN 'Bajo peso'
    WHEN NEW.imc < 25   THEN 'Normal'
    WHEN NEW.imc < 30   THEN 'Sobrepeso'
    WHEN NEW.imc < 35   THEN 'Obesidad I'
    WHEN NEW.imc < 40   THEN 'Obesidad II'
    ELSE 'Obesidad III' END;
  SET NEW.indice_cintura_cadera = ROUND(NEW.cintura / NEW.cadera, 2);
  SET NEW.indice_cintura_talla  = ROUND(NEW.cintura / NEW.talla_cm, 2);
END $$

CREATE TRIGGER trg_medidas_antes_actualizar BEFORE UPDATE ON medidas
FOR EACH ROW
BEGIN
  SET NEW.imc = ROUND(NEW.peso_kg / POW(NEW.talla_cm / 100, 2), 2);
  SET NEW.clasificacion_imc = CASE
    WHEN NEW.imc < 18.5 THEN 'Bajo peso'
    WHEN NEW.imc < 25   THEN 'Normal'
    WHEN NEW.imc < 30   THEN 'Sobrepeso'
    WHEN NEW.imc < 35   THEN 'Obesidad I'
    WHEN NEW.imc < 40   THEN 'Obesidad II'
    ELSE 'Obesidad III' END;
  SET NEW.indice_cintura_cadera = ROUND(NEW.cintura / NEW.cadera, 2);
  SET NEW.indice_cintura_talla  = ROUND(NEW.cintura / NEW.talla_cm, 2);
END $$

-- ---------------------------------------------------------------------
-- FISIOTERAPIA: número de sesión correlativo por alumno
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_sesiones_fisio_antes_insertar BEFORE INSERT ON sesiones_fisioterapia
FOR EACH ROW
BEGIN
  SET NEW.numero_sesion = (SELECT COUNT(*) + 1 FROM sesiones_fisioterapia WHERE idalumno = NEW.idalumno);
END $$

-- ---------------------------------------------------------------------
-- VENTAS: stock, subtotales, total y caja
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_venta_detalle_antes_insertar BEFORE INSERT ON venta_detalle
FOR EACH ROW
BEGIN
  DECLARE v_stock INT;
  DECLARE v_precio DECIMAL(10,2);
  SELECT stock, precio_venta INTO v_stock, v_precio FROM productos WHERE idproducto = NEW.idproducto FOR UPDATE;
  IF v_stock IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto inexistente';
  END IF;
  IF v_stock < NEW.cantidad THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para el producto';
  END IF;
  IF NEW.precio_unitario IS NULL OR NEW.precio_unitario = 0 THEN
    SET NEW.precio_unitario = v_precio;
  END IF;
  SET NEW.subtotal = ROUND(NEW.precio_unitario * NEW.cantidad, 2);
END $$

CREATE TRIGGER trg_venta_detalle_despues_insertar AFTER INSERT ON venta_detalle
FOR EACH ROW
BEGIN
  UPDATE productos SET stock = stock - NEW.cantidad WHERE idproducto = NEW.idproducto;
  UPDATE ventas SET total = total + NEW.subtotal WHERE idventa = NEW.idventa;
END $$

CREATE TRIGGER trg_venta_detalle_despues_eliminar AFTER DELETE ON venta_detalle
FOR EACH ROW
BEGIN
  UPDATE productos SET stock = stock + OLD.cantidad WHERE idproducto = OLD.idproducto;
  UPDATE ventas SET total = total - OLD.subtotal WHERE idventa = OLD.idventa;
END $$

CREATE TRIGGER trg_ventas_antes_insertar BEFORE INSERT ON ventas
FOR EACH ROW
BEGIN
  IF NEW.comprobante IS NULL OR NEW.comprobante = '' THEN
    SET NEW.comprobante = CONCAT('B001-', LPAD((SELECT IFNULL(MAX(idventa), 0) + 1 FROM ventas), 6, '0'));
  END IF;
END $$

CREATE TRIGGER trg_ventas_despues_actualizar AFTER UPDATE ON ventas
FOR EACH ROW
BEGIN
  -- El ingreso en caja siempre refleja el total actual de la venta
  IF NEW.total <> OLD.total OR NEW.anulada <> OLD.anulada THEN
    DELETE FROM movimientos_caja WHERE categoria = 'venta' AND idreferencia = NEW.idventa;
    IF NEW.total > 0 AND NEW.anulada = 0 THEN
      INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, idreferencia, fecha, metodo_pago,
                                    comprobante, idalumno, idempleado, nombre_relacionado)
      SELECT 'ingreso', 'venta', NEW.total,
             CONCAT('Venta tienda - ', IFNULL(CONCAT(a.nombres, ' ', a.apellidos), 'Cliente general')),
             NEW.idventa, NEW.fecha, NEW.metodo_pago, NEW.comprobante, NEW.idalumno, NEW.idempleado,
             IFNULL(CONCAT(a.nombres, ' ', a.apellidos), 'Cliente general')
        FROM (SELECT 1) x LEFT JOIN alumnos a ON a.idalumno = NEW.idalumno;
    END IF;
  END IF;
END $$

-- Comprobante por defecto para movimientos manuales de caja
CREATE TRIGGER trg_movimientos_antes_insertar BEFORE INSERT ON movimientos_caja
FOR EACH ROW
BEGIN
  IF NEW.comprobante IS NULL OR NEW.comprobante = '' THEN
    SET NEW.comprobante = CONCAT(IF(NEW.tipo = 'ingreso', 'REC', 'EGR'), '-', DATE_FORMAT(NEW.fecha, '%Y%m%d'), '-',
                                 LPAD(FLOOR(RAND() * 100000), 5, '0'));
  END IF;
END $$

-- Aviso automático de stock bajo
CREATE TRIGGER trg_productos_despues_actualizar AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
  IF NEW.stock <= NEW.stock_minimo AND OLD.stock > OLD.stock_minimo THEN
    INSERT INTO notificaciones (titulo, mensaje, destino, tipo)
    VALUES ('Stock bajo', CONCAT(NEW.nombre, ' tiene ', NEW.stock, ' unidades'), 'personal', 'stock');
  END IF;
END $$

-- Cada ingreso o egreso se asocia al turno de caja que esté abierto
CREATE TRIGGER trg_movimientos_caja_turno BEFORE INSERT ON movimientos_caja
FOR EACH ROW
BEGIN
  IF NEW.idturno IS NULL THEN
    SET NEW.idturno = (SELECT idturno FROM turnos_caja WHERE estado = 'abierto' LIMIT 1);
  END IF;
END $$

DELIMITER ;


-- =====================================================================
-- RADICAL GYM - Procedimientos almacenados
-- La verificación de la clave (bcrypt) la hace el backend; la base solo
-- guarda el hash y registra intentos, bloqueos, sesiones y permisos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

DELIMITER $$

-- ---------------------------------------------------------------------
-- LOGIN (paso 1): datos del usuario para que el backend compare la clave.
-- Devuelve el hash y el estado de la cuenta. No registra nada aún.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_login_buscar(IN p_usuario VARCHAR(40))
BEGIN
  SELECT u.idusuario, u.usuario, u.clave_hash, u.activo, u.debe_cambiar_clave,
         u.intentos_fallidos, u.bloqueado_hasta,
         (u.bloqueado_hasta IS NOT NULL AND u.bloqueado_hasta > NOW()) AS bloqueado,
         r.codigo AS rol, r.nombre AS rol_nombre, r.modulo_inicio,
         u.idempleado, u.idalumno,
         COALESCE(CONCAT(e.nombres, ' ', e.apellidos), CONCAT(a.nombres, ' ', a.apellidos), u.usuario) AS nombre_completo,
         COALESCE(e.foto, a.foto) AS foto
    FROM usuarios u
    JOIN roles r ON r.idrol = u.idrol
    LEFT JOIN empleados e ON e.idempleado = u.idempleado
    LEFT JOIN alumnos a ON a.idalumno = u.idalumno
   WHERE u.usuario = p_usuario;
END $$

-- ---------------------------------------------------------------------
-- LOGIN (paso 2): registra el resultado del intento.
-- p_exitoso = 1 si la clave fue correcta.
-- Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.
-- Si fue exitoso, abre la sesión y devuelve los permisos del usuario.
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_login_registrar(
  IN p_usuario VARCHAR(40), IN p_exitoso TINYINT, IN p_token_id CHAR(32),
  IN p_horas_sesion INT, IN p_ip VARCHAR(45), IN p_dispositivo VARCHAR(255))
BEGIN
  DECLARE v_id INT;
  DECLARE v_activo TINYINT;
  DECLARE v_bloqueado DATETIME;
  DECLARE v_resultado VARCHAR(30);

  SELECT idusuario, activo, bloqueado_hasta INTO v_id, v_activo, v_bloqueado
    FROM usuarios WHERE usuario = p_usuario;

  SET v_resultado = CASE
    WHEN v_id IS NULL THEN 'usuario_inexistente'
    WHEN v_activo = 0 THEN 'inactivo'
    WHEN v_bloqueado IS NOT NULL AND v_bloqueado > NOW() THEN 'bloqueado'
    WHEN p_exitoso = 1 THEN 'exitoso'
    ELSE 'clave_incorrecta' END;

  INSERT INTO historial_accesos (idusuario, usuario_ingresado, resultado, ip, dispositivo)
  VALUES (v_id, p_usuario, v_resultado, p_ip, p_dispositivo);

  IF v_resultado = 'clave_incorrecta' THEN
    UPDATE usuarios
       SET bloqueado_hasta = IF(intentos_fallidos + 1 >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), bloqueado_hasta),
           intentos_fallidos = intentos_fallidos + 1
     WHERE idusuario = v_id;
  ELSEIF v_resultado = 'exitoso' THEN
    UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW()
     WHERE idusuario = v_id;
    INSERT INTO sesiones (idusuario, token_id, ip, dispositivo, fecha_expira)
    VALUES (v_id, p_token_id, p_ip, p_dispositivo, DATE_ADD(NOW(), INTERVAL IFNULL(p_horas_sesion, 8) HOUR));
  END IF;

  SELECT v_resultado AS resultado, v_id AS idusuario;
  IF v_resultado = 'exitoso' THEN
    CALL sp_usuario_permisos(v_id);
  END IF;
END $$

-- ---------------------------------------------------------------------
-- Verifica que una sesión siga abierta (para cada petición al backend)
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_sesion_validar(IN p_token_id CHAR(32))
BEGIN
  SELECT s.idsesion, s.idusuario, u.usuario, r.codigo AS rol, s.fecha_expira
    FROM sesiones s
    JOIN usuarios u ON u.idusuario = s.idusuario AND u.activo = 1
    JOIN roles r ON r.idrol = u.idrol
   WHERE s.token_id = p_token_id AND s.fecha_cierre IS NULL AND s.fecha_expira > NOW();
END $$

CREATE PROCEDURE sp_sesion_cerrar(IN p_token_id CHAR(32))
BEGIN
  UPDATE sesiones SET fecha_cierre = NOW() WHERE token_id = p_token_id AND fecha_cierre IS NULL;
END $$

-- Cierra todas las sesiones de un usuario (por ejemplo, tras cambiar la clave)
CREATE PROCEDURE sp_sesiones_cerrar_usuario(IN p_idusuario INT)
BEGIN
  UPDATE sesiones SET fecha_cierre = NOW() WHERE idusuario = p_idusuario AND fecha_cierre IS NULL;
END $$

-- ---------------------------------------------------------------------
-- Permisos efectivos de un usuario: los de su rol, corregidos por sus
-- excepciones personales (usuario_permisos tiene prioridad).
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_usuario_permisos(IN p_idusuario INT)
BEGIN
  SELECT m.codigo AS modulo, m.nombre, m.grupo, m.icono, m.orden,
         COALESCE(up.puede_ver,      rp.puede_ver,      0) AS puede_ver,
         COALESCE(up.puede_crear,    rp.puede_crear,    0) AS puede_crear,
         COALESCE(up.puede_editar,   rp.puede_editar,   0) AS puede_editar,
         COALESCE(up.puede_eliminar, rp.puede_eliminar, 0) AS puede_eliminar
    FROM usuarios u
    JOIN modulos m ON m.activo = 1
    LEFT JOIN rol_permisos rp     ON rp.idrol = u.idrol AND rp.idmodulo = m.idmodulo
    LEFT JOIN usuario_permisos up ON up.idusuario = u.idusuario AND up.idmodulo = m.idmodulo
   WHERE u.idusuario = p_idusuario
     AND COALESCE(up.puede_ver, rp.puede_ver, 0) = 1
   ORDER BY m.orden;
END $$

-- ---------------------------------------------------------------------
-- ADMINISTRACIÓN DE USUARIOS
-- ---------------------------------------------------------------------
-- Crea una cuenta. p_clave_hash debe venir ya cifrada con bcrypt.
CREATE PROCEDURE sp_usuario_crear(
  IN p_usuario VARCHAR(40), IN p_clave_hash VARCHAR(255), IN p_rol VARCHAR(30),
  IN p_idempleado INT, IN p_idalumno INT, IN p_correo VARCHAR(120), IN p_creado_por INT)
BEGIN
  DECLARE v_idrol INT;
  SELECT idrol INTO v_idrol FROM roles WHERE codigo = p_rol AND activo = 1;
  IF v_idrol IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El rol indicado no existe o está inactivo';
  END IF;
  IF EXISTS (SELECT 1 FROM usuarios WHERE usuario = p_usuario) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ese nombre de usuario ya está en uso';
  END IF;
  INSERT INTO usuarios (usuario, clave_hash, idrol, idempleado, idalumno, correo, creado_por, debe_cambiar_clave)
  VALUES (p_usuario, p_clave_hash, v_idrol, p_idempleado, p_idalumno, p_correo, p_creado_por, 1);
  SELECT LAST_INSERT_ID() AS idusuario;
END $$

-- Cambio de clave por el propio usuario (ya validada la clave anterior en el backend)
CREATE PROCEDURE sp_usuario_cambiar_clave(IN p_idusuario INT, IN p_nuevo_hash VARCHAR(255))
BEGIN
  UPDATE usuarios SET clave_hash = p_nuevo_hash, debe_cambiar_clave = 0 WHERE idusuario = p_idusuario;
END $$

-- Restablecimiento por el administrador: clave temporal y cambio obligatorio
CREATE PROCEDURE sp_usuario_restablecer_clave(IN p_idusuario INT, IN p_hash_temporal VARCHAR(255), IN p_admin INT)
BEGIN
  UPDATE usuarios SET clave_hash = p_hash_temporal, debe_cambiar_clave = 1 WHERE idusuario = p_idusuario;
  CALL sp_sesiones_cerrar_usuario(p_idusuario);
  INSERT INTO auditoria (idusuario, tabla, accion, idregistro, detalle)
  VALUES (p_admin, 'usuarios', 'actualizar', p_idusuario, 'Clave restablecida por administrador');
END $$

CREATE PROCEDURE sp_usuario_desbloquear(IN p_idusuario INT, IN p_admin INT)
BEGIN
  UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE idusuario = p_idusuario;
  INSERT INTO auditoria (idusuario, tabla, accion, idregistro, detalle)
  VALUES (p_admin, 'usuarios', 'actualizar', p_idusuario, 'Usuario desbloqueado');
END $$

-- Listado para la pantalla de administración de usuarios
CREATE PROCEDURE sp_usuarios_listar(IN p_buscar VARCHAR(80), IN p_rol VARCHAR(30), IN p_solo_activos TINYINT)
BEGIN
  SELECT u.idusuario, u.usuario, r.codigo AS rol, r.nombre AS rol_nombre,
         COALESCE(CONCAT(e.nombres, ' ', e.apellidos), CONCAT(a.nombres, ' ', a.apellidos), '') AS nombre_completo,
         IF(u.idempleado IS NOT NULL, 'personal', IF(u.idalumno IS NOT NULL, 'alumno', 'otro')) AS tipo,
         u.correo, u.activo, u.debe_cambiar_clave, u.intentos_fallidos,
         (u.bloqueado_hasta IS NOT NULL AND u.bloqueado_hasta > NOW()) AS bloqueado,
         u.ultimo_acceso, u.fecha_creacion,
         (SELECT COUNT(*) FROM sesiones s WHERE s.idusuario = u.idusuario
             AND s.fecha_cierre IS NULL AND s.fecha_expira > NOW()) AS sesiones_abiertas
    FROM usuarios u
    JOIN roles r ON r.idrol = u.idrol
    LEFT JOIN empleados e ON e.idempleado = u.idempleado
    LEFT JOIN alumnos a ON a.idalumno = u.idalumno
   WHERE (p_rol IS NULL OR p_rol = '' OR r.codigo = p_rol)
     AND (IFNULL(p_solo_activos, 0) = 0 OR u.activo = 1)
     AND (p_buscar IS NULL OR p_buscar = ''
          OR CONCAT_WS(' ', u.usuario, e.nombres, e.apellidos, a.nombres, a.apellidos, a.dni, e.dni) LIKE CONCAT('%', p_buscar, '%'))
   ORDER BY r.idrol, nombre_completo;
END $$

-- ---------------------------------------------------------------------
-- MANTENIMIENTO DIARIO: estados de matrículas y contratos
-- (lo puede llamar el backend una vez al día o un evento programado)
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_estados_actualizar()
BEGIN
  UPDATE matriculas SET estado = 'vencida'
   WHERE estado IN ('activa','por_vencer') AND fecha_fin < CURDATE();
  UPDATE matriculas SET estado = 'por_vencer'
   WHERE estado = 'activa' AND fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);
  UPDATE contratos SET estado = 'vencido'
   WHERE estado IN ('vigente','por_vencer') AND fecha_fin IS NOT NULL AND fecha_fin < CURDATE();
  UPDATE contratos SET estado = 'por_vencer'
   WHERE estado = 'vigente' AND fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);
  -- Limpieza de sesiones vencidas con más de 30 días
  DELETE FROM sesiones WHERE fecha_expira < DATE_SUB(NOW(), INTERVAL 30 DAY);
END $$

-- ---------------------------------------------------------------------
-- CHECK-IN DE ALUMNOS por DNI (barra de check-in rápido)
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_asistencia_alumno_registrar(IN p_dni CHAR(8), IN p_metodo VARCHAR(20))
BEGIN
  DECLARE v_id INT;
  DECLARE v_fin DATE;
  DECLARE v_resultado VARCHAR(15);

  SELECT idalumno INTO v_id FROM alumnos WHERE dni = p_dni AND activo = 1;
  IF v_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No existe un alumno activo con ese DNI';
  END IF;

  SELECT MAX(fecha_fin) INTO v_fin FROM matriculas
   WHERE idalumno = v_id AND estado NOT IN ('anulada','congelada');

  SET v_resultado = CASE
    WHEN v_fin IS NULL OR v_fin < CURDATE() THEN 'denegado'
    WHEN v_fin <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'advertencia'
    ELSE 'autorizado' END;

  -- Membresía congelada hoy: no puede ingresar
  IF EXISTS (SELECT 1 FROM congelamientos WHERE idalumno = v_id AND estado = 'vigente'
              AND CURDATE() BETWEEN fecha_inicio AND fecha_fin) THEN
    SET v_resultado = 'denegado';
  END IF;

  INSERT INTO asistencias_alumno (idalumno, fecha, hora, metodo, resultado)
  VALUES (v_id, CURDATE(), CURTIME(), IFNULL(p_metodo, 'dni_manual'), v_resultado);

  SELECT a.idalumno, CONCAT(a.nombres, ' ', a.apellidos) AS alumno, v_resultado AS resultado,
         v_fin AS vence, DATEDIFF(v_fin, CURDATE()) AS dias_restantes
    FROM alumnos a WHERE a.idalumno = v_id;
END $$

-- ---------------------------------------------------------------------
-- PANEL: indicadores principales del dashboard
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_panel_resumen()
BEGIN
  SELECT
    (SELECT COUNT(DISTINCT idalumno) FROM matriculas WHERE estado IN ('activa','por_vencer')) AS alumnos_activos,
    (SELECT COUNT(*) FROM matriculas WHERE estado = 'por_vencer') AS por_vencer,
    (SELECT IFNULL(SUM(monto), 0) FROM movimientos_caja
      WHERE tipo = 'ingreso' AND DATE_FORMAT(fecha, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')) AS ingresos_mes,
    (SELECT IFNULL(SUM(monto), 0) FROM movimientos_caja
      WHERE tipo = 'egreso' AND DATE_FORMAT(fecha, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')) AS egresos_mes,
    (SELECT COUNT(*) FROM asistencias_alumno WHERE fecha = CURDATE() AND tipo = 'entrada') AS asistencias_hoy,
    (SELECT COUNT(*) FROM productos WHERE activo = 1 AND stock <= stock_minimo) AS productos_stock_bajo,
    (SELECT COUNT(*) FROM citas WHERE fecha = CURDATE() AND estado IN ('programada','confirmada')) AS citas_hoy;
END $$

DELIMITER ;


-- =====================================================================
-- RADICAL GYM - Datos iniciales
-- Base lista para DATOS REALES: sin alumnos, ventas ni movimientos de
-- demostración. Incluye roles, módulos, permisos, los usuarios de acceso,
-- los planes del gimnasio y catálogos básicos (técnicas, alimentos, avisos).
--
-- Usuarios de acceso:
--
--   Rol              Usuario        Contraseña
--   Administración   admin          Radical2026!
--   Entrenador       entrenador     Coach2026!
--   Fisioterapia     fisioterapia   Fisio2026!
--   Nutrición        nutricion      Nutri2026!
--   Recepción        recepcion      Recep2026!
--
-- Los alumnos reciben su cuenta al registrarse: usuario = DNI y clave
-- temporal = DNI (el sistema les pide cambiarla en el primer ingreso).
-- Las contraseñas se guardan cifradas con bcrypt (nunca en texto plano).
-- CÁMBIALAS antes de usar el sistema con datos reales.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

-- ---------------------------------------------------------------------
-- Roles (los códigos coinciden con src/config/roles.js)
-- ---------------------------------------------------------------------
INSERT INTO roles (codigo, nombre, descripcion, modulo_inicio, es_sistema) VALUES
('admin',        'Administrador',  'Acceso total al sistema',                          'dashboard',     1),
('trainer',      'Entrenador',     'Rutinas, alumnos, citas y asistencias',            'routines',      1),
('physio',       'Fisioterapia',   'Gabinete de fisioterapia y sus citas',             'physiotherapy', 1),
('nutritionist', 'Nutrición',      'Consultorio de nutrición, dietas y medidas',       'nutrition',     1),
('reception',    'Recepción',      'Mostrador, caja por turnos, asistencias y ventas', 'cash',          1),
('student',      'Alumno / Socio', 'Portal personal del alumno',                       'mi_membresia',  1);

-- ---------------------------------------------------------------------
-- Módulos (los códigos coinciden con las pestañas del sistema)
-- ---------------------------------------------------------------------
INSERT INTO modulos (codigo, nombre, grupo, icono, orden) VALUES
('dashboard',     'Dashboard General',        'Gestión & Personal',    'LayoutDashboard', 10),
('reports',       'Reportes',                 'Gestión & Personal',    'FileBarChart',    15),
('goals',         'Metas & Logros',           'Gestión & Personal',    'Trophy',          16),
('members',       'Alumnos / Socios',         'Gestión & Personal',    'Users',           20),
('staff',         'Contratos de Personal',    'Gestión & Personal',    'Briefcase',       30),
('memberships',   'Planes & Tarifas',         'Gestión & Personal',    'CreditCard',      40),
('users',         'Usuarios & Accesos',       'Gestión & Personal',    'ShieldCheck',     45),
('nutrition',     'Nutrición & Medidas',      'Salud & Entrenamiento', 'Utensils',        50),
('physiotherapy', 'Fisioterapia',             'Salud & Entrenamiento', 'HeartPulse',      60),
('routines',      'Rutinas & Ejercicios',     'Salud & Entrenamiento', 'Dumbbell',        70),
('appointments',  'Horarios & Citas',         'Salud & Entrenamiento', 'Calendar',        80),
('attendances',   'Control Asistencias',      'Operativo & Caja',      'UserCheck',       90),
('store',         'Ventas / POS',             'Operativo & Caja',      'Store',          100),
('cash',          'Caja por Turnos','Operativo & Caja',      'Vault',          105),
('finance',       'Finanzas & Caja',          'Operativo & Caja',      'BadgeDollarSign',110),
('alerts',        'Notificaciones & Alertas', 'Operativo & Caja',      'BellRing',       120),
('mi_membresia',  'Mi Membresía',             'Portal del Alumno',     'CreditCard',     200),
('mis_citas',     'Notificaciones & Citas',   'Portal del Alumno',     'Calendar',       210),
('mis_medidas',   'Mis Medidas & Progreso',   'Portal del Alumno',     'Activity',       220),
('mi_rutina',     'Mi Rutina',                'Portal del Alumno',     'Dumbbell',       230),
('mi_dieta',      'Mi Plan de Alimentación',  'Portal del Alumno',     'Utensils',       240),
('mi_fisioterapia','Mi Fisioterapia',         'Portal del Alumno',     'HeartPulse',     250),
('mis_asistencias','Mis Asistencias',         'Portal del Alumno',     'CalendarCheck',  260);

-- ---------------------------------------------------------------------
-- Permisos por rol: (rol, módulo, ver, crear, editar, eliminar)
-- ---------------------------------------------------------------------
-- Administrador: todo, menos el portal del alumno
INSERT INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, 1, 1, 1, 1
  FROM roles r JOIN modulos m
 WHERE r.codigo = 'admin' AND m.grupo <> 'Portal del Alumno';

INSERT INTO rol_permisos (idrol, idmodulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT r.idrol, m.idmodulo, p.ver, p.crear, p.editar, p.eliminar
  FROM (
    -- Entrenador
    SELECT 'trainer' rol, 'routines' modulo, 1 ver, 1 crear, 1 editar, 1 eliminar UNION ALL
    SELECT 'trainer', 'members',       1, 0, 1, 0 UNION ALL
    SELECT 'trainer', 'appointments',  1, 1, 1, 0 UNION ALL
    SELECT 'trainer', 'attendances',   1, 1, 0, 0 UNION ALL
    -- Fisioterapia
    SELECT 'physio', 'physiotherapy',  1, 1, 1, 1 UNION ALL
    SELECT 'physio', 'appointments',   1, 1, 1, 0 UNION ALL
    SELECT 'physio', 'members',        1, 0, 0, 0 UNION ALL
    -- Nutrición
    SELECT 'nutritionist', 'nutrition',    1, 1, 1, 1 UNION ALL
    SELECT 'nutritionist', 'appointments', 1, 1, 1, 0 UNION ALL
    SELECT 'nutritionist', 'members',      1, 0, 0, 0 UNION ALL
    -- Metas: ven su avance; nutrición y fisioterapia evalúan objetivos
    SELECT 'trainer', 'goals',          1, 0, 0, 0 UNION ALL
    SELECT 'reception', 'goals',        1, 0, 0, 0 UNION ALL
    SELECT 'nutritionist', 'goals',     1, 1, 1, 0 UNION ALL
    SELECT 'physio', 'goals',           1, 1, 1, 0 UNION ALL
    -- Recepción
    SELECT 'reception', 'cash',         1, 1, 1, 0 UNION ALL
    SELECT 'reception', 'attendances',  1, 1, 1, 0 UNION ALL
    SELECT 'reception', 'store',        1, 1, 0, 0 UNION ALL
    SELECT 'reception', 'members',      1, 1, 1, 0 UNION ALL
    SELECT 'reception', 'memberships',  1, 0, 0, 0 UNION ALL
    SELECT 'reception', 'appointments', 1, 1, 1, 0 UNION ALL
    SELECT 'reception', 'alerts',       1, 1, 0, 0 UNION ALL
    -- Alumno: solo lectura de su portal
    SELECT 'student', 'mi_membresia', 1, 0, 0, 0 UNION ALL
    SELECT 'student', 'mis_citas',    1, 0, 0, 0 UNION ALL
    SELECT 'student', 'mis_medidas',  1, 0, 0, 0 UNION ALL
    SELECT 'student', 'mi_rutina',    1, 0, 0, 0 UNION ALL
    SELECT 'student', 'mi_dieta',     1, 0, 0, 0 UNION ALL
    SELECT 'student', 'mi_fisioterapia', 1, 0, 0, 0 UNION ALL
    SELECT 'student', 'mis_asistencias', 1, 0, 0, 0
  ) p
  JOIN roles r   ON r.codigo = p.rol
  JOIN modulos m ON m.codigo = p.modulo;

-- ---------------------------------------------------------------------
-- Personal (los IDs empiezan en 1000)
-- Nombres genéricos: reemplázalos por los datos reales de cada persona.
-- ---------------------------------------------------------------------
INSERT INTO empleados (nombres, apellidos, sexo, cargo, titulo_cargo, fecha_ingreso) VALUES
('Administrador', 'RADICAL',     'M', 'administrador',  'Administrador General',   CURDATE()),
('Entrenador',    'Principal',   'M', 'entrenador',     'Entrenador',              CURDATE()),
('Fisioterapeuta','Principal',   'M', 'fisioterapeuta', 'Fisioterapeuta',          CURDATE()),
('Nutricionista', 'Principal',   'F', 'nutricionista',  'Nutricionista',           CURDATE()),
('Recepción',     'Principal',   'F', 'recepcion',      'Recepción y Caja',        CURDATE());

-- ---------------------------------------------------------------------
-- Usuarios de acceso (contraseñas cifradas con bcrypt)
-- debe_cambiar_clave = 1: se recomienda cambiar la clave en el primer ingreso.
-- ---------------------------------------------------------------------
INSERT INTO usuarios (usuario, clave_hash, idrol, idempleado, debe_cambiar_clave)
SELECT d.usuario, d.hash, r.idrol, d.idempleado, 1
  FROM (
    SELECT 'admin' usuario, '$2y$10$KVuwLi32h0pKM2A.jsE5u.5LaRn6sgOtbOVOgJDkNYtqfNmfbuirK' hash, 'admin' rol, 1000 idempleado UNION ALL
    SELECT 'entrenador',   '$2y$10$wCCwl6BU3H1ZdGlczUVidO8oVZwIcLXuTW88XyOyXWXY9W8gYUFYS', 'trainer',      1001 UNION ALL
    SELECT 'fisioterapia', '$2y$10$aOKb5QTDjVnmmK3lAc9J3OltOPNaPddtkDpv0PehQk4QXpvanN63m', 'physio',       1002 UNION ALL
    SELECT 'nutricion',    '$2y$10$qI2TVnJvF6LVBYhEMoSPFuyxBQ/sU02dnmOMqUmlsjBr4x1JC5aKm', 'nutritionist', 1003 UNION ALL
    SELECT 'recepcion',    '$2y$10$BZ7/jqrEdK4UM.7yR/eFwuYSBa4W3b6CH8YBR7lVVFwV14FE8h11O', 'reception',    1004
  ) d
  JOIN roles r ON r.codigo = d.rol;

-- ---------------------------------------------------------------------
-- Planes (los mismos del sistema)
-- ---------------------------------------------------------------------
INSERT INTO planes (nombre, duracion_meses, duracion_dias, precio, incluye_entrenador, incluye_nutricion, incluye_fisioterapia, descripcion, caracteristicas, destacado) VALUES
('Pase Diario',      0,  1,  15.00, 0, 0, 0, 'Acceso total por 1 día a todas las instalaciones.',
 'Acceso a sala de pesas y cardio|Uso de vestuarios y duchas|Sin contrato', 0),
('Mensual Básico',   1,  0, 120.00, 0, 0, 0, 'Plan mensual ideal para comenzar tu cambio físico.',
 'Acceso ilimitado a sala de pesas y cardio|Evaluación física inicial|Casillero de uso diario', 0),
('Trimestral Pro',   3,  0, 320.00, 1, 1, 0, 'Nuestro plan más elegido. Mayor constancia y descuento especial.',
 'Acceso ilimitado|Asignación de rutina personalizada|1 sesión semanal con entrenador personal|Acceso a clases grupales|10% de descuento en suplementos', 1),
('Semestral Power',  6,  0, 580.00, 1, 1, 0, 'Compromiso de mediano plazo para transformaciones reales.',
 'Acceso ilimitado|Rutina personalizada mensual|Evaluación nutricional|Seguimiento de medidas corporales', 0),
('Anual VIP Black', 12,  0, 990.00, 1, 1, 1, 'Todo incluido, con fisioterapia preventiva.',
 'Acceso ilimitado 12 meses|Entrenador asignado|Plan nutricional|Fisioterapia preventiva|Congelamiento de membresía', 0);

-- Reglas de congelamiento (se cambian en Planes & Tarifas)
UPDATE planes SET congelamiento_dias = 15, congelamiento_partes = 1, congelamiento_min_dias = 15 WHERE nombre = 'Semestral Power';
UPDATE planes SET congelamiento_dias = 30, congelamiento_partes = 2, congelamiento_min_dias = 15 WHERE nombre = 'Anual VIP Black';

-- ---------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------
INSERT INTO tecnicas_fisioterapia (nombre, descripcion) VALUES
('Terapia manual',            'Movilizaciones y manipulaciones articulares'),
('Liberación miofascial',     'Liberación de tejido blando y puntos gatillo'),
('Punción seca',              'Tratamiento de puntos gatillo miofasciales'),
('Electroterapia TENS',       'Analgesia por estimulación eléctrica'),
('Ultrasonido terapéutico',   'Efecto térmico y antiinflamatorio'),
('Vendaje neuromuscular',     'Kinesiotaping funcional'),
('Crioterapia',               'Aplicación de frío local'),
('Termoterapia',              'Aplicación de calor local'),
('Ejercicio terapéutico',     'Fortalecimiento y control motor'),
('Estiramientos asistidos',   'Mejora de rango de movimiento');

-- Catálogo de alimentos (por 100 g). Fuentes: Tablas Peruanas de Composición de Alimentos (CENAN/INS 2017) y USDA.
INSERT INTO alimentos (nombre, categoria, emoji, kcal_100g, proteinas_100g, carbohidratos_100g, grasas_100g, fibra_100g, porcion_g, porcion_texto) VALUES
('Pechuga de pollo', 'proteinas', '🍗', 165, 31.0, 0.0, 3.6, 0, 120, '1 palma · 1 filete cocido'),
('Pechuga de pollo cruda', 'proteinas', '🍗', 120, 22.5, 0.0, 2.6, 0, 150, '1 filete crudo'),
('Pierna de pollo sin piel', 'proteinas', '🍗', 175, 27.0, 0.0, 7.0, 0, 120, '1 palma · cocida'),
('Pechuga de pavo', 'proteinas', '🦃', 135, 30.0, 0.0, 1.0, 0, 120, '1 palma · cocida'),
('Pavo molido', 'proteinas', '🦃', 170, 22.0, 0.0, 9.0, 0, 100, '1 palma · cocido'),
('Jamón de pavo', 'proteinas', '🦃', 104, 17.0, 2.0, 3.0, 0, 30, '2 lonjas'),
('Lomo de res', 'proteinas', '🥩', 190, 29.0, 0.0, 8.0, 0, 120, '1 palma · cocido'),
('Carne molida de res magra', 'proteinas', '🥩', 217, 26.0, 0.0, 12.0, 0, 100, '1 palma · cocida'),
('Bistec de res', 'proteinas', '🥩', 200, 28.0, 0.0, 9.5, 0, 120, '1 palma · cocido'),
('Hígado de res', 'proteinas', '🥩', 175, 27.0, 5.0, 5.0, 0, 100, '1 palma · cocido'),
('Corazón de res (anticucho)', 'proteinas', '🍢', 165, 28.0, 0.2, 5.0, 0, 100, '2 palitos'),
('Lomo de cerdo', 'proteinas', '🥓', 195, 29.0, 0.0, 8.0, 0, 120, '1 palma · cocido'),
('Cordero', 'proteinas', '🍖', 258, 26.0, 0.0, 17.0, 0, 100, '1 palma · cocido'),
('Cuy', 'proteinas', '🍖', 96, 19.0, 0.1, 1.6, 0, 150, '¼ de cuy'),
('Atún en agua', 'proteinas', '🐟', 116, 26.0, 0.0, 0.8, 0, 80, '½ lata escurrida'),
('Atún en aceite', 'proteinas', '🐟', 198, 29.0, 0.0, 8.0, 0, 80, '½ lata escurrida'),
('Pescado bonito', 'proteinas', '🐟', 144, 24.0, 0.0, 5.0, 0, 120, '1 palma · 1 filete'),
('Jurel', 'proteinas', '🐟', 127, 21.0, 0.0, 4.5, 0, 120, '1 palma · 1 filete'),
('Caballa', 'proteinas', '🐟', 205, 19.0, 0.0, 13.9, 0, 100, '1 palma'),
('Salmón', 'proteinas', '🐟', 206, 22.0, 0.0, 12.0, 0, 120, '1 palma · cocido'),
('Trucha', 'proteinas', '🐟', 150, 21.0, 0.0, 6.6, 0, 120, '1 palma · cocida'),
('Tilapia', 'proteinas', '🐟', 128, 26.0, 0.0, 2.7, 0, 120, '1 palma · cocida'),
('Merluza', 'proteinas', '🐟', 95, 20.0, 0.0, 1.2, 0, 120, '1 palma · cocida'),
('Pota', 'proteinas', '🦑', 70, 15.0, 0.5, 0.8, 0, 120, '1 palma'),
('Langostinos', 'proteinas', '🦐', 99, 24.0, 0.2, 0.3, 0, 100, '8 unidades cocidas'),
('Sardinas en lata', 'proteinas', '🐟', 208, 25.0, 0.0, 11.5, 0, 90, '3 unidades escurridas'),
('Huevo entero', 'proteinas', '🥚', 155, 13.0, 1.1, 11.0, 0, 100, '2 huevos'),
('Clara de huevo', 'proteinas', '🥚', 52, 11.0, 0.7, 0.2, 0, 99, '3 claras'),
('Tofu firme', 'proteinas', '🧊', 144, 17.3, 2.8, 8.7, 2.3, 100, '1 palma'),
('Seitán', 'proteinas', '🌾', 140, 25.0, 6.0, 2.0, 0.6, 100, '1 palma'),
('Leche descremada', 'lacteos', '🥛', 34, 3.4, 5.0, 0.1, 0, 240, '1 taza'),
('Leche entera', 'lacteos', '🥛', 61, 3.2, 4.8, 3.3, 0, 240, '1 taza'),
('Leche evaporada light', 'lacteos', '🥛', 78, 7.0, 11.0, 0.5, 0, 60, '¼ de taza'),
('Yogur griego natural', 'lacteos', '🥣', 97, 9.0, 3.6, 5.0, 0, 170, '1 pote'),
('Yogur griego 0%', 'lacteos', '🥣', 59, 10.0, 3.6, 0.4, 0, 170, '1 pote'),
('Yogur natural', 'lacteos', '🥣', 61, 3.5, 4.7, 3.3, 0, 200, '1 vaso'),
('Queso fresco', 'lacteos', '🧀', 264, 17.5, 3.2, 20.1, 0, 30, '2 dedos · 1 tajada'),
('Queso mozzarella', 'lacteos', '🧀', 280, 28.0, 3.1, 17.0, 0, 30, '2 dedos'),
('Queso cottage', 'lacteos', '🧀', 98, 11.0, 3.4, 4.3, 0, 100, '½ taza'),
('Queso parmesano', 'lacteos', '🧀', 431, 38.0, 4.1, 29.0, 0, 10, '1 cucharada rallado'),
('Arroz blanco cocido', 'cereales', '🍚', 130, 2.7, 28.0, 0.3, 0.4, 100, '½ taza · 1 mano ahuecada'),
('Arroz integral cocido', 'cereales', '🍚', 112, 2.6, 23.5, 0.9, 1.8, 100, '½ taza · 1 mano ahuecada'),
('Quinua cocida', 'cereales', '🌾', 120, 4.4, 21.3, 1.9, 2.8, 100, '½ taza · 1 mano ahuecada'),
('Avena en hojuelas', 'cereales', '🥣', 375, 13.0, 68.0, 6.0, 10.0, 40, '½ taza cruda'),
('Kiwicha', 'cereales', '🌾', 371, 13.6, 65.0, 7.0, 6.7, 30, '3 cucharadas'),
('Fideos cocidos', 'cereales', '🍝', 158, 5.8, 31.0, 0.9, 1.8, 100, '½ taza · 1 mano ahuecada'),
('Pasta integral cocida', 'cereales', '🍝', 149, 6.0, 30.0, 1.7, 3.9, 100, '½ taza · 1 mano ahuecada'),
('Cuscús cocido', 'cereales', '🥣', 112, 3.8, 23.0, 0.2, 1.4, 100, '½ taza'),
('Pan francés', 'cereales', '🥖', 280, 8.4, 58.0, 1.6, 2.4, 30, '1 unidad'),
('Pan integral', 'cereales', '🍞', 247, 13.0, 41.0, 3.4, 7.0, 28, '1 rebanada'),
('Tortilla de trigo', 'cereales', '🫓', 310, 8.0, 51.0, 8.0, 3.5, 45, '1 unidad'),
('Galleta de arroz', 'cereales', '🍘', 387, 8.0, 81.0, 3.0, 4.2, 9, '1 unidad'),
('Granola', 'cereales', '🥣', 471, 10.0, 64.0, 20.0, 7.0, 30, '¼ de taza'),
('Choclo desgranado', 'cereales', '🌽', 96, 3.4, 21.0, 1.5, 2.4, 100, '½ taza · 1 mano ahuecada'),
('Papa sancochada', 'tuberculos', '🥔', 87, 1.9, 20.0, 0.1, 1.8, 150, '1 papa mediana'),
('Papa amarilla sancochada', 'tuberculos', '🥔', 104, 2.2, 23.0, 0.2, 1.8, 120, '1 papa mediana'),
('Camote sancochado', 'tuberculos', '🍠', 90, 2.0, 20.7, 0.2, 3.3, 130, '1 camote mediano'),
('Yuca sancochada', 'tuberculos', '🍠', 120, 1.0, 29.0, 0.3, 1.8, 100, '1 trozo · 1 mano ahuecada'),
('Olluco', 'tuberculos', '🥔', 62, 1.1, 14.0, 0.1, 0.8, 100, '½ taza'),
('Lentejas cocidas', 'legumbres', '🫘', 116, 9.0, 20.0, 0.4, 7.9, 100, '½ taza · 1 mano ahuecada'),
('Frejol canario cocido', 'legumbres', '🫘', 127, 8.7, 22.8, 0.5, 6.4, 100, '½ taza · 1 mano ahuecada'),
('Frejol negro cocido', 'legumbres', '🫘', 132, 8.9, 23.7, 0.5, 8.7, 100, '½ taza · 1 mano ahuecada'),
('Garbanzos cocidos', 'legumbres', '🫘', 164, 8.9, 27.4, 2.6, 7.6, 100, '½ taza · 1 mano ahuecada'),
('Pallares cocidos', 'legumbres', '🫘', 115, 7.8, 21.0, 0.4, 7.0, 100, '½ taza'),
('Arvejas', 'legumbres', '🫛', 84, 5.4, 15.6, 0.2, 5.5, 100, '½ taza'),
('Habas cocidas', 'legumbres', '🫛', 110, 7.6, 19.6, 0.4, 5.4, 100, '½ taza'),
('Edamame', 'legumbres', '🫛', 121, 11.9, 8.9, 5.2, 5.2, 100, '½ taza'),
('Tarwi (chocho) cocido', 'legumbres', '🫘', 119, 15.6, 9.9, 2.9, 2.8, 100, '½ taza'),
('Brócoli', 'verduras', '🥦', 35, 2.4, 7.2, 0.4, 3.3, 100, '1 taza · 1 puño'),
('Coliflor', 'verduras', '🥦', 23, 1.8, 4.1, 0.5, 2.3, 100, '1 taza · 1 puño'),
('Espinaca', 'verduras', '🥬', 23, 2.9, 3.6, 0.4, 2.2, 60, '2 tazas crudas · 1 puño'),
('Lechuga', 'verduras', '🥬', 15, 1.4, 2.9, 0.2, 1.3, 50, '1 taza · 1 puño'),
('Kale', 'verduras', '🥬', 35, 2.9, 4.4, 1.5, 4.1, 50, '1 taza · 1 puño'),
('Tomate', 'verduras', '🍅', 18, 0.9, 3.9, 0.2, 1.2, 120, '1 tomate · 1 puño'),
('Pepino', 'verduras', '🥒', 15, 0.7, 3.6, 0.1, 0.5, 100, '1 taza · 1 puño'),
('Zanahoria', 'verduras', '🥕', 41, 0.9, 9.6, 0.2, 2.8, 80, '1 zanahoria mediana'),
('Vainitas', 'verduras', '🫛', 31, 1.8, 7.0, 0.2, 2.7, 100, '1 taza · 1 puño'),
('Zapallo loche', 'verduras', '🎃', 26, 1.0, 6.5, 0.1, 0.5, 100, '1 taza · 1 puño'),
('Zapallito italiano', 'verduras', '🥒', 17, 1.2, 3.1, 0.3, 1.0, 100, '1 taza · 1 puño'),
('Pimiento', 'verduras', '🫑', 28, 1.0, 6.0, 0.3, 2.1, 100, '1 taza · 1 puño'),
('Cebolla', 'verduras', '🧅', 40, 1.1, 9.3, 0.1, 1.7, 50, '½ cebolla'),
('Beterraga', 'verduras', '🟣', 43, 1.6, 9.6, 0.2, 2.8, 100, '1 beterraga pequeña'),
('Champiñones', 'verduras', '🍄', 22, 3.1, 3.3, 0.3, 1.0, 70, '1 taza'),
('Repollo', 'verduras', '🥬', 23, 1.3, 5.8, 0.1, 2.5, 100, '1 taza · 1 puño'),
('Apio', 'verduras', '🥬', 16, 0.7, 3.0, 0.2, 1.6, 60, '1 tallo grande'),
('Caigua', 'verduras', '🥒', 15, 0.6, 3.3, 0.1, 1.0, 100, '1 caigua'),
('Espárragos', 'verduras', '🌱', 20, 2.2, 3.9, 0.1, 2.1, 100, '6 unidades'),
('Ensalada mixta', 'verduras', '🥗', 18, 1.0, 3.5, 0.2, 1.4, 150, '1 plato hondo · 1 a 2 puños'),
('Plátano de seda', 'frutas', '🍌', 89, 1.1, 22.8, 0.3, 2.6, 120, '1 plátano mediano'),
('Manzana', 'frutas', '🍎', 52, 0.3, 13.8, 0.2, 2.4, 180, '1 manzana mediana'),
('Naranja', 'frutas', '🍊', 47, 0.9, 12.0, 0.1, 2.4, 150, '1 naranja mediana'),
('Mandarina', 'frutas', '🍊', 53, 0.8, 13.3, 0.3, 1.8, 100, '1 mandarina'),
('Papaya', 'frutas', '🍈', 43, 0.5, 10.8, 0.3, 1.7, 150, '1 taza · 1 puño'),
('Piña', 'frutas', '🍍', 50, 0.5, 13.0, 0.1, 1.4, 150, '1 taza · 1 puño'),
('Fresas', 'frutas', '🍓', 32, 0.7, 7.7, 0.3, 2.0, 150, '1 taza · 1 puño'),
('Arándanos', 'frutas', '🫐', 57, 0.7, 14.5, 0.3, 2.4, 100, '¾ de taza'),
('Mango', 'frutas', '🥭', 60, 0.8, 15.0, 0.4, 1.6, 150, '1 taza · 1 puño'),
('Uvas', 'frutas', '🍇', 69, 0.7, 18.0, 0.2, 0.9, 100, '15 uvas'),
('Sandía', 'frutas', '🍉', 30, 0.6, 7.6, 0.2, 0.4, 200, '1 tajada'),
('Melón', 'frutas', '🍈', 34, 0.8, 8.2, 0.2, 0.9, 150, '1 taza · 1 puño'),
('Pera', 'frutas', '🍐', 57, 0.4, 15.0, 0.1, 3.1, 170, '1 pera mediana'),
('Kiwi', 'frutas', '🥝', 61, 1.1, 14.7, 0.5, 3.0, 75, '1 kiwi'),
('Granadilla', 'frutas', '🟠', 97, 2.2, 23.0, 0.7, 10.4, 80, '1 granadilla (pulpa)'),
('Aguaymanto', 'frutas', '🟡', 53, 1.9, 11.2, 0.7, 4.9, 100, '1 taza'),
('Chirimoya', 'frutas', '🍈', 75, 1.6, 17.7, 0.7, 3.0, 150, '½ chirimoya'),
('Lúcuma', 'frutas', '🟤', 99, 1.5, 25.0, 0.5, 1.3, 100, '½ lúcuma'),
('Palta', 'grasas', '🥑', 160, 2.0, 8.5, 14.7, 6.7, 50, '¼ de palta'),
('Aceite de oliva', 'grasas', '🫒', 884, 0.0, 0.0, 100.0, 0, 13.5, '1 cucharada'),
('Aceite vegetal', 'grasas', '🫗', 884, 0.0, 0.0, 100.0, 0, 13.5, '1 cucharada'),
('Aceite de coco', 'grasas', '🥥', 890, 0.0, 0.0, 99.0, 0, 13.5, '1 cucharada'),
('Mantequilla', 'grasas', '🧈', 717, 0.9, 0.1, 81.0, 0, 10, '1 cucharadita colmada'),
('Mantequilla de maní', 'grasas', '🥜', 588, 25.0, 20.0, 50.0, 6.0, 16, '1 cucharada · 1 pulgar'),
('Almendras', 'grasas', '🌰', 579, 21.0, 22.0, 50.0, 12.5, 28, '23 unidades · 1 pulgar'),
('Nueces', 'grasas', '🌰', 654, 15.0, 14.0, 65.0, 6.7, 28, '7 mitades · 1 pulgar'),
('Pecanas', 'grasas', '🌰', 691, 9.2, 14.0, 72.0, 9.6, 28, '10 mitades'),
('Maní tostado', 'grasas', '🥜', 585, 24.0, 21.0, 50.0, 8.0, 28, '1 puñadito · 1 pulgar'),
('Castañas', 'grasas', '🌰', 659, 14.0, 12.0, 67.0, 7.5, 15, '3 unidades'),
('Pistachos', 'grasas', '🌰', 560, 20.0, 28.0, 45.0, 10.6, 28, '49 unidades'),
('Semillas de chía', 'grasas', '⚫', 486, 17.0, 42.0, 31.0, 34.4, 12, '1 cucharada'),
('Linaza molida', 'grasas', '🟤', 534, 18.0, 29.0, 42.0, 27.3, 10, '1 cucharada'),
('Semillas de girasol', 'grasas', '🌻', 584, 21.0, 20.0, 51.0, 8.6, 15, '1 cucharada colmada'),
('Aceitunas', 'grasas', '🫒', 145, 1.0, 3.8, 15.3, 3.3, 30, '8 aceitunas'),
('Chocolate negro 70%', 'grasas', '🍫', 598, 7.8, 46.0, 43.0, 10.9, 10, '1 cuadradito'),
('Proteína whey', 'suplementos', '💪', 400, 80.0, 8.0, 6.0, 0, 30, '1 scoop'),
('Creatina monohidratada', 'suplementos', '⚡', 0, 0.0, 0.0, 0.0, 0, 5, '1 cucharadita'),
('Leche de soya sin azúcar', 'bebidas', '🥛', 33, 2.9, 1.7, 1.6, 0.4, 240, '1 taza'),
('Leche de almendras sin azúcar', 'bebidas', '🥛', 15, 0.6, 0.3, 1.2, 0.2, 240, '1 taza'),
('Jugo de naranja natural', 'bebidas', '🧃', 45, 0.7, 10.4, 0.2, 0.2, 250, '1 vaso'),
('Bebida isotónica', 'bebidas', '🥤', 24, 0.0, 6.0, 0.0, 0, 500, '1 botella'),
('Café negro', 'bebidas', '☕', 2, 0.3, 0.0, 0.0, 0, 240, '1 taza'),
('Miel de abeja', 'otros', '🍯', 304, 0.3, 82.0, 0.0, 0.2, 21, '1 cucharada'),
('Azúcar', 'otros', '🍬', 387, 0.0, 100.0, 0.0, 0, 5, '1 cucharadita'),
('Mermelada', 'otros', '🍓', 250, 0.4, 62.0, 0.1, 1.0, 20, '1 cucharada');

INSERT INTO reglas_notificacion (nombre, categoria, canales, momento, dias, titulo_plantilla, cuerpo_plantilla) VALUES
('Aviso preventivo de renovación (7 días antes)', 'vencimiento', 'push|correo|whatsapp', '7 días antes del vencimiento', 7,
 '¡Tu membresía vence pronto!', 'Hola {{nombre}}, te recordamos que tu plan {{plan}} vencerá en {{dias_restantes}} días ({{fecha_vencimiento}}). Renueva con anticipación.'),
('Aviso urgente de renovación (3 días antes)', 'vencimiento', 'push|correo|whatsapp', '3 días antes del vencimiento', 3,
 'Quedan 3 días de tu membresía', 'Hola {{nombre}}, tu plan {{plan}} está a punto de vencer el {{fecha_vencimiento}}. Renueva en recepción y evita interrupciones.'),
('Membresía vencida', 'vencimiento', 'push|whatsapp', 'El día del vencimiento', 0,
 'Tu membresía venció hoy', 'Hola {{nombre}}, tu plan {{plan}} venció el {{fecha_vencimiento}}. ¡Te extrañamos! Acércate a renovar.'),
('Saludo de cumpleaños', 'cumpleanos', 'push|whatsapp', 'El día del cumpleaños', 0,
 '¡Feliz cumpleaños!', '¡Feliz cumpleaños, {{nombre}}! Todo el equipo de RADICAL te desea un gran día.');

-- ---------------------------------------------------------------------
-- Configuración del gimnasio y turnos de recepción
-- ---------------------------------------------------------------------
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('gym_nombre',      'RADICAL', 'Nombre del gimnasio'),
('gym_whatsapp',    '',            'WhatsApp de recepción (alumnos)'),
('admin_whatsapp',  '',            'WhatsApp del administrador (reportes)'),
('gym_direccion',   '',            'Dirección'),
('gym_ruc',         '',            'RUC');

INSERT INTO turnos_recepcion (nombre, hora_inicio, hora_fin) VALUES
('Turno 1 - Mañana', '06:00:00', '14:00:00'),
('Turno 2 - Tarde',  '14:00:00', '22:00:00');

-- ---------------------------------------------------------------------
-- Indicaciones para el alumno: estiramientos (3 x 30 s), movilidad y calentamiento
-- (2 x 15), postura y cuidados; plantillas listas para aplicar con un clic
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- Mensajes predeterminados por categoría: 15 por categoría, editables
-- ---------------------------------------------------------------------
INSERT IGNORE INTO plantillas_mensajes (categoria, titulo, mensaje, orden) VALUES
('por_vencer', 'Recordatorio con cariño', '¡Hola {{nombre}}! 💪 Tu plan {{plan}} vence el {{fecha_vencimiento}}. Has avanzado muchísimo y sería una pena frenar ahora. Renueva y sigamos construyendo tu mejor versión juntos. ¡Te esperamos en {{gym}}!', 1),
('por_vencer', 'Tu esfuerzo vale', '{{nombre}}, cada gota de sudor que dejaste aquí cuenta. 🌟 Te quedan {{dias}} días de tu plan {{plan}}. No dejes que el impulso se pierda: renueva y continúa tu historia de progreso.', 2),
('por_vencer', 'Faltan pocos días', '¡Hola {{nombre}}! ⏳ En {{dias}} días vence tu membresía. Escríbenos por aquí y te dejamos todo listo para que sigas entrenando sin pausas. 🙌', 3),
('por_vencer', 'Seguimos juntos', '{{nombre}}, en {{gym}} nos encanta verte llegar con esa energía. 💙 Tu plan vence el {{fecha_vencimiento}}; renuévalo y sigamos sumando logros juntos.', 4),
('por_vencer', 'Tu meta te espera', '¿Recuerdas por qué empezaste, {{nombre}}? 🎯 Tu meta sigue ahí, esperándote. Tu plan {{plan}} vence en {{dias}} días; renueva y no pierdas lo que ya conquistaste.', 5),
('por_vencer', 'La constancia es tu superpoder', 'La constancia es tu superpoder, {{nombre}}. ⚡ Tu membresía vence el {{fecha_vencimiento}}. Renueva a tiempo y mantén tu racha intacta.', 6),
('por_vencer', 'Te guardamos tu lugar', '¡Hola {{nombre}}! Tu lugar en {{gym}} siempre está guardado. 🏋️ Solo recuerda que tu plan {{plan}} vence en {{dias}} días. ¿Te ayudamos a renovarlo?', 7),
('por_vencer', 'Un pequeño aviso', '{{nombre}}, un pequeño aviso con mucho cariño: tu plan vence el {{fecha_vencimiento}}. 💪 Renovar hoy es regalarte un mes más de salud y bienestar.', 8),
('por_vencer', 'Mira lo que lograste', 'Mira todo lo que lograste, {{nombre}}: más fuerza, más energía, más confianza. ✨ No te detengas ahora. Tu plan {{plan}} vence en {{dias}} días; renueva y vamos por más.', 9),
('por_vencer', 'Sin pausas', '¡{{nombre}}! 🔥 El cuerpo agradece la continuidad. Tu membresía vence el {{fecha_vencimiento}}; renueva sin pausas y conserva todo tu progreso.', 10),
('por_vencer', 'Tu entrenador te espera', 'Hola {{nombre}}, tu entrenador y todo el equipo de {{gym}} queremos seguir acompañándote. 🤝 Tu plan vence en {{dias}} días. ¡Renueva y seguimos!', 11),
('por_vencer', 'Renovar es fácil', '{{nombre}}, renovar es muy fácil: pásate por recepción o respóndenos aquí. 😊 Tu plan {{plan}} vence el {{fecha_vencimiento}}.', 12),
('por_vencer', 'Invierte en ti', 'La mejor inversión eres tú, {{nombre}}. 💎 Tu membresía vence en {{dias}} días. Renueva y sigue cuidando lo más valioso que tienes: tu salud.', 13),
('por_vencer', 'El último empujón', '¡Hola {{nombre}}! Estás en tu mejor momento, no lo sueltes. 🚀 Tu plan vence el {{fecha_vencimiento}}; renueva y dale el empujón final a tu objetivo.', 14),
('por_vencer', 'Gracias por confiar', 'Gracias por confiar en {{gym}}, {{nombre}}. 🙏 Tu plan {{plan}} está por vencer ({{fecha_vencimiento}}). Será un gusto seguir siendo parte de tu proceso.', 15),
('vencidos', 'Te extrañamos', '¡Hola {{nombre}}! 💙 Tu plan venció el {{fecha_vencimiento}} y, la verdad, te extrañamos en {{gym}}. Vuelve cuando quieras: aquí te esperamos con los brazos abiertos.', 1),
('vencidos', 'Tu progreso te espera', '{{nombre}}, todo lo que avanzaste sigue en ti. 💪 Tu membresía venció, pero tu camino no tiene por qué detenerse. Renueva y retomemos juntos.', 2),
('vencidos', 'Es momento de volver', 'Cada día es una nueva oportunidad, {{nombre}}. 🌅 Tu plan venció el {{fecha_vencimiento}}. ¿Qué tal si hoy es el día en que regresas?', 3),
('vencidos', 'No pierdas lo logrado', '{{nombre}}, el cuerpo tiene memoria, pero necesita constancia. 🔁 Renueva tu plan y no dejes que se pierda lo que tanto te costó lograr.', 4),
('vencidos', 'Tu lugar sigue aquí', '¡Hola {{nombre}}! Tu lugar en {{gym}} sigue aquí, esperándote. 🏋️ Renueva tu membresía y volvamos a entrenar juntos.', 5),
('vencidos', 'Un abrazo del equipo', 'Todo el equipo de {{gym}} te manda un abrazo, {{nombre}}. 🤗 Notamos que tu plan venció. Si necesitas algo para volver, solo escríbenos.', 6),
('vencidos', 'A tu ritmo', '{{nombre}}, a veces la vida se complica, lo entendemos. 💙 Cuando estés listo(a), retomamos tu entrenamiento a tu ritmo. Tu plan venció el {{fecha_vencimiento}}.', 7),
('vencidos', 'Vuelve más fuerte', 'Los grandes regresos empiezan con una decisión, {{nombre}}. 🔥 Renueva hoy y vuelve más fuerte que nunca.', 8),
('vencidos', 'La sala te espera', '¡{{nombre}}! Las pesas, la música y el equipo te esperan. 🎶 Tu membresía venció; renueva y vuelve a sentir esa energía que solo da entrenar.', 9),
('vencidos', 'Tu salud primero', 'Tu salud no puede esperar, {{nombre}}. ❤️ Tu plan {{plan}} venció el {{fecha_vencimiento}}. Renueva y sigue cuidándote como mereces.', 10),
('vencidos', 'Recuerda tu porqué', '¿Recuerdas por qué empezaste, {{nombre}}? 🎯 Ese motivo sigue valiendo. Renueva tu plan y vuelve por tu objetivo.', 11),
('vencidos', 'Un paso a la vez', 'No importa cuánto tiempo pase, {{nombre}}: siempre puedes volver a empezar. 👣 Te esperamos en {{gym}} para dar el primer paso juntos.', 12),
('vencidos', '¿Todo bien?', 'Hola {{nombre}}, ¿todo bien? 😊 Vimos que tu plan venció y queríamos saber cómo estás. Si podemos ayudarte a volver, aquí estamos.', 13),
('vencidos', 'Tu energía hace falta', '{{nombre}}, tu energía hace falta en la sala. ⚡ Renueva tu membresía y vuelve a contagiarnos esas ganas.', 14),
('vencidos', 'Tu mejor versión', 'Tu mejor versión te está esperando, {{nombre}}. ✨ Solo falta que vuelvas por ella. Renueva tu plan y sigamos.', 15),
('no_vienen', '¿Todo bien?', '¡Hola {{nombre}}! 😊 Hace {{dias}} días que no te vemos por {{gym}}. ¿Todo bien? Tu plan sigue activo hasta el {{fecha_vencimiento}}; ¡aprovéchalo!', 1),
('no_vienen', 'Te extrañamos en la sala', '{{nombre}}, la sala no es la misma sin ti. 💙 Tu membresía está activa y te espera. ¿Vienes esta semana?', 2),
('no_vienen', 'Retoma hoy', 'El mejor momento para retomar es hoy, {{nombre}}. 🔥 Llevas {{dias}} días sin entrenar; ven aunque sea 30 minutos, tu cuerpo te lo agradecerá.', 3),
('no_vienen', 'Tu plan te espera', 'Hola {{nombre}}, tu plan {{plan}} sigue vigente hasta el {{fecha_vencimiento}}. 💪 No lo dejes pasar: cada día cuenta.', 4),
('no_vienen', 'Solo empieza', '{{nombre}}, no hace falta un entrenamiento perfecto, solo empezar. 👣 Te esperamos para retomar a tu ritmo.', 5),
('no_vienen', 'Tu entrenador preguntó por ti', '¡{{nombre}}! Tu entrenador preguntó por ti. 🤝 Hace {{dias}} días que no vienes; cuando quieras, te armamos un plan para retomar sin presión.', 6),
('no_vienen', 'La disciplina te trae de vuelta', 'La motivación va y viene, pero la disciplina te trae de vuelta, {{nombre}}. ⚡ Te esperamos en {{gym}}.', 7),
('no_vienen', '¿Te ayudamos?', 'Hola {{nombre}}, si cambió tu horario o tienes alguna dificultad, cuéntanos. 😊 Queremos ayudarte a seguir entrenando.', 8),
('no_vienen', 'No pierdas tus días', '{{nombre}}, tu membresía sigue corriendo hasta el {{fecha_vencimiento}}. ⏳ ¡Aprovecha cada día que ya pagaste!', 9),
('no_vienen', 'Tu cuerpo te llama', 'Tu cuerpo extraña moverse, {{nombre}}. 🏃 Ven a sacudirte el estrés con un buen entrenamiento. ¡Te esperamos!', 10),
('no_vienen', 'Volver es ganar', 'Volver también es ganar, {{nombre}}. 🏆 No importa cuánto tiempo pasó; lo importante es que regreses.', 11),
('no_vienen', 'Algo nuevo para motivarte', '¿Quieres algo nuevo para motivarte, {{nombre}}? 💡 Pídele a tu entrenador una rutina diferente y vuelve con todo.', 12),
('no_vienen', 'Un momento para ti', 'Entrenar también es cuidar tu mente, {{nombre}}. 🧠💙 Hace {{dias}} días que no vienes; regálate un momento para ti.', 13),
('no_vienen', 'Una nueva racha', '{{nombre}}, empecemos una nueva racha juntos. 🔥 Ven mañana y marca tu asistencia con tu código {{codigo}}.', 14),
('no_vienen', 'Te esperamos con energía', '¡Hola {{nombre}}! En {{gym}} te esperamos con la mejor energía. ⚡ Tu plan está activo: ven, entrena y siéntete increíble.', 15),
('renovaron', '¡Gracias por renovar!', '¡{{nombre}}, gracias por renovar con {{gym}}! 🙌 Tu plan {{plan}} está activo hasta el {{fecha_vencimiento}}. Vamos por más logros juntos.', 1),
('renovaron', 'Decirte sí', '{{nombre}}, renovar es decirte sí a ti mismo(a). 💪 Gracias por seguir confiando en nosotros. ¡A seguir creciendo!', 2),
('renovaron', 'Orgullosos de ti', 'Estamos orgullosos de tu constancia, {{nombre}}. 🌟 Tu plan ya está renovado; esta nueva etapa será aún mejor.', 3),
('renovaron', 'Nuevas metas', '¡Nueva etapa, nuevas metas, {{nombre}}! 🎯 Tu membresía está activa hasta el {{fecha_vencimiento}}. Cuéntanos tu próximo objetivo.', 4),
('renovaron', 'Qué alegría', '¡Qué alegría tenerte un tiempo más, {{nombre}}! 💙 Gracias por renovar. Aquí seguimos para acompañarte en cada repetición.', 5),
('renovaron', 'Tu compromiso inspira', '{{nombre}}, tu compromiso inspira a todos en la sala. ✨ Gracias por renovar tu plan {{plan}}.', 6),
('renovaron', 'Listo para todo', '¡Renovado y listo para todo, {{nombre}}! 🔥 Este periodo vamos a romperla juntos.', 7),
('renovaron', 'Gracias de corazón', 'De corazón, gracias por elegirnos otra vez, {{nombre}}. 🙏 Tu confianza es nuestro mayor motor.', 8),
('renovaron', 'Mide tu progreso', '{{nombre}}, ya que renovaste, ¿qué tal una evaluación para medir tu progreso? 📈 Pídela en recepción: ¡te va a encantar ver tus avances!', 9),
('renovaron', 'La constancia se nota', 'La constancia se nota, {{nombre}}. 💪 Gracias por renovar; tu esfuerzo está dando frutos.', 10),
('renovaron', 'Somos tu equipo', 'Recuerda que no entrenas solo(a), {{nombre}}: somos tu equipo. 🤝 Gracias por renovar con {{gym}}.', 11),
('renovaron', 'Un reto para celebrar', '¡{{nombre}}! Para celebrar tu renovación te proponemos un reto: entrena 12 veces este mes. 🏆 ¿Aceptas?', 12),
('renovaron', 'Tu mejor inversión', 'Renovar es la mejor inversión que puedes hacer, {{nombre}}. 💎 Gracias por seguir apostando por tu salud.', 13),
('renovaron', 'Felices de verte', 'Nos hace muy felices verte seguir, {{nombre}}. 😊 Tu plan está activo hasta el {{fecha_vencimiento}}. ¡A entrenar!', 14),
('renovaron', 'Sigue brillando', 'Sigue brillando, {{nombre}}. ✨ Gracias por renovar y por ser parte de la familia {{gym}}.', 15),
('bienvenida', '¡Bienvenido(a) a la familia!', '¡Bienvenido(a) a la familia {{gym}}, {{nombre}}! 🎉 Hoy empieza tu transformación. Tu código para marcar asistencia es {{codigo}}.', 1),
('bienvenida', 'El primer paso', '{{nombre}}, el primer paso es el más valiente y ya lo diste. 👏 Estamos felices de acompañarte en este camino.', 2),
('bienvenida', 'Estamos para ti', 'Hola {{nombre}}, cualquier duda sobre máquinas, rutinas u horarios, pregúntanos sin miedo. 😊 Estamos para ayudarte.', 3),
('bienvenida', 'Tu código', '¡Hola {{nombre}}! Para entrar solo dices tu código {{codigo}} en recepción. 💳 ¡Fácil y rápido!', 4),
('bienvenida', 'A tu ritmo', '{{nombre}}, no compitas con nadie, solo con quien eras ayer. 💪 Empieza a tu ritmo; nosotros te guiamos.', 5),
('bienvenida', 'Qué alegría tenerte', '¡Qué alegría tenerte, {{nombre}}! 🌟 Cada entrenamiento te acercará a tu meta. Vamos con todo.', 6),
('bienvenida', 'Tu plan está activo', '{{nombre}}, tu plan {{plan}} está activo hasta el {{fecha_vencimiento}}. 📅 ¡Aprovecha cada día!', 7),
('bienvenida', 'Conoce a tu entrenador', 'Hola {{nombre}}, no olvides presentarte con tu entrenador para que te arme una rutina a tu medida. 🤝', 8),
('bienvenida', 'La primera semana', 'La primera semana siempre es la más retadora, {{nombre}}, pero también la más importante. 🔥 ¡Tú puedes!', 9),
('bienvenida', 'Tu portal del alumno', '{{nombre}}, en tu portal del alumno puedes ver tu rutina, tus medidas y tus asistencias. 📲 ¡Échale un vistazo!', 10),
('bienvenida', 'Un consejo para empezar', 'Un consejo para empezar, {{nombre}}: hidrátate bien y descansa. 💧 El progreso también se construye fuera del gym.', 11),
('bienvenida', 'Hoy empieza tu cambio', 'Hoy empieza tu cambio, {{nombre}}. 🦋 Estamos emocionados de ver todo lo que vas a lograr.', 12),
('bienvenida', 'Sin miedo', '{{nombre}}, todos empezamos alguna vez. 😊 No tengas miedo de preguntar ni de equivocarte: aquí todos te apoyamos.', 13),
('bienvenida', 'Cuéntanos tu meta', 'Cuéntanos tu meta, {{nombre}}, y te ayudaremos a lograrla paso a paso. 🎯 ¡Bienvenido(a) a {{gym}}!', 14),
('bienvenida', 'Gracias por elegirnos', 'Gracias por elegir {{gym}}, {{nombre}}. 🙏 Prometemos darte lo mejor en cada entrenamiento.', 15),
('cumpleanos', '¡Feliz cumpleaños!', '¡Feliz cumpleaños, {{nombre}}! 🎂🎉 Todo el equipo de {{gym}} te desea un año lleno de salud, fuerza y logros.', 1),
('cumpleanos', 'Un año más fuerte', '¡{{nombre}}, un año más y más fuerte que nunca! 💪🎈 Que este nuevo año te traiga todo lo que te propongas.', 2),
('cumpleanos', 'Hoy es tu día', '¡Hoy es tu día, {{nombre}}! 🥳 Disfrútalo al máximo; mañana entrenamos para quemar el pastel. 😄', 3),
('cumpleanos', 'Te mereces lo mejor', 'Feliz cumpleaños, {{nombre}}. 🌟 Te mereces lo mejor, y estamos felices de ser parte de tu camino.', 4),
('cumpleanos', 'Salud por tu salud', '¡Salud por tu salud, {{nombre}}! 🥂 Feliz cumpleaños de parte de toda la familia {{gym}}.', 5),
('cumpleanos', 'Nueva vuelta al sol', '¡Feliz nueva vuelta al sol, {{nombre}}! ☀️ Que cada día de este año sea una oportunidad para ser tu mejor versión.', 6),
('cumpleanos', 'Un detalle para ti', '¡Feliz cumpleaños, {{nombre}}! 🎁 Pásate por recepción: tenemos un detalle para ti.', 7),
('cumpleanos', 'Orgullosos de ti', '{{nombre}}, en tu cumpleaños queremos decirte lo orgullosos que estamos de tu esfuerzo. 💙 ¡Feliz día!', 8),
('cumpleanos', 'Que cumplas tus metas', 'Feliz cumpleaños, {{nombre}}. 🎯 Que este año cumplas todas tus metas, dentro y fuera del gym.', 9),
('cumpleanos', 'Fuerza y alegría', '¡Muchas felicidades, {{nombre}}! 🎉 Te deseamos fuerza en el cuerpo y alegría en el corazón.', 10),
('cumpleanos', 'Un día especial', 'Hoy es un día especial porque es tu día, {{nombre}}. 🎈 ¡Feliz cumpleaños y que lo disfrutes muchísimo!', 11),
('cumpleanos', 'Gracias por ser parte', 'Feliz cumpleaños, {{nombre}}. 🙏 Gracias por ser parte de {{gym}}; tu energía nos hace mejores.', 12),
('cumpleanos', 'A celebrar', '¡A celebrar, {{nombre}}! 🥳 Un año más de vida es un año más para cuidarte y quererte.', 13),
('cumpleanos', 'Pastel permitido', '¡Feliz cumpleaños, {{nombre}}! 🍰 Hoy el pastel está totalmente permitido. ¡Disfrútalo!', 14),
('cumpleanos', 'Lo mejor está por venir', 'Feliz cumpleaños, {{nombre}}. ✨ Lo mejor está por venir, y aquí estaremos para entrenarlo contigo.', 15),
('deuda', 'Recordatorio amable', 'Hola {{nombre}} 😊, te recordamos con cariño que tienes un saldo pendiente de S/ {{deuda}}, con fecha límite el {{fecha_limite}}. Cualquier consulta, aquí estamos.', 1),
('deuda', 'Sin apuros', '{{nombre}}, solo un recordatorio: tu saldo pendiente es de S/ {{deuda}}. 🙏 Puedes cancelarlo en recepción hasta el {{fecha_limite}}.', 2),
('deuda', 'Te ayudamos a organizarte', 'Hola {{nombre}}, si necesitas organizar tu pago de S/ {{deuda}}, conversemos. 🤝 Queremos que sigas entrenando tranquilo(a).', 3),
('deuda', 'La fecha se acerca', '{{nombre}}, tu fecha límite de pago ({{fecha_limite}}) se acerca. ⏳ Tu saldo es de S/ {{deuda}}. ¡Gracias por tu puntualidad!', 4),
('deuda', 'Gracias por tu compromiso', 'Gracias por tu compromiso, {{nombre}}. 💙 Te recordamos tu saldo de S/ {{deuda}} para el {{fecha_limite}}.', 5),
('deuda', 'Formas de pago', 'Hola {{nombre}}, puedes cancelar tu saldo de S/ {{deuda}} en efectivo, Yape o tarjeta en recepción. 💳 Fecha límite: {{fecha_limite}}.', 6),
('deuda', 'Mensaje corto', '{{nombre}}, recordatorio: saldo pendiente S/ {{deuda}} · vence {{fecha_limite}}. ¡Gracias! 😊', 7),
('deuda', 'Seguimos contigo', '{{nombre}}, seguimos contigo en tu proceso. 💪 Solo recuerda regularizar tu saldo de S/ {{deuda}} antes del {{fecha_limite}}.', 8),
('deuda', 'Lo entendemos', 'Hola {{nombre}}, entendemos que a veces los pagos se complican. 🙏 Tu saldo es S/ {{deuda}}; si necesitas más tiempo, avísanos.', 9),
('deuda', 'Sin interrupciones', '{{nombre}}, para que sigas entrenando sin interrupciones, recuerda cancelar S/ {{deuda}} hasta el {{fecha_limite}}. 🏋️', 10),
('deuda', 'Hoy es el último día', 'Hola {{nombre}}, hoy es el último día para cancelar tu saldo de S/ {{deuda}}. 😊 Te esperamos en recepción.', 11),
('deuda', 'Gracias por adelantado', 'Gracias por adelantado, {{nombre}}. 🙌 Te recordamos tu pago pendiente de S/ {{deuda}} (hasta el {{fecha_limite}}).', 12),
('deuda', 'Paga por Yape', '{{nombre}}, si prefieres, envíanos la captura de tu Yape por aquí y registramos tu pago de S/ {{deuda}}. 📲', 13),
('deuda', 'Cuentas claras', 'Cuentas claras, amistades largas 😄. {{nombre}}, tu saldo pendiente es S/ {{deuda}}, con fecha límite el {{fecha_limite}}.', 14),
('deuda', 'Con respeto', 'Estimado(a) {{nombre}}, con mucho respeto te recordamos tu saldo de S/ {{deuda}}. Gracias por ser parte de {{gym}}. 💙', 15),
('congelamiento', '¡Ya casi vuelves!', '¡Hola {{nombre}}! ❄️➡️🔥 Tu congelamiento termina pronto y vuelves a entrenar el {{fecha_regreso}}. ¡Te esperamos con todo!', 1),
('congelamiento', 'Tu plan se reactiva', '{{nombre}}, tu membresía se reactiva el {{fecha_regreso}}. 💪 Tu plan ahora vence el {{fecha_vencimiento}}. ¡Nos vemos pronto!', 2),
('congelamiento', 'Vuelve a tu ritmo', 'Te esperamos de vuelta muy pronto, {{nombre}}. 😊 Retomaremos a tu ritmo, sin apuros.', 3),
('congelamiento', 'Te extrañamos', '{{nombre}}, te extrañamos estos días. 💙 El {{fecha_regreso}} volvemos a vernos en {{gym}}.', 4),
('congelamiento', 'Rutina de regreso', 'Hola {{nombre}}, para tu regreso el {{fecha_regreso}}, pídele a tu entrenador una rutina de readaptación. 🤝', 5),
('congelamiento', 'Energía renovada', '¡Esperamos que vuelvas con energía renovada, {{nombre}}! ⚡ Tu regreso es el {{fecha_regreso}}.', 6),
('congelamiento', 'Empieza suave', '{{nombre}}, al volver empieza suave: calienta bien y escucha a tu cuerpo. 🧘 Te esperamos el {{fecha_regreso}}.', 7),
('congelamiento', 'Cuenta regresiva', '¡Cuenta regresiva, {{nombre}}! ⏳ El {{fecha_regreso}} vuelves a la sala. ¿Listo(a)?', 8),
('congelamiento', 'Tus días se guardaron', '{{nombre}}, los días que congelaste se sumaron a tu plan. ✅ Ahora vence el {{fecha_vencimiento}}.', 9),
('congelamiento', 'Si necesitas ajustar algo', 'Hola {{nombre}}, tu regreso es el {{fecha_regreso}}. Si necesitas ajustar algo, escríbenos. 😊', 10),
('congelamiento', 'La sala te espera', 'La sala te espera, {{nombre}}. 🏋️ Nos vemos el {{fecha_regreso}} para retomar juntos.', 11),
('congelamiento', 'Volver con experiencia', 'Volver es empezar de nuevo con más experiencia, {{nombre}}. 💪 ¡Te esperamos!', 12),
('congelamiento', 'Tu salud primero', 'Esperamos que estés muy bien, {{nombre}}. 💙 Tu plan se reactiva el {{fecha_regreso}}; tu salud siempre primero.', 13),
('congelamiento', 'Una meta para tu regreso', '{{nombre}}, ¿qué meta te propones para tu regreso? 🎯 Cuéntanos y la trabajamos desde el {{fecha_regreso}}.', 14),
('congelamiento', 'Bienvenida anticipada', '¡Bienvenida anticipada, {{nombre}}! 🎉 El {{fecha_regreso}} te recibimos con los brazos abiertos en {{gym}}.', 15),
('constancia', '¡Eres imparable!', '¡{{nombre}}, eres imparable! 🔥 Viniste {{asistencias}} veces en los últimos 30 días. Tu constancia es admirable.', 1),
('constancia', 'Un ejemplo', '{{nombre}}, eres un ejemplo para todos en la sala. 🌟 Gracias por tu disciplina.', 2),
('constancia', 'Los resultados llegan', 'Los resultados llegan a quien no se rinde, {{nombre}}. 💪 Sigue así, vas excelente.', 3),
('constancia', 'Muy orgullosos', 'Estamos muy orgullosos de ti, {{nombre}}. 🏆 {{asistencias}} entrenamientos este mes: ¡increíble!', 4),
('constancia', 'Mide tus avances', '{{nombre}}, con tanta constancia ya es hora de medir tus avances. 📈 Pide tu evaluación en recepción.', 5),
('constancia', 'Descansa también', '{{nombre}}, tu esfuerzo es enorme. 😴 Recuerda descansar bien: el músculo crece cuando descansas.', 6),
('constancia', '¡Qué racha!', '¡Qué racha, {{nombre}}! ⚡ No la sueltes: estás construyendo un gran hábito.', 7),
('constancia', 'La disciplina vence', 'La disciplina vence al talento, {{nombre}}. 💯 Y tú tienes de sobra. ¡Felicitaciones!', 8),
('constancia', 'Tu constancia inspira', 'Tu constancia inspira, {{nombre}}. ✨ Gracias por contagiarnos tu energía.', 9),
('constancia', 'El siguiente nivel', '{{nombre}}, estás listo(a) para el siguiente nivel. 🚀 Pídele a tu entrenador un nuevo reto.', 10),
('constancia', 'Ya es hábito', 'Ya no es motivación, {{nombre}}, es hábito. 🙌 ¡Felicitaciones por tu compromiso!', 11),
('constancia', 'Cuerpo y mente', 'Cada entrenamiento suma, {{nombre}}, en cuerpo y mente. 🧠💪 Sigue brillando.', 12),
('constancia', 'Reconocimiento del mes', 'Reconocimiento del mes para ti, {{nombre}}. 🏅 Tu constancia no pasa desapercibida.', 13),
('constancia', 'Gracias por darlo todo', 'Gracias por darlo todo, {{nombre}}. 🙏 Eres parte importante de la familia {{gym}}.', 14),
('constancia', 'Celebra tus logros', 'Celebra tus logros, {{nombre}}. 🎉 Venir {{asistencias}} veces en un mes no es poca cosa.', 15),
('exalumnos', 'Te recordamos con cariño', '¡Hola {{nombre}}! Hace tiempo no te vemos por {{gym}} y te recordamos con cariño. 💙 Cuando quieras volver, aquí estamos.', 1),
('exalumnos', 'Una nueva oportunidad', '{{nombre}}, siempre hay una nueva oportunidad para empezar. 🌅 ¿Volvemos a entrenar juntos?', 2),
('exalumnos', 'Tenemos novedades', '¡{{nombre}}! Tenemos novedades en {{gym}} que te van a encantar. ✨ Ven a conocerlas.', 3),
('exalumnos', 'Sin presión', 'Hola {{nombre}}, sin presión: si algún día quieres retomar, te armamos un plan a tu medida. 😊', 4),
('exalumnos', 'Una segunda oportunidad', '{{nombre}}, tu salud siempre merece una segunda oportunidad. ❤️ Te esperamos cuando estés listo(a).', 5),
('exalumnos', 'Volver es avanzar', 'Volver a empezar no es retroceder, {{nombre}}: es avanzar con más experiencia. 💪', 6),
('exalumnos', 'Promoción de regreso', '{{nombre}}, tenemos una promoción especial de regreso para ti. 🎁 Escríbenos y te contamos.', 7),
('exalumnos', 'Extrañamos tu energía', 'Extrañamos tu energía, {{nombre}}. ⚡ La sala no es la misma sin ti.', 8),
('exalumnos', 'Esa sensación', '¿Recuerdas lo bien que te sentías después de entrenar, {{nombre}}? 😊 Esa sensación te está esperando.', 9),
('exalumnos', 'Queremos saber de ti', 'Hola {{nombre}}, queremos saber cómo estás. 💙 Si hay algo que podamos mejorar para que vuelvas, cuéntanos.', 10),
('exalumnos', 'Reto de 30 días', '{{nombre}}, ¿te animas a un reto de 30 días para volver? 🏆 Nosotros te acompañamos.', 11),
('exalumnos', 'Puertas abiertas', 'Las puertas de {{gym}} siempre están abiertas para ti, {{nombre}}. 🚪💙', 12),
('exalumnos', 'Solo volver', '{{nombre}}, no hace falta volver al 100 %, solo volver. 👣 Paso a paso lo logramos.', 13),
('exalumnos', 'El siguiente capítulo', 'Tu historia en {{gym}} no terminó, {{nombre}}. ✨ Escribamos juntos el siguiente capítulo.', 14),
('exalumnos', 'Te esperamos', 'Te esperamos con mucho cariño, {{nombre}}. 🤗 Cuando quieras volver, solo escríbenos.', 15);

-- ---------------------------------------------------------------------
-- Alimentos ampliados: andinos, amazónicos, mariscos, bebidas, suplementos y platos peruanos
-- ---------------------------------------------------------------------
INSERT IGNORE INTO alimentos (nombre, categoria, emoji, kcal_100g, proteinas_100g, carbohidratos_100g, grasas_100g, fibra_100g, porcion_g, porcion_texto, azucares_100g, sodio_mg_100g, indice_glucemico, etiquetas, notas) VALUES
('Huevo de codorniz', 'proteinas', '🥚', 158, 13.0, 0.4, 11.0, 0, 50, '5 huevitos', 0.4, 141, 'bajo', NULL, NULL),
('Huevo duro', 'proteinas', '🥚', 155, 12.6, 1.1, 10.6, 0, 50, '1 huevo', 1.1, 124, 'bajo', NULL, NULL),
('Pollo a la brasa sin piel', 'proteinas', '🍗', 190, 28.0, 1.0, 8.0, 0, 150, '¼ de pollo sin piel', 0, 450, 'bajo', NULL, 'Retirar la piel baja mucho la grasa'),
('Pechuga de pollo a la plancha', 'proteinas', '🍗', 151, 31.0, 0.0, 3.0, 0, 120, '1 filete', 0, 70, 'bajo', 'alta en proteína', NULL),
('Muslo de pollo con piel', 'proteinas', '🍗', 229, 24.0, 0.0, 15.0, 0, 120, '1 muslo', 0, 85, 'bajo', NULL, NULL),
('Carne de alpaca', 'proteinas', '🥩', 105, 22.0, 0.0, 1.5, 0, 120, '1 palma', 0, 60, 'bajo', 'andino, magra', 'Muy baja en grasa y colesterol'),
('Asado de tira', 'proteinas', '🥩', 290, 24.0, 0.0, 21.0, 0, 120, '1 porción', 0, 60, 'bajo', NULL, NULL),
('Chuleta de cerdo', 'proteinas', '🥓', 231, 26.0, 0.0, 14.0, 0, 120, '1 chuleta', 0, 62, 'bajo', NULL, NULL),
('Anchoveta', 'proteinas', '🐟', 185, 20.0, 0.0, 11.5, 0, 100, '1 palma', 0, 104, 'bajo', 'omega 3', 'Pescado peruano rico en omega 3 y hierro'),
('Pejerrey', 'proteinas', '🐟', 98, 19.0, 0.0, 2.0, 0, 120, '1 palma', 0, 70, 'bajo', 'magro', NULL),
('Lenguado', 'proteinas', '🐟', 91, 19.0, 0.0, 1.2, 0, 120, '1 filete', 0, 80, 'bajo', 'magro', NULL),
('Conchas de abanico', 'proteinas', '🐚', 88, 17.0, 2.4, 0.8, 0, 100, '8 conchas', 0, 390, 'bajo', NULL, NULL),
('Choros (mejillones)', 'proteinas', '🦪', 86, 12.0, 3.7, 2.2, 0, 100, '10 choros', 0, 286, 'bajo', 'hierro', NULL),
('Pulpo', 'proteinas', '🐙', 82, 15.0, 2.2, 1.0, 0, 100, '1 porción', 0, 230, 'bajo', NULL, NULL),
('Camarón de río', 'proteinas', '🦐', 99, 21.0, 0.0, 1.1, 0, 100, '1 porción', 0, 150, 'bajo', NULL, NULL),
('Proteína de soya texturizada', 'proteinas', '🌱', 330, 50.0, 30.0, 1.0, 18, 30, '3 cucharadas (seca)', 7, 10, 'bajo', 'vegano, alto en fibra', NULL),
('Tempeh', 'proteinas', '🌱', 192, 20.0, 7.6, 11.0, 0, 100, '1 porción', 0, 9, 'bajo', 'vegano', NULL),
('Queso andino', 'lacteos', '🧀', 330, 22.0, 2.0, 26.0, 0, 30, '1 tajada', 0.5, 600, 'bajo', NULL, NULL),
('Queso edam', 'lacteos', '🧀', 357, 25.0, 1.4, 28.0, 0, 30, '1 tajada', 1.4, 965, 'bajo', NULL, NULL),
('Requesón', 'lacteos', '🧀', 98, 11.0, 3.4, 4.3, 0, 100, '½ taza', 2.7, 364, 'bajo', 'alto en proteína', NULL),
('Yogur bebible', 'lacteos', '🥛', 85, 3.0, 13.0, 2.0, 0, 200, '1 vaso', 12, 45, 'medio', NULL, 'Suele tener azúcar añadida'),
('Leche sin lactosa', 'lacteos', '🥛', 46, 3.3, 4.8, 1.5, 0, 250, '1 vaso', 4.8, 44, 'bajo', 'sin lactosa', NULL),
('Kéfir', 'lacteos', '🥛', 52, 3.4, 4.5, 2.0, 0, 200, '1 vaso', 4.5, 40, 'bajo', 'probiótico', NULL),
('Pan de molde integral', 'cereales', '🍞', 247, 13.0, 41.0, 3.4, 7, 30, '1 tajada', 5, 450, 'medio', 'integral', NULL),
('Pan pita integral', 'cereales', '🫓', 262, 10.0, 54.0, 2.6, 7, 60, '1 unidad', 1, 530, 'medio', 'integral', NULL),
('Avena cocida en agua', 'cereales', '🥣', 71, 2.5, 12.0, 1.5, 1.7, 200, '1 taza', 0.3, 4, 'bajo', NULL, NULL),
('Cancha serrana', 'cereales', '🌽', 380, 8.0, 72.0, 5.0, 10, 30, '1 puñado', 1, 300, 'medio', 'andino', NULL),
('Mote de maíz', 'cereales', '🌽', 140, 3.5, 30.0, 1.0, 4, 150, '1 taza', 0.5, 5, 'medio', 'andino', NULL),
('Cañihua', 'cereales', '🌾', 380, 15.0, 64.0, 7.0, 9, 30, '3 cucharadas', NULL, NULL, 'bajo', 'andino, sin gluten', 'Rica en hierro y calcio'),
('Quinua cruda', 'cereales', '🌾', 368, 14.0, 64.0, 6.0, 7, 50, '¼ taza', NULL, 5, 'bajo', 'andino, sin gluten', NULL),
('Hojuelas de quinua', 'cereales', '🌾', 370, 13.0, 66.0, 6.0, 6, 30, '3 cucharadas', NULL, 5, 'medio', 'andino', NULL),
('Fideos de arroz cocidos', 'cereales', '🍜', 108, 1.8, 24.0, 0.2, 1, 150, '1 taza', 0, 19, 'alto', 'sin gluten', NULL),
('Tortilla de maíz', 'cereales', '🌮', 218, 5.7, 45.0, 2.9, 6, 30, '1 tortilla', 0.9, 45, 'medio', 'sin gluten', NULL),
('Galletas de soda', 'cereales', '🍘', 421, 9.0, 71.0, 11.0, 3, 25, '4 galletas', 2, 950, 'alto', NULL, NULL),
('Hojuelas de maíz (corn flakes)', 'cereales', '🥣', 357, 7.0, 84.0, 0.4, 3, 30, '1 taza', 9, 730, 'alto', NULL, NULL),
('Papa nativa sancochada', 'tuberculos', '🥔', 85, 2.0, 19.0, 0.1, 2, 150, '1 papa mediana', 0.8, 6, 'medio', 'andino', NULL),
('Papa al horno', 'tuberculos', '🥔', 93, 2.5, 21.0, 0.1, 2.2, 150, '1 papa mediana', 1.2, 10, 'alto', NULL, NULL),
('Papas fritas', 'tuberculos', '🍟', 312, 3.4, 41.0, 15.0, 3.8, 100, '1 porción chica', 0.3, 210, 'alto', NULL, NULL),
('Chuño cocido', 'tuberculos', '🥔', 90, 0.5, 22.0, 0.1, 1, 100, '½ taza', NULL, NULL, 'medio', 'andino', NULL),
('Oca', 'tuberculos', '🥔', 61, 1.0, 14.0, 0.1, 1, 100, '3 ocas', NULL, NULL, 'medio', 'andino', NULL),
('Mashua', 'tuberculos', '🥔', 50, 1.5, 9.8, 0.6, 1, 100, '3 mashuas', NULL, NULL, 'bajo', 'andino', NULL),
('Plátano verde sancochado', 'tuberculos', '🍌', 122, 1.3, 32.0, 0.4, 2.3, 150, '1 plátano', 15, 4, 'medio', NULL, NULL),
('Pituca (taro)', 'tuberculos', '🥔', 112, 1.5, 26.0, 0.2, 4, 100, '1 porción', 0.4, 11, 'medio', NULL, NULL),
('Frejol panamito cocido', 'legumbres', '🫘', 127, 8.0, 23.0, 0.5, 6, 150, '¾ taza', 0.3, 2, 'bajo', 'alto en fibra', NULL),
('Lentejas rojas cocidas', 'legumbres', '🫘', 116, 9.0, 20.0, 0.4, 4, 150, '¾ taza', 1.8, 2, 'bajo', 'hierro', NULL),
('Soya en grano cocida', 'legumbres', '🫘', 173, 16.6, 9.9, 9.0, 6, 100, '½ taza', 3, 1, 'bajo', 'vegano, alto en proteína', NULL),
('Frejol chiclayo cocido', 'legumbres', '🫘', 116, 7.7, 21.0, 0.5, 6.5, 150, '¾ taza', 3.3, 4, 'bajo', 'alto en fibra', NULL),
('Hummus', 'legumbres', '🫘', 166, 8.0, 14.0, 9.6, 6, 50, '3 cucharadas', 0.3, 380, 'bajo', 'vegano', NULL),
('Ají amarillo', 'verduras', '🌶️', 35, 1.0, 7.0, 0.4, 2, 20, '½ ají', 4, 5, 'bajo', NULL, NULL),
('Rocoto', 'verduras', '🌶️', 33, 1.5, 6.0, 0.4, 2, 15, '½ rocoto', 4, 5, 'bajo', NULL, NULL),
('Culantro', 'verduras', '🌿', 23, 2.1, 3.7, 0.5, 2.8, 10, '1 puñado', 0.9, 46, 'bajo', NULL, NULL),
('Acelga', 'verduras', '🥬', 19, 1.8, 3.7, 0.2, 1.6, 100, '1 taza cocida', 1.1, 213, 'bajo', NULL, NULL),
('Berenjena', 'verduras', '🍆', 25, 1.0, 6.0, 0.2, 3, 100, '½ berenjena', 3.5, 2, 'bajo', NULL, NULL),
('Nabo', 'verduras', '🥕', 28, 0.9, 6.4, 0.1, 1.8, 100, '1 nabo', 3.8, 67, 'bajo', NULL, NULL),
('Rabanito', 'verduras', '🔴', 16, 0.7, 3.4, 0.1, 1.6, 50, '5 rabanitos', 1.9, 39, 'bajo', NULL, NULL),
('Palmito', 'verduras', '🌴', 28, 2.5, 4.6, 0.6, 2.4, 80, '3 trozos', 0, 420, 'bajo', NULL, NULL),
('Alcachofa', 'verduras', '🌿', 47, 3.3, 10.5, 0.2, 5.4, 100, '1 corazón grande', 1, 94, 'bajo', 'alto en fibra', NULL),
('Choclo (mazorca)', 'verduras', '🌽', 96, 3.4, 21.0, 1.5, 2.4, 150, '1 choclo mediano', 4.5, 15, 'medio', 'andino', NULL),
('Hongos portobello', 'verduras', '🍄', 22, 2.1, 3.9, 0.4, 1.3, 100, '1 hongo grande', 2.5, 9, 'bajo', NULL, NULL),
('Col morada', 'verduras', '🥬', 31, 1.4, 7.4, 0.2, 2.1, 100, '1 taza', 3.8, 27, 'bajo', NULL, NULL),
('Arúgula', 'verduras', '🥬', 25, 2.6, 3.7, 0.7, 1.6, 50, '1 taza', 2, 27, 'bajo', NULL, NULL),
('Camu camu', 'frutas', '🍒', 24, 0.4, 5.9, 0.2, 0.4, 50, '1 puñado', NULL, NULL, 'bajo', 'vitamina C', 'La fruta con más vitamina C'),
('Maracuyá', 'frutas', '🟡', 97, 2.2, 23.0, 0.7, 10, 100, 'pulpa de 2 maracuyás', 11, 28, 'bajo', 'alto en fibra', NULL),
('Tuna', 'frutas', '🌵', 41, 0.7, 9.6, 0.5, 3.6, 100, '1 tuna', NULL, 5, 'bajo', NULL, NULL),
('Pacay', 'frutas', '🫛', 60, 1.0, 15.0, 0.1, 1.2, 100, '1 vaina', NULL, NULL, 'medio', NULL, NULL),
('Guanábana', 'frutas', '🍈', 66, 1.0, 17.0, 0.3, 3.3, 100, '½ taza', 13.5, 14, 'bajo', NULL, NULL),
('Pitahaya', 'frutas', '🐉', 60, 1.2, 13.0, 0.4, 3, 100, '½ pitahaya', 8, 0, 'bajo', NULL, NULL),
('Cocona', 'frutas', '🍅', 41, 0.9, 9.0, 0.7, 2, 100, '2 coconas', NULL, NULL, 'bajo', 'amazónico', NULL),
('Plátano isla', 'frutas', '🍌', 110, 1.2, 28.0, 0.3, 2, 100, '1 plátano', 15, 1, 'medio', NULL, NULL),
('Ciruela', 'frutas', '🍑', 46, 0.7, 11.0, 0.3, 1.4, 100, '2 ciruelas', 9.9, 0, 'bajo', NULL, NULL),
('Durazno', 'frutas', '🍑', 39, 0.9, 9.5, 0.3, 1.5, 150, '1 durazno', 8.4, 0, 'bajo', NULL, NULL),
('Higo', 'frutas', '🟣', 74, 0.8, 19.0, 0.3, 2.9, 80, '2 higos', 16, 1, 'medio', NULL, NULL),
('Pasas', 'frutas', '🍇', 299, 3.0, 79.0, 0.5, 3.7, 30, '1 puñadito', 59, 11, 'alto', NULL, NULL),
('Dátiles', 'frutas', '🌴', 282, 2.5, 75.0, 0.4, 8, 30, '3 dátiles', 63, 2, 'medio', NULL, NULL),
('Limón', 'frutas', '🍋', 29, 1.1, 9.3, 0.3, 2.8, 30, 'jugo de 2 limones', 2.5, 2, 'bajo', NULL, NULL),
('Toronja', 'frutas', '🍊', 42, 0.8, 10.7, 0.1, 1.6, 150, '½ toronja', 7, 0, 'bajo', NULL, NULL),
('Frambuesas', 'frutas', '🍓', 52, 1.2, 12.0, 0.7, 6.5, 100, '1 taza', 4.4, 1, 'bajo', 'alto en fibra', NULL),
('Cerezas', 'frutas', '🍒', 63, 1.1, 16.0, 0.2, 2.1, 100, '1 taza', 12.8, 0, 'bajo', NULL, NULL),
('Mango ciruelo', 'frutas', '🥭', 60, 0.8, 15.0, 0.4, 1.6, 150, '1 mango chico', 13.7, 1, 'medio', NULL, NULL),
('Sacha inchi', 'grasas', '🥜', 600, 27.0, 9.0, 49.0, 6, 20, '1 puñadito', NULL, NULL, 'bajo', 'amazónico, omega 3', 'Una de las mayores fuentes vegetales de omega 3'),
('Semillas de calabaza', 'grasas', '🎃', 559, 30.0, 11.0, 49.0, 6, 15, '1 cucharada colmada', 1.4, 7, 'bajo', 'magnesio', NULL),
('Ajonjolí', 'grasas', '🌰', 573, 18.0, 23.0, 50.0, 12, 10, '1 cucharada', 0.3, 11, 'bajo', 'calcio', NULL),
('Aceite de sacha inchi', 'grasas', '🫒', 884, 0.0, 0.0, 100.0, 0, 5, '1 cucharadita', 0, 0, 'bajo', 'omega 3', NULL),
('Mayonesa light', 'grasas', '🥚', 300, 1.0, 8.0, 30.0, 0, 15, '1 cucharada', 3, 700, 'bajo', NULL, NULL),
('Crema de leche', 'grasas', '🥛', 340, 2.0, 3.0, 36.0, 0, 15, '1 cucharada', 3, 38, 'bajo', NULL, NULL),
('Avellanas', 'grasas', '🌰', 628, 15.0, 17.0, 61.0, 10, 20, '1 puñadito', 4.3, 0, 'bajo', NULL, NULL),
('Marañones (cashews)', 'grasas', '🥜', 553, 18.0, 30.0, 44.0, 3.3, 20, '1 puñadito', 5.9, 12, 'bajo', NULL, NULL),
('Coco rallado', 'grasas', '🥥', 354, 3.3, 15.0, 33.0, 9, 15, '1 cucharada', 6, 20, 'bajo', NULL, NULL),
('Chicha morada sin azúcar', 'bebidas', '🟣', 20, 0.2, 5.0, 0.0, 0.2, 250, '1 vaso', 4, 2, 'bajo', 'antioxidante', NULL),
('Chicha morada con azúcar', 'bebidas', '🟣', 60, 0.2, 15.0, 0.0, 0.2, 250, '1 vaso', 14, 2, 'medio', NULL, NULL),
('Emoliente', 'bebidas', '🍵', 35, 0.2, 9.0, 0.0, 0.5, 250, '1 vaso', 8, 3, 'medio', NULL, NULL),
('Agua de coco', 'bebidas', '🥥', 19, 0.7, 3.7, 0.2, 1.1, 250, '1 vaso', 2.6, 105, 'bajo', 'hidratante', NULL),
('Té verde', 'bebidas', '🍵', 1, 0.0, 0.2, 0.0, 0, 250, '1 taza', 0, 1, 'bajo', NULL, NULL),
('Infusión de manzanilla', 'bebidas', '🍵', 1, 0.0, 0.2, 0.0, 0, 250, '1 taza', 0, 1, 'bajo', NULL, NULL),
('Mate de coca', 'bebidas', '🍵', 1, 0.0, 0.2, 0.0, 0, 250, '1 taza', 0, 1, 'bajo', 'andino', NULL),
('Gaseosa', 'bebidas', '🥤', 42, 0.0, 10.6, 0.0, 0, 355, '1 lata', 10.6, 10, 'alto', NULL, 'Solo azúcar: mejor evitar'),
('Cerveza', 'bebidas', '🍺', 43, 0.5, 3.6, 0.0, 0, 330, '1 lata', 0, 4, 'alto', 'alcohol', NULL),
('Batido de frutas con leche', 'bebidas', '🥤', 75, 3.0, 13.0, 1.5, 1, 300, '1 vaso', 11, 40, 'medio', NULL, NULL),
('Proteína vegana', 'suplementos', '🌱', 380, 75.0, 8.0, 6.0, 3, 30, '1 scoop', 2, 600, 'bajo', 'vegano', NULL),
('Caseína', 'suplementos', '🥛', 360, 80.0, 6.0, 1.5, 0, 30, '1 scoop', 3, 300, 'bajo', NULL, 'Proteína de absorción lenta (antes de dormir)'),
('Ganador de peso (gainer)', 'suplementos', '🥤', 380, 15.0, 75.0, 3.0, 2, 100, '1 porción', 20, 250, 'alto', NULL, NULL),
('Barra de proteína', 'suplementos', '🍫', 350, 30.0, 35.0, 10.0, 5, 60, '1 barra', 8, 300, 'medio', NULL, NULL),
('Colágeno hidrolizado', 'suplementos', '💊', 360, 90.0, 0.0, 0.0, 0, 10, '1 cucharada', 0, 200, 'bajo', NULL, NULL),
('Maca en polvo', 'suplementos', '🟤', 325, 14.0, 71.0, 3.5, 7, 10, '1 cucharada', NULL, NULL, 'medio', 'andino', NULL),
('Ceviche de pescado', 'platos', '🐟', 95, 15.0, 6.0, 1.2, 1, 250, '1 plato', 2, 420, 'bajo', 'peruano', NULL),
('Causa limeña de pollo', 'platos', '🥔', 165, 7.0, 20.0, 6.5, 2, 200, '1 porción', 1, 320, 'medio', 'peruano', NULL),
('Lomo saltado', 'platos', '🥩', 150, 10.0, 12.0, 7.0, 1.5, 300, '1 plato sin arroz', 2, 520, 'medio', 'peruano', NULL),
('Ají de gallina', 'platos', '🍲', 175, 11.0, 9.0, 10.5, 0.8, 250, '1 plato sin arroz', 2, 410, 'medio', 'peruano', NULL),
('Arroz con pollo', 'platos', '🍗', 160, 8.0, 22.0, 4.0, 1.5, 300, '1 plato', 1, 380, 'medio', 'peruano', NULL),
('Seco de res con frejoles', 'platos', '🥘', 155, 11.0, 15.0, 5.5, 4, 300, '1 plato', 1, 400, 'bajo', 'peruano', NULL),
('Tallarines verdes', 'platos', '🍝', 180, 6.0, 25.0, 6.5, 2, 300, '1 plato', 1.5, 350, 'medio', 'peruano', NULL),
('Papa a la huancaína', 'platos', '🥔', 155, 4.0, 16.0, 8.5, 1.5, 200, '1 porción', 1, 380, 'medio', 'peruano', NULL),
('Arroz chaufa', 'platos', '🍚', 175, 6.0, 24.0, 6.0, 1, 250, '1 plato', 1, 520, 'alto', 'peruano', NULL),
('Caldo de pollo', 'platos', '🍲', 45, 4.0, 4.0, 1.3, 0.5, 400, '1 plato', 0.5, 350, 'bajo', NULL, NULL),
('Menestrón', 'platos', '🍲', 70, 3.5, 10.0, 1.5, 2.5, 400, '1 plato', 1.5, 300, 'bajo', 'peruano', NULL),
('Tamal', 'platos', '🫔', 210, 6.0, 24.0, 10.0, 2, 150, '1 tamal', 1, 450, 'medio', 'peruano', NULL),
('Quinua con verduras', 'platos', '🥗', 120, 4.5, 18.0, 3.5, 2.5, 250, '1 plato', 2, 220, 'bajo', 'andino', NULL),
('Salchipapa', 'platos', '🍟', 290, 8.0, 28.0, 16.0, 2.5, 300, '1 porción', 1, 700, 'alto', NULL, 'Comida rápida: ocasional'),
('Hamburguesa de res', 'platos', '🍔', 254, 13.0, 24.0, 12.0, 1.5, 200, '1 hamburguesa', 5, 500, 'medio', NULL, NULL),
('Pizza', 'platos', '🍕', 266, 11.0, 33.0, 10.0, 2.3, 120, '1 tajada', 3.6, 600, 'alto', NULL, NULL),
('Pollo broaster', 'platos', '🍗', 270, 22.0, 10.0, 16.0, 0.4, 150, '1 presa', 0, 560, 'medio', NULL, 'Frito: ocasional'),
('Pan con palta', 'platos', '🥑', 210, 5.0, 28.0, 9.0, 5, 120, '1 pan', 1, 300, 'medio', NULL, NULL),
('Sánguche de pollo', 'platos', '🥪', 220, 13.0, 25.0, 7.0, 1.5, 180, '1 sánguche', 2, 450, 'medio', NULL, NULL),
('Mermelada light', 'otros', '🍓', 120, 0.3, 30.0, 0.0, 1, 15, '1 cucharada', 25, 20, 'medio', NULL, NULL),
('Stevia', 'otros', '🌿', 0, 0.0, 0.0, 0.0, 0, 1, '1 sobre', 0, 0, 'bajo', 'sin calorías', NULL),
('Panela', 'otros', '🟫', 380, 0.4, 95.0, 0.1, 0, 10, '1 cucharada', 90, 30, 'alto', NULL, NULL),
('Chocolate de leche', 'otros', '🍫', 535, 7.7, 59.0, 30.0, 3.4, 25, '½ barra', 52, 79, 'medio', NULL, NULL),
('Helado de crema', 'otros', '🍦', 207, 3.5, 24.0, 11.0, 0.7, 70, '1 bola', 21, 80, 'medio', NULL, NULL),
('Galletas de chocolate', 'otros', '🍪', 480, 5.0, 65.0, 22.0, 2.5, 30, '3 galletas', 35, 350, 'alto', NULL, NULL);
