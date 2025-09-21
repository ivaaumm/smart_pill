<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Obtener las programaciones existentes
    $sql_programaciones = "SELECT programacion_id, usuario_id, remedio_global_id, dosis_por_toma 
                          FROM programacion_tratamientos 
                          WHERE estado = 'activo'";
    
    $res_programaciones = $conn->query($sql_programaciones);
    
    if (!$res_programaciones) {
        throw new Exception("Error al obtener programaciones: " . $conn->error);
    }
    
    $horarios_creados = 0;
    
    while($programacion = $res_programaciones->fetch_assoc()) {
        $programacion_id = $programacion['programacion_id'];
        $usuario_id = $programacion['usuario_id'];
        $remedio_global_id = $programacion['remedio_global_id'];
        $dosis = $programacion['dosis_por_toma'];
        
        // Crear horarios para cada día de la semana
        $dias_semana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        $horas = ['08:00:00', '12:00:00', '18:00:00']; // Mañana, mediodía, tarde
        
        foreach($dias_semana as $dia) {
            foreach($horas as $hora) {
                // Verificar si ya existe este horario
                $sql_check = "SELECT COUNT(*) as existe FROM horarios_tratamiento 
                             WHERE tratamiento_id = $programacion_id 
                             AND dia_semana = '$dia' 
                             AND hora = '$hora'";
                
                $res_check = $conn->query($sql_check);
                $row_check = $res_check->fetch_assoc();
                
                if ($row_check['existe'] == 0) {
                    // Insertar el horario
                    $sql_insert = "INSERT INTO horarios_tratamiento (
                        tratamiento_id, usuario_id, remedio_global_id, dia_semana, hora, dosis, activo
                    ) VALUES (
                        $programacion_id, $usuario_id, $remedio_global_id, '$dia', '$hora', '$dosis', 1
                    )";
                    
                    if ($conn->query($sql_insert)) {
                        $horarios_creados++;
                    }
                }
            }
        }
    }
    
    echo json_encode([
        "success" => true, 
        "message" => "Se crearon $horarios_creados horarios de ejemplo",
        "horarios_creados" => $horarios_creados
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 
