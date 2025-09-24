// Configuración específica para desarrollo
// Descomenta la línea que corresponda a tu entorno de desarrollo

// Para desarrollo local con XAMPP en la misma máquina
export const DEV_CONFIG = {
  // Opción 1: localhost (para desarrollo en la misma máquina)
  LOCALHOST: "http://localhost/smart_pill/",

  // Opción 2: IP específica (para dispositivo físico en la misma red)
  IP_SPECIFIC: "http://192.168.1.87/smart_pill/",

  // Opción 3: Para emulador Android (10.0.2.2 apunta a localhost del host)
  ANDROID_EMULATOR: "http://10.0.2.2/smart_pill/",

  // Opción 4: Para emulador iOS (localhost funciona directamente)
  IOS_EMULATOR: "http://localhost/smart_pill/",
};

// Función para obtener la URL correcta según el entorno
export const getDevelopmentUrl = () => {
  // Detectar automáticamente el entorno
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isAndroidEmulator = userAgent && userAgent.includes('Android') && userAgent.includes('sdk');
  
  // Si es emulador Android, usar la IP especial
  if (isAndroidEmulator) {
    console.log('🤖 Detectado emulador Android, usando 10.0.2.2');
    return DEV_CONFIG.ANDROID_EMULATOR;
  }
  
  // Para dispositivos físicos y desarrollo, usar IP específica
  console.log('📱 Usando IP específica para dispositivos físicos: 192.168.1.87');
  return DEV_CONFIG.IP_SPECIFIC;
  
  // Para desarrollo local y dispositivos físicos, usar localhost
  // console.log('💻 Usando localhost para desarrollo local');
  // return DEV_CONFIG.LOCALHOST;
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
