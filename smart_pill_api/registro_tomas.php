<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "conexion.php";

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            registrarToma($conn);
            break;
        case 'GET':
            obtenerRegistros($conn);
            break;
        case 'PUT':
            actualizarEstadoToma($conn);
            break;
        default:
            throw new Exception("Método no permitido");
    }
    
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

// Función para registrar una nueva toma
function registrarToma($conn) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data) {
        throw new Exception("Datos JSON inválidos");
    }
    
    $usuario_id = intval($data->usuario_id ?? 0);
    $horario_id = intval($data->horario_id ?? 0);
    $estado = $conn->real_escape_string($data->estado ?? 'pendiente');
    $observaciones = $conn->real_escape_string($data->observaciones ?? '');
    
    if ($usuario_id <= 0 || $horario_id <= 0) {
        throw new Exception("Usuario ID y Horario ID son requeridos");
    }
    
    // Validar estado
    $estados_validos = ['pendiente', 'tomada', 'rechazada', 'pospuesta'];
    if (!in_array($estado, $estados_validos)) {
        throw new Exception("Estado inválido");
    }
    
    // Obtener información del horario
    $sql_horario = "SELECT ht.*, pt.programacion_id, pt.dosis_por_toma 
                    FROM horarios_tratamiento ht 
                    JOIN programacion_tratamientos pt ON ht.tratamiento_id = pt.programacion_id 
                    WHERE ht.horario_id = $horario_id AND ht.usuario_id = $usuario_id";
    
    $res_horario = $conn->query($sql_horario);
    if (!$res_horario || $res_horario->num_rows === 0) {
        throw new Exception("Horario no encontrado");
    }
    
    $horario = $res_horario->fetch_assoc();
    
    // Verificar si ya existe un registro para hoy
    $fecha_hoy = date('Y-m-d');
    $sql_existe = "SELECT registro_id FROM registro_tomas 
                   WHERE usuario_id = $usuario_id 
                   AND horario_id = $horario_id 
                   AND fecha_programada = '$fecha_hoy' 
                   AND es_cambio_estado = 0";
    
    $res_existe = $conn->query($sql_existe);
    if ($res_existe && $res_existe->num_rows > 0) {
        throw new Exception("Ya existe un registro para este horario hoy");
    }
    
    $conn->begin_transaction();
    
    try {
        // Insertar nuevo registro
        $fecha_hora_accion = ($estado !== 'pendiente') ? date('Y-m-d H:i:s') : 'NULL';
        $fecha_hora_accion_sql = ($estado !== 'pendiente') ? "'$fecha_hora_accion'" : 'NULL';
        
        $sql_insert = "INSERT INTO registro_tomas (
                        usuario_id, horario_id, remedio_global_id, programacion_id,
                        fecha_programada, hora_programada, fecha_hora_accion, estado,
                        dosis_programada, observaciones, es_cambio_estado
                      ) VALUES (
                        $usuario_id, $horario_id, {$horario['remedio_global_id']}, {$horario['programacion_id']},
                        '$fecha_hoy', '{$horario['hora']}', $fecha_hora_accion_sql, '$estado',
                        '{$horario['dosis_por_toma']}', '$observaciones', 0
                      )";
        
        if (!$conn->query($sql_insert)) {
            throw new Exception("Error al registrar toma: " . $conn->error);
        }
        
        $registro_id = $conn->insert_id;
        
        // Si se tomó el medicamento, actualizar inventario
        if ($estado === 'tomada') {
            actualizarInventario($conn, $usuario_id, $horario['remedio_global_id'], 1);
        }
        
        $conn->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Toma registrada exitosamente",
            "registro_id" => $registro_id,
            "estado" => $estado
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

