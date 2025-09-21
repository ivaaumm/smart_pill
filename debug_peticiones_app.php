<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener información de la petición
$method = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();
$body = file_get_contents('php://input');
$query_params = $_GET;
$timestamp = date('Y-m-d H:i:s');

// Crear log de la petición
$log_entry = [
    'timestamp' => $timestamp,
    'method' => $method,
    'url' => $_SERVER['REQUEST_URI'],
    'headers' => $headers,
    'query_params' => $query_params,
    'body' => $body,
    'body_decoded' => json_decode($body, true),
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
];

// Guardar en archivo de log
$log_file = 'debug_peticiones.log';
file_put_contents($log_file, json_encode($log_entry, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND | LOCK_EX);

// Responder según el método
switch ($method) {
    case 'GET':
        echo json_encode([
            'success' => true,
            'message' => 'Debug endpoint - GET recibido',
            'timestamp' => $timestamp,
            'data' => [
                'query_params' => $query_params,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
            ]
        ]);
        break;
        
    case 'POST':
        echo json_encode([
            'success' => true,
            'message' => 'Debug endpoint - POST recibido',
            'timestamp' => $timestamp,
            'received_data' => json_decode($body, true),
            'content_length' => strlen($body)
        ]);
        break;
        
    case 'PUT':
        $data = json_decode($body, true);
        echo json_encode([
            'success' => true,
            'message' => 'Debug endpoint - PUT recibido para confirmación de toma',
            'timestamp' => $timestamp,
            'received_data' => $data,
            'registro_id' => $data['registro_id'] ?? 'No especificado',
            'estado' => $data['estado'] ?? 'No especificado',
            'observaciones' => $data['observaciones'] ?? 'Sin observaciones'
        ]);
        break;
        
    default:
        echo json_encode([
            'success' => true,
            'message' => "Debug endpoint - Método $method recibido",
            'timestamp' => $timestamp
        ]);
        break;
}

// Mostrar información adicional si se accede desde navegador
if (isset($_GET['show_logs'])) {
    echo "<h2>🔍 Debug de Peticiones de la App</h2>";
    echo "<p><strong>Última petición:</strong> $timestamp</p>";
    echo "<p><strong>Método:</strong> $method</p>";
    echo "<p><strong>URL:</strong> " . $_SERVER['REQUEST_URI'] . "</p>";
    
    if (file_exists($log_file)) {
        echo "<h3>📋 Últimas 5 peticiones:</h3>";
        $logs = file_get_contents($log_file);
        $log_entries = explode("\n\n", trim($logs));
        $recent_logs = array_slice($log_entries, -5);
        
        foreach (array_reverse($recent_logs) as $log) {
            if (!empty($log)) {
                $entry = json_decode($log, true);
                if ($entry) {
                    echo "<div style='background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 4px;'>";
                    echo "<strong>Timestamp:</strong> " . $entry['timestamp'] . "<br>";
                    echo "<strong>Método:</strong> " . $entry['method'] . "<br>";
                    echo "<strong>URL:</strong> " . $entry['url'] . "<br>";
                    if (!empty($entry['body_decoded'])) {
                        echo "<strong>Datos:</strong> <pre>" . json_encode($entry['body_decoded'], JSON_PRETTY_PRINT) . "</pre>";
                    }
                    echo "</div>";
                }
            }
        }
    }
    
    echo "<p><a href='?show_logs=1'>🔄 Actualizar</a></p>";
}
?>
