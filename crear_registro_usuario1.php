<?php
include 'smart_pill_api/conexion.php';

echo "=== Creando registros para usuario_id = 1 ===\n";

// Primero verificar si hay programaciones y horarios existentes
echo "Verificando programaciones existentes...\n";
$result = $conn->query('SELECT programacion_id FROM programacion_tratamientos WHERE usuario_id = 1 LIMIT 1');
if ($result && $result->num_rows > 0) {
    $programacion = $result->fetch_assoc();
    $programacion_id = $programacion['programacion_id'];
    echo "✅ Programación encontrada: $programacion_id\n";
    
    // Buscar horarios para esta programación
    $result_horario = $conn->query("SELECT horario_id FROM horarios_tratamiento WHERE programacion_id = $programacion_id LIMIT 1");
    if ($result_horario && $result_horario->num_rows > 0) {
        $horario = $result_horario->fetch_assoc();
        $horario_id = $horario['horario_id'];
        echo "✅ Horario encontrado: $horario_id\n";
        
        // Buscar remedio_global_id
        $result_remedio = $conn->query("SELECT remedio_global_id FROM programacion_tratamientos WHERE programacion_id = $programacion_id LIMIT 1");
        if ($result_remedio && $result_remedio->num_rows > 0) {
            $remedio = $result_remedio->fetch_assoc();
            $remedio_global_id = $remedio['remedio_global_id'];
            echo "✅ Remedio encontrado: $remedio_global_id\n";
            
            // Crear registro pendiente
            $sql = "INSERT INTO registro_tomas (usuario_id, horario_id, remedio_global_id, programacion_id, fecha_programada, hora_programada, estado, observaciones) 
                    VALUES (1, $horario_id, $remedio_global_id, $programacion_id, CURDATE(), '23:30:00', 'pendiente', 'Registro creado para test')";
            
            if($conn->query($sql)) {
                $registro_id = $conn->insert_id;
                echo "✅ Registro creado exitosamente:\n";
                echo "- registro_id: $registro_id\n";
                echo "- programacion_id: $programacion_id\n";
                echo "- horario_id: $horario_id\n";
                echo "- remedio_global_id: $remedio_global_id\n";
                echo "- usuario_id: 1\n";
                echo "- estado: pendiente\n";
            } else {
                echo "❌ Error creando registro: " . $conn->error . "\n";
            }
        } else {
            echo "❌ No se encontró remedio_global_id para la programación\n";
        }
    } else {
        echo "❌ No se encontraron horarios para la programación $programacion_id\n";
    }
} else {
    echo "❌ No se encontraron programaciones para usuario_id = 1\n";
    echo "Verificando si existen programaciones para otros usuarios...\n";
    
    $result_all = $conn->query('SELECT programacion_id, usuario_id FROM programacion_tratamientos LIMIT 5');
    if ($result_all && $result_all->num_rows > 0) {
        echo "Programaciones existentes:\n";
        while($row = $result_all->fetch_assoc()) {
            echo "- programacion_id: " . $row['programacion_id'] . " | usuario_id: " . $row['usuario_id'] . "\n";
        }
    }
}

$conn->close();
?>