<?php
require_once 'smart_pill_api/conexion.php';

echo "<h2>🧹 Limpiando datos de prueba del usuario 1</h2>";

try {
    $conn->begin_transaction();
    
    // Eliminar en orden correcto por las claves foráneas
    $result1 = $conn->query("DELETE FROM registro_tomas WHERE usuario_id = 1");
    echo "<p>✅ Registros de tomas eliminados: " . $conn->affected_rows . "</p>";
    
    $result2 = $conn->query("DELETE FROM horarios_tratamiento WHERE usuario_id = 1");
    echo "<p>✅ Horarios eliminados: " . $conn->affected_rows . "</p>";
    
    $result3 = $conn->query("DELETE FROM programacion_tratamientos WHERE usuario_id = 1");
    echo "<p>✅ Programaciones eliminadas: " . $conn->affected_rows . "</p>";
    
    $conn->commit();
    
    echo "<div style='background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;'>";
    echo "<h3>✅ ¡Datos de prueba limpiados exitosamente!</h3>";
    echo "<p>La base de datos está ahora limpia para el usuario 1.</p>";
    echo "</div>";
    
} catch (Exception $e) {
    $conn->rollback();
    echo "<div style='background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545;'>";
    echo "<h3>❌ Error al limpiar datos:</h3>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}

echo "<p><a href='verificar_datos_usuario.php' style='background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>👀 Verificar Datos</a></p>";
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
</style>
