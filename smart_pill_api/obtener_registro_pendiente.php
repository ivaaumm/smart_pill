<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
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
    // Buscar registro pendiente para la programación
    $sql = "SELECT registro_id, usuario_id, programacion_id, estado, fecha_programada, hora_programada, 
                   fecha_hora_accion, observaciones
            FROM registro_tomas 
            WHERE programacion_id = ? ";
    
    $params = [$programacion_id];
    $types = "i";
    
    // Agregar filtro por usuario si se proporciona
    if ($usuario_id) {
        $sql .= " AND usuario_id = ? ";
        $params[] = $usuario_id;
        $types .= "i";
    }
    
    // Priorizar registros pendientes de hoy, luego cualquier pendiente, luego el más reciente
    $sql .= " ORDER BY 
                CASE 
                    WHEN estado = 'pendiente' AND fecha_programada = CURDATE() THEN 1
                    WHEN estado = 'pendiente' THEN 2
                    ELSE 3
                END,
                fecha_programada DESC, 
                hora_programada DESC 
              LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    if ($resultado && $resultado->num_rows > 0) {
        $registro = $resultado->fetch_assoc();
        
        echo json_encode([
            "success" => true,
            "registro_id" => intval($registro['registro_id']),
            "estado" => $registro['estado'],
            "fecha_programada" => $registro['fecha_programada'],
            "hora_programada" => $registro['hora_programada'],
            "es_pendiente" => $registro['estado'] === 'pendiente',
            "es_hoy" => $registro['fecha_programada'] === date('Y-m-d'),
            "mensaje" => $registro['estado'] === 'pendiente' 
                ? "Registro pendiente encontrado" 
                : "Registro encontrado (ya procesado: {$registro['estado']})"
        ]);
        
    } else {
        // No se encontró ningún registro
        echo json_encode([
            "success" => false,
            "error" => "No se encontraron registros para programacion_id: $programacion_id",
            "registro_id" => null,
            "sugerencia" => "Verificar que la programación tenga registros creados"
        ]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Error del servidor: " . $e->getMessage(),
        "debug_info" => [
            "programacion_id" => $programacion_id,
            "usuario_id" => $usuario_id,
            "timestamp" => date('Y-m-d H:i:s')
        ]
    ]);
}

$conn->close();
?>
