import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Navigation from "./navigation";

import Home from "./screens/home";
import Login from "./screens/login";
import Register from "./screens/Register";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Register">
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
          name="Home"
          component={Navigation}
          options={{
            headerLeft: null,
            title: "SMART PILL",
            headerTintColor: "#fff",
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: "#7A2C34",
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
