<?php
// Script para analizar la relación entre programacionId, alarmaId y registro_id
header("Content-Type: application/json; charset=UTF-8");

include "smart_pill_api/conexion.php";

echo "<h2>🔍 Análisis de Relación: programacionId → registro_id</h2>";

// Datos del log
$programacion_id = 110;
$alarma_id = 52;
$usuario_id = 1;

echo "<h3>📋 Datos disponibles del notificationData:</h3>";
echo "<ul>";
echo "<li><strong>programacionId:</strong> $programacion_id</li>";
echo "<li><strong>alarmaId:</strong> $alarma_id</li>";
echo "<li><strong>usuario_id:</strong> $usuario_id</li>";
echo "</ul>";

// 1. Buscar registros por programacion_id
echo "<h3>🔍 Búsqueda por programacion_id:</h3>";
$sql_por_programacion = "SELECT registro_id, usuario_id, programacion_id, estado, fecha_programada, hora_programada, observaciones 
                         FROM registro_tomas 
                         WHERE programacion_id = $programacion_id AND usuario_id = $usuario_id
                         ORDER BY fecha_programada DESC, hora_programada DESC 
                         LIMIT 10";

$resultado_programacion = $conn->query($sql_por_programacion);

if ($resultado_programacion && $resultado_programacion->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>registro_id</th><th>Estado</th><th>Fecha</th><th>Hora</th><th>Observaciones</th></tr>";
    
    $registros_encontrados = [];
    while ($row = $resultado_programacion->fetch_assoc()) {
        $registros_encontrados[] = $row;
        echo "<tr>";
        echo "<td><strong>" . $row['registro_id'] . "</strong></td>";
        echo "<td>" . $row['estado'] . "</td>";
        echo "<td>" . $row['fecha_programada'] . "</td>";
        echo "<td>" . $row['hora_programada'] . "</td>";
        echo "<td>" . ($row['observaciones'] ?: 'Sin observaciones') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Buscar el registro pendiente más reciente
    $registro_pendiente = null;
    foreach ($registros_encontrados as $registro) {
        if ($registro['estado'] === 'pendiente') {
            $registro_pendiente = $registro;
            break;
        }
    }
    
    if ($registro_pendiente) {
        echo "<h3>✅ Registro pendiente encontrado:</h3>";
        echo "<div style='background: #d4edda; padding: 10px; border-radius: 5px;'>";
        echo "<p><strong>registro_id:</strong> " . $registro_pendiente['registro_id'] . "</p>";
        echo "<p><strong>Estado:</strong> " . $registro_pendiente['estado'] . "</p>";
        echo "<p><strong>Fecha/Hora:</strong> " . $registro_pendiente['fecha_programada'] . " " . $registro_pendiente['hora_programada'] . "</p>";
        echo "</div>";
    } else {
        echo "<h3>⚠️ No se encontró registro pendiente</h3>";
        echo "<p>Todos los registros ya han sido procesados.</p>";
    }
    
} else {
    echo "<p style='color: red;'>❌ No se encontraron registros para programacion_id: $programacion_id</p>";
}

// 2. Verificar si existe tabla de alarmas y su relación
echo "<h3>🔍 Verificando tabla de alarmas:</h3>";
$sql_alarmas = "SHOW TABLES LIKE '%alarm%'";
$resultado_alarmas = $conn->query($sql_alarmas);

if ($resultado_alarmas && $resultado_alarmas->num_rows > 0) {
    while ($row = $resultado_alarmas->fetch_assoc()) {
        $tabla_alarma = array_values($row)[0];
        echo "<p>📋 Tabla encontrada: <strong>$tabla_alarma</strong></p>";
        
        // Describir la estructura de la tabla
        $sql_describe = "DESCRIBE $tabla_alarma";
        $resultado_describe = $conn->query($sql_describe);
        
        if ($resultado_describe) {
            echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
            echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th></tr>";
            while ($campo = $resultado_describe->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $campo['Field'] . "</td>";
                echo "<td>" . $campo['Type'] . "</td>";
                echo "<td>" . $campo['Null'] . "</td>";
                echo "<td>" . $campo['Key'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    }
} else {
    echo "<p>⚠️ No se encontraron tablas de alarmas</p>";
}

// 3. Estrategia recomendada
echo "<h3>💡 Estrategia Recomendada:</h3>";
echo "<div style='background: #d1ecf1; padding: 15px; border-radius: 5px;'>";
echo "<h4>Opción 1: Buscar por programacion_id + estado pendiente</h4>";
echo "<p>Buscar el registro más reciente con estado 'pendiente' para la programación dada.</p>";

echo "<h4>Opción 2: Buscar por programacion_id + fecha/hora actual</h4>";
echo "<p>Buscar el registro que corresponda a la fecha y hora actual (o más cercana).</p>";

echo "<h4>Opción 3: Crear endpoint específico</h4>";
echo "<p>Crear un endpoint que reciba programacion_id y devuelva el registro_id correspondiente.</p>";
echo "</div>";

$conn->close();
?>
