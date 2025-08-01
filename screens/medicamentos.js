import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { apiRequest } from "../config";
import { UserContext } from "../UserContextProvider";
import DateTimePicker from "@react-native-community/datetimepicker";

const Medicamentos = ({ navigation }) => {
  const { user } = useContext(UserContext);

  // Verificar que apiRequest está disponible
  console.log("🔍 apiRequest disponible:", typeof apiRequest);

  const [modalVisible, setModalVisible] = useState(false);
  const [pastillas, setPastillas] = useState([]);
  const [filteredPastillas, setFilteredPastillas] = useState([]);
  const [selectedPastilla, setSelectedPastilla] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para el flujo de programación simplificado
  const [currentStep, setCurrentStep] = useState(1); // 1: Selección pastilla, 2: Nombre y fecha, 3: Días, 4: Horarios, 5: Confirmación
  const [programacionData, setProgramacionData] = useState({
    nombre_tratamiento: "",
    fecha_fin: null,
    dosis_por_toma: "1 tableta",
    dias_seleccionados: [],
    horarios: [],
  });
  const [selectedDias, setSelectedDias] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [horariosConfigurados, setHorariosConfigurados] = useState([]);
  const [horarioEditando, setHorarioEditando] = useState(null);
  const [horarioTemporal, setHorarioTemporal] = useState("08:00");
  const [modalDetallesVisible, setModalDetallesVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState(null); // 'pastilla' o 'programacion'
  const [pastillaDetalles, setPastillaDetalles] = useState(null);
  const [programaciones, setProgramaciones] = useState([]);
  const [loadingProgramaciones, setLoadingProgramaciones] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [programacionDetalles, setProgramacionDetalles] = useState(null);
  const [editandoProgramacion, setEditandoProgramacion] = useState(null);

  // Log para depurar el estado de las pastillas
  useEffect(() => {
    console.log(
      "🔄 Estado actualizado - pastillas:",
      pastillas.length,
      "filtradas:",
      filteredPastillas.length
    );
  }, [pastillas, filteredPastillas]);

  // Cargar programaciones al montar el componente
  useEffect(() => {
    if (user?.usuario_id) {
      cargarProgramaciones();
    }
  }, [user?.usuario_id]);

  // Cargar pastillas al montar el componente
  useEffect(() => {
    console.log("🚀 Componente montado, cargando pastillas iniciales...");
    cargarPastillas();
  }, []);

  // Cargar programaciones del usuario
  const cargarProgramaciones = async () => {
    console.log("🔄 Iniciando cargarProgramaciones...");
    if (!user || !user.usuario_id) {
      console.log("❌ Usuario no disponible para cargar programaciones");
      return;
    }

    console.log("👤 Usuario ID:", user.usuario_id);
    setLoadingProgramaciones(true);
    try {
      const response = await apiRequest(
        `/obtener_programaciones.php?usuario_id=${user.usuario_id}`
      );
      console.log("📊 Programaciones cargadas:", response);
      console.log("📊 Datos de programaciones:", response.data?.data);
      console.log("📊 Tipo de datos:", typeof response.data?.data);
      console.log("📊 Es array:", Array.isArray(response.data?.data));

      if (response.success && response.data.success) {
        const programacionesData = response.data.data || [];
        console.log("📊 Programaciones a guardar:", programacionesData);

        // Verificar la estructura de cada programación
        if (Array.isArray(programacionesData)) {
          programacionesData.forEach((prog, index) => {
            console.log(`📊 Programación ${index}:`, prog);
            console.log(`📊 Horarios de programación ${index}:`, prog.horarios);
            console.log(`📊 Tipo de horarios:`, typeof prog.horarios);
            console.log(
              `📊 Es array de horarios:`,
              Array.isArray(prog.horarios)
            );
          });
        }

        console.log(
          "📊 Antes de setProgramaciones:",
          programaciones.length,
          "tratamientos"
        );
        setProgramaciones(programacionesData);
        console.log(
          "✅ Estado de programaciones actualizado:",
          programacionesData.length,
          "tratamientos"
        );
        console.log("📊 Datos de programaciones:", programacionesData);
      } else {
        console.log("❌ Error al cargar programaciones:", response.data);
        setProgramaciones([]); // Establecer array vacío en caso de error
      }
    } catch (error) {
      console.log("❌ Error de conexión:", error.message);
      setProgramaciones([]); // Establecer array vacío en caso de error
    } finally {
      setLoadingProgramaciones(false);
    }
  };

  // Función para manejar el refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await cargarProgramaciones();
    setRefreshing(false);
  };

  // Cargar pastillas disponibles
  const cargarPastillas = async () => {
    setLoading(true);
    setError(null);
    console.log("🔄 Iniciando carga de pastillas...");

    try {
      const response = await apiRequest(`/pastillas_usuario.php`);
      console.log("🔍 Respuesta completa:", response);

      if (response.success && response.data.success) {
        const pastillasData = response.data.data || [];
        console.log("📊 Datos recibidos:", pastillasData);
        console.log("📊 Cantidad de pastillas:", pastillasData.length);

        if (pastillasData.length > 0) {
          console.log("📊 Primer elemento:", pastillasData[0]);
          setPastillas(pastillasData);
          setFilteredPastillas(pastillasData);
          console.log("✅ Estados actualizados correctamente");
        } else {
          console.log("⚠️ No se encontraron pastillas en la base de datos");
          setError("No se encontraron medicamentos en la base de datos");
        }
      } else {
        console.log("❌ Error en la respuesta:", response.data);
        setError(
          response.data?.error ||
            response.data?.message ||
            "Error al cargar las pastillas"
        );
      }
    } catch (error) {
      console.log("❌ Error de conexión:", error.message);
      setError("Error de conexión: " + error.message);
    } finally {
      setLoading(false);
      console.log("🏁 Carga de pastillas completada");
    }
  };

  // Filtrar pastillas por búsqueda
  const filtrarPastillas = (texto) => {
    setSearchText(texto);
    if (texto.trim() === "") {
      setFilteredPastillas(pastillas);
    } else {
      const filtradas = pastillas.filter(
        (pastilla) =>
          pastilla.nombre_comercial
            ?.toLowerCase()
            .includes(texto.toLowerCase()) ||
          pastilla.descripcion?.toLowerCase().includes(texto.toLowerCase()) ||
          pastilla.presentacion?.toLowerCase().includes(texto.toLowerCase())
      );
      setFilteredPastillas(filtradas);
    }
  };

  // Seleccionar pastilla y avanzar al siguiente paso
  const seleccionarPastilla = (pastilla) => {
    // No permitir cambiar la pastilla si se está editando
    if (editandoProgramacion) {
      return;
    }

    setSelectedPastilla(pastilla);
    setCurrentStep(2);
  };

  // Mostrar detalles de la pastilla
  const mostrarDetallesPastilla = (pastilla) => {
    setPastillaDetalles(pastilla);
    setModalTipo("pastilla");
    setModalDetallesVisible(true);
  };

  const mostrarDetallesProgramacion = (programacion) => {
    setProgramacionDetalles(programacion);
    setModalTipo("programacion");
    setModalDetallesVisible(true);
  };

  // Abrir modal de selección
  const abrirSelectorPastillas = () => {
    console.log("🚀 Abriendo selector, pastillas actuales:", pastillas.length);
    // Forzar recarga completa de pastillas
    console.log("📡 Forzando recarga de pastillas...");
    setPastillas([]);
    setFilteredPastillas([]);
    setError(null);
    cargarPastillas();
    setModalVisible(true);
    setCurrentStep(1);
    setEditandoProgramacion(null); // Resetear editandoProgramacion
    resetearFormulario(); // Resetear el formulario
  };

  // Configurar días de la semana (simplificado)
  const toggleDia = (dia) => {
    console.log("🔄 Toggle día:", dia);
    setProgramacionData((prev) => {
      const diasActuales = prev.dias_seleccionados || [];
      const nuevosDias = diasActuales.includes(dia)
        ? diasActuales.filter((d) => d !== dia)
        : [...diasActuales, dia];

      console.log("🔄 Días actuales:", diasActuales);
      console.log("🔄 Nuevos días:", nuevosDias);

      return {
        ...prev,
        dias_seleccionados: nuevosDias,
      };
    });
  };

  // Mostrar selector de hora
  const mostrarSelectorHora = () => {
    setHorarioEditando(null); // Nuevo horario
    setShowTimePicker(true);
  };

  // Agregar horario
  const agregarHorario = () => {
    const diasSeleccionados = programacionData.dias_seleccionados || [];
    if (diasSeleccionados.length === 0) {
      alert("No hay días seleccionados");
      return;
    }

    const nuevoHorario = {
      hora: horarioTemporal || "08:00",
      dosis: programacionData.dosis_por_toma || "1",
    };

    setProgramacionData((prev) => ({
      ...prev,
      horarios: [...(prev.horarios || []), nuevoHorario],
    }));
  };

  // Eliminar horario
  const eliminarHorario = (horarioIndex) => {
    const horario = programacionData.horarios[horarioIndex];
    Alert.alert(
      "Eliminar Horario",
      `¿Estás seguro de que quieres eliminar el horario de las ${
        horario?.hora || "00:00"
      }?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setProgramacionData((prev) => ({
              ...prev,
              horarios: (prev.horarios || []).filter(
                (_, index) => index !== horarioIndex
              ),
            }));
          },
        },
      ]
    );
  };

  // Cambiar hora de un horario
  const cambiarHora = (horarioIndex, nuevaHora) => {
    setProgramacionData((prev) => ({
      ...prev,
      horarios: (prev.horarios || []).map((horario, index) =>
        index === horarioIndex ? { ...horario, hora: nuevaHora } : horario
      ),
    }));
  };

  // Avanzar al paso de horarios
  const avanzarAHorarios = () => {
    if (selectedPastilla) {
      setCurrentStep(2); // Ahora va al paso 2 (nombre y fecha)
    }
  };

  const avanzarADias = () => {
    setCurrentStep(3); // Va al paso 3 (días)
  };

  // Avanzar al paso de confirmación
  const avanzarAConfirmacion = () => {
    const diasSeleccionados = programacionData.dias_seleccionados || [];
    if (diasSeleccionados.length === 0) {
      alert("Selecciona al menos un día de la semana");
      return;
    }

    setCurrentStep(4); // Ahora va al paso 4 (horarios)
  };

  const avanzarAConfirmacionFinal = () => {
    const horariosConfigurados = programacionData.horarios || [];
    if (horariosConfigurados.length === 0) {
      alert("Configura al menos un horario");
      return;
    }

    // No necesitamos preparar los horarios aquí, solo avanzar al paso 5
    setCurrentStep(5); // Va al paso 5 (confirmación)
  };

  // Crear programación (simplificado)
  const crearProgramacion = async () => {
    setLoading(true);

    try {
      const diasSeleccionados = programacionData.dias_seleccionados || [];
      const horariosConfigurados = programacionData.horarios || [];

      // Preparar horarios en el formato correcto para la tabla horarios_tratamiento
      const horariosParaAPI = horariosConfigurados.flatMap((horario) =>
        diasSeleccionados.map((dia) => ({
          dia_semana: dia,
          hora: horario.hora + ":00", // Agregar segundos al formato de hora
          dosis: horario.dosis,
          activo: 1,
        }))
      );

      const dataToSend = {
        usuario_id: user.usuario_id,
        remedio_global_id: selectedPastilla.remedio_global_id,
        nombre_tratamiento:
          programacionData.nombre_tratamiento ||
          selectedPastilla.nombre_comercial,
        fecha_inicio: new Date().toISOString().split("T")[0],
        fecha_fin: programacionData.fecha_fin
          ? programacionData.fecha_fin.toISOString().split("T")[0]
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
        dosis_por_toma: programacionData.dosis_por_toma,
        observaciones: "",
        horarios: horariosParaAPI,
        alarmas_activas: true,
      };

      console.log("📤 Enviando datos:", dataToSend);

      if (editandoProgramacion) {
        // Si estamos editando, usar el endpoint de edición
        await actualizarProgramacion(editandoProgramacion.programacion_id);
      } else {
        // Si estamos creando, usar el endpoint de creación
        const response = await apiRequest("/crear_programacion.php", {
          method: "POST",
          body: JSON.stringify(dataToSend),
        });

        console.log("📥 Respuesta:", response);

        if (response.success && response.data.success) {
          alert("¡Tratamiento programado exitosamente!");
          setModalVisible(false);
          resetearFormulario();
          cargarProgramaciones();
        } else {
          alert("Error: " + (response.data?.error || "Error desconocido"));
        }
      }
    } catch (error) {
      alert("Error de conexión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario (simplificado)
  const resetearFormulario = () => {
    setCurrentStep(1);
    setSelectedPastilla(null);
    setEditandoProgramacion(null); // Resetear editandoProgramacion
    setProgramacionData({
      nombre_tratamiento: "",
      fecha_fin: null,
      dosis_por_toma: "1 tableta",
      dias_seleccionados: [],
      horarios: [],
    });
    setSelectedDias([]);
    setHorariosConfigurados([]);
    setHorarioTemporal("08:00");
    setHorarioEditando(null);
    setShowDatePicker(false);
    setSearchText("");
    // Limpiar también las listas de pastillas para forzar recarga
    setPastillas([]);
    setFilteredPastillas([]);
    setError(null);
  };

  // Función para editar programación
  const editarProgramacion = (programacion) => {
    console.log("🔧 Editando programación:", programacion);

    setEditandoProgramacion(programacion);
    setSelectedPastilla({
      remedio_global_id: programacion.remedio_global_id,
      nombre_comercial: programacion.nombre_comercial,
    });

    // Obtener horarios reales - usar la misma lógica que en renderProgramacion
    const horariosReales = (() => {
      if (!programacion.horarios) return [];

      if (
        Array.isArray(programacion.horarios) &&
        programacion.horarios.length > 0
      ) {
        const primerElemento = programacion.horarios[0];
        if (Array.isArray(primerElemento)) {
          return primerElemento;
        }
        return programacion.horarios;
      }

      return [];
    })();

    console.log("📅 Horarios reales:", horariosReales);
    console.log("📅 Estructura del primer horario:", horariosReales[0]);

    // Convertir horarios al formato del formulario
    const horariosFormato = horariosReales.map((horario) => ({
      dia: horario.dia_semana || horario.dia || horario.dias,
      hora: horario.hora,
      dosis: horario.dosis,
    }));

    const diasSeleccionados = [
      ...new Set(horariosReales.map((h) => h.dia_semana || h.dia || h.dias)),
    ];
    console.log("📅 Días seleccionados:", diasSeleccionados);
    console.log("📅 Horarios reales para extraer días:", horariosReales);

    setProgramacionData({
      nombre_tratamiento:
        programacion.nombre_tratamiento || programacion.nombre_comercial,
      fecha_fin: programacion.fecha_fin
        ? new Date(programacion.fecha_fin)
        : null,
      dosis_por_toma: programacion.dosis_por_toma
        ? programacion.dosis_por_toma.replace(" tableta(s)", "")
        : "1 tableta",
      dias_seleccionados: diasSeleccionados,
      horarios: horariosFormato,
    });

    // No necesitamos setSelectedDias ya que usamos programacionData.dias_seleccionados
    setHorariosConfigurados(horariosFormato);
    setCurrentStep(1);
    setModalVisible(true);
  };

  // Función para actualizar programación usando el endpoint de edición
  const actualizarProgramacion = async (programacionId, datosActualizados) => {
    try {
      const diasSeleccionados = programacionData.dias_seleccionados || [];
      const horariosConfigurados = programacionData.horarios || [];

      console.log("📤 Días seleccionados para actualizar:", diasSeleccionados);
      console.log(
        "📤 Horarios configurados para actualizar:",
        horariosConfigurados
      );

      // Preparar horarios en el formato correcto para la tabla horarios_tratamiento
      const horariosParaAPI = horariosConfigurados.flatMap((horario) =>
        diasSeleccionados.map((dia) => ({
          dia_semana: dia,
          hora: horario.hora + ":00", // Agregar segundos al formato de hora
          dosis: horario.dosis,
          activo: 1,
        }))
      );

      console.log("📊 Cálculo de horarios:");
      console.log("📊 Horarios configurados:", horariosConfigurados.length);
      console.log("📊 Días seleccionados:", diasSeleccionados.length);
      console.log(
        "📊 Total esperado:",
        horariosConfigurados.length * diasSeleccionados.length
      );
      console.log("📊 Total generado:", horariosParaAPI.length);

      // Alert temporal para ver la información
      alert(
        `DEBUG:\nHorarios: ${horariosConfigurados.length}\nDías: ${
          diasSeleccionados.length
        }\nTotal esperado: ${
          horariosConfigurados.length * diasSeleccionados.length
        }\nTotal generado: ${horariosParaAPI.length}`
      );
      console.log("📤 Horarios para API:", horariosParaAPI);

      const dataToSend = {
        programacion_id: programacionId,
        nombre_tratamiento:
          programacionData.nombre_tratamiento ||
          selectedPastilla.nombre_comercial,
        fecha_fin: programacionData.fecha_fin
          ? programacionData.fecha_fin.toISOString().split("T")[0]
          : null,
        dosis_por_toma: programacionData.dosis_por_toma,
        observaciones: "",
        horarios: horariosParaAPI,
        alarmas_activas: true,
      };

      console.log("📤 Enviando datos de actualización:", dataToSend);
      console.log("📤 Programación ID:", programacionId);
      console.log("📤 Días seleccionados:", diasSeleccionados);
      console.log("📤 Horarios configurados:", horariosConfigurados);
      console.log("📤 Horarios para API:", horariosParaAPI);

      const response = await apiRequest(`/editar_tratamiento.php`, {
        method: "POST",
        body: JSON.stringify(dataToSend),
      });

      console.log("📥 Respuesta del servidor:", response);
      console.log("📥 Success:", response.success);
      console.log("📥 Data:", response.data);

      // Alert temporal para ver la respuesta
      alert(
        `RESPUESTA:\nSuccess: ${response.success}\nData: ${JSON.stringify(
          response.data
        )}`
      );

      if (response.success) {
        console.log("✅ Tratamiento actualizado exitosamente");
        alert("Tratamiento actualizado exitosamente");
        setModalVisible(false);
        resetearFormulario();
        setEditandoProgramacion(null);

        // Forzar recarga de programaciones
        console.log("🔄 Recargando programaciones después de actualizar...");
        await cargarProgramaciones();
        console.log("✅ Programaciones recargadas");
      } else {
        alert(
          "Error: " +
            (response.data?.error || response.error || "Error desconocido")
        );
      }
    } catch (error) {
      console.error("Error actualizando programación:", error);
      alert("Error de conexión: " + error.message);
    }
  };

  // Función para confirmar eliminación
  const confirmarEliminarProgramacion = (programacion) => {
    Alert.alert(
      "Eliminar Tratamiento",
      `¿Estás seguro de que quieres eliminar el tratamiento "${programacion.nombre_tratamiento}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => eliminarProgramacion(programacion.programacion_id),
        },
      ]
    );
  };

  // Función para eliminar programación
  const eliminarProgramacion = async (programacionId) => {
    try {
      const response = await apiRequest(`/eliminar_programacion.php`, {
        method: "POST",
        body: JSON.stringify({
          programacion_id: programacionId,
        }),
      });

      if (response.success) {
        alert("Tratamiento eliminado exitosamente");
        cargarProgramaciones(); // Recargar la lista
      } else {
        alert("Error: " + (response.error || "Error desconocido"));
      }
    } catch (error) {
      alert("Error de conexión: " + error.message);
    }
  };

  // Función para cambiar estado del tratamiento (activar/desactivar)
  const cambiarEstadoProgramacion = async (programacionId, nuevoEstado) => {
    try {
      const response = await apiRequest(`/editar_tratamiento.php`, {
        method: "POST",
        body: JSON.stringify({
          programacion_id: programacionId,
          estado: nuevoEstado,
        }),
      });

      if (response.success) {
        alert(
          `Tratamiento ${
            nuevoEstado === "activo" ? "activado" : "desactivado"
          } exitosamente`
        );
        await cargarProgramaciones(); // Recargar la lista
        // Actualizar el estado local del modal si está abierto
        if (
          programacionDetalles &&
          programacionDetalles.programacion_id === programacionId
        ) {
          setProgramacionDetalles((prev) => ({
            ...prev,
            estado: nuevoEstado,
          }));
        }
      } else {
        alert("Error: " + (response.error || "Error desconocido"));
      }
    } catch (error) {
      alert("Error de conexión: " + error.message);
    }
  };

  // Renderizar item de pastilla
  const renderPastillaItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.pastillaItem,
        editandoProgramacion ? styles.pastillaItemDisabled : null,
      ]}
      onPress={() => seleccionarPastilla(item)}
      onLongPress={() => mostrarDetallesPastilla(item)}
      delayLongPress={500}
      disabled={!!editandoProgramacion}
    >
      <View style={styles.pastillaInfo}>
        <Text style={styles.pastillaNombre}>{item.nombre_comercial}</Text>
        <Text style={styles.pastillaDescripcion}>{item.descripcion}</Text>
        <View style={styles.pastillaDetails}>
          {item.presentacion && (
            <Text style={styles.pastillaPresentacion}>{item.presentacion}</Text>
          )}
          {item.peso_unidad && (
            <Text style={styles.pastillaPeso}>{item.peso_unidad} mg</Text>
          )}
        </View>
        <Text style={styles.longPressHint}>
          Mantén presionado para ver detalles
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#7A2C34" />
    </TouchableOpacity>
  );

  // Renderizar header del modal con progreso (simplificado)
  const renderModalHeader = () => (
    <View style={styles.modalHeader}>
      <View style={styles.progressContainer}>
        <View style={styles.modalTitleContainer}>
          <MaterialCommunityIcons
            name={editandoProgramacion ? "pencil" : "plus-circle"}
            size={24}
            color="#7A2C34"
          />
          <Text style={styles.modalTitle}>
            {editandoProgramacion
              ? "Editando Tratamiento"
              : "Agregando Tratamiento"}
          </Text>
        </View>
        <Text style={styles.modalSubtitle}>
          {currentStep === 1 && "Paso 1: Seleccionar medicamento"}
          {currentStep === 2 && "Paso 2: Detalles del tratamiento"}
          {currentStep === 3 && "Paso 3: ¿Qué días?"}
          {currentStep === 4 && "Paso 4: ¿A qué hora?"}
          {currentStep === 5 && "Paso 5: Confirmar"}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / 5) * 100}%` },
            ]}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={() => {
          setModalVisible(false);
          resetearFormulario();
        }}
        style={styles.closeButton}
      >
        <MaterialCommunityIcons name="close" size={24} color="#7A2C34" />
      </TouchableOpacity>
    </View>
  );

  // Renderizar barra de búsqueda (solo en paso 1)
  const renderSearchBar = () => {
    if (currentStep !== 1) return null;

    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#7A2C34"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pastilla..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={filtrarPastillas}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => filtrarPastillas("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Renderizar paso 3: Días
  const renderDias = () => {
    if (currentStep !== 3) return null;

    const diasSemana = [
      { key: "lunes", label: "Lun", fullLabel: "Lunes", icon: "calendar-week" },
      {
        key: "martes",
        label: "Mar",
        fullLabel: "Martes",
        icon: "calendar-week",
      },
      {
        key: "miercoles",
        label: "Mié",
        fullLabel: "Miércoles",
        icon: "calendar-week",
      },
      {
        key: "jueves",
        label: "Jue",
        fullLabel: "Jueves",
        icon: "calendar-week",
      },
      {
        key: "viernes",
        label: "Vie",
        fullLabel: "Viernes",
        icon: "calendar-week",
      },
      {
        key: "sabado",
        label: "Sáb",
        fullLabel: "Sábado",
        icon: "calendar-weekend",
      },
      {
        key: "domingo",
        label: "Dom",
        fullLabel: "Domingo",
        icon: "calendar-weekend",
      },
    ];

    const diasSeleccionados = programacionData.dias_seleccionados || [];
    console.log(
      "🎯 Renderizando días - días seleccionados:",
      diasSeleccionados
    );
    console.log("🎯 Estado completo de programacionData:", programacionData);

    return (
      <View style={styles.configuracionContainer}>
        {/* Header con información del medicamento */}
        <View style={styles.stepHeader}>
          <MaterialCommunityIcons name="pill" size={24} color="#7A2C34" />
          <View style={styles.stepHeaderContent}>
            <Text style={styles.stepHeaderTitle}>Medicamento seleccionado</Text>
            <Text style={styles.stepHeaderSubtitle}>
              {selectedPastilla?.nombre_comercial}
            </Text>
          </View>
        </View>

        {/* Sección de días */}
        <View style={styles.diasSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="calendar-multiple"
              size={20}
              color="#7A2C34"
            />
            <Text style={styles.sectionTitle}>Selecciona los días</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Elige los días de la semana en los que tomarás tu medicamento
          </Text>

          <View style={styles.diasGrid}>
            {diasSemana.map((dia) => {
              const isSelected = diasSeleccionados.includes(dia.key);
              return (
                <TouchableOpacity
                  key={dia.key}
                  style={[
                    styles.diaCard,
                    isSelected ? styles.diaCardSelected : null,
                  ]}
                  onPress={() => toggleDia(dia.key)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={dia.icon}
                    size={20}
                    color={isSelected ? "#ffffff" : "#7A2C34"}
                  />
                  <Text
                    style={[
                      styles.diaCardText,
                      isSelected ? styles.diaCardTextSelected : null,
                    ]}
                  >
                    {dia.label}
                  </Text>
                  <Text
                    style={[
                      styles.diaCardFullText,
                      isSelected ? styles.diaCardFullTextSelected : null,
                    ]}
                  >
                    {dia.fullLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Resumen de selección */}
        {diasSeleccionados.length > 0 && (
          <View style={styles.selectionSummary}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color="#28a745"
            />
            <Text style={styles.selectionSummaryText}>
              {diasSeleccionados.length} día
              {diasSeleccionados.length !== 1 ? "s" : ""} seleccionado
              {diasSeleccionados.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Renderizar paso 4: Horarios
  const renderHorarios = () => {
    if (currentStep !== 4) return null;

    const diasSemana = [
      { key: "lunes", label: "Lunes" },
      { key: "martes", label: "Martes" },
      { key: "miercoles", label: "Miércoles" },
      { key: "jueves", label: "Jueves" },
      { key: "viernes", label: "Viernes" },
      { key: "sabado", label: "Sábado" },
      { key: "domingo", label: "Domingo" },
    ];

    const diasSeleccionados = programacionData.dias_seleccionados || [];
    const horariosConfigurados = programacionData.horarios || [];

    return (
      <View style={styles.configuracionContainer}>
        {/* Pastilla seleccionada */}
        <View style={styles.selectedPastillaCard}>
          <Text style={styles.selectedPastillaTitle}>Tu medicamento:</Text>
          <Text style={styles.selectedPastillaNombre}>
            {selectedPastilla?.nombre_comercial}
          </Text>
        </View>

        {/* Días seleccionados */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Días seleccionados:</Text>
          <Text style={styles.diasSeleccionadosText}>
            {diasSeleccionados
              .map((dia) => {
                const diaInfo = diasSemana.find((d) => d.key === dia);
                return diaInfo?.label;
              })
              .join(", ")}
          </Text>
        </View>

        {/* Horarios configurados */}
        <View style={styles.horariosContainer}>
          <View style={styles.horariosTitleContainer}>
            <MaterialCommunityIcons
              name="table-clock"
              size={20}
              color="#7A2C34"
            />
            <Text style={styles.horariosTitle}>Horarios Programados</Text>
          </View>
          {horariosConfigurados.length > 0 ? (
            <>
              <Text style={styles.horariosSubtitle}>
                Toca un horario para editarlo o usa el botón "Eliminar" para
                quitarlo
              </Text>
              {horariosConfigurados.map((horario, index) => (
                <View key={index} style={styles.horarioItem}>
                  <View style={styles.horarioInfo}>
                    <TouchableOpacity
                      style={styles.horaButton}
                      onPress={() => {
                        setShowTimePicker(true);
                        setHorarioEditando(index);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={16}
                        color="#7A2C34"
                      />
                      <Text style={styles.horarioHora}>{horario.hora}</Text>
                      <MaterialCommunityIcons
                        name="pencil"
                        size={14}
                        color="#7A2C34"
                      />
                    </TouchableOpacity>
                    <View style={styles.horarioDetails}>
                      <Text style={styles.horarioDosisText}>
                        {horario.dosis || "1 tableta"}
                      </Text>
                      <Text style={styles.horarioInfoText}>
                        Horario #{index + 1}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => eliminarHorario(index)}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.noHorariosContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={48}
                color="#ccc"
              />
              <Text style={styles.noHorariosText}>
                No hay horarios configurados
              </Text>
              <Text style={styles.noHorariosSubtext}>
                Agrega al menos un horario para continuar
              </Text>
            </View>
          )}
        </View>

        {/* Botón para agregar horario */}
        <TouchableOpacity
          style={styles.agregarHorarioButton}
          onPress={agregarHorario}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.agregarHorarioText}>Agregar Horario</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Renderizar paso 5: Confirmación
  const renderConfirmacion = () => {
    if (currentStep !== 5) return null;

    const diasMap = {
      lunes: "Lunes",
      martes: "Martes",
      miercoles: "Miércoles",
      jueves: "Jueves",
      viernes: "Viernes",
      sabado: "Sábado",
      domingo: "Domingo",
    };

    const diasSeleccionados = programacionData.dias_seleccionados || [];
    const horariosConfigurados = programacionData.horarios || [];

    return (
      <View style={styles.step5Container}>
        {/* Header del paso 5 */}
        <View style={styles.step5Header}>
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color="#7A2C34"
          />
          <View style={styles.step5HeaderContent}>
            <Text style={styles.step5Title}>
              {editandoProgramacion
                ? "Resumen de cambios"
                : "Resumen de tu tratamiento"}
            </Text>
            <Text style={styles.step5Subtitle}>
              {editandoProgramacion
                ? "Revisa los cambios antes de actualizar"
                : "Revisa todos los detalles antes de confirmar"}
            </Text>
          </View>
        </View>

        {/* Tarjeta principal de confirmación */}
        <View style={styles.confirmacionCard}>
          {/* Información básica */}
          <View style={styles.confirmacionSection}>
            <View style={styles.confirmacionItem}>
              <View style={styles.confirmacionLabelContainer}>
                <MaterialCommunityIcons name="pill" size={18} color="#7A2C34" />
                <Text style={styles.confirmacionLabel}>Medicamento:</Text>
              </View>
              <Text style={styles.confirmacionValue}>
                {selectedPastilla?.nombre_comercial}
              </Text>
            </View>

            {programacionData.nombre_tratamiento && (
              <View style={styles.confirmacionItem}>
                <View style={styles.confirmacionLabelContainer}>
                  <MaterialCommunityIcons
                    name="tag"
                    size={18}
                    color="#7A2C34"
                  />
                  <Text style={styles.confirmacionLabel}>
                    Nombre del tratamiento:
                  </Text>
                </View>
                <Text style={styles.confirmacionValue}>
                  {programacionData.nombre_tratamiento}
                </Text>
              </View>
            )}

            <View style={styles.confirmacionItem}>
              <View style={styles.confirmacionLabelContainer}>
                <MaterialCommunityIcons
                  name="calendar-week"
                  size={18}
                  color="#7A2C34"
                />
                <Text style={styles.confirmacionLabel}>Días:</Text>
              </View>
              <Text style={styles.confirmacionValue}>
                {diasSeleccionados.map((dia) => diasMap[dia]).join(", ")}
              </Text>
            </View>

            {programacionData.fecha_fin && (
              <View style={styles.confirmacionItem}>
                <View style={styles.confirmacionLabelContainer}>
                  <MaterialCommunityIcons
                    name="calendar-end"
                    size={18}
                    color="#7A2C34"
                  />
                  <Text style={styles.confirmacionLabel}>
                    Fecha de finalización:
                  </Text>
                </View>
                <Text style={styles.confirmacionValue}>
                  {programacionData.fecha_fin.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* Detalle de horarios */}
          {horariosConfigurados.length > 0 && (
            <View style={styles.horariosDetalleContainer}>
              <View style={styles.horariosDetalleHeader}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="#7A2C34"
                />
                <Text style={styles.horariosDetalleTitle}>
                  Detalle de horarios:
                </Text>
              </View>
              <View style={styles.horariosDetalleList}>
                {horariosConfigurados.map((horario, index) => (
                  <View key={index} style={styles.horarioDetalleItem}>
                    <MaterialCommunityIcons
                      name="circle-small"
                      size={24}
                      color="#7A2C34"
                    />
                    <Text style={styles.horarioDetalleText}>
                      {horario.hora} - {horario.dosis}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Información adicional */}
        <View style={styles.confirmacionInfoContainer}>
          <MaterialCommunityIcons name="information" size={16} color="#666" />
          <Text style={styles.confirmacionInfoText}>
            {editandoProgramacion
              ? "Al confirmar, se actualizará tu tratamiento con los nuevos datos"
              : "Al confirmar, se creará tu tratamiento y podrás recibir recordatorios"}
          </Text>
        </View>
      </View>
    );
  };

  // Renderizar programación individual
  const renderProgramacion = (programacion) => {
    const nombreTratamiento =
      programacion.nombre_tratamiento ||
      programacion.nombre_comercial ||
      "Sin nombre";

    return (
      <TouchableOpacity
        key={programacion.programacion_id}
        style={styles.programacionCard}
        onPress={() => mostrarDetallesProgramacion(programacion)}
        activeOpacity={0.7}
      >
        <View style={styles.programacionHeader}>
          <View style={styles.programacionInfo}>
            <Text style={styles.programacionNombre}>{nombreTratamiento}</Text>
            <Text style={styles.programacionMedicamento}>
              {programacion.nombre_comercial || "Medicamento"}
            </Text>
          </View>
          <View style={styles.programacionActions}>
            <View
              style={[
                styles.estadoBadge,
                programacion.estado === "activo"
                  ? styles.estadoActivo
                  : styles.estadoInactivo,
              ]}
            >
              <MaterialCommunityIcons
                name={
                  programacion.estado === "activo"
                    ? "check-circle"
                    : "pause-circle"
                }
                size={16}
                color={programacion.estado === "activo" ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.estadoText,
                  programacion.estado === "activo"
                    ? styles.estadoTextActivo
                    : styles.estadoTextInactivo,
                ]}
              >
                {programacion.estado === "activo" ? "Activo" : "Inactivo"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetallesProgramacion = () => {
    if (!programacionDetalles || modalTipo !== "programacion") return null;

    // Mapeo de días
    const diasMap = {
      lunes: "Lunes",
      martes: "Martes",
      miercoles: "Miércoles",
      jueves: "Jueves",
      viernes: "Viernes",
      sabado: "Sábado",
      domingo: "Domingo",
    };

    // Funciones auxiliares
    const formatearFecha = (fecha) => {
      if (!fecha) return "";
      const date = new Date(fecha);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const formatearHora = (hora) => {
      if (!hora) return "";
      return hora.substring(0, 5); // Solo HH:MM
    };

    // Obtener horarios reales
    const horariosReales = (() => {
      if (!programacionDetalles.horarios) {
        return [];
      }

      if (
        Array.isArray(programacionDetalles.horarios) &&
        programacionDetalles.horarios.length > 0
      ) {
        const primerElemento = programacionDetalles.horarios[0];
        if (Array.isArray(primerElemento)) {
          return primerElemento;
        }
        return programacionDetalles.horarios;
      }

      return [];
    })();

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalDetallesVisible}
        onRequestClose={() => setModalDetallesVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDetallesContent}>
            {/* Header del modal */}
            <View style={styles.modalDetallesHeader}>
              <Text style={styles.modalDetallesTitle}>
                {programacionDetalles.nombre_tratamiento ||
                  programacionDetalles.nombre_comercial ||
                  "Detalles del Tratamiento"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setModalDetallesVisible(false);
                  setModalTipo(null);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Contenido del modal */}
            <ScrollView style={styles.modalDetallesBody}>
              {/* Información básica */}
              <View style={styles.detalleItem}>
                <MaterialCommunityIcons name="pill" size={20} color="#7A2C34" />
                <View style={styles.detalleContent}>
                  <Text style={styles.detalleLabel}>Medicamento:</Text>
                  <Text style={styles.detalleValue}>
                    {programacionDetalles.nombre_comercial || "No especificado"}
                  </Text>
                </View>
              </View>

              {/* Estado */}
              <View style={styles.detalleItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#7A2C34"
                />
                <View style={styles.detalleContent}>
                  <Text style={styles.detalleLabel}>Estado:</Text>
                  <Text style={styles.detalleValue}>
                    {programacionDetalles.estado === "activo"
                      ? "Activo"
                      : "Inactivo"}
                  </Text>
                </View>
              </View>

              {/* Fecha de fin */}
              {programacionDetalles.fecha_fin && (
                <View style={styles.detalleItem}>
                  <MaterialCommunityIcons
                    name="calendar-end"
                    size={20}
                    color="#7A2C34"
                  />
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Fecha de fin:</Text>
                    <Text style={styles.detalleValue}>
                      {formatearFecha(programacionDetalles.fecha_fin)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Horarios */}
              <View style={styles.horariosDetalleContainer}>
                <View style={styles.horariosDetalleHeader}>
                  <MaterialCommunityIcons
                    name="table-clock"
                    size={20}
                    color="#7A2C34"
                  />
                  <Text style={styles.horariosDetalleTitle}>
                    Horarios Programados
                  </Text>
                </View>

                {horariosReales && horariosReales.length > 0 ? (
                  <View style={styles.tablaContainer}>
                    {/* Encabezado de la tabla */}
                    <View style={styles.tablaHeader}>
                      <View style={styles.tablaHeaderCell}>
                        <Text style={styles.tablaHeaderText}>Día</Text>
                      </View>
                      <View style={styles.tablaHeaderCell}>
                        <Text style={styles.tablaHeaderText}>Hora</Text>
                      </View>
                    </View>

                    {/* Filas de la tabla */}
                    {horariosReales.map((horario, index) => (
                      <View key={index} style={styles.tablaRow}>
                        <View style={styles.tablaCell}>
                          <Text style={styles.tablaCellText}>
                            {diasMap[
                              horario.dia || horario.dias || horario.dia_semana
                            ] || "N/A"}
                          </Text>
                        </View>
                        <View style={styles.tablaCell}>
                          <Text style={styles.tablaCellText}>
                            {formatearHora(horario.hora || "00:00")}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noHorariosContainer}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={24}
                      color="#999"
                    />
                    <Text style={styles.noHorariosText}>
                      Sin horarios configurados
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer con botones de acción */}
            <View style={styles.modalDetallesFooter}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setModalDetallesVisible(false);
                  setModalTipo(null);
                  editarProgramacion(programacionDetalles);
                }}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  programacionDetalles.estado === "activo"
                    ? styles.deactivateButton
                    : styles.activateButton,
                ]}
                onPress={() => {
                  const nuevoEstado =
                    programacionDetalles.estado === "activo"
                      ? "inactivo"
                      : "activo";
                  cambiarEstadoProgramacion(
                    programacionDetalles.programacion_id,
                    nuevoEstado
                  );
                }}
              >
                <MaterialCommunityIcons
                  name={
                    programacionDetalles.estado === "activo"
                      ? "pause-circle"
                      : "play-circle"
                  }
                  size={20}
                  color="#fff"
                />
                <Text style={styles.actionButtonText}>
                  {programacionDetalles.estado === "activo"
                    ? "Desactivar"
                    : "Activar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  setModalDetallesVisible(false);
                  setModalTipo(null);
                  confirmarEliminarProgramacion(programacionDetalles);
                }}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Renderizar modal de detalles de pastilla
  const renderModalDetalles = () => {
    if (!pastillaDetalles || modalTipo !== "pastilla") return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalDetallesVisible}
        onRequestClose={() => {
          setModalDetallesVisible(false);
          setModalTipo(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDetallesContent}>
            {/* Header */}
            <View style={styles.modalDetallesHeader}>
              <View style={styles.modalDetallesHeaderContent}>
                <MaterialCommunityIcons name="pill" size={24} color="#7A2C34" />
                <Text style={styles.modalDetallesTitle}>
                  Información del Medicamento
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setModalDetallesVisible(false);
                  setModalTipo(null);
                }}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Contenido */}
            <ScrollView
              style={styles.modalDetallesBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalDetallesBodyContent}
            >
              {/* Nombre del medicamento destacado */}
              <View style={styles.medicamentoCard}>
                <MaterialCommunityIcons name="pill" size={32} color="#7A2C34" />
                <Text style={styles.medicamentoNombre}>
                  {pastillaDetalles.nombre_comercial}
                </Text>
              </View>

              {/* Información detallada */}
              <View style={styles.detallesContainer}>
                <View style={styles.detalleItem}>
                  <MaterialCommunityIcons
                    name="information"
                    size={20}
                    color="#7A2C34"
                  />
                  <View style={styles.detalleContent}>
                    <Text style={styles.detalleLabel}>Descripción:</Text>
                    <Text style={styles.detalleValue}>
                      {pastillaDetalles.descripcion}
                    </Text>
                  </View>
                </View>

                {pastillaDetalles.presentacion && (
                  <View style={styles.detalleItem}>
                    <MaterialCommunityIcons
                      name="package-variant"
                      size={20}
                      color="#7A2C34"
                    />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Presentación:</Text>
                      <Text style={styles.detalleValue}>
                        {pastillaDetalles.presentacion}
                      </Text>
                    </View>
                  </View>
                )}

                {pastillaDetalles.peso_unidad && (
                  <View style={styles.detalleItem}>
                    <MaterialCommunityIcons
                      name="scale-balance"
                      size={20}
                      color="#7A2C34"
                    />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Peso por Unidad:</Text>
                      <Text style={styles.detalleValue}>
                        {pastillaDetalles.peso_unidad} mg
                      </Text>
                    </View>
                  </View>
                )}

                {pastillaDetalles.efectos_secundarios && (
                  <View style={styles.detalleItem}>
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={20}
                      color="#ff6b6b"
                    />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>
                        Efectos Secundarios:
                      </Text>
                      <Text style={styles.detalleValue}>
                        {pastillaDetalles.efectos_secundarios}
                      </Text>
                    </View>
                  </View>
                )}

                {pastillaDetalles.estado && (
                  <View style={styles.detalleItem}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color="#28a745"
                    />
                    <View style={styles.detalleContent}>
                      <Text style={styles.detalleLabel}>Estado:</Text>
                      <Text style={styles.detalleValue}>
                        {pastillaDetalles.estado}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Botón para seleccionar */}
            <View style={styles.modalDetallesFooter}>
              <TouchableOpacity
                style={styles.seleccionarButton}
                onPress={() => {
                  setModalDetallesVisible(false);
                  setModalTipo(null);
                  seleccionarPastilla(pastillaDetalles);
                }}
              >
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.seleccionarButtonText}>
                  Seleccionar este medicamento
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Renderizar botones de navegación
  const renderNavigationButtons = () => {
    return (
      <>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.navButtonText}>Atrás</Text>
          </TouchableOpacity>
        )}

        {currentStep === 1 && (
          <>
            {editandoProgramacion ? (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonPrimary]}
                onPress={() => setCurrentStep(2)}
              >
                <Text
                  style={[styles.navButtonText, styles.navButtonTextPrimary]}
                >
                  Continuar
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonPrimary]}
                onPress={() => setModalVisible(false)}
              >
                <Text
                  style={[styles.navButtonText, styles.navButtonTextPrimary]}
                >
                  Cerrar
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {currentStep === 2 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={avanzarADias}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              Continuar
            </Text>
          </TouchableOpacity>
        )}

        {currentStep === 3 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={avanzarAConfirmacion}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              Continuar
            </Text>
          </TouchableOpacity>
        )}

        {currentStep === 4 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={avanzarAConfirmacionFinal}
          >
            <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
              Continuar
            </Text>
          </TouchableOpacity>
        )}

        {currentStep === 5 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={crearProgramacion}
            disabled={!!loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                {editandoProgramacion
                  ? "Actualizar tratamiento"
                  : "Guardar tratamiento"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <StatusBar backgroundColor="#7A2C34" barStyle="light-content" />

      {/* Contenido Principal */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7A2C34"]}
            tintColor="#7A2C34"
          />
        }
      >
        {/* Botón Programar Medicamento */}
        <TouchableOpacity
          style={styles.agregarButton}
          onPress={abrirSelectorPastillas}
        >
          <View style={styles.agregarButtonContent}>
            <View style={styles.agregarButtonTextContainer}>
              <Text style={styles.agregarText}>Programar Tratamiento</Text>
              <Text style={styles.agregarSubtext}>
                Crear un nuevo tratamiento médico
              </Text>
            </View>
            <View style={styles.plusIcon}>
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Lista de Programaciones */}
        <View style={styles.programacionesContainer}>
          <View style={styles.programacionesHeader}>
            <MaterialCommunityIcons
              name="clipboard-list"
              size={20}
              color="#7A2C34"
            />
            <Text style={styles.programacionesTitle}>Tratamientos Activos</Text>
          </View>

          {loadingProgramaciones ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7A2C34" />
              <Text style={styles.loadingText}>Cargando tratamientos...</Text>
            </View>
          ) : Array.isArray(programaciones) && programaciones.length > 0 ? (
            (() => {
              console.log(
                "🎯 Renderizando programaciones:",
                programaciones.length,
                "tratamientos"
              );
              return programaciones.map((programacion) => {
                try {
                  return renderProgramacion(programacion);
                } catch (error) {
                  console.log(
                    "🔍 Error al renderizar programación individual:",
                    error
                  );
                  return (
                    <View
                      key={`error-${Date.now()}`}
                      style={styles.programacionCard}
                    >
                      <Text style={styles.errorText}>
                        Error al cargar programación
                      </Text>
                    </View>
                  );
                }
              });
            })()
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="pill" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                No tienes tratamientos programados
              </Text>
              <Text style={styles.emptySubtext}>
                Toca "Programar tratamiento" para crear tu primer tratamiento
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para programación de medicamentos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderModalHeader()}

            {/* Contenido del modal */}
            {currentStep === 1 ? (
              <View style={styles.step1Container}>
                {editandoProgramacion && (
                  <View style={styles.editandoInfoContainer}>
                    <MaterialCommunityIcons
                      name="information"
                      size={16}
                      color="#7A2C34"
                    />
                    <Text style={styles.editandoInfoText}>
                      Editando:{" "}
                      {editandoProgramacion.nombre_tratamiento ||
                        editandoProgramacion.nombre_comercial}
                    </Text>
                  </View>
                )}
                {editandoProgramacion ? (
                  <View style={styles.medicamentoBloqueadoContainer}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={24}
                      color="#7A2C34"
                    />
                    <View style={styles.medicamentoBloqueadoContent}>
                      <Text style={styles.medicamentoBloqueadoTitle}>
                        Medicamento seleccionado
                      </Text>
                      <Text style={styles.medicamentoBloqueadoValue}>
                        {selectedPastilla?.nombre_comercial}
                      </Text>
                      <Text style={styles.medicamentoBloqueadoInfo}>
                        No se puede cambiar el medicamento al editar
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {renderSearchBar()}

                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#7A2C34" />
                        <Text style={styles.loadingText}>
                          Cargando pastillas...
                        </Text>
                      </View>
                    ) : error ? (
                      <View style={styles.errorContainer}>
                        <MaterialCommunityIcons
                          name="alert-circle"
                          size={48}
                          color="#ff6b6b"
                        />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={() => {
                            console.log(
                              "🔄 Reintentando carga de pastillas..."
                            );
                            cargarPastillas();
                          }}
                        >
                          <MaterialCommunityIcons
                            name="refresh"
                            size={20}
                            color="#fff"
                          />
                          <Text style={styles.retryButtonText}>Reintentar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : filteredPastillas.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons
                          name="pill"
                          size={48}
                          color="#ccc"
                        />
                        <Text style={styles.emptyText}>
                          {searchText
                            ? "No se encontraron pastillas"
                            : "No hay pastillas registradas"}
                        </Text>
                        {!searchText && (
                          <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                              console.log(
                                "🔄 Recargando pastillas desde botón..."
                              );
                              setPastillas([]);
                              setFilteredPastillas([]);
                              setError(null);
                              cargarPastillas();
                            }}
                          >
                            <MaterialCommunityIcons
                              name="refresh"
                              size={20}
                              color="#fff"
                            />
                            <Text style={styles.retryButtonText}>Recargar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <FlatList
                        data={filteredPastillas}
                        renderItem={renderPastillaItem}
                        keyExtractor={(item) =>
                          item.remedio_global_id?.toString() ||
                          item.id?.toString()
                        }
                        showsVerticalScrollIndicator={false}
                        style={styles.pastillasList}
                        contentContainerStyle={styles.pastillasListContent}
                      />
                    )}
                  </>
                )}

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7A2C34" />
                    <Text style={styles.loadingText}>
                      Cargando pastillas...
                    </Text>
                  </View>
                ) : error ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={48}
                      color="#ff6b6b"
                    />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        console.log("🔄 Reintentando carga de pastillas...");
                        cargarPastillas();
                      }}
                    >
                      <MaterialCommunityIcons
                        name="refresh"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                  </View>
                ) : filteredPastillas.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={48}
                      color="#ccc"
                    />
                    <Text style={styles.emptyText}>
                      {searchText
                        ? "No se encontraron pastillas"
                        : "No hay pastillas registradas"}
                    </Text>
                    {!searchText && (
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                          console.log("🔄 Recargando pastillas desde botón...");
                          setPastillas([]);
                          setFilteredPastillas([]);
                          setError(null);
                          cargarPastillas();
                        }}
                      >
                        <MaterialCommunityIcons
                          name="refresh"
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.retryButtonText}>Recargar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}
              </View>
            ) : (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalBodyContent}
              >
                {currentStep === 2 && (
                  <View style={styles.step2Container}>
                    {/* Header del paso 2 */}
                    <View style={styles.step2Header}>
                      <MaterialCommunityIcons
                        name={editandoProgramacion ? "pencil" : "pencil"}
                        size={24}
                        color="#7A2C34"
                      />
                      <View style={styles.step2HeaderContent}>
                        <Text style={styles.step2Title}>
                          {editandoProgramacion
                            ? "Editar detalles"
                            : "Detalles del tratamiento"}
                        </Text>
                        <Text style={styles.step2Subtitle}>
                          {editandoProgramacion
                            ? "Modifica los detalles de tu tratamiento"
                            : "Personaliza tu tratamiento con un nombre y fecha de finalización"}
                        </Text>
                      </View>
                    </View>

                    {/* Medicamento seleccionado */}
                    <View style={styles.medicamentoSeleccionadoCard}>
                      <MaterialCommunityIcons
                        name="pill"
                        size={20}
                        color="#7A2C34"
                      />
                      <View style={styles.medicamentoSeleccionadoContent}>
                        <Text style={styles.medicamentoSeleccionadoLabel}>
                          Medicamento seleccionado:
                        </Text>
                        <Text style={styles.medicamentoSeleccionadoValue}>
                          {selectedPastilla?.nombre_comercial}
                        </Text>
                        {selectedPastilla?.descripcion && (
                          <Text
                            style={styles.medicamentoSeleccionadoDescripcion}
                          >
                            {selectedPastilla.descripcion}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Nombre del tratamiento */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        Nombre del tratamiento (opcional)
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Ej: Tratamiento para la presión arterial"
                        placeholderTextColor="#999"
                        value={programacionData.nombre_tratamiento}
                        onChangeText={(text) =>
                          setProgramacionData((prev) => ({
                            ...prev,
                            nombre_tratamiento: text,
                          }))
                        }
                      />
                    </View>

                    {/* Fecha de fin */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        Fecha de fin (opcional)
                      </Text>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text
                          style={[
                            styles.dateInputText,
                            !programacionData.fecha_fin &&
                              styles.placeholderText,
                          ]}
                        >
                          {programacionData.fecha_fin
                            ? programacionData.fecha_fin.toLocaleDateString(
                                "es-ES",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }
                              )
                            : "Seleccionar fecha de finalización"}
                        </Text>
                        <MaterialCommunityIcons
                          name="calendar"
                          size={20}
                          color="#7A2C34"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Información adicional */}
                    <View style={styles.infoContainer}>
                      <MaterialCommunityIcons
                        name="information"
                        size={16}
                        color="#666"
                      />
                      <Text style={styles.infoText}>
                        Si no seleccionas una fecha de fin, el tratamiento se
                        programará por 30 días
                      </Text>
                    </View>
                  </View>
                )}

                {currentStep === 3 && renderDias()}
                {currentStep === 4 && renderHorarios()}
                {currentStep === 5 && renderConfirmacion()}
              </ScrollView>
            )}

            {/* Botones de navegación fijos en la parte inferior */}
            <View style={styles.navigationButtonsContainer}>
              {renderNavigationButtons()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={
            horarioEditando !== null
              ? (() => {
                  const horarioActual =
                    programacionData.horarios[horarioEditando];
                  if (horarioActual && horarioActual.hora) {
                    const [hours, minutes] = horarioActual.hora.split(":");
                    const date = new Date();
                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    return date;
                  }
                  return new Date();
                })()
              : new Date()
          }
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowTimePicker(false);
            if (selectedDate) {
              const horaString = selectedDate.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

              if (horarioEditando !== null) {
                // Editar horario existente
                cambiarHora(horarioEditando, horaString);
              } else {
                // Nuevo horario - actualizar el horario temporal
                setHorarioTemporal(horaString);
              }
              setHorarioEditando(null);
            }
          }}
        />
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={programacionData.fecha_fin || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setProgramacionData((prev) => ({
                ...prev,
                fecha_fin: selectedDate,
              }));
            }
          }}
        />
      )}

      {/* Modal de detalles de pastilla */}
      {renderModalDetalles()}
      {renderDetallesProgramacion()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFE5E5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  agregarButton: {
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
  },
  agregarButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agregarButtonTextContainer: {
    flex: 1,
  },
  agregarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  agregarSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  plusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7A2C34",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "95%",
    height: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  progressContainer: {
    flex: 1,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7A2C34",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e9ecef",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7A2C34",
    borderRadius: 3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e9ecef",
    minWidth: 36,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  searchIcon: {
    marginRight: 10,
    color: "#7A2C34",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    marginLeft: 10,
    padding: 5,
  },
  pastillasList: {
    flex: 1,
  },
  pastillasListContent: {
    paddingBottom: 20,
  },
  pastillaItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pastillaInfo: {
    flex: 1,
  },
  pastillaNombre: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  pastillaDescripcion: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  pastillaDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  pastillaPresentacion: {
    fontSize: 12,
    color: "#888",
    marginBottom: 3,
  },
  pastillaPeso: {
    fontSize: 12,
    color: "#888",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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
    paddingVertical: 40,
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
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  // Estilos para configuración
  configuracionContainer: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
  },
  stepHeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
  stepHeaderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  stepHeaderSubtitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7A2C34",
  },
  diasSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  diasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  diaCard: {
    width: "30%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
  },
  diaCardSelected: {
    backgroundColor: "#7A2C34",
    borderColor: "#7A2C34",
    shadowOpacity: 0.15,
    elevation: 4,
  },
  diaCardText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7A2C34",
    marginTop: 6,
    marginBottom: 2,
  },
  diaCardTextSelected: {
    color: "#ffffff",
  },
  diaCardFullText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  diaCardFullTextSelected: {
    color: "#ffffff",
    opacity: 0.9,
  },
  selectionSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4edda",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  selectionSummaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#155724",
    marginLeft: 8,
  },
  selectedPastillaCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedPastillaTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 5,
  },
  selectedPastillaNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  selectedPastillaDescripcion: {
    fontSize: 14,
    color: "#666",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButton: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  dateInputText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  detallesContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detallesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  detallesSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },
  diasContainer: {
    marginBottom: 20,
  },
  diasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  diaButton: {
    width: "14%",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginBottom: 10,
  },
  diaButtonSelected: {
    backgroundColor: "#7A2C34",
    borderColor: "#7A2C34",
  },
  diaButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  diaButtonTextSelected: {
    color: "#fff",
  },
  // Estilos para dosis simplificada
  dosisContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  dosisButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  dosisButtonSelected: {
    backgroundColor: "#7A2C34",
    borderColor: "#7A2C34",
  },
  dosisButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  dosisButtonTextSelected: {
    color: "#fff",
  },
  // Estilos para hora simplificada
  horaButton: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  horaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  horariosContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  horariosTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7A2C34",
    marginBottom: 8,
    textAlign: "center",
  },
  horariosList: {
    gap: 8,
  },
  horarioItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  horarioInfo: {
    flex: 1,
  },
  horarioHora: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: "#ff6b6b",
  },
  activateButton: {
    backgroundColor: "#4CAF50",
  },
  deactivateButton: {
    backgroundColor: "#FF9800",
  },
  horarioDosisText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  deleteButtonText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  noHorariosText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  // Estilos para resumen de días en la tarjeta de programación
  diasResumenContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  diasResumenTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  diasResumenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  diaResumenBadge: {
    backgroundColor: "#7A2C34",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  diaResumenText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  programacionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  programacionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  programacionInfo: {
    flex: 1,
  },
  programacionNombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  programacionMedicamento: {
    fontSize: 14,
    color: "#666",
  },
  programacionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  estadoBadge: {
    backgroundColor: "#7A2C34",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  estadoActivo: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  estadoInactivo: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  estadoTextActivo: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  estadoTextInactivo: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
  },
  menuButton: {
    padding: 4,
  },
  programacionDetalles: {
    marginBottom: 16,
    gap: 8,
  },
  detalleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  detalleText: {
    fontSize: 14,
    color: "#666",
  },
  confirmacionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  confirmacionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  confirmacionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  confirmacionSection: {
    marginBottom: 20,
  },
  confirmacionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  confirmacionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    flex: 1,
  },
  confirmacionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
    marginLeft: 8,
  },
  confirmacionValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
    flex: 1,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },
  menuDropdown: {
    position: "absolute",
    top: 60,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 160,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 2,
  },
  menuOptionDelete: {
    backgroundColor: "#fff5f5",
  },
  menuOptionText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  menuOptionTextDelete: {
    color: "#ff6b6b",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  navButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#dee2e6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
  },
  navButtonPrimary: {
    backgroundColor: "#7A2C34",
    borderColor: "#7A2C34",
    shadowOpacity: 0.15,
    elevation: 4,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    textAlign: "center",
    lineHeight: 20,
  },
  navButtonTextPrimary: {
    color: "#ffffff",
    fontWeight: "700",
  },
  agregarHorarioButton: {
    backgroundColor: "#7A2C34",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  agregarHorarioText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  seleccionarButton: {
    backgroundColor: "#7A2C34",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 8,
  },
  seleccionarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalBody: {
    flex: 1,
    paddingBottom: 20,
  },
  modalBodyContent: {
    paddingBottom: 20,
  },
  step1Container: {
    flex: 1,
    paddingBottom: 20,
  },
  step2Container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  step2Header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
  },
  step2HeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
  step2Title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7A2C34",
    marginBottom: 4,
  },
  step2Subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  medicamentoSeleccionadoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#7A2C34",
  },
  medicamentoSeleccionadoContent: {
    marginLeft: 12,
    flex: 1,
  },
  medicamentoSeleccionadoLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  medicamentoSeleccionadoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  medicamentoSeleccionadoDescripcion: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    fontStyle: "italic",
  },
  step5Container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  step5Header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
  },
  step5HeaderContent: {
    marginLeft: 12,
    flex: 1,
  },
  step5Title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7A2C34",
    marginBottom: 4,
  },
  step5Subtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  editandoInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  editandoInfoText: {
    fontSize: 14,
    color: "#856404",
    marginLeft: 8,
    fontWeight: "500",
  },
  medicamentoBloqueadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  medicamentoBloqueadoContent: {
    marginLeft: 12,
    flex: 1,
  },
  medicamentoBloqueadoTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  medicamentoBloqueadoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  medicamentoBloqueadoInfo: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  pastillaItemDisabled: {
    opacity: 0.5,
  },
  pastillasList: {
    flex: 1,
  },
  pastillasListContent: {
    paddingBottom: 20,
  },
  navigationButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
    gap: 15,
    minHeight: 90,
  },
  // Estilos para el modal de detalles de pastilla
  modalDetallesContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "92%",
    height: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  modalDetallesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  modalDetallesHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  modalDetallesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalDetallesBody: {
    flex: 1,
    padding: 20,
  },
  modalDetallesBodyContent: {
    paddingBottom: 20,
  },
  medicamentoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
  },
  medicamentoNombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
  detallesContainer: {
    gap: 12,
  },
  modalDetallesFooter: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 8,
  },
  detalleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#7A2C34",
  },
  detalleContent: {
    flex: 1,
    marginLeft: 12,
  },
  detalleLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detalleValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    lineHeight: 20,
  },
  horariosDetalleContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  horariosDetalleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  horariosDetalleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7A2C34",
  },
  horariosDetalleList: {
    gap: 8,
  },
  horarioDetalleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 4,
  },
  horarioDetalleText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
    fontWeight: "500",
  },
  confirmacionInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  confirmacionInfoText: {
    fontSize: 14,
    color: "#1976d2",
    marginLeft: 12,
    lineHeight: 18,
    flex: 1,
  },
  tablaContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: "#7A2C34",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  tablaHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  tablaHeaderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  tablaRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 4,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#7A2C34",
  },
  tablaCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tablaCellText: {
    color: "#495057",
    fontSize: 13,
    fontWeight: "500",
  },
  noHorariosContainer: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  horariosSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
    fontStyle: "italic",
  },
  horarioDetails: {
    flex: 1,
    marginLeft: 12,
  },
  horarioInfoText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  noHorariosSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  horariosTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  programacionesContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  programacionesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  programacionesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7A2C34",
    marginLeft: 10,
  },
  header: {
    backgroundColor: "#7A2C34",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
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
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7A2C34",
    paddingVertical: 16,
    paddingHorizontal: 20, // ← más ancho
    borderRadius: 25,
    marginTop: 10,
    gap: 6,
    flex: 0,
    minHeight: 50,
    minWidth: 110, // ← más ancho
    maxWidth: 120, // ← más ancho
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#ff6b6b",
  },
});

export default Medicamentos;
