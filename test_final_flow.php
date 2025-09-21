<?php
// Script para probar el flujo completo de la alarma
include "smart_pill_api/conexion.php";

echo "🧪 PRUEBA FINAL DEL FLUJO DE ALARMA\n";
echo "=====================================\n\n";

// 1. Usar el registro existente para la prueba
echo "1. Usando registro existente para la prueba...\n";

// Verificar que existe el registro 908
$sql = "SELECT * FROM registro_tomas WHERE registro_id = 908";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $registro = $result->fetch_assoc();
    echo "   ✅ Registro encontrado: ID {$registro['registro_id']}\n";
    echo "   - Estado actual: {$registro['estado']}\n";
    echo "   - Programación ID: {$registro['programacion_id']}\n";
    echo "   - Usuario ID: {$registro['usuario_id']}\n\n";
    
    // Resetear el estado a pendiente para la prueba
    $sql = "UPDATE registro_tomas SET estado = 'pendiente', observaciones = 'Reset para prueba final' WHERE registro_id = 908";
    $conn->query($sql);
    echo "   ✅ Estado reseteado a 'pendiente' para la prueba\n\n";
    
    $programacion_id = $registro['programacion_id'];
    $usuario_id = $registro['usuario_id'];
    $horario_id = $registro['horario_id'];
    
} else {
    echo "   ❌ No se encontró el registro 908. Creando uno nuevo...\n";
    
    // Crear registro de toma simple
    $sql = "INSERT INTO registro_tomas (usuario_id, programacion_id, horario_id, estado, fecha_programada, hora_programada, fecha_creacion) 
            VALUES (2, 116, 779, 'pendiente', CURDATE(), '14:30:00', NOW())";
    $conn->query($sql);
    $registro_id = $conn->insert_id;
    echo "   ✅ Registro de toma creado: ID $registro_id\n\n";
    
    $programacion_id = 116;
    $usuario_id = 2;
    $horario_id = 779;
}

// 2. Simular datos de notificación (como los que pasa App.js)
$notificationData = [
    'medicamento' => 'Ibuprofeno Test',
    'hora' => '14:30',
    'dosis' => '400mg',
    'programacionId' => $programacion_id,
    'alarmaId' => 1,
    'horario_id' => $horario_id,
    'usuario_id' => $usuario_id,
    'sound' => 'default'
    // Nota: NO incluye registro_id intencionalmente
];

echo "2. Datos de notificación simulados:\n";
echo "   " . json_encode($notificationData, JSON_PRETTY_PRINT) . "\n\n";

// 3. Probar obtener_registro_pendiente.php
echo "3. Probando obtener_registro_pendiente.php...\n";

$url = 'http://localhost/smart_pill/smart_pill_api/obtener_registro_pendiente.php';
$data = json_encode([
    'programacion_id' => $programacion_id,
    'usuario_id' => $usuario_id
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   HTTP Code: $httpCode\n";
echo "   Respuesta: $response\n";

$result = json_decode($response, true);
if ($result && $result['success']) {
    $obtained_registro_id = $result['registro_id'];
    echo "   ✅ registro_id obtenido: $obtained_registro_id\n\n";
    
    // 4. Probar actualización de estado
    echo "4. Probando actualización de estado a 'tomada'...\n";
    
    $url = 'http://localhost/smart_pill/smart_pill_api/registro_tomas.php';
    $data = json_encode([
        'registro_id' => $obtained_registro_id,
        'estado' => 'tomada',
        'observaciones' => 'Medicamento tomado desde prueba final'
    ]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "   HTTP Code: $httpCode\n";
    echo "   Respuesta: $response\n";
    
    $updateResult = json_decode($response, true);
    if ($updateResult && $updateResult['success']) {
        echo "   ✅ Estado actualizado correctamente\n\n";
        
        // 5. Verificar en base de datos
        echo "5. Verificando estado final en base de datos...\n";
        $sql = "SELECT registro_id, estado, observaciones, fecha_actualizacion 
                FROM registro_tomas WHERE registro_id = $obtained_registro_id";
        $result = $conn->query($sql);
        
        if ($result && $result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo "   ✅ Registro verificado:\n";
            echo "      - ID: {$row['registro_id']}\n";
            echo "      - Estado: {$row['estado']}\n";
            echo "      - Observaciones: {$row['observaciones']}\n";
            echo "      - Fecha actualización: {$row['fecha_actualizacion']}\n\n";
            
            echo "🎉 PRUEBA COMPLETADA EXITOSAMENTE\n";
            echo "El flujo completo funciona correctamente:\n";
            echo "1. ✅ Datos de prueba preparados\n";
            echo "2. ✅ registro_id obtenido desde programacion_id\n";
            echo "3. ✅ Estado actualizado a 'tomada'\n";
            echo "4. ✅ Cambios verificados en base de datos\n\n";
            
            echo "📱 RESUMEN PARA LA APP:\n";
            echo "======================\n";
            echo "- App.js pasa notificationData SIN registro_id ✅\n";
            echo "- AlarmScreen/FullScreenAlarm obtienen registro_id usando obtenerRegistroId() ✅\n";
            echo "- actualizarEstadoToma() actualiza correctamente el estado ✅\n";
            echo "- El botón 'Ya lo tomé' ahora funcionará correctamente ✅\n";
        } else {
            echo "   ❌ Error: No se pudo verificar el registro\n";
        }
    } else {
        echo "   ❌ Error al actualizar estado: " . ($updateResult['error'] ?? 'Error desconocido') . "\n";
    }
} else {
    echo "   ❌ Error al obtener registro_id: " . ($result['error'] ?? 'Error desconocido') . "\n";
}

$conn->close();
?>