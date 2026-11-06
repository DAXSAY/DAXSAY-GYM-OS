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

