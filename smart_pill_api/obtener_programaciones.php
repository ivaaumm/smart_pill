<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "conexion.php";

try {
    // Parámetros de filtrado opcionales
    $usuario_id = isset($_GET['usuario_id']) && !empty($_GET['usuario_id']) ? intval($_GET['usuario_id']) : null;
    $estado = isset($_GET['estado']) && !empty($_GET['estado']) ? $conn->real_escape_string($_GET['estado']) : null;
    $remedio_global_id = isset($_GET['remedio_global_id']) && !empty($_GET['remedio_global_id']) ? intval($_GET['remedio_global_id']) : null;
    
    // Construir la consulta base
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
            WHERE 1=1";
    
    // Aplicar filtros
    $params = [];
    if ($usuario_id !== null) {
        $sql .= " AND pt.usuario_id = $usuario_id";
    }
    if ($estado !== null) {
        $sql .= " AND pt.estado = '$estado'";
    }
    if ($remedio_global_id !== null) {
        $sql .= " AND pt.remedio_global_id = $remedio_global_id";
    }
    
    $sql .= " ORDER BY pt.programacion_id DESC";
            
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $programaciones = [];
    $total_programaciones = 0;
    $total_horarios = 0;
    
    while($row = $res->fetch_assoc()) {
        $programacion_id = $row['programacion_id'];
        $total_programaciones++;
        
        // Obtener horarios para esta programación
        $sql_horarios = "SELECT 
                            horario_id,
                            dia_semana,
                            hora,
                            dosis,
                            activo,
                            fecha_creacion
                        FROM horarios_tratamiento
                        WHERE tratamiento_id = $programacion_id
                        ORDER BY FIELD(dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), hora";
        
        $res_horarios = $conn->query($sql_horarios);
        $horarios = [];
        
        if ($res_horarios) {
            while($horario = $res_horarios->fetch_assoc()) {
                $horarios[] = $horario;
                $total_horarios++;
            }
        }
        
        // Calcular estadísticas de la programación
        $fecha_inicio = new DateTime($row['fecha_inicio']);
        $fecha_fin = new DateTime($row['fecha_fin']);
        $hoy = new DateTime();
        
        $dias_restantes = $hoy < $fecha_fin ? $hoy->diff($fecha_fin)->days : 0;
        $dias_transcurridos = $hoy > $fecha_inicio ? $hoy->diff($fecha_inicio)->days : 0;
        
        // Agregar información adicional
        $row['horarios'] = $horarios;
        $row['estadisticas'] = [
            'total_horarios' => count($horarios),
            'horarios_activos' => count(array_filter($horarios, function($h) { return $h['activo'] == 1; })),
            'dias_restantes' => $dias_restantes,
            'dias_transcurridos' => $dias_transcurridos,
            'progreso_porcentaje' => $fecha_inicio < $hoy && $fecha_fin > $hoy ? 
                min(100, max(0, ($dias_transcurridos / max(1, $fecha_inicio->diff($fecha_fin)->days)) * 100)) : 0
        ];
        
        $programaciones[] = $row;
    }
    
    echo json_encode([
        "success" => true, 
        "data" => $programaciones,
        "estadisticas_generales" => [
            "total_programaciones" => $total_programaciones,
            "total_horarios" => $total_horarios,
            "filtros_aplicados" => [
                "usuario_id" => $usuario_id,
                "estado" => $estado,
                "remedio_global_id" => $remedio_global_id
            ]
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>
