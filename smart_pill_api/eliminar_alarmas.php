<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "conexion.php";

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        throw new Exception("Método no permitido");
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Datos JSON inválidos");
    }

    $usuario_id = intval($input['usuario_id']);
    $programacion_id = intval($input['programacion_id']);
    $alarma_id = isset($input['alarma_id']) ? intval($input['alarma_id']) : null;
    
    if ($usuario_id <= 0 || $programacion_id <= 0) {
        throw new Exception("IDs inválidos");
    }

    // Verificar que la programación existe y pertenece al usuario
    $sql_verificar = "SELECT programacion_id FROM programacion_tratamientos 
                      WHERE programacion_id = $programacion_id AND usuario_id = $usuario_id";
    $res_verificar = $conn->query($sql_verificar);
    
    if (!$res_verificar || $res_verificar->num_rows === 0) {
        throw new Exception("Programación no encontrada o no autorizada");
    }

    if ($alarma_id) {
        // Eliminar alarma específica
        $sql_delete = "DELETE FROM alarmas 
                       WHERE alarma_id = $alarma_id 
                       AND usuario_id = $usuario_id 
                       AND tratamiento_id = $programacion_id";
    } else {
        // Eliminar todas las alarmas de la programación
        $sql_delete = "DELETE FROM alarmas 
                       WHERE usuario_id = $usuario_id 
                       AND tratamiento_id = $programacion_id";
    }
    
    if ($conn->query($sql_delete)) {
        $alarmas_eliminadas = $conn->affected_rows;
        echo json_encode([
            "success" => true,
            "message" => "Se eliminaron $alarmas_eliminadas alarmas",
            "alarmas_eliminadas" => $alarmas_eliminadas
        ]);
    } else {
        throw new Exception("Error al eliminar alarmas: " . $conn->error);
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 