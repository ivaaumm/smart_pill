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
    
    if (!isset($data->alarma_id)) {
        throw new Exception("ID de alarma requerido");
    }
    
    $alarma_id = intval($data->alarma_id);
    $usuario_id = intval($data->usuario_id ?? 0);
    $estado = $conn->real_escape_string($data->estado ?? 'tomada'); // tomada, omitida
    $observaciones = $conn->real_escape_string($data->observaciones ?? '');
    $fecha_toma = $conn->real_escape_string($data->fecha_toma ?? date('Y-m-d H:i:s'));
    
    // Validar estado
    $estados_validos = ['tomada', 'omitida'];
    if (!in_array($estado, $estados_validos)) {
        throw new Exception("Estado inválido. Debe ser 'tomada' u 'omitida'");
    }
    
    // Verificar que la alarma existe y pertenece al usuario
    $sql_verificar = "SELECT alarma_id, remedio_global_id, dosis FROM alarmas WHERE alarma_id = $alarma_id";
    if ($usuario_id > 0) {
        $sql_verificar .= " AND usuario_id = $usuario_id";
    }
    
    $res_verificar = $conn->query($sql_verificar);
    if (!$res_verificar || $res_verificar->num_rows === 0) {
        throw new Exception("Alarma no encontrada o no autorizada");
    }
    
    $alarma = $res_verificar->fetch_assoc();
    
    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // Actualizar el estado de la alarma
        $sql_update = "UPDATE alarmas SET estado = '$estado' WHERE alarma_id = $alarma_id";
        
        if (!$conn->query($sql_update)) {
            throw new Exception("Error al actualizar la alarma: " . $conn->error);
        }
        
        // Si se tomó el medicamento, registrar el movimiento
        if ($estado === 'tomada' && $alarma['remedio_global_id']) {
            // Buscar el remedio_usuario correspondiente
            $sql_remedio = "SELECT remedio_usuario_id, cantidad_actual 
                           FROM remedio_usuario 
                           WHERE usuario_id = $usuario_id 
                           AND remedio_global_id = {$alarma['remedio_global_id']} 
                           LIMIT 1";
            
            $res_remedio = $conn->query($sql_remedio);
            if ($res_remedio && $res_remedio->num_rows > 0) {
                $remedio = $res_remedio->fetch_assoc();
                $remedio_usuario_id = $remedio['remedio_usuario_id'];
                $cantidad_actual = $remedio['cantidad_actual'];
                
                // Calcular nueva cantidad (asumiendo que se toma 1 unidad por defecto)
                $cantidad_tomada = 1; // Se puede hacer configurable
                $nueva_cantidad = max(0, $cantidad_actual - $cantidad_tomada);
                
                // Actualizar cantidad en remedio_usuario
                $sql_update_cantidad = "UPDATE remedio_usuario 
                                       SET cantidad_actual = $nueva_cantidad 
                                       WHERE remedio_usuario_id = $remedio_usuario_id";
                
                if (!$conn->query($sql_update_cantidad)) {
                    throw new Exception("Error al actualizar cantidad: " . $conn->error);
                }
                
                // Registrar el movimiento
                $sql_movimiento = "INSERT INTO movimientos_pastillas (
                                    remedio_usuario_id, 
                                    usuario_id, 
                                    fecha_hora, 
                                    cantidad_cambiada, 
                                    tipo_movimiento
                                  ) VALUES (
                                    $remedio_usuario_id,
                                    $usuario_id,
                                    '$fecha_toma',
                                    -$cantidad_tomada,
                                    'toma_medicamento'
                                  )";
                
                if (!$conn->query($sql_movimiento)) {
                    throw new Exception("Error al registrar movimiento: " . $conn->error);
                }
            }
        }
        
        // Confirmar transacción
        $conn->commit();
        
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
            "message" => "Toma confirmada exitosamente",
            "alarma_id" => $alarma_id,
            "estado" => $estado,
            "data" => $alarma_actualizada
        ]);
        
    } catch (Exception $e) {
        // Revertir transacción en caso de error
        $conn->rollback();
        throw $e;
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
?> 
