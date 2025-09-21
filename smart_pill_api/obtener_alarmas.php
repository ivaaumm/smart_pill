<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, X-Requested-With");

require_once 'conexion.php';

// Manejar solicitudes OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$programacion_id = $_GET['programacion_id'] ?? null;

if (!$programacion_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'ID de programación no proporcionado'
    ]);
    exit;
}

try {
    // Obtener las alarmas para la programación específica
    $stmt = $conn->prepare("
        SELECT 
            a.*,
            ph.hora as horario_programado
        FROM alarmas a
        LEFT JOIN programacion_horarios ph ON a.horario_id = ph.horario_id
        WHERE a.programacion_id = ?
        ORDER BY a.hora
    ");
    
    $stmt->bind_param('i', $programacion_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $alarmas = $result->fetch_all(MYSQLI_ASSOC);
    
    // Formatear los días de la semana para el frontend
    $alarmas_formateadas = array_map(function($alarma) {
        return [
            'id' => (int)$alarma['alarma_id'],
            'hora' => $alarma['hora'],
            'dias' => array_map('intval', explode(',', $alarma['dias_semana'])),
            'activa' => (bool)$alarma['activa'],
            'sonido' => $alarma['sonido'],
            'vibrar' => (bool)$alarma['vibrar'],
            'horario_id' => $alarma['horario_id'] ? (int)$alarma['horario_id'] : null,
            'programacion_id' => (int)$alarma['programacion_id'],
            'fecha_creacion' => $alarma['fecha_creacion'],
            'fecha_actualizacion' => $alarma['fecha_actualizacion'],
            'horario_programado' => $alarma['horario_programado']
        ];
    }, $alarmas);
    
    echo json_encode([
        'success' => true,
        'data' => $alarmas_formateadas,
        'count' => count($alarmas_formateadas)
    ]);
    
} catch (mysqli_sql_exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener las alarmas: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
