<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    if (!isset($_GET['usuario_id']) || !isset($_GET['programacion_id'])) {
        throw new Exception("ID de usuario y programación requeridos");
    }
    
    $usuario_id = intval($_GET['usuario_id']);
    $programacion_id = intval($_GET['programacion_id']);
    
    if ($usuario_id <= 0 || $programacion_id <= 0) {
        throw new Exception("IDs inválidos");
    }

    $sql = "SELECT 
                a.alarma_id,
                a.usuario_id,
                a.tratamiento_id,
                a.dia_semana,
                a.hora,
                a.dosis,
                a.activo,
                a.sonido,
                a.estado,
                a.fecha_creacion,
                a.fecha_actualizacion,
                pt.nombre_tratamiento,
                rg.nombre_comercial
            FROM alarmas a
            LEFT JOIN programacion_tratamientos pt ON a.tratamiento_id = pt.programacion_id
            LEFT JOIN remedio_global rg ON pt.remedio_global_id = rg.remedio_global_id
            WHERE a.usuario_id = $usuario_id 
            AND a.tratamiento_id = $programacion_id
            ORDER BY FIELD(a.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), a.hora";
            
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $alarmas = [];
    $total_alarmas = 0;
    $alarmas_activas = 0;
    
    while($row = $res->fetch_assoc()) {
        $alarmas[] = $row;
        $total_alarmas++;
        if ($row['activo'] == 1) {
            $alarmas_activas++;
        }
    }
    
    echo json_encode([
        "success" => true, 
        "data" => $alarmas,
        "estadisticas" => [
            "total_alarmas" => $total_alarmas,
            "alarmas_activas" => $alarmas_activas,
            "alarmas_inactivas" => $total_alarmas - $alarmas_activas
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 