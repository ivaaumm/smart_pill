<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Consulta para obtener todas las pastillas del catálogo global
    $sql = "SELECT 
                rg.remedio_global_id,
                rg.nombre_comercial,
                rg.descripcion,
                rg.efectos_secundarios,
                rg.peso_unidad,
                rg.presentacion
            FROM remedio_global rg
            ORDER BY rg.nombre_comercial ASC";
             
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $pastillas = [];
    while($row = $res->fetch_assoc()) {
        $pastillas[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $pastillas]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 