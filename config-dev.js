// Configuración específica para desarrollo
// Descomenta la línea que corresponda a tu entorno de desarrollo

// Para desarrollo local con XAMPP en la misma máquina
export const DEV_CONFIG = {
  // Opción 1: localhost (para desarrollo en la misma máquina)
  LOCALHOST: "http://localhost/smart-pill/smart_pill_api/",

  // Opción 2: IP específica (para dispositivo físico en la misma red)
  IP_SPECIFIC: "http://192.168.1.87/smart-pill/smart_pill_api/",

  // Opción 3: Para emulador Android (10.0.2.2 apunta a localhost del host)
  ANDROID_EMULATOR: "http://10.0.2.2/smart-pill/smart_pill_api/",

  // Opción 4: Para emulador iOS (localhost funciona directamente)
  IOS_EMULATOR: "http://localhost/smart-pill/smart_pill_api/",
};

// Función para obtener la URL correcta según el entorno
export const getDevelopmentUrl = () => {
  // Cambia esta línea según tu entorno de desarrollo
  return DEV_CONFIG.IP_SPECIFIC; // Cambia a la opción que necesites

  // Ejemplos de uso:
  // return DEV_CONFIG.LOCALHOST; // Para desarrollo local
  // return DEV_CONFIG.ANDROID_EMULATOR; // Para emulador Android
  // return DEV_CONFIG.IOS_EMULATOR; // Para emulador iOS
};

// Instrucciones de uso:
console.log("📋 Instrucciones para configurar la URL de desarrollo:");
console.log("1. Para desarrollo local: usa LOCALHOST");
console.log("2. Para dispositivo físico: usa IP_SPECIFIC (cambia la IP)");
console.log("3. Para emulador Android: usa ANDROID_EMULATOR");
console.log("4. Para emulador iOS: usa IOS_EMULATOR");
console.log("");
console.log("💡 Para encontrar tu IP en Windows:");
console.log("   - Abre CMD y ejecuta: ipconfig");
console.log("   - Busca 'IPv4 Address' en tu adaptador de red");
console.log("   - Cambia la IP en IP_SPECIFIC");
