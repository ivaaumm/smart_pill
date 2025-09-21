<?php
include 'smart_pill_api/conexion.php';

echo "=== Verificando programaciones con registros ===\n";

// Buscar programaciones con registros
$sql = "SELECT DISTINCT programacion_id, COUNT(*) as total, 
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
        FROM registro_tomas 
        WHERE usuario_id = 1 
        GROUP BY programacion_id 
        ORDER BY programacion_id DESC 
        LIMIT 10";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    echo "Programaciones encontradas:\n";
    while($row = $result->fetch_assoc()) {
        echo "- Programacion ID: " . $row['programacion_id'] . 
             " - Total registros: " . $row['total'] . 
             " - Pendientes: " . $row['pendientes'] . "\n";
    }
} else {
    echo "No se encontraron programaciones con registros para usuario_id = 1\n";
}

// Verificar específicamente la programación 118
echo "\n=== Verificando programación 118 específicamente ===\n";
$sql118 = "SELECT * FROM registro_tomas WHERE programacion_id = 118 AND usuario_id = 1 LIMIT 5";
$result118 = $conn->query($sql118);

if ($result118 && $result118->num_rows > 0) {
    echo "Registros encontrados para programación 118:\n";
    while($row = $result118->fetch_assoc()) {
        echo "- registro_id: " . $row['registro_id'] . 
             " - estado: " . $row['estado'] . 
             " - fecha: " . $row['fecha_programada'] . 
             " - hora: " . $row['hora_programada'] . "\n";
    }
} else {
    echo "No se encontraron registros para programación 118\n";
}

$conn->close();
?>