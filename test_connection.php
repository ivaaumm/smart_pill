<?php
// Script para probar la conexión a la base de datos
echo "<h2>🔍 Diagnóstico de Conexión a Base de Datos</h2>";

// Mostrar información de PHP
echo "<h3>📋 Información del Sistema:</h3>";
echo "<p><strong>Versión PHP:</strong> " . phpversion() . "</p>";
echo "<p><strong>Extensión MySQLi:</strong> " . (extension_loaded('mysqli') ? '✅ Disponible' : '❌ No disponible') . "</p>";

// Configuración de conexión
$host = "localhost";
$user = "root";
$pass = "";
$db = "smart_pill";

echo "<h3>🔧 Configuración de Conexión:</h3>";
echo "<p><strong>Host:</strong> $host</p>";
echo "<p><strong>Usuario:</strong> $user</p>";
echo "<p><strong>Contraseña:</strong> " . (empty($pass) ? "Sin contraseña" : "Con contraseña") . "</p>";
echo "<p><strong>Base de datos:</strong> $db</p>";

// Intentar conexión
echo "<h3>🔌 Prueba de Conexión:</h3>";

try {
    // Primero intentar conectar sin especificar base de datos
    echo "<p>1️⃣ Conectando al servidor MySQL...</p>";
    $conn_test = new mysqli($host, $user, $pass);
    
    if ($conn_test->connect_error) {
        echo "<p style='color: red;'>❌ Error de conexión al servidor: " . $conn_test->connect_error . "</p>";
        echo "<p style='color: orange;'>💡 <strong>Posibles soluciones:</strong></p>";
        echo "<ul>";
        echo "<li>Verificar que XAMPP esté ejecutándose</li>";
        echo "<li>Iniciar el servicio MySQL en el panel de control de XAMPP</li>";
        echo "<li>Verificar que el puerto 3306 esté disponible</li>";
        echo "</ul>";
    } else {
        echo "<p style='color: green;'>✅ Conexión al servidor MySQL exitosa</p>";
        
        // Mostrar bases de datos disponibles
        echo "<p>2️⃣ Listando bases de datos disponibles...</p>";
        $result = $conn_test->query("SHOW DATABASES");
        if ($result) {
            echo "<ul>";
            while ($row = $result->fetch_assoc()) {
                $db_name = $row['Database'];
                if ($db_name == $db) {
                    echo "<li style='color: green;'><strong>$db_name</strong> ✅ (Base de datos objetivo)</li>";
                } else {
                    echo "<li>$db_name</li>";
                }
            }
            echo "</ul>";
        }
        
        // Intentar conectar a la base de datos específica
        echo "<p>3️⃣ Conectando a la base de datos '$db'...</p>";
        $conn_db = new mysqli($host, $user, $pass, $db);
        
        if ($conn_db->connect_error) {
            echo "<p style='color: red;'>❌ Error conectando a la base de datos '$db': " . $conn_db->connect_error . "</p>";
            echo "<p style='color: orange;'>💡 <strong>Solución:</strong> La base de datos '$db' no existe. Necesitas crearla o importar el archivo SQL.</p>";
        } else {
            echo "<p style='color: green;'>✅ Conexión a la base de datos '$db' exitosa</p>";
            
            // Mostrar tablas disponibles
            echo "<p>4️⃣ Listando tablas en la base de datos...</p>";
            $result = $conn_db->query("SHOW TABLES");
            if ($result && $result->num_rows > 0) {
                echo "<ul>";
                while ($row = $result->fetch_assoc()) {
                    $table_name = array_values($row)[0];
                    echo "<li>$table_name</li>";
                }
                echo "</ul>";
            } else {
                echo "<p style='color: orange;'>⚠️ No se encontraron tablas en la base de datos</p>";
            }
            
            $conn_db->close();
        }
        
        $conn_test->close();
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error general: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<h3>🚀 Instrucciones para Solucionar:</h3>";
echo "<ol>";
echo "<li><strong>Abrir XAMPP Control Panel</strong></li>";
echo "<li><strong>Iniciar Apache y MySQL</strong> (ambos deben mostrar 'Running' en verde)</li>";
echo "<li><strong>Hacer clic en 'Admin' junto a MySQL</strong> para abrir phpMyAdmin</li>";
echo "<li><strong>Crear la base de datos 'smart_pill'</strong> si no existe</li>";
echo "<li><strong>Importar el archivo SQL</strong> desde la carpeta 'database/'</li>";
echo "<li><strong>Actualizar esta página</strong> para verificar la conexión</li>";
echo "</ol>";

echo "<p style='margin-top: 20px;'><a href='?' style='background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🔄 Actualizar Diagnóstico</a></p>";
?>
