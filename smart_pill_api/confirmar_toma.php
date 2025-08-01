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
    if (!isset($data->alarma_id) || empty($data->alarma_id)) {
        throw new Exception("ID de alarma requerido");
    }
    if (!isset($data->estado) || empty($data->estado)) {
        throw new Exception("Estado requerido (tomada/omitida)");
    }
    
    $alarma_id = intval($data->alarma_id);
    $estado = $conn->real_escape_string($data->estado);
    
    // Validar que el estado sea válido
    if (!in_array($estado, ['tomada', 'omitida'])) {
        throw new Exception("Estado inválido. Debe ser 'tomada' u 'omitida'");
    }

    // Actualizar el estado de la alarma
    $sql = "UPDATE alarmas SET estado = '$estado' WHERE alarma_id = $alarma_id";
            
    if ($conn->query($sql)) {
        if ($conn->affected_rows > 0) {
            // Si se confirmó como tomada, registrar el movimiento
            if ($estado == 'tomada' && isset($data->remedio_global_id)) {
                $remedio_global_id = intval($data->remedio_global_id);
                $usuario_id = isset($data->usuario_id) ? intval($data->usuario_id) : null;
                $dosis = isset($data->dosis) ? $conn->real_escape_string($data->dosis) : null;
                
                if ($usuario_id) {
                    // Buscar el remedio_usuario_id correspondiente
                    $sql_remedio = "SELECT remedio_usuario_id FROM remedio_usuario 
                                   WHERE usuario_id = $usuario_id AND remedio_global_id = $remedio_global_id 
                                   LIMIT 1";
                    $res_remedio = $conn->query($sql_remedio);
                    
                    if ($res_remedio && $res_remedio->num_rows > 0) {
                        $row_remedio = $res_remedio->fetch_assoc();
                        $remedio_usuario_id = $row_remedio['remedio_usuario_id'];
                        
                        // Registrar el movimiento de toma
                        $sql_movimiento = "INSERT INTO movimientos_pastillas (
                            remedio_usuario_id, usuario_id, fecha_hora, cantidad_cambiada, 
                            peso_medido, tipo_movimiento
                        ) VALUES (
                            $remedio_usuario_id, $usuario_id, NOW(), -1, NULL, 'toma_confirmada'
                        )";
                        
                        $conn->query($sql_movimiento);
                    }
                }
            }
            
            echo json_encode(["success" => true, "message" => "Estado actualizado correctamente"]);
        } else {
            throw new Exception("No se encontró la alarma especificada");
        }
    } else {
        throw new Exception("Error en la base de datos: " . $conn->error);
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 