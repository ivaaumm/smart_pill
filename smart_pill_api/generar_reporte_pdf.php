<?php
// Configurar manejo de errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'conexion.php';

// Incluir el autoloader de Composer para TCPDF
require_once __DIR__ . '/../vendor/autoload.php';

try {
    // Obtener parámetros
    $usuario_id = $_GET['usuario_id'] ?? null;
    $fecha_desde = $_GET['fecha_desde'] ?? date('Y-m-d', strtotime('-30 days'));
    $fecha_hasta = $_GET['fecha_hasta'] ?? date('Y-m-d');
    
    if (!$usuario_id) {
        echo json_encode([
            "success" => false,
            "error" => "MISSING_PARAMETERS",
            "message" => "Se requiere el parámetro usuario_id"
        ]);
        exit;
    }
    
    // Obtener información del usuario
    $sql_usuario = "SELECT nombre_usuario, email FROM usuarios WHERE usuario_id = ?";
    $stmt = $conn->prepare($sql_usuario);
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $result_usuario = $stmt->get_result();
    
    if ($result_usuario->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "error" => "USER_NOT_FOUND",
            "message" => "Usuario no encontrado"
        ]);
        exit;
    }
    
    $usuario = $result_usuario->fetch_assoc();
    
    // Obtener registros de tomas con información detallada
    $sql_registros = "
        SELECT 
            rt.registro_id,
            rt.fecha_programada,
            rt.hora_programada,
            rt.estado,
            rt.fecha_hora_accion,
            rt.observaciones,
            rt.programacion_id,
            rg.nombre_comercial,
            rg.descripcion,
            pt.dosis_por_toma,
            pt.nombre_tratamiento,
            pt.fecha_inicio,
            pt.fecha_fin
        FROM registro_tomas rt
        INNER JOIN programacion_tratamientos pt ON rt.programacion_id = pt.programacion_id
        INNER JOIN remedio_global rg ON pt.remedio_global_id = rg.remedio_global_id
        WHERE rt.usuario_id = ? 
        AND rt.fecha_programada BETWEEN ? AND ?
        ORDER BY rt.fecha_programada DESC, rt.hora_programada DESC
    ";
    
    $stmt = $conn->prepare($sql_registros);
    $stmt->bind_param("iss", $usuario_id, $fecha_desde, $fecha_hasta);
    $stmt->execute();
    $result_registros = $stmt->get_result();
    
    $registros = [];
    
    while ($row = $result_registros->fetch_assoc()) {
        $registros[] = $row;
    }
    
    // Crear PDF
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    // Configurar información del documento
    $pdf->SetCreator('Smart Pill App');
    $pdf->SetAuthor('Smart Pill');
    $pdf->SetTitle('Reporte de Adherencia a Medicamentos');
    $pdf->SetSubject('Registro de Tomas y Adherencia');
    
    // Configurar márgenes
    $pdf->SetMargins(15, 27, 15);
    $pdf->SetHeaderMargin(5);
    $pdf->SetFooterMargin(10);
    
    // Configurar auto page breaks
    $pdf->SetAutoPageBreak(TRUE, 25);
    
    // Configurar fuente
    $pdf->SetFont('helvetica', '', 10);
    
    // Agregar página
    $pdf->AddPage();
    
    // Header con colores bordo/vino elegantes
    $pdf->SetFillColor(101, 31, 41); // Bordo/vino más oscuro y elegante
    $pdf->SetTextColor(255, 255, 255);
    $pdf->Rect(0, 0, 210, 30, 'F');
    
    // Logo/Título principal
    $pdf->SetFont('helvetica', 'B', 20);
    $pdf->SetXY(15, 8);
    $pdf->Cell(0, 12, 'SMART PILL', 0, 1, 'C');
    $pdf->SetFont('helvetica', '', 12);
    $pdf->SetXY(15, 18);
    $pdf->Cell(0, 8, 'Reporte de Adherencia a Medicamentos', 0, 1, 'C');
    
    $pdf->Ln(15);
    
    // Información del usuario con diseño bordo/gris
    $pdf->SetTextColor(101, 31, 41); // Bordo/vino oscuro
    $pdf->SetFillColor(230, 220, 225); // Gris rosado muy suave
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'INFORMACIÓN DEL PACIENTE', 0, 1, 'L', 1);
    $pdf->Ln(2);
    
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetFont('helvetica', '', 11);
    $pdf->SetFillColor(245, 245, 245); // Gris muy claro
    
    // Crear tabla de información del usuario
    $pdf->Cell(40, 8, 'Usuario:', 1, 0, 'L', 1);
    $pdf->Cell(0, 8, $usuario['nombre_usuario'], 1, 1, 'L', 1);
    $pdf->Cell(40, 8, 'Email:', 1, 0, 'L', 1);
    $pdf->Cell(0, 8, $usuario['email'], 1, 1, 'L', 1);
    $pdf->Cell(40, 8, 'Período:', 1, 0, 'L', 1);
    $pdf->Cell(0, 8, date('d/m/Y', strtotime($fecha_desde)) . ' - ' . date('d/m/Y', strtotime($fecha_hasta)), 1, 1, 'L', 1);
    $pdf->Cell(40, 8, 'Generado:', 1, 0, 'L', 1);
    $pdf->Cell(0, 8, date('d/m/Y H:i:s'), 1, 1, 'L', 1);
    $pdf->Ln(10);
    
    // Detalle de registros
    if (!empty($registros)) {
        $pdf->SetTextColor(101, 31, 41); // Bordo/vino oscuro
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetFillColor(230, 220, 225); // Gris rosado suave
        $pdf->Cell(0, 10, 'DETALLE DE REGISTROS', 0, 1, 'L', 1);
        $pdf->Ln(3);
        
        // Encabezados de tabla detallada con colores bordo/vino
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->SetFillColor(101, 31, 41); // Bordo/vino oscuro
        $pdf->SetTextColor(255, 255, 255);
        $pdf->Cell(30, 10, 'Fecha', 1, 0, 'C', 1);
        $pdf->Cell(20, 10, 'Hora', 1, 0, 'C', 1);
        $pdf->Cell(60, 10, 'Medicamento', 1, 0, 'C', 1);
        $pdf->Cell(20, 10, 'Estado', 1, 0, 'C', 1);
        $pdf->Cell(60, 10, 'Observaciones', 1, 1, 'C', 1);
        
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetTextColor(0, 0, 0);
        foreach ($registros as $registro) {
            // Color según estado con gama bordo/gris elegante
            switch ($registro['estado']) {
                case 'tomada':
                    $pdf->SetFillColor(176, 196, 200); // Celeste grisáceo suave
                    break;
                case 'rechazada':
                    $pdf->SetFillColor(200, 180, 185); // Gris rosado (tono bordo suave)
                    break;
                case 'pospuesta':
                    $pdf->SetFillColor(180, 180, 180); // Gris medio oscuro
                    break;
                default:
                    $pdf->SetFillColor(240, 240, 240); // Gris claro neutro
            }
            
            $pdf->Cell(30, 8, date('d/m/Y', strtotime($registro['fecha_programada'])), 1, 0, 'C', 1);
            $pdf->Cell(20, 8, substr($registro['hora_programada'], 0, 5), 1, 0, 'C', 1);
            $pdf->Cell(60, 8, $registro['nombre_comercial'], 1, 0, 'L', 1);
            $pdf->Cell(20, 8, ucfirst($registro['estado']), 1, 0, 'C', 1);
            $observacion = !empty($registro['observaciones']) ? substr($registro['observaciones'], 0, 40) : '-';
            $pdf->Cell(60, 8, $observacion, 1, 1, 'L', 1);
        }
    }
    
    // Generar nombre de archivo
    $filename = 'reporte_adherencia_' . $usuario['nombre_usuario'] . '_' . date('Y-m-d') . '.pdf';
    
    // Establecer header de PDF antes de generar
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    // Enviar PDF como respuesta
    $pdf->Output($filename, 'D');
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => "PDF_GENERATION_ERROR",
        "message" => "Error al generar el PDF: " . $e->getMessage()
    ]);
}

$conn->close();
?>