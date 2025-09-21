<?php
include 'smart_pill_api/conexion.php';

echo "=== ESTRUCTURA COMPLETA DE PROGRAMACION_TRATAMIENTOS ===\n";
$result = $conn->query('SHOW CREATE TABLE programacion_tratamientos');
$row = $result->fetch_assoc();
echo $row['Create Table'] . "\n\n";

echo "=== VERIFICANDO REMEDIO_GLOBAL_ID ===\n";
$result = $conn->query('SELECT remedio_global_id FROM remedio_global LIMIT 5');
echo "IDs disponibles en remedio_global:\n";
while($row = $result->fetch_assoc()) {
    echo "- " . $row['remedio_global_id'] . "\n";
}

$conn->close();
?>