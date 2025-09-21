<?php
include 'smart_pill_api/conexion.php';

echo "=== Programaciones activas para usuario_id = 1 ===\n";
$result = $conn->query('SELECT programacion_id, nombre_tratamiento, estado, fecha_inicio, fecha_fin FROM programacion_tratamientos WHERE usuario_id = 1 AND estado = "activo"');

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "ID: " . $row['programacion_id'] . 
             " | Nombre: " . $row['nombre_tratamiento'] . 
             " | Estado: " . $row['estado'] . 
             " | Inicio: " . $row['fecha_inicio'] . 
             " | Fin: " . $row['fecha_fin'] . "\n";
    }
} else {
    echo "No se encontraron programaciones activas\n";
}

echo "\n=== Verificando registros pendientes por programación ===\n";
$result = $conn->query('SELECT programacion_id, COUNT(*) as total FROM registro_tomas WHERE usuario_id = 1 AND estado = "pendiente" GROUP BY programacion_id');

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "Programación ID: " . $row['programacion_id'] . " - Registros pendientes: " . $row['total'] . "\n";
    }
} else {
    echo "No hay registros pendientes\n";
}

echo "\n=== Verificando específicamente programación 118 (Albendazol) ===\n";
$result = $conn->query('SELECT * FROM programacion_tratamientos WHERE programacion_id = 118');
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "✅ Programación 118 encontrada:\n";
    echo "- Nombre: " . $row['nombre_tratamiento'] . "\n";
    echo "- Usuario ID: " . $row['usuario_id'] . "\n";
    echo "- Estado: " . $row['estado'] . "\n";
    echo "- Fecha inicio: " . $row['fecha_inicio'] . "\n";
    echo "- Fecha fin: " . $row['fecha_fin'] . "\n";
    
    // Verificar si tiene registros
    $result_reg = $conn->query('SELECT COUNT(*) as total FROM registro_tomas WHERE programacion_id = 118 AND usuario_id = 1');
    $reg = $result_reg->fetch_assoc();
    echo "- Registros totales: " . $reg['total'] . "\n";
    
    $result_pend = $conn->query('SELECT COUNT(*) as total FROM registro_tomas WHERE programacion_id = 118 AND usuario_id = 1 AND estado = "pendiente"');
    $pend = $result_pend->fetch_assoc();
    echo "- Registros pendientes: " . $pend['total'] . "\n";
} else {
    echo "❌ Programación 118 no encontrada\n";
}

$conn->close();
?>