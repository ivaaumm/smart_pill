<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    $sql = "SELECT * FROM tratamientos ORDER BY nombre";
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $tratamientos = [];
    while($row = $res->fetch_assoc()) {
        $tratamientos[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $tratamientos]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?>
