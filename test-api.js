// Archivo de prueba para verificar la API
import { apiRequest, API_CONFIG } from "./credenciales";

// Función para probar la conexión
export const testApiConnection = async () => {
  console.log("🧪 Iniciando pruebas de API...");

  // Prueba 1: Verificar si la API responde
  try {
    console.log("📡 Probando conexión básica...");
    const response = await fetch(API_CONFIG.BASE_URL);
    console.log("✅ API responde:", response.status);
  } catch (error) {
    console.log("❌ API no responde:", error.message);
  }

  // Prueba 2: Probar endpoint de registro
  try {
    console.log("📝 Probando endpoint de registro...");
    const testData = {
      nombre_usuario: "test_user",
      email: "test@example.com",
      password: "test123",
    };

    // Probar con fetch directo para ver la respuesta exacta
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`;
    console.log("🔗 URL de prueba:", url);

    const rawResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log("📊 Status:", rawResponse.status);
    console.log(
      "📊 Headers:",
      Object.fromEntries(rawResponse.headers.entries())
    );

    const responseText = await rawResponse.text();
    console.log("📄 Respuesta completa:", responseText);

    const response = await apiRequest(API_CONFIG.ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify(testData),
    });

    console.log("📋 Respuesta procesada:", response);
  } catch (error) {
    console.log("❌ Error en registro:", error);
  }

  // Prueba 3: Probar endpoint de login
  try {
    console.log("🔐 Probando endpoint de login...");
    const testData = {
      email: "test@example.com",
      password: "test123",
    };

    const response = await apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify(testData),
    });

    console.log("📋 Respuesta de login:", response);
  } catch (error) {
    console.log("❌ Error en login:", error);
  }
};

// Función para verificar la URL completa
export const checkApiUrl = () => {
  const registerUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`;
  console.log("🔗 URL completa de registro:", registerUrl);
  return registerUrl;
};
