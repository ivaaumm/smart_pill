import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { scheduleLocalNotification } from './notificationConfig';

// Detectar si estamos en Expo Go
const isExpoGo = __DEV__ && !Device.isDevice;

// Importar sonidos directamente
const defaultSound = require('../assets/sounds/default.mp3');
const alarmSound = require('../assets/sounds/alarm.mp3');
const toneSound = require('../assets/sounds/tone.mp3');

// Mapa de sonidos con volúmenes y configuraciones distintas para diferenciarlos
const SOUNDS = {
  'default': {
    source: defaultSound,
    volume: 1.0,
    rate: 1.0
  },
  'alarm': {
    source: alarmSound,
    volume: 1.0, // Aumentar volumen para alarmas
    rate: 1.1
  },
  'tone': {
    source: toneSound,
    volume: 1.0, // Aumentar volumen para tonos
    rate: 0.9
  }
};

// Función para verificar y configurar el volumen del sistema
export const checkSystemVolume = async () => {
  try {
    console.log('🔊 Verificando configuración de volumen del sistema...');
    
    // Configurar el modo de audio para máximo volumen
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false, // No reducir volumen por otras apps
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: 'doNotMix',
      interruptionModeAndroid: 'doNotMix'
    });
    
    console.log('✅ Configuración de volumen aplicada');
    return true;
  } catch (error) {
    console.error('❌ Error configurando volumen del sistema:', error);
    return false;
  }
};

// Función para validar todos los sonidos precargados
export const validatePreloadedSounds = () => {
  console.log('🔍 Validando sonidos precargados...');
  const results = {
    valid: [],
    invalid: [],
    total: 0
  };
  
  for (const [soundName, sound] of Object.entries(preloadedSounds)) {
    results.total++;
    const validation = validateSoundState(sound, soundName);
    
    if (validation.isValid) {
      results.valid.push(soundName);
      console.log(`✅ ${soundName}: Válido`);
    } else {
      results.invalid.push({ name: soundName, error: validation.error });
      console.warn(`❌ ${soundName}: ${validation.error}`);
      // Limpiar sonido inválido
      delete preloadedSounds[soundName];
    }
  }
  
  // Validar también el cache
  for (const [soundName, cachedSound] of soundCache.entries()) {
    const validation = validateSoundState(cachedSound.sound, `cache-${soundName}`);
    if (!validation.isValid) {
      console.warn(`❌ Cache ${soundName}: ${validation.error}`);
      soundCache.delete(soundName);
    }
  }
  
  console.log(`📊 Validación completada: ${results.valid.length}/${results.total} sonidos válidos`);
  return results;
};

// Objeto para mantener referencia a los sonidos
const soundObjects = {};

// Cache de sonidos precargados para acceso instantáneo
const soundCache = new Map();
let isAudioInitialized = false;

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
  console.log(`🔄 [AUDIO LOG] Iniciando carga de sonido: ${soundName}`);
  
  try {
    // Usar 'default' si el sonido no existe
    const soundKey = SOUNDS[soundName] ? soundName : 'default';
    console.log(`🔄 [AUDIO LOG] Sonido resuelto: ${soundName} -> ${soundKey}`);
    
    // Detener el sonido si ya está cargado
    if (soundObjects[soundKey]) {
      console.log(`🔄 [AUDIO LOG] Liberando sonido anterior: ${soundKey}`);
      try {
        if (soundObjects[soundKey].unloadAsync) {
          await soundObjects[soundKey].unloadAsync();
          console.log(`✅ [AUDIO LOG] Sonido anterior liberado: ${soundKey}`);
        }
      } catch (e) {
        console.warn('⚠️ [AUDIO LOG] Error liberando sonido anterior:', {
          error: e.message,
          soundKey
        });
      }
    }
    
    console.log(`🔄 [AUDIO LOG] Creando reproductor de audio para: ${soundKey}`);
    // Cargar el sonido con expo-audio
    const soundConfig = SOUNDS[soundKey];
    console.log(`🔄 [AUDIO LOG] Configuración del sonido:`, {
      soundKey,
      volume: soundConfig.volume,
      rate: soundConfig.rate,
      source: typeof soundConfig.source
    });
    
    const sound = createAudioPlayer(soundConfig.source);
    console.log(`🔄 [AUDIO LOG] Reproductor creado, configurando propiedades...`);
    
    // Configurar el reproductor
    sound.volume = soundConfig.volume;
    sound.rate = soundConfig.rate;
    sound.loop = false;
    
    console.log(`🔄 [AUDIO LOG] Propiedades configuradas:`, {
      volume: sound.volume,
      rate: sound.rate,
      loop: sound.loop
    });
    
    // Verificar que el sonido se cargó correctamente
    if (!sound) {
      throw new Error(`No se pudo cargar el sonido: ${soundKey}`);
    }
    
    soundObjects[soundKey] = sound;
    console.log(`✅ [AUDIO LOG] Sonido cargado exitosamente: ${soundKey}`);
    return sound;
  } catch (error) {
    console.error(`❌ [AUDIO LOG] Error al cargar el sonido ${soundName}:`, {
      error: error.message,
      stack: error.stack,
      soundName,
      availableSounds: Object.keys(SOUNDS)
    });
    return null;
  }
};

// Variable para mantener referencia al sonido actualmente en reproducción
let currentSound = null;

// Función utilitaria para validar el estado de un sonido
const validateSoundState = (sound, soundName) => {
  if (!sound) {
    return {
      isValid: false,
      canPlay: false,
      error: `Sonido no definido: ${soundName}`
    };
  }
  
  try {
    // En expo-audio, verificamos propiedades directas
    const isLoaded = sound.loaded !== false; // Asumimos cargado si no hay propiedad loaded
    const canPlay = isLoaded && !sound.isPlaying;
    
    return {
      isValid: canPlay,
      canPlay,
      isLoaded,
      error: !isLoaded ? `Sonido no está cargado: ${soundName}` : null
    };
  } catch (error) {
    console.error(`❌ Error validando sonido ${soundName}:`, error);
    return {
      isValid: false,
      error: error.message,
      canPlay: false
    };
  }
};

