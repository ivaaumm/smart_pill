<?php
include 'smart_pill_api/conexion.php';

echo "=== ESTRUCTURA DE HORARIOS_TRATAMIENTO ===\n";
$result = $conn->query('DESCRIBE horarios_tratamiento');
while($row = $result->fetch_assoc()) {
    echo "  " . $row['Field'] . " - " . $row['Type'] . "\n";
}

echo "\n=== DATOS DE EJEMPLO ===\n";
$result = $conn->query('SELECT * FROM horarios_tratamiento LIMIT 3');
while($row = $result->fetch_assoc()) {
    print_r($row);
}

echo "\n=== ESTRUCTURA DE PROGRAMACION_TRATAMIENTOS ===\n";
$result = $conn->query('DESCRIBE programacion_tratamientos');
while($row = $result->fetch_assoc()) {
    echo "  " . $row['Field'] . " - " . $row['Type'] . "\n";
}

echo "\n=== DATOS DE EJEMPLO PROGRAMACION ===\n";
$result = $conn->query('SELECT * FROM programacion_tratamientos LIMIT 3');
while($row = $result->fetch_assoc()) {
    print_r($row);
}

$conn->close();
?>