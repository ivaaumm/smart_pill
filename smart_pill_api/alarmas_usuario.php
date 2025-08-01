<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    if (!isset($_GET['usuario_id'])) {
        throw new Exception("ID de usuario requerido");
    }
    
    $usuario_id = intval($_GET['usuario_id']);
    
    if ($usuario_id <= 0) {
        throw new Exception("ID de usuario inválido");
    }

    $sql = "SELECT 
                a.alarma_id,
                a.usuario_id,
                a.tratamiento_id,
                a.remedio_global_id,
                a.dosis,
                a.hora,
                a.activo,
                a.estado,
                a.fecha_creacion,
                t.nombre as nombre_tratamiento,
                rg.nombre_comercial,
                rg.descripcion,
                rg.presentacion
            FROM alarmas a
            LEFT JOIN tratamientos t ON a.tratamiento_id = t.tratamiento_id
            LEFT JOIN remedio_global rg ON a.remedio_global_id = rg.remedio_global_id
            WHERE a.usuario_id = $usuario_id
            ORDER BY a.hora ASC";
            
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $alarmas = [];
    while($row = $res->fetch_assoc()) {
        $alarmas[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $alarmas]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>