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
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { playSoundPreview, stopCurrentSound } from '../utils/audioUtils';
// Notificaciones removidas - solo pantalla directa

const { width, height } = Dimensions.get('window');

const FullScreenAlarm = ({ route, navigation }) => {
  const { notificationData } = route.params || {};
  const [pulseAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const handleTaken = async () => {
    try {
      await stopCurrentSound();
      setIsPlaying(false);
      
      // Las notificaciones recurrentes ahora se programan individualmente por día
      // No necesitamos reprogramar aquí ya que cada día tiene su propia notificación
      console.log('✅ Medicamento marcado como tomado. Las notificaciones futuras ya están programadas individualmente.');
      
      // Aquí puedes agregar lógica para marcar como tomado en la base de datos
      // await marcarComoTomado(notificationData.programacionId);
      
      Alert.alert(
        '✅ Medicamento tomado',
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
      '⏰ Recordatorio pospuesto',
      'Alarma pospuesta. La pantalla se cerrará.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
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
          onPress: () => {
            // Aquí puedes agregar lógica para marcar como omitido
            navigation.goBack();
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

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb', '#ff6b6b']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.3, 0.7, 1]}
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
          <Animated.View style={[styles.glowEffect, { opacity: glowOpacity }]} />
          <View style={styles.pillIconContainer}>
            <Ionicons name="medical" size={100} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>

      {/* Información del medicamento */}
      <View style={styles.medicationInfo}>
        <View style={styles.medicationCard}>
          <Text style={styles.title}>💊 Hora de tu medicamento</Text>
          <Text style={styles.medicationName}>
            {notificationData?.medicamento || 'Medicamento'}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="medical-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.dosage}>
              {notificationData?.dosis || '1 tableta'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.time}>
              {notificationData?.hora || formatTime(currentTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.takenButton} onPress={handleTaken}>
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
            <Text style={styles.buttonText}>YA LO TOMÉ</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
          <LinearGradient
            colors={['#FF9800', '#f57c00']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="alarm-outline" size={28} color="#FFFFFF" />
            <Text style={styles.buttonText}>POSPONER 10 MIN</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <LinearGradient
            colors={['#f44336', '#d32f2f']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="close-circle" size={28} color="#FFFFFF" />
            <Text style={styles.buttonText}>OMITIR</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: StatusBar.currentHeight + 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '200',
    color: '#FFFFFF',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    letterSpacing: 3,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  alarmIconContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: -20,
    left: -20,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
  },
  pillIconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 18,
  },
  medicationInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 35,
    width: '100%',
  },
  medicationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 32,
    alignItems: 'center',
    backdropFilter: 'blur(15px)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    width: '100%',
    maxWidth: 350,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 0.5,
  },
  medicationName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 1,
    lineHeight: 38,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 200,
    justifyContent: 'center',
  },
  dosage: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.98)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.98)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 28,
    gap: 18,
    paddingBottom: 10,
  },
  takenButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    transform: [{ scale: 1.02 }],
  },
  snoozeButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  skipButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 28,
    gap: 14,
    minHeight: 65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default FullScreenAlarm;