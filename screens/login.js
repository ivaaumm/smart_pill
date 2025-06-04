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
import { auth } from "../credenciales";

export default function Login(props) {
  // Creamos la variable estado
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // Creamos la función para iniciar sesión
  const logueo = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Inicio de sesión exitoso", "Bienvenido a Smart Pill");
      props.navigation.navigate("Home");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      Alert.alert("Error al iniciar sesión", error.message);
    }
  };

  return (
    <View style={styles.padre}>
      <View>
        <Image
          source={require("../assets/fondologin.jpg")}
          style={styles.profile}
        />
      </View>
      <View style={styles.tarjeta}>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder="E-Mail"
            style={{ paddingHorizontal: 15 }}
            onChangeText={(text) => setEmail(text)}
          />
        </View>
        <View style={styles.cajaTexto}>
          <TextInput
            placeholder="Password"
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  profile: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: "White",
  },
  tarjeta: {
    margin: 20,
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
    backgroundColor: "#A1E3D840",
    borderRadius: 30,
    marginVertical: 10,
  },
  PadreBoton: {
    alignItems: "center",
  },
  cajaBoton: {
    backgroundColor: "#084C61",
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
