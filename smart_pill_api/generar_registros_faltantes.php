<?php
/**
 * Función genérica para generar registros de toma faltantes
 * para cualquier programación que tenga horarios pero no registros
 */

include "conexion.php";

function generarRegistrosFaltantes($programacion_id, $dias_adelante = 7) {
    global $conn;
    
    $resultado = [
        'success' => false,
        'mensaje' => '',
        'registros_creados' => 0,
        'errores' => []
    ];
    
    try {
        // Verificar que la programación existe y está activa
        $sql_programacion = "SELECT pt.*, u.nombre_usuario as nombre_usuario, rg.nombre_comercial 
                            FROM programacion_tratamientos pt
                            INNER JOIN usuarios u ON pt.usuario_id = u.usuario_id
                            INNER JOIN remedio_global rg ON pt.remedio_global_id = rg.remedio_global_id
                            WHERE pt.programacion_id = ? AND pt.estado = 'activo'";
        
        $stmt = $conn->prepare($sql_programacion);
        $stmt->bind_param("i", $programacion_id);
        $stmt->execute();
        $programacion = $stmt->get_result()->fetch_assoc();
        
        if (!$programacion) {
            $resultado['mensaje'] = "Programación $programacion_id no encontrada o inactiva";
            return $resultado;
        }
        
        // Obtener horarios de la programación
        $sql_horarios = "SELECT h.*, pt.usuario_id, pt.remedio_global_id, pt.programacion_id, pt.dosis_por_toma
                        FROM horarios_tratamiento h
                        INNER JOIN programacion_tratamientos pt ON h.tratamiento_id = pt.programacion_id
                        WHERE h.tratamiento_id = ? AND h.activo = 1";
        
        $stmt = $conn->prepare($sql_horarios);
        $stmt->bind_param("i", $programacion_id);
        $stmt->execute();
        $result_horarios = $stmt->get_result();
        
        if ($result_horarios->num_rows == 0) {
            $resultado['mensaje'] = "No se encontraron horarios activos para la programación $programacion_id";
            return $resultado;
        }
        
        $horarios = [];
        while ($horario = $result_horarios->fetch_assoc()) {
            $horarios[] = $horario;
        }
        
        $conn->begin_transaction();
        
        $fecha_actual = new DateTime();
        $registros_creados = 0;
        
        // Traducir días al español
        $dias_traduccion = [
            'monday' => 'lunes',
            'tuesday' => 'martes', 
            'wednesday' => 'miercoles',
            'thursday' => 'jueves',
            'friday' => 'viernes',
            'saturday' => 'sabado',
            'sunday' => 'domingo'
        ];
        
        // Crear registros para los próximos días
        for ($i = 0; $i < $dias_adelante; $i++) {
            $fecha_registro = clone $fecha_actual;
            $fecha_registro->add(new DateInterval("P{$i}D"));
            
            $fecha_str = $fecha_registro->format('Y-m-d');
            $dia_semana = strtolower($fecha_registro->format('l'));
            $dia_espanol = $dias_traduccion[$dia_semana] ?? $dia_semana;
            
            // Buscar horarios para este día
            foreach ($horarios as $horario) {
                if ($horario['dia_semana'] == $dia_espanol) {
                    // Verificar si ya existe el registro
                    $sql_check = "SELECT registro_id FROM registro_tomas 
                                 WHERE horario_id = ? AND fecha_programada = ?";
                    $stmt_check = $conn->prepare($sql_check);
                    $stmt_check->bind_param("is", $horario['horario_id'], $fecha_str);
                    $stmt_check->execute();
                    
                    if ($stmt_check->get_result()->num_rows == 0) {
                        // Crear el registro
                        $sql_insert = "INSERT INTO registro_tomas (
                            usuario_id, 
                            horario_id,
                            programacion_id, 
                            remedio_global_id, 
                            fecha_programada, 
                            hora_programada, 
                            dosis_programada, 
                            estado, 
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())";
                        
                        $stmt_insert = $conn->prepare($sql_insert);
                        $stmt_insert->bind_param("iiissss", 
                            $horario['usuario_id'], 
                            $horario['horario_id'],
                            $horario['programacion_id'], 
                            $horario['remedio_global_id'], 
                            $fecha_str, 
                            $horario['hora'],
                            $horario['dosis_por_toma']
                        );
                        
                        if ($stmt_insert->execute()) {
                            $registros_creados++;
                        } else {
                            $resultado['errores'][] = "Error creando registro para $fecha_str {$horario['hora']}: " . $conn->error;
                        }
                    }
                }
            }
        }
        
        $conn->commit();
        
        $resultado['success'] = true;
        $resultado['registros_creados'] = $registros_creados;
        $resultado['mensaje'] = "Se crearon $registros_creados registros para la programación $programacion_id ({$programacion['nombre_comercial']} - {$programacion['nombre_usuario']})";
        
    } catch (Exception $e) {
        $conn->rollback();
        $resultado['mensaje'] = "Error: " . $e->getMessage();
        $resultado['errores'][] = $e->getMessage();
    }
    
    return $resultado;
}

function verificarYGenerarRegistros($programacion_id, $usuario_id = null) {
    global $conn;
    
    // Verificar si existen registros pendientes para esta programación
    $sql_check = "SELECT COUNT(*) as total FROM registro_tomas 
                  WHERE programacion_id = ? AND estado = 'pendiente'";
    
    if ($usuario_id) {
        $sql_check .= " AND usuario_id = ?";
        $stmt = $conn->prepare($sql_check);
        $stmt->bind_param("ii", $programacion_id, $usuario_id);
    } else {
        $stmt = $conn->prepare($sql_check);
        $stmt->bind_param("i", $programacion_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    // Si no hay registros pendientes, generar automáticamente
    if ($result['total'] == 0) {
        return generarRegistrosFaltantes($programacion_id);
    }
    
    return [
        'success' => true,
        'mensaje' => 'Ya existen registros pendientes para esta programación',
        'registros_creados' => 0,
        'registros_existentes' => $result['total']
    ];
}

// Si se llama directamente con parámetros
if (isset($_GET['programacion_id']) || isset($_POST['programacion_id'])) {
    header("Content-Type: application/json");
    
    $programacion_id = $_GET['programacion_id'] ?? $_POST['programacion_id'];
    $usuario_id = $_GET['usuario_id'] ?? $_POST['usuario_id'] ?? null;
    
    if (!$programacion_id || !is_numeric($programacion_id)) {
        echo json_encode([
            'success' => false,
            'mensaje' => 'programacion_id es requerido y debe ser numérico'
        ]);
        exit;
    }
    
    $resultado = verificarYGenerarRegistros($programacion_id, $usuario_id);
    echo json_encode($resultado);
    exit;
}

// Si se incluye como librería, las funciones están disponibles
?>