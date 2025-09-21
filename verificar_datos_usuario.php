<?php
require_once 'smart_pill_api/conexion.php';

echo "<h2>🔍 Verificación de Datos del Usuario 1</h2>";

$usuario_id = 1;

// Verificar si el usuario existe
echo "<h3>👤 Información del Usuario:</h3>";
$query_usuario = "SELECT * FROM usuarios WHERE id = ?";
$stmt = $conn->prepare($query_usuario);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result_usuario = $stmt->get_result();

if ($result_usuario->num_rows > 0) {
    $usuario = $result_usuario->fetch_assoc();
    echo "<p style='color: green;'>✅ Usuario encontrado: <strong>" . htmlspecialchars($usuario['nombre']) . "</strong></p>";
    echo "<p>📧 Email: " . htmlspecialchars($usuario['email']) . "</p>";
} else {
    echo "<p style='color: red;'>❌ Usuario con ID 1 no encontrado</p>";
}

// Verificar programaciones del usuario
echo "<h3>💊 Programaciones de Medicamentos:</h3>";
$query_programaciones = "SELECT p.*, rg.nombre as medicamento_nombre 
                        FROM programaciones p 
                        LEFT JOIN remedio_global rg ON p.remedio_global_id = rg.id 
                        WHERE p.usuario_id = ?";
$stmt = $conn->prepare($query_programaciones);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result_programaciones = $stmt->get_result();

if ($result_programaciones->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Estado</th>";
    echo "</tr>";
    
    while ($prog = $result_programaciones->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $prog['id'] . "</td>";
        echo "<td>" . htmlspecialchars($prog['medicamento_nombre']) . "</td>";
        echo "<td>" . $prog['dosis_mg'] . " mg</td>";
        echo "<td>" . $prog['frecuencia_horas'] . " horas</td>";
        echo "<td>" . $prog['fecha_inicio'] . "</td>";
        echo "<td>" . ($prog['fecha_fin'] ?: 'Sin fin') . "</td>";
        echo "<td>" . $prog['estado'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: orange;'>⚠️ No hay programaciones de medicamentos para este usuario</p>";
}

// Verificar horarios
echo "<h3>⏰ Horarios Programados:</h3>";
$query_horarios = "SELECT h.*, p.id as prog_id, rg.nombre as medicamento_nombre 
                   FROM horarios h 
                   LEFT JOIN programaciones p ON h.programacion_id = p.id 
                   LEFT JOIN remedio_global rg ON p.remedio_global_id = rg.id 
                   WHERE p.usuario_id = ?";
$stmt = $conn->prepare($query_horarios);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result_horarios = $stmt->get_result();

if ($result_horarios->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Medicamento</th><th>Hora</th><th>Programación ID</th>";
    echo "</tr>";
    
    while ($horario = $result_horarios->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $horario['id'] . "</td>";
        echo "<td>" . htmlspecialchars($horario['medicamento_nombre']) . "</td>";
        echo "<td>" . $horario['hora'] . "</td>";
        echo "<td>" . $horario['prog_id'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: orange;'>⚠️ No hay horarios programados para este usuario</p>";
}

// Verificar registros de tomas
echo "<h3>📋 Registros de Tomas:</h3>";
$query_registros = "SELECT rt.*, rg.nombre as medicamento_nombre 
                    FROM registro_tomas rt 
                    LEFT JOIN remedio_global rg ON rt.remedio_global_id = rg.id 
                    WHERE rt.usuario_id = ? 
                    ORDER BY rt.fecha_programada DESC, rt.hora_programada DESC 
                    LIMIT 20";
$stmt = $conn->prepare($query_registros);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result_registros = $stmt->get_result();

if ($result_registros->num_rows > 0) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Medicamento</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Creado</th>";
    echo "</tr>";
    
    while ($registro = $result_registros->fetch_assoc()) {
        $color = '';
        switch($registro['estado']) {
            case 'pendiente': $color = 'background: #fff3cd;'; break;
            case 'tomada': $color = 'background: #d4edda;'; break;
            case 'rechazada': $color = 'background: #f8d7da;'; break;
            case 'pospuesta': $color = 'background: #d1ecf1;'; break;
        }
        
        echo "<tr style='$color'>";
        echo "<td>" . $registro['id'] . "</td>";
        echo "<td>" . htmlspecialchars($registro['medicamento_nombre']) . "</td>";
        echo "<td>" . $registro['fecha_programada'] . "</td>";
        echo "<td>" . $registro['hora_programada'] . "</td>";
        echo "<td><strong>" . $registro['estado'] . "</strong></td>";
        echo "<td>" . $registro['fecha_creacion'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color: red;'>❌ No hay registros de tomas para este usuario</p>";
}

// Mostrar el rango de fechas que está consultando la app
echo "<h3>📅 Rango de Fechas de la Consulta:</h3>";
$fecha_actual = date('Y-m-d');
$fecha_inicio = date('Y-m-d', strtotime('-7 days'));
$fecha_fin = date('Y-m-d', strtotime('+7 days'));

echo "<p><strong>Fecha actual:</strong> $fecha_actual</p>";
echo "<p><strong>Rango consultado:</strong> $fecha_inicio hasta $fecha_fin</p>";

// Verificar si hay registros en ese rango específico
$query_rango = "SELECT COUNT(*) as total FROM registro_tomas 
                WHERE usuario_id = ? 
                AND fecha_programada BETWEEN ? AND ?";
$stmt = $conn->prepare($query_rango);
$stmt->bind_param("iss", $usuario_id, $fecha_inicio, $fecha_fin);
$stmt->execute();
$result_rango = $stmt->get_result();
$total_rango = $result_rango->fetch_assoc()['total'];

echo "<p><strong>Registros en el rango:</strong> $total_rango</p>";

// Sugerencias
echo "<hr>";
echo "<h3>💡 Sugerencias:</h3>";

if ($result_programaciones->num_rows == 0) {
    echo "<div style='background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;'>";
    echo "<h4>🎯 Crear Programación de Medicamento</h4>";
    echo "<p>Para que aparezcan registros, necesitas:</p>";
    echo "<ol>";
    echo "<li>Crear una programación de medicamento para el usuario</li>";
    echo "<li>Definir horarios para esa programación</li>";
    echo "<li>El sistema generará automáticamente los registros de tomas</li>";
    echo "</ol>";
    echo "</div>";
}

echo "<div style='background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin-top: 10px;'>";
echo "<h4>🧪 Crear Datos de Prueba</h4>";
echo "<p><a href='crear_datos_prueba.php' style='background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>➕ Crear Datos de Prueba</a></p>";
echo "</div>";

$conn->close();
?>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 1000px;
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
</style>
