<?php
header("Content-Type: text/html; charset=UTF-8");

// Incluir conexión a la base de datos
include "smart_pill_api/conexion.php";

echo "<h2>Horarios de Tratamiento en la base de datos</h2>";

try {
    $sql = "SELECT * FROM horarios_tratamiento WHERE usuario_id = 1 ORDER BY horario_id DESC LIMIT 10";
    
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        echo "<table border='1'>";
        echo "<tr><th>Horario ID</th><th>Usuario ID</th><th>Tratamiento ID</th><th>Día</th><th>Hora</th><th>Dosis</th></tr>";
        
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['horario_id'] . "</td>";
            echo "<td>" . $row['usuario_id'] . "</td>";
            echo "<td>" . $row['tratamiento_id'] . "</td>";
            echo "<td>" . $row['dia_semana'] . "</td>";
            echo "<td>" . $row['hora'] . "</td>";
            echo "<td>" . $row['dosis'] . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p>No se encontraron horarios de tratamiento.</p>";
    }
    
} catch (Exception $e) {
    echo "<p>Error: " . $e->getMessage() . "</p>";
}

$conn->close();
?>
