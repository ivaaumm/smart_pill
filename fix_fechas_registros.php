<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Fix Fechas Registros</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Arreglar Fechas de Registros</h1>
        
        <?php
        try {
            include 'smart_pill_api/conexion.php';
            
            // Mostrar registros actuales
            echo "<div class='section info'>";
            echo "<h3>📋 Registros actuales:</h3>";
            
            $sql = "SELECT registro_id, usuario_id, fecha_programada, hora_programada, estado, fecha_creacion FROM registro_tomas ORDER BY fecha_creacion DESC";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                echo "<table>";
                echo "<tr><th>ID</th><th>Usuario</th><th>Fecha Prog.</th><th>Hora Prog.</th><th>Estado</th><th>Fecha Creación</th></tr>";
                
                while ($row = $result->fetch_assoc()) {
                    echo "<tr>";
                    echo "<td>" . $row['registro_id'] . "</td>";
                    echo "<td>" . $row['usuario_id'] . "</td>";
                    echo "<td>" . $row['fecha_programada'] . "</td>";
                    echo "<td>" . $row['hora_programada'] . "</td>";
                    echo "<td>" . $row['estado'] . "</td>";
                    echo "<td>" . $row['fecha_creacion'] . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "<p>No hay registros</p>";
            }
            echo "</div>";
            
            // Actualizar fechas a hoy
            $fecha_hoy = date('Y-m-d');
            $hora_actual = date('H:i:s');
            
            echo "<div class='section'>";
            echo "<h3>🔄 Actualizando fechas a hoy ($fecha_hoy):</h3>";
            
            // Actualizar registros pendientes a hoy
            $sql_update = "UPDATE registro_tomas 
                          SET fecha_programada = ?, 
                              hora_programada = CASE 
                                  WHEN TIME(hora_programada) < ? THEN ADDTIME(?, '01:00:00')
                                  ELSE hora_programada 
                              END
                          WHERE estado = 'pendiente'";
            
            $stmt = $conn->prepare($sql_update);
            $stmt->bind_param("sss", $fecha_hoy, $hora_actual, $hora_actual);
            
            if ($stmt->execute()) {
                $affected = $stmt->affected_rows;
                echo "<p class='success'>✅ Se actualizaron $affected registros pendientes</p>";
            } else {
                echo "<p class='error'>❌ Error al actualizar: " . $stmt->error . "</p>";
            }
            
            $stmt->close();
            
            // Crear algunos registros adicionales para hoy
            echo "<h3>➕ Creando registros adicionales para hoy:</h3>";
            
            // Obtener datos de ejemplo
            $sql_datos = "SELECT h.horario_id, h.programacion_id, p.remedio_global_id, p.usuario_id, h.hora, h.dosis 
                         FROM horarios_tratamiento h 
                         JOIN programacion_tratamientos p ON h.programacion_id = p.programacion_id 
                         WHERE p.usuario_id = 1 
                         LIMIT 3";
            
            $result_datos = $conn->query($sql_datos);
            
            if ($result_datos->num_rows > 0) {
                $contador = 0;
                while ($datos = $result_datos->fetch_assoc() && $contador < 3) {
                    // Crear horarios para hoy
                    $horas = ['08:00:00', '14:00:00', '20:00:00'];
                    $hora_registro = $horas[$contador];
                    
                    $sql_insert = "INSERT INTO registro_tomas 
                                  (usuario_id, horario_id, programacion_id, remedio_global_id, 
                                   fecha_programada, hora_programada, estado, dosis_programada, 
                                   fecha_creacion) 
                                  VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, NOW())";
                    
                    $stmt_insert = $conn->prepare($sql_insert);
                    $stmt_insert->bind_param("iiisssd", 
                        $datos['usuario_id'],
                        $datos['horario_id'],
                        $datos['programacion_id'],
                        $datos['remedio_global_id'],
                        $fecha_hoy,
                        $hora_registro,
                        $datos['dosis']
                    );
                    
                    if ($stmt_insert->execute()) {
                        echo "<p class='success'>✅ Creado registro para las $hora_registro</p>";
                    } else {
                        echo "<p class='error'>❌ Error al crear registro: " . $stmt_insert->error . "</p>";
                    }
                    
                    $stmt_insert->close();
                    $contador++;
                }
            }
            
            echo "</div>";
            
            // Mostrar registros actualizados
            echo "<div class='section success'>";
            echo "<h3>📋 Registros después de la actualización:</h3>";
            
            $sql = "SELECT registro_id, usuario_id, fecha_programada, hora_programada, estado, fecha_creacion FROM registro_tomas ORDER BY fecha_programada DESC, hora_programada DESC";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                echo "<table>";
                echo "<tr><th>ID</th><th>Usuario</th><th>Fecha Prog.</th><th>Hora Prog.</th><th>Estado</th><th>Fecha Creación</th></tr>";
                
                while ($row = $result->fetch_assoc()) {
                    $highlight = ($row['fecha_programada'] == $fecha_hoy) ? 'style="background-color: #fff3cd;"' : '';
                    echo "<tr $highlight>";
                    echo "<td>" . $row['registro_id'] . "</td>";
                    echo "<td>" . $row['usuario_id'] . "</td>";
                    echo "<td>" . $row['fecha_programada'] . "</td>";
                    echo "<td>" . $row['hora_programada'] . "</td>";
                    echo "<td>" . $row['estado'] . "</td>";
                    echo "<td>" . $row['fecha_creacion'] . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
            echo "</div>";
            
            $conn->close();
            
        } catch (Exception $e) {
            echo "<div class='section error'>";
            echo "<h3>❌ Error:</h3>";
            echo "<p>" . $e->getMessage() . "</p>";
            echo "</div>";
        }
        ?>
        
        <div class="section">
            <h3>🔧 Próximos pasos:</h3>
            <p><a href="debug_app_registros.php" target="_blank">🔍 Probar la API nuevamente</a></p>
            <p><a href="test_registros_api.php" target="_blank">📡 Test completo de la API</a></p>
        </div>
    </div>
</body>
</html>
