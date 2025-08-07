<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "conexion.php";

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
        throw new Exception("Método no permitido");
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Datos JSON inválidos");
    }

    $alarma_id = intval($input['alarma_id']);
    $usuario_id = intval($input['usuario_id']);
    $activo = isset($input['activo']) ? intval($input['activo']) : null;
    $sonido = isset($input['sonido']) ? $conn->real_escape_string($input['sonido']) : null;
    $estado = isset($input['estado']) ? $conn->real_escape_string($input['estado']) : null;
    
    if ($alarma_id <= 0 || $usuario_id <= 0) {
        throw new Exception("IDs inválidos");
    }

    // Verificar que la alarma existe y pertenece al usuario
    $sql_verificar = "SELECT alarma_id FROM alarmas 
                      WHERE alarma_id = $alarma_id AND usuario_id = $usuario_id";
    $res_verificar = $conn->query($sql_verificar);
    
    if (!$res_verificar || $res_verificar->num_rows === 0) {
        throw new Exception("Alarma no encontrada o no autorizada");
    }

    // Construir la consulta de actualización
    $updates = [];
    $params = [];
    
    if ($activo !== null) {
        $updates[] = "activo = $activo";
    }
    
    if ($sonido !== null) {
        $updates[] = "sonido = '$sonido'";
    }
    
    if ($estado !== null) {
        $updates[] = "estado = '$estado'";
    }
    
    $updates[] = "fecha_actualizacion = NOW()";
    
    if (empty($updates)) {
        throw new Exception("No hay campos para actualizar");
    }
    
    $sql_update = "UPDATE alarmas SET " . implode(", ", $updates) . 
                  " WHERE alarma_id = $alarma_id AND usuario_id = $usuario_id";
    
    if ($conn->query($sql_update)) {
        if ($conn->affected_rows > 0) {
            echo json_encode([
                "success" => true,
                "message" => "Alarma actualizada correctamente"
            ]);
        } else {
            echo json_encode([
                "success" => true,
                "message" => "No se realizaron cambios"
            ]);
        }
    } else {
        throw new Exception("Error al actualizar alarma: " . $conn->error);
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 