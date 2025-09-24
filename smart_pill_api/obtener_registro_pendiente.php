<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "conexion.php";

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Método no permitido. Use POST."
    ]);
    exit();
}

// Obtener datos JSON
$input = json_decode(file_get_contents("php://input"), true);

// Validar entrada
if (!isset($input['programacion_id'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "programacion_id es requerido"
    ]);
    exit();
}

$programacion_id = intval($input['programacion_id']);
$usuario_id = isset($input['usuario_id']) ? intval($input['usuario_id']) : null;

try {
    // Buscar registros existentes para la programación (solo estados válidos: tomada, pospuesta, omitida)
    $sql = "SELECT registro_id, usuario_id, programacion_id, estado, fecha_programada, hora_programada, 
                   fecha_hora_accion, observaciones
            FROM registro_tomas 
            WHERE programacion_id = ? AND estado IN ('tomada', 'pospuesta', 'omitida')";
    
    $params = [$programacion_id];
    $types = "i";
    
    // Agregar filtro por usuario si se proporciona
    if ($usuario_id !== null) {
        $sql .= " AND usuario_id = ?";
        $params[] = $usuario_id;
        $types .= "i";
    }
    
    // Ordenar por fecha más reciente
    $sql .= " ORDER BY fecha_programada DESC, hora_programada DESC LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $registro = $result->fetch_assoc();
        
        echo json_encode([
            "success" => true,
            "registro_encontrado" => true,
            "registro_id" => intval($registro['registro_id']),
            "usuario_id" => intval($registro['usuario_id']),
            "programacion_id" => intval($registro['programacion_id']),
            "estado" => $registro['estado'],
            "fecha_programada" => $registro['fecha_programada'],
            "hora_programada" => $registro['hora_programada'],
            "fecha_hora_accion" => $registro['fecha_hora_accion'],
            "observaciones" => $registro['observaciones'],
            "es_pendiente" => false, // Ya no existen registros pendientes
            "mensaje" => "Registro encontrado con estado: " . $registro['estado']
        ]);
    } else {
        // No hay registros para esta programación
        echo json_encode([
            "success" => true,
            "registro_encontrado" => false,
            "registro_id" => null,
            "es_pendiente" => false,
            "message" => "No hay registros para esta programación. Los registros se crean automáticamente cuando interactúas con la alarma (tomar, posponer u omitir).",
            "info" => "El sistema ya no mantiene registros pendientes. Los registros se generan únicamente al momento de la interacción del usuario."
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Error del servidor: " . $e->getMessage()
    ]);
}

$conn->close();
?>
