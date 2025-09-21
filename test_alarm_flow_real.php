<?php
header("Content-Type: application/json; charset=UTF-8");

// Test script para verificar el flujo completo de registro de tomas
// Usa datos reales existentes en la base de datos

include "smart_pill_api/conexion.php";

function testAlarmFlowWithRealData($conn) {
    echo "=== TEST: FLUJO COMPLETO CON DATOS REALES ===\n\n";
    
    // 1. Buscar datos existentes
    echo "1. Buscando datos existentes en la base de datos...\n";
    
    // Buscar usuarios
    $sql_users = "SELECT usuario_id, nombre_usuario FROM usuarios LIMIT 3";
    $result_users = $conn->query($sql_users);
    
    if ($result_users && $result_users->num_rows > 0) {
        echo "✅ Usuarios encontrados:\n";
        while ($user = $result_users->fetch_assoc()) {
            echo "   - ID: {$user['usuario_id']}, Nombre: {$user['nombre_usuario']}\n";
        }
        echo "\n";
    } else {
        echo "❌ No se encontraron usuarios\n";
        return false;
    }
    
    // Buscar horarios de tratamiento existentes
    $sql_horarios = "SELECT ht.horario_id, ht.usuario_id, ht.hora, ht.tratamiento_id, pt.nombre_tratamiento 
                     FROM horarios_tratamiento ht 
                     JOIN programacion_tratamientos pt ON ht.tratamiento_id = pt.programacion_id 
                     LIMIT 5";
    $result_horarios = $conn->query($sql_horarios);
    
    if ($result_horarios && $result_horarios->num_rows > 0) {
        echo "✅ Horarios de tratamiento encontrados:\n";
        $horarios_disponibles = [];
        while ($horario = $result_horarios->fetch_assoc()) {
            echo "   - ID: {$horario['horario_id']}, Usuario: {$horario['usuario_id']}, Hora: {$horario['hora']}, Tratamiento: {$horario['nombre_tratamiento']}\n";
            $horarios_disponibles[] = $horario;
        }
        echo "\n";
    } else {
        echo "❌ No se encontraron horarios de tratamiento\n";
        return false;
    }
    
    // Usar el primer horario disponible para el test
    $horario_test = $horarios_disponibles[0];
    $usuario_id = $horario_test['usuario_id'];
    $horario_id = $horario_test['horario_id'];
    
    echo "2. Usando para el test:\n";
    echo "   - Usuario ID: $usuario_id\n";
    echo "   - Horario ID: $horario_id\n\n";
    
    // 3. Buscar registros existentes para este usuario
    echo "3. Buscando registros existentes para el usuario $usuario_id...\n";
    
    $fecha_hoy = date('Y-m-d');
    $sql_registros = "SELECT registro_id, estado, fecha_programada, hora_programada, observaciones 
                      FROM registro_tomas 
                      WHERE usuario_id = $usuario_id 
                      AND fecha_programada >= '$fecha_hoy'
                      ORDER BY fecha_programada DESC, hora_programada DESC 
                      LIMIT 5";
    
    $result_registros = $conn->query($sql_registros);
    
    if ($result_registros && $result_registros->num_rows > 0) {
        echo "✅ Registros existentes encontrados:\n";
        $registros_existentes = [];
        while ($registro = $result_registros->fetch_assoc()) {
            echo "   - ID: {$registro['registro_id']}, Estado: {$registro['estado']}, Fecha: {$registro['fecha_programada']} {$registro['hora_programada']}\n";
            $registros_existentes[] = $registro;
        }
        echo "\n";
        
        // 4. Probar actualización de estado en un registro pendiente
        $registro_pendiente = null;
        foreach ($registros_existentes as $reg) {
            if ($reg['estado'] === 'pendiente') {
                $registro_pendiente = $reg;
                break;
            }
        }
        
        if ($registro_pendiente) {
            echo "4. Probando actualización de estado en registro pendiente...\n";
            echo "   - Registro ID: {$registro_pendiente['registro_id']}\n";
            
            // Simular acción "TOMADA"
            $update_data = [
                'registro_id' => $registro_pendiente['registro_id'],
                'estado' => 'tomada',
                'observaciones' => 'TEST - Medicamento tomado desde la pantalla de alarma - ' . date('Y-m-d H:i:s')
            ];
            
            $result = simulateAlarmAction($conn, $update_data);
            if ($result['success']) {
                echo "✅ Acción 'tomada' registrada exitosamente\n";
                echo "   - Registro ID: " . $result['registro_id'] . "\n";
                echo "   - Estado anterior: " . $result['estado_anterior'] . "\n";
                echo "   - Estado nuevo: " . $result['estado_nuevo'] . "\n\n";
                
                // Verificar la actualización
                $sql_verify = "SELECT * FROM registro_tomas WHERE registro_id = {$registro_pendiente['registro_id']}";
                $result_verify = $conn->query($sql_verify);
                
                if ($result_verify && $result_verify->num_rows > 0) {
                    $registro_actualizado = $result_verify->fetch_assoc();
                    echo "✅ Verificación exitosa:\n";
                    echo "   - Estado actual: {$registro_actualizado['estado']}\n";
                    echo "   - Fecha/Hora acción: {$registro_actualizado['fecha_hora_accion']}\n";
                    echo "   - Observaciones: {$registro_actualizado['observaciones']}\n\n";
                }
            } else {
                echo "❌ Error en acción 'tomada': " . $result['error'] . "\n";
            }
        } else {
            echo "⚠️ No se encontraron registros pendientes para probar\n\n";
        }
        
    } else {
        echo "⚠️ No se encontraron registros existentes\n\n";
    }
    
    // 5. Probar consulta GET (como RegistroTomas.js)
    echo "5. Probando consulta GET (como RegistroTomas.js)...\n";
    $url_get = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=$usuario_id&fecha_desde=" . date('Y-m-d', strtotime('-7 days')) . "&fecha_hasta=" . date('Y-m-d');
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url_get);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $data = json_decode($response, true);
        if ($data && isset($data['success']) && $data['success']) {
            echo "✅ Consulta GET exitosa. Registros encontrados: " . count($data['registros']) . "\n";
            if (count($data['registros']) > 0) {
                echo "   Ejemplo de registro:\n";
                $registro = $data['registros'][0];
                echo "   - ID: {$registro['registro_id']}, Estado: {$registro['estado']}, Fecha: {$registro['fecha_programada']}\n";
            }
        } else {
            echo "❌ Error en la respuesta GET: " . ($data['message'] ?? 'Respuesta inválida') . "\n";
        }
    } else {
        echo "❌ Error HTTP en GET: $http_code\n";
        echo "Respuesta: $response\n";
    }
    echo "\n";
    
    
    // 6. Probar endpoint obtener_registro_pendiente.php
    echo "6. Probando endpoint obtener_registro_pendiente.php...\n";
    
    // Buscar una programación activa
    $sql_prog = "SELECT programacion_id FROM programacion_tratamientos WHERE usuario_id = $usuario_id LIMIT 1";
    $result_prog = $conn->query($sql_prog);
    
    if ($result_prog && $result_prog->num_rows > 0) {
        $prog = $result_prog->fetch_assoc();
        $programacion_id = $prog['programacion_id'];
        
        echo "   - Probando con programación ID: $programacion_id\n";
        
        // Simular la llamada al endpoint
        $post_data = json_encode([
            'programacion_id' => $programacion_id,
            'usuario_id' => $usuario_id
        ]);
        
        // Usar cURL para simular la llamada HTTP
        $url = "http://192.168.1.87/smart_pill/smart_pill_api/obtener_registro_pendiente.php";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response !== false) {
            echo "   - HTTP Code: $http_code\n";
            echo "   - Respuesta: $response\n\n";
        } else {
            echo "   - Error en cURL\n\n";
        }
    } else {
        echo "   - No se encontraron programaciones para probar\n\n";
    }
    
    echo "=== FIN DEL TEST ===\n";
    return true;
}

