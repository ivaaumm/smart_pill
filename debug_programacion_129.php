<?php
header("Content-Type: text/html; charset=UTF-8");
include "smart_pill_api/conexion.php";

echo "<h2>🔍 Debug: Programación ID 129</h2>";

// 1. Verificar si existe la programación
echo "<h3>1. Verificar programación 129:</h3>";
$sql_prog = "SELECT * FROM programacion_tratamientos WHERE programacion_id = 129";
$result_prog = $conn->query($sql_prog);

if ($result_prog && $result_prog->num_rows > 0) {
    $prog = $result_prog->fetch_assoc();
    echo "<p>✅ Programación encontrada:</p>";
    echo "<ul>";
    echo "<li>ID: " . $prog['programacion_id'] . "</li>";
    echo "<li>Usuario ID: " . $prog['usuario_id'] . "</li>";
    echo "<li>Medicamento ID: " . $prog['remedio_global_id'] . "</li>";
    echo "<li>Estado: " . $prog['estado'] . "</li>";
    echo "<li>Fecha inicio: " . $prog['fecha_inicio'] . "</li>";
    echo "<li>Fecha fin: " . $prog['fecha_fin'] . "</li>";
    echo "</ul>";
} else {
    echo "<p>❌ Programación 129 NO encontrada</p>";
}

// 2. Verificar registros de toma
echo "<h3>2. Verificar registros de toma para programación 129:</h3>";
$sql_reg = "SELECT * FROM registro_tomas WHERE programacion_id = 129 ORDER BY fecha_programada DESC, hora_programada DESC";
$result_reg = $conn->query($sql_reg);

if ($result_reg && $result_reg->num_rows > 0) {
    echo "<p>✅ Registros encontrados: " . $result_reg->num_rows . "</p>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID</th><th>Usuario</th><th>Estado</th><th>Fecha</th><th>Hora</th><th>Observaciones</th></tr>";
    
    while ($reg = $result_reg->fetch_assoc()) {
        $color = $reg['estado'] == 'pendiente' ? 'orange' : ($reg['estado'] == 'tomada' ? 'green' : 'red');
        echo "<tr style='color: $color;'>";
        echo "<td>" . $reg['registro_id'] . "</td>";
        echo "<td>" . $reg['usuario_id'] . "</td>";
        echo "<td>" . $reg['estado'] . "</td>";
        echo "<td>" . $reg['fecha_programada'] . "</td>";
        echo "<td>" . $reg['hora_programada'] . "</td>";
        echo "<td>" . ($reg['observaciones'] ?? 'N/A') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ NO hay registros para programación 129</p>";
}

// 3. Buscar programaciones activas del usuario 1
echo "<h3>3. Programaciones activas del usuario 1:</h3>";
$sql_activas = "SELECT programacion_id, remedio_global_id, estado, fecha_inicio, fecha_fin 
                FROM programacion_tratamientos 
                WHERE usuario_id = 1 AND estado = 'activo' 
                ORDER BY programacion_id DESC 
                LIMIT 10";
$result_activas = $conn->query($sql_activas);

if ($result_activas && $result_activas->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Programación ID</th><th>Medicamento ID</th><th>Estado</th><th>Fecha Inicio</th><th>Fecha Fin</th></tr>";
    
    while ($activa = $result_activas->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $activa['programacion_id'] . "</td>";
        echo "<td>" . $activa['remedio_global_id'] . "</td>";
        echo "<td>" . $activa['estado'] . "</td>";
        echo "<td>" . $activa['fecha_inicio'] . "</td>";
        echo "<td>" . $activa['fecha_fin'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No hay programaciones activas para usuario 1</p>";
}

// 4. Probar el endpoint directamente
echo "<h3>4. Probar endpoint obtener_registro_pendiente.php:</h3>";
echo "<p>Simulando llamada al endpoint...</p>";

$url = "http://localhost/smart_pill/smart_pill_api/obtener_registro_pendiente.php";
$data = json_encode([
    'programacion_id' => 129,
    'usuario_id' => 1
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    echo "<p style='color: red;'>❌ Error cURL: $curl_error</p>";
} else {
    echo "<p>HTTP Code: $http_code</p>";
    echo "<p>Respuesta:</p>";
    echo "<pre style='background: #f0f0f0; padding: 10px;'>" . htmlspecialchars($response) . "</pre>";
}

$conn->close();
?>