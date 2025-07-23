import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";

import home from "./screens/home";
import medicamentos from "./screens/medicamentos";
import RegisterTab from "./screens/RegisterTab";

const Tab = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator
      initialRouteName="home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "medicamentos") {
            // Tercer icono: pastilla
            return <FontAwesome5 name="pills" size={size} color={color} />;
          } else if (route.name === "home") {
            // Segundo icono: corazón con electro
            return (
              <MaterialCommunityIcons
                name="heart-pulse"
                size={size}
                color={color}
              />
            );
          } else if (route.name === "registro") {
            // Primer icono: clipboard pulse
            return (
              <MaterialCommunityIcons
                name="clipboard-pulse-outline"
                size={size}
                color={color}
              />
            );
          }
        },
        tabBarActiveTintColor: "#7A2C34",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="registro"
        component={RegisterTab}
        options={{ title: "Registro", headerShown: false }}
      />
      <Tab.Screen
        name="home"
        component={home}
        options={{ title: "Inicio", headerShown: false }}
      />
      <Tab.Screen
        name="medicamentos"
        component={medicamentos}
        options={{ title: "Medicamentos", headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return <MyTabs />;
}
