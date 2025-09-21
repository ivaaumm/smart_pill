<?php
include 'smart_pill_api/conexion.php';

echo "=== Creando registro pendiente para Albendazol (programacion_id: 118) ===\n";

// Obtener datos de la programación 118
$result = $conn->query("SELECT * FROM programacion_tratamientos WHERE programacion_id = 118 AND usuario_id = 1");
if ($result->num_rows == 0) {
    echo "❌ Error: No se encontró la programación 118 para usuario_id = 1\n";
    exit;
}

$programacion = $result->fetch_assoc();
echo "✅ Programación encontrada: " . $programacion['nombre_tratamiento'] . "\n";
echo "- Remedio Global ID: " . $programacion['remedio_global_id'] . "\n";
echo "- Dosis por toma: " . $programacion['dosis_por_toma'] . "\n";

// Buscar un horario de tratamiento que corresponda a esta programación
// Necesitamos encontrar horarios que tengan el mismo remedio_global_id
$result = $conn->query("SELECT ht.* FROM horarios_tratamiento ht 
                       JOIN tratamientos t ON ht.tratamiento_id = t.tratamiento_id 
                       WHERE EXISTS (
                           SELECT 1 FROM programacion_tratamientos pt 
                           WHERE pt.programacion_id = 118 
                           AND pt.remedio_global_id = " . $programacion['remedio_global_id'] . "
                       ) LIMIT 1");

if ($result->num_rows == 0) {
    echo "❌ No se encontró horario específico, usando horario genérico...\n";
    // Usar cualquier horario disponible
    $result = $conn->query("SELECT * FROM horarios_tratamiento LIMIT 1");
}

if ($result->num_rows == 0) {
    echo "❌ Error: No se encontró ningún horario de tratamiento\n";
    exit;
}

$horario = $result->fetch_assoc();
echo "✅ Horario encontrado: ID " . $horario['horario_id'] . " - " . $horario['hora'] . "\n";

// Crear el registro pendiente con los campos correctos
$fecha_actual = date('Y-m-d');

$sql = "INSERT INTO registro_tomas (
    usuario_id, 
    programacion_id, 
    horario_id, 
    remedio_global_id, 
    fecha_programada, 
    hora_programada, 
    estado, 
    dosis_programada,
    observaciones,
    es_cambio_estado,
    fecha_creacion
) VALUES (
    1, 
    118, 
    " . $horario['horario_id'] . ", 
    " . $programacion['remedio_global_id'] . ", 
    '$fecha_actual', 
    '" . $horario['hora'] . "', 
    'pendiente', 
    '" . $programacion['dosis_por_toma'] . "',
    'Registro creado para test Albendazol',
    0,
    NOW()
)";

if ($conn->query($sql) === TRUE) {
    $registro_id = $conn->insert_id;
    echo "✅ Registro creado exitosamente!\n";
    echo "- Registro ID: $registro_id\n";
    echo "- Usuario ID: 1\n";
    echo "- Programación ID: 118 (Albendazol)\n";
    echo "- Horario ID: " . $horario['horario_id'] . "\n";
    echo "- Remedio Global ID: " . $programacion['remedio_global_id'] . "\n";
    echo "- Estado: pendiente\n";
    echo "- Dosis programada: " . $programacion['dosis_por_toma'] . "\n";
    
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
        echo "Remedio Global ID: " . $registro['remedio_global_id'] . "\n";
    }
} else {
    echo "❌ Error al crear el registro: " . $conn->error . "\n";
}

$conn->close();
?>