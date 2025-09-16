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
// Notificaciones removidas - solo pantalla directa

const { width, height } = Dimensions.get('window');

const AlarmScreen = ({ route, navigation }) => {
  const { notificationData } = route.params || {};
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
      
      // Aquí puedes agregar lógica para marcar como tomado en la base de datos
      // await marcarComoTomado(notificationData.programacionId);
      
      Alert.alert(
        'Medicamento tomado',
        '¡Excelente! Has marcado tu medicamento como tomado.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error al marcar como tomado:', error);
      Alert.alert('Error', 'No se pudo registrar la toma del medicamento');
    }
  };

  const handleSnooze = async () => {
    await stopCurrentSound();
    setIsPlaying(false);
    
    // Sin notificaciones - solo cerrar pantalla
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
            await stopCurrentSound();
            setIsPlaying(false);
            navigation.goBack();
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