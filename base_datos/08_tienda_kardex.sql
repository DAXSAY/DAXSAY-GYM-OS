-- =====================================================================
-- RADICAL GYM - ACTUALIZACIÓN 08 (30-oct-2026)
-- Tienda: ventas reales, stock seguro, tickets correlativos, anulaciones
-- y kárdex (historial de entradas y salidas de cada producto).
-- Para una base YA INSTALADA: NO borra datos. Se puede repetir.
--
--  * Cada venta queda en `ventas` + `venta_detalle`; la base descuenta el
--    stock bloqueando el producto (dos ventas a la vez no se pisan) y
--    registra el ingreso en caja dentro del turno abierto.
--  * `movimientos_inventario`: entradas de mercadería, ventas, anulaciones,
--    ajustes y mermas con el stock resultante.
--  * Los productos que ya existían reciben su movimiento "inicial".
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

CREATE TABLE IF NOT EXISTS movimientos_inventario (
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
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ventas' AND column_name = 'cliente');
SET @sql := IF(@falta, 'ALTER TABLE ventas ADD COLUMN cliente VARCHAR(120) NULL COMMENT ''Nombre del cliente si no es alumno''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ventas' AND column_name = 'idusuario');
SET @sql := IF(@falta, 'ALTER TABLE ventas ADD COLUMN idusuario INT NULL COMMENT ''Usuario que cobró''', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ventas' AND column_name = 'motivo_anulacion');
SET @sql := IF(@falta, 'ALTER TABLE ventas ADD COLUMN motivo_anulacion VARCHAR(200) NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ventas' AND column_name = 'fecha_anulacion');
SET @sql := IF(@falta, 'ALTER TABLE ventas ADD COLUMN fecha_anulacion DATETIME NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ventas' AND column_name = 'anulada_por');
SET @sql := IF(@falta, 'ALTER TABLE ventas ADD COLUMN anulada_por INT NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
ALTER TABLE productos MODIFY imagen MEDIUMTEXT NULL COMMENT 'URL o imagen subida';
ALTER TABLE ventas MODIFY idempleado INT NULL COMMENT 'Trabajador que registró la venta';

-- Stock inicial en el kárdex de los productos que aún no tienen movimientos
INSERT INTO movimientos_inventario (idproducto, tipo, cantidad, stock_resultante, motivo)
SELECT p.idproducto, 'inicial', p.stock, p.stock, 'Stock al activar el kárdex'
  FROM productos p
 WHERE NOT EXISTS (SELECT 1 FROM movimientos_inventario m WHERE m.idproducto = p.idproducto);

SELECT 'Actualizacion 08 aplicada' AS resultado,
       (SELECT COUNT(*) FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'movimientos_inventario') AS tabla_kardex,
       (SELECT COUNT(*) FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = 'ventas' AND column_name IN ('cliente','idusuario','motivo_anulacion')) AS columnas_ventas;
