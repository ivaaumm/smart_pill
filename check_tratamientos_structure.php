<?php
include "smart_pill_api/conexion.php";

echo "Estructura de la tabla 'tratamientos':\n";
echo "=====================================\n";

$result = $conn->query('DESCRIBE tratamientos');
if ($result) {
    while($row = $result->fetch_assoc()) {
        echo $row['Field'] . ' - ' . $row['Type'] . ' - ' . $row['Null'] . ' - ' . $row['Key'] . "\n";
    }
} else {
    echo "Error: " . $conn->error . "\n";
}

echo "\nEstructura de la tabla 'horarios_tratamiento':\n";
echo "=============================================\n";

$result = $conn->query('DESCRIBE horarios_tratamiento');
if ($result) {
    while($row = $result->fetch_assoc()) {
        echo $row['Field'] . ' - ' . $row['Type'] . ' - ' . $row['Null'] . ' - ' . $row['Key'] . "\n";
    }
} else {
    echo "Error: " . $conn->error . "\n";
}

$conn->close();
?>