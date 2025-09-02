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
  MaterialIcons,
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
  const [loading, setLoading] = useState(true); // Iniciar como true para mostrar el indicador de carga
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
    console.log("🔍 Efecto de usuario cambiado, usuario:", user?.usuario_id);
    if (user?.usuario_id) {
      console.log("🔍 Usuario detectado, cargando datos...");
      cargarProgramaciones();
      cargarPastillas(); // Asegurarnos de cargar pastillas cuando hay un usuario
    } else {
      console.log("⚠️ No hay usuario, limpiando datos");
      setPastillas([]);
      setFilteredPastillas([]);
    }
  }, [user?.usuario_id]);

  // Cargar pastillas al montar el componente
  useEffect(() => {
    console.log("🚀 Componente montado, cargando pastillas iniciales...");
    cargarPastillas();
  }, []);

  // Cargar programaciones del usuario
  const cargarProgramaciones = async () => {
    if (!user) return;
    
    setLoadingProgramaciones(true);
    try {
      const response = await apiRequest(`obtener_programaciones.php?usuario_id=${user.usuario_id}`);
      console.log('📊 Respuesta de programaciones:', response);
      
      // Manejar la respuesta anidada
      let programacionesData = [];
      
      if (response && response.data) {
        // Si la respuesta tiene un objeto data con un array data dentro
        if (response.data.data && Array.isArray(response.data.data)) {
          programacionesData = response.data.data;
        } 
        // Si la respuesta es directamente un array
        else if (Array.isArray(response.data)) {
          programacionesData = response.data;
        }
      }
      
      if (programacionesData.length > 0) {
        console.log(`✅ Se cargaron ${programacionesData.length} programaciones`);
        setProgramaciones(programacionesData);
      } else {
        console.warn('No se encontraron programaciones o la respuesta tiene un formato inesperado');
        setProgramaciones([]);
      }
    } catch (error) {
      console.error("Error al cargar programaciones:", error);
    } finally {
      setLoadingProgramaciones(false);
    }
  };

  // Cargar pastillas disponibles
  const cargarPastillas = async () => {
    setLoading(true);
    setError(null);
    console.log("🔄 Iniciando carga de pastillas...");
    console.log("🔍 Estado actual - loading:", loading, "error:", error);

    try {
      console.log("🔍 Realizando petición a /pastillas_usuario.php");
      const response = await apiRequest(`/pastillas_usuario.php`);
      console.log("✅ Respuesta recibida:", response);

      if (!response) {
        throw new Error("No se recibió respuesta del servidor");
      }

      // Verificar si la respuesta tiene la estructura esperada
      if (response.success && response.data && response.data.success) {
        const pastillasData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log(`📊 Se encontraron ${pastillasData.length} pastillas`);
        
        if (pastillasData.length > 0) {
          console.log("📋 Primeras pastillas:", pastillasData.slice(0, 2)); // Mostrar solo las primeras 2 para no saturar la consola
          setPastillas(pastillasData);
          setFilteredPastillas(pastillasData);
        } else {
          console.log("ℹ️ No se encontraron pastillas en la base de datos");
          setPastillas([]);
          setFilteredPastillas([]);
          setError("No se encontraron medicamentos en la base de datos");
        }
      } else {
        const errorMsg = response.data?.error || response.data?.message || "Error en el formato de la respuesta";
        console.error("❌ Error en la respuesta:", errorMsg);
        setError(errorMsg);
        setPastillas([]);
        setFilteredPastillas([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar pastillas:", error);
      setError(`Error al cargar los medicamentos: ${error.message}`);
      setPastillas([]);
      setFilteredPastillas([]);
    } finally {
      setLoading(false);
      console.log("🏁 Finalizada la carga de pastillas");
    }
  };

  // Función para manejar el refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([cargarProgramaciones(), cargarPastillas()]);
    setRefreshing(false);
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
    mostrarSelectorHora();
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

  // Manejador del selector de hora
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      
      setProgramacionData(prev => {
        const newHorario = { hora: formattedTime, dosis: 1 };
        
        if (horarioEditando !== null) {
          // Si estamos editando un horario existente
          return {
            ...prev,
            horarios: prev.horarios.map((h, i) => 
              i === horarioEditando ? { ...h, hora: formattedTime } : h
            )
          };
        } else {
          // Si estamos agregando un nuevo horario
          return {
            ...prev,
            horarios: [...(prev.horarios || []), newHorario]
          };
        }
      });
      
      setHorarioEditando(null);
    }
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
          const programacionId = response.data.programacion_id;
          const horariosCreados = response.data.horarios_creados || 0;
          let mensaje = `¡Tratamiento programado exitosamente con ${horariosCreados} horarios!`;

          alert(mensaje);

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
    // Resetear estados
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

    console.log("Horarios reales:", horariosReales);
    console.log("Estructura del primer horario:", horariosReales[0]);

    // Convertir horarios al formato del formulario
    const horariosFormato = horariosReales.map((horario) => ({
      dia: horario.dia_semana || horario.dia || horario.dias,
      hora: horario.hora,
      dosis: horario.dosis,
    }));

    const diasSeleccionados = [
      ...new Set(horariosReales.map((h) => h.dia_semana || h.dia || h.dias)),
    ];
    console.log("Días seleccionados:", diasSeleccionados);
    console.log("Horarios reales para extraer días:", horariosReales);

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
          {currentStep === 5 && "Paso 5: Confirmación"}
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
        {/* Información del medicamento */}
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

        {/* Días seleccionados */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Días de toma:</Text>
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
              size={35}
              color="#7A2C34"
            />
            <Text style={styles.horariosTitle}>Horarios programados</Text>
          </View>
          {horariosConfigurados.length > 0 ? (
            <>
              <Text style={styles.horariosSubtitle}>
                Selecciona un horario para editarlo o elimínalo si es necesario.
              </Text>
              <View style={styles.horariosListContainer}>
              {horariosConfigurados.map((horario, index) => (
                <View key={index} style={styles.horarioCard}>
                  <View style={styles.horarioLeftBorder} />
                  <TouchableOpacity
                    style={styles.horaButton}
                    onPress={() => {
                      setShowTimePicker(true);
                      setHorarioEditando(index);
                    }}
                    accessibilityLabel={`Editar horario ${index + 1}`}
                  >
                    <View style={styles.horarioContent}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={24}
                        color="#7A2C34"
                      />
                      <Text style={styles.horarioHora}>{horario.hora}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      eliminarHorario(index);
                    }}
                    accessibilityLabel={`Eliminar horario ${index + 1}`}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={40}
                      color="#7A2C34"
                    />
                  </TouchableOpacity>
                </View>
              ))}
              </View>
            </>
          ) : (
            <View style={styles.noHorariosContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={48}
                color="#cbd5e0"
              />
              <Text style={styles.noHorariosText}>No hay horarios configurados</Text>
              <Text style={styles.noHorariosSubtext}>
                Agrega al menos un horario para continuar
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.agregarHorarioButton}
            onPress={agregarHorario}
            accessibilityLabel="Agregar nuevo horario"
          >
            <MaterialIcons name="add" size={24} color="#fff" />
            <Text style={styles.agregarHorarioText}>Agregar horario</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Renderizar paso 5: Confirmación - Versión Simplificada
  const renderConfirmacion = () => {
    if (currentStep !== 5) return null;

    return (
      <View style={{flex: 1, backgroundColor: '#f8f9fa'}}>
        <ScrollView 
          style={{flex: 1}}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 80, // Reducido para que no quede espacio en blanco
            flexGrow: 0 // Evita que el contenido se expanda más allá del espacio necesario
          }}
          showsVerticalScrollIndicator={true}
        >
          {/* Tarjeta de Encabezado */}
          <View style={{
            backgroundColor: '#7A2C34',
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            marginBottom: 16
          }}>
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#fff" />
            </View>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {editandoProgramacion ? 'Resumen de cambios' : 'Resumen del Tratamiento'}
            </Text>
            <Text style={{
              fontSize: 15,
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center'
            }}>
              {editandoProgramacion 
                ? 'Revisa los cambios antes de actualizar' 
                : 'Revisa todos los detalles del tratamiento'}
            </Text>
          </View>

          {/* Tarjeta de Información */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2
          }}>
            {/* Información del medicamento */}
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

            {/* Días seleccionados */}
            <View style={{marginBottom: 16}}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <MaterialCommunityIcons name="calendar" size={20} color="#7A2C34" />
                <Text style={{marginLeft: 8, fontWeight: '600', color: '#4a5568'}}>Días seleccionados</Text>
              </View>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 28}}>
                {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((dia, index) => (
                  <View 
                    key={index}
                    style={{
                      backgroundColor: programacionData.dias_seleccionados?.includes(dia.toLowerCase().replace('á', 'a').replace('é', 'e')) 
                        ? '#7A2C34' 
                        : '#edf2f7',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      marginRight: 8,
                      marginBottom: 8
                    }}
                  >
                    <Text style={{
                      color: programacionData.dias_seleccionados?.includes(dia.toLowerCase().replace('á', 'a').replace('é', 'e')) 
                        ? '#fff' 
                        : '#4a5568',
                      fontSize: 14,
                      fontWeight: '500'
                    }}>
                      {dia.substring(0, 3)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fecha de fin */}
            {programacionData.fecha_fin && (
              <View style={{marginBottom: 16}}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                  <MaterialCommunityIcons name="calendar-end" size={20} color="#7A2C34" />
                  <Text style={{marginLeft: 8, fontWeight: '600', color: '#4a5568'}}>Fecha de finalización</Text>
                </View>
                <View style={{paddingLeft: 28}}>
                  <Text style={{color: '#4a5568'}}>
                    {programacionData.fecha_fin.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Horarios */}
            <View>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                <MaterialCommunityIcons name="clock" size={20} color="#7A2C34" />
                <Text style={{marginLeft: 8, fontWeight: '600', color: '#4a5568'}}>Horarios programados</Text>
              </View>
              <View style={{paddingLeft: 28}}>
                {programacionData.horarios?.length > 0 ? (
                  programacionData.horarios.map((horario, index) => (
                    <View 
                      key={index} 
                      style={{
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginBottom: 8,
                        backgroundColor: '#f7fafc',
                        padding: 12,
                        borderRadius: 8
                      }}
                    >
                      <MaterialCommunityIcons name="clock-outline" size={18} color="#7A2C34" style={{marginRight: 8}} />
                      <Text style={{fontSize: 16, color: '#2d3748', fontWeight: '500'}}>{horario.hora}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{color: '#a0aec0', fontStyle: 'italic'}}>No hay horarios configurados</Text>
                )}
              </View>
            </View>
          </View>

          {/* Nota Informativa - Último elemento del ScrollView */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: 'rgba(122, 44, 52, 0.1)',
            borderRadius: 12,
            padding: 12,
            alignItems: 'flex-start',
            marginBottom: 24, // Aumentado para dar más espacio al final
            marginTop: 'auto' // Empuja este elemento hacia abajo
          }}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#7A2C34" />
            <Text style={{
              flex: 1,
              marginLeft: 10,
              color: '#4a5568',
              fontSize: 14,
              lineHeight: 20
            }}>
              {editandoProgramacion 
                ? 'Al confirmar, se actualizará tu tratamiento con los nuevos datos.' 
                : 'Al confirmar, se creará tu tratamiento y podrás recibir recordatorios.'}
            </Text>
          </View>
        </ScrollView>
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
        onRequestClose={() => {
          setModalDetallesVisible(false);
          setModalTipo(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalDetallesContent}>
            {/* Header del modal */}
            <View style={styles.modalDetallesHeader}>
              <View style={styles.modalDetallesHeaderContent}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color="#7A2C34" />
                <Text style={styles.modalDetallesTitle}>
                  {programacionDetalles.nombre_tratamiento ||
                    programacionDetalles.nombre_comercial ||
                    "Detalles del Tratamiento"}
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

            {/* Contenido del modal */}
            <ScrollView 
              style={styles.modalDetallesBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalDetallesBodyContent}
            >
              {/* Información básica */}
              <View style={styles.medicamentoCard}>
                <MaterialCommunityIcons name="pill" size={32} color="#7A2C34" />
                <Text style={styles.medicamentoNombre}>
                  {programacionDetalles.nombre_comercial || "No especificado"}
                </Text>
              </View>
              
              <View style={styles.detallesContainer}>

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
              </View>
            </ScrollView>

            {/* Footer con botones de acción */}
            <View style={styles.modalDetallesFooter}>
              <TouchableOpacity
                style={[styles.seleccionarButton, {marginTop: 10}]}
                onPress={() => {
                  setModalDetallesVisible(false);
                  setModalTipo(null);
                  // Navegar a editar programación
                  const programacion = programaciones.find(
                    (p) => p.id_programacion === programacionDetalles.id_programacion
                  );
                  if (programacion) {
                    editarProgramacion(programacion);
                  }
                }}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                <Text style={styles.seleccionarButtonText}>
                  Editar Programación
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.seleccionarButton,
                  programacionDetalles.estado === "activo" 
                    ? { backgroundColor: '#dc3545' } 
                    : { backgroundColor: '#28a745' },
                  { marginTop: 10 }
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
                <Text style={styles.seleccionarButtonText}>
                  {programacionDetalles.estado === "activo"
                    ? "Desactivar"
                    : "Activar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.seleccionarButton, { backgroundColor: '#dc3545', marginTop: 10 }]}
                onPress={() => {
                  setModalDetallesVisible(false);
                  setModalTipo(null);
                  confirmarEliminarProgramacion(programacionDetalles);
                }}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                <Text style={styles.seleccionarButtonText}>Eliminar</Text>
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
            programaciones.map((programacion) => {
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
            })
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
                      {/* Corregido: props sueltos eliminados */}
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
            horarioEditando !== null && programacionData.horarios[horarioEditando]
              ? (() => {
                  const horarioActual = programacionData.horarios[horarioEditando];
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
          onChange={handleTimeChange}
          hour12={false}
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
    width: '100%',
  },
  pastillasListContent: {
    paddingBottom: 100, // Espacio para los botones de navegación
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
  // Estilos para el modal de detalles
  modalDetallesContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalDetallesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  modalDetallesHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalDetallesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7A2C34',
    marginLeft: 10,
  },
  modalDetallesBody: {
    maxHeight: '70%',
  },
  modalDetallesBodyContent: {
    padding: 20,
  },
  modalDetallesFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  medicamentoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  medicamentoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  detallesContainer: {
    marginBottom: 20,
  },
  detalleItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  detalleContent: {
    flex: 1,
    marginLeft: 10,
  },
  detalleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detalleValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  seleccionarButton: {
    backgroundColor: '#7A2C34',
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seleccionarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  // Estilos para los botones de navegación
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a5568', // Gris oscuro para el botón Atrás
    marginHorizontal: 4,
  },
  navButtonPrimary: {
    backgroundColor: '#7A2C34', // Color bordo para el botón Continuar
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextPrimary: {
    color: '#fff',
  },

  // Estilos para configuración
  configuracionContainer: {
    flex: 1,
    padding: 24, // Añadido padding para consistencia con el paso 2
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  
  // Estilos para la sección de días seleccionados
  inputContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7A2C34',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diasSeleccionadosText: {
    fontSize: 16,
    color: '#2d3748',
    lineHeight: 24,
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7A2C34',
    fontFamily: 'System',
    fontWeight: '500',
  },
  
  // Estilos para la sección de horarios
  horariosContainer: {
    marginBottom: 24,
  },
  horariosListContainer: {
    gap: 16, // Añade espacio entre los elementos hijos
  },
  horariosTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  horariosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 8,
  },
  horariosSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // ====================================

// Estilos para configuración
configuracionContainer: {
flex: 1,
padding: 24, // Añadido padding para consistencia con el paso 2
backgroundColor: '#fff',
borderRadius: 16,
margin: 16,
shadowColor: 'rgba(0, 0, 0, 0.08)',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 1,
shadowRadius: 16,
elevation: 3,
borderWidth: 1,
borderColor: 'rgba(0, 0, 0, 0.04)',
},

// Estilos para la sección de días seleccionados
inputContainer: {
marginBottom: 24,
backgroundColor: '#fff',
borderRadius: 12,
padding: 18,
borderWidth: 1,
borderColor: '#e2e8f0',
shadowColor: 'rgba(0, 0, 0, 0.05)',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 1,
shadowRadius: 6,
elevation: 2,
},
inputLabel: {
fontSize: 15,
fontWeight: '700',
color: '#7A2C34',
marginBottom: 12,
textTransform: 'uppercase',
letterSpacing: 0.5,
},
diasSeleccionadosText: {
fontSize: 16,
color: '#2d3748',
lineHeight: 24,
backgroundColor: '#f8f9fa',
padding: 14,
borderRadius: 10,
borderLeftWidth: 4,
borderLeftColor: '#7A2C34',
fontFamily: 'System',
fontWeight: '500',
},

// Estilos para la sección de horarios
horariosContainer: {
marginBottom: 24,
},
horariosTitleContainer: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 12,
},
horariosTitle: {
fontSize: 18,
fontWeight: '600',
color: '#2d3748',
marginLeft: 8,
},
horariosSubtitle: {
fontSize: 14,
color: '#718096',
marginBottom: 16,
lineHeight: 20,
},

// ====================================

// ESTILOS DE HORARIOS
// ====================================

// Contenedor del horario (área clickeable)
horarioItem: {
flex: 1,
flexDirection: 'row',
alignItems: 'center',
},

// Línea vertical izquierda
horarioLeftBorder: {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
  backgroundColor: '#7A2C34',
},

// Contenido del horario
horarioContent: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingLeft: 20,
  paddingRight: 12,
  height: '100%',
  flex: 1,
},

// Botón del horario (área clickeable)
horaButton: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
backgroundColor: 'transparent',
borderRadius: 8,
padding: 10,
},

// Texto de la hora
horarioHora: {
  fontSize: 22,
  fontWeight: '600',
  color: '#1a202c',
  marginLeft: 12,
  fontVariant: ['tabular-nums'],
  paddingVertical: 4,
},

// Detalles del horario (dosis)
horarioDetails: {
marginTop: 4,
alignItems: 'center',
},

// Texto de la dosis
horarioDosisText: {
fontSize: 16,
fontWeight: '500',
color: '#4a5568',
},

// Botón de eliminar horario
deleteButton: {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  padding: 8,
  marginRight: 8,
  alignItems: 'center',
  justifyContent: 'center',
},

// Contenedor cuando no hay horarios
noHorariosContainer: {
alignItems: 'center',
padding: 24,
backgroundColor: '#f8f9fa',
borderRadius: 12,
borderWidth: 1,
borderColor: '#e2e8f0',
borderStyle: 'dashed',
},

// Textos cuando no hay horarios
noHorariosText: {
fontSize: 16,
fontWeight: '500',
color: '#4a5568',
marginTop: 12,
textAlign: 'center',
},
noHorariosSubtext: {
fontSize: 14,
color: '#a0aec0',
marginTop: 4,
textAlign: 'center',
},

// Botón para agregar nuevo horario
agregarHorarioButton: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#7A2C34',
borderRadius: 12,
padding: 16,
marginTop: 16,
shadowColor: 'rgba(122, 44, 52, 0.3)',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 1,
shadowRadius: 4,
elevation: 2,
},
agregarHorarioText: {
color: '#fff',
fontSize: 16,
fontWeight: '600',
marginLeft: 8,
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
step2Header: {
marginBottom: 24,
paddingBottom: 20,
borderBottomWidth: 1,
borderBottomColor: 'rgba(0, 0, 0, 0.04)',
paddingTop: 4,
},
step2HeaderContent: {
marginBottom: 20,
marginTop: 8,
},
step2Title: {
fontSize: 22,
fontWeight: '700',
color: '#2c3e50',
marginBottom: 6,
fontFamily: 'System',
letterSpacing: -0.1,
lineHeight: 28,
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
gap: 16, // Aumentado de 12 a 16 para más espacio entre elementos
marginBottom: 8, // Añadido margen inferior para separación vertical
},
diaCard: {
width: "30%",
backgroundColor: "#ffffff",
borderRadius: 12,
marginBottom: 8, // Añadido margen inferior para separación vertical adicional
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Botón del horario (área clickeable)
  horaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 10,
  },
  
  // Texto de la hora
  horarioHora: {
    fontSize: 40,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  
  // Detalles del horario (dosis)
  horarioDetails: {
    marginTop: 4,
    alignItems: 'center',
  },
  
  // Texto de la dosis
  horarioDosisText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
  },

  // Estilos para el paso de confirmación
  confirmacionContainer: {
    flex: 1,
    padding: 0,
    backgroundColor: '#f8f9fa',
  },
  confirmacionContentContainer: {
    padding: 16,
    paddingBottom: 80, // Espacio para los botones de navegación
  },
  confirmacionHeaderCard: {
    backgroundColor: '#7A2C34',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  confirmacionHeaderIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmacionTitulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmacionSubtitulo: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoContent: {
    paddingHorizontal: 8,
  },
  medicamentoNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#4a5568',
  },
  infoHighlight: {
    fontSize: 15,
    color: '#2d3748',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#edf2f7',
    marginVertical: 16,
  },
  diasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    margin: 8,
  },
  diaPill: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  diaSeleccionado: {
    backgroundColor: '#7A2C34',
  },
  diaNoSeleccionado: {
    backgroundColor: '#f0f0f0',
  },
  diaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  diaTextSeleccionado: {
    color: '#fff',
  },
  horariosGrid: {
    marginTop: 8,
  },
  horarioHora: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
    marginLeft: 12,
  },
  horarioDosisBadge: {
    backgroundColor: '#7A2C34',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horarioDosisText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notaContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(122, 44, 52, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  notaTexto: {
    flex: 1,
    marginLeft: 10,
    color: '#4a5568',
    fontSize: 14,
    lineHeight: 20,
  },
  confirmacionBotonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cancelarButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelarButtonText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmarButton: {
    flex: 2,
    backgroundColor: '#7A2C34',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmarButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Contenedor cuando no hay horarios
  noHorariosContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  
  // Textos cuando no hay horarios
  noHorariosText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
    marginTop: 12,
    textAlign: 'center',
  },
  noHorariosSubtext: {
    fontSize: 14,
    color: '#a0aec0',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Botón para agregar nuevo horario
  agregarHorarioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7A2C34',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: 'rgba(122, 44, 52, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  agregarHorarioText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  step2Header: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    paddingTop: 4,
  },
  step2HeaderContent: {
    marginBottom: 20,
    marginTop: 8,
  },
  step2Title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.1,
    lineHeight: 28,
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
    gap: 16, // Aumentado de 12 a 16 para más espacio entre elementos
    marginBottom: 3, // Añadido margen inferior para separación vertical
  },
  diaCard: {
    width: "30%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 8, // Añadido margen inferior para separación vertical adicional
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
    margin: 3,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    fontFamily: 'System',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2c3e50',
    fontFamily: 'System',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
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
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
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
    color: '#2c3e50',
    fontFamily: 'System',
  },
  placeholderText: {
    color: '#94a3b8',
    fontFamily: 'System',
    fontSize: 15,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#7A2C34',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    flex: 1,
    fontFamily: 'System',
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
    borderLeftWidth: 3,
    borderLeftColor: "#7A2C34",
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
  step2Container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  horariosDetalleContainer: {
    marginTop: 20,
    padding: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  horariosDetalleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#faf5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#f0e6e6',
  },
  horarioIcon: {
    marginRight: 10,
  },
  horariosDetalleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A2C34',
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  horarioItem: {
    width: '50%',
    padding: 10,
  },
  horarioItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0e0e0',
  },
  horarioHora: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  dosisBadge: {
    position: 'absolute',
    top: -5,
    right: 5,
    backgroundColor: '#7A2C34',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dosisText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmacionContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  confirmacionContentContainer: {
    paddingBottom: 30,
  },
  confirmacionHeaderCard: {
    backgroundColor: '#7A2C34',
    padding: 25,
    paddingTop: 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: -15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmacionHeaderIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  confirmacionTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmacionSubtitulo: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  infoContent: {
    paddingLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#555',
  },
  infoHighlight: {
    fontSize: 16,
    color: '#7A2C34',
    fontWeight: '600',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  medicamentoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 15,
  },
  diasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 5,
  },
  diaPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  diaSeleccionado: {
    backgroundColor: '#7A2C34',
    borderColor: '#7A2C34',
  },
  diaNoSeleccionado: {
    backgroundColor: '#f8f9fa',
  },
  diaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  diaTextSeleccionado: {
    color: '#fff',
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  horarioCard: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  horarioHora: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  horarioDosisBadge: {
    backgroundColor: '#7A2C34',
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  horarioDosisText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F1F1',
    padding: 18,
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7A2C34',
  },
  notaTexto: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#5E5E5E',
    lineHeight: 20,
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
});

export default Medicamentos;
