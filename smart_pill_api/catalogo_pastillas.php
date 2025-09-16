<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/conexion.php';

try {
    // Parámetros opcionales
    $busqueda = isset($_GET['busqueda']) ? $conn->real_escape_string($_GET['busqueda']) : '';
    $limit    = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset   = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    // Query base: catálogo de medicamentos globales
    $sql = "SELECT 
                rg.remedio_global_id,
                rg.nombre_comercial,
                rg.descripcion,
                rg.efectos_secundarios,
                rg.peso_unidad,
                rg.presentacion
            FROM remedio_global rg
            WHERE 1=1";

    if (!empty($busqueda)) {
        $like = "%{$busqueda}%";
        $sql .= " AND (
                    rg.nombre_comercial LIKE '" . $conn->real_escape_string($like) . "' OR
                    rg.descripcion LIKE '" . $conn->real_escape_string($like) . "' OR
                    rg.presentacion LIKE '" . $conn->real_escape_string($like) . "'
                 )";
    }

    $sql .= " ORDER BY rg.nombre_comercial ASC LIMIT {$limit} OFFSET {$offset}";

    $res = $conn->query($sql);
    if (!$res) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error en la consulta',
            'details' => $conn->error,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $medicamentos = [];
    while ($row = $res->fetch_assoc()) {
        if (isset($row['efectos_secundarios']) && strlen($row['efectos_secundarios']) > 200) {
            $row['efectos_secundarios'] = mb_substr($row['efectos_secundarios'], 0, 200) . '...';
        }
        $medicamentos[] = $row;
    }

    echo json_encode([
        'success' => true,
        'data' => $medicamentos,
        'count' => count($medicamentos),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Excepción del servidor',
        'message' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}












