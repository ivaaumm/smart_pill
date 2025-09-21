<?php
include 'smart_pill_api/conexion.php';

echo "=== REGISTROS ACTUALES EN TABLA registro_tomas ===\n";

$result = $conn->query("SELECT registro_id, estado, observaciones, fecha_actualizacion FROM registro_tomas ORDER BY registro_id DESC LIMIT 10");

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "ID: {$row['registro_id']} - Estado: {$row['estado']} - Obs: {$row['observaciones']} - Fecha: {$row['fecha_actualizacion']}\n";
    }
} else {
    echo "No hay registros en la tabla\n";
}

$conn->close();
?>