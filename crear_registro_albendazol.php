<?php
include 'smart_pill_api/conexion.php';

echo "=== Creando registro pendiente para Albendazol (programacion_id: 118) ===\n";

// Primero verificar que existe la programación
$result = $conn->query("SELECT * FROM programacion_tratamientos WHERE programacion_id = 118 AND usuario_id = 1");
if ($result->num_rows == 0) {
    echo "❌ Error: No se encontró la programación 118 para usuario_id = 1\n";
    exit;
}

$programacion = $result->fetch_assoc();
echo "✅ Programación encontrada: " . $programacion['nombre_tratamiento'] . "\n";

// Buscar un horario de tratamiento para esta programación
$result = $conn->query("SELECT * FROM horarios_tratamiento WHERE tratamiento_id = (SELECT tratamiento_id FROM programacion_tratamientos WHERE programacion_id = 118) LIMIT 1");

if ($result->num_rows == 0) {
    echo "❌ Error: No se encontró horario de tratamiento para esta programación\n";
    exit;
}

$horario = $result->fetch_assoc();
echo "✅ Horario encontrado: ID " . $horario['horario_id'] . " - " . $horario['hora'] . "\n";

// Obtener remedio_global_id
$result = $conn->query("SELECT remedio_global_id FROM tratamientos WHERE tratamiento_id = " . $horario['tratamiento_id']);
if ($result->num_rows == 0) {
    echo "❌ Error: No se encontró remedio_global_id\n";
    exit;
}

$tratamiento = $result->fetch_assoc();
echo "✅ Remedio global ID: " . $tratamiento['remedio_global_id'] . "\n";

// Crear el registro pendiente
$fecha_actual = date('Y-m-d');
$hora_actual = date('H:i:s');

$sql = "INSERT INTO registro_tomas (
    usuario_id, 
    programacion_id, 
    horario_id, 
    remedio_global_id, 
    fecha_programada, 
    hora_programada, 
    estado, 
    fecha_creacion
) VALUES (
    1, 
    118, 
    " . $horario['horario_id'] . ", 
    " . $tratamiento['remedio_global_id'] . ", 
    '$fecha_actual', 
    '" . $horario['hora'] . "', 
    'pendiente', 
    NOW()
)";

if ($conn->query($sql) === TRUE) {
    $registro_id = $conn->insert_id;
    echo "✅ Registro creado exitosamente!\n";
    echo "- Registro ID: $registro_id\n";
    echo "- Usuario ID: 1\n";
    echo "- Programación ID: 118\n";
    echo "- Horario ID: " . $horario['horario_id'] . "\n";
    echo "- Remedio Global ID: " . $tratamiento['remedio_global_id'] . "\n";
    echo "- Estado: pendiente\n";
    
    // Verificar que se creó correctamente
    $result = $conn->query("SELECT * FROM registro_tomas WHERE registro_id = $registro_id");
    if ($result->num_rows > 0) {
        $registro = $result->fetch_assoc();
        echo "\n=== Verificación del registro creado ===\n";
        echo "Registro ID: " . $registro['registro_id'] . "\n";
        echo "Usuario ID: " . $registro['usuario_id'] . "\n";
        echo "Programación ID: " . $registro['programacion_id'] . "\n";
        echo "Estado: " . $registro['estado'] . "\n";
        echo "Fecha programada: " . $registro['fecha_programada'] . "\n";
        echo "Hora programada: " . $registro['hora_programada'] . "\n";
    }
} else {
    echo "❌ Error al crear el registro: " . $conn->error . "\n";
}

$conn->close();
?>