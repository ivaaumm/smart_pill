<?php
// Script para ayudar a configurar MySQL
echo "<h2>🔧 Configuración de Usuario MySQL</h2>";

echo "<h3>📋 Instrucciones para Configurar MySQL:</h3>";

echo "<div style='background: #f0f8ff; padding: 15px; border-left: 4px solid #007cba; margin: 10px 0;'>";
echo "<h4>🎯 Método 1: Usando phpMyAdmin (Recomendado)</h4>";
echo "<ol>";
echo "<li>Abre XAMPP Control Panel</li>";
echo "<li>Haz clic en 'Admin' junto a MySQL para abrir phpMyAdmin</li>";
echo "<li>Ve a la pestaña 'Cuentas de usuario'</li>";
echo "<li>Busca el usuario 'root' con host 'localhost'</li>";
echo "<li>Haz clic en 'Editar privilegios'</li>";
echo "<li>En la sección 'Cambiar contraseña', selecciona 'Sin contraseña'</li>";
echo "<li>Haz clic en 'Continuar'</li>";
echo "</ol>";
echo "</div>";

echo "<div style='background: #fff8dc; padding: 15px; border-left: 4px solid #ffa500; margin: 10px 0;'>";
echo "<h4>⚡ Método 2: Reiniciar MySQL en XAMPP</h4>";
echo "<ol>";
echo "<li>En XAMPP Control Panel, haz clic en 'Stop' junto a MySQL</li>";
echo "<li>Espera unos segundos</li>";
echo "<li>Haz clic en 'Start' para reiniciar MySQL</li>";
echo "<li>Verifica que aparezca en verde 'Running'</li>";
echo "</ol>";
echo "</div>";

echo "<div style='background: #f0fff0; padding: 15px; border-left: 4px solid #32cd32; margin: 10px 0;'>";
echo "<h4>🗄️ Método 3: Verificar Base de Datos</h4>";
echo "<ol>";
echo "<li>En phpMyAdmin, verifica que existe la base de datos 'smart_pill'</li>";
echo "<li>Si no existe, créala:</li>";
echo "<ul>";
echo "<li>Haz clic en 'Nueva' en el panel izquierdo</li>";
echo "<li>Escribe 'smart_pill' como nombre</li>";
echo "<li>Selecciona 'utf8_general_ci' como cotejamiento</li>";
echo "<li>Haz clic en 'Crear'</li>";
echo "</ul>";
echo "<li>Importa las tablas desde el archivo SQL en la carpeta 'database/'</li>";
echo "</ol>";
echo "</div>";

echo "<h3>🔍 Verificación:</h3>";
echo "<p>Después de seguir estos pasos:</p>";
echo "<ol>";
echo "<li><a href='test_connection.php' target='_blank' style='color: #007cba;'>🔗 Ejecuta el diagnóstico de conexión</a></li>";
echo "<li><a href='debug_toma_medicamento.php' target='_blank' style='color: #007cba;'>🔗 Prueba el sistema de medicamentos</a></li>";
echo "</ol>";

echo "<div style='background: #ffe4e1; padding: 15px; border-left: 4px solid #ff6b6b; margin: 20px 0;'>";
echo "<h4>⚠️ Si el problema persiste:</h4>";
echo "<p>El error puede deberse a:</p>";
echo "<ul>";
echo "<li><strong>XAMPP no está completamente iniciado</strong></li>";
echo "<li><strong>Puerto 3306 está siendo usado por otro programa</strong></li>";
echo "<li><strong>Configuración de MySQL corrupta</strong></li>";
echo "</ul>";
echo "<p><strong>Solución drástica:</strong> Reinstalar XAMPP o usar WAMP/MAMP como alternativa.</p>";
echo "</div>";

// Mostrar información del sistema
echo "<hr>";
echo "<h3>📊 Información del Sistema:</h3>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>MySQLi Extension:</strong> " . (extension_loaded('mysqli') ? '✅ Disponible' : '❌ No disponible') . "</p>";
echo "<p><strong>Servidor Web:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
?>

<style>
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
}
h2, h3, h4 {
    color: #333;
}
ol, ul {
    padding-left: 20px;
}
li {
    margin: 5px 0;
}
a {
    text-decoration: none;
    font-weight: bold;
}
a:hover {
    text-decoration: underline;
}
</style>
