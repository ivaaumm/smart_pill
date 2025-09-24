<?php
include "smart_pill_api/conexion.php";

echo "<h2>Horarios activos para usuario 1:</h2>";

$sql = "SELECT horario_id, usuario_id, activo FROM horarios_tratamiento WHERE usuario_id = 1";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>Horario ID</th><th>Usuario ID</th><th>Activo</th></tr>";
    
    while($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['horario_id'] . "</td>";
        echo "<td>" . $row['usuario_id'] . "</td>";
        echo "<td>" . $row['activo'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "No se encontraron horarios";
}

// Probar consulta específica
echo "<h2>Probando consulta específica:</h2>";
$horario_id = 153;
$usuario_id = 1;

$sql_test = "SELECT horario_id, usuario_id, activo FROM horarios_tratamiento WHERE horario_id = $horario_id AND usuario_id = $usuario_id AND activo = 1";
echo "SQL: $sql_test<br>";

$result_test = $conn->query($sql_test);
if ($result_test && $result_test->num_rows > 0) {
    echo "Resultado encontrado:<br>";
    $row = $result_test->fetch_assoc();
    print_r($row);
} else {
    echo "No se encontró resultado<br>";
}

$conn->close();
?>