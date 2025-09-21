<?php
include 'smart_pill_api/conexion.php';

echo "=== Estructura de la tabla registro_tomas ===\n";
$result = $conn->query('DESCRIBE registro_tomas');
while($row = $result->fetch_assoc()) {
    echo "Campo: " . $row['Field'] . " | Tipo: " . $row['Type'] . " | Null: " . $row['Null'] . " | Key: " . $row['Key'] . " | Default: " . $row['Default'] . "\n";
}

echo "\n=== Verificando programaciones existentes ===\n";
$result = $conn->query('SELECT programacion_id FROM programaciones_medicamentos WHERE usuario_id = 1 LIMIT 5');
if ($result && $result->num_rows > 0) {
    echo "Programaciones encontradas para usuario_id = 1:\n";
    while($row = $result->fetch_assoc()) {
        echo "- programacion_id: " . $row['programacion_id'] . "\n";
    }
} else {
    echo "No se encontraron programaciones para usuario_id = 1\n";
}

echo "\n=== Verificando horarios de tratamiento ===\n";
$result = $conn->query('SELECT horario_id, programacion_id FROM horarios_tratamiento WHERE programacion_id IN (SELECT programacion_id FROM programaciones_medicamentos WHERE usuario_id = 1) LIMIT 5');
if ($result && $result->num_rows > 0) {
    echo "Horarios encontrados:\n";
    while($row = $result->fetch_assoc()) {
        echo "- horario_id: " . $row['horario_id'] . " | programacion_id: " . $row['programacion_id'] . "\n";
    }
} else {
    echo "No se encontraron horarios para las programaciones del usuario\n";
}

$conn->close();
?>