<?php
echo "<h2>🧪 Test API Confirmar Toma</h2>";

// Obtener el registro ID más reciente pendiente
require_once 'smart_pill_api/conexion.php';

$sql_pendiente = "SELECT registro_id FROM registro_tomas WHERE estado = 'pendiente' ORDER BY registro_id DESC LIMIT 1";
$result = $conn->query($sql_pendiente);

if ($result->num_rows > 0) {
    $registro = $result->fetch_assoc();
    $registro_id = $registro['registro_id'];
    
    echo "<p><strong>Probando con Registro ID:</strong> $registro_id</p>";
    
    // Datos para enviar
    $data = [
        'registro_id' => $registro_id,
        'estado' => 'tomada',
        'observaciones' => 'Prueba desde test_api_confirmar.php'
    ];
    
    echo "<h3>📤 Datos enviados:</h3>";
    echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
    
    // Hacer la petición PUT
    $url = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php";
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'PUT',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result_api = file_get_contents($url, false, $context);
    
    echo "<h3>📥 Respuesta de la API:</h3>";
    echo "<pre style='background: #f8f9fa; padding: 10px; border-radius: 4px;'>" . htmlspecialchars($result_api) . "</pre>";
    
    // Verificar el estado después de la actualización
    echo "<h3>🔍 Verificación después de la actualización:</h3>";
    $sql_verificar = "SELECT * FROM registro_tomas WHERE registro_id = $registro_id";
    $result_verificar = $conn->query($sql_verificar);
    
    if ($result_verificar->num_rows > 0) {
        $registro_actualizado = $result_verificar->fetch_assoc();
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'><th>Campo</th><th>Valor</th></tr>";
        foreach ($registro_actualizado as $campo => $valor) {
            $color = ($campo === 'estado' && $valor === 'tomada') ? 'background: #d4edda;' : '';
            echo "<tr style='$color'><td>$campo</td><td>$valor</td></tr>";
        }
        echo "</table>";
    }
    
} else {
    echo "<p style='color: red;'>❌ No se encontraron registros pendientes</p>";
    echo "<p><a href='crear_datos_minimos.php' style='background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Crear Datos de Prueba</a></p>";
}

echo "<p><a href='debug_confirmar_toma.php' style='background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🔍 Ver Debug</a></p>";
?>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
}
table {
    width: 100%;
    margin: 10px 0;
}
th, td {
    padding: 8px;
    text-align: left;
}
th {
    background: #f0f0f0;
}
pre {
    overflow-x: auto;
}
</style>