function simulateAlarmAction($conn, $data) {
    // Simula exactamente lo que hace actualizarEstadoToma en registro_tomas.php
    
    $registro_id = intval($data['registro_id']);
    $nuevo_estado = $conn->real_escape_string($data['estado']);
    $observaciones = $conn->real_escape_string($data['observaciones']);
    
    if ($registro_id <= 0) {
        return ['success' => false, 'error' => 'Registro ID requerido'];
    }
    
    // Validar estado
    $estados_validos = ['tomada', 'rechazada', 'pospuesta'];
    if (!in_array($nuevo_estado, $estados_validos)) {
        return ['success' => false, 'error' => 'Estado inválido'];
    }
    
    // Obtener registro actual
    $sql_actual = "SELECT * FROM registro_tomas WHERE registro_id = $registro_id";
    $res_actual = $conn->query($sql_actual);
    if (!$res_actual || $res_actual->num_rows === 0) {
        return ['success' => false, 'error' => 'Registro no encontrado'];
    }
    
    $registro_actual = $res_actual->fetch_assoc();
    
    // Actualización simple del estado actual
    $fecha_hora_accion = date('Y-m-d H:i:s');
    
    $sql_update = "UPDATE registro_tomas SET 
                    estado = '$nuevo_estado',
                    fecha_hora_accion = '$fecha_hora_accion',
                    observaciones = '$observaciones'
                  WHERE registro_id = $registro_id";
    
    if (!$conn->query($sql_update)) {
        return ['success' => false, 'error' => 'Error al actualizar registro: ' . $conn->error];
    }
    
    return [
        'success' => true,
        'registro_id' => $registro_id,
        'estado_anterior' => $registro_actual['estado'],
        'estado_nuevo' => $nuevo_estado
    ];
}

// Ejecutar el test
try {
    testAlarmFlowWithRealData($conn);
} catch (Exception $e) {
    echo "❌ Error en el test: " . $e->getMessage() . "\n";
}

$conn->close();
?>