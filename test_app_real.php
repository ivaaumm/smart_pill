<?php
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

echo "<h2>🔍 Test de la App Real - Simulando Peticiones</h2>";

// 1. Simular la petición de confirmación de toma que hace la app
echo "<h3>1. Simulando confirmación de toma (PUT)</h3>";

$registro_id = 894; // El registro que vimos en la BD
$data = [
    'registro_id' => $registro_id,
    'estado' => 'tomada',
    'observaciones' => 'Confirmado desde test - ' . date('Y-m-d H:i:s')
];

$url = 'http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'User-Agent: TestApp/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p><strong>URL:</strong> $url</p>";
echo "<p><strong>Método:</strong> PUT</p>";
echo "<p><strong>Datos enviados:</strong> " . json_encode($data, JSON_PRETTY_PRINT) . "</p>";
echo "<p><strong>Código HTTP:</strong> $httpCode</p>";
echo "<p><strong>Respuesta:</strong></p>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

// 2. Verificar el estado en la BD después de la confirmación
echo "<hr><h3>2. Verificando estado en BD después de confirmación</h3>";

$url_get = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=1&fecha_desde=2025-09-18&fecha_hasta=2025-09-19";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url_get);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response_get = curl_exec($ch);
curl_close($ch);

echo "<p><strong>URL GET:</strong> $url_get</p>";
echo "<p><strong>Respuesta:</strong></p>";
echo "<pre>" . htmlspecialchars($response_get) . "</pre>";

// 3. Analizar los datos
echo "<hr><h3>3. Análisis de los datos</h3>";

$data_parsed = json_decode($response_get, true);
if ($data_parsed && isset($data_parsed['registros'])) {
    echo "<p><strong>Total de registros encontrados:</strong> " . count($data_parsed['registros']) . "</p>";
    
    foreach ($data_parsed['registros'] as $registro) {
        if ($registro['registro_id'] == $registro_id) {
            echo "<div style='border: 2px solid #4CAF50; padding: 10px; margin: 10px 0;'>";
            echo "<h4>📋 Registro ID: {$registro['registro_id']}</h4>";
            echo "<p><strong>Estado:</strong> {$registro['estado']}</p>";
            echo "<p><strong>Fecha programada:</strong> {$registro['fecha_programada']}</p>";
            echo "<p><strong>Hora programada:</strong> {$registro['hora_programada']}</p>";
            echo "<p><strong>Fecha/hora acción:</strong> {$registro['fecha_hora_accion']}</p>";
            echo "<p><strong>Observaciones:</strong> {$registro['observaciones']}</p>";
            echo "<p><strong>Medicamento:</strong> {$registro['nombre_comercial']}</p>";
            echo "</div>";
            break;
        }
    }
} else {
    echo "<p style='color: red;'>❌ No se pudieron obtener los registros o estructura incorrecta</p>";
}

// 4. Verificar logs del debug endpoint
echo "<hr><h3>4. Verificando logs del endpoint de debug</h3>";

$debug_url = "http://192.168.1.87/smart_pill/debug_peticiones_app.php?show_logs=1";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $debug_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$debug_response = curl_exec($ch);
curl_close($ch);

echo "<p><strong>URL Debug:</strong> $debug_url</p>";
echo "<p><strong>Respuesta del debug:</strong></p>";
echo "<pre>" . htmlspecialchars($debug_response) . "</pre>";

echo "<hr><p><em>Test completado a las " . date('Y-m-d H:i:s') . "</em></p>";
?>
