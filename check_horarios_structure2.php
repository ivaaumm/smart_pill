<?php
include 'smart_pill_api/conexion.php';

echo "=== Estructura de la tabla horarios_tratamiento ===\n";
$result = $conn->query('DESCRIBE horarios_tratamiento');
while($row = $result->fetch_assoc()) {
    echo "Campo: " . $row['Field'] . " | Tipo: " . $row['Type'] . " | Null: " . $row['Null'] . " | Key: " . $row['Key'] . " | Default: " . $row['Default'] . "\n";
}

echo "\n=== Algunos registros de horarios_tratamiento ===\n";
$result = $conn->query('SELECT * FROM horarios_tratamiento LIMIT 3');
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "horario_id: " . $row['horario_id'];
        foreach($row as $key => $value) {
            if ($key != 'horario_id') {
                echo " | $key: $value";
            }
        }
        echo "\n";
    }
} else {
    echo "No hay registros en horarios_tratamiento\n";
}

echo "\n=== Estructura de la tabla programacion_tratamientos ===\n";
$result = $conn->query('DESCRIBE programacion_tratamientos');
while($row = $result->fetch_assoc()) {
    echo "Campo: " . $row['Field'] . " | Tipo: " . $row['Type'] . " | Null: " . $row['Null'] . " | Key: " . $row['Key'] . " | Default: " . $row['Default'] . "\n";
}

echo "\n=== Programaciones para usuario_id = 1 ===\n";
$result = $conn->query('SELECT * FROM programacion_tratamientos WHERE usuario_id = 1 LIMIT 3');
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "programacion_id: " . $row['programacion_id'];
        foreach($row as $key => $value) {
            if ($key != 'programacion_id') {
                echo " | $key: $value";
            }
        }
        echo "\n";
    }
} else {
    echo "No hay programaciones para usuario_id = 1\n";
}

$conn->close();
?>