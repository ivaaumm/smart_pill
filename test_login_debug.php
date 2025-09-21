<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Login Debug</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
        .test-case { margin: 15px 0; padding: 10px; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Test Login Debug</h1>
        
        <?php
        // Función para probar login
        function testLogin($usuario, $password, $descripcion) {
            $url = "http://192.168.1.87/smart_pill/smart_pill_api/login.php";
            
            $data = json_encode([
                'usuario' => $usuario,
                'password' => $password
            ]);
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Accept: application/json'
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_error = curl_error($ch);
            curl_close($ch);
            
            echo "<div class='test-case'>";
            echo "<h3>🧪 $descripcion</h3>";
            echo "<p><strong>Usuario:</strong> $usuario</p>";
            echo "<p><strong>Password:</strong> " . str_repeat('*', strlen($password)) . "</p>";
            echo "<p><strong>Código HTTP:</strong> $http_code</p>";
            
            if ($curl_error) {
                echo "<p class='error'><strong>Error cURL:</strong> $curl_error</p>";
            }
            
            echo "<p><strong>Respuesta raw:</strong></p>";
            echo "<pre>" . htmlspecialchars($response) . "</pre>";
            
            $json_data = json_decode($response, true);
            if ($json_data) {
                echo "<p><strong>Respuesta JSON:</strong></p>";
                echo "<pre>" . json_encode($json_data, JSON_PRETTY_PRINT) . "</pre>";
                
                if (isset($json_data['success'])) {
                    if ($json_data['success']) {
                        echo "<div class='success'>✅ Login exitoso</div>";
                    } else {
                        echo "<div class='error'>❌ Login fallido: " . ($json_data['error'] ?? 'Error desconocido') . "</div>";
                    }
                }
            } else {
                echo "<div class='error'>❌ Respuesta no es JSON válido</div>";
            }
            echo "</div>";
        }
        
        // Mostrar usuarios existentes en la base de datos
        echo "<div class='section info'>";
        echo "<h3>👥 Usuarios en la base de datos:</h3>";
        
        try {
            include 'smart_pill_api/conexion.php';
            
            $sql = "SELECT usuario_id, nombre_usuario, email, fecha_creacion FROM usuarios ORDER BY usuario_id";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                echo "<table>";
                echo "<tr><th>ID</th><th>Nombre Usuario</th><th>Email</th><th>Fecha Creación</th></tr>";
                
                while ($row = $result->fetch_assoc()) {
                    echo "<tr>";
                    echo "<td>" . $row['usuario_id'] . "</td>";
                    echo "<td>" . $row['nombre_usuario'] . "</td>";
                    echo "<td>" . $row['email'] . "</td>";
                    echo "<td>" . $row['fecha_creacion'] . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "<p>No hay usuarios registrados</p>";
            }
            
            $conn->close();
            
        } catch (Exception $e) {
            echo "<p class='error'>Error al consultar usuarios: " . $e->getMessage() . "</p>";
        }
        
        echo "</div>";
        
        // Casos de prueba
        echo "<div class='section'>";
        echo "<h3>🧪 Casos de prueba:</h3>";
        
        // Caso 1: Usuario correcto con contraseña correcta
        testLogin("admin", "123456", "Caso 1: Credenciales correctas (admin/123456)");
        
        // Caso 2: Usuario correcto con contraseña incorrecta
        testLogin("admin", "password_incorrecta", "Caso 2: Usuario correcto, contraseña incorrecta");
        
        // Caso 3: Usuario inexistente
        testLogin("usuario_inexistente", "123456", "Caso 3: Usuario inexistente");
        
        // Caso 4: Email correcto con contraseña correcta
        testLogin("admin@smartpill.com", "123456", "Caso 4: Login con email correcto");
        
        // Caso 5: Email correcto con contraseña incorrecta
        testLogin("admin@smartpill.com", "password_incorrecta", "Caso 5: Email correcto, contraseña incorrecta");
        
        // Caso 6: Campos vacíos
        testLogin("", "", "Caso 6: Campos vacíos");
        
        echo "</div>";
        ?>
        
        <div class="section">
            <h3>🔧 Acciones adicionales:</h3>
            <p><a href="verificar_datos_usuario.php" target="_blank">👤 Verificar datos de usuario</a></p>
            <p><a href="smart_pill_api/registro.php" target="_blank">➕ Crear usuario de prueba</a></p>
        </div>
    </div>
</body>
</html>
