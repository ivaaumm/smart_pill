import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useUser } from "../UserContextProvider";

function getInitials(nombre) {
  if (!nombre) return "?";
  return nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getRandomColor(seed) {
  // Paleta de colores suaves
  const colors = ["#7A2C34", "#BFA5A9", "#F5F5F5", "#E0C3C9", "#A67C8E"];
  if (!seed) return colors[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Perfil({ navigation }) {
  const { user, setUser } = useUser();
  const avatarColor = getRandomColor(user?.nombre || user?.correo);
  const initials = getInitials(user?.nombre || user?.correo);

  const handleLogout = () => {
    setUser(null);
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarBox}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: avatarColor,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <Text style={styles.nombre}>{user?.nombre || "Sin nombre"}</Text>
        <Text style={styles.edadCorreo}>
          {user?.edad ? user.edad + " años" : "Edad no disponible"}
        </Text>
        <Text style={styles.edadCorreo}>{user?.correo || "Sin correo"}</Text>
      </View>
      <TouchableOpacity style={styles.botonEditar}>
        <Text style={styles.textoBoton}>Editar perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botonCerrar} onPress={handleLogout}>
        <Text style={styles.textoCerrar}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 0,
  },
  avatarBox: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    width: "100%",
    paddingVertical: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 30,
    elevation: 4,
    shadowColor: "#7A2C34",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#7A2C34",
    marginBottom: 16,
    overflow: "hidden",
  },
  initials: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
  },
  nombre: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#7A2C34",
    marginBottom: 4,
  },
  edadCorreo: {
    fontSize: 16,
    color: "#555",
    marginBottom: 2,
  },
  botonEditar: {
    backgroundColor: "#7A2C34",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 20,
    marginBottom: 10,
    width: "80%",
    alignItems: "center",
    elevation: 2,
  },
  textoBoton: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  botonCerrar: {
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: "#7A2C34",
    width: "80%",
    alignItems: "center",
    marginTop: 10,
  },
  textoCerrar: {
    color: "#7A2C34",
    fontSize: 18,
    fontWeight: "bold",
  },
});
