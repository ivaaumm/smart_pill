// API para el registro de tomas de medicamentos
import { testConnectivity } from '../config';

// Variable para cachear la URL que funciona
let cachedWorkingUrl = null;

// Función auxiliar para obtener la URL de la API
const getApiBaseUrl = async () => {
  if (cachedWorkingUrl) {
    // Asegurar que la URL termine correctamente
    const baseUrl = cachedWorkingUrl.endsWith('/') ? cachedWorkingUrl.slice(0, -1) : cachedWorkingUrl;
    return baseUrl + '/smart_pill_api';
  }
  
  const connectivityResult = await testConnectivity();
  if (!connectivityResult.success) {
    throw new Error('No se pudo establecer conexión con el servidor');
  }
  
  cachedWorkingUrl = connectivityResult.workingUrl;
  // Asegurar que la URL termine correctamente
  const baseUrl = cachedWorkingUrl.endsWith('/') ? cachedWorkingUrl.slice(0, -1) : cachedWorkingUrl;
  return baseUrl + '/smart_pill_api';
};

/**
 * Registra una nueva toma de medicamento
 * @param {Object} tomaData - Datos de la toma
 * @param {number} tomaData.usuario_id - ID del usuario
 * @param {number} tomaData.horario_id - ID del horario
 * @param {string} tomaData.estado - Estado: 'tomada', 'pospuesta', 'rechazada'
 * @param {string} tomaData.observaciones - Observaciones adicionales
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const registrarToma = async (tomaData) => {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/registro_tomas.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tomaData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Error en la respuesta del servidor');
    }

    return result;
  } catch (error) {
    console.error('Error al registrar toma:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de una toma existente
 * @param {Object} updateData - Datos para actualizar
 * @param {number} updateData.registro_id - ID del registro a actualizar
 * @param {string} updateData.nuevo_estado - Nuevo estado
 * @param {string} updateData.observaciones - Observaciones adicionales
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const actualizarEstadoToma = async (updateData) => {
  try {
    // Convertir nuevo_estado a estado para que coincida con el endpoint PHP
    const dataParaEnviar = {
      registro_id: updateData.registro_id,
      estado: updateData.nuevo_estado, // PHP espera 'estado', no 'nuevo_estado'
      observaciones: updateData.observaciones || ''
    };
    
    console.log('🔍 DEBUG - Datos que se envían al endpoint:', JSON.stringify(dataParaEnviar, null, 2));
    
    const apiBaseUrl = await getApiBaseUrl();
    const url = `${apiBaseUrl}/registro_tomas.php`;
    
    console.log('🔍 DEBUG - URL del endpoint:', url);
    console.log('🔍 DEBUG - Método: PUT');
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataParaEnviar),
    });

    console.log('🔍 DEBUG - Status de respuesta:', response.status);
    console.log('🔍 DEBUG - Headers de respuesta:', response.headers);
    
    const result = await response.json();
    
    console.log('🔍 DEBUG - Respuesta del servidor:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Error en la respuesta del servidor');
    }

    return result;
  } catch (error) {
    console.error('❌ Error al actualizar estado de toma:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de registros de tomas
 * @param {Object} params - Parámetros de consulta
 * @param {number} params.usuario_id - ID del usuario
 * @param {string} params.fecha_desde - Fecha desde (YYYY-MM-DD)
 * @param {string} params.fecha_hasta - Fecha hasta (YYYY-MM-DD)
 * @param {string} params.estado - Estado específico (opcional)
 * @returns {Promise<Object>} Historial de registros
 */
export const obtenerHistorialTomas = async (params) => {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${apiBaseUrl}/registro_tomas.php?${queryParams}`);

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Error en la respuesta del servidor');
    }

    return result;
  } catch (error) {
    console.error('Error al obtener historial de tomas:', error);
    throw error;
  }
};

/**
 * Extrae los datos necesarios de notificationData para el registro
 * @param {Object} notificationData - Datos de la notificación
 * @param {Object} user - Datos del usuario actual del contexto
 * @returns {Object} Datos formateados para el API
 */
export const formatearDatosParaRegistro = (notificationData, user = null) => {
  return {
    usuario_id: user?.usuario_id || notificationData?.usuario_id || 1,
    horario_id: notificationData?.horario_id || 1,
    dosis_programada: notificationData?.dosis || notificationData?.dosisPorToma || '1 tableta',
    observaciones: ''
  };
};

/**
 * Obtiene el registro_id para una programación específica
 * @param {number} programacionId - ID de la programación
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number>} ID del registro encontrado
 */
export const obtenerRegistroId = async (programacionId, usuarioId) => {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const url = `${apiBaseUrl}/obtener_registro_pendiente.php`;
    
    console.log('🔍 DEBUG - Obteniendo registro_id para:', { programacionId, usuarioId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        programacion_id: programacionId,
        usuario_id: usuarioId
      }),
    });

    const result = await response.json();
    
    console.log('🔍 DEBUG - Respuesta obtener_registro_existente:', JSON.stringify(result, null, 2));
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Error al obtener registro_id');
    }

    if (!result.registro_id) {
      throw new Error('No se encontró registro_id en la respuesta');
    }

    return result.registro_id;
  } catch (error) {
    console.error('❌ Error al obtener registro_id:', error);
    throw error;
  }
};

/**
 * Maneja errores comunes del API
 * @param {Error} error - Error capturado
 * @returns {string} Mensaje de error amigable
 */
export const manejarErrorAPI = (error) => {
  const errorMessage = error?.message || '';
  
  if (errorMessage && errorMessage.includes('fetch')) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }
  
  if (errorMessage && errorMessage.includes('JSON')) {
    return 'Error en el formato de datos del servidor.';
  }
  
  return errorMessage || 'Error desconocido al procesar la solicitud.';
};

/**
 * Crea un registro de medicamento solo cuando el usuario interactúa con la alarma
 * @param {Object} interactionData - Datos de la interacción
 * @param {number} interactionData.programacion_id - ID de la programación
 * @param {number} interactionData.usuario_id - ID del usuario
 * @param {string} interactionData.estado - Estado: 'tomada', 'pospuesta', 'rechazada'
 * @param {string} interactionData.observaciones - Observaciones adicionales
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const crearRegistroPorInteraccion = async (interactionData) => {
  try {
    console.log('📝 Creando registro por interacción:', interactionData);
    
    // Agregar la fecha actual del cliente
    const dataWithClientDate = {
      ...interactionData,
      fecha_cliente: new Date().toISOString()
    };
    
    console.log('📅 Datos con fecha del cliente:', dataWithClientDate);
    
    const apiBaseUrl = await getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/crear_registro_interaccion.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithClientDate),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Error en la respuesta del servidor');
    }

    if (!result.success) {
      throw new Error(result.message || 'Error al crear el registro por interacción');
    }

    console.log('✅ Registro creado por interacción exitosamente:', result);
    return result;
  } catch (error) {
    console.error('❌ Error al crear registro por interacción:', error);
    throw error;
  }
};