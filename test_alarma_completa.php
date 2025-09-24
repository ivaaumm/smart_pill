<?php
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Alarma Completa - Smart Pill</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .button { display: inline-block; padding: 10px 20px; margin: 5px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .button:hover { background: #0056b3; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Test Alarma Completa - Smart Pill</h1>
        <p>Simulando el escenario completo de alarma con los datos del usuario</p>

        <?php
        // Configuración de conexión
        $host = '192.168.1.87';
        $dbname = 'smart_pill';
        $username = 'root';
        $password = '';

        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            echo "<div class='section success'>✅ Conexión a base de datos exitosa</div>";
        } catch (PDOException $e) {
            echo "<div class='section error'>❌ Error de conexión: " . $e->getMessage() . "</div>";
            exit;
        }

        // Datos de prueba del usuario (exactos del log)
        $notificationData = [
            'medicamento' => 'Benazepril',
            'hora' => '12:48',
            'dosis' => '1 pastilla',
            'programacionId' => '110',
            'alarmaId' => 52,
            'horario_id' => null,
            'usuario_id' => '1',
            'sound' => 'default'
        ];

        echo "<div class='section info'>";
        echo "<h3>📱 Datos de notificationData (simulados del log del usuario):</h3>";
        echo "<pre>" . json_encode($notificationData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
        echo "</div>";

        // Verificar si registro_id está disponible
        echo "<div class='section warning'>";
        echo "<h3>🔍 Verificación de registro_id:</h3>";
        if (isset($notificationData['registro_id'])) {
            echo "<p>✅ registro_id disponible: " . $notificationData['registro_id'] . "</p>";
        } else {
            echo "<p>❌ registro_id NO disponible (undefined) - Este es el problema reportado</p>";
        }
        echo "</div>";

        // Simular la nueva lógica: obtener registro_id desde el endpoint
        echo "<div class='section info'>";
        echo "<h3>🔄 Simulando obtención de registro_id desde endpoint:</h3>";
        
        $programacion_id = $notificationData['programacionId'];
        $usuario_id = $notificationData['usuario_id'];
        
        echo "<p>Parámetros: programacion_id={$programacion_id}, usuario_id={$usuario_id}</p>";
        
        // Consulta para obtener registro pendiente
        $sql = "SELECT rt.registro_id, rt.fecha_programada, rt.hora_programada, rt.estado,
                       rg.nombre_comercial as medicamento_nombre, pt.dosis_por_toma as dosis, pt.usuario_id
                FROM registro_tomas rt
                INNER JOIN programacion_tratamientos pt ON rt.programacion_id = pt.programacion_id
                INNER JOIN remedio_global rg ON rt.remedio_global_id = rg.remedio_global_id
                WHERE rt.programacion_id = :programacion_id 
                AND rt.usuario_id = :usuario_id 
                AND rt.estado = 'pendiente'
                ORDER BY rt.fecha_programada ASC, rt.hora_programada ASC
                LIMIT 1";
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':programacion_id', $programacion_id, PDO::PARAM_INT);
            $stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
            $stmt->execute();
            
            $registro = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($registro) {
                echo "<div class='success'>";
                echo "<p>✅ registro_id obtenido exitosamente: <strong>{$registro['registro_id']}</strong></p>";
                echo "<table>";
                echo "<tr><th>Campo</th><th>Valor</th></tr>";
                foreach ($registro as $key => $value) {
                    echo "<tr><td>{$key}</td><td>{$value}</td></tr>";
                }
                echo "</table>";
                echo "</div>";
                
                $registro_id_obtenido = $registro['registro_id'];
            } else {
                echo "<div class='error'>";
                echo "<p>❌ No se encontró registro pendiente para programación {$programacion_id} y usuario {$usuario_id}</p>";
                echo "</div>";
                $registro_id_obtenido = null;
            }
        } catch (PDOException $e) {
            echo "<div class='error'>";
            echo "<p>❌ Error en consulta: " . $e->getMessage() . "</p>";
            echo "</div>";
            $registro_id_obtenido = null;
        }
        echo "</div>";

        // Simular actualización del registro
        if ($registro_id_obtenido) {
            echo "<div class='section success'>";
            echo "<h3>📝 Simulando actualización de registro (acción: tomada):</h3>";
            
            $nuevo_estado = 'tomada';
            $observaciones = 'Medicamento tomado desde la pantalla de alarma (TEST)';
            
            $sql_update = "UPDATE registro_tomas 
                          SET estado = :nuevo_estado, 
                              observaciones = :observaciones,
                              fecha_hora_accion = NOW()
                          WHERE registro_id = :registro_id";
            
            try {
                $stmt_update = $pdo->prepare($sql_update);
                $stmt_update->bindParam(':nuevo_estado', $nuevo_estado);
                $stmt_update->bindParam(':observaciones', $observaciones);
                $stmt_update->bindParam(':registro_id', $registro_id_obtenido, PDO::PARAM_INT);
                
                if ($stmt_update->execute()) {
                    $affected_rows = $stmt_update->rowCount();
                    echo "<p>✅ Registro actualizado exitosamente</p>";
                    echo "<p>Filas afectadas: {$affected_rows}</p>";
                    echo "<p>Estado cambiado a: <strong>{$nuevo_estado}</strong></p>";
                    echo "<p>Observaciones: {$observaciones}</p>";
                } else {
                    echo "<p>❌ Error al actualizar el registro</p>";
                }
            } catch (PDOException $e) {
                echo "<p>❌ Error en actualización: " . $e->getMessage() . "</p>";
            }
            echo "</div>";
        }

        // Mostrar estado actual de registros para la programación
        echo "<div class='section info'>";
        echo "<h3>📊 Estado actual de registros para programación {$programacion_id}:</h3>";
        
        $sql_status = "SELECT registro_id, fecha_programada, hora_programada, estado, 
                              fecha_hora_accion, observaciones
                       FROM registro_tomas 
                       WHERE programacion_id = :programacion_id 
                       AND usuario_id = :usuario_id
                       ORDER BY fecha_programada DESC, hora_programada DESC
                       LIMIT 10";
        
        try {
            $stmt_status = $pdo->prepare($sql_status);
            $stmt_status->bindParam(':programacion_id', $programacion_id, PDO::PARAM_INT);
            $stmt_status->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
            $stmt_status->execute();
            
            $registros = $stmt_status->fetchAll(PDO::FETCH_ASSOC);
            
            if ($registros) {
                echo "<table>";
                echo "<tr><th>ID</th><th>Fecha Prog.</th><th>Hora Prog.</th><th>Estado</th><th>Fecha Acción</th><th>Observaciones</th></tr>";
                foreach ($registros as $reg) {
                    $class = '';
                    switch ($reg['estado']) {
                        case 'tomada': $class = 'style="background-color: #d4edda;"'; break;
                        case 'pendiente': $class = 'style="background-color: #fff3cd;"'; break;
                        case 'rechazada': $class = 'style="background-color: #f8d7da;"'; break;
                        case 'pospuesta': $class = 'style="background-color: #d1ecf1;"'; break;
                    }
                    echo "<tr {$class}>";
                    echo "<td>{$reg['registro_id']}</td>";
                    echo "<td>{$reg['fecha_programada']}</td>";
                    echo "<td>{$reg['hora_programada']}</td>";
                    echo "<td><strong>{$reg['estado']}</strong></td>";
                    echo "<td>" . ($reg['fecha_hora_accion'] ?: '-') . "</td>";
                    echo "<td>" . ($reg['observaciones'] ?: '-') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "<p>No se encontraron registros</p>";
            }
        } catch (PDOException $e) {
            echo "<p>❌ Error consultando registros: " . $e->getMessage() . "</p>";
        }
        echo "</div>";

        // Resumen de la solución
        echo "<div class='section success'>";
        echo "<h3>🎯 Resumen de la solución implementada:</h3>";
        echo "<ol>";
        echo "<li><strong>Problema identificado:</strong> notificationData no contiene registro_id</li>";
        echo "<li><strong>Solución:</strong> Obtener registro_id dinámicamente desde el endpoint obtener_registro_pendiente.php</li>";
        echo "<li><strong>Implementación:</strong> Nueva función obtenerRegistroId() en ambas pantallas de alarma</li>";
        echo "<li><strong>Función unificada:</strong> handleAlarmAction() maneja todas las acciones (tomada, pospuesta, rechazada)</li>";
        echo "<li><strong>Fallback:</strong> Si no se puede obtener registro_id, se muestra error informativo</li>";
        echo "</ol>";
        echo "</div>";

        // Enlaces de prueba
        echo "<div class='section info'>";
        echo "<h3>🔗 Enlaces de prueba:</h3>";
        echo "<a href='obtener_registro_pendiente.php?programacion_id={$programacion_id}&usuario_id={$usuario_id}' class='button' target='_blank'>Probar endpoint obtener_registro_pendiente</a>";
        echo "<a href='test_obtener_registro.php' class='button' target='_blank'>Ejecutar test completo</a>";
        echo "<a href='crear_registros_programacion_110.php' class='button' target='_blank'>Crear más registros de prueba</a>";
        echo "</div>";
        ?>
    </div>
</body>
</html>
