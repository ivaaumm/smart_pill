<?php
include 'smart_pill_api/conexion.php';

echo "=== Estructura tabla tratamientos ===\n";
$result = $conn->query('DESCRIBE tratamientos');
while($row = $result->fetch_assoc()) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}

echo "\n=== Datos de tratamientos para programación 118 ===\n";
$result = $conn->query("SELECT t.* FROM tratamientos t 
                       JOIN programacion_tratamientos pt ON t.tratamiento_id = pt.tratamiento_id 
                       WHERE pt.programacion_id = 118");

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "Tratamiento ID: " . $row['tratamiento_id'] . "\n";
        foreach($row as $key => $value) {
            echo "- $key: $value\n";
        }
    }
} else {
    echo "No se encontraron tratamientos para programación 118\n";
}

echo "\n=== Estructura tabla registro_tomas ===\n";
$result = $conn->query('DESCRIBE registro_tomas');
while($row = $result->fetch_assoc()) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}

$conn->close();
?>