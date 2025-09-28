import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../credenciales";
import { useUser } from "../UserContextProvider";

export default function Home() {
  const { user } = useUser();
  const [programaciones, setProgramaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const cargarProgramaciones = async () => {
    if (!user?.usuario_id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest(
        `/obtener_programaciones.php?usuario_id=${user.usuario_id}`
      );

      console.log("📥 Programaciones recibidas:", response);
      console.log("📊 Usuario ID:", user.usuario_id);
      console.log("📋 Datos de programaciones:", response.data);

      if (response.success) {
        // El API devuelve {data: [...], estadisticas_generales: {...}}
        // Necesitamos acceder a response.data.data para obtener el array
        const programacionesData = response.data?.data || [];
        console.log("📊 Programaciones a guardar:", programacionesData);
        console.log("📊 Es array:", Array.isArray(programacionesData));

        if (Array.isArray(programacionesData)) {
          console.log(
            "✅ Programaciones cargadas en Home:",
            programacionesData.length,
            "tratamientos"
          );
          setProgramaciones(programacionesData);

          // Alert temporal para verificar
          // if (programacionesData.length > 0) {
          //   alert(
          //     `Home: ${programacionesData.length} tratamientos cargados\nPrimer tratamiento: ${programacionesData[0].nombre_tratamiento}`
          //   );
          // }
        } else {
          console.log(
            "⚠️ Los datos no son un array, estableciendo array vacío"
          );
          setProgramaciones([]);
        }
      } else {
        setError(response.error || "Error al cargar programaciones");
        setProgramaciones([]); // Establecer array vacío en caso de error
      }
    } catch (error) {
      console.error("❌ Error cargando programaciones:", error);
      setError("Error de conexión");
      setProgramaciones([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarProgramaciones();
    setRefreshing(false);
  };

  // Auto-refresh cuando se regresa al Home
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Home enfocado - recargando programaciones...");
      cargarProgramaciones();
    }, [user?.usuario_id])
  );

  useEffect(() => {
    cargarProgramaciones();
  }, [user?.usuario_id]);

  const formatearFecha = (fecha) => {
    // Crear la fecha de forma que respete la zona horaria local
    // Si la fecha viene en formato YYYY-MM-DD, la parseamos correctamente
    let fechaObj;
    if (typeof fecha === 'string' && fecha.includes('-')) {
      const [year, month, day] = fecha.split('-');
      fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      fechaObj = new Date(fecha);
    }
    
    return fechaObj.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatearHora = (hora) => {
    return hora.substring(0, 5); // Formato HH:MM
  };

  // Función para capitalizar la primera letra de un día
  const capitalizarDia = (dia) => {
    if (!dia) return "Sin día";
    return dia.charAt(0).toUpperCase() + dia.slice(1);
  };

  // Función para obtener las tomas del día actual y mañana
  const obtenerTomasDelDia = () => {
    if (!Array.isArray(programaciones) || programaciones.length === 0) {
      return { hoy: [], manana: [] };
    }

    // Filtrar solo tratamientos activos
    const programacionesActivas = programaciones.filter(
      (p) => (p.estado || "").toLowerCase() === "activo"
    );

    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const diasSemana = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const diaHoy = diasSemana[hoy.getDay()];
    const diaManana = diasSemana[manana.getDay()];

    const tomasHoy = [];
    const tomasManana = [];

    programacionesActivas.forEach((programacion) => {
      if (!programacion.horarios) return;

      // Obtener horarios reales
      let horariosReales = [];
      if (
        Array.isArray(programacion.horarios) &&
        programacion.horarios.length > 0
      ) {
        const primerElemento = programacion.horarios[0];
        if (Array.isArray(primerElemento)) {
          horariosReales = primerElemento;
        } else {
          horariosReales = programacion.horarios;
        }
      }

      // Filtrar horarios para hoy
      const horariosHoy = horariosReales.filter(
        (horario) => horario.dia_semana === diaHoy
      );

      // Filtrar horarios para mañana
      const horariosManana = horariosReales.filter(
        (horario) => horario.dia_semana === diaManana
      );

      // Agregar tomas de hoy (solo futuras)
      horariosHoy.forEach((horario) => {
        const horaHorario = new Date();
        const [horas, minutos] = horario.hora.split(":");
        horaHorario.setHours(parseInt(horas), parseInt(minutos), 0, 0);

        // Solo agregar si la hora no ha pasado
        if (horaHorario > hoy) {
          tomasHoy.push({
            id: `${programacion.programacion_id}-${horario.hora}`,
            nombre:
              programacion.nombre_tratamiento || programacion.nombre_comercial,
            medicamento: programacion.nombre_comercial,
            hora: horario.hora,
            programacion: programacion,
          });
        }
      });

      // Agregar tomas de mañana (todas, ya que son futuras)
      horariosManana.forEach((horario) => {
        tomasManana.push({
          id: `${programacion.programacion_id}-${horario.hora}`,
          nombre:
            programacion.nombre_tratamiento || programacion.nombre_comercial,
          medicamento: programacion.nombre_comercial,
          hora: horario.hora,
          programacion: programacion,
        });
      });
    });

    // Ordenar por hora
    tomasHoy.sort((a, b) => a.hora.localeCompare(b.hora));
    tomasManana.sort((a, b) => a.hora.localeCompare(b.hora));

    console.log("📅 Tomas del día calculadas:");
    console.log("📅 Hoy:", tomasHoy.length, "tomas");
    console.log("📅 Mañana:", tomasManana.length, "tomas");
    console.log("📅 Día hoy:", diaHoy);
    console.log("📅 Día mañana:", diaManana);

    return { hoy: tomasHoy, manana: tomasManana };
  };

  // Renderizar toma individual
  const renderToma = (toma) => {
    return (
      <View key={toma.id} style={styles.tomaCard}>
        <View style={styles.tomaHeader}>
          <MaterialIcons name="access-time" size={20} color="#7A2C34" />
          <Text style={styles.tomaHora}>{toma.hora}</Text>
        </View>
        <View style={styles.tomaContent}>
          <Text style={styles.tomaNombre}>{toma.nombre}</Text>
          <Text style={styles.tomaMedicamento}>{toma.medicamento}</Text>
        </View>
      </View>
    );
  };

  // Renderizar sección de tomas del día
  const renderTomasDelDia = () => {
    const { hoy, manana } = obtenerTomasDelDia();
    const fechaHoy = new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const fechaManana = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return (
      <View style={styles.tomasContainer}>
        {/* Tomas de hoy */}
        <View style={styles.tomasSeccion}>
          <View style={styles.tomasHeader}>
            <MaterialIcons
              name="event"
              size={20}
              color="#7A2C34"
            />
            <Text style={styles.tomasTitulo}>Hoy - {fechaHoy}</Text>
          </View>
          {hoy.length > 0 ? (
            <View style={styles.tomasLista}>
              {hoy.map((toma) => renderToma(toma))}
            </View>
          ) : (
            <View style={styles.tomasVacio}>
              <MaterialIcons
                name="check-circle"
                size={24}
                color="#ccc"
              />
              <Text style={styles.tomasVacioText}>
                No hay tomas programadas para hoy
              </Text>
            </View>
          )}
        </View>

        {/* Tomas de mañana */}
        <View style={styles.tomasSeccion}>
          <View style={styles.tomasHeader}>
            <MaterialIcons
              name="event-available"
              size={20}
              color="#7A2C34"
            />
            <Text style={styles.tomasTitulo}>Mañana - {fechaManana}</Text>
          </View>
          {manana.length > 0 ? (
            <View style={styles.tomasLista}>
              {manana.map((toma) => renderToma(toma))}
            </View>
          ) : (
            <View style={styles.tomasVacio}>
              <MaterialIcons
                name="event-available"
                size={24}
                color="#ccc"
              />
              <Text style={styles.tomasVacioText}>
                No hay tomas programadas para mañana
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };



  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tus Tratamientos</Text>
        <Text style={styles.subtitle}>
          {user?.nombre ? `Hola, ${user.nombre}` : "Bienvenido a Smart Pill"}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7A2C34" />
            <Text style={styles.loadingText}>Cargando tratamientos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons
              name="warning"
              size={48}
              color="#ff6b6b"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={cargarProgramaciones}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : programaciones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="medication" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              No hay tratamientos programados
            </Text>
            <Text style={styles.emptyText}>
              Ve a la sección de Medicamentos para programar tu primer
              tratamiento
            </Text>
          </View>
        ) : (
          <>
            {/* Tomas del día */}
            {renderTomasDelDia()}
            


          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#7A2C34",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#7A2C34",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },

  horarioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
    marginBottom: 2,
  },
  horarioText: {
    fontSize: 13,
    color: "#666",
  },
  // Estilos para las tomas del día
  tomasContainer: {
    marginBottom: 20,
  },
  tomasSeccion: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  tomasHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  tomasTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7A2C34",
    marginLeft: 12,
    textTransform: "capitalize",
  },
  tomasLista: {
    padding: 16,
  },
  tomasVacio: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
  },
  tomasVacioText: {
    fontSize: 14,
    color: "#999",
    marginLeft: 8,
    fontStyle: "italic",
  },
  tomaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#7A2C34",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tomaHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  tomaHora: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7A2C34",
    marginLeft: 6,
  },
  tomaContent: {
    flex: 1,
  },
  tomaNombre: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  tomaMedicamento: {
    fontSize: 13,
    color: "#666",
  },

  tomaDosis: {
    fontSize: 12,
    color: "#7A2C34",
    fontWeight: "500",
  },

});
