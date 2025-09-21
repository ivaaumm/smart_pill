<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data) {
        throw new Exception("Datos JSON inválidos");
    }
    
    if (!isset($data->accion) || empty($data->accion)) {
        throw new Exception("Acción requerida: crear, actualizar, eliminar, obtener");
    }
    
    $accion = strtolower($data->accion);
    
    switch ($accion) {
        case 'crear':
            crearHorario($conn, $data);
            break;
        case 'actualizar':
            actualizarHorario($conn, $data);
            break;
        case 'eliminar':
            eliminarHorario($conn, $data);
            break;
        case 'obtener':
            obtenerHorarios($conn, $data);
            break;
        default:
            throw new Exception("Acción inválida. Debe ser: crear, actualizar, eliminar, obtener");
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

function crearHorario($conn, $data) {
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
        throw new Exception("Día de la semana inválido: $dia_semana");
    }
    
    // Validar formato de hora
    if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $hora)) {
        throw new Exception("Formato de hora inválido: $hora. Use formato HH:MM:SS");
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
        "message" => "Horario creado exitosamente"
    ]);
}

function actualizarHorario($conn, $data) {
    if (!isset($data->horario_id) || empty($data->horario_id)) {
        throw new Exception("ID de horario requerido");
    }
    
    $horario_id = intval($data->horario_id);
    $updates = [];
    
    // Campos que se pueden actualizar
    if (isset($data->dia_semana)) {
        $dia_semana = strtolower($conn->real_escape_string($data->dia_semana));
        $dias_validos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        if (!in_array($dia_semana, $dias_validos)) {
            throw new Exception("Día de la semana inválido: $dia_semana");
        }
        $updates[] = "dia_semana = '$dia_semana'";
    }
    
    if (isset($data->hora)) {
        $hora = $conn->real_escape_string($data->hora);
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $hora)) {
            throw new Exception("Formato de hora inválido: $hora");
        }
        $updates[] = "hora = '$hora'";
    }
    
    if (isset($data->dosis)) {
        $dosis = $conn->real_escape_string($data->dosis);
        $updates[] = "dosis = " . ($dosis ? "'$dosis'" : "NULL");
    }
    
    if (isset($data->activo)) {
        $activo = intval($data->activo);
        $updates[] = "activo = $activo";
    }
    
    if (empty($updates)) {
        throw new Exception("No se proporcionaron campos para actualizar");
    }
    
    $sql = "UPDATE horarios_tratamiento SET " . implode(", ", $updates) . " WHERE horario_id = $horario_id";
    
    if (!$conn->query($sql)) {
        throw new Exception("Error al actualizar horario: " . $conn->error);
    }
    
    if ($conn->affected_rows == 0) {
        throw new Exception("Horario no encontrado");
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Horario actualizado exitosamente"
    ]);
}

function eliminarHorario($conn, $data) {
    if (!isset($data->horario_id) || empty($data->horario_id)) {
        throw new Exception("ID de horario requerido");
    }
    
    $horario_id = intval($data->horario_id);
    
    $sql = "DELETE FROM horarios_tratamiento WHERE horario_id = $horario_id";
    
    if (!$conn->query($sql)) {
        throw new Exception("Error al eliminar horario: " . $conn->error);
    }
    
    if ($conn->affected_rows == 0) {
        throw new Exception("Horario no encontrado");
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Horario eliminado exitosamente"
    ]);
}

function obtenerHorarios($conn, $data) {
    $programacion_id = isset($data->programacion_id) ? intval($data->programacion_id) : null;
    $usuario_id = isset($data->usuario_id) ? intval($data->usuario_id) : null;
    
    $sql = "SELECT 
                ht.horario_id,
                ht.tratamiento_id,
                ht.usuario_id,
                ht.remedio_global_id,
                ht.dia_semana,
                ht.hora,
                ht.dosis,
                ht.activo,
                ht.fecha_creacion,
                pt.nombre_tratamiento,
                rg.nombre_comercial
            FROM horarios_tratamiento ht
            LEFT JOIN programacion_tratamientos pt ON ht.tratamiento_id = pt.programacion_id
            LEFT JOIN remedio_global rg ON ht.remedio_global_id = rg.remedio_global_id
            WHERE 1=1";
    
    if ($programacion_id !== null) {
        $sql .= " AND ht.tratamiento_id = $programacion_id";
    }
    if ($usuario_id !== null) {
        $sql .= " AND ht.usuario_id = $usuario_id";
    }
    
    $sql .= " ORDER BY FIELD(ht.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), ht.hora";
    
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }
    
    $horarios = [];
    while($row = $res->fetch_assoc()) {
        $horarios[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $horarios,
        "total" => count($horarios)
    ]);
}

$conn->close();
?> 
