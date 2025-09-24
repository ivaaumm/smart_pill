<?php
include "smart_pill_api/conexion.php";

echo "<h2>🔍 Verificando estructura de tablas</h2>";

// Verificar estructura de usuarios
echo "<h3>📋 Estructura de tabla 'usuarios':</h3>";
$result = $conn->query("DESCRIBE usuarios");
if ($result) {
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['Field'] . "</td>";
        echo "<td>" . $row['Type'] . "</td>";
        echo "<td>" . $row['Null'] . "</td>";
        echo "<td>" . $row['Key'] . "</td>";
        echo "<td>" . $row['Default'] . "</td>";
        echo "<td>" . $row['Extra'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: red;'>Error: " . $conn->error . "</p>";
}

// Verificar estructura de remedio_global
echo "<h3>💊 Estructura de tabla 'remedio_global':</h3>";
$result = $conn->query("DESCRIBE remedio_global");
if ($result) {
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['Field'] . "</td>";
        echo "<td>" . $row['Type'] . "</td>";
        echo "<td>" . $row['Null'] . "</td>";
        echo "<td>" . $row['Key'] . "</td>";
        echo "<td>" . $row['Default'] . "</td>";
        echo "<td>" . $row['Extra'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: red;'>Error: " . $conn->error . "</p>";
}

// Verificar algunos datos de ejemplo
echo "<h3>👤 Usuarios existentes:</h3>";
$result = $conn->query("SELECT * FROM usuarios LIMIT 3");
if ($result && $result->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse;'>";
    $first = true;
    while ($row = $result->fetch_assoc()) {
        if ($first) {
            echo "<tr>";
            foreach (array_keys($row) as $key) {
                echo "<th>$key</th>";
            }
            echo "</tr>";
            $first = false;
        }
        echo "<tr>";
        foreach ($row as $value) {
            echo "<td>" . htmlspecialchars($value) . "</td>";
        }
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>No hay usuarios o error: " . $conn->error . "</p>";
}

$conn->close();
?>