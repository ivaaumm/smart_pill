<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "conexion.php";

try {
    // Obtener datos del POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    $programacion_id = $input['programacion_id'] ?? null;
    $usuario_id = $input['usuario_id'] ?? null;
    $estado = $input['estado'] ?? null; // 'tomada', 'pospuesta', 'rechazada'
    $observaciones = $input['observaciones'] ?? '';
    $fecha_cliente = $input['fecha_cliente'] ?? null; // Fecha del cliente
    
    // Validar parámetros requeridos
    if (!$programacion_id || !$usuario_id || !$estado) {
        echo json_encode([
            "success" => false,
            "error" => "MISSING_PARAMETERS",
            "message" => "Faltan parámetros requeridos: programacion_id, usuario_id, estado"
        ]);
        exit;
    }
    
    // Validar que el estado sea válido (solo estados permitidos después de interacción)
    $estados_validos = ['tomada', 'pospuesta', 'omitida'];
    if (!in_array($estado, $estados_validos)) {
        echo json_encode([
            "success" => false,
            "error" => "INVALID_STATE",
            "message" => "Estado inválido. Solo se permiten: tomada, pospuesta, omitida"
        ]);
        exit;
    }
    
    // Obtener información de la programación y horarios para la fecha especificada
    $fecha_hoy = $fecha_cliente ? date('Y-m-d', strtotime($fecha_cliente)) : date('Y-m-d');
    $hora_actual = date('H:i:s');
    
    // Traducir día actual al español (usar la fecha del cliente si está disponible)
    $fecha_para_dia = $fecha_cliente ? strtotime($fecha_cliente) : time();
    $dias_traduccion = [
        'Monday' => 'lunes',
        'Tuesday' => 'martes', 
        'Wednesday' => 'miercoles',
        'Thursday' => 'jueves',
        'Friday' => 'viernes',
        'Saturday' => 'sabado',
        'Sunday' => 'domingo'
    ];
    
    $dia_actual_ingles = date('l', $fecha_para_dia);
    $dia_actual_espanol = $dias_traduccion[$dia_actual_ingles];
    
    // Buscar horarios para hoy
    $sql_horarios = "SELECT h.*, pt.usuario_id, pt.remedio_global_id, pt.programacion_id, pt.dosis_por_toma
                    FROM horarios_tratamiento h
                    INNER JOIN programacion_tratamientos pt ON h.tratamiento_id = pt.programacion_id
                    WHERE h.tratamiento_id = ? AND h.activo = 1 AND h.dia_semana = ? AND pt.usuario_id = ?";
    
    $stmt = $conn->prepare($sql_horarios);
    $stmt->bind_param("isi", $programacion_id, $dia_actual_espanol, $usuario_id);
    $stmt->execute();
    $result_horarios = $stmt->get_result();
    
    if ($result_horarios->num_rows == 0) {
        echo json_encode([
            "success" => false,
            "error" => "NO_SCHEDULE_TODAY",
            "message" => "No hay horarios programados para la fecha $fecha_hoy ($dia_actual_espanol) en esta programación"
        ]);
        exit;
    }
    
    // Buscar el horario más cercano a la hora actual
    $horarios = [];
    while ($horario = $result_horarios->fetch_assoc()) {
        $horarios[] = $horario;
    }
    
    // Encontrar el horario más cercano
    $horario_seleccionado = null;
    $menor_diferencia = PHP_INT_MAX;
    
    foreach ($horarios as $horario) {
        $hora_programada = strtotime($horario['hora']);
        $hora_actual_timestamp = strtotime($hora_actual);
        $diferencia = abs($hora_actual_timestamp - $hora_programada);
        
        if ($diferencia < $menor_diferencia) {
            $menor_diferencia = $diferencia;
            $horario_seleccionado = $horario;
        }
    }
    
    if (!$horario_seleccionado) {
        echo json_encode([
            "success" => false,
            "error" => "NO_SUITABLE_SCHEDULE",
            "message" => "No se pudo encontrar un horario adecuado para crear el registro"
        ]);
        exit;
    }
    
    // Verificar si ya existe un registro para este horario y fecha
    $sql_check = "SELECT registro_id FROM registro_tomas 
                 WHERE horario_id = ? AND fecha_programada = ?";
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->bind_param("is", $horario_seleccionado['horario_id'], $fecha_hoy);
    $stmt_check->execute();
    $existing_result = $stmt_check->get_result();
    
    if ($existing_result->num_rows > 0) {
        $existing_registro = $existing_result->fetch_assoc();
        echo json_encode([
            "success" => false,
            "error" => "RECORD_ALREADY_EXISTS",
            "message" => "Ya existe un registro para este horario y fecha",
            "registro_id" => $existing_registro['registro_id']
        ]);
        exit;
    }
    
    // Crear el nuevo registro con el estado especificado
    $sql_insert = "INSERT INTO registro_tomas (
        usuario_id, 
        horario_id,
        programacion_id, 
        remedio_global_id, 
        fecha_programada, 
        hora_programada, 
        dosis_programada, 
        estado, 
        observaciones,
        fecha_creacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    
    $stmt_insert = $conn->prepare($sql_insert);
    $stmt_insert->bind_param("iiissssss", 
        $horario_seleccionado['usuario_id'], 
        $horario_seleccionado['horario_id'],
        $horario_seleccionado['programacion_id'], 
        $horario_seleccionado['remedio_global_id'], 
        $fecha_hoy, 
        $horario_seleccionado['hora'],
        $horario_seleccionado['dosis_por_toma'],
        $estado,
        $observaciones
    );
    
    if ($stmt_insert->execute()) {
        $nuevo_registro_id = $conn->insert_id;
        
        echo json_encode([
            "success" => true,
            "message" => "Registro creado exitosamente al interactuar con la alarma",
            "registro_id" => $nuevo_registro_id,
            "estado" => $estado,
            "fecha_programada" => $fecha_hoy,
            "hora_programada" => $horario_seleccionado['hora'],
            "observaciones" => $observaciones,
            "creado_por_interaccion" => true
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error" => "DATABASE_ERROR",
            "message" => "Error al crear el registro: " . $conn->error
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => "SERVER_ERROR",
        "message" => "Error del servidor: " . $e->getMessage()
    ]);
}

$conn->close();
?>