// Función para obtener registros de tomas
function obtenerRegistros($conn) {
    $usuario_id = intval($_GET['usuario_id'] ?? 0);
    $fecha_desde = $_GET['fecha_desde'] ?? date('Y-m-d', strtotime('-30 days'));
    $fecha_hasta = $_GET['fecha_hasta'] ?? date('Y-m-d');
    $estado = $_GET['estado'] ?? '';
    
    if ($usuario_id <= 0) {
        throw new Exception("Usuario ID requerido");
    }
    
    $where_estado = '';
    if (!empty($estado)) {
        $estado = $conn->real_escape_string($estado);
        $where_estado = "AND rt.estado = '$estado'";
    }
    
    $sql = "SELECT 
                rt.*,
                ht.dia_semana,
                ht.hora as hora_tratamiento,
                ht.dosis as dosis_horario,
                pt.nombre_tratamiento,
                rg.nombre_comercial,
                rg.descripcion,
                ro.registro_id as registro_original_id_ref,
                ro.estado as estado_original
            FROM registro_tomas rt
            JOIN horarios_tratamiento ht ON rt.horario_id = ht.horario_id
            JOIN programacion_tratamientos pt ON rt.programacion_id = pt.programacion_id
            JOIN remedios_globales rg ON rt.remedio_global_id = rg.remedio_global_id
            LEFT JOIN registro_tomas ro ON rt.registro_original_id = ro.registro_id
            WHERE rt.usuario_id = $usuario_id 
            AND rt.fecha_programada BETWEEN '$fecha_desde' AND '$fecha_hasta'
            $where_estado
            ORDER BY rt.fecha_programada DESC, rt.hora_programada DESC, rt.fecha_creacion DESC";
    
    $result = $conn->query($sql);
    if (!$result) {
        throw new Exception("Error al obtener registros: " . $conn->error);
    }
    
    $registros = [];
    while ($row = $result->fetch_assoc()) {
        $registros[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "registros" => $registros,
        "total" => count($registros)
    ]);
}

// Función para actualizar estado de una toma (especialmente para pospuestas)
function actualizarEstadoToma($conn) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data) {
        throw new Exception("Datos JSON inválidos");
    }
    
    $registro_id = intval($data->registro_id ?? 0);
    $nuevo_estado = $conn->real_escape_string($data->estado ?? '');
    $observaciones = $conn->real_escape_string($data->observaciones ?? '');
    
    if ($registro_id <= 0) {
        throw new Exception("Registro ID requerido");
    }
    
    // Validar estado
    $estados_validos = ['tomada', 'rechazada', 'pospuesta'];
    if (!in_array($nuevo_estado, $estados_validos)) {
        throw new Exception("Estado inválido");
    }
    
    // Obtener registro actual
    $sql_actual = "SELECT * FROM registro_tomas WHERE registro_id = $registro_id";
    $res_actual = $conn->query($sql_actual);
    if (!$res_actual || $res_actual->num_rows === 0) {
        throw new Exception("Registro no encontrado");
    }
    
    $registro_actual = $res_actual->fetch_assoc();
    
    // Si el estado actual es 'pospuesta' y se cambia a 'tomada' o 'rechazada'
    // crear un nuevo registro como cambio de estado
    if ($registro_actual['estado'] === 'pospuesta' && in_array($nuevo_estado, ['tomada', 'rechazada'])) {
        $conn->begin_transaction();
        
        try {
            // Crear nuevo registro como cambio de estado
            $fecha_hora_accion = date('Y-m-d H:i:s');
            
            $sql_nuevo = "INSERT INTO registro_tomas (
                            usuario_id, horario_id, remedio_global_id, programacion_id,
                            fecha_programada, hora_programada, fecha_hora_accion, estado,
                            estado_anterior, dosis_programada, observaciones, es_cambio_estado,
                            registro_original_id
                          ) VALUES (
                            {$registro_actual['usuario_id']}, {$registro_actual['horario_id']}, 
                            {$registro_actual['remedio_global_id']}, {$registro_actual['programacion_id']},
                            '{$registro_actual['fecha_programada']}', '{$registro_actual['hora_programada']}', 
                            '$fecha_hora_accion', '$nuevo_estado', 'pospuesta',
                            '{$registro_actual['dosis_programada']}', '$observaciones', 1, $registro_id
                          )";
            
            if (!$conn->query($sql_nuevo)) {
                throw new Exception("Error al crear registro de cambio: " . $conn->error);
            }
            
            $nuevo_registro_id = $conn->insert_id;
            
            // Si se tomó el medicamento, actualizar inventario
            if ($nuevo_estado === 'tomada') {
                actualizarInventario($conn, $registro_actual['usuario_id'], $registro_actual['remedio_global_id'], 1);
            }
            
            $conn->commit();
            
            echo json_encode([
                "success" => true,
                "message" => "Estado actualizado exitosamente",
                "registro_original_id" => $registro_id,
                "nuevo_registro_id" => $nuevo_registro_id,
                "estado_anterior" => 'pospuesta',
                "estado_nuevo" => $nuevo_estado
            ]);
            
        } catch (Exception $e) {
            $conn->rollback();
            throw $e;
        }
    } else {
        // Actualización simple del estado actual
        $fecha_hora_accion = date('Y-m-d H:i:s');
        
        $sql_update = "UPDATE registro_tomas SET 
                        estado = '$nuevo_estado',
                        fecha_hora_accion = '$fecha_hora_accion',
                        observaciones = '$observaciones'
                      WHERE registro_id = $registro_id";
        
        if (!$conn->query($sql_update)) {
            throw new Exception("Error al actualizar registro: " . $conn->error);
        }
        
        // Si se tomó el medicamento, actualizar inventario
        if ($nuevo_estado === 'tomada' && $registro_actual['estado'] !== 'tomada') {
            actualizarInventario($conn, $registro_actual['usuario_id'], $registro_actual['remedio_global_id'], 1);
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Estado actualizado exitosamente",
            "registro_id" => $registro_id,
            "estado_anterior" => $registro_actual['estado'],
            "estado_nuevo" => $nuevo_estado
        ]);
    }
}