// Función para detener cualquier sonido en reproducción
export const stopCurrentSound = async () => {
  console.log('🔄 [AUDIO LOG] Intentando detener sonido actual...');
  
  if (currentSound) {
    try {
      console.log('🔄 [AUDIO LOG] Validando estado del sonido actual...');
      const validation = validateSoundState(currentSound, 'currentSound');
      
      if (validation.isValid) {
        console.log('🔄 [AUDIO LOG] Sonido válido, procediendo a detener...');
        
        // Para expo-audio
        if (currentSound.stop && typeof currentSound.stop === 'function') {
          console.log('🔄 [AUDIO LOG] Deteniendo con método stop() de expo-audio');
          try {
            currentSound.stop();
            console.log('✅ [AUDIO LOG] Sonido detenido con stop()');
          } catch (stopError) {
            console.warn('⚠️ [AUDIO LOG] Error con stop():', stopError.message);
          }
        }
        
        // Pausar sonido con expo-audio
        console.log('🔄 [AUDIO LOG] Pausando sonido actual');
        try {
          await currentSound.pauseAsync();
          console.log('✅ [AUDIO LOG] Sonido pausado exitosamente');
        } catch (pauseError) {
          console.warn('⚠️ [AUDIO LOG] Error pausando sonido:', pauseError.message);
        }
        
        // Liberar recursos si es posible
        if (currentSound.unloadAsync && typeof currentSound.unloadAsync === 'function') {
          console.log('🔄 [AUDIO LOG] Liberando recursos con unloadAsync()');
          try {
            await currentSound.unloadAsync();
            console.log('✅ [AUDIO LOG] Recursos liberados correctamente');
          } catch (unloadError) {
            console.warn('⚠️ [AUDIO LOG] Error liberando recursos:', unloadError.message);
          }
        }
        
      } else {
        console.warn('⚠️ [AUDIO LOG] Sonido actual no válido, limpiando referencia:', validation.error);
      }
      
      currentSound = null;
      console.log('✅ [AUDIO LOG] Referencia de sonido actual limpiada');
      return true;
      
    } catch (e) {
      console.error('❌ [AUDIO LOG] Error deteniendo el sonido:', {
        error: e.message,
        stack: e.stack
      });
      currentSound = null;
      return false;
    }
  } else {
    console.log('ℹ️ [AUDIO LOG] No hay sonido actual para detener');
  }
  
  return true;
};

// Detener todos los sonidos
// Función para pausar sonidos en reproducción sin limpiar cache
export const pausePlayingSounds = async () => {
  try {
    console.log('⏸️ [AUDIO LOG] Pausando sonidos en reproducción...');
    
    // Detener el sonido actual primero
    console.log('🔄 [AUDIO LOG] Pausando sonido actual...');
    await stopCurrentSound();
    
    // Pausar sonidos precargados que estén reproduciéndose
    console.log('🔄 [AUDIO LOG] Pausando sonidos precargados en reproducción...');
    const pausePromises = Object.keys(preloadedSounds).map(async (soundName) => {
      const sound = preloadedSounds[soundName];
      if (sound) {
        try {
          // Solo pausar, no descargar
          if (sound.stop && typeof sound.stop === 'function') {
            try {
              sound.stop();
              console.log(`⏸️ [AUDIO LOG] Sonido ${soundName} pausado con stop()`);
            } catch (stopError) {
              console.warn(`⚠️ [AUDIO LOG] Error pausando ${soundName}:`, stopError.message);
            }
          }
          
          // Pausar con expo-audio
          try {
            await sound.pauseAsync();
            console.log(`⏸️ [AUDIO LOG] Sonido ${soundName} pausado`);
          } catch (pauseError) {
            console.warn(`⚠️ [AUDIO LOG] Error pausando ${soundName}:`, pauseError.message);
          }
          
        } catch (error) {
          console.error(`❌ [AUDIO LOG] Error pausando sonido ${soundName}:`, {
            error: error.message,
            stack: error.stack
          });
        }
      }
    });
    
    // Pausar sonidos en cache que estén reproduciéndose
    console.log('🔄 [AUDIO LOG] Pausando sonidos en cache en reproducción...');
    const cachePausePromises = Array.from(soundCache.entries()).map(async ([key, cached]) => {
      try {
        // Solo pausar, no descargar ni limpiar cache
        if (cached.sound.stop && typeof cached.sound.stop === 'function') {
          try {
            cached.sound.stop();
            console.log(`⏸️ [AUDIO LOG] Sonido cache ${key} pausado con stop()`);
          } catch (stopError) {
            console.warn(`⚠️ [AUDIO LOG] Error pausando cache ${key}:`, stopError.message);
          }
        }
        
        if (cached.sound.pauseAsync && typeof cached.sound.pauseAsync === 'function') {
          try {
            await cached.sound.pauseAsync();
            console.log(`⏸️ [AUDIO LOG] Sonido cache ${key} pausado con pauseAsync()`);
          } catch (pauseError) {
            console.warn(`⚠️ [AUDIO LOG] Error pausando cache ${key}:`, pauseError.message);
          }
        }
        
      } catch (error) {
        console.error(`❌ [AUDIO LOG] Error pausando sonido en cache ${key}:`, {
          error: error.message,
          stack: error.stack
        });
      }
    });
    
    // Esperar a que todos los sonidos se pausen
    console.log('🔄 [AUDIO LOG] Esperando que todos los sonidos se pausen...');
    await Promise.all([...pausePromises, ...cachePausePromises]);
    
    console.log('✅ [AUDIO LOG] Sonidos en reproducción pausados (cache preservado)');
  } catch (error) {
    console.error('❌ [AUDIO LOG] Error pausando sonidos en reproducción:', {
      error: error.message,
      stack: error.stack
    });
  }
};

