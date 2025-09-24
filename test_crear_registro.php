<?php
include "smart_pill_api/conexion.php";

echo "<h2>Verificando horarios disponibles:</h2>";

// Obtener horarios existentes
$sql = "SELECT ht.horario_id, ht.tratamiento_id, ht.usuario_id, ht.remedio_global_id, 
               ht.dia_semana, ht.hora, ht.dosis, ht.activo,
               pt.programacion_id, pt.nombre_tratamiento, rg.nombre_comercial as remedio_nombre
        FROM horarios_tratamiento ht
        LEFT JOIN programacion_tratamientos pt ON ht.tratamiento_id = pt.programacion_id
        LEFT JOIN remedio_global rg ON ht.remedio_global_id = rg.remedio_global_id
        WHERE ht.usuario_id = 1 AND ht.activo = 1
        LIMIT 10";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    echo "<table border='1'>";
    echo "<tr><th>Horario ID</th><th>Tratamiento ID</th><th>Programación ID</th><th>Remedio</th><th>Día</th><th>Hora</th><th>Dosis</th></tr>";
    
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['horario_id'] . "</td>";
        echo "<td>" . $row['tratamiento_id'] . "</td>";
        echo "<td>" . ($row['programacion_id'] ?? 'NULL') . "</td>";
        echo "<td>" . ($row['remedio_nombre'] ?? 'Sin nombre') . "</td>";
        echo "<td>" . $row['dia_semana'] . "</td>";
        echo "<td>" . $row['hora'] . "</td>";
        echo "<td>" . $row['dosis'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>No se encontraron horarios activos para el usuario 1</p>";
}

echo "<h2>Probando endpoint crear_registro_toma.php:</h2>";

// Obtener el primer horario disponible
$sql_first = "SELECT horario_id FROM horarios_tratamiento WHERE usuario_id = 1 AND activo = 1 LIMIT 1";
$result_first = $conn->query($sql_first);

if ($result_first && $result_first->num_rows > 0) {
    $first_horario = $result_first->fetch_assoc();
    $horario_id = $first_horario['horario_id'];
    
    echo "<p>Usando horario_id: $horario_id</p>";
    
    // Probar las 3 acciones
    $acciones = ['ya_tome', 'posponer', 'omitir'];
    
    foreach ($acciones as $accion) {
        echo "<h3>Probando acción: $accion</h3>";
        
        $data = json_encode([
            'horario_id' => $horario_id,
            'usuario_id' => 1,
            'accion' => $accion,
            'observaciones' => "Prueba de acción $accion desde script de test"
        ]);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "http://localhost/smart_pill/smart_pill_api/crear_registro_toma.php");
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        echo "<p><strong>HTTP Code:</strong> $http_code</p>";
        echo "<p><strong>Response:</strong></p>";
        echo "<pre>" . json_encode(json_decode($response), JSON_PRETTY_PRINT) . "</pre>";
        echo "<hr>";
    }
} else {
    echo "<p>No hay horarios disponibles para probar</p>";
}

$conn->close();
?>