<?php
include "smart_pill_api/conexion.php";

echo "<h2>Usuarios en la base de datos</h2>";

try {
    $sql = "SELECT usuario_id, nombre_usuario, email FROM usuarios LIMIT 10";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        echo "<table border='1'>";
        echo "<tr><th>ID</th><th>Nombre Usuario</th><th>Email</th></tr>";
        while($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row["usuario_id"] . "</td>";
            echo "<td>" . $row["nombre_usuario"] . "</td>";
            echo "<td>" . $row["email"] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No hay usuarios en la base de datos</p>";
    }
} catch (Exception $e) {
    echo "<p>Error: " . $e->getMessage() . "</p>";
}

$conn->close();
?>
