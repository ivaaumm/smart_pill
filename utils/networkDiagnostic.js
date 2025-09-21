// Utilidad para diagnosticar problemas de red en React Native
import { testConnectivity } from '../config.js';
import { getDevelopmentUrl } from '../config-dev.js';

/**
 * Diagnostica problemas de conectividad y sugiere soluciones
 */
export const diagnoseNetworkIssues = async () => {
  console.log('🔍 Iniciando diagnóstico de red...');
  
  // 1. Mostrar configuración actual
  const currentUrl = getDevelopmentUrl();
  console.log('📍 URL actual configurada:', currentUrl);
  
  // 2. Detectar entorno
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : 'Unknown';
  console.log('🔧 User Agent:', userAgent);
  
  const isAndroid = userAgent && userAgent.includes('Android');
  const isEmulator = userAgent && (userAgent.includes('sdk') || userAgent.includes('Emulator'));
  
  console.log('📱 Entorno detectado:', {
    isAndroid,
    isEmulator,
    platform: isAndroid ? 'Android' : 'iOS/Other'
  });
  
  // 3. Probar conectividad con diferentes URLs
  console.log('🌐 Probando conectividad...');
  const workingUrl = await testConnectivity();
  
  if (workingUrl) {
    console.log('✅ Se encontró una URL que funciona:', workingUrl);
    return {
      success: true,
      workingUrl,
      recommendation: getRecommendation(workingUrl, isAndroid, isEmulator)
    };
  } else {
    console.log('❌ No se pudo conectar con ninguna URL');
    return {
      success: false,
      workingUrl: null,
      recommendation: getFailureRecommendation(isAndroid, isEmulator)
    };
  }
};

/**
 * Obtiene recomendaciones basadas en la URL que funciona
 */
const getRecommendation = (workingUrl, isAndroid, isEmulator) => {
  if (workingUrl && workingUrl.includes('localhost')) {
    return {
      message: 'Usar localhost - ideal para desarrollo local',
      configChange: 'return DEV_CONFIG.LOCALHOST;',
      file: 'config-dev.js'
    };
  }
  
  if (workingUrl && workingUrl.includes('10.0.2.2')) {
    return {
      message: 'Usar IP de emulador Android - ideal para emuladores',
      configChange: 'return DEV_CONFIG.ANDROID_EMULATOR;',
      file: 'config-dev.js'
    };
  }
  
  if (workingUrl && workingUrl.includes('192.168')) {
    return {
      message: 'Usar IP específica - ideal para dispositivos físicos',
      configChange: 'return DEV_CONFIG.IP_SPECIFIC;',
      file: 'config-dev.js',
      note: 'Asegúrate de que la IP coincida con tu red local'
    };
  }
  
  return {
    message: 'URL personalizada encontrada',
    configChange: `return '${workingUrl}';`,
    file: 'config-dev.js'
  };
};

/**
 * Obtiene recomendaciones cuando falla la conectividad
 */
const getFailureRecommendation = (isAndroid, isEmulator) => {
  const recommendations = [
    '1. Verifica que XAMPP esté ejecutándose',
    '2. Verifica que Apache esté iniciado en XAMPP',
    '3. Prueba abrir http://localhost/smart_pill en tu navegador'
  ];
  
  if (isAndroid && isEmulator) {
    recommendations.push('4. Para emulador Android, usa 10.0.2.2 en lugar de localhost');
    recommendations.push('5. Configura: return DEV_CONFIG.ANDROID_EMULATOR;');
  } else if (isAndroid) {
    recommendations.push('4. Para dispositivo Android físico, usa la IP de tu PC');
    recommendations.push('5. Encuentra tu IP con: ipconfig (Windows) o ifconfig (Mac/Linux)');
    recommendations.push('6. Configura: return DEV_CONFIG.IP_SPECIFIC;');
  }
  
  recommendations.push('7. Verifica que no haya firewall bloqueando el puerto 80');
  
  return {
    message: 'No se pudo establecer conexión',
    recommendations
  };
};

/**
 * Función rápida para probar la conectividad actual
 */
export const quickConnectivityTest = async () => {
  try {
    const currentUrl = getDevelopmentUrl();
    const testUrl = `${currentUrl}smart_pill_api/obtener_programaciones.php?usuario_id=1`;
    
    console.log('🧪 Probando URL actual:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      console.log('✅ Conectividad OK');
      return { success: true, url: testUrl };
    } else {
      console.log('❌ Error HTTP:', response.status);
      return { success: false, error: `HTTP ${response.status}`, url: testUrl };
    }
  } catch (error) {
    console.log('❌ Error de red:', error.message);
    return { success: false, error: error.message };
  }
};