// Función para detener y limpiar completamente todos los sonidos
export const stopAllSounds = async () => {
  try {
    console.log('🔇 [AUDIO LOG] Deteniendo y limpiando todos los sonidos...');
    
    // Detener el sonido actual primero
    console.log('🔄 [AUDIO LOG] Deteniendo sonido actual...');
    await stopCurrentSound();
    
    // Detener todos los sonidos precargados
    console.log('🔄 [AUDIO LOG] Deteniendo sonidos precargados...');
    const stopPromises = Object.keys(preloadedSounds).map(async (soundName) => {
      const sound = preloadedSounds[soundName];
      if (sound) {
        try {
          console.log(`🔄 [AUDIO LOG] Deteniendo sonido precargado: ${soundName}`);
          
          // Para expo-audio
          if (sound.stop && typeof sound.stop === 'function') {
            try {
              sound.stop();
              console.log(`✅ [AUDIO LOG] Sonido ${soundName} detenido con stop()`);
            } catch (stopError) {
              console.warn(`⚠️ [AUDIO LOG] Error con stop() en ${soundName}:`, stopError.message);
            }
          }
          
          // Pausar sonido
          if (sound.pauseAsync && typeof sound.pauseAsync === 'function') {
            try {
              await sound.pauseAsync();
              console.log(`✅ [AUDIO LOG] Sonido ${soundName} pausado con pauseAsync()`);
            } catch (pauseError) {
              console.warn(`⚠️ [AUDIO LOG] Error con pauseAsync() en ${soundName}:`, pauseError.message);
            }
          }
          
          // Liberar recursos
          if (sound.unloadAsync && typeof sound.unloadAsync === 'function') {
            try {
              await sound.unloadAsync();
              console.log(`✅ [AUDIO LOG] Recursos de ${soundName} liberados`);
            } catch (unloadError) {
              console.warn(`⚠️ [AUDIO LOG] Error liberando ${soundName}:`, unloadError.message);
            }
          }
          
        } catch (error) {
          console.error(`❌ [AUDIO LOG] Error deteniendo sonido ${soundName}:`, {
            error: error.message,
            stack: error.stack
          });
        }
      }
    });
    
    // Detener sonidos en cache
    console.log('🔄 [AUDIO LOG] Deteniendo sonidos en cache...');
    const cacheStopPromises = Array.from(soundCache.entries()).map(async ([key, cached]) => {
      try {
        console.log(`🔄 [AUDIO LOG] Deteniendo sonido en cache: ${key}`);
        
        // Para expo-audio
        if (cached.sound.stop && typeof cached.sound.stop === 'function') {
          try {
            cached.sound.stop();
            console.log(`✅ [AUDIO LOG] Sonido cache ${key} detenido con stop()`);
          } catch (stopError) {
            console.warn(`⚠️ [AUDIO LOG] Error con stop() en cache ${key}:`, stopError.message);
          }
        }
        
        // Pausar sonido
        if (cached.sound.pauseAsync && typeof cached.sound.pauseAsync === 'function') {
          try {
            await cached.sound.pauseAsync();
            console.log(`✅ [AUDIO LOG] Sonido cache ${key} pausado con pauseAsync()`);
          } catch (pauseError) {
            console.warn(`⚠️ [AUDIO LOG] Error con pauseAsync() en cache ${key}:`, pauseError.message);
          }
        }
        
        // Liberar recursos
        if (cached.sound.unloadAsync && typeof cached.sound.unloadAsync === 'function') {
          try {
            await cached.sound.unloadAsync();
            console.log(`✅ [AUDIO LOG] Recursos de cache ${key} liberados`);
          } catch (unloadError) {
            console.warn(`⚠️ [AUDIO LOG] Error liberando cache ${key}:`, unloadError.message);
          }
        }
        
      } catch (error) {
        console.error(`❌ [AUDIO LOG] Error deteniendo sonido en cache ${key}:`, {
          error: error.message,
          stack: error.stack
        });
      }
    });
    
    // Esperar a que todos los sonidos se detengan
    console.log('🔄 [AUDIO LOG] Esperando que todos los sonidos se detengan...');
    await Promise.all([...stopPromises, ...cacheStopPromises]);
    
    // Limpiar el cache de sonidos
    console.log('🔄 [AUDIO LOG] Limpiando cache de sonidos...');
    soundCache.clear();
    
    console.log('✅ [AUDIO LOG] Todos los sonidos detenidos y cache limpiado');
  } catch (error) {
    console.error('❌ [AUDIO LOG] Error deteniendo todos los sonidos:', {
      error: error.message,
      stack: error.stack
    });
  }
};

// Objeto para almacenar sonidos precargados
const preloadedSounds = {};

// Inicializar audio una sola vez
const initializeAudio = async () => {
  console.log('🔄 [AUDIO LOG] Iniciando inicialización de audio...');
  
  if (isAudioInitialized) {
    console.log('✅ [AUDIO LOG] Audio ya está inicializado');
    return true;
  }
  
  try {
    console.log('🔄 [AUDIO LOG] Verificando volumen del sistema...');
    // Verificar y configurar el volumen del sistema primero
    await checkSystemVolume();
    console.log('✅ [AUDIO LOG] Volumen del sistema verificado');
    
    console.log('🔄 [AUDIO LOG] Configurando modo de audio para expo-audio...');
    // Configurar el modo de audio para expo-audio
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false, // No reducir volumen
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: 'doNotMix',
      interruptionModeAndroid: 'doNotMix'
    });
    console.log('✅ [AUDIO LOG] Modo de audio configurado exitosamente');
    
    isAudioInitialized = true;
    console.log('✅ [AUDIO LOG] Audio inicializado correctamente con volumen máximo');
    return true;
  } catch (error) {
    console.error('❌ [AUDIO LOG] Error inicializando audio:', {
      error: error.message,
      stack: error.stack,
      platform: Platform.OS,
      isExpoGo
    });
    isAudioInitialized = false;
    return false;
  }
};

// Precargar todos los sonidos disponibles (optimizado)
export const preloadSounds = async () => {
  console.log('🔊 Precargando sonidos...');
  
  // Inicializar audio primero
  if (!(await initializeAudio())) {
    return false;
  }
  
  try {
    // Precargar sonidos en paralelo para mayor velocidad
    const preloadPromises = Object.entries(SOUNDS).map(async ([name, soundConfig]) => {
      try {
        const sound = createAudioPlayer(soundConfig.source);
        
        // Configurar el reproductor
        sound.volume = soundConfig.volume;
        sound.rate = soundConfig.rate;
        sound.loop = false;
        
        // Guardar en ambos caches para compatibilidad
        preloadedSounds[name] = sound;
        soundCache.set(name, {
          sound,
          config: soundConfig,
          lastUsed: Date.now()
        });
        
        console.log(`✅ Sonido precargado: ${name}`);
        return { name, success: true };
      } catch (error) {
        console.error(`❌ Error precargando ${name}:`, error);
        return { name, success: false, error };
      }
    });
    
    const results = await Promise.all(preloadPromises);
    const successful = results.filter(r => r.success).length;
    
    console.log(`✅ Precarga completada: ${successful}/${results.length} sonidos`);
    return successful > 0;
  } catch (error) {
    console.error('❌ Error en precarga de sonidos:', error);
    return false;
  }
};

