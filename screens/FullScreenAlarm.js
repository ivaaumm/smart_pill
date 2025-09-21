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
  AppState,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { playSoundPreview, stopCurrentSound } from '../utils/audioUtils';
import { registrarToma, actualizarEstadoToma, formatearDatosParaRegistro, manejarErrorAPI, obtenerRegistroId } from '../utils/medicationLogAPI';
import { scheduleSnoozeNotification } from '../utils/audioUtils';
import { useUser } from '../UserContextProvider';
// Notificaciones removidas - solo pantalla directa

const { width, height } = Dimensions.get('window');

const FullScreenAlarm = ({ route, navigation }) => {
  const { notificationData } = route.params || {};
  const { user } = useUser();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMedicationDetails, setShowMedicationDetails] = useState(false);

  useEffect(() => {
    // Forzar que la app esté en primer plano
    StatusBar.setHidden(false);
    StatusBar.setBarStyle('light-content');
    StatusBar.setBackgroundColor('#7A2C34', true);

    // Prevenir que el usuario regrese con el botón de atrás
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Bloquear el botón de atrás
    });

    // Iniciar animaciones
    startPulseAnimation();
    startGlowAnimation();

    // Reproducir sonido de alarma personalizado
    const soundToPlay = notificationData?.sound && notificationData.sound !== 'default' 
      ? notificationData.sound 
      : 'alarm';
    
    console.log('🔊 Reproduciendo sonido de alarma:', soundToPlay);
    playSoundPreview(soundToPlay);

    // Actualizar hora actual cada segundo
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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

    // Manejar cambios de estado de la app
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Si la app va al fondo, intentar traerla de vuelta
        console.log('App fue enviada al fondo, intentando traer de vuelta');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      backHandler.remove();
      clearInterval(timer);
      clearInterval(timeInterval);
      subscription?.remove();
      stopCurrentSound(); // No await en cleanup function
      StatusBar.setHidden(false);
      StatusBar.setBarStyle('default');
      StatusBar.setBackgroundColor('#FFFFFF', true);
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Nueva función para obtener registro_id cuando no esté disponible
  const obtenerRegistroId = async (programacionId, usuarioId) => {
    try {
      console.log('🔍 Obteniendo registro_id para programacion_id:', programacionId, 'usuario_id:', usuarioId);
      
      const response = await fetch('http://localhost/smart_pill/obtener_registro_pendiente.php', {
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
      
      if (data.success && data.registro_id) {
        console.log('✅ registro_id obtenido exitosamente:', data.registro_id);
        return data.registro_id;
      } else {
        console.error('❌ No se pudo obtener registro_id:', data.message);
        throw new Error(data.message || 'No se encontró registro pendiente');
      }
    } catch (error) {
      console.error('❌ Error al obtener registro_id:', error);
      throw error;
    }
  };

  // Función auxiliar para manejar acciones de alarma con registro_id
  const handleAlarmAction = async (action, observaciones) => {
    try {
      await stopCurrentSound();
      setIsPlaying(false);
      
      // Debug: Verificar qué datos tenemos
      console.log('🔍 DEBUG - notificationData completo:', JSON.stringify(notificationData, null, 2));
      console.log('🔍 DEBUG - registro_id disponible:', notificationData?.registro_id);
      
      let registroId = notificationData?.registro_id;
      
      // Si no tenemos registro_id, intentar obtenerlo usando programacionId
      if (!registroId && notificationData?.programacionId && notificationData?.usuario_id) {
        console.log('🔄 registro_id no disponible, obteniendo desde el servidor...');
        try {
          registroId = await obtenerRegistroId(notificationData.programacionId, notificationData.usuario_id);
          console.log('✅ registro_id obtenido:', registroId);
        } catch (error) {
          console.error('❌ Error al obtener registro_id:', error);
          Alert.alert(
            'Error', 
            `No se puede ${action} el medicamento: ${error.message}. Por favor, registra manualmente desde la pantalla principal.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
      }
      
      if (!registroId) {
        console.error('❌ ERROR: No se encontró registro_id después de todos los intentos');
        Alert.alert(
          'Error', 
          'No se puede actualizar el registro: falta información necesaria. Por favor, registra manualmente desde la pantalla principal.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // Actualizar el estado del registro
      const updateData = {
        registro_id: registroId,
        nuevo_estado: action,
        observaciones: observaciones
      };
      
      console.log(`📝 Actualizando estado de ${action} en la base de datos:`, updateData);
      
      const resultado = await actualizarEstadoToma(updateData);
      
      console.log(`✅ ${action} registrado exitosamente:`, resultado);
      
      return resultado;
    } catch (error) {
      console.error(`Error al registrar ${action}:`, error);
      const mensajeError = manejarErrorAPI(error);
      throw new Error(mensajeError);
    }
  };

  const handleTaken = async () => {
    try {
      await handleAlarmAction('tomada', 'Medicamento tomado desde la pantalla de alarma');
      
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
      Alert.alert('Error', `No se pudo registrar la toma del medicamento: ${error.message}`);
    }
  };

  const handleSnooze = async () => {
    try {
      await handleAlarmAction('pospuesta', 'Medicamento pospuesto desde la pantalla de alarma');
      
      // Programar nueva notificación para 10 minutos después
      try {
        await scheduleSnoozeNotification(notificationData);
        console.log('✅ Nueva alarma programada para 10 minutos después');
      } catch (snoozeError) {
        console.error('❌ Error al programar alarma pospuesta:', snoozeError);
      }
      
      Alert.alert(
        '⏰ Recordatorio pospuesto',
        'Alarma pospuesta y registrada correctamente. Una nueva alarma sonará en 10 minutos.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        '⏰ Recordatorio pospuesto',
        `Alarma pospuesta pero no se pudo registrar: ${error.message}. La pantalla se cerrará.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleSkip = async () => {
    await stopCurrentSound();
    setIsPlaying(false);
    
    Alert.alert(
      '⚠️ Omitir medicamento',
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
              Alert.alert(
                'Error',
                `Medicamento omitido pero no se pudo registrar: ${error.message}`,
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

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLongPressMedication = () => {
    setShowMedicationDetails(true);
  };

  const closeMedicationDetails = () => {
    setShowMedicationDetails(false);
  };



  return (
    <LinearGradient
      colors={['#7A2C34', '#A67C8E', '#BFA5A9']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header con hora actual */}
      <View style={styles.header}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <View style={styles.timerContainer}>
          <Ionicons name="timer-outline" size={20} color="rgba(255,255,255,0.9)" />
          <Text style={styles.timerText}>
            Auto-posponer en {formatTimer(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Contenedor principal de la alarma */}
      <View style={styles.alarmContainer}>
        <Animated.View
          style={[
            styles.alarmIconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.pillIconContainer}>
            <Ionicons name="medical" size={50} color="#7A2C34" />
          </View>
        </Animated.View>
      </View>

      {/* Información del medicamento */}
      <View style={styles.medicationInfo}>
        <TouchableOpacity 
          style={styles.medicationCard}
          onLongPress={handleLongPressMedication}
          delayLongPress={800}
          activeOpacity={0.8}
        >
          <Text style={styles.title}>Hora de tu medicamento</Text>
          <Text style={styles.medicationName}>
            {notificationData?.medicamento || 'Medicamento'}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="medical-outline" size={18} color="#7A2C34" />
            <Text style={styles.dosage}>
              {notificationData?.dosis || '1 tableta'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#7A2C34" />
            <Text style={styles.time}>
              {notificationData?.hora || formatTime(currentTime)}
            </Text>
          </View>
          <Text style={styles.longPressHint}>Mantén presionado para más información</Text>
        </TouchableOpacity>
      </View>

      {/* Botones de acción */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.takenButton} onPress={handleTaken}>
          <LinearGradient
            colors={['#7A2C34', '#A67C8E']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>YA LO TOMÉ</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
          <LinearGradient
            colors={['#BFA5A9', '#E0C3C9']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="alarm-outline" size={24} color="#7A2C34" />
            <Text style={[styles.buttonText, {color: '#7A2C34'}]}>POSPONER 10 MIN</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <LinearGradient
            colors={['#F5F5F5', '#E0C3C9']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="close-circle" size={24} color="#7A2C34" />
            <Text style={[styles.buttonText, {color: '#7A2C34'}]}>OMITIR</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal de información detallada */}
      <Modal
        visible={showMedicationDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMedicationDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Información del Medicamento</Text>
                <TouchableOpacity 
                  onPress={closeMedicationDetails}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#7A2C34" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Medicamento:</Text>
                <Text style={styles.detailValue}>
                  {notificationData?.medicamento || 'No especificado'}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Dosis:</Text>
                <Text style={styles.detailValue}>
                  {notificationData?.dosis || 'No especificado'}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Hora programada:</Text>
                <Text style={styles.detailValue}>
                  {notificationData?.hora || formatTime(currentTime)}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Frecuencia:</Text>
                <Text style={styles.detailValue}>
                  {notificationData?.frecuencia || 'No especificado'}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Duración del tratamiento:</Text>
                <Text style={styles.detailValue}>
                  {notificationData?.duracion || 'No especificado'}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Instrucciones:</Text>
                <Text style={styles.detailValue}>
                  {notificationData?.instrucciones || 'Tomar según indicación médica'}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Notas adicionales:</Text>
                <Text style={styles.detailValue}>
                  {notificationData?.notas || 'Ninguna'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: StatusBar.currentHeight + 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 5,
    width: '100%',
    paddingHorizontal: 20,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '200',
    color: '#FFFFFF',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    letterSpacing: 2,
    fontFamily: 'System',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  timerText: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.98)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  alarmContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  alarmIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  pillIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7A2C34',
    shadowColor: '#7A2C34',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  medicationInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    width: '100%',
  },
  medicationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    backdropFilter: 'blur(15px)',
    borderWidth: 1,
    borderColor: 'rgba(122, 44, 52, 0.2)',
    shadowColor: '#7A2C34',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7A2C34',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  medicationName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#7A2C34',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    lineHeight: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    backgroundColor: 'rgba(122, 44, 52, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    minWidth: 180,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(122, 44, 52, 0.15)',
  },
  dosage: {
    fontSize: 16,
    color: '#7A2C34',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  time: {
    fontSize: 16,
    color: '#7A2C34',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  longPressHint: {
    fontSize: 12,
    color: 'rgba(122, 44, 52, 0.7)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 25,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(122, 44, 52, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7A2C34',
    flex: 1,
  },
  closeButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(122, 44, 52, 0.1)',
  },
  detailSection: {
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(122, 44, 52, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7A2C34',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A2C34',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '400',
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 15,
  },
  takenButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#7A2C34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    transform: [{ scale: 1.02 }],
  },
  snoozeButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#BFA5A9',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  skipButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#E0C3C9',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    minHeight: 50,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
    flex: 1,
  },
});

export default FullScreenAlarm;