// Función auxiliar para actualizar inventario
function actualizarInventario($conn, $usuario_id, $remedio_global_id, $cantidad) {
    // Buscar el remedio_usuario correspondiente
    $sql_remedio = "SELECT remedio_usuario_id, cantidad_actual 
                   FROM remedio_usuario 
                   WHERE usuario_id = $usuario_id 
                   AND remedio_global_id = $remedio_global_id 
                   LIMIT 1";
    
    $res_remedio = $conn->query($sql_remedio);
    if ($res_remedio && $res_remedio->num_rows > 0) {
        $remedio = $res_remedio->fetch_assoc();
        $remedio_usuario_id = $remedio['remedio_usuario_id'];
        $cantidad_actual = $remedio['cantidad_actual'];
        
        // Calcular nueva cantidad
        $nueva_cantidad = max(0, $cantidad_actual - $cantidad);
        
        // Actualizar cantidad en remedio_usuario
        $sql_update_cantidad = "UPDATE remedio_usuario 
                               SET cantidad_actual = $nueva_cantidad 
                               WHERE remedio_usuario_id = $remedio_usuario_id";
        
        if (!$conn->query($sql_update_cantidad)) {
            throw new Exception("Error al actualizar cantidad: " . $conn->error);
        }
        
        // Registrar el movimiento
        $fecha_hora = date('Y-m-d H:i:s');
        $sql_movimiento = "INSERT INTO movimientos_pastillas (
                            remedio_usuario_id, 
                            usuario_id, 
                            fecha_hora, 
                            cantidad_cambiada, 
                            tipo_movimiento
                          ) VALUES (
                            $remedio_usuario_id,
                            $usuario_id,
                            '$fecha_hora',
                            -$cantidad,
                            'toma_medicamento'
                          )";
        
        if (!$conn->query($sql_movimiento)) {
            throw new Exception("Error al registrar movimiento: " . $conn->error);
        }
    }
}
?>