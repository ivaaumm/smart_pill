<?php
include 'smart_pill_api/conexion.php';

echo "=== ESTRUCTURA DE LA BASE DE DATOS ===\n\n";

// Verificar estructura de remedio_global
echo "Tabla: remedio_global\n";
$result = $conn->query('DESCRIBE remedio_global');
while($row = $result->fetch_assoc()) {
    echo "  " . $row['Field'] . " - " . $row['Type'] . "\n";
}

echo "\nTabla: registro_tomas\n";
$result = $conn->query('DESCRIBE registro_tomas');
while($row = $result->fetch_assoc()) {
    echo "  " . $row['Field'] . " - " . $row['Type'] . "\n";
}

echo "\nTabla: horario_tratamiento\n";
$result = $conn->query('DESCRIBE horario_tratamiento');
while($row = $result->fetch_assoc()) {
    echo "  " . $row['Field'] . " - " . $row['Type'] . "\n";
}

echo "\n=== DATOS DE EJEMPLO ===\n";

// Ver algunos datos de remedio_global
echo "\nDatos en remedio_global:\n";
$result = $conn->query('SELECT * FROM remedio_global LIMIT 3');
while($row = $result->fetch_assoc()) {
    print_r($row);
}

$conn->close();
?>