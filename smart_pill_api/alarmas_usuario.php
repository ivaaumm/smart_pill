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

    // Consulta para obtener alarmas del usuario con información completa
    $sql = "SELECT 
                a.alarma_id,
                a.usuario_id,
                a.tratamiento_id,
                a.remedio_global_id,
                a.dosis,
                a.nombre_alarma,
                a.hora_inicio,
                a.fecha_inicio,
                a.repeticion_tipo,
                a.repeticion_intervalo,
                a.dias_semana,
                a.fecha_fin,
                a.activo,
                a.estado,
                a.sonido,
                a.vibracion,
                a.repetir_alarma,
                a.intervalo_repeticion,
                pt.nombre_tratamiento,
                rg.nombre_comercial,
                rg.descripcion,
                rg.presentacion,
                rg.peso_unidad
            FROM alarmas a
            LEFT JOIN programacion_tratamientos pt ON a.tratamiento_id = pt.programacion_id
            LEFT JOIN remedio_global rg ON a.remedio_global_id = rg.remedio_global_id
            WHERE a.usuario_id = $usuario_id AND a.activo = 1
            ORDER BY a.hora_inicio ASC";
            
    $res = $conn->query($sql);
    
    if (!$res) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $alarmas = [];
    while($row = $res->fetch_assoc()) {
        // Formatear la hora para mejor legibilidad
        $row['hora_formateada'] = date('H:i', strtotime($row['hora_inicio']));
        
        // Determinar el próximo horario de la alarma
        $row['proximo_horario'] = calcularProximoHorario($row);
        
        $alarmas[] = $row;
    }
    
    echo json_encode([
        "success" => true, 
        "data" => $alarmas,
        "total" => count($alarmas)
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

// Función para calcular el próximo horario de la alarma
function calcularProximoHorario($alarma) {
    $hoy = new DateTime();
    $hora_alarma = new DateTime($alarma['hora_inicio']);
    
    // Si la alarma es diaria
    if ($alarma['repeticion_tipo'] == 'diaria') {
        $proximo = new DateTime();
        $proximo->setTime($hora_alarma->format('H'), $hora_alarma->format('i'));
        
        // Si ya pasó la hora de hoy, programar para mañana
        if ($proximo <= $hoy) {
            $proximo->add(new DateInterval('P1D'));
        }
        
        return $proximo->format('Y-m-d H:i:s');
    }
    
    // Si es semanal con días específicos
    if ($alarma['repeticion_tipo'] == 'semanal' && $alarma['dias_semana']) {
        $dias = explode(',', $alarma['dias_semana']);
        $dias_numeros = [
            'lunes' => 1, 'martes' => 2, 'miercoles' => 3, 'jueves' => 4,
            'viernes' => 5, 'sabado' => 6, 'domingo' => 0
        ];
        
        $dia_actual = $hoy->format('N'); // 1=lunes, 7=domingo
        $proximo_dia = null;
        
        foreach ($dias as $dia) {
            $dia_num = $dias_numeros[trim($dia)];
            if ($dia_num >= $dia_actual) {
                $proximo_dia = $dia_num;
                break;
            }
        }
        
        if ($proximo_dia === null) {
            $proximo_dia = $dias_numeros[trim($dias[0])] + 7;
        }
        
        $diferencia = $proximo_dia - $dia_actual;
        $proximo = clone $hoy;
        $proximo->add(new DateInterval("P{$diferencia}D"));
        $proximo->setTime($hora_alarma->format('H'), $hora_alarma->format('i'));
        
        return $proximo->format('Y-m-d H:i:s');
    }
    
    return null;
}

$conn->close();
?>