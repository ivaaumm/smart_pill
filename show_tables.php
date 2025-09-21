<?php
include 'smart_pill_api/conexion.php';

echo "=== Tablas en la base de datos smart_pill ===\n";
$result = $conn->query('SHOW TABLES');
while($row = $result->fetch_array()) {
    echo "- " . $row[0] . "\n";
}

echo "\n=== Verificando registros existentes en registro_tomas ===\n";
$result = $conn->query('SELECT COUNT(*) as total FROM registro_tomas');
$row = $result->fetch_assoc();
echo "Total de registros en registro_tomas: " . $row['total'] . "\n";

if ($row['total'] > 0) {
    echo "\n=== Algunos registros existentes ===\n";
    $result = $conn->query('SELECT registro_id, usuario_id, programacion_id, horario_id, estado FROM registro_tomas LIMIT 5');
    while($row = $result->fetch_assoc()) {
        echo "- registro_id: " . $row['registro_id'] . 
             " | usuario_id: " . $row['usuario_id'] . 
             " | programacion_id: " . $row['programacion_id'] . 
             " | horario_id: " . $row['horario_id'] . 
             " | estado: " . $row['estado'] . "\n";
    }
    
    echo "\n=== Verificando registros pendientes para usuario_id = 1 ===\n";
    $result = $conn->query("SELECT registro_id, programacion_id, horario_id, fecha_programada, hora_programada FROM registro_tomas WHERE usuario_id = 1 AND estado = 'pendiente' LIMIT 5");
    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            echo "- registro_id: " . $row['registro_id'] . 
                 " | programacion_id: " . $row['programacion_id'] . 
                 " | horario_id: " . $row['horario_id'] . 
                 " | fecha: " . $row['fecha_programada'] . 
                 " | hora: " . $row['hora_programada'] . "\n";
        }
    } else {
        echo "No hay registros pendientes para usuario_id = 1\n";
    }
}

$conn->close();
?>