import React, { useEffect, useRef } from "react";
import { NavigationContainer, DrawerActions } from "@react-navigation/native";
import { CommonActions } from '@react-navigation/native';
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
// import * as Notifications from 'expo-notifications'; // Removido - sin notificaciones
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
import Navigation from "./navigation";
import { useUser } from "./UserContextProvider";
// import { setupNotificationsForExpoGo } from "./utils/notificationConfig"; // Removido - sin notificaciones

import Home from "./screens/home";
import Login from "./screens/login";
import Register from "./screens/Register";
import Perfil from "./screens/Perfil";
import Bluetooth from "./screens/Bluetooth";
import SoundTest from "./screens/SoundTest";
import AlarmScreen from "./screens/AlarmScreen";
import FullScreenAlarm from "./screens/FullScreenAlarm";
import RegistroTomas from "./screens/RegistroTomas";

import { LogBox, TouchableOpacity, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { scheduleNotification } from './utils/audioUtils';
import { UserProvider } from "./UserContextProvider";
import { getApiUrl, testConnectivity } from './config';

// La configuración de notificaciones se maneja en notificationConfig.js

// Registrar para notificaciones locales (sin push tokens)
// Sistema de pantalla directa - sin notificaciones
// Las alarmas se muestran directamente en pantalla

// Función para verificar alarmas activas
async function verificarAlarmasActivas(navigationRef, usuario_id) {
  try {
    // Si no hay usuario logueado, no verificar alarmas
    if (!usuario_id) {
      console.log('⚠️ No hay usuario logueado, saltando verificación de alarmas');
      return;
    }

    // Probar conectividad antes de hacer las peticiones
    const connectivityResult = await testConnectivity();
    if (!connectivityResult.success) {
      console.error('❌ No se pudo establecer conexión con el servidor');
      return;
    }
    
    const apiUrl = connectivityResult.workingUrl + 'smart_pill_api/';
    const ahora = new Date();
    const horaActual = ahora.toTimeString().slice(0, 5); // HH:MM
    const diaActual = ahora.getDay(); // 0=domingo, 1=lunes, etc.
    
    console.log(`🕐 Verificando alarmas - Hora actual: ${horaActual}, Día: ${diaActual}, Usuario: ${usuario_id}`);
    
    // Obtener todas las programaciones activas
    const response = await fetch(`${apiUrl}programaciones_usuario.php?usuario_id=${usuario_id}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      for (const programacion of data.data) {
        if (programacion.programacion_id) {
          // Obtener alarmas para esta programación
          const alarmasResponse = await fetch(`${apiUrl}obtener_alarmas.php?programacion_id=${programacion.programacion_id}`);
          const alarmasData = await alarmasResponse.json();
          
          if (alarmasData.success && alarmasData.data) {
             for (const alarma of alarmasData.data) {
               // Convertir hora de alarma de HH:MM:SS a HH:MM para comparar
               const horaAlarma = alarma.hora ? alarma.hora.slice(0, 5) : '';
               
               // Verificar si la alarma está activa y coincide con la hora actual
               if (alarma.activa && horaAlarma === horaActual) {
                 // Procesar días programados - puede ser string "1,2,3" o array
                let diasProgramados = [];
                if (typeof alarma.dias_semana === 'string') {
                  diasProgramados = alarma.dias_semana.split(',').map(d => parseInt(d.trim()));
                } else if (Array.isArray(alarma.dias_semana)) {
                  diasProgramados = alarma.dias_semana;
                } else if (alarma.dias) {
                  diasProgramados = Array.isArray(alarma.dias) ? alarma.dias : alarma.dias.split(',').map(d => parseInt(d.trim()));
                }
                
                // Usar el día actual directamente (formato JavaScript estándar 0-6)
                // Verificar que diasProgramados sea un array antes de usar .includes()
                const diaCoincide = Array.isArray(diasProgramados) && diasProgramados.includes(diaActual);
                 
                 console.log(`⏰ Verificando alarma: ${programacion.nombre_tratamiento}`);
                 console.log(`   - Hora alarma: ${alarma.hora} -> ${horaAlarma} vs actual: ${horaActual}`);
                 console.log(`   - Días programados: ${alarma.dias_semana} -> [${diasProgramados.join(',')}]`);
                 console.log(`   - Día actual: ${diaActual}, Coincide: ${diaCoincide}`);
                 console.log(`   - Activa: ${alarma.activa}`);
                 
                 if (diaCoincide) {
                   console.log(`🚨 ALARMA ACTIVADA: ${programacion.nombre_tratamiento} a las ${horaActual} el día ${diaActual}`);
                   
                   // Navegar a la pantalla de alarma
                   if (navigationRef.current) {
                     navigationRef.current.navigate('FullScreenAlarm', {
                       notificationData: {
                         medicamento: programacion.nombre_tratamiento,
                         hora: horaActual,
                         dosis: '1 pastilla',
                         programacionId: programacion.programacion_id,
                         alarmaId: alarma.alarma_id || alarma.id,
                         horario_id: alarma.horario_id,
                         usuario_id: usuario_id,
                         sound: alarma.sonido || 'alarm'
                       }
                     });
                   }
                   return; // Solo activar una alarma a la vez
                 }
               }
             }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error verificando alarmas:', error);
  }
}

// Configuración avanzada de audio
async function setupAudio() {
  try {
    // Usar la nueva función de configuración de volumen
    const { checkSystemVolume } = require('./utils/audioUtils');
    await checkSystemVolume();
    
    // Precargar sonidos usando la nueva función optimizada
    try {
      const { preloadSounds } = require('./utils/audioUtils');
      const result = await preloadSounds();
      if (result) {
        console.log('✅ Sonidos pre-cargados exitosamente');
      } else {
        console.warn('⚠️ No se pudieron pre-cargar todos los sonidos');
      }
    } catch (error) {
      console.warn('⚠️ No se pudieron pre-cargar los sonidos:', error);
    }
    
    console.log('✅ Configuración de audio exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error configurando el audio:', error);
    return false;
  }
}

// Configurar el listener de notificaciones
function handleNotification(notification) {
  // Aquí puedes manejar las notificaciones entrantes
  console.log('Notificación recibida:', notification);
}

LogBox.ignoreLogs([
  "Seems like you are using a Babel plugin `react-native-reanimated/plugin`",
  "expo-notifications: Android Push notifications",
  "remote notifications",
  "Expo Go",
  "expo-notifications functionality is not fully supported in Expo Go",
  "We recommend you instead use a development build",
  // expo-av warnings eliminados - ya migrado a expo-audio
  "interruptionModeIOS was set to an invalid value",
  "expo-notifications: Android Push notifications (remote notifications) functionality",
  "provided by expo-notifications was removed from Expo Go with the release of SDK 53",
  "Use a development build instead of Expo Go",
  "https://docs.expo.dev/develop/development-builds/introduction",
]);

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function MainStack() {
  return (
    <Stack.Navigator initialRouteName="Register">
      <Stack.Screen
        name="Home"
        component={Navigation}
        options={({ navigation }) => ({
          title: "SMART PILL",
          headerTintColor: "#fff",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#7A2C34",
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ marginLeft: 15 }}
            >
              <MaterialIcons name="menu" size={32} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          title: "Inicio de Sesión",
          headerTintColor: "#fff",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#7A2C34",
          },
        }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{
          title: "Registro",
          headerTintColor: "#fff",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#7A2C34",
          },
        }}
      />
      <Stack.Screen
        name="AlarmScreen"
        component={AlarmScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FullScreenAlarm"
        component={FullScreenAlarm}
        options={{
          headerShown: false,
          gestureEnabled: false, // Deshabilitar gestos de navegación
        }}
      />
      <Stack.Screen
        name="RegistroTomas"
        component={RegistroTomas}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// NOTA: La reprogramación de notificaciones recurrentes ahora se maneja
// desde FullScreenAlarm.js cuando el usuario confirma la toma del medicamento
// para evitar notificaciones infinitas

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

function AppContent() {
  const { user } = useUser();
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigationRef = useRef();
  const alarmCheckInterval = useRef();

  useEffect(() => {
    // Sistema de pantalla directa - sin inicialización de notificaciones
    setupAudio();

    // Sin listeners de notificaciones - sistema de pantalla directa
    console.log('📱 Sistema configurado para pantalla directa sin notificaciones');

    // Iniciar verificación periódica de alarmas cada minuto
    console.log('⏰ Iniciando sistema de verificación de alarmas cada minuto');
    
    // Verificar inmediatamente al iniciar
    verificarAlarmasActivas(navigationRef, user?.usuario_id);
    
    // Configurar verificación cada minuto
    alarmCheckInterval.current = setInterval(() => {
      verificarAlarmasActivas(navigationRef, user?.usuario_id);
    }, 60000); // 60 segundos

    // Sin listener de respuesta de notificaciones - sistema de pantalla directa
    console.log('📱 Sistema configurado sin interacciones de bandeja de notificaciones');

    // Limpiar los listeners al desmontar usando el método remove()
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (alarmCheckInterval.current) {
        clearInterval(alarmCheckInterval.current);
      }
    };
  }, [user?.usuario_id]); // Dependencia del usuario para reiniciar verificación cuando cambie

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Drawer.Navigator
          initialRouteName="MainStack"
          screenOptions={{
            drawerActiveTintColor: "#7A2C34",
            drawerLabelStyle: { fontSize: 18 },
          }}
        >
          <Drawer.Screen
            name="MainStack"
            component={MainStack}
            options={{
              title: "Inicio",
              drawerIcon: ({ color, size }) => (
                <MaterialIcons
                  name="favorite"
                  size={size}
                  color={color}
                />
              ),
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="Perfil"
            component={Perfil}
            options={{
              title: "Perfil",
              drawerIcon: ({ color, size }) => (
                <MaterialIcons name="person" size={size} color={color} />
              ),
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="SoundTest"
            component={SoundTest}
            options={{
              title: "Probar Sonidos",
              drawerIcon: ({ color, size }) => (
                <MaterialIcons name="volume-up" size={size} color={color} />
              ),
              headerShown: true,
              headerStyle: {
                backgroundColor: "#7A2C34",
              },
              headerTintColor: "#fff",
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
