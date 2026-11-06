-- =====================================================================
-- RADICAL GYM - Actualización 17: NUTRICIÓN AMPLIADA
-- * Nueva categoría "platos" (platos preparados: ceviche, lomo saltado, causa…).
-- * Campos nuevos en alimentos: azúcares, sodio, índice glucémico, etiquetas y notas.
-- * 129 alimentos nuevos: andinos y amazónicos (cañihua, oca, sacha inchi,
--   camu camu…), pescados y mariscos, más frutas, verduras, bebidas,
--   suplementos y platos peruanos.
-- Se puede ejecutar varias veces; no borra datos ni pisa alimentos editados.
-- =====================================================================
SET NAMES utf8mb4;
USE gestion_radicalgym;

ALTER TABLE alimentos MODIFY categoria ENUM('proteinas','lacteos','cereales','tuberculos','legumbres','verduras','frutas','grasas','bebidas','suplementos','platos','otros') NOT NULL DEFAULT 'otros';

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'alimentos' AND column_name = 'azucares_100g');
SET @sql := IF(@falta, 'ALTER TABLE alimentos ADD COLUMN azucares_100g DECIMAL(5,1) NULL COMMENT ''Azúcares por 100 g'' AFTER fibra_100g', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'alimentos' AND column_name = 'sodio_mg_100g');
SET @sql := IF(@falta, 'ALTER TABLE alimentos ADD COLUMN sodio_mg_100g DECIMAL(7,1) NULL COMMENT ''Sodio (mg) por 100 g'' AFTER azucares_100g', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'alimentos' AND column_name = 'indice_glucemico');
SET @sql := IF(@falta, 'ALTER TABLE alimentos ADD COLUMN indice_glucemico ENUM(''bajo'',''medio'',''alto'') NULL AFTER sodio_mg_100g', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'alimentos' AND column_name = 'etiquetas');
SET @sql := IF(@falta, 'ALTER TABLE alimentos ADD COLUMN etiquetas VARCHAR(120) NULL COMMENT ''Ej. andino, vegano, sin gluten, omega 3'' AFTER indice_glucemico', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'alimentos' AND column_name = 'notas');
SET @sql := IF(@falta, 'ALTER TABLE alimentos ADD COLUMN notas VARCHAR(200) NULL COMMENT ''Dato útil para el alumno'' AFTER etiquetas', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

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

SELECT 'Actualizacion 17 aplicada' AS resultado,
       (SELECT COUNT(*) FROM alimentos) AS alimentos,
       (SELECT COUNT(*) FROM alimentos WHERE categoria = 'platos') AS platos;
