<?php
echo "<h2>🔍 Comparación de Datos: API vs App</h2>";

// Obtener datos de la API
$usuario_id = 1;
$fecha_desde = '2025-09-18';
$fecha_hasta = '2025-09-19';

$url = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=$usuario_id&fecha_desde=$fecha_desde&fecha_hasta=$fecha_hasta";

echo "<div style='background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
echo "<h3>📡 Petición a la API</h3>";
echo "<p><strong>URL:</strong> <code>$url</code></p>";
echo "<p><strong>Método:</strong> GET</p>";
echo "<p><strong>Parámetros:</strong></p>";
echo "<ul>";
echo "<li>usuario_id: $usuario_id</li>";
echo "<li>fecha_desde: $fecha_desde</li>";
echo "<li>fecha_hasta: $fecha_hasta</li>";
echo "</ul>";
echo "</div>";

$result = file_get_contents($url);
$data = json_decode($result, true);

echo "<div style='background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
echo "<h3>✅ Respuesta de la API</h3>";
echo "<p><strong>Status:</strong> " . ($data['success'] ? 'Éxito' : 'Error') . "</p>";
echo "<p><strong>Total de registros:</strong> " . ($data['total'] ?? 0) . "</p>";
echo "</div>";

if (isset($data['registros']) && is_array($data['registros'])) {
    echo "<h3>📋 Registros encontrados:</h3>";
    
    foreach ($data['registros'] as $index => $registro) {
        $registro_id = $registro['registro_id'];
        $medicamento = $registro['nombre_comercial'];
        $fecha_programada = $registro['fecha_programada'];
        $hora_programada = $registro['hora_programada'];
        $fecha_hora_accion = $registro['fecha_hora_accion'];
        $estado = $registro['estado'];
        $observaciones = $registro['observaciones'];
        
        // Determinar el color según el estado
        $color_estado = '';
        switch ($estado) {
            case 'tomada':
                $color_estado = '#28a745';
                break;
            case 'pendiente':
                $color_estado = '#ffc107';
                break;
            case 'rechazada':
                $color_estado = '#dc3545';
                break;
            case 'pospuesta':
                $color_estado = '#17a2b8';
                break;
        }
        
        echo "<div style='background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0; border-left: 4px solid $color_estado;'>";
        echo "<h4 style='margin: 0 0 10px 0; color: #333;'>Registro #$registro_id - $medicamento</h4>";
        
        echo "<div style='display: grid; grid-template-columns: 1fr 1fr; gap: 10px;'>";
        echo "<div>";
        echo "<p><strong>📅 Fecha programada:</strong> $fecha_programada</p>";
        echo "<p><strong>⏰ Hora programada:</strong> $hora_programada</p>";
        echo "<p><strong>💊 Dosis:</strong> " . ($registro['dosis_programada'] ?? 'No especificada') . "</p>";
        echo "</div>";
        echo "<div>";
        echo "<p><strong>📝 Estado:</strong> <span style='color: $color_estado; font-weight: bold;'>$estado</span></p>";
        echo "<p><strong>🕐 Fecha/hora de acción:</strong> " . ($fecha_hora_accion ?: 'No registrada') . "</p>";
        echo "<p><strong>📄 Observaciones:</strong> " . ($observaciones ?: 'Sin observaciones') . "</p>";
        echo "</div>";
        echo "</div>";
        
        // Análisis específico para el registro problemático
        if ($registro_id == 894) {
            echo "<div style='background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 10px 0;'>";
            echo "<h5 style='color: #856404; margin: 0 0 5px 0;'>⚠️ Análisis del registro problemático:</h5>";
            echo "<ul style='margin: 5px 0; color: #856404;'>";
            echo "<li><strong>Horario programado:</strong> 22:51 (según tu reporte)</li>";
            echo "<li><strong>Hora registrada en BD:</strong> 22:58:31</li>";
            echo "<li><strong>Diferencia:</strong> 7 minutos y 31 segundos de retraso</li>";
            echo "<li><strong>Estado actual:</strong> $estado</li>";
            echo "<li><strong>¿Debería aparecer en la app?</strong> SÍ, porque está dentro del rango de fechas</li>";
            echo "</ul>";
            echo "</div>";
        }
        
        echo "</div>";
    }
    
    echo "<div style='background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;'>";
    echo "<h3 style='color: #0c5460; margin: 0 0 10px 0;'>🔍 Análisis para la App</h3>";
    echo "<p style='color: #0c5460; margin: 5px 0;'><strong>Lo que debería mostrar la app:</strong></p>";
    echo "<ul style='color: #0c5460;'>";
    echo "<li>Total de registros: " . count($data['registros']) . "</li>";
    echo "<li>Registros con estado 'tomada': " . count(array_filter($data['registros'], function($r) { return $r['estado'] === 'tomada'; })) . "</li>";
    echo "<li>Registros con estado 'pendiente': " . count(array_filter($data['registros'], function($r) { return $r['estado'] === 'pendiente'; })) . "</li>";
    echo "</ul>";
    
    echo "<p style='color: #0c5460; margin: 10px 0 5px 0;'><strong>Posibles problemas:</strong></p>";
    echo "<ul style='color: #0c5460;'>";
    echo "<li>La app podría estar filtrando por fechas diferentes</li>";
    echo "<li>La app podría estar usando un endpoint diferente</li>";
    echo "<li>Podría haber un error en el parsing de JSON en la app</li>";
    echo "<li>La app podría estar cacheando datos antiguos</li>";
    echo "</ul>";
    echo "</div>";
    
} else {
    echo "<div style='background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 10px; margin: 10px 0;'>";
    echo "<p style='color: #721c24; margin: 0;'>❌ No se encontraron registros o hubo un error en la respuesta</p>";
    echo "</div>";
}

echo "<div style='background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 8px; padding: 15px; margin: 20px 0;'>";
echo "<h3 style='color: #383d41; margin: 0 0 10px 0;'>🛠️ Próximos pasos de debugging</h3>";
echo "<ol style='color: #383d41;'>";
echo "<li>Verificar que la app esté usando la misma URL y parámetros</li>";
echo "<li>Revisar los logs de la app React Native en la consola</li>";
echo "<li>Comprobar si hay errores de red o parsing en la app</li>";
echo "<li>Verificar que la app no esté filtrando los datos después de recibirlos</li>";
echo "</ol>";
echo "</div>";

echo "<p><a href='?' style='background: #007cba; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;'>🔄 Actualizar</a></p>";
?>
