<?php
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Incluir conexión a la base de datos
include_once 'smart_pill_api/conexion.php';

echo "<h1>🔍 Debug - Toma de Medicamentos</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .success { background-color: #d4edda; border-color: #c3e6cb; }
    .error { background-color: #f8d7da; border-color: #f5c6cb; }
    .info { background-color: #d1ecf1; border-color: #bee5eb; }
    .warning { background-color: #fff3cd; border-color: #ffeaa7; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    pre { background-color: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
</style>";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }
    
    echo "<div class='section success'><h2>✅ Conexión a Base de Datos</h2>";
    echo "<p>Conexión exitosa a la base de datos: <strong>$dbname</strong></p></div>";
    
    // 1. Verificar registros pendientes
    echo "<div class='section info'><h2>📋 Registros Pendientes</h2>";
    $sql_pendientes = "SELECT 
                        rt.registro_id,
                        rt.usuario_id,
                        rt.estado,
                        rt.fecha_programada,
                        rt.hora_programada,
                        rg.nombre_comercial,
                        rt.dosis_programada,
                        rt.observaciones
                      FROM registro_tomas rt
                      JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id
                      WHERE rt.estado IN ('pendiente', 'pospuesta')
                      ORDER BY rt.fecha_programada DESC, rt.hora_programada DESC
                      LIMIT 10";
    
    $result = $conn->query($sql_pendientes);
    if ($result && $result->num_rows > 0) {
        echo "<p><strong>Registros pendientes encontrados: {$result->num_rows}</strong></p>";
        echo "<table>";
        echo "<tr><th>ID</th><th>Usuario</th><th>Medicamento</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Dosis</th></tr>";
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>{$row['registro_id']}</td>";
            echo "<td>{$row['usuario_id']}</td>";
            echo "<td>{$row['nombre_comercial']}</td>";
            echo "<td>{$row['fecha_programada']}</td>";
            echo "<td>{$row['hora_programada']}</td>";
            echo "<td><span style='color: " . ($row['estado'] == 'pendiente' ? 'orange' : 'red') . ";'>{$row['estado']}</span></td>";
            echo "<td>{$row['dosis_programada']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p class='warning'>⚠️ No se encontraron registros pendientes</p>";
    }
    echo "</div>";
    
    // 2. Probar actualización de estado
    echo "<div class='section info'><h2>🔄 Prueba de Actualización de Estado</h2>";
    
    // Buscar un registro pendiente para probar
    $sql_test = "SELECT registro_id FROM registro_tomas WHERE estado IN ('pospuesta', 'rechazada', 'omitida') LIMIT 1";
    $result_test = $conn->query($sql_test);
    
    if ($result_test && $result_test->num_rows > 0) {
        $test_record = $result_test->fetch_assoc();
        $test_id = $test_record['registro_id'];
        
        echo "<p>📝 Probando actualización con registro ID: <strong>$test_id</strong></p>";
        
        // Simular datos que envía el frontend
        $test_data = [
            'registro_id' => $test_id,
            'estado' => 'tomada',
            'observaciones' => 'Prueba desde debug script'
        ];
        
        echo "<p><strong>Datos de prueba:</strong></p>";
        echo "<pre>" . json_encode($test_data, JSON_PRETTY_PRINT) . "</pre>";
        
        // Verificar que el registro existe antes de actualizar
        $sql_verify = "SELECT * FROM registro_tomas WHERE registro_id = $test_id";
        $result_verify = $conn->query($sql_verify);
        
        if ($result_verify && $result_verify->num_rows > 0) {
            $record = $result_verify->fetch_assoc();
            echo "<p><strong>Registro encontrado:</strong></p>";
            echo "<table>";
            echo "<tr><th>Campo</th><th>Valor</th></tr>";
            foreach ($record as $key => $value) {
                echo "<tr><td>$key</td><td>$value</td></tr>";
            }
            echo "</table>";
            
            // Intentar actualización
            $fecha_hora_accion = date('Y-m-d H:i:s');
            $sql_update = "UPDATE registro_tomas SET 
                            estado = 'tomada',
                            fecha_hora_accion = '$fecha_hora_accion',
                            observaciones = 'Prueba desde debug script'
                          WHERE registro_id = $test_id";
            
            if ($conn->query($sql_update)) {
                echo "<p class='success'>✅ Actualización exitosa</p>";
                
                // Verificar la actualización
                $result_updated = $conn->query($sql_verify);
                if ($result_updated && $result_updated->num_rows > 0) {
                    $updated_record = $result_updated->fetch_assoc();
                    echo "<p><strong>Registro después de actualización:</strong></p>";
                    echo "<table>";
                    echo "<tr><th>Campo</th><th>Valor Anterior</th><th>Valor Actual</th></tr>";
                    foreach ($updated_record as $key => $value) {
                        $old_value = $record[$key] ?? 'N/A';
                        $color = ($old_value != $value) ? 'color: green; font-weight: bold;' : '';
                        echo "<tr><td>$key</td><td>$old_value</td><td style='$color'>$value</td></tr>";
                    }
                    echo "</table>";
                }
                
                // Revertir cambio para no afectar datos reales
                $sql_revert = "UPDATE registro_tomas SET 
                                estado = 'pendiente',
                                fecha_hora_accion = NULL,
                                observaciones = '{$record['observaciones']}'
                              WHERE registro_id = $test_id";
                $conn->query($sql_revert);
                echo "<p class='info'>🔄 Cambios revertidos para mantener datos originales</p>";
                
            } else {
                echo "<p class='error'>❌ Error en actualización: " . $conn->error . "</p>";
            }
        } else {
            echo "<p class='error'>❌ No se encontró el registro para prueba</p>";
        }
    } else {
        echo "<p class='warning'>⚠️ No hay registros pendientes para probar</p>";
    }
    echo "</div>";
    
    // 3. Verificar estructura de la API
    echo "<div class='section info'><h2>🔧 Verificación de API</h2>";
    echo "<p><strong>Endpoint de actualización:</strong> PUT /smart_pill_api/registro_tomas.php</p>";
    echo "<p><strong>Parámetros esperados:</strong></p>";
    echo "<ul>";
    echo "<li>registro_id (int): ID del registro a actualizar</li>";
    echo "<li>estado (string): 'tomada', 'rechazada', 'pospuesta'</li>";
    echo "<li>observaciones (string): Comentarios adicionales</li>";
    echo "</ul>";
    
    // Verificar si el archivo de API existe
    $api_file = 'smart_pill_api/registro_tomas.php';
    if (file_exists($api_file)) {
        echo "<p class='success'>✅ Archivo de API encontrado: $api_file</p>";
        echo "<p><strong>Tamaño del archivo:</strong> " . filesize($api_file) . " bytes</p>";
        echo "<p><strong>Última modificación:</strong> " . date('Y-m-d H:i:s', filemtime($api_file)) . "</p>";
    } else {
        echo "<p class='error'>❌ Archivo de API no encontrado: $api_file</p>";
    }
    echo "</div>";
    
    // 4. Verificar logs recientes
    echo "<div class='section info'><h2>📊 Actividad Reciente</h2>";
    $sql_recent = "SELECT 
                    rt.registro_id,
                    rt.usuario_id,
                    rt.estado,
                    rt.fecha_hora_accion,
                    rt.observaciones,
                    rg.nombre_comercial
                  FROM registro_tomas rt
                  JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id
                  WHERE rt.fecha_hora_accion IS NOT NULL
                  ORDER BY rt.fecha_hora_accion DESC
                  LIMIT 10";
    
    $result_recent = $conn->query($sql_recent);
    if ($result_recent && $result_recent->num_rows > 0) {
        echo "<p><strong>Últimas acciones registradas:</strong></p>";
        echo "<table>";
        echo "<tr><th>ID</th><th>Usuario</th><th>Medicamento</th><th>Estado</th><th>Fecha/Hora Acción</th><th>Observaciones</th></tr>";
        while ($row = $result_recent->fetch_assoc()) {
            echo "<tr>";
            echo "<td>{$row['registro_id']}</td>";
            echo "<td>{$row['usuario_id']}</td>";
            echo "<td>{$row['nombre_comercial']}</td>";
            echo "<td><span style='color: " . ($row['estado'] == 'tomada' ? 'green' : 'red') . ";'>{$row['estado']}</span></td>";
            echo "<td>{$row['fecha_hora_accion']}</td>";
            echo "<td>{$row['observaciones']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p class='warning'>⚠️ No se encontraron acciones recientes</p>";
    }
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='section error'><h2>❌ Error</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p></div>";
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}

echo "<div class='section info'><h2>📝 Instrucciones de Uso</h2>";
echo "<p>Para probar el flujo completo:</p>";
echo "<ol>";
echo "<li>Abre la aplicación móvil</li>";
echo "<li>Ve a la pantalla de 'Registro de Tomas'</li>";
echo "<li>Busca un medicamento con estado 'Pendiente'</li>";
echo "<li>Presiona 'Marcar como Tomada'</li>";
echo "<li>Revisa los logs en la consola del navegador/app</li>";
echo "<li>Actualiza esta página para ver los cambios</li>";
echo "</ol>";
echo "</div>";
?>
