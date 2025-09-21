<?php
include "smart_pill_api/conexion.php";

echo "<h2>Debug: Relación entre Alarmas y Horarios</h2>";

// 1. Verificar alarmas existentes
echo "<h3>1. Alarmas existentes:</h3>";
$sql_alarmas = "SELECT * FROM alarmas ORDER BY alarma_id";
$res_alarmas = $conn->query($sql_alarmas);

if ($res_alarmas && $res_alarmas->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>alarma_id</th><th>programacion_id</th><th>horario_id</th><th>hora</th><th>dias_semana</th><th>activa</th></tr>";
    while ($row = $res_alarmas->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['alarma_id'] . "</td>";
        echo "<td>" . $row['programacion_id'] . "</td>";
        echo "<td>" . ($row['horario_id'] ?: 'NULL') . "</td>";
        echo "<td>" . $row['hora'] . "</td>";
        echo "<td>" . $row['dias_semana'] . "</td>";
        echo "<td>" . ($row['activa'] ? 'Sí' : 'No') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No hay alarmas en la tabla</p>";
}

// 2. Verificar horarios_tratamiento
echo "<h3>2. Horarios de tratamiento:</h3>";
$sql_horarios = "SELECT * FROM horarios_tratamiento ORDER BY horario_id";
$res_horarios = $conn->query($sql_horarios);

if ($res_horarios && $res_horarios->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>horario_id</th><th>tratamiento_id</th><th>usuario_id</th><th>hora</th><th>dia_semana</th><th>activo</th></tr>";
    while ($row = $res_horarios->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['horario_id'] . "</td>";
        echo "<td>" . $row['tratamiento_id'] . "</td>";
        echo "<td>" . $row['usuario_id'] . "</td>";
        echo "<td>" . $row['hora'] . "</td>";
        echo "<td>" . $row['dia_semana'] . "</td>";
        echo "<td>" . ($row['activo'] ? 'Sí' : 'No') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No hay horarios en la tabla</p>";
}

// 3. Verificar programaciones
echo "<h3>3. Programaciones de tratamiento:</h3>";
$sql_prog = "SELECT programacion_id, usuario_id, nombre_tratamiento, estado FROM programacion_tratamientos ORDER BY programacion_id";
$res_prog = $conn->query($sql_prog);

if ($res_prog && $res_prog->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>programacion_id</th><th>usuario_id</th><th>nombre_tratamiento</th><th>estado</th></tr>";
    while ($row = $res_prog->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['programacion_id'] . "</td>";
        echo "<td>" . $row['usuario_id'] . "</td>";
        echo "<td>" . $row['nombre_tratamiento'] . "</td>";
        echo "<td>" . $row['estado'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No hay programaciones en la tabla</p>";
}

// 4. Crear horarios de tratamiento para las alarmas existentes
echo "<h3>4. Creando horarios de tratamiento para alarmas existentes:</h3>";

$sql_alarmas_sin_horario = "SELECT * FROM alarmas WHERE horario_id IS NULL OR horario_id = 0";
$res_alarmas_sin_horario = $conn->query($sql_alarmas_sin_horario);

if ($res_alarmas_sin_horario && $res_alarmas_sin_horario->num_rows > 0) {
    echo "<p>Encontradas " . $res_alarmas_sin_horario->num_rows . " alarmas sin horario_id válido</p>";
    
    while ($alarma = $res_alarmas_sin_horario->fetch_assoc()) {
        // Obtener información de la programación
        $prog_id = $alarma['programacion_id'];
        $sql_prog_info = "SELECT * FROM programacion_tratamientos WHERE programacion_id = $prog_id";
        $res_prog_info = $conn->query($sql_prog_info);
        
        if ($res_prog_info && $res_prog_info->num_rows > 0) {
            $prog_info = $res_prog_info->fetch_assoc();
            
            // Crear horario de tratamiento para cada día de la semana de la alarma
            $dias_semana = explode(',', $alarma['dias_semana']);
            $dias_nombres = ['', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            
            foreach ($dias_semana as $dia_num) {
                $dia_num = intval($dia_num);
                if ($dia_num >= 1 && $dia_num <= 7) {
                    $dia_nombre = $dias_nombres[$dia_num];
                    
                    // Verificar si ya existe un horario para este día y hora
                    $sql_check = "SELECT horario_id FROM horarios_tratamiento 
                                  WHERE tratamiento_id = {$prog_info['programacion_id']} 
                                  AND usuario_id = {$prog_info['usuario_id']} 
                                  AND dia_semana = '$dia_nombre' 
                                  AND hora = '{$alarma['hora']}'";
                    
                    $res_check = $conn->query($sql_check);
                    
                    if (!$res_check || $res_check->num_rows == 0) {
                        // Crear nuevo horario
                        $sql_insert = "INSERT INTO horarios_tratamiento 
                                       (tratamiento_id, usuario_id, remedio_global_id, dia_semana, hora, dosis, activo) 
                                       VALUES 
                                       ({$prog_info['programacion_id']}, {$prog_info['usuario_id']}, {$prog_info['remedio_global_id']}, 
                                        '$dia_nombre', '{$alarma['hora']}', '{$prog_info['dosis_por_toma']}', 1)";
                        
                        if ($conn->query($sql_insert)) {
                            $nuevo_horario_id = $conn->insert_id;
                            echo "<p>✅ Creado horario_id $nuevo_horario_id para alarma {$alarma['alarma_id']} - $dia_nombre {$alarma['hora']}</p>";
                            
                            // Actualizar la alarma con el nuevo horario_id (solo para el primer día)
                            if ($dia_num == $dias_semana[0]) {
                                $sql_update_alarma = "UPDATE alarmas SET horario_id = $nuevo_horario_id WHERE alarma_id = {$alarma['alarma_id']}";
                                if ($conn->query($sql_update_alarma)) {
                                    echo "<p>✅ Actualizada alarma {$alarma['alarma_id']} con horario_id $nuevo_horario_id</p>";
                                }
                            }
                        } else {
                            echo "<p>❌ Error creando horario: " . $conn->error . "</p>";
                        }
                    } else {
                        $horario_existente = $res_check->fetch_assoc();
                        echo "<p>ℹ️ Ya existe horario_id {$horario_existente['horario_id']} para $dia_nombre {$alarma['hora']}</p>";
                        
                        // Actualizar la alarma con el horario existente
                        if ($dia_num == $dias_semana[0]) {
                            $sql_update_alarma = "UPDATE alarmas SET horario_id = {$horario_existente['horario_id']} WHERE alarma_id = {$alarma['alarma_id']}";
                            if ($conn->query($sql_update_alarma)) {
                                echo "<p>✅ Actualizada alarma {$alarma['alarma_id']} con horario_id existente {$horario_existente['horario_id']}</p>";
                            }
                        }
                    }
                }
            }
        }
    }
} else {
    echo "<p>✅ Todas las alarmas tienen horario_id válido</p>";
}

$conn->close();
?>
