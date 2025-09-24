<?php
include "smart_pill_api/conexion.php";

$horario_id = 153;

echo "<h2>Debug de consulta para horario_id = $horario_id:</h2>";

// Consulta original del endpoint
$sql_horario = "SELECT ht.*, pt.programacion_id, pt.usuario_id as prog_usuario_id
               FROM horarios_tratamiento ht
               INNER JOIN programacion_tratamientos pt ON ht.tratamiento_id = pt.programacion_id
               WHERE ht.horario_id = $horario_id";

echo "<h3>Consulta SQL:</h3>";
echo "<pre>$sql_horario</pre>";

$res_horario = $conn->query($sql_horario);

if ($res_horario) {
    echo "<h3>Resultado:</h3>";
    if ($res_horario->num_rows > 0) {
        $horario = $res_horario->fetch_assoc();
        echo "<pre>" . print_r($horario, true) . "</pre>";
    } else {
        echo "No se encontraron resultados.<br>";
        
        // Verificar si existe el horario
        echo "<h3>Verificando si existe el horario:</h3>";
        $check_horario = "SELECT * FROM horarios_tratamiento WHERE horario_id = $horario_id";
        $res_check = $conn->query($check_horario);
        
        if ($res_check && $res_check->num_rows > 0) {
            $horario_data = $res_check->fetch_assoc();
            echo "Horario existe:<br>";
            echo "<pre>" . print_r($horario_data, true) . "</pre>";
            
            // Verificar si existe la programación
            $tratamiento_id = $horario_data['tratamiento_id'];
            echo "<h3>Verificando programación con tratamiento_id = $tratamiento_id:</h3>";
            $check_prog = "SELECT * FROM programacion_tratamientos WHERE programacion_id = $tratamiento_id";
            $res_prog = $conn->query($check_prog);
            
            if ($res_prog && $res_prog->num_rows > 0) {
                $prog_data = $res_prog->fetch_assoc();
                echo "Programación existe:<br>";
                echo "<pre>" . print_r($prog_data, true) . "</pre>";
            } else {
                echo "No existe programación con programacion_id = $tratamiento_id<br>";
            }
        } else {
            echo "No existe el horario con horario_id = $horario_id<br>";
        }
    }
} else {
    echo "Error en la consulta: " . $conn->error;
}

$conn->close();
?>