<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Verificar que se proporcionó el ID de usuario
    if (!isset($_GET['usuario_id']) || empty($_GET['usuario_id'])) {
        throw new Exception("ID de usuario no proporcionado");
    }
    
    $usuario_id = intval($_GET['usuario_id']);
    
    // Consulta para obtener las programaciones del usuario
    $sql = "SELECT 
                pt.programacion_id,
                pt.usuario_id,
                pt.remedio_global_id,
                pt.nombre_tratamiento,
                pt.fecha_inicio,
                pt.fecha_fin,
                pt.dosis_por_toma,
                pt.observaciones,
                pt.estado,
                rg.nombre_comercial,
                rg.descripcion,
                rg.presentacion,
                u.nombre_usuario
            FROM programacion_tratamientos pt
            LEFT JOIN remedio_global rg ON pt.remedio_global_id = rg.remedio_global_id
            LEFT JOIN usuarios u ON pt.usuario_id = u.usuario_id
            WHERE pt.usuario_id = $usuario_id
            ORDER BY pt.fecha_inicio DESC, pt.fecha_fin DESC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Error al obtener las programaciones: " . $conn->error);
    }
    
    $programaciones = [];
    
    while ($row = $result->fetch_assoc()) {
        $programacion_id = $row['programacion_id'];
        
        // Obtener los horarios para esta programación
        $sql_horarios = "SELECT * FROM horarios_tratamiento 
                        WHERE tratamiento_id = $programacion_id
                        ORDER BY FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), hora";
        
        $result_horarios = $conn->query($sql_horarios);
        $horarios = [];
        
        if ($result_horarios) {
            while ($horario = $result_horarios->fetch_assoc()) {
                $horarios[] = $horario;
            }
        }
        
        $row['horarios'] = $horarios;
        $programaciones[] = $row;
    }
    
    // Devolver en formato consistente con otros endpoints
    echo json_encode([
        "success" => true,
        "data" => $programaciones,
        "count" => count($programaciones)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>
