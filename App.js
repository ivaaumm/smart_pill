import React, { useEffect, useRef } from "react";
import { NavigationContainer, DrawerActions } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import Navigation from "./navigation";

import Home from "./screens/home";
import Login from "./screens/login";
import Register from "./screens/Register";
import Perfil from "./screens/Perfil";
import Bluetooth from "./screens/Bluetooth";
import SoundTest from "./screens/SoundTest";

import { LogBox, TouchableOpacity, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { UserProvider } from "./UserContextProvider";

// Configurar el manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Configuración específica para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alarms', {
        name: 'Alarm Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// Registrar para notificaciones push
async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Error', 'Se requieren permisos de notificación para recibir recordatorios');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    Alert.alert('Debes usar un dispositivo físico para recibir notificaciones');
  }

  return token;
}

// Configuración avanzada de audio
async function setupAudio() {
  try {
    // Solicitar permisos de audio
    const { status } = await Audio.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('⚠️ Permisos de audio no concedidos');
      return false;
    }

    // Configuración detallada de audio
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: true,
    });
    
    // Precargar sonidos
    try {
      await Audio.Sound.createAsync(
        require('./assets/sounds/default.mp3'),
        { shouldPlay: false, isLooping: false },
        null,
        false
      );
      
      await Audio.Sound.createAsync(
        require('./assets/sounds/alarm.mp3'),
        { shouldPlay: false, isLooping: false },
        null,
        false
      );
      
      await Audio.Sound.createAsync(
        require('./assets/sounds/tone.mp3'),
        { shouldPlay: false, isLooping: false },
        null,
        false
      );
      
      console.log('✅ Sonidos pre-cargados exitosamente');
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
    </Stack.Navigator>
  );
}

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Configurar notificaciones
    registerForPushNotificationsAsync();
    setupAudio();

    // Escuchar notificaciones recibidas mientras la app está en primer plano
    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotification);

    // Escuchar interacciones con la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notificación tocada:', response);
      // Aquí puedes navegar a una pantalla específica cuando se toca la notificación
    });

    // Limpiar los listeners al desmontar usando el método remove()
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <UserProvider>
      <SafeAreaProvider>
        <NavigationContainer>
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
