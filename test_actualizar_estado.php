<?php
// Script de prueba para verificar el endpoint de actualización de estado
header("Content-Type: application/json; charset=UTF-8");

echo "<h2>🧪 Test de Actualización de Estado de Toma</h2>";

// Primero, obtener un registro pendiente para probar
include "smart_pill_api/conexion.php";

// Buscar un registro pendiente del usuario 1
$sql_buscar = "SELECT registro_id, usuario_id, estado, fecha_programada, hora_programada 
               FROM registro_tomas 
               WHERE usuario_id = 1 AND estado = 'pendiente' 
               ORDER BY fecha_programada DESC, hora_programada DESC 
               LIMIT 1";

$resultado = $conn->query($sql_buscar);

if ($resultado && $resultado->num_rows > 0) {
    $registro = $resultado->fetch_assoc();
    
    echo "<h3>📋 Registro encontrado para prueba:</h3>";
    echo "<pre>" . json_encode($registro, JSON_PRETTY_PRINT) . "</pre>";
    
    // Preparar datos de prueba
    $test_data = [
        'registro_id' => $registro['registro_id'],
        'estado' => 'tomada',
        'observaciones' => 'Prueba manual desde script de test'
    ];
    
    echo "<h3>📤 Datos que se enviarán:</h3>";
    echo "<pre>" . json_encode($test_data, JSON_PRETTY_PRINT) . "</pre>";
    
    // Hacer la petición PUT al endpoint
    $url = 'http://localhost/smart_pill/smart_pill_api/registro_tomas.php';
    
    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\n",
            'method' => 'PUT',
            'content' => json_encode($test_data)
        ]
    ];
    
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    
    echo "<h3>📥 Respuesta del endpoint:</h3>";
    
    if ($response === FALSE) {
        echo "<p style='color: red;'>❌ Error: No se pudo conectar al endpoint</p>";
        echo "<p>Headers de respuesta:</p>";
        echo "<pre>" . print_r($http_response_header, true) . "</pre>";
    } else {
        $response_data = json_decode($response, true);
        
        if ($response_data) {
            echo "<pre>" . json_encode($response_data, JSON_PRETTY_PRINT) . "</pre>";
            
            if (isset($response_data['success']) && $response_data['success']) {
                echo "<p style='color: green;'>✅ Actualización exitosa!</p>";
                
                // Verificar en la base de datos
                $sql_verificar = "SELECT * FROM registro_tomas WHERE registro_id = " . $registro['registro_id'];
                $resultado_verificar = $conn->query($sql_verificar);
                
                if ($resultado_verificar && $resultado_verificar->num_rows > 0) {
                    $registro_actualizado = $resultado_verificar->fetch_assoc();
                    echo "<h3>🔍 Estado actual en la base de datos:</h3>";
                    echo "<pre>" . json_encode($registro_actualizado, JSON_PRETTY_PRINT) . "</pre>";
                }
            } else {
                echo "<p style='color: red;'>❌ Error en la actualización</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ Respuesta no válida del servidor</p>";
            echo "<p>Respuesta cruda:</p>";
            echo "<pre>" . htmlspecialchars($response) . "</pre>";
        }
    }
    
} else {
    echo "<p style='color: orange;'>⚠️ No se encontraron registros pendientes para el usuario 1</p>";
    
    // Mostrar todos los registros del usuario 1
    $sql_todos = "SELECT registro_id, usuario_id, estado, fecha_programada, hora_programada, observaciones 
                  FROM registro_tomas 
                  WHERE usuario_id = 1 
                  ORDER BY fecha_programada DESC, hora_programada DESC 
                  LIMIT 10";
    
    $resultado_todos = $conn->query($sql_todos);
    
    if ($resultado_todos && $resultado_todos->num_rows > 0) {
        echo "<h3>📋 Últimos 10 registros del usuario 1:</h3>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Estado</th><th>Fecha</th><th>Hora</th><th>Observaciones</th></tr>";
        
        while ($row = $resultado_todos->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['registro_id'] . "</td>";
            echo "<td>" . $row['estado'] . "</td>";
            echo "<td>" . $row['fecha_programada'] . "</td>";
            echo "<td>" . $row['hora_programada'] . "</td>";
            echo "<td>" . ($row['observaciones'] ?: 'Sin observaciones') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    }
}

$conn->close();
?>
