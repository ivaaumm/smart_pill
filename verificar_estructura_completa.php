<?php
include 'smart_pill_api/conexion.php';

echo "=== Estructura tabla programacion_tratamientos ===\n";
$result = $conn->query('DESCRIBE programacion_tratamientos');
while($row = $result->fetch_assoc()) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}

echo "\n=== Estructura tabla tratamientos ===\n";
$result = $conn->query('DESCRIBE tratamientos');
while($row = $result->fetch_assoc()) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}

echo "\n=== Estructura tabla registro_tomas ===\n";
$result = $conn->query('DESCRIBE registro_tomas');
while($row = $result->fetch_assoc()) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}

echo "\n=== Datos de programación 118 ===\n";
$result = $conn->query("SELECT * FROM programacion_tratamientos WHERE programacion_id = 118");
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    foreach($row as $key => $value) {
        echo "- $key: $value\n";
    }
} else {
    echo "No se encontró programación 118\n";
}

echo "\n=== Verificando qué campos necesita registro_tomas ===\n";
$result = $conn->query("SELECT * FROM registro_tomas WHERE programacion_id = 117 LIMIT 1");
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "Ejemplo de registro existente (programación 117):\n";
    foreach($row as $key => $value) {
        echo "- $key: $value\n";
    }
}

$conn->close();
?>