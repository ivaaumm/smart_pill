<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Obtener parámetros
    $programacion_id = isset($_GET['programacion_id']) ? intval($_GET['programacion_id']) : null;
    $usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    
    // Si no se proporcionan parámetros, intentar obtener del POST
    if ($programacion_id === null || $usuario_id === null) {
        $data = json_decode(file_get_contents("php://input"));
        if ($data) {
            $programacion_id = isset($data->programacion_id) ? intval($data->programacion_id) : null;
            $usuario_id = isset($data->usuario_id) ? intval($data->usuario_id) : null;
        }
    }
    
    // Validar que al menos uno de los parámetros esté presente
    if ($programacion_id === null && $usuario_id === null) {
        throw new Exception("Se requiere programacion_id o usuario_id");
    }
    
    // Construir la consulta
    $sql = "SELECT 
                ht.horario_id,
                ht.tratamiento_id,
                ht.usuario_id,
                ht.remedio_global_id,
                ht.dia_semana,
                ht.hora,
                ht.dosis,
                ht.activo,
                ht.fecha_creacion,
                pt.nombre_tratamiento,
                pt.estado as estado_programacion,
                rg.nombre_comercial,
                rg.descripcion
            FROM horarios_tratamiento ht
            LEFT JOIN programacion_tratamientos pt ON ht.tratamiento_id = pt.programacion_id
            LEFT JOIN remedio_global rg ON ht.remedio_global_id = rg.remedio_global_id
            WHERE 1=1";
    
    if ($programacion_id !== null) {
        $sql .= " AND ht.tratamiento_id = $programacion_id";
    }
    if ($usuario_id !== null) {
        $sql .= " AND ht.usuario_id = $usuario_id";
    }
    
    $sql .= " ORDER BY FIELD(ht.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), ht.hora";
    
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }
    
    $horarios = [];
    $total_horarios = 0;
    $horarios_activos = 0;
    
    while($row = $res->fetch_assoc()) {
        $horarios[] = $row;
        $total_horarios++;
        if ($row['activo'] == 1) {
            $horarios_activos++;
        }
    }
    
    echo json_encode([
        "success" => true,
        "data" => $horarios,
        "estadisticas" => [
            "total_horarios" => $total_horarios,
            "horarios_activos" => $horarios_activos,
            "horarios_inactivos" => $total_horarios - $horarios_activos
        ],
        "filtros_aplicados" => [
            "programacion_id" => $programacion_id,
            "usuario_id" => $usuario_id
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 