// Reproducir un sonido de vista previa (compatible con Expo Go)
export const playSoundPreview = async (soundName) => {
  console.log(`🔊 [AUDIO LOG] Iniciando reproducción de sonido: ${soundName}`);
  console.log(`🔊 [AUDIO LOG] Entorno detectado - isExpoGo: ${isExpoGo}, __DEV__: ${__DEV__}, Device.isDevice: ${Device.isDevice}`);
  
  const soundKey = SOUNDS[soundName] ? soundName : 'default';
  const soundConfig = SOUNDS[soundKey];
  console.log(`🔊 [AUDIO LOG] Configuración de sonido:`, {
    soundKey,
    volume: soundConfig.volume,
    rate: soundConfig.rate,
    source: soundConfig.source
  });
  
  // Detener sonido actual para evitar superposiciones
  console.log(`🔊 [AUDIO LOG] Deteniendo sonido actual para evitar superposiciones...`);
  await stopCurrentSound();
  console.log(`🔊 [AUDIO LOG] Sonido actual detenido, procediendo con reproducción...`);
  
  try {
    // Usar expo-audio para todas las plataformas
    
    // Usar expo-audio para builds nativas
    console.log('🎵 [AUDIO LOG] Usando expo-audio para build nativa');
    
    // Inicializar audio si no está listo
    if (!isAudioInitialized) {
      console.log('🎵 [AUDIO LOG] Audio no inicializado, inicializando...');
      const initialized = await initializeAudio();
      if (!initialized) {
        console.error('❌ [AUDIO LOG] Falló la inicialización del sistema de audio');
        throw new Error('No se pudo inicializar el sistema de audio');
      }
      console.log('✅ [AUDIO LOG] Sistema de audio inicializado exitosamente');
    }
    
    // Usar cache optimizado
    console.log('🎵 [AUDIO LOG] Verificando cache de sonidos...');
    const cachedSound = soundCache.get(soundKey);
    if (cachedSound) {
      console.log('🎵 [AUDIO LOG] Sonido encontrado en cache');
      const { sound, config } = cachedSound;
      
      try {
        const validation = validateSoundState(sound, soundKey);
        console.log('🎵 [AUDIO LOG] Validación de sonido en cache:', validation);
        if (!validation.isValid) {
          console.warn(`⚠️ Sonido en cache no es válido: ${soundKey}`);
          soundCache.delete(soundKey);
        } else {
          cachedSound.lastUsed = Date.now();
          console.log('🔄 [AUDIO LOG] Reproduciendo sonido desde cache...');
          
          // El sonido actual ya fue detenido al inicio de la función
          
          // Configurar volumen
          sound.volume = config.volume;
          console.log('🔄 [AUDIO LOG] Volumen configurado:', sound.volume);
          
          // Establecer como sonido actual
          currentSound = sound;
          console.log('🔄 [AUDIO LOG] Sonido establecido como currentSound');
          
          // Reproducir con expo-audio
          if (sound.play && typeof sound.play === 'function') {
            // expo-audio
            console.log('🔄 [AUDIO LOG] Reproduciendo con expo-audio (método play)');
            try {
              const result = sound.play();
              console.log('🔍 [AUDIO LOG] Resultado de play():', result);
              
              // Verificar si play() devuelve una promesa
              if (result && typeof result.then === 'function') {
                console.log('🔄 [AUDIO LOG] play() devolvió una promesa, esperando...');
                await result;
              }
            } catch (playError) {
              console.error('❌ [AUDIO LOG] Error en play():', {
                error: playError.message,
                stack: playError.stack
              });
              throw playError;
            }
          } else {
            // Método de reproducción no reconocido
            console.warn('⚠️ [AUDIO LOG] Método de reproducción no reconocido para este sonido');
            throw new Error('Método de reproducción no compatible');
          }
          
          console.log(`✅ [AUDIO LOG] Sonido reproducido desde cache: ${soundKey}`);
          
          // Verificar estado después de reproducir
          setTimeout(() => {
            console.log('🔍 [AUDIO LOG] Verificando estado del sonido después de reproducir...');
            if (sound.isPlaying !== undefined) {
              console.log('🔍 [AUDIO LOG] Estado del sonido después de reproducir:', {
                isPlaying: sound.isPlaying,
                volume: sound.volume
              });
            } else {
              console.log('🔍 [AUDIO LOG] Propiedades disponibles del sonido:', Object.keys(sound));
            }
          }, 100);
          
          return { success: true, method: 'cache' };
        }
      } catch (e) {
        console.warn(`⚠️ Error verificando sonido en cache: ${soundKey}`, e);
        soundCache.delete(soundKey);
      }
    }
    
    // Fallback a sonidos precargados
    if (preloadedSounds[soundKey]) {
      const sound = preloadedSounds[soundKey];
      const config = SOUNDS[soundKey];
      
      try {
        // Verificar que el sonido precargado esté disponible
        const validation = validateSoundState(sound, soundKey);
        if (!validation.isValid) {
          console.warn(`⚠️ Sonido precargado no es válido: ${soundKey}`);
          delete preloadedSounds[soundKey];
        } else {
          console.log('🔄 [AUDIO LOG] Reproduciendo sonido precargado...');
          
          // Detener sonido actual si existe
          if (currentSound && currentSound !== sound) {
            console.log('🔄 [AUDIO LOG] Deteniendo sonido actual antes de reproducir precargado');
            await stopCurrentSound();
          }
          
          // Configurar volumen
          sound.volume = config.volume;
          console.log('🔄 [AUDIO LOG] Volumen configurado para precargado:', sound.volume);
          
          // Reproducir sonido precargado con expo-audio
          if (sound.play && typeof sound.play === 'function') {
            // expo-audio
            console.log('🔄 [AUDIO LOG] Reproduciendo precargado con expo-audio (método play)');
            sound.play();
          } else {
            // Método de reproducción no reconocido
            console.warn('⚠️ [AUDIO LOG] Método de reproducción no reconocido para sonido precargado');
            throw new Error('Método de reproducción no compatible para sonido precargado');
          }
          
          currentSound = sound;
          console.log(`✅ [AUDIO LOG] Sonido reproducido desde precarga: ${soundKey}`);
          
          // Verificar estado después de reproducir
          setTimeout(() => {
            if (sound.isPlaying !== undefined) {
              console.log('🔍 [AUDIO LOG] Estado del sonido precargado después de reproducir:', {
                isPlaying: sound.isPlaying,
                volume: sound.volume
              });
            }
          }, 100);
          
          return { success: true, method: 'preloaded' };
        }
      } catch (e) {
        console.warn(`⚠️ Error verificando sonido precargado: ${soundKey}`, e);
        delete preloadedSounds[soundKey];
      }
    }
    
    // Si no está precargado, cargar y reproducir (fallback)
    console.log(`⚠️ [AUDIO LOG] Cargando sonido dinámicamente: ${soundKey}`);
    const soundConfig = SOUNDS[soundKey];
    
    console.log('🔄 [AUDIO LOG] Creando reproductor de audio dinámico...');
    const newSound = createAudioPlayer(soundConfig.source);
    
    // Configurar el reproductor
    newSound.volume = soundConfig.volume;
    newSound.rate = soundConfig.rate;
    newSound.loop = false;
    console.log('🔄 [AUDIO LOG] Reproductor dinámico configurado:', {
      volume: newSound.volume,
      rate: newSound.rate,
      loop: newSound.loop
    });
    
    // Verificar que el sonido se cargó correctamente
    if (!newSound) {
      console.error('❌ [AUDIO LOG] No se pudo crear el objeto de sonido dinámico');
      throw new Error(`No se pudo crear el objeto de sonido: ${soundKey}`);
    }
    
    // Verificar el estado antes de reproducir
    const validation = validateSoundState(newSound, soundKey);
    console.log('🔄 [AUDIO LOG] Validación de sonido dinámico:', validation);
    if (!validation.isValid) {
      console.error('❌ [AUDIO LOG] Sonido dinámico no es válido');
      if (newSound.unloadAsync) {
        await newSound.unloadAsync();
      }
      throw new Error(`El sonido no se cargó correctamente: ${soundKey}`);
    }
    
    // Detener sonido actual si existe
    if (currentSound && currentSound !== newSound) {
      console.log('🔄 [AUDIO LOG] Deteniendo sonido actual antes de reproducir dinámico');
      await stopCurrentSound();
    }
    
    // Reproducir sonido dinámico con expo-audio
    if (newSound.play && typeof newSound.play === 'function') {
      // expo-audio
      console.log('🔄 [AUDIO LOG] Reproduciendo dinámico con expo-audio (método play)');
      newSound.play();
    } else {
      // Método de reproducción no reconocido
      console.warn('⚠️ [AUDIO LOG] Método de reproducción no reconocido para sonido dinámico');
      throw new Error('Método de reproducción no compatible para sonido dinámico');
    }
    
    console.log(`✅ [AUDIO LOG] Sonido fallback reproducido: ${soundKey}`);
    
    // Verificar estado después de reproducir
    setTimeout(() => {
      if (newSound.isPlaying !== undefined) {
        console.log('🔍 [AUDIO LOG] Estado del sonido dinámico después de reproducir:', {
          isPlaying: newSound.isPlaying,
          volume: newSound.volume
        });
      }
    }, 100);
    
    // Guardar en cache para uso futuro
    soundCache.set(soundKey, {
      sound: newSound,
      config: soundConfig,
      lastUsed: Date.now()
    });
    
    // Asignar el nuevo sonido como sonado actual
    currentSound = newSound;
    console.log('▶️ Reproduciendo sonido completo...');
    return { success: true, method: 'expo-audio' };
    
  } catch (error) {
    console.error(`❌ [AUDIO LOG] Error reproduciendo sonido ${soundKey}:`, {
      error: error.message,
      stack: error.stack,
      soundKey,
      isExpoGo,
      currentSound: !!currentSound
    });
    
    // Error final - no se pudo reproducir el sonido
    console.error('❌ [AUDIO LOG] Error final reproduciendo sonido');
    throw new Error(`No se pudo reproducir el sonido ${soundKey}: ${error.message}`);
  }
};

