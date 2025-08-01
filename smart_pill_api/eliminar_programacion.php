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
    $sql_check = "SELECT programacion_id, nombre_tratamiento, usuario_id FROM programacion_tratamientos WHERE programacion_id = $programacion_id";
    $res_check = $conn->query($sql_check);
    
    if (!$res_check || $res_check->num_rows == 0) {
        throw new Exception("Programación no encontrada");
    }
    
    $programacion = $res_check->fetch_assoc();
    $nombre_tratamiento = $programacion['nombre_tratamiento'];
    
    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // 1. Eliminar todos los horarios asociados
        $sql_delete_horarios = "DELETE FROM horarios_tratamiento WHERE tratamiento_id = $programacion_id";
        if (!$conn->query($sql_delete_horarios)) {
            throw new Exception("Error al eliminar horarios: " . $conn->error);
        }
        $horarios_eliminados = $conn->affected_rows;
        
        // 2. Eliminar la programación
        $sql_delete_programacion = "DELETE FROM programacion_tratamientos WHERE programacion_id = $programacion_id";
        if (!$conn->query($sql_delete_programacion)) {
            throw new Exception("Error al eliminar programación: " . $conn->error);
        }
        
        if ($conn->affected_rows == 0) {
            throw new Exception("No se pudo eliminar la programación");
        }
        
        // Confirmar transacción
        $conn->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Programación eliminada exitosamente",
            "programacion_eliminada" => [
                "programacion_id" => $programacion_id,
                "nombre_tratamiento" => $nombre_tratamiento,
                "horarios_eliminados" => $horarios_eliminados
            ]
        ]);
        
    } catch (Exception $e) {
        // Revertir transacción en caso de error
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 