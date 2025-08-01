<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Verificar conexión
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    // Verificar que la tabla existe
    $checkTable = "SHOW TABLES LIKE 'remedio_global'";
    $tableResult = $conn->query($checkTable);
    
    if ($tableResult->num_rows == 0) {
        throw new Exception("La tabla remedio_global no existe");
    }

    // Contar registros
    $countSql = "SELECT COUNT(*) as total FROM remedio_global";
    $countResult = $conn->query($countSql);
    $countRow = $countResult->fetch_assoc();
    $totalRecords = $countRow['total'];

    // Obtener algunos registros de ejemplo
    $sql = "SELECT * FROM remedio_global LIMIT 5";
    $res = $conn->query($sql);

    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $pastillas = [];
    while($row = $res->fetch_assoc()) {
        $pastillas[] = $row;
    }

    echo json_encode([
        "success" => true,
        "message" => "Prueba de conexión exitosa",
        "total_records" => $totalRecords,
        "sample_data" => $pastillas,
        "connection_status" => "OK"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "connection_status" => "ERROR"
    ]);
}

$conn->close();
?> 