// Programar una notificación con sonido (compatible con Expo Go)
export const scheduleNotification = async ({ id, title, body, sound = 'default', date, data = {}, medicamento = '', dosis = '1 tableta' }) => {
  try {
    console.log(`📅 Programando notificación: ${title}`);
    
    // Verificar si la fecha es válida
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Fecha inválida proporcionada para la notificación');
    }
    
    // Verificar que la fecha sea futura
    const now = new Date();
    const timeUntilNotification = date.getTime() - now.getTime();
    
    if (date <= now) {
      console.warn('⚠️ La fecha de notificación está en el pasado:', date.toLocaleString('es-AR'));
      console.warn('⚠️ Fecha actual:', now.toLocaleString('es-AR'));
      throw new Error('No se puede programar una notificación en el pasado. Verifique la fecha y hora seleccionadas.');
    }
    
    // VALIDACIÓN CRÍTICA: No permitir notificaciones con menos de 1 minuto de anticipación
    const minimumLeadTime = 1 * 60 * 1000; // 1 minuto en milisegundos
    if (timeUntilNotification < minimumLeadTime) {
      const minutesUntil = Math.round(timeUntilNotification / (1000 * 60));
      console.warn(`⚠️ Notificación muy próxima (${minutesUntil} minutos). Mínimo requerido: 1 minuto`);
      throw new Error(`No se puede programar una notificación con menos de 1 minuto de anticipación. Tiempo actual: ${minutesUntil} minutos.`);
    }
    
    // Mostrar información de depuración
    console.log('\n📅 Detalles de la notificación:');
    console.log('- Medicamento:', medicamento);
    console.log('- Dosis:', dosis);
    console.log('- Fecha programada:', date.toLocaleString('es-AR'));
    console.log('- Sonido:', sound);
    console.log('- Es recurrente:', data.isRecurring || false);
    if (data.diasSeleccionados) {
      console.log('- Días seleccionados:', data.diasSeleccionados);
    }
    
    // Preparar datos de la notificación
    const notificationData = {
      ...data,
      hora: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      medicamento: medicamento || data.medicamento || 'Medicamento',
      dosis: dosis || data.dosis || '1 tableta',
      timestamp: date.getTime(),
      originalDate: date.toString(),
      // Datos para recurrencia
      isRecurring: data.isRecurring || false,
      diasSeleccionados: data.diasSeleccionados || '',
      programacionId: data.programacionId,
      alarmaIndex: data.alarmaIndex,
    };
    
    // Usar la función compatible con Expo Go
    const notificationId = await scheduleLocalNotification({
      id,
      title,
      body,
      data: notificationData,
      triggerDate: date,
      sound
    });
    
    console.log('✅ Notificación programada exitosamente con ID:', notificationId);
    
    // NOTA: No programar automáticamente notificaciones recurrentes adicionales
    // La reprogramación se maneja desde FullScreenAlarm cuando el usuario confirma la toma
    // Esto evita crear múltiples notificaciones infinitas
    
    return notificationId;
  } catch (error) {
    console.error('❌ Error al programar la notificación:', error);
    return null;
  }
};

