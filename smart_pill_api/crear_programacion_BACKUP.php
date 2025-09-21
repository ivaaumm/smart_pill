<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data) {
        throw new Exception("Datos JSON inválidos");
    }
    
    // Validar campos obligatorios
    if (!isset($data->usuario_id) || empty($data->usuario_id)) {
        throw new Exception("ID de usuario requerido");
    }
    if (!isset($data->remedio_global_id) || empty($data->remedio_global_id)) {
        throw new Exception("ID de remedio global requerido");
    }
    if (!isset($data->fecha_inicio) || empty($data->fecha_inicio)) {
        throw new Exception("Fecha de inicio requerida");
    }
    if (!isset($data->fecha_fin) || empty($data->fecha_fin)) {
        throw new Exception("Fecha de fin requerida");
    }
    
    // Validar que las fechas sean válidas
    $fecha_inicio = $conn->real_escape_string($data->fecha_inicio);
    $fecha_fin = $conn->real_escape_string($data->fecha_fin);
    
    if (strtotime($fecha_inicio) === false || strtotime($fecha_fin) === false) {
        throw new Exception("Formato de fecha inválido");
    }
    
    if (strtotime($fecha_inicio) > strtotime($fecha_fin)) {
        throw new Exception("La fecha de inicio no puede ser posterior a la fecha de fin");
    }
    
    $usuario_id = intval($data->usuario_id);
    $remedio_global_id = intval($data->remedio_global_id);
    $nombre_tratamiento = isset($data->nombre_tratamiento) ? $conn->real_escape_string($data->nombre_tratamiento) : null;
    $dosis_por_toma = isset($data->dosis_por_toma) ? $conn->real_escape_string($data->dosis_por_toma) : null;
    $observaciones = isset($data->observaciones) ? $conn->real_escape_string($data->observaciones) : null;
    $estado = isset($data->estado) ? $conn->real_escape_string($data->estado) : 'activo';
    
    // Validar que el estado sea válido
    $estados_validos = ['activo', 'pausado', 'completado'];
    if (!in_array($estado, $estados_validos)) {
        throw new Exception("Estado inválido. Debe ser: " . implode(', ', $estados_validos));
    }

    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // Insertar la programación
        $sql = "INSERT INTO programacion_tratamientos (
                    usuario_id, 
                    remedio_global_id, 
                    nombre_tratamiento, 
                    fecha_inicio, 
                    fecha_fin, 
                    dosis_por_toma, 
                    observaciones, 
                    estado
                ) VALUES (
                    $usuario_id,
                    $remedio_global_id,
                    " . ($nombre_tratamiento ? "'$nombre_tratamiento'" : "NULL") . ",
                    '$fecha_inicio',
                    '$fecha_fin',
                    " . ($dosis_por_toma ? "'$dosis_por_toma'" : "NULL") . ",
                    " . ($observaciones ? "'$observaciones'" : "NULL") . ",
                    '$estado'
                )";
                
        if (!$conn->query($sql)) {
            throw new Exception("Error al crear la programación: " . $conn->error);
        }
        
        $programacion_id = $conn->insert_id;
        $horarios_creados = 0;
        
        // Verificar que el remedio_global_id existe
        $check_remedio = $conn->query("SELECT 1 FROM remedio_global WHERE remedio_global_id = $remedio_global_id");
        if (!$check_remedio || $check_remedio->num_rows === 0) {
            throw new Exception("El remedio con ID $remedio_global_id no existe en la base de datos");
        }
        
        // Procesar horarios si se proporcionan
        if (isset($data->horarios) && is_array($data->horarios) && count($data->horarios) > 0) {
            $dias_validos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            
            foreach ($data->horarios as $horario) {
                // Validar campos del horario
                if (!isset($horario->dia_semana) || empty($horario->dia_semana)) {
                    throw new Exception("Día de la semana requerido para cada horario");
                }
                if (!isset($horario->hora) || empty($horario->hora)) {
                    throw new Exception("Hora requerida para cada horario");
                }
                
                $dia_semana = strtolower($conn->real_escape_string($horario->dia_semana));
                $hora = $conn->real_escape_string($horario->hora);
                $dosis = isset($horario->dosis) ? $conn->real_escape_string($horario->dosis) : $dosis_por_toma;
                $activo = isset($horario->activo) ? intval($horario->activo) : 1;
                
                // Validar día de la semana
                if (!in_array($dia_semana, $dias_validos)) {
                    throw new Exception("Día de la semana inválido: $dia_semana. Debe ser: " . implode(', ', $dias_validos));
                }
                
                // Validar formato de hora
                if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $hora)) {
                    throw new Exception("Formato de hora inválido: $hora. Use formato HH:MM:SS");
                }
                
                // Verificar si ya existe este horario
                $sql_check = "SELECT COUNT(*) as existe FROM horarios_tratamiento 
                             WHERE tratamiento_id = $programacion_id 
                             AND dia_semana = '$dia_semana' 
                             AND hora = '$hora'";
                
                $res_check = $conn->query($sql_check);
                if (!$res_check) {
                    throw new Exception("Error al verificar horario existente: " . $conn->error);
                }
                
                $row_check = $res_check->fetch_assoc();
                
                if ($row_check['existe'] == 0) {
                    // Insertar el horario
                    // Verificar que todos los IDs sean válidos antes de insertar
                    if ($programacion_id <= 0 || $usuario_id <= 0 || $remedio_global_id <= 0) {
                        throw new Exception("Error: IDs inválidos. Programación: $programacion_id, Usuario: $usuario_id, Remedio: $remedio_global_id");
                    }
                    
                    $sql_horario = "INSERT INTO horarios_tratamiento (
                        tratamiento_id, usuario_id, remedio_global_id, dia_semana, hora, dosis, activo
                    ) VALUES (
                        $programacion_id, $usuario_id, $remedio_global_id, '$dia_semana', '$hora', 
                        " . ($dosis ? "'$dosis'" : "NULL") . ", $activo
                    )";
                    
                    if (!$conn->query($sql_horario)) {
                        throw new Exception("Error al crear horario: " . $conn->error);
                    }
                    
                    $horarios_creados++;
                    
                    // Generar alarma automáticamente para este horario
                    $dias_semana_alarma = "";
                    switch($dia_semana) {
                        case 'lunes': $dias_semana_alarma = "1"; break;
                        case 'martes': $dias_semana_alarma = "2"; break;
                        case 'miercoles': $dias_semana_alarma = "3"; break;
                        case 'jueves': $dias_semana_alarma = "4"; break;
                        case 'viernes': $dias_semana_alarma = "5"; break;
                        case 'sabado': $dias_semana_alarma = "6"; break;
                        case 'domingo': $dias_semana_alarma = "0"; break;
                        default: $dias_semana_alarma = "1,2,3,4,5,6,0"; // Por defecto todos los días
                    }
                    
                    // Verificar si ya existe una alarma para esta programación y hora
                    $sql_check_alarma = "SELECT COUNT(*) as existe FROM alarmas 
                                        WHERE programacion_id = $programacion_id 
                                        AND hora = '$hora'";
                    
                    $res_check_alarma = $conn->query($sql_check_alarma);
                    if ($res_check_alarma) {
                        $row_check_alarma = $res_check_alarma->fetch_assoc();
                        
                        if ($row_check_alarma['existe'] == 0) {
                            // Crear la alarma
                            $sql_alarma = "INSERT INTO alarmas (
                                programacion_id, hora, dias_semana, activa, fecha_creacion
                            ) VALUES (
                                $programacion_id, '$hora', '$dias_semana_alarma', 1, NOW()
                            )";
                            
                            if (!$conn->query($sql_alarma)) {
                                // No lanzar excepción para no interrumpir el proceso principal
                                error_log("Error al crear alarma automática: " . $conn->error);
                            }
                        }
                    }
                }
            }
        }
        
        // Confirmar transacción
        $conn->commit();
        
        echo json_encode([
            "success" => true, 
            "programacion_id" => $programacion_id,
            "horarios_creados" => $horarios_creados,
            "message" => "Programación creada exitosamente con $horarios_creados horarios"
        ]);
        
    } catch (Exception $e) {
        // Revertir transacción en caso de error
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>
