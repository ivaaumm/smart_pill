import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Importar sonidos directamente
const defaultSound = require('../assets/sounds/default.mp3');
const alarmSound = require('../assets/sounds/alarm.mp3');
const toneSound = require('../assets/sounds/tone.mp3');

// Mapa de sonidos
const SOUNDS = {
  'default': defaultSound,
  'alarm': alarmSound,
  'tone': toneSound
};

// Objeto para mantener referencia a los sonidos
const soundObjects = {};

// Inicializar el módulo de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Cargar un sonido
const loadSound = async (soundName) => {
  try {
    // Usar 'default' si el sonido no existe
    const soundKey = SOUNDS[soundName] ? soundName : 'default';
    
    // Detener el sonido si ya está cargado
    if (soundObjects[soundKey]) {
      await soundObjects[soundKey].unloadAsync();
    }
    
    // Cargar el sonido
    const { sound } = await Audio.Sound.createAsync(
      SOUNDS[soundKey],
      { 
        shouldPlay: false,
        isLooping: false,
        androidImplementation: 'MediaPlayer',
        shouldDuckAndroid: true,
        volume: 1.0
      }
    );
    
    soundObjects[soundKey] = sound;
    return sound;
  } catch (error) {
    console.error('Error al cargar el sonido:', error);
    return null;
  }
};

// Variable para mantener referencia al sonido actualmente en reproducción
let currentSound = null;

