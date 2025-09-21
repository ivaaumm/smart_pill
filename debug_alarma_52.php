<?php
// Script para investigar la alarma_id 52 específicamente
header("Content-Type: application/json; charset=UTF-8");

include "smart_pill_api/conexion.php";

echo "<h2>🔍 Investigación de alarma_id: 52</h2>";

$alarma_id = 52;
$programacion_id = 110;

// 1. Buscar en tabla alarmas
echo "<h3>📋 Datos de la alarma:</h3>";
$sql_alarma = "SELECT * FROM alarmas WHERE alarma_id = $alarma_id";
$resultado_alarma = $conn->query($sql_alarma);

if ($resultado_alarma && $resultado_alarma->num_rows > 0) {
    $alarma = $resultado_alarma->fetch_assoc();
    echo "<pre>" . json_encode($alarma, JSON_PRETTY_PRINT) . "</pre>";
    
    // Usar la programacion_id de la alarma si es diferente
    if ($alarma['programacion_id'] != $programacion_id) {
        echo "<p style='color: orange;'>⚠️ La programacion_id de la alarma ({$alarma['programacion_id']}) es diferente a la del notificationData ($programacion_id)</p>";
        $programacion_id = $alarma['programacion_id'];
    }
    
} else {
    echo "<p style='color: red;'>❌ No se encontró la alarma con ID: $alarma_id</p>";
}

// 2. Buscar registros con la programacion_id correcta
echo "<h3>🔍 Registros para programacion_id: $programacion_id</h3>";
$sql_registros = "SELECT registro_id, usuario_id, programacion_id, estado, fecha_programada, hora_programada, 
                         fecha_hora_accion, observaciones, fecha_creacion
                  FROM registro_tomas 
                  WHERE programacion_id = $programacion_id 
                  ORDER BY fecha_programada DESC, hora_programada DESC 
                  LIMIT 20";

$resultado_registros = $conn->query($sql_registros);

if ($resultado_registros && $resultado_registros->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>registro_id</th><th>Estado</th><th>Fecha Prog.</th><th>Hora Prog.</th><th>Fecha Acción</th><th>Observaciones</th></tr>";
    
    $registro_pendiente = null;
    $fecha_actual = date('Y-m-d');
    $hora_actual = date('H:i:s');
    
    while ($row = $resultado_registros->fetch_assoc()) {
        $es_pendiente = $row['estado'] === 'pendiente';
        $es_hoy = $row['fecha_programada'] === $fecha_actual;
        
        $style = '';
        if ($es_pendiente && $es_hoy) {
            $style = 'background-color: #d4edda;'; // Verde claro para pendiente de hoy
            if (!$registro_pendiente) $registro_pendiente = $row;
        } elseif ($es_pendiente) {
            $style = 'background-color: #fff3cd;'; // Amarillo para pendiente de otro día
            if (!$registro_pendiente) $registro_pendiente = $row;
        }
        
        echo "<tr style='$style'>";
        echo "<td><strong>" . $row['registro_id'] . "</strong></td>";
        echo "<td>" . $row['estado'] . "</td>";
        echo "<td>" . $row['fecha_programada'] . "</td>";
        echo "<td>" . $row['hora_programada'] . "</td>";
        echo "<td>" . ($row['fecha_hora_accion'] ?: 'N/A') . "</td>";
        echo "<td>" . ($row['observaciones'] ?: 'Sin observaciones') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    if ($registro_pendiente) {
        echo "<h3>✅ Registro pendiente recomendado:</h3>";
        echo "<div style='background: #d4edda; padding: 15px; border-radius: 5px;'>";
        echo "<p><strong>registro_id:</strong> " . $registro_pendiente['registro_id'] . "</p>";
        echo "<p><strong>Estado:</strong> " . $registro_pendiente['estado'] . "</p>";
        echo "<p><strong>Fecha/Hora programada:</strong> " . $registro_pendiente['fecha_programada'] . " " . $registro_pendiente['hora_programada'] . "</p>";
        echo "</div>";
        
        // Generar código JavaScript para usar en el frontend
        echo "<h3>💻 Código para el frontend:</h3>";
        echo "<pre style='background: #f8f9fa; padding: 10px; border-radius: 5px;'>";
        echo "// Función para obtener registro_id desde programacion_id\n";
        echo "const obtenerRegistroId = async (programacionId) => {\n";
        echo "  try {\n";
        echo "    const response = await fetch(`\${baseUrl}/obtener_registro_pendiente.php`, {\n";
        echo "      method: 'POST',\n";
        echo "      headers: { 'Content-Type': 'application/json' },\n";
        echo "      body: JSON.stringify({ programacion_id: programacionId })\n";
        echo "    });\n";
        echo "    const result = await response.json();\n";
        echo "    return result.success ? result.registro_id : null;\n";
        echo "  } catch (error) {\n";
        echo "    console.error('Error obteniendo registro_id:', error);\n";
        echo "    return null;\n";
        echo "  }\n";
        echo "};\n";
        echo "</pre>";
        
    } else {
        echo "<h3>⚠️ No hay registros pendientes</h3>";
        echo "<p>Todos los registros para esta programación ya han sido procesados.</p>";
    }
    
} else {
    echo "<p style='color: red;'>❌ No se encontraron registros para programacion_id: $programacion_id</p>";
    
    // Buscar programaciones disponibles
    echo "<h3>🔍 Programaciones disponibles:</h3>";
    $sql_programaciones = "SELECT DISTINCT programacion_id FROM registro_tomas WHERE usuario_id = 1 ORDER BY programacion_id DESC LIMIT 10";
    $resultado_prog = $conn->query($sql_programaciones);
    
    if ($resultado_prog && $resultado_prog->num_rows > 0) {
        echo "<p>Programaciones encontradas: ";
        while ($row = $resultado_prog->fetch_assoc()) {
            echo $row['programacion_id'] . " ";
        }
        echo "</p>";
    }
}

$conn->close();
?>
