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
        throw new Exception("Método no permitido. Use POST.");
    }

    // Obtener datos JSON o form data
    $data = json_decode(file_get_contents("php://input"));
    
    // Si no hay datos JSON, intentar obtener de POST
    if (!$data) {
        $data = (object) $_POST;
    }
    
    if (!$data || (empty((array)$data))) {
        throw new Exception("No se recibieron datos");
    }

    // Validar campos requeridos
    $horario_id = intval($data->horario_id ?? 0);
    $usuario_id = intval($data->usuario_id ?? 0);
    $accion = $conn->real_escape_string($data->accion ?? '');
    $observaciones = $conn->real_escape_string($data->observaciones ?? '');

    if ($horario_id <= 0) {
        throw new Exception("horario_id es requerido y debe ser válido");
    }

    if ($usuario_id <= 0) {
        throw new Exception("usuario_id es requerido y debe ser válido");
    }

    // Validar acción y mapear a estado
    $estados_validos = [
        'ya_tome' => 'tomada',
        'posponer' => 'pospuesta', 
        'omitir' => 'rechazada'
    ];

    if (!array_key_exists($accion, $estados_validos)) {
        throw new Exception("Acción inválida. Use: ya_tome, posponer, omitir");
    }

    $estado = $estados_validos[$accion];

    // Obtener información del horario
    $sql_horario = "SELECT ht.*, ht.usuario_id
                   FROM horarios_tratamiento ht
                   WHERE ht.horario_id = $horario_id AND ht.usuario_id = $usuario_id AND ht.activo = 1";
    
    $res_horario = $conn->query($sql_horario);
    
    if (!$res_horario || $res_horario->num_rows === 0) {
        throw new Exception("Horario no encontrado");
    }

    $horario = $res_horario->fetch_assoc();

    // Verificar que el horario pertenece al usuario
    if ($horario['usuario_id'] != $usuario_id) {
        throw new Exception("No tienes permisos para este horario");
    }

    // Obtener información del remedio para la dosis
    $sql_remedio = "SELECT nombre_comercial, peso_unidad 
                   FROM remedio_global 
                   WHERE remedio_global_id = {$horario['remedio_global_id']}";
    
    $res_remedio = $conn->query($sql_remedio);
    $remedio = $res_remedio ? $res_remedio->fetch_assoc() : null;
    $dosis_programada = $remedio ? ($horario['dosis'] * $remedio['peso_unidad']) : '1 pastilla';

    // Iniciar transacción
    $conn->begin_transaction();

    try {
        // Crear el registro de toma
        $fecha_programada = date('Y-m-d');
        $fecha_hora_accion = date('Y-m-d H:i:s');
        
        $sql_insert = "INSERT INTO registro_tomas (
                        usuario_id, horario_id, remedio_global_id, programacion_id,
                        fecha_programada, hora_programada, fecha_hora_accion, estado,
                        dosis_programada, observaciones, es_cambio_estado, registro_original_id
                      ) VALUES (
                        $usuario_id, $horario_id, {$horario['remedio_global_id']}, {$horario['tratamiento_id']},
                        '$fecha_programada', '{$horario['hora']}', '$fecha_hora_accion', '$estado',
                        '$dosis_programada', '$observaciones', 0, NULL
                      )";

        if (!$conn->query($sql_insert)) {
            throw new Exception("Error al crear registro de toma: " . $conn->error);
        }

        $registro_id = $conn->insert_id;

        // Si la acción es "ya_tome", actualizar inventario
        if ($estado === 'tomada') {
            actualizarInventario($conn, $usuario_id, $horario['remedio_global_id'], 1);
        }

        $conn->commit();

        // Respuesta exitosa
        echo json_encode([
            "success" => true,
            "message" => "Registro de toma creado exitosamente",
            "data" => [
                "registro_id" => $registro_id,
                "horario_id" => $horario_id,
                "usuario_id" => $usuario_id,
                "accion" => $accion,
                "estado" => $estado,
                "fecha_programada" => $fecha_programada,
                "hora_programada" => $horario['hora'],
                "fecha_hora_accion" => $fecha_hora_accion,
                "remedio_global_id" => $horario['remedio_global_id'],
                "programacion_id" => $horario['tratamiento_id'],
                "dosis_programada" => $dosis_programada,
                "observaciones" => $observaciones
            ]
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "debug_info" => [
            "php_version" => PHP_VERSION,
            "timestamp" => date('Y-m-d H:i:s'),
            "received_data" => $data ?? null
        ]
    ]);
}

$conn->close();

// Función auxiliar para actualizar inventario
function actualizarInventario($conn, $usuario_id, $remedio_global_id, $cantidad) {
    // Buscar el remedio_usuario correspondiente
    $sql_remedio = "SELECT remedio_usuario_id, cantidad_actual 
                   FROM remedio_usuario 
                   WHERE usuario_id = $usuario_id 
                   AND remedio_global_id = $remedio_global_id 
                   LIMIT 1";
    
    $res_remedio = $conn->query($sql_remedio);
    if ($res_remedio && $res_remedio->num_rows > 0) {
        $remedio = $res_remedio->fetch_assoc();
        $remedio_usuario_id = $remedio['remedio_usuario_id'];
        $cantidad_actual = $remedio['cantidad_actual'];
        
        // Calcular nueva cantidad
        $nueva_cantidad = max(0, $cantidad_actual - $cantidad);
        
        // Actualizar cantidad en remedio_usuario
        $sql_update_cantidad = "UPDATE remedio_usuario 
                               SET cantidad_actual = $nueva_cantidad 
                               WHERE remedio_usuario_id = $remedio_usuario_id";
        
        if (!$conn->query($sql_update_cantidad)) {
            throw new Exception("Error al actualizar cantidad: " . $conn->error);
        }
        
        // Registrar el movimiento
        $fecha_hora = date('Y-m-d H:i:s');
        $sql_movimiento = "INSERT INTO movimientos_pastillas (
                            remedio_usuario_id, 
                            usuario_id, 
                            fecha_hora, 
                            cantidad_cambiada, 
                            tipo_movimiento
                          ) VALUES (
                            $remedio_usuario_id,
                            $usuario_id,
                            '$fecha_hora',
                            -$cantidad,
                            'toma_medicamento'
                          )";
        
        if (!$conn->query($sql_movimiento)) {
            throw new Exception("Error al registrar movimiento: " . $conn->error);
        }
    }
}
?>