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
import { getApiUrl } from './config';

// La configuración de notificaciones se maneja en notificationConfig.js

// Registrar para notificaciones locales (sin push tokens)
// Sistema de pantalla directa - sin notificaciones
// Las alarmas se muestran directamente en pantalla

// Función para verificar alarmas activas
async function verificarAlarmasActivas(navigationRef) {
  try {
    const apiUrl = getApiUrl();
    const ahora = new Date();
    const horaActual = ahora.toTimeString().slice(0, 5); // HH:MM
    const diaActual = ahora.getDay(); // 0=domingo, 1=lunes, etc.
    
    // Obtener todas las programaciones activas
    const response = await fetch(`${apiUrl}programaciones_usuario.php?usuario_id=1`);
    const data = await response.json();
    
    if (data.success && data.data) {
      for (const programacion of data.data) {
        if (programacion.programacion_id) {
          // Obtener alarmas para esta programación
          const alarmasResponse = await fetch(`${apiUrl}obtener_alarmas.php?programacion_id=${programacion.programacion_id}`);
          const alarmasData = await alarmasResponse.json();
          
          if (alarmasData.success && alarmasData.data) {
             for (const alarma of alarmasData.data) {
               // Verificar si la alarma está activa y coincide con la hora actual
               if (alarma.activa && alarma.hora === horaActual) {
                 // Verificar si el día actual está en los días programados
                 const diasProgramados = alarma.dias || [];
                 // Convertir domingo de 0 a 7 para coincidir con la base de datos
                 const diaParaComparar = diaActual === 0 ? 7 : diaActual;
                 const diaCoincide = diasProgramados.includes(diaParaComparar);
                 
                 console.log(`⏰ Verificando alarma: ${programacion.nombre_tratamiento} - Hora: ${alarma.hora} vs ${horaActual}, Día: ${diaParaComparar} en [${diasProgramados.join(',')}], Activa: ${alarma.activa}`);
                 
                 if (diaCoincide) {
                   console.log(`🚨 ALARMA ACTIVADA: ${programacion.nombre_tratamiento} a las ${horaActual} el día ${diaParaComparar}`);
                   
                   // Navegar a la pantalla de alarma
                   if (navigationRef.current) {
                     navigationRef.current.navigate('FullScreenAlarm', {
                       notificationData: {
                         medicamento: programacion.nombre_tratamiento,
                         hora: horaActual,
                         dosis: '1 pastilla',
                         programacionId: programacion.programacion_id,
                         alarmaId: alarma.id,
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
    verificarAlarmasActivas(navigationRef);
    
    // Configurar verificación cada minuto
    alarmCheckInterval.current = setInterval(() => {
      verificarAlarmasActivas(navigationRef);
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
  }, []);

  return (
    <UserProvider>
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
                  <MaterialIcons
                    name="person-outline"
                    size={size}
                    color={color}
                  />
                ),
                headerShown: false,
              }}
            />
            <Drawer.Screen
              name="Bluetooth"
              component={Bluetooth}
              options={{
                title: "Bluetooth",
                drawerIcon: ({ color, size }) => (
                  <MaterialIcons name="bluetooth" size={size} color={color} />
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
    </UserProvider>
  );
}
