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

