import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import Home from "./screens/home";
import Login from "./screens/login";

// Firebase ya se inicializa en credenciales.js

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={Login}
          options={{
            title: "Inicio de Sesión",
            headerTintColor: "#fff",
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: "#084C61",
            },
          }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            title: "Inicio",
            headerTintColor: "#fff",
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: "#084C61",
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