// Función auxiliar para programar notificaciones recurrentes
const scheduleRecurringNotifications = async ({ id, title, body, sound, data, medicamento, dosis, baseDate }) => {
  try {
    if (!data.diasSeleccionados) return;
    
    const diasArray = data.diasSeleccionados.split(',');
    const nombresDias = {
      'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4,
      'viernes': 5, 'sábado': 6, 'domingo': 0
    };
    
    console.log('🔄 Programando notificaciones recurrentes para los próximos 7 días...');
    
    // Programar para los próximos 7 días
    for (let weekOffset = 1; weekOffset <= 1; weekOffset++) {
      for (const dia of diasArray) {
        const diaNumero = nombresDias[dia.toLowerCase().trim()];
        if (diaNumero === undefined) continue;
        
        const fechaRecurrente = new Date(baseDate);
        fechaRecurrente.setDate(baseDate.getDate() + (7 * weekOffset));
        
        // Ajustar al día correcto de la semana
        const diferenciaDias = (diaNumero - fechaRecurrente.getDay() + 7) % 7;
        fechaRecurrente.setDate(fechaRecurrente.getDate() + diferenciaDias);
        
        const recurringId = `${id}_week${weekOffset}_${dia}`;
        
        await scheduleLocalNotification({
          id: recurringId,
          title,
          body,
          data: {
            ...data,
            timestamp: fechaRecurrente.getTime(),
            originalDate: fechaRecurrente.toString(),
            weekOffset,
            dia
          },
          triggerDate: fechaRecurrente,
          sound
        });
        
        console.log(`✅ Notificación recurrente programada: ${recurringId} para ${fechaRecurrente.toLocaleString('es-AR')}`);
      }
    }
  } catch (error) {
    console.error('❌ Error programando notificaciones recurrentes:', error);
  }
};

// Cancelar una notificación programada
export const cancelScheduledNotification = async (notificationId) => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

// Limpiar cache de sonidos no utilizados (gestión de memoria)
const cleanupSoundCache = async () => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutos
  
  for (const [key, cached] of soundCache.entries()) {
    if (now - cached.lastUsed > maxAge) {
      try {
        if (cached.sound.unloadAsync) {
          await cached.sound.unloadAsync();
        }
      } catch (e) {
        console.warn('Error liberando sonido del cache:', e);
      }
      soundCache.delete(key);
      console.log(`🧹 Cache limpiado: ${key}`);
    }
  }
};

// Ejecutar limpieza cada 2 minutos
setInterval(cleanupSoundCache, 2 * 60 * 1000);

// Función de diagnóstico de audio
export const diagnoseAudioSystem = async () => {
  console.log('🔍 Iniciando diagnóstico del sistema de audio...');
  
  const diagnosis = {
    audioInitialized: isAudioInitialized,
    preloadedSounds: Object.keys(preloadedSounds).length,
    cachedSounds: soundCache.size,
    currentSound: currentSound ? 'Activo' : 'Ninguno',
    systemVolume: 'Verificando...',
    soundFiles: {},
    recommendations: []
  };
  
  // Verificar archivos de sonido
  for (const [name, config] of Object.entries(SOUNDS)) {
    try {
      diagnosis.soundFiles[name] = {
        exists: !!config.source,
        volume: config.volume,
        rate: config.rate
      };
    } catch (error) {
      diagnosis.soundFiles[name] = {
        exists: false,
        error: error.message
      };
    }
  }
  
  // Verificar configuración de volumen
  try {
    await checkSystemVolume();
    diagnosis.systemVolume = 'Configurado correctamente';
  } catch (error) {
    diagnosis.systemVolume = `Error: ${error.message}`;
    diagnosis.recommendations.push('Verificar permisos de audio del dispositivo');
  }
  
  // Verificar sonidos precargados
  if (diagnosis.preloadedSounds === 0) {
    diagnosis.recommendations.push('Ejecutar preloadSounds() para cargar sonidos');
  }
  
  // Verificar inicialización
  if (!diagnosis.audioInitialized) {
    diagnosis.recommendations.push('Ejecutar initializeAudio() para inicializar el sistema');
  }
  
  // Recomendaciones adicionales
  if (Platform.OS === 'ios') {
    diagnosis.recommendations.push('Verificar que el dispositivo no esté en modo silencioso');
  }
  
  if (Platform.OS === 'android') {
    diagnosis.recommendations.push('Verificar volumen de medios en configuración del dispositivo');
  }
  
  console.log('📊 Diagnóstico completado:', diagnosis);
  return diagnosis;
};

