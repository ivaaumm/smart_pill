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
    if (!isset($data->remedio_usuario_id) || empty($data->remedio_usuario_id)) {
        throw new Exception("ID de remedio usuario requerido");
    }
    if (!isset($data->usuario_id) || empty($data->usuario_id)) {
        throw new Exception("ID de usuario requerido");
    }
    if (!isset($data->tipo_movimiento) || empty($data->tipo_movimiento)) {
        throw new Exception("Tipo de movimiento requerido");
    }
    
    $remedio_usuario_id = intval($data->remedio_usuario_id);
    $usuario_id = intval($data->usuario_id);
    $cantidad = isset($data->cantidad_cambiada) ? intval($data->cantidad_cambiada) : 0;
    $peso = isset($data->peso_medido) ? floatval($data->peso_medido) : null;
    $tipo = $conn->real_escape_string($data->tipo_movimiento);

    $sql = "INSERT INTO movimientos_pastillas (remedio_usuario_id, usuario_id, fecha_hora, cantidad_cambiada, peso_medido, tipo_movimiento) 
            VALUES ($remedio_usuario_id, $usuario_id, NOW(), $cantidad, " . ($peso !== null ? $peso : "NULL") . ", '$tipo')";
            
    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "movimiento_id" => $conn->insert_id]);
    } else {
        throw new Exception("Error en la base de datos: " . $conn->error);
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>