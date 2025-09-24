<?php
header("Content-Type: text/html; charset=UTF-8");
include "smart_pill_api/conexion.php";

echo "<h2>🔧 Creando registros para Programación 129</h2>";

// Obtener datos de la programación
$sql_prog = "SELECT pt.*, rg.nombre_comercial, rg.presentacion 
             FROM programacion_tratamientos pt 
             LEFT JOIN remedio_global rg ON pt.remedio_global_id = rg.remedio_global_id 
             WHERE pt.programacion_id = 129";
$result_prog = $conn->query($sql_prog);

if (!$result_prog || $result_prog->num_rows == 0) {
    echo "<p style='color: red;'>❌ Programación 129 no encontrada</p>";
    exit;
}

$programacion = $result_prog->fetch_assoc();
echo "<h3>📋 Datos de la programación:</h3>";
echo "<ul>";
echo "<li>ID: " . $programacion['programacion_id'] . "</li>";
echo "<li>Usuario: " . $programacion['usuario_id'] . "</li>";
echo "<li>Medicamento: " . $programacion['nombre_comercial'] . "</li>";
echo "<li>Dosis: " . $programacion['dosis_por_toma'] . "</li>";
echo "<li>Fecha inicio: " . $programacion['fecha_inicio'] . "</li>";
echo "<li>Fecha fin: " . $programacion['fecha_fin'] . "</li>";
echo "</ul>";

// Crear registros para los próximos 7 días
$fecha_inicio = new DateTime($programacion['fecha_inicio']);
$fecha_fin = new DateTime($programacion['fecha_fin']);
$fecha_actual = new DateTime();

// Si la fecha de inicio es anterior a hoy, empezar desde hoy
if ($fecha_inicio < $fecha_actual) {
    $fecha_inicio = $fecha_actual;
}

echo "<h3>🔄 Creando registros de toma...</h3>";

$registros_creados = 0;
$horarios = ['08:00:00', '14:00:00', '20:00:00']; // 3 tomas diarias

try {
    $conn->begin_transaction();
    
    // Crear registros para los próximos 7 días
    for ($i = 0; $i < 7; $i++) {
        $fecha_registro = clone $fecha_inicio;
        $fecha_registro->add(new DateInterval("P{$i}D"));
        
        // No crear registros después de la fecha fin
        if ($fecha_registro > $fecha_fin) {
            break;
        }
        
        $fecha_str = $fecha_registro->format('Y-m-d');
        
        foreach ($horarios as $hora) {
            // Verificar si ya existe el registro
            $sql_check = "SELECT registro_id FROM registro_tomas 
                         WHERE programacion_id = 129 
                         AND fecha_programada = '$fecha_str' 
                         AND hora_programada = '$hora'";
            $result_check = $conn->query($sql_check);
            
            if ($result_check->num_rows == 0) {
                // Crear el registro
                $sql_insert = "INSERT INTO registro_tomas (
                    usuario_id, 
                    programacion_id, 
                    remedio_global_id, 
                    fecha_programada, 
                    hora_programada, 
                    dosis_programada, 
                    estado, 
                    fecha_creacion
                ) VALUES (
                    {$programacion['usuario_id']}, 
                    {$programacion['programacion_id']}, 
                    {$programacion['remedio_global_id']}, 
                    '$fecha_str', 
                    '$hora', 
                    '" . $conn->real_escape_string($programacion['dosis_por_toma']) . "', 
                    'pendiente', 
                    NOW()
                )";
                
                if ($conn->query($sql_insert)) {
                    $registros_creados++;
                    echo "<p>✅ Registro creado: $fecha_str $hora</p>";
                } else {
                    echo "<p style='color: red;'>❌ Error creando registro: $fecha_str $hora - " . $conn->error . "</p>";
                }
            } else {
                echo "<p style='color: orange;'>⚠️ Registro ya existe: $fecha_str $hora</p>";
            }
        }
    }
    
    $conn->commit();
    
    echo "<h3>✅ Proceso completado</h3>";
    echo "<p><strong>Registros creados:</strong> $registros_creados</p>";
    
    // Verificar los registros creados
    echo "<h3>📊 Registros pendientes para programación 129:</h3>";
    $sql_verify = "SELECT registro_id, fecha_programada, hora_programada, estado 
                   FROM registro_tomas 
                   WHERE programacion_id = 129 AND estado = 'pendiente'
                   ORDER BY fecha_programada, hora_programada";
    $result_verify = $conn->query($sql_verify);
    
    if ($result_verify && $result_verify->num_rows > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Registro ID</th><th>Fecha</th><th>Hora</th><th>Estado</th></tr>";
        
        while ($reg = $result_verify->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $reg['registro_id'] . "</td>";
            echo "<td>" . $reg['fecha_programada'] . "</td>";
            echo "<td>" . $reg['hora_programada'] . "</td>";
            echo "<td style='color: orange;'>" . $reg['estado'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // Probar el endpoint nuevamente
    echo "<h3>🧪 Probando endpoint después de crear registros:</h3>";
    $url = "http://localhost/smart_pill/smart_pill_api/obtener_registro_pendiente.php";
    $data = json_encode([
        'programacion_id' => 129,
        'usuario_id' => 1
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "<p><strong>HTTP Code:</strong> $http_code</p>";
    echo "<p><strong>Respuesta:</strong></p>";
    echo "<pre style='background: #f0f0f0; padding: 10px;'>" . htmlspecialchars($response) . "</pre>";
    
} catch (Exception $e) {
    $conn->rollback();
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}

$conn->close();
?>