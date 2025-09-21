<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo "=== TEST SIMPLE ===\n\n";

// 1. Verificar estado actual del registro 894
echo "1. Estado actual del registro 894:\n";
$url_get = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=1&fecha_desde=2025-09-18&fecha_hasta=2025-09-19";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url_get);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response_get = curl_exec($ch);
curl_close($ch);

$data_actual = json_decode($response_get, true);
if ($data_actual && isset($data_actual['registros'])) {
    foreach ($data_actual['registros'] as $registro) {
        if ($registro['registro_id'] == 894) {
            echo "Registro 894 encontrado:\n";
            echo "- Estado: " . $registro['estado'] . "\n";
            echo "- Fecha/hora acción: " . $registro['fecha_hora_accion'] . "\n";
            echo "- Observaciones: " . $registro['observaciones'] . "\n";
            break;
        }
    }
}

echo "\n2. Intentando confirmar toma del registro 894:\n";

// 2. Confirmar toma
$data = [
    'registro_id' => 894,
    'estado' => 'tomada',
    'observaciones' => 'Test confirmación - ' . date('Y-m-d H:i:s')
];

$url = 'http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Respuesta PUT (código $httpCode):\n";
echo $response . "\n";

echo "\n3. Verificando estado después de la confirmación:\n";

// 3. Verificar estado después
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url_get);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response_get2 = curl_exec($ch);
curl_close($ch);

$data_despues = json_decode($response_get2, true);
if ($data_despues && isset($data_despues['registros'])) {
    foreach ($data_despues['registros'] as $registro) {
        if ($registro['registro_id'] == 894) {
            echo "Registro 894 después de confirmación:\n";
            echo "- Estado: " . $registro['estado'] . "\n";
            echo "- Fecha/hora acción: " . $registro['fecha_hora_accion'] . "\n";
            echo "- Observaciones: " . $registro['observaciones'] . "\n";
            break;
        }
    }
}

echo "\n=== FIN TEST ===\n";
?>
