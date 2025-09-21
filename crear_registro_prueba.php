<?php
// Script para crear un registro de prueba pendiente
header("Content-Type: application/json; charset=UTF-8");

include "smart_pill_api/conexion.php";

echo "<h2>🔧 Creando Registro de Prueba</h2>";

// Crear un registro pendiente para el usuario 1
$fecha_hoy = date('Y-m-d');
$hora_actual = date('H:i:s');

$sql_insertar = "INSERT INTO registro_tomas 
                 (usuario_id, remedio_global_id, programacion_id, fecha_programada, hora_programada, 
                  fecha_hora_accion, estado, dosis_programada, observaciones) 
                 VALUES 
                 (1, 14, 106, '$fecha_hoy', '$hora_actual', NOW(), 'pendiente', '1 tableta', 'Registro de prueba creado automáticamente')";

if ($conn->query($sql_insertar) === TRUE) {
    $nuevo_id = $conn->insert_id;
    echo "<p style='color: green;'>✅ Registro creado exitosamente con ID: $nuevo_id</p>";
    
    // Mostrar el registro creado
    $sql_mostrar = "SELECT * FROM registro_tomas WHERE registro_id = $nuevo_id";
    $resultado = $conn->query($sql_mostrar);
    
    if ($resultado && $resultado->num_rows > 0) {
        $registro = $resultado->fetch_assoc();
        echo "<h3>📋 Registro creado:</h3>";
        echo "<pre>" . json_encode($registro, JSON_PRETTY_PRINT) . "</pre>";
    }
    
} else {
    echo "<p style='color: red;'>❌ Error al crear el registro: " . $conn->error . "</p>";
}

$conn->close();
?>

<script>
// Redirigir automáticamente al test después de 2 segundos
setTimeout(function() {
    window.location.href = 'test_actualizar_estado.php';
}, 2000);
</script>

<p><a href="test_actualizar_estado.php">🧪 Ir al test de actualización</a></p>
