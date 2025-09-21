<?php
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Confirmar Toma</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
        .success { background-color: #d4edda; }
        .error { background-color: #f8d7da; }
        pre { background-color: #f8f9fa; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Test de Confirmación de Toma</h1>
    
    <?php
    // Primero obtener registros existentes
    echo "<h2>1. Obteniendo registros existentes</h2>";
    
    $url = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=1";
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json'
        ]
    ]);
    
    $response = file_get_contents($url, false, $context);
    
    if ($response === FALSE) {
        echo "<div class='test error'>Error al obtener registros</div>";
    } else {
        $data = json_decode($response, true);
        echo "<div class='test'>";
        echo "<h3>Respuesta GET registros:</h3>";
        echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
        
        if ($data['success'] && !empty($data['registros'])) {
            $registro = $data['registros'][0]; // Tomar el primer registro
            $registro_id = $registro['registro_id'];
            
            echo "<h2>2. Intentando confirmar toma del registro ID: $registro_id</h2>";
            
            // Datos para confirmar la toma
            $confirmData = [
                'registro_id' => $registro_id,
                'estado' => 'tomada',
                'observaciones' => 'Confirmado desde test'
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
                
                // Verificar el cambio obteniendo registros nuevamente
                echo "<h2>3. Verificando cambio en la base de datos</h2>";
                $verifyResponse = file_get_contents($url, false, $context);
                
                if ($verifyResponse !== FALSE) {
                    $verifyData = json_decode($verifyResponse, true);
                    echo "<div class='test'>";
                    echo "<h3>Registros después del cambio:</h3>";
                    echo "<pre>" . json_encode($verifyData, JSON_PRETTY_PRINT) . "</pre>";
                    echo "</div>";
                }
            }
        } else {
            echo "<div class='test error'>No se encontraron registros para probar</div>";
        }
        echo "</div>";
    }
    ?>
</body>
</html>
