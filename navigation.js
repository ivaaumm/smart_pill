import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Home from "./screens/home";
import Medicamentos from "./screens/medicamentos";
import RegisterTab from "./screens/RegisterTab";
import Perfil from "./screens/Perfil";
import Bluetooth from "./screens/Bluetooth";
import SoundTest from "./screens/SoundTest";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function Tabs({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false, // Quitar el header de los tabs
        tabBarIcon: ({ color }) => {
          const iconSize = 28;
          if (route.name === "Tratamientos") {
            return <MaterialIcons name="medication" size={iconSize} color={color} />;
          } else if (route.name === "Home") {
            return (
              <MaterialIcons name="home" size={iconSize} color={color} />
            );
          } else if (route.name === "Registro") {
            return (
              <MaterialIcons name="assignment" size={iconSize} color={color} />
            );
          }
        },
        tabBarActiveTintColor: "#7A2C34",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 90 + insets.bottom,
          paddingBottom: Math.max(48, 40 + insets.bottom),
          paddingTop: 12,
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "bold",
          marginBottom: 4,
          textAlign: "center",
        },
        tabBarIconStyle: {
          alignSelf: "center",
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            style={[
              props.style,
              {
                minHeight: 50,
                maxHeight: 50,
              },
            ]}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Registro"
        component={RegisterTab}
        options={{
          title: "Registro",
          tabBarItemStyle: {
            width: 140,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 0,
          },
        }}
      />

      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          title: "Inicio",
          tabBarItemStyle: {
            width: 140,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 0,
          },
        }}
      />

      <Tab.Screen
        name="Tratamientos"
        component={Medicamentos}
        options={{
          title: "Tratamientos",
          tabBarItemStyle: {
            width: 140,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 0,
          },
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <Drawer.Navigator
      initialRouteName="Tabs"
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: "#7A2C34",
        drawerLabelStyle: { fontSize: 18 },
      }}
    >
      <Drawer.Screen
        name="Tabs"
        component={Tabs}
        options={{
          title: "Inicio",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={Perfil}
        options={{
          title: "Perfil",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={size} color={color} />
          ),
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
        }}
      />
    </Drawer.Navigator>
  );
}
