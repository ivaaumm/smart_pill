import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function Bluetooth() {
  return (
    <View style={styles.container}>
      <MaterialIcons
        name="bluetooth"
        size={80}
        color="#7A2C34"
        style={{ marginBottom: 30 }}
      />
      <Text style={styles.titulo}>Conexión Bluetooth</Text>
      <Text style={styles.texto}>
        Esta función estará disponible próximamente para conectar tu pastillero
        inteligente.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#7A2C34",
    textAlign: "center",
  },
  texto: {
    fontSize: 20,
    color: "#333",
    textAlign: "center",
  },
});
