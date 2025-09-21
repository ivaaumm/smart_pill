<?php
echo "<h2>🔍 Test API Obtener Registros</h2>";

$usuario_id = 1;
$fecha_desde = date('Y-m-d', strtotime('-7 days'));
$fecha_hasta = date('Y-m-d', strtotime('+7 days'));

echo "<p><strong>Parámetros de prueba:</strong></p>";
echo "<ul>";
echo "<li>usuario_id: $usuario_id</li>";
echo "<li>fecha_desde: $fecha_desde</li>";
echo "<li>fecha_hasta: $fecha_hasta</li>";
echo "</ul>";

// Hacer la petición GET
$url = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=$usuario_id&fecha_desde=$fecha_desde&fecha_hasta=$fecha_hasta";

echo "<p><strong>URL de prueba:</strong></p>";
echo "<p><code>$url</code></p>";

$result = file_get_contents($url);

echo "<h3>📥 Respuesta de la API:</h3>";
echo "<pre style='background: #f8f9fa; padding: 10px; border-radius: 4px; max-height: 400px; overflow-y: auto;'>" . htmlspecialchars($result) . "</pre>";

// Decodificar y mostrar de forma más legible
$data = json_decode($result, true);
if ($data) {
    echo "<h3>📊 Datos decodificados:</h3>";
    if (isset($data['success']) && $data['success']) {
        echo "<p style='color: green;'>✅ <strong>Éxito:</strong> " . ($data['total'] ?? 0) . " registros encontrados</p>";
        
        if (isset($data['registros']) && is_array($data['registros'])) {
            if (count($data['registros']) > 0) {
                echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
                echo "<tr style='background: #f0f0f0;'>";
                echo "<th>ID</th><th>Medicamento</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Observaciones</th>";
                echo "</tr>";
                
                foreach ($data['registros'] as $registro) {
                    $color = '';
                    switch($registro['estado']) {
                        case 'pendiente': $color = 'background: #fff3cd;'; break;
                        case 'tomada': $color = 'background: #d4edda;'; break;
                        case 'rechazada': $color = 'background: #f8d7da;'; break;
                        case 'pospuesta': $color = 'background: #d1ecf1;'; break;
                    }
                    
                    echo "<tr style='$color'>";
                    echo "<td>" . $registro['registro_id'] . "</td>";
                    echo "<td>" . htmlspecialchars($registro['nombre_comercial'] ?? 'N/A') . "</td>";
                    echo "<td>" . $registro['fecha_programada'] . "</td>";
                    echo "<td>" . $registro['hora_programada'] . "</td>";
                    echo "<td><strong>" . $registro['estado'] . "</strong></td>";
                    echo "<td>" . htmlspecialchars($registro['observaciones'] ?? '') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "<p style='color: orange;'>⚠️ No hay registros en el rango de fechas especificado</p>";
            }
        }
    } else {
        echo "<p style='color: red;'>❌ <strong>Error:</strong> " . ($data['error'] ?? 'Error desconocido') . "</p>";
    }
} else {
    echo "<p style='color: red;'>❌ No se pudo decodificar la respuesta JSON</p>";
}

// Verificar datos en la base de datos directamente
echo "<hr>";
echo "<h3>🗄️ Verificación directa en la base de datos:</h3>";

require_once 'smart_pill_api/conexion.php';

$sql_count = "SELECT COUNT(*) as total FROM registro_tomas WHERE usuario_id = $usuario_id";
$result_count = $conn->query($sql_count);
$count = $result_count->fetch_assoc()['total'];

echo "<p><strong>Total de registros en la BD para usuario $usuario_id:</strong> $count</p>";

if ($count > 0) {
    $sql_sample = "SELECT * FROM registro_tomas WHERE usuario_id = $usuario_id ORDER BY registro_id DESC LIMIT 5";
    $result_sample = $conn->query($sql_sample);
    
    echo "<p><strong>Últimos 5 registros:</strong></p>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Horario ID</th><th>Fecha Prog.</th><th>Hora Prog.</th><th>Estado</th><th>Fecha Creación</th>";
    echo "</tr>";
    
    while ($row = $result_sample->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['registro_id'] . "</td>";
        echo "<td>" . $row['horario_id'] . "</td>";
        echo "<td>" . $row['fecha_programada'] . "</td>";
        echo "<td>" . $row['hora_programada'] . "</td>";
        echo "<td>" . $row['estado'] . "</td>";
        echo "<td>" . ($row['fecha_creacion'] ?? 'N/A') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: red;'>❌ No hay registros en la base de datos para el usuario $usuario_id</p>";
    echo "<p><a href='crear_datos_minimos.php' style='background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Crear Datos de Prueba</a></p>";
}

echo "<p><a href='debug_confirmar_toma.php' style='background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🔍 Ver Debug</a></p>";
?>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 1000px;
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
    font-size: 12px;
}
th {
    background: #f0f0f0;
}
pre {
    overflow-x: auto;
}
code {
    background: #f8f9fa;
    padding: 2px 4px;
    border-radius: 3px;
}
</style>
