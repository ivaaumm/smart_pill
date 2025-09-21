<?php
// Test con usuarios reales
header("Content-Type: text/html; charset=UTF-8");

echo "<h2>Test Login con Usuarios Reales</h2>";

// Test 1: Usuario existente con contraseña incorrecta
echo "<h3>Test 1: Usuario 'nahir' con contraseña incorrecta</h3>";
$data = json_encode(["usuario" => "nahir", "password" => "contraseña_incorrecta"]);
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $data
    ]
]);

$result = file_get_contents('http://192.168.1.87/smart_pill/smart_pill_api/login.php', false, $context);
echo "<p><strong>Datos enviados:</strong> " . htmlspecialchars($data) . "</p>";
echo "<p><strong>Respuesta:</strong> " . htmlspecialchars($result) . "</p>";

// Test 2: Email existente con contraseña incorrecta
echo "<h3>Test 2: Email 'nahirailin1234@gmail.com' con contraseña incorrecta</h3>";
$data2 = json_encode(["usuario" => "nahirailin1234@gmail.com", "password" => "contraseña_incorrecta"]);
$context2 = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $data2
    ]
]);

$result2 = file_get_contents('http://192.168.1.87/smart_pill/smart_pill_api/login.php', false, $context2);
echo "<p><strong>Datos enviados:</strong> " . htmlspecialchars($data2) . "</p>";
echo "<p><strong>Respuesta:</strong> " . htmlspecialchars($result2) . "</p>";

// Test 3: Usuario inexistente
echo "<h3>Test 3: Usuario inexistente</h3>";
$data3 = json_encode(["usuario" => "usuario_que_no_existe", "password" => "cualquier_password"]);
$context3 = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => $data3
    ]
]);

$result3 = file_get_contents('http://192.168.1.87/smart_pill/smart_pill_api/login.php', false, $context3);
echo "<p><strong>Datos enviados:</strong> " . htmlspecialchars($data3) . "</p>";
echo "<p><strong>Respuesta:</strong> " . htmlspecialchars($result3) . "</p>";

?>
