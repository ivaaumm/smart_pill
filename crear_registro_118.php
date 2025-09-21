<?php
include 'smart_pill_api/conexion.php';

echo "=== Creando registro para programación 118 ===\n";

// Crear registro pendiente para programación 118
$sql = "INSERT INTO registro_tomas (usuario_id, programacion_id, estado, fecha_programada, hora_programada, observaciones) 
        VALUES (1, 118, 'pendiente', CURDATE(), '23:30:00', 'Registro creado para test')";

if($conn->query($sql)) {
    $registro_id = $conn->insert_id;
    echo "✅ Registro creado exitosamente:\n";
    echo "- registro_id: $registro_id\n";
    echo "- programacion_id: 118\n";
    echo "- usuario_id: 1\n";
    echo "- estado: pendiente\n";
    echo "- fecha: " . date('Y-m-d') . "\n";
    echo "- hora: 23:30:00\n";
} else {
    echo "❌ Error creando registro: " . $conn->error . "\n";
}

// Verificar que se creó correctamente
echo "\n=== Verificando registro creado ===\n";
$sql_verify = "SELECT * FROM registro_tomas WHERE programacion_id = 118 AND usuario_id = 1 ORDER BY registro_id DESC LIMIT 1";
$result = $conn->query($sql_verify);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "✅ Registro verificado:\n";
    echo "- registro_id: " . $row['registro_id'] . "\n";
    echo "- estado: " . $row['estado'] . "\n";
    echo "- fecha_programada: " . $row['fecha_programada'] . "\n";
    echo "- hora_programada: " . $row['hora_programada'] . "\n";
} else {
    echo "❌ No se pudo verificar el registro\n";
}

$conn->close();
?>