import React from "react";
import {
  Text,
  StyleSheet,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { apiRequest, API_CONFIG } from "../credenciales";

export default function Login(props) {
  const [usuario, setUsuario] = React.useState("");
  const [password, setPassword] = React.useState("");

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
            placeholder="Correo o Nombre de usuario"
            style={{ paddingHorizontal: 15 }}
            onChangeText={(text) => setUsuario(text)}
          />
        </View>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder="Contraseña"
            style={{ paddingHorizontal: 15 }}
            secureTextEntry={true}
            onChangeText={(text) => setPassword(text)}
          />
        </View>
        <View style={styles.PadreBoton}>
          <TouchableOpacity style={styles.cajaBoton} onPress={logueo}>
            <Text style={styles.TextoBoton}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padre: {
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
});