// Función de prueba rápida de audio
export const testAudioPlayback = async (soundName = 'default') => {
  console.log(`🧪 Probando reproducción de sonido: ${soundName}`);
  
  try {
    // Ejecutar diagnóstico primero
    const diagnosis = await diagnoseAudioSystem();
    
    if (!isAudioInitialized) {
      console.log('🔧 Inicializando audio...');
      await initializeAudio();
    }
    
    if (Object.keys(preloadedSounds).length === 0) {
      console.log('🔧 Precargando sonidos...');
      await preloadSounds();
    }
    
    // Intentar reproducir el sonido
    await playSoundPreview(soundName);
    
    console.log('✅ Prueba de audio exitosa');
    return {
      success: true,
      message: 'Sonido reproducido correctamente',
      diagnosis
    };
    
  } catch (error) {
    console.error('❌ Error en prueba de audio:', error);
    return {
      success: false,
      error: error.message,
      diagnosis: await diagnoseAudioSystem()
    };
  }
};

// Función de compatibilidad para código legacy
export const playSound = async (soundName) => {
  console.log(`🔊 playSound (legacy): ${soundName}`);
  return await playSoundPreview(soundName);
};

// Función específica para probar alarmas
export const testAlarmSound = async () => {
  console.log('🔔 [AUDIO LOG] === PRUEBA DE SONIDO DE ALARMA ===');
  
  try {
    console.log('🔄 [AUDIO LOG] Iniciando prueba de sonido de alarma...');
    
    // Verificar inicialización del audio
    if (!isAudioInitialized) {
      console.log('🔄 [AUDIO LOG] Inicializando sistema de audio...');
      const initialized = await initializeAudio();
      if (!initialized) {
        throw new Error('No se pudo inicializar el sistema de audio');
      }
    }
    
    console.log('🔄 [AUDIO LOG] Reproduciendo sonido de alarma...');
    const result = await playSoundPreview('alarm');
    
    console.log('✅ [AUDIO LOG] Prueba de alarma completada:', result);
    return {
      success: true,
      message: 'Sonido de alarma reproducido correctamente',
      method: result.method,
      soundKey: result.soundKey
    };
    
  } catch (error) {
    console.error('❌ [AUDIO LOG] Error en prueba de alarma:', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message,
      suggestion: 'Verifica que el dispositivo no esté en modo silencioso y que los permisos de audio estén habilitados'
    };
  }
};

// Nueva función para diagnosticar problemas de audio específicos
export const debugAudioIssue = async () => {
  console.log('🔍 [AUDIO LOG] === DIAGNÓSTICO COMPLETO DE AUDIO ===');
  
  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    environment: {
      isExpoGo,
      platform: Platform.OS,
      isDev: __DEV__,
      isDevice: Device.isDevice
    },
    tests: []
  };
  
  // Test 1: Verificar entorno
  console.log('🔍 [AUDIO LOG] Test 1: Verificando entorno de ejecución...');
  diagnosticResults.tests.push({
    name: 'Entorno',
    status: 'info',
    data: diagnosticResults.environment
  });
  
  // Test 2: Verificar inicialización
  console.log('🔍 [AUDIO LOG] Test 2: Verificando inicialización de audio...');
  try {
    const initialized = await initializeAudio();
    diagnosticResults.tests.push({
      name: 'Inicialización',
      status: initialized ? 'success' : 'error',
      data: { initialized }
    });
  } catch (error) {
    diagnosticResults.tests.push({
      name: 'Inicialización',
      status: 'error',
      error: error.message
    });
  }
  
  // Test 3: Crear y probar reproductor
  console.log('🔍 [AUDIO LOG] Test 3: Creando reproductor de audio...');
  try {
    const testSound = createAudioPlayer(defaultSound);
    const soundInfo = {
      hasPlay: typeof testSound.play === 'function',
      // Solo expo-audio métodos
      volume: testSound.volume,
      availableMethods: Object.keys(testSound).filter(key => typeof testSound[key] === 'function')
    };
    
    diagnosticResults.tests.push({
      name: 'Creación de Reproductor',
      status: 'success',
      data: soundInfo
    });
    
    // Test 4: Intentar reproducir
    console.log('🔍 [AUDIO LOG] Test 4: Intentando reproducir sonido...');
    let playSuccess = false;
    let playMethod = null;
    let playError = null;
    
    try {
      if (testSound.play && typeof testSound.play === 'function') {
        console.log('🔍 [AUDIO LOG] Probando método play()...');
        const result = testSound.play();
        playMethod = 'play';
        playSuccess = true;
        
        if (result && typeof result.then === 'function') {
          await result;
        }
      } else {
        // Solo expo-audio soportado
        console.log('🔍 [AUDIO LOG] Solo métodos de expo-audio soportados');
        playError = 'Solo métodos de expo-audio disponibles';
      }
    } catch (error) {
      playError = error.message;
    }
    
    diagnosticResults.tests.push({
      name: 'Reproducción',
      status: playSuccess ? 'success' : 'error',
      data: {
        method: playMethod,
        success: playSuccess,
        error: playError
      }
    });
    
    // Test 5: Verificar estado después de reproducir
    setTimeout(() => {
      console.log('🔍 [AUDIO LOG] Test 5: Verificando estado después de reproducir...');
      const finalState = {
        isPlaying: testSound.isPlaying,
        volume: testSound.volume,
        position: testSound.position || 'N/A',
        duration: testSound.duration || 'N/A'
      };
      
      console.log('🔍 [AUDIO LOG] Estado final del sonido:', finalState);
      
      if (!testSound.isPlaying) {
        console.warn('⚠️ [AUDIO LOG] PROBLEMA DETECTADO: El sonido no está reproduciéndose');
        console.log('🔍 [AUDIO LOG] Posibles causas:');
        console.log('  - El dispositivo está en modo silencioso');
        console.log('  - El volumen del sistema está en 0');
        console.log('  - Hay un problema con la configuración de audio');
        console.log('  - El archivo de audio no es compatible');
      }
    }, 1000);
    
  } catch (error) {
    diagnosticResults.tests.push({
      name: 'Creación de Reproductor',
      status: 'error',
      error: error.message
    });
  }
  
  console.log('🔍 [AUDIO LOG] === RESUMEN DEL DIAGNÓSTICO ===');
  console.log('🔍 [AUDIO LOG] Resultados:', diagnosticResults);
  
  return diagnosticResults;
}

