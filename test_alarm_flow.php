<?php
header("Content-Type: application/json; charset=UTF-8");

// Test script para verificar el flujo completo de registro de tomas
// Simula las acciones que hace AlarmScreen.js

include "smart_pill_api/conexion.php";

function testAlarmFlow($conn) {
    echo "=== TEST: FLUJO COMPLETO DE REGISTRO DE TOMAS ===\n\n";
    
    // 1. Crear un registro de prueba (simulando una alarma pendiente)
    echo "1. Creando registro de prueba...\n";
    
    $usuario_id = 1; // Usuario de prueba
    $horario_id = 1; // Horario de prueba
    $fecha_hoy = date('Y-m-d');
    $hora_actual = date('H:i:s');
    
    // Primero, limpiar registros de prueba anteriores
    $sql_clean = "DELETE FROM registro_tomas WHERE usuario_id = $usuario_id AND fecha_programada = '$fecha_hoy' AND observaciones LIKE '%TEST%'";
    $conn->query($sql_clean);
    
    // Crear registro pendiente
    $sql_insert = "INSERT INTO registro_tomas (
        usuario_id, horario_id, remedio_global_id, programacion_id,
        fecha_programada, hora_programada, estado, dosis_programada,
        observaciones, es_cambio_estado
    ) VALUES (
        $usuario_id, $horario_id, 1, 1,
        '$fecha_hoy', '$hora_actual', 'pendiente', '1 tableta',
        'TEST - Registro de prueba para flujo de alarma', 0
    )";
    
    if ($conn->query($sql_insert)) {
        $registro_id = $conn->insert_id;
        echo "✅ Registro creado con ID: $registro_id\n\n";
    } else {
        echo "❌ Error creando registro: " . $conn->error . "\n";
        return false;
    }
    
    // 2. Simular acción "TOMADA" desde AlarmScreen
    echo "2. Simulando acción 'TOMADA' desde AlarmScreen...\n";
    
    $update_data = [
        'registro_id' => $registro_id,
        'estado' => 'tomada',
        'observaciones' => 'TEST - Medicamento tomado desde la pantalla de alarma'
    ];
    
    $result = simulateAlarmAction($conn, $update_data);
    if ($result['success']) {
        echo "✅ Acción 'tomada' registrada exitosamente\n";
        echo "   - Registro ID: " . $result['registro_id'] . "\n";
        echo "   - Estado anterior: " . $result['estado_anterior'] . "\n";
        echo "   - Estado nuevo: " . $result['estado_nuevo'] . "\n\n";
    } else {
        echo "❌ Error en acción 'tomada': " . $result['error'] . "\n";
        return false;
    }
    
    // 3. Verificar que el registro se actualizó correctamente
    echo "3. Verificando actualización en base de datos...\n";
    
    $sql_verify = "SELECT * FROM registro_tomas WHERE registro_id = $registro_id";
    $result_verify = $conn->query($sql_verify);
    
    if ($result_verify && $result_verify->num_rows > 0) {
        $registro = $result_verify->fetch_assoc();
        echo "✅ Registro verificado:\n";
        echo "   - Estado: " . $registro['estado'] . "\n";
        echo "   - Fecha/Hora acción: " . $registro['fecha_hora_accion'] . "\n";
        echo "   - Observaciones: " . $registro['observaciones'] . "\n\n";
    } else {
        echo "❌ Error verificando registro\n";
        return false;
    }
    
    // 4. Probar flujo de "POSPUESTA" -> "TOMADA"
    echo "4. Probando flujo POSPUESTA -> TOMADA...\n";
    
    // Crear otro registro para probar pospuesta
    $sql_insert2 = "INSERT INTO registro_tomas (
        usuario_id, horario_id, remedio_global_id, programacion_id,
        fecha_programada, hora_programada, estado, dosis_programada,
        observaciones, es_cambio_estado
    ) VALUES (
        $usuario_id, $horario_id, 1, 1,
        '$fecha_hoy', '$hora_actual', 'pendiente', '1 tableta',
        'TEST - Registro de prueba para flujo pospuesta', 0
    )";
    
    if ($conn->query($sql_insert2)) {
        $registro_id2 = $conn->insert_id;
        echo "✅ Segundo registro creado con ID: $registro_id2\n";
        
        // Primero posponer
        $update_data2 = [
            'registro_id' => $registro_id2,
            'estado' => 'pospuesta',
            'observaciones' => 'TEST - Medicamento pospuesto desde la pantalla de alarma'
        ];
        
        $result2 = simulateAlarmAction($conn, $update_data2);
        if ($result2['success']) {
            echo "✅ Acción 'pospuesta' registrada\n";
            
            // Luego tomar
            $update_data3 = [
                'registro_id' => $registro_id2,
                'estado' => 'tomada',
                'observaciones' => 'TEST - Medicamento tomado después de posponer'
            ];
            
            $result3 = simulateAlarmAction($conn, $update_data3);
            if ($result3['success']) {
                echo "✅ Acción 'tomada' después de posponer registrada\n";
                echo "   - Nuevo registro ID: " . $result3['nuevo_registro_id'] . "\n\n";
            } else {
                echo "❌ Error en acción 'tomada' después de posponer: " . $result3['error'] . "\n";
            }
        } else {
            echo "❌ Error en acción 'pospuesta': " . $result2['error'] . "\n";
        }
    }
    
    // 5. Verificar que los registros aparecen en la consulta GET
    echo "5. Verificando que los registros aparecen en consulta GET...\n";
    
    $fecha_desde = date('Y-m-d');
    $fecha_hasta = date('Y-m-d');
    
    $sql_get = "SELECT rt.*, rg.nombre_comercial, rg.principio_activo 
                FROM registro_tomas rt 
                LEFT JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id 
                WHERE rt.usuario_id = $usuario_id 
                AND rt.fecha_programada BETWEEN '$fecha_desde' AND '$fecha_hasta'
                AND rt.observaciones LIKE '%TEST%'
                ORDER BY rt.fecha_programada DESC, rt.hora_programada DESC";
    
    $result_get = $conn->query($sql_get);
    
    if ($result_get && $result_get->num_rows > 0) {
        echo "✅ Encontrados " . $result_get->num_rows . " registros en consulta GET:\n";
        while ($row = $result_get->fetch_assoc()) {
            echo "   - ID: " . $row['registro_id'] . 
                 ", Estado: " . $row['estado'] . 
                 ", Fecha/Hora: " . $row['fecha_programada'] . " " . $row['hora_programada'] .
                 ", Es cambio: " . ($row['es_cambio_estado'] ? 'Sí' : 'No') . "\n";
        }
        echo "\n";
    } else {
        echo "❌ No se encontraron registros en consulta GET\n";
    }
    
    // 6. Limpiar registros de prueba
    echo "6. Limpiando registros de prueba...\n";
    $sql_cleanup = "DELETE FROM registro_tomas WHERE usuario_id = $usuario_id AND observaciones LIKE '%TEST%'";
    if ($conn->query($sql_cleanup)) {
        echo "✅ Registros de prueba eliminados\n\n";
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
    
    // Si el estado actual es 'pospuesta' y se cambia a 'tomada' o 'rechazada'
    if ($registro_actual['estado'] === 'pospuesta' && in_array($nuevo_estado, ['tomada', 'rechazada'])) {
        $conn->begin_transaction();
        
        try {
            // Crear nuevo registro como cambio de estado
            $fecha_hora_accion = date('Y-m-d H:i:s');
            
            $sql_nuevo = "INSERT INTO registro_tomas (
                            usuario_id, horario_id, remedio_global_id, programacion_id,
                            fecha_programada, hora_programada, fecha_hora_accion, estado,
                            estado_anterior, dosis_programada, observaciones, es_cambio_estado,
                            registro_original_id
                          ) VALUES (
                            {$registro_actual['usuario_id']}, {$registro_actual['horario_id']}, 
                            {$registro_actual['remedio_global_id']}, {$registro_actual['programacion_id']},
                            '{$registro_actual['fecha_programada']}', '{$registro_actual['hora_programada']}', 
                            '$fecha_hora_accion', '$nuevo_estado', 'pospuesta',
                            '{$registro_actual['dosis_programada']}', '$observaciones', 1, $registro_id
                          )";
            
            if (!$conn->query($sql_nuevo)) {
                throw new Exception("Error al crear registro de cambio: " . $conn->error);
            }
            
            $nuevo_registro_id = $conn->insert_id;
            $conn->commit();
            
            return [
                'success' => true,
                'registro_original_id' => $registro_id,
                'nuevo_registro_id' => $nuevo_registro_id,
                'estado_anterior' => 'pospuesta',
                'estado_nuevo' => $nuevo_estado
            ];
            
        } catch (Exception $e) {
            $conn->rollback();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    } else {
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
}

// Ejecutar el test
try {
    testAlarmFlow($conn);
} catch (Exception $e) {
    echo "❌ Error en el test: " . $e->getMessage() . "\n";
}

$conn->close();
?>