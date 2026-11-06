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
