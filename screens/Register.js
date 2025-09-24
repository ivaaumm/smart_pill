import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
} from "react-native";
import { apiRequest, API_CONFIG } from "../credenciales";
import { useUser } from "../UserContextProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";

export default function Register({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { setUser } = useUser();

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Formato dd/mm/aaaa
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      setFechaNacimiento(`${day}/${month}/${year}`);
    }
  };

  const registrarUsuario = async () => {
    if (
      !nombre ||
      !email ||
      !password ||
      !confirmPassword ||
      !fechaNacimiento
    ) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    // Normaliza fecha a yyyy-mm-dd para la API
    const [day, month, year] = fechaNacimiento.split("/");
    const fechaISO = `${year}-${month}-${day}`;
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.REGISTER, {
        method: "POST",
        body: JSON.stringify({
          nombre_usuario: nombre,
          email: email,
          password: password,
          fecha_nacimiento: fechaISO,
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
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Image
          source={require("../assets/icons/smartpill.png")}
          style={[styles.profile, { width: 260, height: 260 }]}
        />
      </View>
      <View style={[styles.tarjeta, { marginTop: -80, marginBottom: 60 }]}>
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              placeholder="Contraseña"
              style={{ flex: 1, paddingHorizontal: 15 }}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
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
        <View style={styles.cajaTexto}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              placeholder="Confirmar contraseña"
              style={{ flex: 1, paddingHorizontal: 15 }}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
              <MaterialIcons
                name={showConfirmPassword ? "visibility-off" : "visibility"}
                size={22}
                color="#7A2C34"
                style={{ marginRight: 12 }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={[
            styles.cajaTexto,
            { flexDirection: "row", alignItems: "center" },
          ]}
        >
          <TextInput
            placeholder="Fecha de nacimiento"
            style={{
              flex: 1,
              paddingHorizontal: 15,
              color: fechaNacimiento ? "#222" : "#888",
            }}
            value={fechaNacimiento}
            editable={false}
            pointerEvents="none"
          />
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <MaterialIcons
              name="event"
              size={22}
              color="#7A2C34"
              style={{ marginRight: 15, marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={
              fechaNacimiento
                ? new Date(fechaNacimiento.split("/").reverse().join("-"))
                : new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}
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
