-- Script para eliminar el estado 'pendiente' de la tabla registro_tomas
-- Este script debe ejecutarse después de asegurar que no hay registros con estado 'pendiente'

-- Paso 1: Verificar que no existen registros con estado 'pendiente'
SELECT COUNT(*) as registros_pendientes FROM registro_tomas WHERE estado = 'pendiente';

-- Paso 2: Si existen registros pendientes, eliminarlos (ya que no deben existir según los nuevos requerimientos)
DELETE FROM registro_tomas WHERE estado = 'pendiente';

-- Paso 3: Modificar el enum para eliminar 'pendiente' y mantener solo los estados válidos
ALTER TABLE registro_tomas 
MODIFY COLUMN estado enum('tomada','pospuesta','omitida') NOT NULL;

-- Paso 4: Modificar el enum del estado_anterior también
ALTER TABLE registro_tomas 
MODIFY COLUMN estado_anterior enum('tomada','pospuesta','omitida') DEFAULT NULL;

-- Paso 5: Verificar los cambios
DESCRIBE registro_tomas;

-- Paso 6: Mostrar estadísticas finales
SELECT 
    estado, 
    COUNT(*) as total 
FROM registro_tomas 
GROUP BY estado;