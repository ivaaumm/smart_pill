<?php
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Registro Pendiente</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
        .success { background-color: #d4edda; }
        .error { background-color: #f8d7da; }
        .warning { background-color: #fff3cd; }
        pre { background-color: #f8f9fa; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Test de Registro Pendiente</h1>
    
    <?php
    // Obtener registros pendientes
    echo "<h2>1. Obteniendo registros pendientes</h2>";
    
    $url = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=1&estado=pendiente";
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json'
        ]
    ]);
    
    $response = file_get_contents($url, false, $context);
    
    if ($response === FALSE) {
        echo "<div class='test error'>Error al obtener registros pendientes</div>";
    } else {
        $data = json_decode($response, true);
        echo "<div class='test'>";
        echo "<h3>Respuesta GET registros pendientes:</h3>";
        echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
        
        if ($data['success'] && !empty($data['registros'])) {
            $registro = $data['registros'][0]; // Tomar el primer registro pendiente
            $registro_id = $registro['registro_id'];
            
            echo "<h2>2. Confirmando toma del registro pendiente ID: $registro_id</h2>";
            
            // Datos para confirmar la toma
            $confirmData = [
                'registro_id' => intval($registro_id),
                'estado' => 'tomada',
                'observaciones' => 'Confirmado desde test - cambio de pendiente a tomada'
            ];
            
            echo "<div class='test'>";
            echo "<h3>Datos enviados:</h3>";
            echo "<pre>" . json_encode($confirmData, JSON_PRETTY_PRINT) . "</pre>";
            echo "</div>";
            
            // Hacer la petición PUT
            $context = stream_context_create([
                'http' => [
                    'method' => 'PUT',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($confirmData)
                ]
            ]);
            
            $putResponse = file_get_contents("http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php", false, $context);
            
            if ($putResponse === FALSE) {
                echo "<div class='test error'>Error al hacer PUT request</div>";
            } else {
                $putData = json_decode($putResponse, true);
                echo "<div class='test " . ($putData['success'] ? 'success' : 'error') . "'>";
                echo "<h3>Respuesta PUT:</h3>";
                echo "<pre>" . json_encode($putData, JSON_PRETTY_PRINT) . "</pre>";
                echo "</div>";
                
                if ($putData['success']) {
                    // Verificar el cambio obteniendo el registro específico
                    echo "<h2>3. Verificando cambio en la base de datos</h2>";
                    $verifyUrl = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=1";
                    $verifyResponse = file_get_contents($verifyUrl, false, stream_context_create([
                        'http' => [
                            'method' => 'GET',
                            'header' => 'Content-Type: application/json'
                        ]
                    ]));
                    
                    if ($verifyResponse !== FALSE) {
                        $verifyData = json_decode($verifyResponse, true);
                        
                        // Buscar el registro específico
                        $registroActualizado = null;
                        foreach ($verifyData['registros'] as $reg) {
                            if ($reg['registro_id'] == $registro_id) {
                                $registroActualizado = $reg;
                                break;
                            }
                        }
                        
                        echo "<div class='test'>";
                        echo "<h3>Estado del registro después del cambio:</h3>";
                        if ($registroActualizado) {
                            echo "<pre>" . json_encode($registroActualizado, JSON_PRETTY_PRINT) . "</pre>";
                            
                            if ($registroActualizado['estado'] === 'tomada') {
                                echo "<div class='test success'><strong>✅ ÉXITO: El registro cambió correctamente de 'pendiente' a 'tomada'</strong></div>";
                            } else {
                                echo "<div class='test error'><strong>❌ ERROR: El registro no cambió de estado. Estado actual: " . $registroActualizado['estado'] . "</strong></div>";
                            }
                        } else {
                            echo "<div class='test error'>No se encontró el registro actualizado</div>";
                        }
                        echo "</div>";
                    }
                }
            }
        } else {
            echo "<div class='test warning'>No se encontraron registros pendientes para probar. Creando uno...</div>";
            
            // Crear un registro pendiente para probar
            echo "<h2>2. Creando registro pendiente para prueba</h2>";
            
            $createData = [
                'usuario_id' => 1,
                'horario_id' => 532, // Usar un horario existente
                'estado' => 'pendiente',
                'observaciones' => 'Registro creado para test'
            ];
            
            echo "<div class='test'>";
            echo "<h3>Datos para crear registro:</h3>";
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
            
            if ($createResponse !== FALSE) {
                $createResult = json_decode($createResponse, true);
                echo "<div class='test " . ($createResult['success'] ? 'success' : 'error') . "'>";
                echo "<h3>Resultado de creación:</h3>";
                echo "<pre>" . json_encode($createResult, JSON_PRETTY_PRINT) . "</pre>";
                echo "</div>";
            }
        }
        echo "</div>";
    }
    ?>
</body>
</html>
