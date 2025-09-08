import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';

// Importar sonidos directamente
const defaultSound = require('../assets/sounds/default.mp3');
const alarmSound = require('../assets/sounds/alarm.mp3');
const toneSound = require('../assets/sounds/tone.mp3');

const SOUNDS = [
  { name: 'Default', file: defaultSound },
  { name: 'Alarm', file: alarmSound },
  { name: 'Tone', file: toneSound },
];

export default function SoundTest() {
  const [sound, setSound] = useState(null);
  const [status, setStatus] = useState('Listo para probar sonidos');
  const [currentSound, setCurrentSound] = useState(null);

  useEffect(() => {
    // Configurar el modo de audio al montar
    const setupAudio = async () => {
      try {
        // Configuración mínima necesaria
        const audioConfig = {
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        };

        // Solo configurar los modos de interrupción si están disponibles
        if (Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS) {
          audioConfig.interruptionModeAndroid = Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS;
        }
        
        if (Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX) {
          audioConfig.interruptionModeIOS = Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
        }

        await Audio.setAudioModeAsync(audioConfig);
      } catch (error) {
        console.error('Error al configurar el audio:', error);
        setStatus(`Error de configuración: ${error.message}`);
      }
    };

    setupAudio();

    // Limpiar al desmontar
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, []);

  const playSound = async (soundFile, soundName) => {
    try {
      setStatus(`Cargando sonido: ${soundName}...`);
      
      // Detener el sonido actual si hay uno reproduciéndose
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (e) {
          console.warn('Error al detener el sonido anterior:', e);
        }
      }

      // Configuración de audio simple
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Cargar el nuevo sonido
      const { sound: soundObject } = await Audio.Sound.createAsync(
        soundFile,
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
          shouldDuckAndroid: true,
        },
        (playbackStatus) => {
          if (playbackStatus.didJustFinish) {
            setStatus(`${soundName} finalizado`);
          }
        }
      );

      setSound(soundObject);
      setCurrentSound(soundName);
      setStatus(`Reproduciendo: ${soundName}...`);
      
      // Reproducir el sonido
      await soundObject.playAsync();
      
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Probador de Sonidos</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        {SOUNDS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.button,
              currentSound === item.name && styles.buttonActive
            ]}
            onPress={() => playSound(item.file, item.name)}
          >
            <MaterialIcons 
              name="volume-up" 
              size={24} 
              color={currentSound === item.name ? '#fff' : '#7A2C34'} 
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Reproducir {item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.infoBox}>
        <MaterialIcons name="info" size={24} color="#7A2C34" />
        <Text style={styles.infoText}>
          Si no escuchas los sonidos, verifica que el volumen esté activado y que el dispositivo no esté en modo silencioso.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7A2C34',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonsContainer: {
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonActive: {
    backgroundColor: '#7A2C34',
    borderColor: '#7A2C34',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#555',
    fontSize: 14,
  },
});
