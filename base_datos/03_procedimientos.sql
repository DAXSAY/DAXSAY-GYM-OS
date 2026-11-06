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
