<?php
echo "<h2>🧪 Test: Obtener Registro Pendiente</h2>";

// Test con programacion_id 110 (del debug)
$test_data = [
    'programacion_id' => 110,
    'usuario_id' => 1
];

echo "<h3>📤 Enviando datos:</h3>";
echo "<pre>" . json_encode($test_data, JSON_PRETTY_PRINT) . "</pre>";

$url = "http://localhost/smart_pill/smart_pill_api/obtener_registro_pendiente.php";
$json_data = json_encode($test_data);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($json_data)
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<h3>📥 Respuesta del servidor:</h3>";
echo "<p><strong>HTTP Code:</strong> $http_code</p>";

if ($response) {
    $decoded = json_decode($response, true);
    if ($decoded) {
        echo "<pre>" . json_encode($decoded, JSON_PRETTY_PRINT) . "</pre>";
        
        if (isset($decoded['success']) && $decoded['success']) {
            echo "<p style='color: green;'>✅ <strong>Éxito:</strong> registro_id encontrado: " . $decoded['registro_id'] . "</p>";
        } else {
            echo "<p style='color: red;'>❌ <strong>Error:</strong> " . ($decoded['error'] ?? 'Error desconocido') . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Error decodificando JSON</p>";
        echo "<pre>$response</pre>";
    }
} else {
    echo "<p style='color: red;'>❌ No se recibió respuesta</p>";
}

// Test adicional: buscar programaciones disponibles
echo "<hr><h3>🔍 Programaciones disponibles para usuario 1:</h3>";

include "smart_pill_api/conexion.php";

$sql = "SELECT DISTINCT p.programacion_id, p.remedio_global_id, rg.nombre_comercial as medicamento, 
               COUNT(rt.registro_id) as total_registros,
               SUM(CASE WHEN rt.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
        FROM programacion_tratamientos p 
        LEFT JOIN remedio_global rg ON p.remedio_global_id = rg.remedio_global_id
        LEFT JOIN registro_tomas rt ON p.programacion_id = rt.programacion_id
        WHERE p.usuario_id = 1 AND p.estado = 'activo'
        GROUP BY p.programacion_id
        ORDER BY p.programacion_id DESC
        LIMIT 10";

$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Programación ID</th><th>Medicamento</th><th>Total Registros</th><th>Pendientes</th></tr>";
    
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['programacion_id'] . "</td>";
        echo "<td>" . $row['medicamento'] . "</td>";
        echo "<td>" . $row['total_registros'] . "</td>";
        echo "<td style='color: " . ($row['pendientes'] > 0 ? 'orange' : 'green') . ";'>" . $row['pendientes'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>No se encontraron programaciones activas</p>";
}

$conn->close();
?>

<script>
// Código JavaScript para el frontend React Native
console.log(`
// 📱 Código para React Native - medicationLogAPI.js

const obtenerRegistroId = async (programacionId, usuarioId) => {
  try {
    const response = await fetch('http://localhost/smart_pill/smart_pill_api/obtener_registro_pendiente.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        programacion_id: programacionId,
        usuario_id: usuarioId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ registro_id encontrado:', data.registro_id);
      return {
        success: true,
        registro_id: data.registro_id,
        estado: data.estado,
        es_pendiente: data.es_pendiente
      };
    } else {
      console.error('❌ Error obteniendo registro_id:', data.error);
      return {
        success: false,
        error: data.error
      };
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
    return {
      success: false,
      error: 'Error de conexión'
    };
  }
};

// Uso en FullScreenAlarm.js o AlarmScreen.js:
const handleAlarmAction = async (notificationData, nuevoEstado) => {
  console.log('🔍 notificationData:', notificationData);
  
  // Obtener registro_id si no está disponible
  let registroId = notificationData.registro_id;
  
  if (!registroId && notificationData.programacionId) {
    console.log('🔍 Buscando registro_id para programacion:', notificationData.programacionId);
    
    const resultado = await obtenerRegistroId(
      notificationData.programacionId, 
      notificationData.usuario_id || 1
    );
    
    if (resultado.success) {
      registroId = resultado.registro_id;
      console.log('✅ registro_id obtenido:', registroId);
    } else {
      console.error('❌ No se pudo obtener registro_id:', resultado.error);
      Alert.alert('Error', 'No se pudo procesar la acción de la alarma');
      return;
    }
  }
  
  // Continuar con la actualización del estado
  if (registroId) {
    await updateMedicationStatus(registroId, nuevoEstado);
  }
};
`);
</script>
