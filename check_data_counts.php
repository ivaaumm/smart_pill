<?php
include 'smart_pill_api/conexion.php';

echo "=== CONTEO DE DATOS ===\n";

$result = $conn->query('SELECT COUNT(*) as count FROM horarios_tratamiento');
$row = $result->fetch_assoc();
echo "Horarios de tratamiento: " . $row['count'] . "\n";

$result = $conn->query('SELECT COUNT(*) as count FROM programacion_tratamientos');
$row = $result->fetch_assoc();
echo "Programaciones de tratamiento: " . $row['count'] . "\n";

$result = $conn->query('SELECT COUNT(*) as count FROM registro_tomas');
$row = $result->fetch_assoc();
echo "Registros de tomas: " . $row['count'] . "\n";

$result = $conn->query('SELECT COUNT(*) as count FROM remedio_global');
$row = $result->fetch_assoc();
echo "Remedios globales: " . $row['count'] . "\n";

$conn->close();
?>