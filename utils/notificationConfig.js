import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';

// Configuración específica para Expo Go
export const setupNotificationsForExpoGo = async () => {
  try {
    // Configurar el manejador de notificaciones
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false, // Deshabilitado en Expo Go
      }),
    });

    // Configurar canal de Android solo si es necesario
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('alarms', {
          name: 'Recordatorios de Medicamentos',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
        });
        console.log('✅ Canal de notificaciones Android configurado');
      } catch (error) {
        console.warn('⚠️ No se pudo configurar el canal de Android:', error.message);
      }
    }

    // Solicitar permisos solo en dispositivos reales
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false, // Deshabilitado en Expo Go
            allowSound: true,
            allowDisplayInCarPlay: false,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: false,
            allowProvisional: false,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Para recibir recordatorios de medicamentos, necesitas habilitar las notificaciones.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurar', onPress: () => Notifications.openSettingsAsync() }
          ]
        );
        return false;
      }
      
      console.log('✅ Permisos de notificación concedidos');
      return true;
    } else {
      console.log('⚠️ Ejecutándose en simulador - notificaciones limitadas');
      return true;
    }
  } catch (error) {
    console.error('❌ Error configurando notificaciones:', error.message);
    return false;
  }
};

// Función para programar notificaciones locales compatibles con Expo Go
export const scheduleLocalNotification = async ({
  id,
  title,
  body,
  data = {},
  triggerDate,
  sound = 'default'
}) => {
  try {
    // Validar solo que la fecha no sea en el pasado
    const now = new Date();
    const timeDifference = triggerDate.getTime() - now.getTime();
    
    if (triggerDate <= now) {
      console.warn('⚠️ No se puede programar notificación en el pasado');
      console.warn('⚠️ Fecha programada:', triggerDate.toLocaleString('es-AR'));
      console.warn('⚠️ Fecha actual:', now.toLocaleString('es-AR'));
      return null;
    }
    
    console.log('✅ Programando notificación para la hora exacta seleccionada:', triggerDate.toLocaleString('es-AR'));
    console.log('✅ Tiempo hasta notificación:', Math.round(timeDifference / (1000 * 60)), 'minutos');

    // SOLUCIÓN CRÍTICA: Agregar validación adicional para evitar notificaciones inmediatas
    const minTimeFromNow = 1 * 60 * 1000; // Mínimo 1 minuto en el futuro
    const actualTimeDifference = triggerDate.getTime() - now.getTime();
    
    if (actualTimeDifference < minTimeFromNow) {
      const minutesUntil = Math.round(actualTimeDifference / (1000 * 60));
      console.error('🚫 BLOQUEANDO notificación muy próxima:', minutesUntil, 'minutos');
      console.error('🚫 Fecha programada:', triggerDate.toLocaleString('es-AR'));
      console.error('🚫 Fecha actual:', now.toLocaleString('es-AR'));
      throw new Error(`No se puede programar una notificación con menos de 1 minuto de anticipación. Tiempo actual: ${minutesUntil} minutos.`);
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${title}`,
        body: `💊 ${body}`,
        data: {
          ...data,
          scheduledTime: triggerDate.getTime(),
          scheduledTimeISO: triggerDate.toISOString(),
          notificationId: id,
          debugInfo: {
            programmedAt: now.getTime(),
            timeDifferenceMs: actualTimeDifference,
            timeDifferenceMin: Math.round(actualTimeDifference / (1000 * 60))
          }
        },
        sound: sound && sound !== 'default' ? sound : 'default',
        priority: 'high',
      },
      trigger: {
        date: triggerDate,
        channelId: 'alarms',
      },
    });

    console.log(`✅ Notificación programada: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('❌ Error programando notificación:', error.message);
    return null;
  }
};

// Función para cancelar notificaciones
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`✅ Notificación cancelada: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('❌ Error cancelando notificación:', error.message);
    return false;
  }
};

// Función para obtener notificaciones programadas
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 Notificaciones programadas: ${notifications.length}`);
    return notifications;
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error.message);
    return [];
  }
};