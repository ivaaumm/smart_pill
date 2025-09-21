<?php
echo "=== PROBANDO ENDPOINT PUT DIRECTAMENTE ===\n";

$data = json_encode([
    'registro_id' => 908,
    'estado' => 'tomada',
    'observaciones' => 'Test directo desde script PHP'
]);

echo "Datos a enviar: $data\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $http_code\n";
echo "Response: $response\n";

// Verificar el estado actual en la base de datos
include 'smart_pill_api/conexion.php';
$result = $conn->query("SELECT * FROM registro_tomas WHERE registro_id = 908");
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "\nEstado actual en BD:\n";
    echo "- ID: {$row['registro_id']}\n";
    echo "- Estado: {$row['estado']}\n";
    echo "- Observaciones: {$row['observaciones']}\n";
    echo "- Fecha actualización: {$row['fecha_actualizacion']}\n";
}
$conn->close();
?>