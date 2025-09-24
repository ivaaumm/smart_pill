<?php
include "smart_pill_api/conexion.php";

echo "<h2>Horarios disponibles para usuario 1:</h2>";

$sql = "SELECT horario_id, tratamiento_id, usuario_id, remedio_global_id, 
               dia_semana, hora, dosis, activo
        FROM horarios_tratamiento 
        WHERE usuario_id = 1 
        ORDER BY horario_id DESC
        LIMIT 10";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>Horario ID</th><th>Tratamiento ID</th><th>Usuario ID</th><th>Remedio ID</th><th>Día</th><th>Hora</th><th>Dosis</th><th>Activo</th></tr>";
    
    while($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['horario_id'] . "</td>";
        echo "<td>" . $row['tratamiento_id'] . "</td>";
        echo "<td>" . $row['usuario_id'] . "</td>";
        echo "<td>" . $row['remedio_global_id'] . "</td>";
        echo "<td>" . $row['dia_semana'] . "</td>";
        echo "<td>" . $row['hora'] . "</td>";
        echo "<td>" . $row['dosis'] . "</td>";
        echo "<td>" . $row['activo'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "No se encontraron horarios para el usuario 1";
}

$conn->close();
?>