<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data) {
        throw new Exception("Datos JSON inválidos");
    }
    
    // Validar campos obligatorios
    if (empty($data->nombre_usuario)) {
        throw new Exception("El nombre de usuario es obligatorio");
    }
    if (empty($data->email)) {
        throw new Exception("El email es obligatorio");
    }
    if (empty($data->password)) {
        throw new Exception("La contraseña es obligatoria");
    }
    
    $nombre = $conn->real_escape_string($data->nombre_usuario);
    $email = $conn->real_escape_string($data->email);
    $pass = password_hash($data->password, PASSWORD_DEFAULT);
    
    // Campos opcionales
    $fecha_nacimiento = isset($data->fecha_nacimiento) && !empty($data->fecha_nacimiento) ? "'" . $conn->real_escape_string($data->fecha_nacimiento) . "'" : "NULL";
    $avatar = isset($data->avatar) && !empty($data->avatar) ? "'" . $conn->real_escape_string($data->avatar) . "'" : "NULL";

    $sql = "INSERT INTO usuarios (nombre_usuario, contrasena_hash, email, fecha_nacimiento, avatar, fecha_creacion) VALUES (
        '$nombre',
        '$pass',
        '$email',
        $fecha_nacimiento,
        $avatar,
        NOW()
    )";
    
    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "usuario_id" => $conn->insert_id]);
    } else {
        throw new Exception("Error en la base de datos: " . $conn->error);
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>