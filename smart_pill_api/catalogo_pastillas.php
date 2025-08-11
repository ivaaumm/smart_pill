<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Parámetros de búsqueda opcionales
    $busqueda = isset($_GET['busqueda']) ? $conn->real_escape_string($_GET['busqueda']) : '';
    $categoria = isset($_GET['categoria']) ? $conn->real_escape_string($_GET['categoria']) : '';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    
    // Construir la consulta base
    $sql = "SELECT 
                rg.remedio_global_id,
                rg.nombre_comercial,
                rg.descripcion,
                rg.efectos_secundarios,
                rg.peso_unidad,
                rg.presentacion,
                t.nombre as tipo_tratamiento,
                t.descripcion as descripcion_tipo
            FROM remedio_global rg
            LEFT JOIN tratamientos t ON rg.remedio_global_id = t.tratamiento_id
            WHERE 1=1";
    
    // Agregar filtros si se proporcionan
    if (!empty($busqueda)) {
        $sql .= " AND (rg.nombre_comercial LIKE '%$busqueda%' 
                   OR rg.descripcion LIKE '%$busqueda%'
                   OR t.nombre LIKE '%$busqueda%')";
    }
    
    if (!empty($categoria)) {
        $sql .= " AND t.nombre = '$categoria'";
    }
    
    // Agregar ordenamiento y límites
    $sql .= " ORDER BY rg.nombre_comercial ASC LIMIT $limit OFFSET $offset";
    
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }
    
    $medicamentos = [];
    while($row = $res->fetch_assoc()) {
        // Formatear efectos secundarios si es muy largo
        if (strlen($row['efectos_secundarios']) > 200) {
            $row['efectos_secundarios'] = substr($row['efectos_secundarios'], 0, 200) . '...';
        }
        
        $medicamentos[] = $row;
    }
    
    // Obtener el total de registros para paginación
    $sql_count = "SELECT COUNT(*) as total FROM remedio_global rg
                  LEFT JOIN tratamientos t ON rg.remedio_global_id = t.tratamiento_id
                  WHERE 1=1";
    
    if (!empty($busqueda)) {
        $sql_count .= " AND (rg.nombre_comercial LIKE '%$busqueda%' 
                         OR rg.descripcion LIKE '%$busqueda%'
                         OR t.nombre LIKE '%$busqueda%')";
    }
    
    if (!empty($categoria)) {
        $sql_count .= " AND t.nombre = '$categoria'";
    }
    
    $res_count = $conn->query($sql_count);
    $total = $res_count->fetch_assoc()['total'];
    
    // Obtener categorías disponibles
    $sql_categorias = "SELECT DISTINCT t.nombre, t.descripcion 
                       FROM tratamientos t 
                       INNER JOIN remedio_global rg ON t.tratamiento_id = rg.remedio_global_id
                       ORDER BY t.nombre";
    $res_categorias = $conn->query($sql_categorias);
    
    $categorias = [];
    while($cat = $res_categorias->fetch_assoc()) {
        $categorias[] = $cat;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $medicamentos,
        "paginacion" => [
            "total" => intval($total),
            "limit" => $limit,
            "offset" => $offset,
            "paginas" => ceil($total / $limit)
        ],
        "categorias" => $categorias,
        "filtros" => [
            "busqueda" => $busqueda,
            "categoria" => $categoria
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "debug_info" => [
            "php_version" => PHP_VERSION,
            "timestamp" => date('Y-m-d H:i:s')
        ]
    ]);
}

$conn->close();
?> 