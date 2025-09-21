<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data) {
        throw new Exception("Datos JSON inválidos");
    }
    
    // Validar campos obligatorios
    if (!isset($data->programacion_id) || empty($data->programacion_id)) {
        throw new Exception("ID de programación requerido");
    }
    
    $programacion_id = intval($data->programacion_id);
    
    if ($programacion_id <= 0) {
        throw new Exception("ID de programación inválido");
    }
    
    // Verificar que la programación existe y obtener datos actuales
    $sql_check = "SELECT 
                    programacion_id, 
                    nombre_tratamiento, 
                    usuario_id,
                    remedio_global_id,
                    estado,
                    fecha_inicio,
                    fecha_fin,
                    dosis_por_toma,
                    observaciones
                  FROM programacion_tratamientos 
                  WHERE programacion_id = $programacion_id";
    
    $res_check = $conn->query($sql_check);
    
    if (!$res_check || $res_check->num_rows == 0) {
        throw new Exception("Programación no encontrada");
    }
    
    $programacion_actual = $res_check->fetch_assoc();
    
    // Iniciar transacción para asegurar consistencia
    $conn->begin_transaction();
    
    try {
        // Construir la consulta de actualización
        $updates = [];
        $campos_actualizados = [];
        
        // Campos que se pueden editar
        if (isset($data->nombre_tratamiento)) {
            $nombre_tratamiento = trim($conn->real_escape_string($data->nombre_tratamiento));
            if (empty($nombre_tratamiento)) {
                throw new Exception("El nombre del tratamiento no puede estar vacío");
            }
            $updates[] = "nombre_tratamiento = '$nombre_tratamiento'";
            $campos_actualizados[] = "nombre_tratamiento";
        }
        
        if (isset($data->estado)) {
            $estado = strtolower($conn->real_escape_string($data->estado));
            $estados_validos = ['activo', 'inactivo', 'pausado', 'completado'];
            if (!in_array($estado, $estados_validos)) {
                throw new Exception("Estado inválido. Debe ser: " . implode(', ', $estados_validos));
            }
            $updates[] = "estado = '$estado'";
            $campos_actualizados[] = "estado";
        }
        
        if (isset($data->fecha_inicio)) {
            $fecha_inicio = $conn->real_escape_string($data->fecha_inicio);
            if (!empty($fecha_inicio)) {
                if (strtotime($fecha_inicio) === false) {
                    throw new Exception("Formato de fecha de inicio inválido. Use YYYY-MM-DD");
                }
                $updates[] = "fecha_inicio = '$fecha_inicio'";
                $campos_actualizados[] = "fecha_inicio";
            } else {
                $updates[] = "fecha_inicio = NULL";
                $campos_actualizados[] = "fecha_inicio (NULL)";
            }
        }
        
        if (isset($data->fecha_fin)) {
            $fecha_fin = $conn->real_escape_string($data->fecha_fin);
            if (!empty($fecha_fin)) {
                if (strtotime($fecha_fin) === false) {
                    throw new Exception("Formato de fecha de fin inválido. Use YYYY-MM-DD");
                }
                $updates[] = "fecha_fin = '$fecha_fin'";
                $campos_actualizados[] = "fecha_fin";
            } else {
                $updates[] = "fecha_fin = NULL";
                $campos_actualizados[] = "fecha_fin (NULL)";
            }
        }
        
        if (isset($data->dosis_por_toma)) {
            $dosis_por_toma = trim($conn->real_escape_string($data->dosis_por_toma));
            if (!empty($dosis_por_toma)) {
                $updates[] = "dosis_por_toma = '$dosis_por_toma'";
                $campos_actualizados[] = "dosis_por_toma";
            } else {
                $updates[] = "dosis_por_toma = NULL";
                $campos_actualizados[] = "dosis_por_toma (NULL)";
            }
        }
        
        if (isset($data->observaciones)) {
            $observaciones = trim($conn->real_escape_string($data->observaciones));
            if (!empty($observaciones)) {
                $updates[] = "observaciones = '$observaciones'";
                $campos_actualizados[] = "observaciones";
            } else {
                $updates[] = "observaciones = NULL";
                $campos_actualizados[] = "observaciones (NULL)";
            }
        }
        
        // Si no hay campos para actualizar
        if (empty($updates)) {
            throw new Exception("No se proporcionaron campos para editar");
        }
        
        // Actualizar la programación
        $sql = "UPDATE programacion_tratamientos SET " . implode(", ", $updates) . " WHERE programacion_id = $programacion_id";
        
        if (!$conn->query($sql)) {
            throw new Exception("Error al editar programación: " . $conn->error);
        }
        
        // Manejar horarios si se proporcionan
        $horarios_actualizados = 0;
        if (isset($data->horarios) && is_array($data->horarios) && count($data->horarios) > 0) {
            // Eliminar horarios existentes
            $sql_delete_horarios = "DELETE FROM horarios_tratamiento WHERE tratamiento_id = $programacion_id";
            if (!$conn->query($sql_delete_horarios)) {
                throw new Exception("Error al eliminar horarios existentes: " . $conn->error);
            }
            
            // Insertar nuevos horarios
            foreach ($data->horarios as $horario) {
                if (!isset($horario->dia_semana) || !isset($horario->hora) || !isset($horario->dosis)) {
                    continue; // Saltar horarios incompletos
                }
                
                $dia_semana = $conn->real_escape_string($horario->dia_semana);
                $hora = $conn->real_escape_string($horario->hora);
                $dosis = $conn->real_escape_string($horario->dosis);
                $activo = isset($horario->activo) ? intval($horario->activo) : 1;
                
                $sql_insert_horario = "INSERT INTO horarios_tratamiento (
                    tratamiento_id, 
                    usuario_id,
                    remedio_global_id,
                    dia_semana, 
                    hora, 
                    dosis, 
                    activo, 
                    fecha_creacion
                ) VALUES (
                    $programacion_id, 
                    " . $programacion_actual['usuario_id'] . ",
                    " . $programacion_actual['remedio_global_id'] . ",
                    '$dia_semana', 
                    '$hora', 
                    '$dosis', 
                    $activo, 
                    NOW()
                )";
                
                if (!$conn->query($sql_insert_horario)) {
                    throw new Exception("Error al insertar horario: " . $conn->error);
                }
                $horarios_actualizados++;
            }
            
            $campos_actualizados[] = "horarios ($horarios_actualizados horarios)";
        }
        
        // Obtener datos actualizados
        $sql_updated = "SELECT 
                        programacion_id, 
                        nombre_tratamiento, 
                        usuario_id,
                        remedio_global_id,
                        estado,
                        fecha_inicio,
                        fecha_fin,
                        dosis_por_toma,
                        observaciones
                      FROM programacion_tratamientos 
                      WHERE programacion_id = $programacion_id";
        
        $res_updated = $conn->query($sql_updated);
        $programacion_actualizada = $res_updated->fetch_assoc();
        
        // Confirmar transacción
        $conn->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Tratamiento editado exitosamente",
            "programacion_anterior" => [
                "programacion_id" => $programacion_actual['programacion_id'],
                "nombre_tratamiento" => $programacion_actual['nombre_tratamiento'],
                "estado" => $programacion_actual['estado'],
                "fecha_inicio" => $programacion_actual['fecha_inicio'],
                "fecha_fin" => $programacion_actual['fecha_fin'],
                "dosis_por_toma" => $programacion_actual['dosis_por_toma'],
                "observaciones" => $programacion_actual['observaciones']
            ],
            "programacion_actualizada" => $programacion_actualizada,
            "campos_modificados" => $campos_actualizados
        ]);
        
    } catch (Exception $e) {
        // Revertir transacción en caso de error
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

$conn->close();
?> 
