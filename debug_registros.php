<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include "smart_pill_api/conexion.php";

try {
    $usuario_id = 1; // Usuario de prueba
    
    echo "<h2>🔍 Debug: Registros de Tomas</h2>";
    
    // 1. Verificar si existen registros en la tabla
    echo "<h3>1. Registros en tabla registro_tomas:</h3>";
    $sql_count = "SELECT COUNT(*) as total FROM registro_tomas WHERE usuario_id = $usuario_id";
    $result = $conn->query($sql_count);
    $count = $result->fetch_assoc();
    echo "<p>Total registros para usuario $usuario_id: <strong>{$count['total']}</strong></p>";
    
    // 2. Mostrar algunos registros recientes
    echo "<h3>2. Últimos 10 registros:</h3>";
    $sql_recent = "SELECT * FROM registro_tomas WHERE usuario_id = $usuario_id ORDER BY fecha_creacion DESC LIMIT 10";
    $result = $conn->query($sql_recent);
    
    if ($result->num_rows > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Horario ID</th><th>Fecha Prog.</th><th>Hora Prog.</th><th>Estado</th><th>Fecha Creación</th></tr>";
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>{$row['registro_id']}</td>";
            echo "<td>{$row['horario_id']}</td>";
            echo "<td>{$row['fecha_programada']}</td>";
            echo "<td>{$row['hora_programada']}</td>";
            echo "<td>{$row['estado']}</td>";
            echo "<td>{$row['fecha_creacion']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>❌ No se encontraron registros</p>";
    }
    
    // 3. Verificar horarios_tratamiento
    echo "<h3>3. Horarios de tratamiento para usuario $usuario_id:</h3>";
    $sql_horarios = "SELECT COUNT(*) as total FROM horarios_tratamiento WHERE usuario_id = $usuario_id";
    $result = $conn->query($sql_horarios);
    $count_horarios = $result->fetch_assoc();
    echo "<p>Total horarios: <strong>{$count_horarios['total']}</strong></p>";
    
    // 4. Verificar programaciones
    echo "<h3>4. Programaciones de tratamiento para usuario $usuario_id:</h3>";
    $sql_prog = "SELECT COUNT(*) as total FROM programacion_tratamientos WHERE usuario_id = $usuario_id";
    $result = $conn->query($sql_prog);
    $count_prog = $result->fetch_assoc();
    echo "<p>Total programaciones: <strong>{$count_prog['total']}</strong></p>";
    
    // 5. Probar la consulta completa de la API
    echo "<h3>5. Prueba de consulta completa (últimos 30 días):</h3>";
    $fecha_desde = date('Y-m-d', strtotime('-30 days'));
    $fecha_hasta = date('Y-m-d');
    
    $sql_completa = "SELECT 
                rt.*,
                ht.dia_semana,
                ht.hora as hora_tratamiento,
                ht.dosis as dosis_horario,
                pt.nombre_tratamiento,
                rg.nombre_comercial,
                rg.descripcion,
                ro.registro_id as registro_original_id_ref,
                ro.estado as estado_original
            FROM registro_tomas rt
            JOIN horarios_tratamiento ht ON rt.horario_id = ht.horario_id
            JOIN programacion_tratamientos pt ON rt.programacion_id = pt.programacion_id
            JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id
            LEFT JOIN registro_tomas ro ON rt.registro_original_id = ro.registro_id
            WHERE rt.usuario_id = $usuario_id 
            AND rt.fecha_programada BETWEEN '$fecha_desde' AND '$fecha_hasta'
            ORDER BY rt.fecha_programada DESC, rt.hora_programada DESC, rt.fecha_creacion DESC
            LIMIT 5";
    
    echo "<p><strong>Consulta:</strong> $sql_completa</p>";
    
    $result = $conn->query($sql_completa);
    if ($result) {
        echo "<p>✅ Consulta ejecutada correctamente. Resultados: <strong>{$result->num_rows}</strong></p>";
        
        if ($result->num_rows > 0) {
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>Registro ID</th><th>Medicamento</th><th>Fecha</th><th>Hora</th><th>Estado</th></tr>";
            while ($row = $result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>{$row['registro_id']}</td>";
                echo "<td>{$row['nombre_comercial']}</td>";
                echo "<td>{$row['fecha_programada']}</td>";
                echo "<td>{$row['hora_programada']}</td>";
                echo "<td>{$row['estado']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "<p>❌ Error en consulta: " . $conn->error . "</p>";
    }
    
    // 6. Verificar relaciones faltantes
    echo "<h3>6. Verificar integridad de relaciones:</h3>";
    
    // Registros sin horario válido
    $sql_sin_horario = "SELECT COUNT(*) as total FROM registro_tomas rt 
                        LEFT JOIN horarios_tratamiento ht ON rt.horario_id = ht.horario_id 
                        WHERE rt.usuario_id = $usuario_id AND ht.horario_id IS NULL";
    $result = $conn->query($sql_sin_horario);
    $sin_horario = $result->fetch_assoc();
    echo "<p>Registros sin horario válido: <strong>{$sin_horario['total']}</strong></p>";
    
    // Registros sin programación válida
    $sql_sin_prog = "SELECT COUNT(*) as total FROM registro_tomas rt 
                     LEFT JOIN programacion_tratamientos pt ON rt.programacion_id = pt.programacion_id 
                     WHERE rt.usuario_id = $usuario_id AND pt.programacion_id IS NULL";
    $result = $conn->query($sql_sin_prog);
    $sin_prog = $result->fetch_assoc();
    echo "<p>Registros sin programación válida: <strong>{$sin_prog['total']}</strong></p>";
    
    // Registros sin remedio válido
    $sql_sin_remedio = "SELECT COUNT(*) as total FROM registro_tomas rt 
                        LEFT JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id 
                        WHERE rt.usuario_id = $usuario_id AND rg.remedio_global_id IS NULL";
    $result = $conn->query($sql_sin_remedio);
    $sin_remedio = $result->fetch_assoc();
    echo "<p>Registros sin remedio válido: <strong>{$sin_remedio['total']}</strong></p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}

$conn->close();
?>
