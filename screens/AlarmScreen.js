import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { playSoundPreview, stopCurrentSound } from '../utils/audioUtils';
import { registrarToma, actualizarEstadoToma, formatearDatosParaRegistro, manejarErrorAPI, obtenerRegistroId } from '../utils/medicationLogAPI';
import { useUser } from '../UserContextProvider';
import { diagnoseNetworkIssues } from '../utils/networkDiagnostic';
// Notificaciones removidas - solo pantalla directa

const { width, height } = Dimensions.get('window');

const AlarmScreen = ({ route, navigation }) => {
  const { notificationData } = route.params || {};
  const { user } = useUser();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos

  useEffect(() => {
    // Prevenir que el usuario regrese con el botón de atrás
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Bloquear el botón de atrás
    });

    // Iniciar la animación de pulso
    startPulseAnimation();

    // Reproducir sonido de alarma
    if (notificationData?.sound) {
      playSoundPreview(notificationData.sound);
    } else {
      playSoundPreview('alarm');
    }

    // Iniciar contador regresivo
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-posponer después de 5 minutos
          handleSnooze();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      backHandler.remove();
      clearInterval(timer);
      stopCurrentSound(); // No await en cleanup function
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleTaken = async () => {
    try {
      await stopCurrentSound();
      setIsPlaying(false);
      
      // Debug: Verificar qué datos tenemos
      console.log('🔍 DEBUG - notificationData completo:', JSON.stringify(notificationData, null, 2));
      console.log('🔍 DEBUG - registro_id disponible:', notificationData?.registro_id);
      
      let registroId = notificationData?.registro_id;
      
      // Si no tenemos registro_id, intentar obtenerlo del endpoint
      if (!registroId && notificationData?.programacionId && notificationData?.usuario_id) {
        console.log('🔄 registro_id no disponible, obteniendo desde endpoint...');
        console.log(`🔍 Obteniendo registro_id para programacion_id: ${notificationData.programacionId} usuario_id: ${notificationData.usuario_id}`);
        
        try {
          registroId = await obtenerRegistroId(notificationData.programacionId, notificationData.usuario_id);
          console.log('✅ registro_id obtenido:', registroId);
        } catch (error) {
          console.error('❌ Error obteniendo registro_id:', error);
          
          // Ejecutar diagnóstico de red cuando falla
          console.log('🔍 Ejecutando diagnóstico de red...');
          try {
            const diagnostico = await diagnoseNetworkIssues();
            console.log('📊 Resultado del diagnóstico:', diagnostico);
            
            if (diagnostico.success) {
              Alert.alert(
                'Error de Conectividad', 
                `No se pudo conectar al servidor. URL detectada: ${diagnostico.workingUrl}\n\nRecomendación: ${diagnostico.recommendation}`
              );
            } else {
              Alert.alert(
                'Error de Conectividad', 
                `No se puede conectar al servidor.\n\nRecomendación: ${diagnostico.recommendation}`
              );
            }
          } catch (diagError) {
            console.error('❌ Error en diagnóstico:', diagError);
            Alert.alert('Error', 'No se puede actualizar el registro: problema de conectividad con el servidor');
          }
          
          return;
        }
      }
      
      if (!registroId) {
        console.error('❌ ERROR: No se encontró registro_id');
        Alert.alert('Error', 'No se puede actualizar el registro: falta el ID del registro');
        return;
      }
      
      // Actualizar el estado del registro existente
      const updateData = {
        registro_id: registroId,
        nuevo_estado: 'tomada',
        observaciones: 'Medicamento tomado desde la pantalla de alarma'
      };
      
      console.log('📝 Actualizando estado de toma en la base de datos:', updateData);
      
      const resultado = await actualizarEstadoToma(updateData);
      
      console.log('✅ Medicamento registrado exitosamente:', resultado);
      
      Alert.alert(
        '✅ Medicamento tomado',
        '¡Excelente! Has marcado tu medicamento como tomado y se ha registrado correctamente.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error al marcar como tomado:', error);
      const mensajeError = manejarErrorAPI(error);
      Alert.alert('Error', `No se pudo registrar la toma del medicamento: ${mensajeError}`);
    }
  };

  const handleSnooze = async () => {
    try {
      await handleAlarmAction('pospuesta', 'Medicamento pospuesto desde la pantalla de alarma');
      
      Alert.alert(
        'Recordatorio pospuesto',
        'Alarma pospuesta y registrada. La pantalla se cerrará.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error al posponer:', error);
      // Aún así cerrar la pantalla
      Alert.alert(
        'Recordatorio pospuesto',
        'Alarma pospuesta. La pantalla se cerrará.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Omitir medicamento',
      '¿Estás seguro de que quieres omitir esta dosis?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Omitir',
          style: 'destructive',
          onPress: async () => {
            try {
              await handleAlarmAction('rechazada', 'Medicamento omitido desde la pantalla de alarma');
              navigation.goBack();
            } catch (error) {
              console.error('Error al registrar omitir:', error);
              const mensajeError = manejarErrorAPI(error);
              Alert.alert(
                'Error',
                `Medicamento omitido pero no se pudo registrar: ${mensajeError}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para obtener registro_id desde el endpoint
  const obtenerRegistroId = async (programacionId, usuarioId) => {
    try {
      console.log('🔍 Obteniendo registro_id para programación:', programacionId, 'usuario:', usuarioId);
      
      // Importar la función para obtener la URL base de la API
      const { testConnectivity } = await import('../config');
      const connectivityResult = await testConnectivity();
      
      if (!connectivityResult.success) {
        throw new Error('No se pudo establecer conexión con el servidor');
      }
      
      const apiBaseUrl = connectivityResult.workingUrl + 'smart_pill_api';
      const url = `${apiBaseUrl}/obtener_registro_pendiente.php`;
      
      console.log('📡 URL del endpoint:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programacion_id: programacionId,
          usuario_id: usuarioId
        })
      });
      
      const data = await response.json();
      
      console.log('📡 Respuesta del endpoint obtener_registro_pendiente:', data);
      
      if (data.success && data.registro_id) {
        return data.registro_id;
      } else {
        throw new Error(data.error || data.message || 'No se encontró registro pendiente');
      }
    } catch (error) {
      console.error('❌ Error al obtener registro_id:', error);
      throw error;
    }
  };

  // Función unificada para manejar acciones de alarma
  const handleAlarmAction = async (action, observaciones) => {
    try {
      await stopCurrentSound();
      setIsPlaying(false);
      
      // Debug: Verificar qué datos tenemos
      console.log('🔍 DEBUG - notificationData completo:', JSON.stringify(notificationData, null, 2));
      console.log('🔍 DEBUG - registro_id disponible:', notificationData?.registro_id);
      
      let registroId = notificationData?.registro_id;
      
      // Si no tenemos registro_id, intentar obtenerlo del endpoint
      if (!registroId && notificationData?.programacionId && notificationData?.usuario_id) {
        console.log('🔄 registro_id no disponible, obteniendo desde endpoint...');
        try {
          registroId = await obtenerRegistroId(notificationData.programacionId, notificationData.usuario_id);
          console.log('✅ registro_id obtenido:', registroId);
        } catch (error) {
          console.error('❌ Error obteniendo registro_id:', error);
          Alert.alert('Error', 'No se puede actualizar el registro: no se pudo obtener el ID del registro');
          return;
        }
      }
      
      if (!registroId) {
        console.error('❌ ERROR: No se encontró registro_id');
        Alert.alert('Error', 'No se puede actualizar el registro: falta el ID del registro');
        return;
      }
      
      // Actualizar el estado del registro existente
      const updateData = {
        registro_id: registroId,
        nuevo_estado: action,
        observaciones: observaciones
      };
      
      console.log('📝 Actualizando estado de toma en la base de datos:', updateData);
      
      const resultado = await actualizarEstadoToma(updateData);
      
      console.log('✅ Acción registrada exitosamente:', resultado);
      
      return resultado;
    } catch (error) {
      console.error('Error en handleAlarmAction:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7A2C34" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.timeText}>
          {new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text style={styles.timerText}>
          Auto-posponer en: {formatTime(timeLeft)}
        </Text>
      </View>

      {/* Alarm Icon */}
      <View style={styles.alarmContainer}>
        <Animated.View
          style={[
            styles.alarmIconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <MaterialIcons name="alarm" size={120} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Medication Info */}
      <View style={styles.medicationInfo}>
        <Text style={styles.title}>¡Es hora de tu medicamento!</Text>
        <Text style={styles.medicationName}>
          {notificationData?.medicamento || 'Medicamento'}
        </Text>
        <Text style={styles.dosage}>
          Dosis: {notificationData?.dosis || '1 pastilla'}
        </Text>
        <Text style={styles.time}>
          Hora programada: {notificationData?.hora || '--:--'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.takenButton} onPress={handleTaken}>
          <MaterialIcons name="check-circle" size={30} color="#FFFFFF" />
          <Text style={styles.buttonText}>Ya lo tomé</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
          <MaterialIcons name="snooze" size={30} color="#FFFFFF" />
          <Text style={styles.buttonText}>Posponer 10 min</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <MaterialIcons name="close" size={30} color="#FFFFFF" />
          <Text style={styles.buttonText}>Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7A2C34',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  alarmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmIconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  medicationInfo: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  medicationName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  dosage: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
    opacity: 0.9,
  },
  time: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 30,
    gap: 15,
  },
  takenButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 10,
  },
  snoozeButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 10,
  },
  skipButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AlarmScreen;