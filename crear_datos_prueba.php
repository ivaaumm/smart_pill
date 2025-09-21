<?php
require_once 'smart_pill_api/conexion.php';

echo "<h2>🧪 Crear Datos de Prueba para Usuario 1</h2>";

$usuario_id = 1;

// Verificar si ya existen datos
$query_check = "SELECT COUNT(*) as total FROM programacion_tratamientos WHERE usuario_id = ?";
$stmt = $conn->prepare($query_check);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result = $stmt->get_result();
$existing = $result->fetch_assoc()['total'];

if ($existing > 0) {
    echo "<div style='background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;'>";
    echo "<p>⚠️ Ya existen $existing programaciones para el usuario 1.</p>";
    echo "<p><a href='?force=1' style='background: #dc3545; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;'>🗑️ Eliminar y Recrear</a> ";
    echo "<a href='verificar_datos_usuario.php' style='background: #007cba; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;'>👀 Ver Datos Existentes</a></p>";
    echo "</div>";
}

if (isset($_GET['create']) || isset($_GET['force'])) {
    
    // Si force=1, eliminar datos existentes
    if (isset($_GET['force'])) {
        echo "<h3>🗑️ Eliminando datos existentes...</h3>";
        
        // Eliminar en orden correcto por las claves foráneas
        $conn->query("DELETE FROM registro_tomas WHERE usuario_id = $usuario_id");
        $conn->query("DELETE FROM horarios_tratamiento WHERE usuario_id = $usuario_id");
        $conn->query("DELETE FROM programacion_tratamientos WHERE usuario_id = $usuario_id");
        
        echo "<p style='color: green;'>✅ Datos anteriores eliminados</p>";
    }
    
    echo "<h3>➕ Creando datos de prueba...</h3>";
    
    try {
        $conn->begin_transaction();
        
        // 1. Verificar que existan medicamentos en remedio_global
        $result_medicamentos = $conn->query("SELECT * FROM remedio_global LIMIT 3");
        if ($result_medicamentos->num_rows == 0) {
            // Crear algunos medicamentos de ejemplo
            $medicamentos = [
                ['Paracetamol', 'Analgésico y antipirético', 500],
                ['Ibuprofeno', 'Antiinflamatorio no esteroideo', 400],
                ['Omeprazol', 'Inhibidor de la bomba de protones', 20]
            ];
            
            foreach ($medicamentos as $med) {
                $stmt = $conn->prepare("INSERT INTO remedio_global (nombre_comercial, descripcion, peso_unidad) VALUES (?, ?, ?)");
                $stmt->bind_param("ssd", $med[0], $med[1], $med[2]);
                $stmt->execute();
            }
            echo "<p>✅ Medicamentos base creados</p>";
        }
        
        // 2. Obtener medicamentos disponibles
        $medicamentos = [];
        $result = $conn->query("SELECT * FROM remedio_global LIMIT 3");
        while ($row = $result->fetch_assoc()) {
            $medicamentos[] = $row;
        }
        
        // 3. Crear programaciones de tratamiento
        $programaciones_creadas = 0;
        $horarios_creados = 0;
        $registros_creados = 0;
        
        foreach ($medicamentos as $index => $medicamento) {
             // Crear programación
             $nombre_tratamiento = "Tratamiento " . $medicamento['nombre_comercial'];
             $fecha_inicio = date('Y-m-d');
             $fecha_fin = date('Y-m-d', strtotime('+30 days'));
             
             $stmt = $conn->prepare("
                 INSERT INTO programacion_tratamientos 
                 (usuario_id, remedio_global_id, nombre_tratamiento, fecha_inicio, fecha_fin, dosis_por_toma, estado) 
                 VALUES (?, ?, ?, ?, ?, '1 tableta', 'activo')
             ");
             $stmt->bind_param("iisss", $usuario_id, $medicamento['remedio_global_id'], $nombre_tratamiento, $fecha_inicio, $fecha_fin);
             $stmt->execute();
             $programacion_id = $conn->insert_id;
            $programaciones_creadas++;
            
            // Crear horarios para esta programación
             $horarios = ['08:00:00', '16:00:00', '00:00:00']; // 3 veces al día
             $dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
             
             foreach ($dias as $dia) {
                 foreach ($horarios as $hora) {
                     $stmt = $conn->prepare("
                         INSERT INTO horarios_tratamiento 
                         (tratamiento_id, usuario_id, remedio_global_id, dia_semana, hora, dosis, activo) 
                         VALUES (?, ?, ?, ?, ?, '1', 1)
                     ");
                     $stmt->bind_param("iiiss", $programacion_id, $usuario_id, $medicamento['remedio_global_id'], $dia, $hora);
                     $stmt->execute();
                     $horario_id = $conn->insert_id;
                     $horarios_creados++;
                    
                    // Crear registros de tomas para los próximos 7 días
                    for ($i = 0; $i < 7; $i++) {
                        $fecha = date('Y-m-d', strtotime("+$i days"));
                        
                        // Determinar estado aleatorio
                        $estados = ['pendiente', 'tomada', 'rechazada'];
                        $estado = $estados[array_rand($estados)];
                        
                        // Si es tomada, agregar fecha_hora_accion
                        $fecha_hora_accion = null;
                        if ($estado === 'tomada') {
                            $fecha_hora_accion = $fecha . ' ' . $hora;
                        }
                        
                        $stmt = $conn->prepare("
                            INSERT INTO registro_tomas 
                            (usuario_id, horario_id, remedio_global_id, programacion_id, fecha_programada, hora_programada, fecha_hora_accion, estado, dosis_programada) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1 tableta')
                        ");
                        $stmt->bind_param("iiiissss", $usuario_id, $horario_id, $medicamento['remedio_global_id'], $programacion_id, $fecha, $hora, $fecha_hora_accion, $estado);
                        $stmt->execute();
                        $registros_creados++;
                    }
                }
            }
        }
        
        $conn->commit();
        
        echo "<div style='background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;'>";
        echo "<h3>✅ ¡Datos de prueba creados exitosamente!</h3>";
        echo "<ul>";
        echo "<li><strong>$programaciones_creadas</strong> programaciones de tratamiento</li>";
        echo "<li><strong>$horarios_creados</strong> horarios programados</li>";
        echo "<li><strong>$registros_creados</strong> registros de tomas</li>";
        echo "</ul>";
        echo "</div>";
        
        echo "<div style='background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;'>";
        echo "<h3>🎯 Próximos pasos:</h3>";
        echo "<ol>";
        echo "<li>Ve a tu aplicación móvil</li>";
        echo "<li>Navega a la pantalla 'Registro de Tomas'</li>";
        echo "<li>Deberías ver registros con diferentes estados:</li>";
        echo "<ul>";
        echo "<li>🟡 <strong>Pendientes</strong> - Para confirmar</li>";
        echo "<li>🟢 <strong>Tomadas</strong> - Ya confirmadas</li>";
        echo "<li>🔴 <strong>Rechazadas</strong> - Marcadas como no tomadas</li>";
        echo "</ul>";
        echo "<li>Prueba el botón 'Marcar como Tomada' en los pendientes</li>";
        echo "</ol>";
        echo "</div>";
        
        echo "<p><a href='debug_confirmar_toma.php' style='background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🔍 Ver Debug de Confirmación</a></p>";
        
    } catch (Exception $e) {
        $conn->rollback();
        echo "<div style='background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545;'>";
        echo "<h3>❌ Error al crear datos:</h3>";
        echo "<p>" . $e->getMessage() . "</p>";
        echo "</div>";
    }
} else {
    echo "<div style='background: #e2e3e5; padding: 20px; border-radius: 8px; text-align: center;'>";
    echo "<h3>🚀 ¿Listo para crear datos de prueba?</h3>";
    echo "<p>Esto creará medicamentos, horarios y registros de tomas para probar la funcionalidad.</p>";
    echo "<a href='?create=1' style='background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;'>➕ Crear Datos de Prueba</a>";
    echo "</div>";
}
?>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
}
h2, h3 {
    color: #333;
}
ul, ol {
    margin: 10px 0;
}
li {
    margin: 5px 0;
}
</style>
