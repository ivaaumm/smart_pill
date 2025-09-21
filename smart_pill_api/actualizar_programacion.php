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
    
    $programacion_id = intval($data->programacion_id);
    
    if ($programacion_id <= 0) {
        throw new Exception("ID de programación inválido");
    }
    
    // Verificar que la programación existe
    $sql_check = "SELECT programacion_id, nombre_tratamiento, estado FROM programacion_tratamientos WHERE programacion_id = $programacion_id";
    $res_check = $conn->query($sql_check);
    
    if (!$res_check || $res_check->num_rows == 0) {
        throw new Exception("Programación no encontrada");
    }
    
    $programacion = $res_check->fetch_assoc();
    $estado_actual = $programacion['estado'];
    
    // Construir la consulta de actualización
    $updates = [];
    
    // Campos que se pueden actualizar
    if (isset($data->estado)) {
        $estado = $conn->real_escape_string($data->estado);
        $estados_validos = ['activo', 'pausado', 'completado'];
        if (!in_array($estado, $estados_validos)) {
            throw new Exception("Estado inválido. Debe ser: " . implode(', ', $estados_validos));
        }
        $updates[] = "estado = '$estado'";
    }
    
    if (isset($data->nombre_tratamiento)) {
        $nombre_tratamiento = $conn->real_escape_string($data->nombre_tratamiento);
        $updates[] = "nombre_tratamiento = '$nombre_tratamiento'";
    }
    
    if (isset($data->fecha_inicio)) {
        $fecha_inicio = $conn->real_escape_string($data->fecha_inicio);
        if (strtotime($fecha_inicio) === false) {
            throw new Exception("Formato de fecha de inicio inválido");
        }
        $updates[] = "fecha_inicio = '$fecha_inicio'";
    }
    
    if (isset($data->fecha_fin)) {
        $fecha_fin = $conn->real_escape_string($data->fecha_fin);
        if (strtotime($fecha_fin) === false) {
            throw new Exception("Formato de fecha de fin inválido");
        }
        $updates[] = "fecha_fin = '$fecha_fin'";
    }
    
    if (isset($data->dosis_por_toma)) {
        $dosis_por_toma = $conn->real_escape_string($data->dosis_por_toma);
        $updates[] = "dosis_por_toma = " . ($dosis_por_toma ? "'$dosis_por_toma'" : "NULL");
    }
    
    if (isset($data->observaciones)) {
        $observaciones = $conn->real_escape_string($data->observaciones);
        $updates[] = "observaciones = " . ($observaciones ? "'$observaciones'" : "NULL");
    }
    
    if (empty($updates)) {
        throw new Exception("No se proporcionaron campos para actualizar");
    }
    
    // Actualizar la programación
    $sql = "UPDATE programacion_tratamientos SET " . implode(", ", $updates) . " WHERE programacion_id = $programacion_id";
    
    if (!$conn->query($sql)) {
        throw new Exception("Error al actualizar programación: " . $conn->error);
    }
    
    if ($conn->affected_rows == 0) {
        throw new Exception("No se pudo actualizar la programación");
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Programación actualizada exitosamente",
        "programacion_actualizada" => [
            "programacion_id" => $programacion_id,
            "estado_anterior" => $estado_actual,
            "campos_actualizados" => array_keys($data)
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 
