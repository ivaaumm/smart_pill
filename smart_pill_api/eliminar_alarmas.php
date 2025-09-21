<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, POST, OPTIONS");
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
    
    // Eliminar la alarma
    $sql_delete = "DELETE FROM alarmas WHERE alarma_id = $alarma_id";
    
    if (!$conn->query($sql_delete)) {
        throw new Exception("Error al eliminar la alarma: " . $conn->error);
    }
    
    if ($conn->affected_rows === 0) {
        throw new Exception("No se pudo eliminar la alarma");
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Alarma eliminada exitosamente",
        "alarma_id" => $alarma_id
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
