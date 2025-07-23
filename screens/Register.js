import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { apiRequest, API_CONFIG } from "../credenciales";

export default function Register({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registrarUsuario = async () => {
    if (!nombre || !email || !password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.REGISTER, {
        method: "POST",
        body: JSON.stringify({
          nombre_usuario: nombre,
          email: email,
          password: password,
        }),
      });

      if (response.success) {
        Alert.alert("Registro exitoso", "Ahora puedes iniciar sesión", [
          { text: "OK", onPress: () => navigation.navigate("Login") },
        ]);
      } else {
        let errorMessage =
          response.data?.error || response.error || "Error desconocido";
        if (response.data?.cloudflare) {
          errorMessage =
            "El servidor está protegido por Cloudflare. Contacta al administrador para configurar la protección DDoS.";
        }
        Alert.alert("Error en el registro", errorMessage);
      }
    } catch (error) {
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor");
    }
  };

  return (
    <View style={styles.padre}>
      <View>
        <Image
          source={require("../assets/icons/S M A R T P I L L.png")}
          style={styles.profile}
        />
      </View>
      <View style={styles.tarjeta}>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder="Nombre de usuario"
            style={{ paddingHorizontal: 15 }}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder="Correo"
            style={{ paddingHorizontal: 15 }}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder="Contraseña"
            style={{ paddingHorizontal: 15 }}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <View style={styles.PadreBoton}>
          <TouchableOpacity style={styles.cajaBoton} onPress={registrarUsuario}>
            <Text style={styles.TextoBoton}>Registrarse</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={{ marginTop: 10 }}
        >
          <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padre: {
    flex: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  profile: {
    width: 200,
    height: 200,
    borderRadius: 50,
    borderColor: "White",
  },
  tarjeta: {
    margin: 0,
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cajaTexto: {
    paddingVertical: 10,
    backgroundColor: "#7A2C3440",
    borderRadius: 30,
    marginVertical: 10,
  },
  PadreBoton: {
    alignItems: "center",
  },
  cajaBoton: {
    backgroundColor: "#7A2C34",
    borderRadius: 30,
    paddingVertical: 15,
    width: 150,
    marginTop: 10,
  },
  TextoBoton: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: { color: "#2B2B2B", textAlign: "center", marginTop: 10 },
});
