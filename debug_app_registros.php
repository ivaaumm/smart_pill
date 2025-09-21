<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Debug App Registros</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .highlight { background-color: yellow; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Debug: Simulando llamadas de la App Móvil</h1>
        
        <?php
        // Simular exactamente lo que hace la app móvil
        $usuario_id = 1; // Cambiar según el usuario que uses en la app
        
        // Calcular fechas como lo hace la app (7 días antes y después)
        $fecha_actual = new DateTime();
        $fecha_desde = clone $fecha_actual;
        $fecha_desde->modify('-7 days');
        $fecha_hasta = clone $fecha_actual;
        $fecha_hasta->modify('+7 days');
        
        $fecha_desde_str = $fecha_desde->format('Y-m-d');
        $fecha_hasta_str = $fecha_hasta->format('Y-m-d');
        
        echo "<div class='section info'>";
        echo "<h3>📅 Parámetros de la consulta (como la app móvil):</h3>";
        echo "<p><strong>Usuario ID:</strong> $usuario_id</p>";
        echo "<p><strong>Fecha desde:</strong> $fecha_desde_str</p>";
        echo "<p><strong>Fecha hasta:</strong> $fecha_hasta_str</p>";
        echo "<p><strong>URL completa:</strong> http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=$usuario_id&fecha_desde=$fecha_desde_str&fecha_hasta=$fecha_hasta_str</p>";
        echo "</div>";
        
        // Hacer la llamada exacta
        $url = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=$usuario_id&fecha_desde=$fecha_desde_str&fecha_hasta=$fecha_hasta_str";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "<div class='section'>";
        echo "<h3>📡 Respuesta de la API:</h3>";
        echo "<p><strong>Código HTTP:</strong> $http_code</p>";
        echo "<pre>" . htmlspecialchars($response) . "</pre>";
        echo "</div>";
        
        // Decodificar y analizar
        $data = json_decode($response, true);
        
        if ($data) {
            echo "<div class='section " . ($data['success'] ? 'success' : 'error') . "'>";
            echo "<h3>📊 Análisis de la respuesta:</h3>";
            echo "<p><strong>Success:</strong> " . ($data['success'] ? 'true' : 'false') . "</p>";
            
            if (isset($data['registros'])) {
                echo "<p><strong>Total de registros:</strong> " . count($data['registros']) . "</p>";
                
                if (count($data['registros']) > 0) {
                    echo "<h4>🔍 Registros encontrados:</h4>";
                    echo "<table>";
                    echo "<tr><th>ID</th><th>Usuario</th><th>Fecha Prog.</th><th>Hora Prog.</th><th>Estado</th><th>Medicamento</th><th>Dosis</th></tr>";
                    
                    foreach ($data['registros'] as $registro) {
                        $highlight_class = '';
                        if ($registro['estado'] == 'pendiente') {
                            $highlight_class = 'class="highlight"';
                        }
                        
                        echo "<tr $highlight_class>";
                        echo "<td>" . $registro['registro_id'] . "</td>";
                        echo "<td>" . $registro['usuario_id'] . "</td>";
                        echo "<td>" . $registro['fecha_programada'] . "</td>";
                        echo "<td>" . $registro['hora_programada'] . "</td>";
                        echo "<td><strong>" . $registro['estado'] . "</strong></td>";
                        echo "<td>" . $registro['nombre_medicamento'] . "</td>";
                        echo "<td>" . $registro['dosis_programada'] . "</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                    
                    // Contar por estado
                    $estados = [];
                    foreach ($data['registros'] as $registro) {
                        $estado = $registro['estado'];
                        $estados[$estado] = ($estados[$estado] ?? 0) + 1;
                    }
                    
                    echo "<h4>📈 Resumen por estado:</h4>";
                    foreach ($estados as $estado => $cantidad) {
                        echo "<p><strong>$estado:</strong> $cantidad registros</p>";
                    }
                } else {
                    echo "<p class='highlight'>⚠️ No se encontraron registros para este usuario en el rango de fechas</p>";
                }
            }
            echo "</div>";
        } else {
            echo "<div class='section error'>";
            echo "<h3>❌ Error al decodificar JSON</h3>";
            echo "<p>La respuesta no es un JSON válido</p>";
            echo "</div>";
        }
        
        // Verificar datos directos en la base de datos
        echo "<div class='section info'>";
        echo "<h3>🗄️ Verificación directa en base de datos:</h3>";
        
        try {
            include 'smart_pill_api/conexion.php';
            
            // Consulta directa para ver todos los registros del usuario
            $sql = "SELECT r.*, h.hora as hora_programada, p.fecha_inicio, rg.nombre as nombre_medicamento 
                    FROM registro_tomas r 
                    LEFT JOIN horarios_tratamiento h ON r.horario_id = h.horario_id 
                    LEFT JOIN programacion_tratamientos p ON h.programacion_id = p.programacion_id 
                    LEFT JOIN remedio_global rg ON r.remedio_global_id = rg.remedio_global_id 
                    WHERE r.usuario_id = ? 
                    ORDER BY r.fecha_creacion DESC 
                    LIMIT 10";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                echo "<table>";
                echo "<tr><th>ID</th><th>Usuario</th><th>Estado</th><th>Fecha Creación</th><th>Medicamento</th><th>Hora Prog.</th></tr>";
                
                while ($row = $result->fetch_assoc()) {
                    echo "<tr>";
                    echo "<td>" . $row['registro_id'] . "</td>";
                    echo "<td>" . $row['usuario_id'] . "</td>";
                    echo "<td><strong>" . $row['estado'] . "</strong></td>";
                    echo "<td>" . $row['fecha_creacion'] . "</td>";
                    echo "<td>" . ($row['nombre_medicamento'] ?? 'N/A') . "</td>";
                    echo "<td>" . ($row['hora_programada'] ?? 'N/A') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "<p class='highlight'>⚠️ No hay registros en la base de datos para el usuario $usuario_id</p>";
            }
            
            $stmt->close();
            $conn->close();
            
        } catch (Exception $e) {
            echo "<p class='error'>Error al consultar la base de datos: " . $e->getMessage() . "</p>";
        }
        
        echo "</div>";
        ?>
        
        <div class="section">
            <h3>🔧 Acciones de prueba:</h3>
            <p><a href="crear_datos_minimos.php" target="_blank">🔄 Crear datos de prueba</a></p>
            <p><a href="verificar_datos_usuario.php" target="_blank">👤 Verificar datos del usuario</a></p>
            <p><a href="debug_registros.php" target="_blank">🔍 Debug completo de registros</a></p>
        </div>
    </div>
</body>
</html>
