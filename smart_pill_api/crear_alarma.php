<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");

require_once 'conexion.php';

// Manejar solicitudes OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Validar datos de entrada
if (!isset($data['programacion_id']) || !isset($data['hora']) || !isset($data['dias_semana'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Faltan campos requeridos: programacion_id, hora, dias_semana'
    ]);
    exit;
}

try {
    $conn->beginTransaction();
    
    // Insertar la alarma
    $stmt = $conn->prepare("
        INSERT INTO alarmas (programacion_id, horario_id, hora, dias_semana, activa, sonido, vibrar)
        VALUES (:programacion_id, :horario_id, :hora, :dias_semana, :activa, :sonido, :vibrar)
    ");
    
    $stmt->execute([
        ':programacion_id' => $data['programacion_id'],
        ':horario_id' => $data['horario_id'] ?? null,
        ':hora' => $data['hora'],
        ':dias_semana' => $data['dias_semana'],
        ':activa' => $data['activa'] ?? 1,
        ':sonido' => $data['sonido'] ?? 'default',
        ':vibrar' => $data['vibrar'] ?? 1
    ]);
    
    $alarma_id = $conn->lastInsertId();
    
    // Actualizar flag en programacion_tratamientos
    $stmt = $conn->prepare("
        UPDATE programacion_tratamientos 
        SET tiene_alarmas = 1 
        WHERE programacion_id = :programacion_id
    ");
    $stmt->execute([':programacion_id' => $data['programacion_id']]);
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'alarma_id' => $alarma_id,
        'message' => 'Alarma creada correctamente'
    ]);
    
} catch (PDOException $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al crear la alarma: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
