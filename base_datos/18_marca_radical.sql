-- =====================================================================
-- RADICAL - Actualización 18: NOMBRE DE LA MARCA
-- * El nombre del gimnasio pasa a "RADICAL" (se usa en los mensajes de
--   WhatsApp, reportes y tickets). Solo cambia si todavía decía
--   "Radical Gym"; si ya pusiste otro nombre, se respeta.
-- * Mensajes predeterminados, reglas de aviso y el usuario administrador de ejemplo: "Radical Gym" → "RADICAL".
-- Se puede ejecutar varias veces; no borra datos.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

UPDATE configuracion SET valor = 'RADICAL'
 WHERE clave = 'gym_nombre' AND valor IN ('Radical Gym', 'RADICAL GYM', 'Radical GYM');

UPDATE plantillas_mensajes SET mensaje = REPLACE(mensaje, 'Radical Gym', 'RADICAL')
 WHERE mensaje LIKE '%Radical Gym%';

UPDATE reglas_notificacion SET cuerpo_plantilla = REPLACE(cuerpo_plantilla, 'Radical Gym', 'RADICAL'),
       titulo_plantilla = REPLACE(titulo_plantilla, 'Radical Gym', 'RADICAL')
 WHERE cuerpo_plantilla LIKE '%Radical Gym%' OR titulo_plantilla LIKE '%Radical Gym%';

-- Las reglas de aviso que muestra el sistema (registros guardados por la app)
UPDATE registros_app SET datos = REPLACE(REPLACE(datos, 'Radical Gym', 'RADICAL'), 'RADICAL GYM', 'RADICAL')
 WHERE modulo IN ('reglas_notificacion', 'notificaciones', 'rutinas') AND (datos LIKE '%Radical Gym%' OR datos LIKE '%RADICAL GYM%');

UPDATE rutinas SET descripcion = REPLACE(descripcion, 'Radical Gym', 'RADICAL') WHERE descripcion LIKE '%Radical Gym%';

-- Usuario administrador de ejemplo (si nadie le cambió el apellido)
UPDATE empleados SET apellidos = 'RADICAL' WHERE nombres = 'Administrador' AND apellidos = 'Radical Gym';

SELECT clave, valor FROM configuracion WHERE clave = 'gym_nombre';
