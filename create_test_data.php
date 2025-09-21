<?php
include 'smart_pill_api/conexion.php';

echo "=== CREANDO DATOS DE PRUEBA ===\n";

try {
    $conn->begin_transaction();
    
    // 1. Crear una programación de tratamiento (incluyendo remedio_global_id que es requerido)
    $sql_programacion = "INSERT INTO programacion_tratamientos 
                        (usuario_id, remedio_global_id, nombre_tratamiento, fecha_inicio, fecha_fin, dosis_por_toma, estado, tiene_alarmas) 
                        VALUES (2, 1, 'Tratamiento de Prueba', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), '1 pastilla', 'activo', 1)";
    
    if ($conn->query($sql_programacion)) {
        $programacion_id = $conn->insert_id;
        echo "✅ Programación creada con ID: $programacion_id\n";
        
        // 2. Crear un horario de tratamiento
        $sql_horario = "INSERT INTO horarios_tratamiento 
                       (tratamiento_id, usuario_id, remedio_global_id, dia_semana, hora, dosis, activo) 
                       VALUES ($programacion_id, 2, 1, 'lunes', '10:00:00', '1 pastilla', 1)";
        
        if ($conn->query($sql_horario)) {
            $horario_id = $conn->insert_id;
            echo "✅ Horario creado con ID: $horario_id\n";
            
            // 3. Crear un registro de toma pendiente
            $sql_registro = "INSERT INTO registro_tomas 
                           (usuario_id, horario_id, remedio_global_id, programacion_id, fecha_programada, hora_programada, estado, dosis_programada, es_cambio_estado) 
                           VALUES (2, $horario_id, 1, $programacion_id, CURDATE(), '10:00:00', 'pendiente', '1 pastilla', 0)";
            
            if ($conn->query($sql_registro)) {
                $registro_id = $conn->insert_id;
                echo "✅ Registro de toma creado con ID: $registro_id\n";
                
                $conn->commit();
                echo "\n=== DATOS DE PRUEBA CREADOS EXITOSAMENTE ===\n";
                echo "Usuario ID: 2\n";
                echo "Programación ID: $programacion_id\n";
                echo "Horario ID: $horario_id\n";
                echo "Registro ID: $registro_id\n";
                
            } else {
                throw new Exception("Error al crear registro: " . $conn->error);
            }
        } else {
            throw new Exception("Error al crear horario: " . $conn->error);
        }
    } else {
        throw new Exception("Error al crear programación: " . $conn->error);
    }
    
} catch (Exception $e) {
    $conn->rollback();
    echo "❌ Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>