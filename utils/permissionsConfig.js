import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { requestPermissionsAsync } from 'expo-notifications';

// Configurar permisos completos de notificaciones
export const setupFullNotificationPermissions = async () => {
  try {
    console.log('🔐 Configurando permisos completos de notificaciones...');
    
    // Verificar si es un dispositivo real
    if (!Device.isDevice) {
      console.log('⚠️ Ejecutándose en simulador - permisos limitados');
      return true;
    }

    // Configurar el manejador de notificaciones con configuración completa
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('📱 Notificación recibida:', notification.request.content.title);
        
        // Verificar si la app está en primer plano
        const appState = await import('react-native').then(rn => rn.AppState.currentState);
        const isInForeground = appState === 'active';
        
        return {
          shouldShowBanner: true,
          shouldShowList: true, 
          shouldPlaySound: true,
          shouldSetBadge: true,
          // Configuraciones adicionales para Android
          priority: 'high',
          // Mostrar notificación incluso si la app está en primer plano
          shouldShowInForeground: true,
        };
      },
    });

    // Configurar canal de Android con máxima prioridad
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-alarms', {
        name: 'Recordatorios de Medicamentos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Omitir modo No Molestar
      });
      
      console.log('✅ Canal de Android configurado con máxima prioridad');
    }

    // Solicitar permisos completos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const permissionRequest = {
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: true,
          provideAppNotificationSettings: true,
          allowProvisional: false,
          allowAnnouncements: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        }
      };
      
      const { status } = await requestPermissionsAsync(permissionRequest);
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permisos de Notificación Requeridos',
        'Para que Smart Pill funcione correctamente, necesita permisos completos de notificación. Esto permite que los recordatorios aparezcan incluso cuando la app está cerrada.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Abrir Configuración', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return false;
    }
    
    console.log('✅ Permisos completos de notificación concedidos');
    return true;
  } catch (error) {
    console.error('❌ Error configurando permisos de notificación:', error);
    return false;
  }
};



// Verificar y solicitar todos los permisos necesarios
export const setupAllPermissions = async () => {
  try {
    console.log('🚀 Configurando permisos de notificación...');
    
    // 1. Configurar permisos completos de notificación
    const notificationPermissions = await setupFullNotificationPermissions();
    if (!notificationPermissions) {
      console.warn('⚠️ No se pudieron configurar los permisos de notificación');
    }
    
    // 2. Verificar configuración del sistema
    await checkSystemConfiguration();
    
    if (notificationPermissions) {
      console.log('✅ Permisos de notificación configurados correctamente');
      Alert.alert(
        'Configuración Completa',
        'Smart Pill está configurado correctamente. Los recordatorios aparecerán en el momento exacto programado.',
        [{ text: 'Entendido' }]
      );
    } else {
      console.warn('⚠️ Los permisos de notificación no se pudieron configurar');
    }
    
    return notificationPermissions;
  } catch (error) {
    console.error('❌ Error configurando permisos:', error);
    return false;
  }
};

// Verificar configuración del sistema
const checkSystemConfiguration = async () => {
  try {
    console.log('🔍 Verificando configuración del sistema...');
    
    // Obtener información del dispositivo
    const deviceInfo = {
      isDevice: Device.isDevice,
      platform: Platform.OS,
      version: Platform.Version,
    };
    
    console.log('📱 Información del dispositivo:', deviceInfo);
    
    // Verificar notificaciones programadas
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📅 Notificaciones programadas: ${scheduledNotifications.length}`);
    
    // Mostrar información de zona horaria
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('🌍 Zona horaria del dispositivo:', timeZone);
    console.log('🕐 Hora actual del dispositivo:', now.toLocaleString('es-AR'));
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando configuración del sistema:', error);
    return false;
  }
};

// Función para verificar si los permisos están activos
export const checkPermissionsStatus = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const hasNotificationPermissions = status === 'granted';
    
    console.log('📊 Estado de permisos:');
    console.log('- Notificaciones:', hasNotificationPermissions ? '✅' : '❌');
    
    return {
      notifications: hasNotificationPermissions,
    };
  } catch (error) {
    console.error('❌ Error verificando estado de permisos:', error);
    return {
      notifications: false,
    };
  }
};