<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Función para logging
function logDebug($message, $data = null) {
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[$timestamp] $message";
    if ($data !== null) {
        $logMessage .= " | Data: " . json_encode($data);
    }
    error_log($logMessage);
}

logDebug("🔄 Iniciando actualizar_observaciones.php");
logDebug("📡 Método HTTP", $_SERVER['REQUEST_METHOD']);
logDebug("📡 Headers recibidos", getallheaders());

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    logDebug("✅ Respondiendo a preflight OPTIONS");
    http_response_code(200);
    exit();
}

include 'conexion.php';

try {
    // Solo permitir método PUT
    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
        logDebug("❌ Método no permitido", $_SERVER['REQUEST_METHOD']);
        throw new Exception("Método no permitido. Use PUT.");
    }

    // Obtener datos JSON del cuerpo de la petición
    $input = file_get_contents("php://input");
    logDebug("📥 Input recibido", $input);
    
    $data = json_decode($input, true);
    logDebug("📦 Datos decodificados", $data);

    if (!$data) {
        logDebug("❌ Error al decodificar JSON");
        throw new Exception("Datos JSON inválidos");
    }

    // Validar parámetros requeridos
    $registro_id = intval($data['registro_id'] ?? 0);
    $observaciones = trim($data['observaciones'] ?? '');

    logDebug("🔍 Parámetros validados", [
        'registro_id' => $registro_id,
        'observaciones' => $observaciones,
        'observaciones_length' => strlen($observaciones)
    ]);

    if ($registro_id <= 0) {
        logDebug("❌ ID de registro inválido", $registro_id);
        throw new Exception("ID de registro inválido");
    }

    // Escapar caracteres especiales para prevenir SQL injection
    $observaciones_escaped = $conn->real_escape_string($observaciones);
    logDebug("🔒 Observaciones escapadas", $observaciones_escaped);

    // Verificar que el registro existe
    $sql_verificar = "SELECT registro_id, usuario_id, estado FROM registro_tomas WHERE registro_id = $registro_id";
    logDebug("🔍 SQL verificación", $sql_verificar);
    
    $result_verificar = $conn->query($sql_verificar);

    if (!$result_verificar || $result_verificar->num_rows === 0) {
        logDebug("❌ Registro no encontrado", $registro_id);
        throw new Exception("Registro no encontrado");
    }

    $registro = $result_verificar->fetch_assoc();
    logDebug("✅ Registro encontrado", $registro);

    // Actualizar las observaciones
    $sql_actualizar = "UPDATE registro_tomas 
                       SET observaciones = '$observaciones_escaped',
                           fecha_actualizacion = CURRENT_TIMESTAMP
                       WHERE registro_id = $registro_id";

    logDebug("🔄 SQL actualización", $sql_actualizar);

    if (!$conn->query($sql_actualizar)) {
        logDebug("❌ Error en query de actualización", $conn->error);
        throw new Exception("Error al actualizar observaciones: " . $conn->error);
    }

    $affected_rows = $conn->affected_rows;
    logDebug("📊 Filas afectadas", $affected_rows);

    // Nota: affected_rows puede ser 0 si el valor no cambió, y eso es normal
    // No consideramos esto como un error

    // Obtener el registro actualizado
    $sql_obtener = "SELECT rt.*, rg.nombre_comercial, rg.descripcion
                    FROM registro_tomas rt
                    LEFT JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id
                    WHERE rt.registro_id = $registro_id";
    
    logDebug("🔍 SQL obtener registro", $sql_obtener);
    
    $result_obtener = $conn->query($sql_obtener);
    $registro_actualizado = $result_obtener->fetch_assoc();
    
    logDebug("📦 Registro actualizado obtenido", $registro_actualizado);

    // Respuesta exitosa
    $response = [
        "success" => true,
        "message" => "Observaciones actualizadas exitosamente",
        "data" => [
            "registro_id" => $registro_id,
            "observaciones" => $observaciones,
            "affected_rows" => $affected_rows,
            "registro" => $registro_actualizado
        ]
    ];
    
    logDebug("✅ Respuesta exitosa", $response);
    echo json_encode($response);

} catch (Exception $e) {
    logDebug("💥 Error capturado", [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    
    http_response_code(400);
    $error_response = [
        "success" => false,
        "error" => $e->getMessage()
    ];
    
    logDebug("❌ Respuesta de error", $error_response);
    echo json_encode($error_response);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
    logDebug("🏁 Finalizando actualizar_observaciones.php");
}
?>