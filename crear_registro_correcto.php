<?php
include 'smart_pill_api/conexion.php';

echo "=== Creando registro correcto para usuario_id = 1 ===\n";

// Usar programacion_id = 117 que existe para usuario_id = 1
$programacion_id = 117;
$usuario_id = 1;

// Buscar horario para esta programación usando tratamiento_id
$result_horario = $conn->query("SELECT horario_id, remedio_global_id FROM horarios_tratamiento WHERE tratamiento_id = $programacion_id AND usuario_id = $usuario_id LIMIT 1");

if ($result_horario && $result_horario->num_rows > 0) {
    $horario = $result_horario->fetch_assoc();
    $horario_id = $horario['horario_id'];
    $remedio_global_id = $horario['remedio_global_id'];
    
    echo "✅ Datos encontrados:\n";
    echo "- programacion_id: $programacion_id\n";
    echo "- horario_id: $horario_id\n";
    echo "- remedio_global_id: $remedio_global_id\n";
    echo "- usuario_id: $usuario_id\n";
    
    // Crear registro pendiente
    $sql = "INSERT INTO registro_tomas (usuario_id, horario_id, remedio_global_id, programacion_id, fecha_programada, hora_programada, estado, observaciones) 
            VALUES ($usuario_id, $horario_id, $remedio_global_id, $programacion_id, CURDATE(), '23:30:00', 'pendiente', 'Registro creado para test')";
    
    if($conn->query($sql)) {
        $registro_id = $conn->insert_id;
        echo "✅ Registro creado exitosamente:\n";
        echo "- registro_id: $registro_id\n";
        
        // Verificar que se creó correctamente
        $sql_verify = "SELECT * FROM registro_tomas WHERE registro_id = $registro_id";
        $result = $conn->query($sql_verify);
        
        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo "✅ Registro verificado:\n";
            echo "- registro_id: " . $row['registro_id'] . "\n";
            echo "- programacion_id: " . $row['programacion_id'] . "\n";
            echo "- estado: " . $row['estado'] . "\n";
            echo "- fecha_programada: " . $row['fecha_programada'] . "\n";
            echo "- hora_programada: " . $row['hora_programada'] . "\n";
        }
    } else {
        echo "❌ Error creando registro: " . $conn->error . "\n";
    }
} else {
    echo "❌ No se encontraron horarios para programacion_id $programacion_id y usuario_id $usuario_id\n";
    
    // Mostrar horarios disponibles
    echo "\nHorarios disponibles para usuario_id = 1:\n";
    $result_all = $conn->query("SELECT horario_id, tratamiento_id, remedio_global_id FROM horarios_tratamiento WHERE usuario_id = 1 LIMIT 5");
    if ($result_all && $result_all->num_rows > 0) {
        while($row = $result_all->fetch_assoc()) {
            echo "- horario_id: " . $row['horario_id'] . " | tratamiento_id: " . $row['tratamiento_id'] . " | remedio_global_id: " . $row['remedio_global_id'] . "\n";
        }
    }
}

$conn->close();
?>