import React from "react";
import {
  Text,
  StyleSheet,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { apiRequest, API_CONFIG } from "../credenciales";
import { useUser } from "../UserContextProvider";
import { Ionicons } from "@expo/vector-icons";

export default function Login(props) {
  const [usuario, setUsuario] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const { setUser } = useUser();

  const logueo = async () => {
    if (!usuario || !password) {
      Alert.alert("Error", "Completa ambos campos");
      return;
    }

    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
        method: "POST",
        body: JSON.stringify({
          usuario: usuario,
          password: password,
        }),
      });

      if (response.success && response.data && response.data.success) {
        setUser({
          usuario_id: response.data.usuario_id,
          nombre: response.data.nombre_usuario,
          correo: response.data.correo,
          edad: response.data.edad,
          avatar: response.data.avatar,
        });
        Alert.alert(
          "Inicio de sesión exitoso",
          `Bienvenido ${response.data.nombre_usuario} a Smart Pill`
        );
        props.navigation.navigate("Home");
      } else {
        Alert.alert(
          "Error al iniciar sesión",
          response.data?.error || "Credenciales incorrectas"
        );
      }
    } catch (error) {
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <Image
        source={require("../assets/icons/S M A R T P I L L.png")}
        style={{ width: 260, height: 260, marginBottom: 0 }}
      />
      <View style={[styles.tarjeta, { marginTop: -80, marginBottom: 60 }]}>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder="Correo o Nombre de usuario"
            style={{ paddingHorizontal: 15 }}
            onChangeText={(text) => setUsuario(text)}
            value={usuario}
          />
        </View>
        <View style={styles.cajaTexto}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              placeholder="Contraseña"
              style={{ flex: 1, paddingHorizontal: 15 }}
              secureTextEntry={!showPassword}
              onChangeText={(text) => setPassword(text)}
              value={password}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#7A2C34"
                style={{ marginRight: 12 }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.PadreBoton}>
          <TouchableOpacity style={styles.cajaBoton} onPress={logueo}>
            <Text style={styles.TextoBoton}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => props.navigation.navigate("Register")}
          style={{ marginTop: 10 }}
        >
          <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padre: {
    flex: 1,
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
