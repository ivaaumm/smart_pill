<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "conexion.php";

try {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data) {
        throw new Exception("Datos JSON inválidos");
    }
    
    // Validar campos requeridos
    $campos_requeridos = ['usuario_id', 'hora_inicio', 'repeticion_tipo'];
    foreach ($campos_requeridos as $campo) {
        if (!isset($data->$campo)) {
            throw new Exception("Campo requerido faltante: $campo");
        }
    }
    
    $usuario_id = intval($data->usuario_id);
    $tratamiento_id = isset($data->tratamiento_id) ? intval($data->tratamiento_id) : null;
    $remedio_global_id = isset($data->remedio_global_id) ? intval($data->remedio_global_id) : null;
    $dosis = $conn->real_escape_string($data->dosis ?? '');
    $nombre_alarma = $conn->real_escape_string($data->nombre_alarma ?? '');
    $hora_inicio = $conn->real_escape_string($data->hora_inicio);
    $fecha_inicio = $conn->real_escape_string($data->fecha_inicio ?? date('Y-m-d'));
    $repeticion_tipo = $conn->real_escape_string($data->repeticion_tipo);
    $repeticion_intervalo = intval($data->repeticion_intervalo ?? 1);
    $dias_semana = $conn->real_escape_string($data->dias_semana ?? '');
    $fecha_fin = $conn->real_escape_string($data->fecha_fin ?? null);
    $activo = intval($data->activo ?? 1);
    
    // Validar que el usuario existe
    $sql_usuario = "SELECT usuario_id FROM usuarios WHERE usuario_id = $usuario_id";
    $res_usuario = $conn->query($sql_usuario);
    if (!$res_usuario || $res_usuario->num_rows === 0) {
        throw new Exception("Usuario no encontrado");
    }
    
    // Validar que el tratamiento existe si se proporciona
    if ($tratamiento_id) {
        $sql_tratamiento = "SELECT programacion_id FROM programacion_tratamientos WHERE programacion_id = $tratamiento_id AND usuario_id = $usuario_id";
        $res_tratamiento = $conn->query($sql_tratamiento);
        if (!$res_tratamiento || $res_tratamiento->num_rows === 0) {
            throw new Exception("Tratamiento no encontrado o no pertenece al usuario");
        }
    }
    
    // Validar que el remedio existe si se proporciona
    if ($remedio_global_id) {
        $sql_remedio = "SELECT remedio_global_id FROM remedio_global WHERE remedio_global_id = $remedio_global_id";
        $res_remedio = $conn->query($sql_remedio);
        if (!$res_remedio || $res_remedio->num_rows === 0) {
            throw new Exception("Remedio no encontrado");
        }
    }
    
    // Validar formato de hora
    if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $hora_inicio)) {
        throw new Exception("Formato de hora inválido. Use HH:MM");
    }
    
    // Validar tipo de repetición
    $tipos_validos = ['diaria', 'semanal', 'mensual', 'una_vez'];
    if (!in_array($repeticion_tipo, $tipos_validos)) {
        throw new Exception("Tipo de repetición inválido");
    }
    
    // Si es semanal, validar días de la semana
    if ($repeticion_tipo === 'semanal' && empty($dias_semana)) {
        throw new Exception("Para repetición semanal, debe especificar días de la semana");
    }
    
    // Insertar la alarma
    $sql = "INSERT INTO alarmas (
                usuario_id, 
                tratamiento_id, 
                remedio_global_id, 
                dosis, 
                nombre_alarma, 
                hora_inicio, 
                fecha_inicio, 
                repeticion_tipo, 
                repeticion_intervalo, 
                dias_semana, 
                fecha_fin, 
                activo, 
                estado
            ) VALUES (
                $usuario_id,
                " . ($tratamiento_id ? $tratamiento_id : "NULL") . ",
                " . ($remedio_global_id ? $remedio_global_id : "NULL") . ",
                '$dosis',
                '$nombre_alarma',
                '$hora_inicio',
                '$fecha_inicio',
                '$repeticion_tipo',
                $repeticion_intervalo,
                '$dias_semana',
                " . ($fecha_fin ? "'$fecha_fin'" : "NULL") . ",
                $activo,
                'pendiente'
            )";
    
    if (!$conn->query($sql)) {
        throw new Exception("Error al crear la alarma: " . $conn->error);
    }
    
    $alarma_id = $conn->insert_id;
    
    // Obtener la alarma creada con información completa
    $sql_alarma = "SELECT 
                        a.*,
                        pt.nombre_tratamiento,
                        rg.nombre_comercial,
                        rg.descripcion,
                        rg.presentacion
                    FROM alarmas a
                    LEFT JOIN programacion_tratamientos pt ON a.tratamiento_id = pt.programacion_id
                    LEFT JOIN remedio_global rg ON a.remedio_global_id = rg.remedio_global_id
                    WHERE a.alarma_id = $alarma_id";
    
    $res_alarma = $conn->query($sql_alarma);
    $alarma_creada = $res_alarma->fetch_assoc();
    
    echo json_encode([
        "success" => true,
        "message" => "Alarma creada exitosamente",
        "alarma_id" => $alarma_id,
        "data" => $alarma_creada
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "debug_info" => [
            "php_version" => PHP_VERSION,
            "timestamp" => date('Y-m-d H:i:s')
        ]
    ]);
}

$conn->close();
?> 
