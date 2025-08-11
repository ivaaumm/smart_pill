<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST, OPTIONS");
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
    
    if (!isset($data->alarma_id)) {
        throw new Exception("ID de alarma requerido");
    }
    
    $alarma_id = intval($data->alarma_id);
    $usuario_id = intval($data->usuario_id ?? 0);
    
    // Verificar que la alarma existe y pertenece al usuario
    $sql_verificar = "SELECT alarma_id FROM alarmas WHERE alarma_id = $alarma_id";
    if ($usuario_id > 0) {
        $sql_verificar .= " AND usuario_id = $usuario_id";
    }
    
    $res_verificar = $conn->query($sql_verificar);
    if (!$res_verificar || $res_verificar->num_rows === 0) {
        throw new Exception("Alarma no encontrada o no autorizada");
    }
    
    // Construir la consulta de actualización dinámicamente
    $campos_actualizar = [];
    $valores = [];
    
    // Campos que se pueden actualizar
    $campos_permitidos = [
        'tratamiento_id', 'remedio_global_id', 'dosis', 'nombre_alarma',
        'hora_inicio', 'fecha_inicio', 'repeticion_tipo', 'repeticion_intervalo',
        'dias_semana', 'fecha_fin', 'activo', 'estado'
    ];
    
    foreach ($campos_permitidos as $campo) {
        if (isset($data->$campo)) {
            $campos_actualizar[] = "$campo = ?";
            
            if ($campo === 'tratamiento_id' || $campo === 'remedio_global_id' || 
                $campo === 'repeticion_intervalo' || $campo === 'activo') {
                $valor = intval($data->$campo);
                if ($valor === 0 && $data->$campo !== 0) {
                    $valores[] = null; // NULL para valores 0 que no son válidos
                } else {
                    $valores[] = $valor;
                }
            } else {
                $valores[] = $conn->real_escape_string($data->$campo);
            }
        }
    }
    
    if (empty($campos_actualizar)) {
        throw new Exception("No hay campos para actualizar");
    }
    
    // Validaciones específicas
    if (isset($data->hora_inicio)) {
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $data->hora_inicio)) {
            throw new Exception("Formato de hora inválido. Use HH:MM");
        }
    }
    
    if (isset($data->repeticion_tipo)) {
        $tipos_validos = ['diaria', 'semanal', 'mensual', 'una_vez'];
        if (!in_array($data->repeticion_tipo, $tipos_validos)) {
            throw new Exception("Tipo de repetición inválido");
        }
    }
    
    if (isset($data->estado)) {
        $estados_validos = ['pendiente', 'tomada', 'omitida'];
        if (!in_array($data->estado, $estados_validos)) {
            throw new Exception("Estado inválido");
        }
    }
    
    // Construir la consulta SQL
    $sql = "UPDATE alarmas SET " . implode(', ', $campos_actualizar) . " WHERE alarma_id = $alarma_id";
    
    // Preparar y ejecutar la consulta
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Error preparando la consulta: " . $conn->error);
    }
    
    // Vincular parámetros
    $tipos = str_repeat('s', count($valores)); // Todos como string por ahora
    $stmt->bind_param($tipos, ...$valores);
    
    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando la actualización: " . $stmt->error);
    }
    
    if ($stmt->affected_rows === 0) {
        throw new Exception("No se realizaron cambios en la alarma");
    }
    
    // Obtener la alarma actualizada
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
    $alarma_actualizada = $res_alarma->fetch_assoc();
    
    echo json_encode([
        "success" => true,
        "message" => "Alarma actualizada exitosamente",
        "alarma_id" => $alarma_id,
        "data" => $alarma_actualizada
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