<?php
// Script para consultar horarios válidos
header("Content-Type: application/json; charset=UTF-8");

include "smart_pill_api/conexion.php";

echo "<h2>🔍 Consultando Horarios del Usuario 1</h2>";

// Consultar horarios del usuario 1
$sql_horarios = "SELECT horario_id, tratamiento_id, usuario_id, remedio_global_id, hora, dia_semana 
                 FROM horarios_tratamiento 
                 WHERE usuario_id = 1 
                 LIMIT 5";

$resultado = $conn->query($sql_horarios);

if ($resultado && $resultado->num_rows > 0) {
    echo "<h3>📋 Horarios encontrados:</h3>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Horario ID</th><th>Tratamiento ID</th><th>Usuario ID</th><th>Remedio Global ID</th><th>Hora</th><th>Día</th></tr>";
    
    while ($row = $resultado->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['horario_id'] . "</td>";
        echo "<td>" . $row['tratamiento_id'] . "</td>";
        echo "<td>" . $row['usuario_id'] . "</td>";
        echo "<td>" . $row['remedio_global_id'] . "</td>";
        echo "<td>" . $row['hora'] . "</td>";
        echo "<td>" . $row['dia_semana'] . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
    // Tomar el primer horario para crear el registro
    $resultado->data_seek(0);
    $primer_horario = $resultado->fetch_assoc();
    
    echo "<h3>🔧 Creando registro con el primer horario:</h3>";
    
    $fecha_hoy = date('Y-m-d');
    $hora_actual = date('H:i:s');
    
    $sql_insertar = "INSERT INTO registro_tomas 
                     (usuario_id, horario_id, remedio_global_id, programacion_id, fecha_programada, hora_programada, 
                      fecha_hora_accion, estado, dosis_programada, observaciones) 
                     VALUES 
                     ({$primer_horario['usuario_id']}, {$primer_horario['horario_id']}, {$primer_horario['remedio_global_id']}, 
                      {$primer_horario['tratamiento_id']}, '$fecha_hoy', '$hora_actual', NOW(), 'pendiente', '1 tableta', 
                      'Registro de prueba creado automáticamente')";
    
    if ($conn->query($sql_insertar) === TRUE) {
        $nuevo_id = $conn->insert_id;
        echo "<p style='color: green;'>✅ Registro creado exitosamente con ID: $nuevo_id</p>";
        
        // Mostrar el registro creado
        $sql_mostrar = "SELECT * FROM registro_tomas WHERE registro_id = $nuevo_id";
        $resultado_mostrar = $conn->query($sql_mostrar);
        
        if ($resultado_mostrar && $resultado_mostrar->num_rows > 0) {
            $registro = $resultado_mostrar->fetch_assoc();
            echo "<h3>📋 Registro creado:</h3>";
            echo "<pre>" . json_encode($registro, JSON_PRETTY_PRINT) . "</pre>";
        }
        
        echo "<p><a href='test_actualizar_estado.php'>🧪 Ir al test de actualización</a></p>";
        
    } else {
        echo "<p style='color: red;'>❌ Error al crear el registro: " . $conn->error . "</p>";
    }
    
} else {
    echo "<p style='color: red;'>❌ No se encontraron horarios para el usuario 1</p>";
    
    // Mostrar todos los usuarios disponibles
    $sql_usuarios = "SELECT DISTINCT usuario_id FROM horarios_tratamiento LIMIT 10";
    $resultado_usuarios = $conn->query($sql_usuarios);
    
    if ($resultado_usuarios && $resultado_usuarios->num_rows > 0) {
        echo "<h3>👥 Usuarios con horarios disponibles:</h3>";
        while ($row = $resultado_usuarios->fetch_assoc()) {
            echo "<p>Usuario ID: " . $row['usuario_id'] . "</p>";
        }
    }
}

$conn->close();
?>
