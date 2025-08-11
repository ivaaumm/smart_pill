// Configuración de la API para diferentes entornos
import { getDevelopmentUrl } from "./config-dev.js";

const ENV = process.env.NODE_ENV || "development";

const config = {
  development: {
    // Usar la función de desarrollo para obtener la URL correcta
    BASE_URL: getDevelopmentUrl(),
    PORT: 3000,
    CORS_ORIGIN: "*",
  },
  production: {
    BASE_URL: "https://tu-api-produccion.com",
    PORT: process.env.PORT || 3000,
    CORS_ORIGIN: "https://tu-app-produccion.com",
  },
};

// Configuración para React Native
export const API_CONFIG = {
  // URL base de la API
  BASE_URL: config[ENV].BASE_URL,

  // Endpoints de la API
  ENDPOINTS: {
    LOGIN: "/login.php",
    REGISTER: "/registro.php",
    PASTILLAS_USUARIO: "/pastillas_usuario.php",
    REGISTRAR_MOVIMIENTO: "/registrar_movimiento.php",
    TRATAMIENTOS: "/tratamientos.php",
    CREAR_PROGRAMACION: "/crear_programacion.php",
    ALARMAS_USUARIO: "/alarmas_usuario.php",
    CREAR_ALARMA: "/crear_alarmas.php",
    ACTUALIZAR_ALARMA: "/actualizar_alarma.php",
    ELIMINAR_ALARMA: "/eliminar_alarmas.php",
    CONFIRMAR_TOMA: "/confirmar_toma.php",
    CATALOGO_PASTILLAS: "/catalogo_pastillas.php",
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
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Función helper para hacer peticiones HTTP
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);

  console.log("🌐 Haciendo petición a:", url);
  console.log("📤 Datos enviados:", options.body);

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

    let response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("📥 Respuesta recibida:", response.status, response.statusText);

    if (!response.ok) {
      console.log("❌ Error HTTP:", response.status, response.statusText);
    }

    let data;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      console.log("📄 Datos JSON recibidos:", data);
    } else {
      // Si no es JSON, obtener el texto para debug
      const textResponse = await response.text();
      console.log(
        "📄 Respuesta no-JSON recibida:",
        textResponse.substring(0, 200) + "..."
      );
      data = {
        error: "La API devolvió HTML en lugar de JSON",
        rawResponse: textResponse.substring(0, 100),
      };
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
