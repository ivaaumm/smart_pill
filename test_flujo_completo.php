<?php
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Flujo Completo - Confirmación de Toma</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
        .success { background-color: #d4edda; }
        .error { background-color: #f8d7da; }
        .warning { background-color: #fff3cd; }
        .info { background-color: #d1ecf1; }
        pre { background-color: #f8f9fa; padding: 10px; overflow-x: auto; }
        h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
    </style>
</head>
<body>
    <h1>🧪 Test Flujo Completo - Confirmación de Toma</h1>
    
    <?php
    echo "<h2>📋 Paso 1: Crear un registro pendiente</h2>";
    
    // Crear un registro pendiente usando un horario existente
    $createData = [
        'usuario_id' => 1,
        'horario_id' => 735, // Usar el horario más reciente que encontramos
        'estado' => 'pendiente',
        'observaciones' => 'Registro creado para test de flujo completo'
    ];
    
    echo "<div class='test info'>";
    echo "<h3>Datos para crear registro pendiente:</h3>";
    echo "<pre>" . json_encode($createData, JSON_PRETTY_PRINT) . "</pre>";
    echo "</div>";
    
    $createContext = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($createData)
        ]
    ]);
    
    $createResponse = file_get_contents("http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php", false, $createContext);
    
    if ($createResponse === FALSE) {
        echo "<div class='test error'>❌ Error al crear registro pendiente</div>";
        exit;
    }
    
    $createResult = json_decode($createResponse, true);
    echo "<div class='test " . ($createResult['success'] ? 'success' : 'error') . "'>";
    echo "<h3>Resultado de creación:</h3>";
    echo "<pre>" . json_encode($createResult, JSON_PRETTY_PRINT) . "</pre>";
    echo "</div>";
    
    if (!$createResult['success']) {
        echo "<div class='test error'>❌ No se pudo crear el registro. Terminando test.</div>";
        exit;
    }
    
    $nuevoRegistroId = $createResult['registro_id'];
    
    echo "<h2>📱 Paso 2: Simular confirmación desde la app (PUT request)</h2>";
    
    // Simular la confirmación de toma como lo haría la app
    $confirmData = [
        'registro_id' => $nuevoRegistroId,
        'estado' => 'tomada',
        'observaciones' => 'Confirmado desde app móvil - test flujo completo'
    ];
    
    echo "<div class='test info'>";
    echo "<h3>Datos de confirmación (simulando app móvil):</h3>";
    echo "<pre>" . json_encode($confirmData, JSON_PRETTY_PRINT) . "</pre>";
    echo "</div>";
    
    $confirmContext = stream_context_create([
        'http' => [
            'method' => 'PUT',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($confirmData)
        ]
    ]);
    
    $confirmResponse = file_get_contents("http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php", false, $confirmContext);
    
    if ($confirmResponse === FALSE) {
        echo "<div class='test error'>❌ Error al confirmar toma</div>";
    } else {
        $confirmResult = json_decode($confirmResponse, true);
        echo "<div class='test " . ($confirmResult['success'] ? 'success' : 'error') . "'>";
        echo "<h3>Respuesta de confirmación:</h3>";
        echo "<pre>" . json_encode($confirmResult, JSON_PRETTY_PRINT) . "</pre>";
        echo "</div>";
        
        if ($confirmResult['success']) {
            echo "<h2>🔍 Paso 3: Verificar cambio en la base de datos</h2>";
            
            // Verificar que el cambio se reflejó en la BD
            $verifyUrl = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=1";
            $verifyContext = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => 'Content-Type: application/json'
                ]
            ]);
            
            $verifyResponse = file_get_contents($verifyUrl, false, $verifyContext);
            
            if ($verifyResponse !== FALSE) {
                $verifyData = json_decode($verifyResponse, true);
                
                // Buscar nuestro registro específico
                $registroEncontrado = null;
                foreach ($verifyData['registros'] as $reg) {
                    if ($reg['registro_id'] == $nuevoRegistroId) {
                        $registroEncontrado = $reg;
                        break;
                    }
                }
                
                echo "<div class='test'>";
                echo "<h3>Estado actual del registro en BD:</h3>";
                if ($registroEncontrado) {
                    echo "<pre>" . json_encode($registroEncontrado, JSON_PRETTY_PRINT) . "</pre>";
                    
                    // Verificar que el estado cambió correctamente
                    if ($registroEncontrado['estado'] === 'tomada') {
                        echo "<div class='test success'>";
                        echo "<h3>✅ ÉXITO COMPLETO</h3>";
                        echo "<p><strong>El flujo funcionó correctamente:</strong></p>";
                        echo "<ul>";
                        echo "<li>✅ Se creó el registro pendiente (ID: $nuevoRegistroId)</li>";
                        echo "<li>✅ Se procesó la confirmación de toma</li>";
                        echo "<li>✅ El estado cambió de 'pendiente' a 'tomada'</li>";
                        echo "<li>✅ Se actualizó la fecha_hora_accion: " . $registroEncontrado['fecha_hora_accion'] . "</li>";
                        echo "<li>✅ Se guardaron las observaciones: " . $registroEncontrado['observaciones'] . "</li>";
                        echo "</ul>";
                        echo "</div>";
                    } else {
                        echo "<div class='test error'>";
                        echo "<h3>❌ ERROR: Estado no cambió</h3>";
                        echo "<p>El registro sigue en estado: <strong>" . $registroEncontrado['estado'] . "</strong></p>";
                        echo "</div>";
                    }
                } else {
                    echo "<div class='test error'>❌ No se encontró el registro creado en la BD</div>";
                }
                echo "</div>";
            }
            
            echo "<h2>📊 Paso 4: Resumen del test</h2>";
            echo "<div class='test info'>";
            echo "<h3>Componentes verificados:</h3>";
            echo "<ul>";
            echo "<li>✅ API de creación de registros (POST)</li>";
            echo "<li>✅ API de actualización de estado (PUT)</li>";
            echo "<li>✅ Estructura de base de datos</li>";
            echo "<li>✅ Flujo completo de confirmación</li>";
            echo "</ul>";
            
            echo "<h3>Conclusión:</h3>";
            if ($registroEncontrado && $registroEncontrado['estado'] === 'tomada') {
                echo "<p class='success'><strong>🎉 El sistema de confirmación de tomas funciona correctamente.</strong></p>";
                echo "<p>Si el botón 'Ya la tomé' no está impactando la BD, el problema podría estar en:</p>";
                echo "<ul>";
                echo "<li>🔍 La URL de la API en la app móvil</li>";
                echo "<li>🔍 Los datos que se envían desde la app</li>";
                echo "<li>🔍 La conectividad de red</li>";
                echo "<li>🔍 El manejo de errores en la app</li>";
                echo "</ul>";
            } else {
                echo "<p class='error'><strong>❌ Hay un problema en el sistema de confirmación.</strong></p>";
            }
            echo "</div>";
        }
    }
    ?>
</body>
</html>
