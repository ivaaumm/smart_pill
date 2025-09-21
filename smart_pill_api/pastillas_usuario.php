<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Consulta para obtener todas las pastillas de remedio_global
    $sql = "SELECT
                remedio_global_id,
                nombre_comercial,
                descripcion,
                presentacion,
                peso_unidad,
                efectos_secundarios
            FROM remedio_global
            ORDER BY nombre_comercial ASC";

    $res = $conn->query($sql);

    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $pastillas = [];
    while($row = $res->fetch_assoc()) {
        $pastilla = [
            'remedio_global_id' => $row['remedio_global_id'],
            'nombre_comercial' => $row['nombre_comercial'],
            'descripcion' => $row['descripcion'],
            'presentacion' => $row['presentacion'],
            'peso_unidad' => $row['peso_unidad'],
            'efectos_secundarios' => $row['efectos_secundarios']
        ];
        $pastillas[] = $pastilla;
    }

    echo json_encode(["success" => true, "data" => $pastillas]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 
