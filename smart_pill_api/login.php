<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Verificar si la conexión a la base de datos fue exitosa
    if ($conn->connect_error) {
        throw new Exception("Error de conexión a la base de datos: " . $conn->connect_error);
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data) {
        throw new Exception("Datos JSON inválidos o vacíos");
    }
    
    if (!isset($data->usuario) || !isset($data->password)) {
        throw new Exception("Faltan campos requeridos: usuario y password");
    }
    
    $usuario = $conn->real_escape_string($data->usuario);
    $password = $data->password;

    $sql = "SELECT usuario_id, nombre_usuario, email, fecha_nacimiento, avatar, fecha_creacion, contrasena_hash FROM usuarios WHERE email='$usuario' OR nombre_usuario='$usuario' LIMIT 1";
    $res = $conn->query($sql);

    if (!$res) {
        throw new Exception("Error en la consulta SQL: " . $conn->error);
    }

    if ($res && $res->num_rows > 0) {
        $row = $res->fetch_assoc();
        if (password_verify($password, $row['contrasena_hash'])) {
            // Calcular la edad a partir de la fecha de nacimiento
            $edad = null;
            if (!empty($row['fecha_nacimiento']) && $row['fecha_nacimiento'] != '0000-00-00') {
                $fecha_nacimiento = new DateTime($row['fecha_nacimiento']);
                $hoy = new DateTime();
                $edad = $hoy->diff($fecha_nacimiento)->y;
            }
            
            echo json_encode([
                "success" => true,
                "usuario_id" => $row['usuario_id'],
                "nombre_usuario" => $row['nombre_usuario'],
                "correo" => $row['email'],
                "edad" => $edad,
                "avatar" => $row['avatar']
            ]);
        } else {
            echo json_encode(["success" => false, "error" => "Contraseña incorrecta"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Usuario o email no encontrado"]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "error" => $e->getMessage(),
        "debug_info" => [
            "php_version" => PHP_VERSION,
            "timestamp" => date('Y-m-d H:i:s'),
            "request_method" => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
        ]
    ]);
}

$conn->close();
?>