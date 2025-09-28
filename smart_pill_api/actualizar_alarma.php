<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");

require_once 'conexion.php';

// Manejar solicitudes OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

// Validar datos de entrada
if (!isset($data['alarma_id']) || !isset($data['hora']) || !isset($data['dias_semana'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Faltan campos requeridos: alarma_id, hora, dias_semana'
    ]);
    exit;
}

try {
    // Actualizar la alarma
    $stmt = $conn->prepare("
        UPDATE alarmas 
        SET hora = :hora,
            dias_semana = :dias_semana,
            activa = :activa,
            sonido = :sonido,
            vibrar = :vibrar,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE alarma_id = :alarma_id
    ");
    
    $result = $stmt->execute([
        ':alarma_id' => $data['alarma_id'],
        ':hora' => $data['hora'],
        ':dias_semana' => $data['dias_semana'],
        ':activa' => $data['activa'] ?? 1,
        ':sonido' => $data['sonido'] ?? 'default',
        ':vibrar' => $data['vibrar'] ?? 1
    ]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Alarma actualizada correctamente'
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'No se encontró la alarma o no hubo cambios que actualizar'
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al actualizar la alarma: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
