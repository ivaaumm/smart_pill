import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  playSoundPreview, 
  stopCurrentSound, 
  diagnoseAudioSystem, 
  testAudioPlayback,
  testAlarmSound,
  checkSystemVolume,
  preloadSounds,
  diagnoseExpoGoAudio
} from '../utils/audioUtils';

const SOUNDS = [
  { name: 'Default', key: 'default' },
  { name: 'Alarm', key: 'alarm' },
  { name: 'Tone', key: 'tone' },
];

export default function SoundTest() {
  const [status, setStatus] = useState('Listo para probar sonidos');
  const [currentSound, setCurrentSound] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Inicializar el sistema de audio
    const initializeSystem = async () => {
      try {
        setStatus('Inicializando sistema de audio...');
        await checkSystemVolume();
        await preloadSounds();
        setStatus('Sistema de audio listo');
      } catch (error) {
        console.error('Error inicializando sistema:', error);
        setStatus(`Error de inicialización: ${error.message}`);
      }
    };

    initializeSystem();

    // Limpiar al desmontar
    return () => {
      stopCurrentSound().catch(console.error);
    };
  }, []);

  const playSound = async (soundName, soundKey) => {
    try {
      setIsLoading(true);
      setStatus(`Reproduciendo ${soundName}...`);
      
      await playSoundPreview(soundKey);
      setCurrentSound(soundName);
      setStatus(`✅ ${soundName} reproducido correctamente`);
      
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSound = async () => {
    try {
      setIsLoading(true);
      await stopCurrentSound();
      setCurrentSound(null);
      setStatus('🔇 Sonido detenido');
    } catch (error) {
      console.error('Error deteniendo sonido:', error);
      setStatus(`❌ Error deteniendo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnosis = async () => {
    try {
      setIsLoading(true);
      setStatus('🔍 Ejecutando diagnóstico...');
      
      const result = await diagnoseAudioSystem();
      setDiagnosis(result);
      setStatus('📊 Diagnóstico completado');
      
      // Mostrar recomendaciones si las hay
      if (result.recommendations.length > 0) {
        Alert.alert(
          'Recomendaciones del Sistema',
          result.recommendations.join('\n\n'),
          [{ text: 'Entendido' }]
        );
      }
      
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setStatus(`❌ Error en diagnóstico: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAudioTest = async () => {
    setIsLoading(true);
    setStatus('Ejecutando prueba de audio...');
    
    try {
      const result = await testAudioPlayback('default');
      if (result.success) {
        setStatus('✅ Prueba de audio completada exitosamente');
      } else {
        setStatus(`❌ Error en prueba: ${result.message}`);
      }
    } catch (error) {
      setStatus(`❌ Error ejecutando prueba: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runAlarmTest = async () => {
    setIsLoading(true);
    setStatus('🚨 Probando sonido de alarma...');
    
    try {
      const result = await testAlarmSound();
      if (result.success) {
        setStatus(`🚨 ✅ Prueba exitosa (${result.environment})`);
        Alert.alert(
          'Prueba de Alarma Exitosa',
          `${result.message}\n\nMétodo: ${result.method}\nEntorno: ${result.environment}`,
          [{ text: 'Entendido' }]
        );
      } else {
        setStatus(`🚨 ❌ Error en ${result.environment}`);
        Alert.alert(
          'Prueba de Alarma Fallida',
          `${result.error}\n\nEntorno: ${result.environment}`,
          [
            { text: 'Ver Recomendaciones', onPress: () => {
              Alert.alert(
                'Recomendaciones para ' + result.environment,
                result.recommendations?.join('\n\n') || 'No hay recomendaciones disponibles'
              );
            }},
            { text: 'Entendido' }
          ]
        );
      }
    } catch (error) {
      setStatus(`🚨 ❌ Error probando alarma: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runExpoGoDiagnosis = async () => {
    setIsLoading(true);
    setStatus('🔍 Ejecutando diagnóstico completo...');
    
    try {
      const results = await diagnoseExpoGoAudio();
      
      const successTests = results.tests.filter(test => test.status === 'success').length;
      const totalTests = results.tests.length;
      
      setStatus(`📊 Diagnóstico: ${successTests}/${totalTests} pruebas exitosas`);
      
      const diagnosticMessage = results.tests.map(test => 
        `${test.status === 'success' ? '✅' : '❌'} ${test.name}: ${test.message}`
      ).join('\n\n');
      
      Alert.alert(
        `Diagnóstico de Audio - ${results.environment}`,
        `Entorno: ${results.environment}\nÉxito: ${successTests}/${totalTests}\n\n${diagnosticMessage}`,
        [{ text: 'Entendido' }]
      );
    } catch (error) {
      setStatus('❌ Error en diagnóstico');
      Alert.alert('Error', `Error ejecutando diagnóstico: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diagnóstico de Audio</Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      {/* Botones de diagnóstico */}
      <View style={styles.diagnosticSection}>
        <Text style={styles.sectionTitle}>🔧 Herramientas de Diagnóstico</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.diagnosticButton]}
          onPress={runDiagnosis}
          disabled={isLoading}
        >
          <MaterialIcons name="search" size={24} color="#fff" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            Ejecutar Diagnóstico
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={runAudioTest}
          disabled={isLoading}
        >
          <MaterialIcons name="volume-up" size={24} color="#fff" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            Prueba de Audio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.alarmButton]}
          onPress={runAlarmTest}
          disabled={isLoading}
        >
          <MaterialIcons name="alarm" size={24} color="#fff" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            Prueba de Alarma
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.expoGoButton]}
          onPress={runExpoGoDiagnosis}
          disabled={isLoading}
        >
          <MaterialIcons name="bug-report" size={24} color="#fff" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            Diagnóstico Expo Go
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botones de sonidos */}
      <View style={styles.soundsSection}>
        <Text style={styles.sectionTitle}>🔊 Probar Sonidos</Text>
        
        {SOUNDS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.button,
              currentSound === item.name && styles.buttonActive
            ]}
            onPress={() => playSound(item.name, item.key)}
            disabled={isLoading}
          >
            <MaterialIcons 
              name="play-arrow" 
              size={24} 
              color={currentSound === item.name ? '#fff' : '#7A2C34'} 
              style={styles.icon}
            />
            <Text 
              style={[
                styles.buttonText,
                currentSound === item.name && { color: '#fff' }
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={stopSound}
          disabled={isLoading || !currentSound}
        >
          <MaterialIcons name="stop" size={24} color="#fff" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            Detener Sonido
          </Text>
        </TouchableOpacity>
      </View>

      {/* Información de diagnóstico */}
      {diagnosis && (
        <View style={styles.diagnosisSection}>
          <Text style={styles.sectionTitle}>📊 Resultado del Diagnóstico</Text>
          <View style={styles.diagnosisBox}>
            <Text style={styles.diagnosisText}>Audio Inicializado: {diagnosis.audioInitialized ? '✅' : '❌'}</Text>
            <Text style={styles.diagnosisText}>Sonidos Precargados: {diagnosis.preloadedSounds}</Text>
            <Text style={styles.diagnosisText}>Sonidos en Cache: {diagnosis.cachedSounds}</Text>
            <Text style={styles.diagnosisText}>Sonido Actual: {diagnosis.currentSound}</Text>
            <Text style={styles.diagnosisText}>Volumen del Sistema: {diagnosis.systemVolume}</Text>
          </View>
        </View>
      )}

      <View style={styles.infoBox}>
        <MaterialIcons name="info" size={24} color="#7A2C34" />
        <Text style={styles.infoText}>
          Si no escuchas los sonidos:\n\n
          • Ejecuta el diagnóstico primero\n
          • Verifica el volumen del dispositivo\n
          • Desactiva el modo silencioso\n
          • Revisa si hay auriculares conectados
        </Text>
      </View>
    </ScrollView>
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
  diagnosticSection: {
    marginBottom: 30,
  },
  soundsSection: {
    marginBottom: 30,
  },
  diagnosisSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7A2C34',
    marginBottom: 15,
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
  diagnosticButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  alarmButton: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  expoGoButton: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  diagnosisBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  diagnosisText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
  },
});
