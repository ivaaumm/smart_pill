<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");

require_once 'conexion.php';

// Manejar solicitudes OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$alarma_id = $_GET['alarma_id'] ?? null;

if (!$alarma_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'ID de alarma no proporcionado'
    ]);
    exit;
}

try {
    $conn->beginTransaction();
    
    // 1. Obtener el programacion_id para actualizar el flag después
    $stmt = $conn->prepare("
        SELECT programacion_id FROM alarmas WHERE alarma_id = :alarma_id
    ");
    $stmt->execute([':alarma_id' => $alarma_id]);
    $programacion_id = $stmt->fetchColumn();
    
    if (!$programacion_id) {
        throw new Exception('No se encontró la alarma especificada');
    }
    
    // 2. Eliminar la alarma
    $stmt = $conn->prepare("DELETE FROM alarmas WHERE alarma_id = :alarma_id");
    $stmt->execute([':alarma_id' => $alarma_id]);
    
    // 3. Verificar si quedan alarmas para este tratamiento
    $stmt = $conn->prepare("
        SELECT COUNT(*) FROM alarmas WHERE programacion_id = :programacion_id
    ");
    $stmt->execute([':programacion_id' => $programacion_id]);
    $tiene_alarmas = $stmt->fetchColumn() > 0;
    
    // 4. Actualizar flag en programacion_tratamientos
    $stmt = $conn->prepare("
        UPDATE programacion_tratamientos 
        SET tiene_alarmas = :tiene_alarmas 
        WHERE programacion_id = :programacion_id
    ");
    $stmt->execute([
        ':programacion_id' => $programacion_id,
        ':tiene_alarmas' => $tiene_alarmas ? 1 : 0
    ]);
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Alarma eliminada correctamente'
    ]);
    
} catch (Exception $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al eliminar la alarma: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