// Reproducir un sonido de vista previa
export const playSoundPreview = async (soundName) => {
  console.log(`🔊 Iniciando reproducción de sonido: ${soundName}`);
  
  // Configurar el modo de audio primero
  try {
    const audioConfig = {
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true,
    };

    // Usar las constantes de Audio directamente
    if (Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS) {
      // Versión más reciente de expo-av
      audioConfig.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS;
      audioConfig.interruptionModeAndroid = Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX;
    } else {
      // Versión antigua de expo-av o valores por defecto
      audioConfig.interruptionModeIOS = 1; // Mezclar con otras fuentes de audio
      audioConfig.interruptionModeAndroid = 1; // Mezclar con otras fuentes de audio (1 es el valor más seguro)
    }

    console.log('🔊 Configurando audio con:', audioConfig);
    await Audio.setAudioModeAsync(audioConfig);
    console.log('✅ Modo de audio configurado correctamente');
  } catch (error) {
    console.error('❌ Error configurando el modo de audio:', error);
    // Re-lanzar el error para manejarlo en el componente que llama a esta función
    throw error;
  }

  // Detener el sonido actual si existe
  if (currentSound) {
    console.log('⏹ Deteniendo sonido actual...');
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    } catch (e) {
      console.error('⚠️ Error deteniendo el sonido anterior:', e);
    }
  }

  // Verificar que el sonido solicitado exista
  const soundToPlay = SOUNDS[soundName] || SOUNDS['default'];
  if (!soundToPlay) {
    console.error(`❌ No se encontró el sonido: ${soundName}`);
    return;
  }

  console.log(`🎵 Cargando sonido: ${soundName}`);
  
  try {
    // Cargar el sonido con configuración para reproducción completa
    const { sound: newSound } = await Audio.Sound.createAsync(
      soundToPlay,
      { 
        shouldPlay: true, // Reproducir inmediatamente
        volume: 1.0,
        isLooping: false,
        isMuted: false,
        progressUpdateIntervalMillis: 100,
      },
      (status) => {
        console.log('Estado del sonido:', status);
        if (status.didJustFinish) {
          console.log('✅ Sonido reproducido completamente');
          // Limpiar después de terminar
          newSound.unloadAsync().catch(e => 
            console.error('Error al liberar el sonido:', e)
          );
          if (currentSound === newSound) {
            currentSound = null;
          }
        }
      }
    );
    
    // Asignar el nuevo sonido como sonado actual
    currentSound = newSound;
    console.log('▶️ Reproduciendo sonido completo...');
    
    // Configurar limpieza en caso de que el componente se desmonte
    return () => {
      if (newSound) {
        newSound.unloadAsync().catch(e => 
          console.error('Error en la limpieza del sonido:', e)
        );
        if (currentSound === newSound) {
          currentSound = null;
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error crítico al reproducir el sonido:', error);
    // Intentar limpiar en caso de error
    if (currentSound) {
      try {
        await currentSound.unloadAsync();
      } catch (e) {
        console.error('⚠️ Error limpiando después del error:', e);
      } finally {
        currentSound = null;
      }
    }
    throw error; // Relanzar el error para manejarlo en el componente
  }
};

// Programar una notificación con sonido
export const scheduleNotification = async ({ id, title, body, sound = 'default', date, data = {} }) => {
  try {
    console.log(`📅 Programando notificación con sonido: ${sound}`);
    
    // Verificar si la fecha es válida
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Fecha inválida proporcionada para la notificación');
    }
    
    // Crear una copia de la fecha para evitar mutaciones
    const notificationDate = new Date(date);
    
    // Mostrar información de depuración
    console.log('\n📅 Programando notificación:');
    console.log('- Fecha recibida (local):', date.toString());
    console.log('- Fecha recibida (ISO):', date.toISOString());
    console.log('- Zona horaria:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Asegurarse de que el sonido sea válido
    const validSound = Object.keys(SOUNDS).includes(sound) ? sound : 'default';
    
    // Configurar el canal de notificación (solo para Android)
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('alarms', {
          name: 'Alarm notifications',
          importance: Notifications.AndroidImportance.HIGH,
          sound: `${validSound}.mp3`,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
        console.log('✅ Canal de notificación configurado correctamente');
      } catch (channelError) {
        console.error('⚠️ Error configurando el canal de notificación:', channelError);
      }
    }

    // Configurar el modo de audio para asegurar que el sonido funcione
    try {
      // Configuración de audio estándar
      const audioConfig = {
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: true
      };

      // Usar valores numéricos directamente para evitar problemas de compatibilidad
      // Valores válidos para interruptionModeIOS: 1 (MIX_WITH_OTHERS), 2 (DO_NOT_MIX), 3 (DUCK_OTHERS)
      audioConfig.interruptionModeIOS = 1; // MIX_WITH_OTHERS
      audioConfig.interruptionModeAndroid = 2; // DO_NOT_MIX

      console.log('🔊 Configurando audio con modo de interrupción IOS:', audioConfig.interruptionModeIOS);
      console.log('🔊 Configurando audio con modo de interrupción Android:', audioConfig.interruptionModeAndroid);

      console.log('🔊 Configurando audio para notificación con:', audioConfig);
      await Audio.setAudioModeAsync(audioConfig);
    } catch (audioError) {
      console.error('⚠️ Error configurando el modo de audio para notificación:', audioError);
    }

    // Crear una copia de la fecha para evitar mutaciones
    const triggerDate = new Date(notificationDate);
    
    // Ajustar la fecha para asegurar que sea en el futuro
    const now = new Date();
    if (notificationDate <= now) {
      console.log('⚠️ La fecha de la notificación está en el pasado, ajustando al día siguiente...');
      notificationDate.setDate(notificationDate.getDate() + 1);
    }
    
    // Obtener la zona horaria del dispositivo
    const timeZone = 'America/Argentina/Buenos_Aires'; // Forzar zona horaria de Argentina
    const timeZoneOffset = 3; // UTC-3 para Argentina
    
    // Función para formatear fechas en la zona horaria local
    const formatDateForDisplay = (date) => {
      if (!(date instanceof Date) || isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    };

    // Usar la fecha directamente (ya debería estar en la zona horaria correcta)
    const localDate = new Date(notificationDate);
    
    // Formatear fechas para mostrar en la zona horaria correcta
    const formattedLocalDate = formatDateForDisplay(localDate);
    const utcDate = localDate.toISOString();
    
    // Mostrar información detallada
    console.log('⏰ Detalles de la notificación:');
    console.log('- Hora solicitada (local):', formattedLocalDate);
    console.log('- Hora UTC:', utcDate);
    console.log(`- Zona horaria: ${timeZone} (UTC-${timeZoneOffset})`);
    
    // Crear una copia de los datos sin modificar el objeto original
    const notificationData = {
      ...data,
      hora: localDate.toISOString(),
      timezone: timeZone,
      sound: validSound,
      originalDate: localDate.toISOString(),
    };
    
    // Programar la notificación con la fecha exacta
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: notificationData,
        sound: validSound === 'default' ? 'default' : 'custom',
      },
      trigger: {
        date: new Date(localDate), // Crear una nueva instancia de Date
        channelId: 'alarms',
      },
    });
    
    console.log('✅ Notificación programada exitosamente');
    console.log('- ID de notificación:', notificationId);
    console.log('- Para la fecha (local):', formatDateForDisplay(localDate));
    console.log('- En la zona horaria:', timeZone, '(UTC-3)');
    
    return notificationId;
  } catch (error) {
    console.error('❌ Error al programar la notificación:', error);
    return null;
  }
};

// Cancelar una notificación programada
export const cancelScheduledNotification = async (notificationId) => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

// Limpiar los sonidos cargados
export const unloadSounds = async () => {
  try {
    await Promise.all(
      Object.values(soundObjects).map(sound => 
        sound.unloadAsync().catch(console.error)
      )
    );
  } catch (error) {
    console.error('Error al descargar los sonidos:', error);
  }
};
