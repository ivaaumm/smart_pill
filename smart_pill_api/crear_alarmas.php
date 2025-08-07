<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "conexion.php";

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido");
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Datos JSON inválidos");
    }

    $usuario_id = intval($input['usuario_id']);
    $programacion_id = intval($input['programacion_id']);
    $activo = isset($input['activo']) ? intval($input['activo']) : 1;
    $sonido = isset($input['sonido']) ? $conn->real_escape_string($input['sonido']) : 'default';
    
    if ($usuario_id <= 0 || $programacion_id <= 0) {
        throw new Exception("IDs inválidos");
    }

    // Verificar que la programación existe y pertenece al usuario
    $sql_verificar = "SELECT programacion_id FROM programacion_tratamientos 
                      WHERE programacion_id = $programacion_id AND usuario_id = $usuario_id";
    $res_verificar = $conn->query($sql_verificar);
    
    if (!$res_verificar || $res_verificar->num_rows === 0) {
        throw new Exception("Programación no encontrada o no autorizada");
    }

    // Obtener los horarios de la programación
    $sql_horarios = "SELECT horario_id, dia_semana, hora, dosis 
                     FROM horarios_tratamiento 
                     WHERE tratamiento_id = $programacion_id";
    $res_horarios = $conn->query($sql_horarios);
    
    if (!$res_horarios) {
        throw new Exception("Error al obtener horarios: " . $conn->error);
    }

    $alarmas_creadas = 0;
    $errores = [];

    // Crear una alarma por cada horario
    while ($horario = $res_horarios->fetch_assoc()) {
        $dia_semana = $conn->real_escape_string($horario['dia_semana']);
        $hora = $conn->real_escape_string($horario['hora']);
        $dosis = $conn->real_escape_string($horario['dosis']);
        
        // Verificar si ya existe una alarma para este horario
        $sql_existe = "SELECT alarma_id FROM alarmas 
                       WHERE usuario_id = $usuario_id 
                       AND tratamiento_id = $programacion_id 
                       AND dia_semana = '$dia_semana' 
                       AND hora = '$hora'";
        $res_existe = $conn->query($sql_existe);
        
        if ($res_existe && $res_existe->num_rows > 0) {
            // Actualizar alarma existente
            $alarma_existente = $res_existe->fetch_assoc();
            $alarma_id = $alarma_existente['alarma_id'];
            
            $sql_update = "UPDATE alarmas SET 
                           activo = $activo,
                           sonido = '$sonido',
                           fecha_actualizacion = NOW()
                           WHERE alarma_id = $alarma_id";
            
            if ($conn->query($sql_update)) {
                $alarmas_creadas++;
            } else {
                $errores[] = "Error actualizando alarma para $dia_semana $hora: " . $conn->error;
            }
        } else {
            // Crear nueva alarma
            $sql_insert = "INSERT INTO alarmas (
                usuario_id, 
                tratamiento_id, 
                dia_semana, 
                hora, 
                dosis, 
                activo, 
                sonido, 
                estado,
                fecha_creacion
            ) VALUES (
                $usuario_id,
                $programacion_id,
                '$dia_semana',
                '$hora',
                '$dosis',
                $activo,
                '$sonido',
                'pendiente',
                NOW()
            )";
            
            if ($conn->query($sql_insert)) {
                $alarmas_creadas++;
            } else {
                $errores[] = "Error creando alarma para $dia_semana $hora: " . $conn->error;
            }
        }
    }

    if ($alarmas_creadas > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Se crearon/actualizaron $alarmas_creadas alarmas",
            "alarmas_creadas" => $alarmas_creadas,
            "errores" => $errores
        ]);
    } else {
        throw new Exception("No se pudieron crear alarmas. Errores: " . implode(", ", $errores));
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 