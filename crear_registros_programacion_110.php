<?php
echo "<h2>🔧 Crear Registros para Programación 110</h2>";

include "smart_pill_api/conexion.php";

$programacion_id = 110;
$usuario_id = 1;

// 1. Verificar la programación
echo "<h3>📋 Verificando programación $programacion_id:</h3>";
$sql_prog = "SELECT pt.*, rg.nombre_comercial 
             FROM programacion_tratamientos pt 
             LEFT JOIN remedio_global rg ON pt.remedio_global_id = rg.remedio_global_id 
             WHERE pt.programacion_id = $programacion_id";

$res_prog = $conn->query($sql_prog);
if ($res_prog && $res_prog->num_rows > 0) {
    $programacion = $res_prog->fetch_assoc();
    echo "<pre>" . print_r($programacion, true) . "</pre>";
    
    // 2. Obtener horarios de esta programación
    echo "<h3>⏰ Horarios de la programación:</h3>";
    $sql_horarios = "SELECT * FROM horarios_tratamiento WHERE tratamiento_id = $programacion_id";
    $res_horarios = $conn->query($sql_horarios);
    
    if ($res_horarios && $res_horarios->num_rows > 0) {
        $horarios = [];
        echo "<table border='1'>";
        echo "<tr><th>horario_id</th><th>dia_semana</th><th>hora</th><th>dosis</th><th>activo</th></tr>";
        
        while ($horario = $res_horarios->fetch_assoc()) {
            $horarios[] = $horario;
            echo "<tr>";
            echo "<td>{$horario['horario_id']}</td>";
            echo "<td>{$horario['dia_semana']}</td>";
            echo "<td>{$horario['hora']}</td>";
            echo "<td>{$horario['dosis']}</td>";
            echo "<td>" . ($horario['activo'] ? 'Sí' : 'No') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // 3. Crear registros para los próximos días
        echo "<h3>🆕 Creando registros de tomas:</h3>";
        
        $fecha_inicio = date('Y-m-d'); // Hoy
        $fecha_fin = date('Y-m-d', strtotime('+7 days')); // Próximos 7 días
        
        $registros_creados = 0;
        $registros_existentes = 0;
        
        // Mapeo de días
        $dias_semana = [
            'lunes' => 1,
            'martes' => 2,
            'miercoles' => 3,
            'jueves' => 4,
            'viernes' => 5,
            'sabado' => 6,
            'domingo' => 0
        ];
        
        // Iterar por cada día en el rango
        $fecha_actual = $fecha_inicio;
        while ($fecha_actual <= $fecha_fin) {
            $dia_semana_num = date('w', strtotime($fecha_actual)); // 0=domingo, 1=lunes, etc.
            
            // Buscar horarios para este día
            foreach ($horarios as $horario) {
                if ($horario['activo'] && isset($dias_semana[$horario['dia_semana']]) && 
                    $dias_semana[$horario['dia_semana']] == $dia_semana_num) {
                    
                    // Verificar si ya existe este registro
                    $sql_check = "SELECT COUNT(*) as existe FROM registro_tomas 
                                 WHERE programacion_id = $programacion_id 
                                 AND horario_id = {$horario['horario_id']} 
                                 AND fecha_programada = '$fecha_actual' 
                                 AND hora_programada = '{$horario['hora']}'";
                    
                    $res_check = $conn->query($sql_check);
                    $check = $res_check->fetch_assoc();
                    
                    if ($check['existe'] == 0) {
                        // Crear el registro
                        $sql_insert = "INSERT INTO registro_tomas (
                            usuario_id, programacion_id, horario_id, remedio_global_id,
                            fecha_programada, hora_programada, estado, 
                            fecha_creacion
                        ) VALUES (
                            $usuario_id, $programacion_id, {$horario['horario_id']}, {$programacion['remedio_global_id']},
                            '$fecha_actual', '{$horario['hora']}', 'pendiente', 
                            NOW()
                        )";
                        
                        if ($conn->query($sql_insert)) {
                            $registro_id = $conn->insert_id;
                            echo "<p>✅ Registro creado: ID $registro_id - $fecha_actual {$horario['hora']} ({$horario['dia_semana']})</p>";
                            $registros_creados++;
                        } else {
                            echo "<p>❌ Error creando registro: " . $conn->error . "</p>";
                        }
                    } else {
                        $registros_existentes++;
                    }
                }
            }
            
            // Siguiente día
            $fecha_actual = date('Y-m-d', strtotime($fecha_actual . ' +1 day'));
        }
        
        echo "<h3>📊 Resumen:</h3>";
        echo "<ul>";
        echo "<li><strong>Registros creados:</strong> $registros_creados</li>";
        echo "<li><strong>Registros ya existentes:</strong> $registros_existentes</li>";
        echo "</ul>";
        
        // 4. Verificar registros creados
        if ($registros_creados > 0) {
            echo "<h3>🔍 Registros pendientes para programación $programacion_id:</h3>";
            $sql_pendientes = "SELECT registro_id, fecha_programada, hora_programada, estado 
                              FROM registro_tomas 
                              WHERE programacion_id = $programacion_id AND estado = 'pendiente' 
                              ORDER BY fecha_programada, hora_programada 
                              LIMIT 10";
            
            $res_pendientes = $conn->query($sql_pendientes);
            if ($res_pendientes && $res_pendientes->num_rows > 0) {
                echo "<table border='1'>";
                echo "<tr><th>registro_id</th><th>fecha</th><th>hora</th><th>estado</th></tr>";
                
                while ($registro = $res_pendientes->fetch_assoc()) {
                    echo "<tr>";
                    echo "<td>{$registro['registro_id']}</td>";
                    echo "<td>{$registro['fecha_programada']}</td>";
                    echo "<td>{$registro['hora_programada']}</td>";
                    echo "<td>{$registro['estado']}</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
        }
        
    } else {
        echo "<p style='color: red;'>❌ No se encontraron horarios para esta programación</p>";
        echo "<p>💡 <strong>Sugerencia:</strong> Crear horarios primero usando el endpoint crear_programacion.php</p>";
    }
    
} else {
    echo "<p style='color: red;'>❌ Programación $programacion_id no encontrada</p>";
}

$conn->close();
?>

<hr>
<h3>🧪 Test del endpoint después de crear registros:</h3>
<a href="test_obtener_registro.php" target="_blank">🔗 Ejecutar test nuevamente</a>
