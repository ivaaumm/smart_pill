// Configuración de la API para diferentes entornos
import { getDevelopmentUrl } from "./config-dev.js";

const ENV = process.env.NODE_ENV || "development";

const config = {
  development: {
    // Usar la función de desarrollo para obtener la URL correcta
    BASE_URL: getDevelopmentUrl(),
    API_URL: getDevelopmentUrl() + 'smart_pill_api/',
    PORT: 3000,
    CORS_ORIGIN: "*",
  },
  production: {
    // En producción, usa la URL de producción
    BASE_URL: 'https://tu-dominio.com',
    API_URL: 'https://tu-dominio.com/smart_pill_api/',
    PORT: process.env.PORT || 3000,
    CORS_ORIGIN: "https://tu-app-produccion.com",
  },
};

// Exportar API_URL directamente para compatibilidad
export const API_URL = config[ENV].API_URL;

// Configuración para React Native
export const API_CONFIG = {
  // URL base de la API
  BASE_URL: config[ENV].BASE_URL,

  // Endpoints de la API
  ENDPOINTS: {
    // Endpoints en smart_pill_api/
    LOGIN: "smart_pill_api/login.php",
    REGISTER: "smart_pill_api/registro.php",
    
    // Endpoints en smart_pill_api/
    PASTILLAS_USUARIO: "smart_pill_api/pastillas_usuario.php",
    REGISTRAR_MOVIMIENTO: "smart_pill_api/registrar_movimiento.php",
    TRATAMIENTOS: "smart_pill_api/tratamientos.php",
    OBTPROGRAMACIONES: "smart_pill_api/obtener_programaciones.php",
    CREAR_PROGRAMACION: "smart_pill_api/crear_programacion.php",
    ALARMAS_USUARIO: "smart_pill_api/alarmas_usuario.php",
    CREAR_ALARMA: "smart_pill_api/crear_alarmas.php",
    ACTUALIZAR_ALARMA: "smart_pill_api/actualizar_alarma.php",
    ELIMINAR_ALARMA: "smart_pill_api/eliminar_alarmas.php",
    CONFIRMAR_TOMA: "smart_pill_api/confirmar_toma.php",
    CATALOGO_PASTILLAS: "smart_pill_api/catalogo_pastillas.php",
    SONIDOS_DISPONIBLES: "/sonidos_disponibles.php",
  },

  // Configuración de headers por defecto
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Timeout para las peticiones (en milisegundos) - aumentado a 30 segundos
  TIMEOUT: 30000,
};

// Configuración del servidor
export const SERVER_CONFIG = {
  PORT: config[ENV].PORT,
  CORS_ORIGIN: config[ENV].CORS_ORIGIN,
  ENV: ENV,
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  // Remove any leading/trailing slashes from the endpoint
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  const baseUrl = config[ENV].BASE_URL.replace(/\/+$/, '');
  
  // For endpoints in smart_pill_api directory
  if (cleanEndpoint.startsWith('smart_pill_api/')) {
    return `${baseUrl}/${cleanEndpoint}`;
  }
  
  // For all other endpoints, assume they are in smart_pill_api/
  return `${baseUrl}/smart_pill_api/${cleanEndpoint}`;
};

export const getApiUrl = () => {
  // Ensure the API URL ends with exactly one slash
  const apiUrl = config[ENV].API_URL;
  return apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
};

// URLs de fallback para probar en caso de error
const FALLBACK_URLS = [
  'http://localhost/smart_pill/',
  'http://192.168.1.87/smart_pill/',
  'http://10.0.2.2/smart_pill/'
];

// Función para probar conectividad con diferentes URLs
export const testConnectivity = async () => {
  for (const baseUrl of FALLBACK_URLS) {
    try {
      const testUrl = `${baseUrl}smart_pill_api/obtener_programaciones.php?usuario_id=1`;
      
      // Crear una promesa con timeout manual para React Native
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const fetchPromise = fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response.ok) {
        console.log(`✅ Conexión exitosa con: ${baseUrl}`);
        return {
          success: true,
          workingUrl: baseUrl,
          message: `Conexión establecida con ${baseUrl}`
        };
      }
    } catch (error) {
      console.log(`❌ Falló conexión con: ${baseUrl} - Error: ${error.message}`);
    }
  }
  
  console.log('❌ No se pudo establecer conexión con ninguna URL');
  return {
    success: false,
    workingUrl: null,
    message: 'No se pudo establecer conexión con el servidor'
  };
};

// Función helper para hacer peticiones HTTP
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);

  console.log("🌐 Haciendo petición a:", url);
  console.log("📤 Datos enviados:", options.body);
  console.log("🔧 Configuración de la petición:", {
    method: options.method || "GET",
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers,
    },
    ...options,
  });

  const config = {
    method: options.method || "GET",
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers,
    },
    ...options,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    let response;
    try {
      console.log('🔍 Fetch config:', {
        url,
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.parse(config.body) : undefined,
        signal: 'AbortController.signal'
      });
      
      const startTime = Date.now();
      response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      console.log(`⏱️  Tiempo de respuesta: ${Date.now() - startTime}ms`);
      console.log('📥 Estado de la respuesta:', response.status, response.statusText);
      
      // Clonar la respuesta para leer el cuerpo dos veces (una para logs, otra para el parseo real)
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log('📦 Cuerpo de la respuesta (raw):', responseText);
      
      try {
        const jsonData = JSON.parse(responseText);
        console.log('📦 Cuerpo de la respuesta (JSON):', jsonData);
      } catch (e) {
        console.log('⚠️ La respuesta no es un JSON válido');
      }
    } catch (fetchError) {
      console.error("❌ Error en la petición fetch:", fetchError);
      throw new Error(`Error de red: ${fetchError.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    console.log("📥 Respuesta recibida:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });

    let data;
    const contentType = response.headers.get("content-type") || '';

    // Intentar obtener el contenido de la respuesta para depuración
    const responseText = await response.text();
    
    if (contentType && contentType.includes("application/json") && responseText) {
      try {
        data = JSON.parse(responseText);
        console.log("📄 Datos JSON recibidos:", data);
      } catch (jsonError) {
        console.error("❌ Error al parsear JSON:", jsonError);
        console.error("📄 Contenido de la respuesta:", responseText);
        throw new Error("La respuesta no es un JSON válido");
      }
    } else {
      console.log("📄 Respuesta no-JSON recibida:", responseText);
      throw new Error(`Respuesta inesperada del servidor (${response.status}): ${responseText.substring(0, 200)}`);
    }

    return {
      success: response.ok,
      data,
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    console.log("💥 Error en petición:", error.message);
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "TIMEOUT_ERROR",
        message:
          "La petición tardó demasiado. Verifica tu conexión a internet.",
        data: null,
      };
    }
    return {
      success: false,
      error: "NETWORK_ERROR",
      message: error.message,
      data: null,
    };
  }
};
