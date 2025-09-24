<?php
header("Content-Type: text/html; charset=UTF-8");
include "smart_pill_api/conexion.php";

echo "<h2>🔧 Creando registros con horarios para Programación 129</h2>";

// Obtener horarios de la programación 129
$sql_horarios = "SELECT h.*, pt.usuario_id, pt.remedio_global_id, pt.programacion_id, pt.dosis_por_toma
                 FROM horarios_tratamiento h
                 INNER JOIN programacion_tratamientos pt ON h.tratamiento_id = pt.programacion_id
                 WHERE h.tratamiento_id = 129 AND h.activo = 1";

$result_horarios = $conn->query($sql_horarios);

if (!$result_horarios || $result_horarios->num_rows == 0) {
    echo "<p style='color: red;'>❌ No se encontraron horarios para la programación 129</p>";
    exit;
}

echo "<h3>📋 Horarios encontrados:</h3>";
$horarios = [];
while ($horario = $result_horarios->fetch_assoc()) {
    $horarios[] = $horario;
    echo "<p>• {$horario['dia_semana']} a las {$horario['hora']} (ID: {$horario['horario_id']})</p>";
}

echo "<h3>🔄 Creando registros de toma...</h3>";

$registros_creados = 0;
$fecha_actual = new DateTime();

try {
    $conn->begin_transaction();
    
    // Crear registros para los próximos 7 días
    for ($i = 0; $i < 7; $i++) {
        $fecha_registro = clone $fecha_actual;
        $fecha_registro->add(new DateInterval("P{$i}D"));
        
        $fecha_str = $fecha_registro->format('Y-m-d');
        $dia_semana = strtolower($fecha_registro->format('l')); // lunes, martes, etc.
        
        // Traducir días al español
        $dias_traduccion = [
            'monday' => 'lunes',
            'tuesday' => 'martes', 
            'wednesday' => 'miercoles',
            'thursday' => 'jueves',
            'friday' => 'viernes',
            'saturday' => 'sabado',
            'sunday' => 'domingo'
        ];
        
        $dia_espanol = $dias_traduccion[$dia_semana] ?? $dia_semana;
        
        // Buscar horarios para este día
        foreach ($horarios as $horario) {
            if ($horario['dia_semana'] == $dia_espanol) {
                // Verificar si ya existe el registro
                $sql_check = "SELECT registro_id FROM registro_tomas 
                             WHERE horario_id = {$horario['horario_id']} 
                             AND fecha_programada = '$fecha_str'";
                $result_check = $conn->query($sql_check);
                
                if ($result_check->num_rows == 0) {
                    // Crear el registro
                    $sql_insert = "INSERT INTO registro_tomas (
                        usuario_id, 
                        horario_id,
                        programacion_id, 
                        remedio_global_id, 
                        fecha_programada, 
                        hora_programada, 
                        dosis_programada, 
                        estado, 
                        fecha_creacion
                    ) VALUES (
                        {$horario['usuario_id']}, 
                        {$horario['horario_id']},
                        {$horario['programacion_id']}, 
                        {$horario['remedio_global_id']}, 
                        '$fecha_str', 
                        '{$horario['hora']}', 
                        '" . $conn->real_escape_string($horario['dosis_por_toma']) . "', 
                        'pendiente', 
                        NOW()
                    )";
                    
                    if ($conn->query($sql_insert)) {
                        $registros_creados++;
                        echo "<p>✅ Registro creado: $fecha_str {$horario['hora']} ({$dia_espanol})</p>";
                    } else {
                        echo "<p style='color: red;'>❌ Error creando registro: $fecha_str {$horario['hora']} - " . $conn->error . "</p>";
                    }
                } else {
                    echo "<p style='color: orange;'>⚠️ Registro ya existe: $fecha_str {$horario['hora']} ({$dia_espanol})</p>";
                }
            }
        }
    }
    
    $conn->commit();
    
    echo "<h3>✅ Proceso completado</h3>";
    echo "<p><strong>Registros creados:</strong> $registros_creados</p>";
    
    // Verificar los registros creados
    echo "<h3>📊 Registros pendientes para programación 129:</h3>";
    $sql_verify = "SELECT rt.registro_id, rt.fecha_programada, rt.hora_programada, rt.estado, h.dia_semana
                   FROM registro_tomas rt
                   INNER JOIN horarios_tratamiento h ON rt.horario_id = h.horario_id
                   WHERE rt.programacion_id = 129 AND rt.estado = 'pendiente'
                   ORDER BY rt.fecha_programada, rt.hora_programada";
    $result_verify = $conn->query($sql_verify);
    
    if ($result_verify && $result_verify->num_rows > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Registro ID</th><th>Fecha</th><th>Hora</th><th>Día</th><th>Estado</th></tr>";
        
        while ($reg = $result_verify->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $reg['registro_id'] . "</td>";
            echo "<td>" . $reg['fecha_programada'] . "</td>";
            echo "<td>" . $reg['hora_programada'] . "</td>";
            echo "<td>" . $reg['dia_semana'] . "</td>";
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
    
    if ($http_code == 200) {
        $response_data = json_decode($response, true);
        if ($response_data && $response_data['success']) {
            echo "<h3 style='color: green;'>🎉 ¡PROBLEMA RESUELTO!</h3>";
            echo "<p>El endpoint ahora devuelve correctamente el registro_id: <strong>" . $response_data['registro_id'] . "</strong></p>";
        }
    }
    
} catch (Exception $e) {
    $conn->rollback();
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}

$conn->close();
?>