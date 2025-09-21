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
    if (!isset($data->programacion_id) || empty($data->programacion_id)) {
        throw new Exception("ID de programación requerido");
    }
    if (!isset($data->dia_semana) || empty($data->dia_semana)) {
        throw new Exception("Día de la semana requerido");
    }
    if (!isset($data->hora) || empty($data->hora)) {
        throw new Exception("Hora requerida");
    }
    
    $programacion_id = intval($data->programacion_id);
    $dia_semana = strtolower($conn->real_escape_string($data->dia_semana));
    $hora = $conn->real_escape_string($data->hora);
    $dosis = isset($data->dosis) ? $conn->real_escape_string($data->dosis) : null;
    $activo = isset($data->activo) ? intval($data->activo) : 1;
    
    // Validar día de la semana
    $dias_validos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    if (!in_array($dia_semana, $dias_validos)) {
        throw new Exception("Día de la semana inválido: $dia_semana. Debe ser: " . implode(', ', $dias_validos));
    }
    
    // Validar formato de hora (aceptar HH:MM o HH:MM:SS)
    if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $hora)) {
        throw new Exception("Formato de hora inválido: $hora. Use formato HH:MM o HH:MM:SS");
    }
    
    // Agregar segundos si no están presentes
    if (strlen($hora) == 5) {
        $hora .= ':00';
    }
    
    // Verificar que la programación existe
    $sql_check = "SELECT usuario_id, remedio_global_id FROM programacion_tratamientos WHERE programacion_id = $programacion_id";
    $res_check = $conn->query($sql_check);
    if (!$res_check || $res_check->num_rows == 0) {
        throw new Exception("Programación no encontrada");
    }
    
    $programacion = $res_check->fetch_assoc();
    $usuario_id = $programacion['usuario_id'];
    $remedio_global_id = $programacion['remedio_global_id'];
    
    // Verificar si ya existe este horario
    $sql_exists = "SELECT COUNT(*) as existe FROM horarios_tratamiento 
                   WHERE tratamiento_id = $programacion_id 
                   AND dia_semana = '$dia_semana' 
                   AND hora = '$hora'";
    
    $res_exists = $conn->query($sql_exists);
    $row_exists = $res_exists->fetch_assoc();
    
    if ($row_exists['existe'] > 0) {
        throw new Exception("Ya existe un horario para $dia_semana a las $hora");
    }
    
    // Insertar el horario
    $sql = "INSERT INTO horarios_tratamiento (
                tratamiento_id, usuario_id, remedio_global_id, dia_semana, hora, dosis, activo
            ) VALUES (
                $programacion_id, $usuario_id, $remedio_global_id, '$dia_semana', '$hora', 
                " . ($dosis ? "'$dosis'" : "NULL") . ", $activo
            )";
    
    if (!$conn->query($sql)) {
        throw new Exception("Error al crear horario: " . $conn->error);
    }
    
    echo json_encode([
        "success" => true,
        "horario_id" => $conn->insert_id,
        "message" => "Horario creado exitosamente",
        "horario" => [
            "programacion_id" => $programacion_id,
            "dia_semana" => $dia_semana,
            "hora" => $hora,
            "dosis" => $dosis,
            "activo" => $activo
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 
