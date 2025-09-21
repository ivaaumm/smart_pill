<?php
include "smart_pill_api/conexion.php";

echo "<h2>Debug: Verificando horario_id = 1</h2>";

// 1. Verificar si existe el horario_id = 1
$sql_horario = "SELECT * FROM horarios_tratamiento WHERE horario_id = 1";
$res_horario = $conn->query($sql_horario);

echo "<h3>1. Verificando horarios_tratamiento con horario_id = 1:</h3>";
if ($res_horario && $res_horario->num_rows > 0) {
    echo "<p>✅ Horario encontrado:</p>";
    while ($row = $res_horario->fetch_assoc()) {
        echo "<pre>" . print_r($row, true) . "</pre>";
    }
} else {
    echo "<p>❌ No se encontró horario con ID = 1</p>";
}

// 2. Mostrar todos los horarios disponibles
echo "<h3>2. Todos los horarios disponibles:</h3>";
$sql_all = "SELECT * FROM horarios_tratamiento ORDER BY horario_id";
$res_all = $conn->query($sql_all);

if ($res_all && $res_all->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>horario_id</th><th>usuario_id</th><th>tratamiento_id</th><th>hora</th><th>activo</th></tr>";
    while ($row = $res_all->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['horario_id'] . "</td>";
        echo "<td>" . $row['usuario_id'] . "</td>";
        echo "<td>" . $row['tratamiento_id'] . "</td>";
        echo "<td>" . $row['hora'] . "</td>";
        echo "<td>" . ($row['activo'] ? 'Sí' : 'No') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No hay horarios en la tabla</p>";
}

// 3. Verificar la consulta exacta que usa el API
echo "<h3>3. Consulta exacta del API (con JOIN):</h3>";
$sql_api = "SELECT ht.*, pt.programacion_id, pt.dosis_por_toma 
            FROM horarios_tratamiento ht 
            JOIN programacion_tratamientos pt ON ht.tratamiento_id = pt.programacion_id 
            WHERE ht.horario_id = 1 AND ht.usuario_id = 1";

$res_api = $conn->query($sql_api);
if ($res_api && $res_api->num_rows > 0) {
    echo "<p>✅ Consulta API exitosa:</p>";
    while ($row = $res_api->fetch_assoc()) {
        echo "<pre>" . print_r($row, true) . "</pre>";
    }
} else {
    echo "<p>❌ La consulta del API falló</p>";
    echo "<p>Error: " . $conn->error . "</p>";
}

// 4. Verificar programacion_tratamientos
echo "<h3>4. Verificando programacion_tratamientos:</h3>";
$sql_prog = "SELECT * FROM programacion_tratamientos";
$res_prog = $conn->query($sql_prog);

if ($res_prog && $res_prog->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>programacion_id</th><th>usuario_id</th><th>remedio_global_id</th><th>dosis_por_toma</th></tr>";
    while ($row = $res_prog->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['programacion_id'] . "</td>";
        echo "<td>" . $row['usuario_id'] . "</td>";
        echo "<td>" . $row['remedio_global_id'] . "</td>";
        echo "<td>" . $row['dosis_por_toma'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No hay programaciones en la tabla</p>";
}

$conn->close();
?>