// Función de diagnóstico específica para Expo Go
export const diagnoseExpoGoAudio = async () => {
  console.log('🔍 [AUDIO LOG] === DIAGNÓSTICO DE AUDIO EXPO GO ===');
  console.log('🔍 [AUDIO LOG] Entorno:', {
    isExpoGo,
    platform: Platform.OS,
    isDev: __DEV__,
    isDevice: Device.isDevice
  });
  
  try {
    // Test 1: Verificar inicialización
    console.log('🔍 [AUDIO LOG] Test 1: Verificando inicialización de audio...');
    const initialized = await initializeAudio();
    console.log('🔍 [AUDIO LOG] Resultado inicialización:', initialized);
    
    // Test 2: Verificar volumen del sistema
    console.log('🔍 [AUDIO LOG] Test 2: Verificando volumen del sistema...');
    const volumeOk = await checkSystemVolume();
    console.log('🔍 [AUDIO LOG] Resultado volumen:', volumeOk);
    
    // Test 3: Crear reproductor de audio
    console.log('🔍 [AUDIO LOG] Test 3: Creando reproductor de audio...');
    const testSound = createAudioPlayer(defaultSound);
    console.log('🔍 [AUDIO LOG] Reproductor creado:', {
      hasPlay: typeof testSound.play === 'function',
      // Solo expo-audio soportado
      volume: testSound.volume,
      methods: Object.keys(testSound).filter(key => typeof testSound[key] === 'function')
    });
    
    // Test 4: Validar estado del sonido
    console.log('🔍 [AUDIO LOG] Test 4: Validando estado del sonido...');
    const validation = validateSoundState(testSound, 'test');
    console.log('🔍 [AUDIO LOG] Validación:', validation);
    
    // Test 5: Intentar reproducir con manejo detallado de errores
    console.log('🔍 [AUDIO LOG] Test 5: Intentando reproducir sonido de prueba...');
    let playResult = null;
    let playError = null;
    
    try {
      if (testSound.play && typeof testSound.play === 'function') {
        console.log('🔍 [AUDIO LOG] Usando método play() de expo-audio');
        playResult = testSound.play();
        console.log('🔍 [AUDIO LOG] Resultado de play():', playResult);
        
        // Si play() devuelve una promesa, esperarla
        if (playResult && typeof playResult.then === 'function') {
          console.log('🔍 [AUDIO LOG] play() devolvió promesa, esperando...');
          await playResult;
          console.log('🔍 [AUDIO LOG] Promesa de play() resuelta');
        }
      } else {
        // Solo expo-audio soportado
        console.log('🔍 [AUDIO LOG] Solo métodos de expo-audio soportados');
        playError = 'Solo métodos de expo-audio disponibles';
      }
    } catch (error) {
      console.error('❌ [AUDIO LOG] Error durante la reproducción:', {
        error: error.message,
        stack: error.stack
      });
      playError = error.message;
    }
    
    // Test 6: Verificar estado después de reproducir
    setTimeout(() => {
      console.log('🔍 [AUDIO LOG] Test 6: Estado después de reproducir:', {
        isPlaying: testSound.isPlaying,
        volume: testSound.volume,
        position: testSound.position || 'N/A',
        duration: testSound.duration || 'N/A'
      });
      
      // Verificar si el sonido está realmente reproduciéndose
      if (testSound.isPlaying === false || testSound.isPlaying === undefined) {
        console.warn('⚠️ [AUDIO LOG] El sonido no parece estar reproduciéndose');
        console.log('🔍 [AUDIO LOG] Propiedades del sonido:', Object.keys(testSound));
      }
    }, 500);
    
    console.log('✅ [AUDIO LOG] Diagnóstico completado');
    return {
      success: true,
      initialized,
      volumeOk,
      soundCreated: !!testSound,
      validation,
      playResult,
      playError,
      environment: {
        isExpoGo,
        platform: Platform.OS,
        isDev: __DEV__,
        isDevice: Device.isDevice
      }
    };
    
  } catch (error) {
    console.error('❌ [AUDIO LOG] Error en diagnóstico:', {
      error: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message,
      environment: {
        isExpoGo,
        platform: Platform.OS,
        isDev: __DEV__,
        isDevice: Device.isDevice
      }
    };
  }
}

// Función mejorada para liberar sonidos
export const unloadSounds = async () => {
  // Limpiar cache
  for (const [key, cached] of soundCache.entries()) {
    try {
      if (cached.sound.unloadAsync) {
        await cached.sound.unloadAsync();
      }
    } catch (e) {
      console.error(`Error liberando ${key}:`, e);
    }
  }
  soundCache.clear();
  
  // Limpiar sonidos precargados
  for (const [key, sound] of Object.entries(preloadedSounds)) {
    try {
      if (sound.unloadAsync) {
        await sound.unloadAsync();
      }
    } catch (e) {
      console.error(`Error liberando ${key}:`, e);
    }
  }
  Object.keys(preloadedSounds).forEach(key => delete preloadedSounds[key]);
  
  // Limpiar objetos de sonido
  for (const sound of Object.values(soundObjects)) {
    if (sound) {
      try {
        if (sound.unloadAsync) {
          await sound.unloadAsync();
        }
      } catch (e) {
        console.error('Error liberando sonido:', e);
      }
    }
  }
  
  isAudioInitialized = false;
  console.log('🧹 Todos los sonidos descargados');
};

// Auto-inicialización para mejor rendimiento
 (async () => {
   try {
     await initializeAudio();
     // Precargar sonidos en background sin bloquear
     preloadSounds().catch(e => console.warn('Precarga en background falló:', e));
     
     // Validación periódica de sonidos cada 3 minutos
     setInterval(async () => {
       try {
         const results = await validatePreloadedSounds();
         if (results.invalid.length > 0) {
           console.log('🔄 Recargando sonidos inválidos...');
           await preloadSounds();
         }
       } catch (e) {
         console.warn('⚠️ Error en validación periódica:', e);
       }
     }, 3 * 60 * 1000);
     
   } catch (e) {
     console.warn('Auto-inicialización falló:', e);
   }
 })();
