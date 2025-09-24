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
import { MaterialIcons } from "@expo/vector-icons";

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
      console.log("🔑 Intentando iniciar sesión con:", { usuario });
      
      const response = await apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: usuario,
          password: password,
        }),
      });

      console.log("🔑 Respuesta del servidor:", response);

      if (response.success && response.data) {
        // La respuesta exitosa está en response.data
        const userData = response.data;
        
        // Verificar que tenemos los datos necesarios del usuario
        if (userData.usuario_id && userData.nombre_usuario) {
          setUser({
            usuario_id: userData.usuario_id,
            nombre: userData.nombre_usuario,
            correo: userData.correo,
            edad: userData.edad,
            avatar: userData.avatar,
          });
          
          Alert.alert(
            "Inicio de sesión exitoso",
            `Bienvenido ${userData.nombre_usuario} a Smart Pill`
          );
          
          props.navigation.navigate("Home");
        } else {
          Alert.alert(
            "Error al iniciar sesión",
            "Datos de usuario incompletos"
          );
        }
      } else {
        // Manejar diferentes tipos de errores
        if (response.error === "TIMEOUT_ERROR") {
          Alert.alert(
            "Error de conexión",
            "La petición tardó demasiado. Verifica tu conexión a internet y que el servidor esté funcionando."
          );
        } else if (response.error === "NETWORK_ERROR") {
          Alert.alert(
            "Error de red",
            "No se pudo conectar con el servidor. Verifica tu conexión a internet."
          );
        } else {
          // Error de credenciales o respuesta del servidor
          // El backend devuelve el error directamente en response.data.error
          const errorMessage = response.data?.error || "Credenciales incorrectas";
          Alert.alert(
            "Error al iniciar sesión",
            errorMessage
          );
        }
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
        source={require("../assets/icons/smartpill.png")}
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
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
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
