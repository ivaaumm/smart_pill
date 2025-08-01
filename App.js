import React from "react";
import { NavigationContainer, DrawerActions } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Navigation from "./navigation";

import Home from "./screens/home";
import Login from "./screens/login";
import Register from "./screens/Register";
import Perfil from "./screens/Perfil";
import Bluetooth from "./screens/Bluetooth";

import { LogBox, TouchableOpacity } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { UserProvider } from "./UserContextProvider";
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
              <Ionicons name="menu" size={32} color="#fff" />
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
                  <MaterialCommunityIcons
                    name="heart-pulse"
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
                  <Ionicons
                    name="person-circle-outline"
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
                  <Ionicons name="bluetooth" size={size} color={color} />
                ),
                headerShown: false,
              }}
            />
          </Drawer.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </UserProvider>
  );
}
