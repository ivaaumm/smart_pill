<?php
require_once 'smart_pill_api/conexion.php';

echo "<h2>🔍 Debug: Confirmación de Toma de Medicamentos</h2>";

$usuario_id = 1;

// Mostrar registros pendientes
echo "<h3>📋 Registros Pendientes del Usuario 1:</h3>";
$query_pendientes = "SELECT rt.*, rg.nombre_comercial as medicamento_nombre 
                      FROM registro_tomas rt 
                      LEFT JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id 
                      WHERE rt.usuario_id = ? AND rt.estado = 'pendiente'
                      ORDER BY rt.fecha_programada DESC, rt.hora_programada DESC 
                      LIMIT 10";
$stmt = $conn->prepare($query_pendientes);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result_pendientes = $stmt->get_result();

if ($result_pendientes->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Medicamento</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Acción</th>";
    echo "</tr>";
    
    while ($registro = $result_pendientes->fetch_assoc()) {
        echo "<tr style='background: #fff3cd;'>";
        echo "<td>" . $registro['registro_id'] . "</td>";
        echo "<td>" . htmlspecialchars($registro['medicamento_nombre']) . "</td>";
        echo "<td>" . $registro['fecha_programada'] . "</td>";
        echo "<td>" . $registro['hora_programada'] . "</td>";
        echo "<td><strong>" . $registro['estado'] . "</strong></td>";
        echo "<td><button onclick='confirmarToma(" . $registro['registro_id'] . ")' style='background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;'>✅ Confirmar</button></td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: orange;'>⚠️ No hay registros pendientes</p>";
    echo "<p><a href='crear_datos_prueba.php?create=1' style='background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>➕ Crear Datos de Prueba</a></p>";
}

// Mostrar últimas actualizaciones
echo "<h3>📊 Últimas 10 Actualizaciones:</h3>";
$query_recientes = "SELECT rt.*, rg.nombre_comercial as medicamento_nombre 
                    FROM registro_tomas rt 
                    LEFT JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id 
                    WHERE rt.usuario_id = ?
                    ORDER BY rt.fecha_actualizacion DESC, rt.registro_id DESC 
                    LIMIT 10";
$stmt = $conn->prepare($query_recientes);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result_recientes = $stmt->get_result();

if ($result_recientes->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Medicamento</th><th>Fecha Prog.</th><th>Hora</th><th>Estado</th><th>Actualizado</th>";
    echo "</tr>";
    
    while ($registro = $result_recientes->fetch_assoc()) {
        $color = '';
        switch($registro['estado']) {
            case 'pendiente': $color = 'background: #fff3cd;'; break;
            case 'tomada': $color = 'background: #d4edda;'; break;
            case 'rechazada': $color = 'background: #f8d7da;'; break;
            case 'pospuesta': $color = 'background: #d1ecf1;'; break;
        }
        
        echo "<tr style='$color'>";
        echo "<td>" . $registro['registro_id'] . "</td>";
        echo "<td>" . htmlspecialchars($registro['medicamento_nombre']) . "</td>";
        echo "<td>" . $registro['fecha_programada'] . "</td>";
        echo "<td>" . $registro['hora_programada'] . "</td>";
        echo "<td><strong>" . $registro['estado'] . "</strong></td>";
        echo "<td>" . ($registro['fecha_actualizacion'] ?: 'No actualizado') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: orange;'>⚠️ No hay registros para mostrar</p>";
}

// Área de prueba manual
echo "<hr>";
echo "<h3>🧪 Prueba Manual de Confirmación:</h3>";
echo "<div style='background: #f8f9fa; padding: 15px; border-radius: 8px;'>";
echo "<p>Ingresa el ID de un registro pendiente para probarlo:</p>";
echo "<input type='number' id='registroId' placeholder='ID del registro' style='padding: 8px; margin-right: 10px;'>";
echo "<button onclick='confirmarTomaManual()' style='background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;'>🧪 Probar Confirmación</button>";
echo "</div>";

echo "<div id='resultado' style='margin-top: 20px;'></div>";

// Mostrar logs de la API
if (isset($_GET['test_id'])) {
    $test_id = intval($_GET['test_id']);
    echo "<h3>🔧 Probando Confirmación para Registro ID: $test_id</h3>";
    
    // Simular la llamada que hace la app
    $data = [
        'registro_id' => $test_id,
        'estado' => 'tomada',
        'observaciones' => 'Confirmado desde debug'
    ];
    
    echo "<p><strong>Datos enviados:</strong></p>";
    echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
    
    // Hacer la petición
    $url = "http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php";
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'PUT',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    echo "<p><strong>Respuesta de la API:</strong></p>";
    echo "<pre style='background: #f8f9fa; padding: 10px; border-radius: 4px;'>" . htmlspecialchars($result) . "</pre>";
    
    echo "<p><a href='?' style='background: #007cba; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;'>🔄 Actualizar Página</a></p>";
}

$conn->close();
?>

<script>
function confirmarToma(registroId) {
    if (confirm('¿Confirmar toma del medicamento?')) {
        window.location.href = '?test_id=' + registroId;
    }
}

function confirmarTomaManual() {
    const registroId = document.getElementById('registroId').value;
    if (!registroId) {
        alert('Por favor ingresa un ID de registro');
        return;
    }
    
    const resultDiv = document.getElementById('resultado');
    resultDiv.innerHTML = '<p>🔄 Procesando...</p>';
    
    // Hacer petición AJAX
    fetch('smart_pill_api/registro_tomas.php', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            registro_id: parseInt(registroId),
            estado: 'tomada',
            observaciones: 'Confirmado desde debug manual'
        })
    })
    .then(response => response.json())
    .then(data => {
        resultDiv.innerHTML = `
            <div style='background: ${data.success ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 4px; border-left: 4px solid ${data.success ? '#28a745' : '#dc3545'};'>
                <h4>${data.success ? '✅ Éxito' : '❌ Error'}</h4>
                <p><strong>Respuesta:</strong></p>
                <pre>${JSON.stringify(data, null, 2)}</pre>
                <button onclick='location.reload()' style='background: #007cba; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;'>🔄 Actualizar</button>
            </div>
        `;
    })
    .catch(error => {
        resultDiv.innerHTML = `
            <div style='background: #f8d7da; padding: 15px; border-radius: 4px; border-left: 4px solid #dc3545;'>
                <h4>❌ Error de Conexión</h4>
                <p>${error.message}</p>
            </div>
        `;
    });
}

// Auto-refresh cada 30 segundos si no hay parámetros GET
if (!window.location.search) {
    setTimeout(() => {
        location.reload();
    }, 30000);
}
</script>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
}
table {
    margin: 10px 0;
}
th, td {
    padding: 8px 12px;
    text-align: left;
    border: 1px solid #ddd;
}
th {
    font-weight: bold;
}
h2, h3 {
    color: #333;
}
pre {
    overflow-x: auto;
}
</style>
