<?php
require_once 'smart_pill_api/conexion.php';

echo "<h2>🧪 Creando Datos Mínimos de Prueba</h2>";

try {
    $conn->begin_transaction();
    
    $usuario_id = 1;
    $fecha_hoy = date('Y-m-d');
    $hora_actual = date('H:i:s');
    
    // 1. Verificar que existe el medicamento
    $sql_medicamento = "SELECT remedio_global_id FROM remedio_global WHERE nombre_comercial = 'Paracetamol' LIMIT 1";
    $result_med = $conn->query($sql_medicamento);
    
    if ($result_med->num_rows == 0) {
        echo "<p>❌ No se encontró Paracetamol, creando...</p>";
        $sql_crear_med = "INSERT INTO remedio_global (nombre_comercial, descripcion, presentacion) 
                         VALUES ('Paracetamol', 'Analgésico y antipirético', 'Tableta 500mg')";
        $conn->query($sql_crear_med);
        $remedio_global_id = $conn->insert_id;
    } else {
        $medicamento = $result_med->fetch_assoc();
        $remedio_global_id = $medicamento['remedio_global_id'];
    }
    
    echo "<p>✅ Medicamento ID: $remedio_global_id</p>";
    
    // 2. Crear programación de tratamiento
    $sql_programacion = "INSERT INTO programacion_tratamientos 
                        (usuario_id, remedio_global_id, nombre_tratamiento, fecha_inicio, fecha_fin, estado, dosis_por_toma) 
                        VALUES ($usuario_id, $remedio_global_id, 'Tratamiento Paracetamol', '$fecha_hoy', DATE_ADD('$fecha_hoy', INTERVAL 7 DAY), 'activo', '1 tableta')";
    
    if (!$conn->query($sql_programacion)) {
        throw new Exception("Error al crear programación: " . $conn->error);
    }
    
    $programacion_id = $conn->insert_id;
    echo "<p>✅ Programación creada ID: $programacion_id</p>";
    
    // 3. Crear horario de tratamiento
    $sql_horario = "INSERT INTO horarios_tratamiento 
                   (usuario_id, programacion_id, dia_semana, hora, dosis) 
                   VALUES ($usuario_id, $programacion_id, 'todos', '08:00:00', '1 tableta')";
    
    if (!$conn->query($sql_horario)) {
        throw new Exception("Error al crear horario: " . $conn->error);
    }
    
    $horario_id = $conn->insert_id;
    echo "<p>✅ Horario creado ID: $horario_id</p>";
    
    // 4. Crear registro de toma pendiente
    $sql_registro = "INSERT INTO registro_tomas 
                    (usuario_id, horario_id, remedio_global_id, programacion_id, fecha_programada, hora_programada, estado, dosis_programada) 
                    VALUES ($usuario_id, $horario_id, $remedio_global_id, $programacion_id, '$fecha_hoy', '08:00:00', 'pendiente', '1 tableta')";
    
    if (!$conn->query($sql_registro)) {
        throw new Exception("Error al crear registro: " . $conn->error);
    }
    
    $registro_id = $conn->insert_id;
    echo "<p>✅ Registro de toma creado ID: $registro_id</p>";
    
    $conn->commit();
    
    echo "<div style='background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;'>";
    echo "<h3>✅ ¡Datos mínimos creados exitosamente!</h3>";
    echo "<p><strong>Registro ID para probar:</strong> $registro_id</p>";
    echo "<p><strong>Usuario ID:</strong> $usuario_id</p>";
    echo "<p><strong>Estado:</strong> pendiente</p>";
    echo "</div>";
    
    // Mostrar el registro creado
    echo "<h3>📋 Registro Creado:</h3>";
    $sql_mostrar = "SELECT rt.*, rg.nombre_comercial 
                   FROM registro_tomas rt 
                   LEFT JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id 
                   WHERE rt.registro_id = $registro_id";
    
    $result_mostrar = $conn->query($sql_mostrar);
    if ($result_mostrar->num_rows > 0) {
        $registro = $result_mostrar->fetch_assoc();
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Campo</th><th>Valor</th></tr>";
        foreach ($registro as $campo => $valor) {
            echo "<tr><td>$campo</td><td>$valor</td></tr>";
        }
        echo "</table>";
    }
    
} catch (Exception $e) {
    $conn->rollback();
    echo "<div style='background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545;'>";
    echo "<h3>❌ Error:</h3>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}

echo "<p><a href='debug_confirmar_toma.php' style='background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🔍 Ver Debug</a></p>";
?>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
}
table {
    width: 100%;
    margin: 10px 0;
}
th, td {
    padding: 8px;
    text-align: left;
}
th {
    background: #f0f0f0;
}
</style>
