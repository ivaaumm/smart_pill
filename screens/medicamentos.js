import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { setAudioModeAsync } from "expo-audio";
// Notificaciones removidas - solo pantalla directa
import {
  playSoundPreview,
  // scheduleNotification,
  // cancelScheduledNotification,
  stopCurrentSound,
} from "../utils/audioUtils";
import { setupAllPermissions, checkPermissionsStatus } from '../utils/permissionsConfig';
import { Picker } from "@react-native-picker/picker";
import AlarmComponent from "./components/AlarmComponent";
import { apiRequest, API_CONFIG } from "../config";
import { useUser } from "../UserContextProvider";
import DateTimePicker from "@react-native-community/datetimepicker";

const Medicamentos = ({ navigation }) => {
  const { user } = useUser();

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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6; // Added new step for alarm configuration
  const [alarms, setAlarms] = useState([]);
  const [tomasHoy, setTomasHoy] = useState([]);
  const [cargandoTomas, setCargandoTomas] = useState(false);
  const [programacionData, setProgramacionData] = useState({
    nombre_tratamiento: "",
    fecha_inicio: new Date(), // Fecha actual por defecto
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
  const [forceModalRender, setForceModalRender] = useState(0); // Para forzar re-render del modal
  // Estados para el modal de detalles - NUEVA IMPLEMENTACIÓN
  const [showPillModal, setShowPillModal] = useState(false);
  const [currentPillData, setCurrentPillData] = useState(null);
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

    // Debug: Mostrar las primeras pastillas cargadas
    if (pastillas.length > 0) {
      console.log("📝 Contenido de pastillas:", pastillas.slice(0, 3)); // Mostrar solo las primeras 3 para no saturar
    }
  }, [pastillas, filteredPastillas]);

  // Función para cargar las tomas programadas para hoy (sin notificaciones)
  const cargarTomasHoy = async () => {
    try {
      setCargandoTomas(true);

      // Sin notificaciones - las alarmas se manejan directamente
      console.log("📅 Sistema configurado para pantalla directa sin notificaciones");
      setTomasHoy([]);
    } catch (error) {
      console.error("Error al cargar las tomas de hoy:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar las tomas programadas para hoy"
      );
    } finally {
      setCargandoTomas(false);
    }
  };

  // Cargar programaciones al montar el componente
  useEffect(() => {
    console.log("🔍 Efecto de usuario cambiado, usuario:", user?.usuario_id);
    if (user?.usuario_id) {
      console.log("🔍 Usuario detectado, cargando datos...");
      cargarPastillas();
      cargarProgramaciones();
      cargarTomasHoy();
    } else {
      console.log("⚠️ No hay usuario, limpiando datos");
      setPastillas([]);
      setFilteredPastillas([]);
    }
  }, [user?.usuario_id]);

  // Cargar pastillas al montar el componente y cuando cambia el usuario
  useEffect(() => {
    console.log("🚀 Iniciando carga de pastillas...");

    const loadInitialData = async () => {
      try {
        console.log("🔄 Cargando datos iniciales...");
        await cargarPastillas();
        console.log("✅ Datos iniciales cargados");
      } catch (error) {
        console.error("❌ Error al cargar datos iniciales:", error);
        setError(`Error al cargar los datos: ${error.message}`);
      }
    };

    loadInitialData();

    // Limpiar al desmontar
    return () => {
      console.log("🧹 Limpiando efecto de carga inicial");
    };
  }, [user?.usuario_id]); // Recargar si cambia el usuario

  // Cargar programaciones del usuario
  const cargarProgramaciones = async () => {
    if (!user) return;

    console.log("🔄 Cargando programaciones para el usuario:", user.usuario_id);
    setLoadingProgramaciones(true);

    try {
      const response = await apiRequest(
        API_CONFIG.ENDPOINTS.OBTPROGRAMACIONES +
          `?usuario_id=${user.usuario_id}`
      );
      console.log("📊 Respuesta de programaciones:", response);

      // Manejar diferentes formatos de respuesta
      let programacionesData = [];

      // Caso 1: Respuesta con data.data (formato anidado)
      if (response?.data?.data && Array.isArray(response.data.data)) {
        programacionesData = response.data.data;
      }
      // Caso 2: Respuesta directa con array en data
      else if (Array.isArray(response?.data)) {
        programacionesData = response.data;
      }
      // Caso 3: Respuesta directa con array en el primer nivel
      else if (Array.isArray(response)) {
        programacionesData = response;
      }
      // Caso 4: Respuesta en formato de error
      else if (response?.error) {
        console.error("Error del servidor:", response.error);
        Alert.alert(
          "Error",
          "No se pudieron cargar los tratamientos: " + response.error
        );
      }

      console.log(`📊 ${programacionesData.length} programaciones obtenidas`);

      // Ordenar por fecha de inicio (más recientes primero)
      programacionesData.sort((a, b) => {
        const fechaA = new Date(a.fecha_inicio || 0);
        const fechaB = new Date(b.fecha_inicio || 0);
        return fechaB - fechaA;
      });

      // Actualizar el estado
      setProgramaciones(programacionesData);

      // Si no hay programaciones, mostrar un mensaje
      if (programacionesData.length === 0) {
        console.log("ℹ️ No se encontraron programaciones para este usuario");
      }

      return programacionesData;
    } catch (error) {
      console.error("❌ Error al cargar programaciones:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los tratamientos. Verifica tu conexión e intenta de nuevo."
      );
      setProgramaciones([]);
      return [];
    } finally {
      setLoadingProgramaciones(false);
    }
  };

  // Cargar pastillas disponibles
  const cargarPastillas = async () => {
    setLoading(true);
    setError(null);
    console.log("🔄 Iniciando carga de pastillas...");
    console.log("🔍 Estado actual:", {
      loading,
      pastillasLength: pastillas.length,
      filteredPastillasLength: filteredPastillas.length,
      searchText,
    });

    try {
      console.log("🔍 Realizando petición a catálogo de pastillas");
      const startTime = Date.now();

      // Usar helper apiRequest para construir correctamente la URL base
      const { success, data, status, statusText, error, message } =
        await apiRequest(API_CONFIG.ENDPOINTS.CATALOGO_PASTILLAS, {
          method: "GET",
        });
      console.log(`✅ Respuesta recibida en ${Date.now() - startTime}ms`);
      if (!success) {
        const detalle =
          message ||
          error ||
          statusText ||
          (status ? `HTTP ${status}` : null) ||
          "Error en la petición";
        throw new Error(detalle);
      }

      let responseData = data;
      console.log("📥 Datos recibidos:", {
        tipo: typeof responseData,
        esArray: Array.isArray(responseData),
        tieneSuccess:
          responseData &&
          typeof responseData === "object" &&
          "success" in responseData,
        tieneData:
          responseData &&
          typeof responseData === "object" &&
          "data" in responseData,
        dataEsArray: Array.isArray(responseData?.data),
      });

      let pastillasData = [];

      // Manejar diferentes formatos de respuesta
      if (responseData && typeof responseData === "object") {
        if (Array.isArray(responseData)) {
          // Caso 1: La respuesta es directamente un array
          pastillasData = responseData;
          console.log("📥 Datos recibidos como array directo");
        } else if (
          responseData.success !== undefined &&
          Array.isArray(responseData.data)
        ) {
          // Caso 2: Formato estándar {success: true, data: [...]}
          pastillasData = responseData.data;
          console.log("📥 Datos recibidos en formato estándar con éxito");
        } else if (responseData.data && Array.isArray(responseData.data)) {
          // Caso 3: Tiene propiedad data que es un array
          pastillasData = responseData.data;
          console.log("📥 Datos extraídos de la propiedad data");
        } else if (responseData.error) {
          // Caso 4: Hay un error en la respuesta
          console.error("Error del servidor:", responseData.error);
          throw new Error(responseData.error);
        } else {
          // Caso 5: La respuesta es un objeto, pero no en el formato esperado
          console.warn(
            "Formato de respuesta inesperado, intentando extraer datos:",
            responseData
          );
          // Intentar extraer cualquier propiedad que sea un array
          const arrayProps = Object.values(responseData).filter(Array.isArray);
          if (arrayProps.length > 0) {
            pastillasData = arrayProps[0]; // Tomar el primer array que encontremos
            console.log(
              `📥 Se encontró un array en la respuesta con ${pastillasData.length} elementos`
            );
          } else {
            // Si no hay arrays, convertir el objeto en un array
            pastillasData = Object.values(responseData);
            console.log("📥 Convertido objeto a array de valores");
          }
        }
      } else {
        console.warn("Formato de respuesta no soportado:", responseData);
        throw new Error("Formato de respuesta no soportado del servidor");
      }

      // Si no hay datos, usar datos de ejemplo para pruebas
      if (pastillasData.length === 0) {
        console.log("⚠️ No se encontraron pastillas, usando datos de ejemplo");
        pastillasData = [
          {
            id: 1,
            nombre: "Paracetamol",
            descripcion: "Analgésico y antipirético",
            presentacion: "Tabletas 500mg",
          },
          {
            id: 2,
            nombre: "Ibuprofeno",
            descripcion: "Antiinflamatorio no esteroideo",
            presentacion: "Cápsulas 400mg",
          },
          {
            id: 3,
            nombre: "Omeprazol",
            descripcion: "Inhibidor de la bomba de protones",
            presentacion: "Cápsulas 20mg",
          },
        ];
      }

      console.log(`📊 Se encontraron ${pastillasData.length} pastillas`);
      console.log("📝 Ejemplo de datos recibidos:", pastillasData.slice(0, 2));

      if (pastillasData.length === 0) {
        console.log("ℹ️ No se encontraron pastillas en la base de datos");
        setError("No se encontraron medicamentos en la base de datos");
        setPastillas([]);
        setFilteredPastillas([]);
        return;
      }

      // Asegurarse de que todos los elementos tengan los campos requeridos
      const validatedPastillas = pastillasData.map((item) => ({
        remedio_global_id:
          item.remedio_global_id || Math.random().toString(36).substr(2, 9),
        nombre_comercial: item.nombre_comercial || item.nombre || "Sin nombre",
        descripcion: item.descripcion || "",
        presentacion: item.presentacion || "",
        peso_unidad: item.peso_unidad || "N/A",
        efectos_secundarios: item.efectos_secundarios || "",
      }));

      // Ordenar alfabéticamente por nombre
      const sortedPastillas = [...validatedPastillas].sort((a, b) =>
        (a.nombre_comercial || "").localeCompare(b.nombre_comercial || "")
      );

      console.log(
        `📋 Cargando ${sortedPastillas.length} pastillas disponibles`
      );
      console.log(
        "📋 Primeras pastillas:",
        sortedPastillas.slice(0, 3).map((p) => ({
          id: p.remedio_global_id || p.id,
          nombre: p.nombre_comercial || p.nombre,
          presentacion: p.presentacion,
        }))
      );

      console.log("💾 Guardando pastillas en el estado...");
      setPastillas(sortedPastillas);
      setFilteredPastillas(sortedPastillas);

      console.log("📋 Primeras pastillas:", sortedPastillas.slice(0, 2));
      console.log("✅ Pastillas cargadas y validadas correctamente");
    } catch (error) {
      console.error("❌ Error al cargar pastillas:", error);
      const errorMessage =
        error.message || "Error desconocido al cargar los medicamentos";
      setError(`Error: ${errorMessage}`);
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
    console.log("🔍 Iniciando filtrado con texto:", texto);
    console.log("📊 Estado actual:", {
      pastillasLength: pastillas.length,
      filteredPastillasLength: filteredPastillas.length,
      currentSearchText: searchText,
    });

    setSearchText(texto);

    if (!texto || texto.trim() === "") {
      console.log("🔄 Mostrando todas las pastillas");
      console.log(
        "📋 Pastillas a mostrar:",
        pastillas.map((p) => ({
          id: p.remedio_global_id || p.id,
          nombre: p.nombre_comercial || p.nombre,
        }))
      );
      setFilteredPastillas([...pastillas]);
      return;
    }

    const searchTerm = texto.toLowerCase().trim();
    console.log("🔍 Buscando término:", searchTerm);

    const filtered = pastillas.filter((item) => {
      const nombre = (item.nombre_comercial || item.nombre || "").toLowerCase();
      const descripcion = (item.descripcion || "").toLowerCase();
      const presentacion = (item.presentacion || "").toLowerCase();

      const matches =
        nombre.includes(searchTerm) ||
        descripcion.includes(searchTerm) ||
        presentacion.includes(searchTerm);

      if (matches) {
        console.log("✅ Coincidencia encontrada:", {
          nombre: item.nombre_comercial || item.nombre,
          searchTerm,
          matches: {
            nombre: nombre.includes(searchTerm),
            descripcion: descripcion.includes(searchTerm),
            presentacion: presentacion.includes(searchTerm),
          },
        });
      }

      return matches;
    });

    console.log(
      `🔍 Resultados de búsqueda: ${filtered.length} de ${pastillas.length} pastillas`
    );
    console.log(
      "📋 Resultados:",
      filtered.map((f) => ({
        id: f.remedio_global_id || f.id,
        nombre: f.nombre_comercial || f.nombre,
      }))
    );

    setFilteredPastillas(filtered);
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
    console.log("🔍 MODAL DEBUG - Datos de la pastilla:", pastilla);
    console.log("🔍 MODAL DEBUG - Propiedades disponibles:", Object.keys(pastilla));
    
    // Asegurar que tenemos todos los campos necesarios
    const pastillaCompleta = {
      ...pastilla,
      nombre_comercial: pastilla.nombre_comercial || pastilla.nombre,
      descripcion: pastilla.descripcion || "No hay descripción disponible",
      presentacion: pastilla.presentacion || "No especificada",
      peso_unidad: pastilla.peso_unidad || "N/A",
      efectos_secundarios: pastilla.efectos_secundarios || "No especificados",
      remedio_global_id: pastilla.remedio_global_id || pastilla.id
    };
    
    console.log("🔍 MODAL DEBUG - Pastilla completa para modal:", pastillaCompleta);
    
    // Establecer los estados de forma síncrona
    setPastillaDetalles(pastillaCompleta);
    setModalTipo("pastilla");
    setModalDetallesVisible(true);
    setForceModalRender(prev => prev + 1); // Forzar re-render
    
    console.log("🔍 MODAL DEBUG - Estados establecidos directamente");
    console.log("🔍 MODAL DEBUG - pastillaDetalles:", pastillaCompleta);
    console.log("🔍 MODAL DEBUG - modalTipo: pastilla");
    console.log("🔍 MODAL DEBUG - modalDetallesVisible: true");
    console.log("🔍 MODAL DEBUG - forceModalRender incrementado");
  };

  const mostrarDetallesProgramacion = (programacion) => {
    setProgramacionDetalles(programacion);
    setModalTipo("programacion");
    setModalDetallesVisible(true);
  };

  // Abrir modal de selección
  const abrirSelectorPastillas = async () => {
    console.log("🚀 Abriendo selector, pastillas actuales:", pastillas.length);
    console.log("📡 Abriendo selector de pastillas...");
    setError(null);

    // Mostrar el modal inmediatamente para mejor experiencia de usuario
    setModalVisible(true);
    setCurrentStep(1);
    setEditandoProgramacion(null);
    resetearFormulario();

    // Forzar recarga de pastillas para asegurar que tengamos los datos más recientes
    console.log("🔄 Forzando recarga de pastillas...");
    await cargarPastillas();

    console.log("✅ Pastillas cargadas, mostrando selector");
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
      // Obtener la hora y minutos directamente del DateTimePicker
      const localHours = selectedTime.getHours();
      const localMinutes = selectedTime.getMinutes();

      // Formatear la hora para mostrar (formato 24h)
      const formattedTime = `${String(localHours).padStart(2, "0")}:${String(
        localMinutes
      ).padStart(2, "0")}`;

      // Crear objeto Date con la hora exacta seleccionada (sin conversiones de zona horaria)
      const localDate = new Date();
      localDate.setHours(localHours, localMinutes, 0, 0);

      // Para depuración
      console.log("🕐 Hora seleccionada:", formattedTime);
      console.log("🕐 Objeto Date creado:", localDate.toString());
      console.log("🕐 Horas:", localHours, "Minutos:", localMinutes);

      setProgramacionData((prev) => {
        const newHorario = {
          hora: formattedTime,
          dosis: 1,
          timeObject: localDate, // Guardar el objeto Date completo para referencia
        };

        if (horarioEditando !== null) {
          // Si estamos editando un horario existente
          return {
            ...prev,
            horarios: prev.horarios.map((h, i) =>
              i === horarioEditando
                ? { ...h, hora: formattedTime, timeObject: localDate }
                : h
            ),
          };
        } else {
          // Si estamos agregando un nuevo horario
          return {
            ...prev,
            horarios: [...(prev.horarios || []), newHorario],
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

  // Función para volver al paso anterior
  const volverAPasoAnterior = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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

  const avanzarAConfiguracionAlarmas = () => {
    // Verificar que hay horarios configurados
    if (!programacionData.horarios || programacionData.horarios.length === 0) {
      Alert.alert(
        "Horarios requeridos",
        "Debes configurar al menos un horario antes de continuar con la configuración de alarmas."
      );
      return;
    }

    // Inicializar las alarmas con los horarios seleccionados
    const nuevasAlarmas = programacionData.horarios.map((horario) => {
      // Crear fecha sin zona horaria para evitar conversiones automáticas
      const [hours, minutes] = horario.hora.split(':');
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      return {
        id: null,
        time: timeDate,
        enabled: true,
        days: programacionData.dias_seleccionados || [0, 0, 0, 0, 0, 0, 0],
        sound: "default",
        vibrate: true,
        dosis: horario.dosis || 1,
      };
    });

    setAlarms(nuevasAlarmas);
    setCurrentStep(5);
  };

  const avanzarAConfirmacionFinal = () => {
    setCurrentStep(6);
  };

  // Programar todas las alarmas activas
  const programarAlarmas = async () => {
    if (!alarms || alarms.length === 0) return [];

    try {
      const programacionId = editandoProgramacion?.id || Date.now().toString();
      const alarmasProgramadas = [];

      // Obtener la zona horaria actual
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("📅 Iniciando programación de alarmas");
      console.log("Zona horaria:", timeZone, "(Buenos Aires, UTC-3)");

      // Notificaciones removidas - solo mostrar pantalla directa
      console.log('📱 Sistema configurado para mostrar pantalla directamente sin notificaciones');

      for (let i = 0; i < alarms.length; i++) {
        const alarma = alarms[i];
        if (!alarma.enabled) continue;

        // Obtener la hora y minuto del objeto time (ya está en hora local)
        const horaAlarma = alarma.time;
        if (!horaAlarma) {
          console.error("❌ Hora de alarma no válida:", alarma);
          continue;
        }

        try {
          // Asegurarse de que tenemos un objeto Date válido
          let fechaHora;
          if (horaAlarma instanceof Date) {
            fechaHora = horaAlarma;
          } else if (typeof horaAlarma === 'string') {
            // Si es string en formato HH:MM, crear Date con hora local
            const [hours, minutes] = horaAlarma.split(':');
            fechaHora = new Date();
            fechaHora.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          } else {
            fechaHora = new Date(horaAlarma);
          }
          
          if (isNaN(fechaHora.getTime())) {
            console.error("❌ Fecha/hora de alarma no válida:", horaAlarma);
            continue;
          }

          // Usar la hora exacta sin ajustes de zona horaria
          const hora = fechaHora.getHours();
          const minuto = fechaHora.getMinutes();
          
          console.log(`🕐 Procesando alarma ${i + 1}: ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`);

          // Obtener días seleccionados y mapeo de días de la semana
          const diasSeleccionados = programacionData.dias_seleccionados || [];
          
          // Mapeo de días de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
          const nombresDias = {
            lunes: 1,
            martes: 2,
            miércoles: 3,
            jueves: 4,
            viernes: 5,
            sábado: 6,
            domingo: 0,
          };

          // Programar notificaciones para todos los días seleccionados
          console.log(`\n📅 Programando alarmas para horario ${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`);
          console.log("- Días seleccionados:", diasSeleccionados.join(', '));
          
          // Programar una notificación para cada día seleccionado
          for (const dia of diasSeleccionados) {
            const ahora = new Date();
            const diaNumero = typeof dia === "string" ? nombresDias[dia.toLowerCase()] ?? 1 : dia;
            const diaActual = ahora.getDay();
            
            // Calcular la diferencia de días para este día específico
            let diferenciaDias = (diaNumero - diaActual + 7) % 7;
            
            // Si es el mismo día (diferenciaDias === 0), siempre programar para la próxima semana
            // para evitar notificaciones inmediatas
            if (diferenciaDias === 0) {
              diferenciaDias = 7;
              console.log(`📅 Es el mismo día (${dia}), programando para la próxima semana`);
            }
            
            // Crear la fecha de notificación para este día
            let fechaNotificacion = new Date();
            fechaNotificacion.setDate(ahora.getDate() + diferenciaDias);
            fechaNotificacion.setHours(hora, minuto, 0, 0);
            
            console.log(`📅 Diferencia de días calculada: ${diferenciaDias} días`);
            console.log(`📅 Fecha base: ${ahora.toLocaleString('es-AR')}`);
            console.log(`📅 Fecha programada inicial: ${fechaNotificacion.toLocaleString('es-AR')}`);
            
            // VALIDACIÓN CRÍTICA: Asegurar que la notificación sea SIEMPRE en el futuro
            const tiempoHastaNotificacion = fechaNotificacion.getTime() - ahora.getTime();
            const minutosHastaNotificacion = Math.round(tiempoHastaNotificacion / (1000 * 60));
            
            if (tiempoHastaNotificacion <= 0) {
              console.error(`❌ ERROR: Notificación programada en el pasado para ${dia}`);
              console.error(`❌ Fecha calculada: ${fechaNotificacion.toLocaleString('es-AR')}`);
              console.error(`❌ Fecha actual: ${ahora.toLocaleString('es-AR')}`);
              continue; // Saltar esta notificación
            }
            
            if (minutosHastaNotificacion < 5) {
              console.warn(`⚠️ Notificación muy próxima (${minutosHastaNotificacion} min), programando para próxima semana`);
              fechaNotificacion.setDate(fechaNotificacion.getDate() + 7);
            }
            
            console.log(`📅 Programando para ${dia}: ${fechaNotificacion.toLocaleString('es-AR')}`);

            // Preparar datos para la notificación de este día
            const notificationData = {
              programacionId,
              alarmaIndex: i,
              dia: dia,
              hora: `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`,
              timezone: timeZone,
              sound: alarma.sound || "default",
              originalDate: fechaNotificacion.toString(),
            };

            // Debug: Mostrar información detallada
            console.log("\n📅 Programando alarma para día:", dia);
            console.log(
              "- Hora seleccionada (local):",
              `${hora.toString().padStart(2, "0")}:${minuto
                .toString()
                .padStart(2, "0")}`
            );
            console.log(
              "- Fecha programada (local):",
              fechaNotificacion.toString()
            );
            console.log(
              "- Día de la semana:",
              [
                "Domingo",
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
              ][fechaNotificacion.getDay()]
            );
            
            // Logs adicionales de depuración
            const ahoraDebug = new Date();
            const tiempoHastaAlarma = fechaNotificacion.getTime() - ahoraDebug.getTime();
            const minutosHastaAlarma = Math.round(tiempoHastaAlarma / (1000 * 60));
            const horasHastaAlarma = Math.round(tiempoHastaAlarma / (1000 * 60 * 60));
            console.log('🔍 DEBUG - Fecha/hora actual:', ahoraDebug.toLocaleString('es-AR'));
            console.log('🔍 DEBUG - Fecha/hora calculada para alarma:', fechaNotificacion.toLocaleString('es-AR'));
            console.log('🔍 DEBUG - Tiempo hasta la alarma (ms):', tiempoHastaAlarma);
            console.log('🔍 DEBUG - Tiempo hasta la alarma (minutos):', minutosHastaAlarma);
            console.log('🔍 DEBUG - Tiempo hasta la alarma (horas):', horasHastaAlarma);
            console.log('🔍 DEBUG - Es en el futuro:', fechaNotificacion > ahoraDebug);
            
            // Validar que la fecha sea futura (con margen de 30 segundos)
            const margenSegundos = 30 * 1000; // 30 segundos en milisegundos
            if (fechaNotificacion.getTime() <= (ahoraDebug.getTime() - margenSegundos)) {
              console.warn('⚠️ Saltando notificación en el pasado para', dia);
              console.warn('⚠️ Fecha calculada:', fechaNotificacion.toLocaleString('es-AR'));
              console.warn('⚠️ Fecha actual:', ahoraDebug.toLocaleString('es-AR'));
              continue;
            }
            
            console.log('✅ Programando alarma para la hora exacta seleccionada por el usuario');
            console.log('📅 Fecha final de la alarma:', fechaNotificacion.toLocaleString('es-AR'));

            try {
              const medicamentoNombre = selectedPastilla?.nombre_comercial || programacionData.nombre_medicamento || "Medicamento";
              const dosisInfo = programacionData.dosis_por_toma || "1 tableta";
              
              // Crear ID único por día y horario para evitar duplicados
              const uniqueId = `${programacionId}_${dia}_${String(hora).padStart(2, '0')}${String(minuto).padStart(2, '0')}`;
              
              // Sin notificaciones - solo guardar alarma para pantalla directa
              const alarmaId = uniqueId;
              
              console.log(
                "✅ Alarma configurada para pantalla directa:", dia, ". ID:",
                alarmaId
              );
              
              alarmasProgramadas.push({
                ...alarma,
                alarmaId: alarmaId,
                dia: dia,
                fechaProgramada: fechaNotificacion.toISOString(),
                medicamento: medicamentoNombre,
                dosis: dosisInfo,
                hora: `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`,
                sound: alarma.sound || "default"
              });
            } catch (error) {
              console.error("❌ Error al programar notificación para", dia, ":", error);
            }
          } // Cerrar el bucle for de días
        } catch (error) {
          console.error("❌ Error procesando alarma:", error);
        }
      }

      return alarmasProgramadas;
    } catch (error) {
      console.error("Error al programar alarmas:", error);
      Alert.alert("Error", "No se pudieron programar las alarmas.");
      return [];
    }
  };

  // Crear programación
  const crearProgramacion = async () => {
    // Prevenir ejecuciones múltiples simultáneas
    if (loading) {
      console.log('⚠️ Ya se está procesando una programación, ignorando...');
      return;
    }
    
    setLoading(true);

    try {
      // Verificar permisos sin mostrar alertas que bloqueen el flujo
      console.log('🔐 Verificando permisos antes de crear tratamiento...');
      const permissionsStatus = await checkPermissionsStatus();
      
      if (!permissionsStatus.notifications) {
        console.warn('⚠️ Permisos de notificación no concedidos, pero continuando...');
      }
      
      // Programar las alarmas en el sistema de notificaciones
      const alarmasProgramadas = await programarAlarmas();

      const diasSeleccionados = programacionData.dias_seleccionados || [];
      const horariosConfigurados = programacionData.horarios || [];

      // Función para formatear la hora en formato HH:mm
      const formatTime = (time) => {
        if (!time) return "00:00";

        // Si es un string en formato HH:mm, devolverlo directamente
        if (typeof time === "string" && time.match(/^\d{1,2}:\d{2}$/)) {
          return time;
        }

        // Si es un objeto Date
        if (time instanceof Date) {
          const hours = String(time.getHours()).padStart(2, "0");
          const minutes = String(time.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}`;
        }

        // Si es un objeto con propiedades hours y minutes
        if (
          time &&
          typeof time === "object" &&
          "hours" in time &&
          "minutes" in time
        ) {
          const hours = String(time.hours).padStart(2, "0");
          const minutes = String(time.minutes).padStart(2, "0");
          return `${hours}:${minutes}`;
        }

        return "00:00";
      };

      // Preparar los datos de las alarmas para el envío
      const alarmasParaEnviar = alarms.map((alarma, index) => ({
        ...alarma,
        // Incluir el ID de alarma para pantalla directa si existe
        alarmaId: alarmasProgramadas[index]?.alarmaId,
        hora: formatTime(alarma.time),
        dias: alarma.days?.join(",") || "",
        activa: alarma.enabled || false,
        sonido: alarma.sound || "default",
        vibrar: alarma.vibrate || false,
      }));

      // Procesar horarios para eliminar duplicados
      const horariosUnicos = [];
      const horariosVistos = new Set();

      // Primero normalizamos los horarios (quitamos segundos si existen)
      const horariosNormalizados = horariosConfigurados.map((horario) => ({
        ...horario,
        hora: (horario.hora && horario.hora.includes(":"))
          ? horario.hora.split(":").slice(0, 2).join(":")
          : horario.hora,
      }));

      // Filtramos duplicados
      horariosNormalizados.forEach((horario) => {
        if (!horariosVistos.has(horario.hora)) {
          horariosVistos.add(horario.hora);
          horariosUnicos.push(horario);
        }
      });

      // Creamos los horarios para la API
      const horariosParaAPI = horariosUnicos.flatMap((horario) =>
        programacionData.dias_seleccionados.map((dia) => ({
          dia_semana: dia,
          hora: horario.hora + ":00", // Agregar segundos al formato de hora
          dosis: horario.dosis || 1,
          activo: 1,
        }))
      );

      console.log("Horarios únicos para guardar:", horariosUnicos);
      console.log("Horarios para API:", horariosParaAPI);

      const dataToSend = {
        usuario_id: user.usuario_id,
        remedio_global_id: selectedPastilla.remedio_global_id,
        nombre_tratamiento:
          programacionData.nombre_tratamiento ||
          selectedPastilla.nombre_comercial,
        fecha_inicio: programacionData.fecha_inicio ? programacionData.fecha_inicio.toISOString().split("T")[0] : new Date().toISOString().split("T")[0], // Fecha actual por defecto
        fecha_fin: programacionData.fecha_fin
          ? programacionData.fecha_fin.toISOString().split("T")[0]
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
        dosis_por_toma: programacionData.dosis_por_toma,
        observaciones: "",
        horarios: horariosParaAPI,
        alarmas: alarmasParaEnviar,
      };

      console.log("📤 Enviando datos:", dataToSend);

      if (editandoProgramacion) {
        // Si estamos editando, usar el endpoint de edición
        await actualizarProgramacion(editandoProgramacion.programacion_id);
      } else {
        // Si estamos creando, usar el endpoint de creación
        console.log("📤 Enviando solicitud para crear programación...");
        const response = await apiRequest("/crear_programacion.php", {
          method: "POST",
          body: JSON.stringify(dataToSend),
        });

        console.log("📥 Respuesta del servidor:", response);

        // Verificar diferentes formatos de respuesta
        if (
          (response.success || response.data?.success) &&
          (response.data?.programacion_id || response.programacion_id)
        ) {
          const programacionId =
            response.data?.programacion_id || response.programacion_id;
          const horariosCreados =
            response.data?.horarios_creados || response.horarios_creados || 0;
          let mensaje = `¡Tratamiento programado exitosamente con ${horariosCreados} horarios!`;

          // PROGRAMAR LAS NOTIFICACIONES DESPUÉS DE CREAR EL TRATAMIENTO
          console.log("📅 Programando notificaciones para el tratamiento creado...");
          await programarNotificacionesTratamiento({
            programacionId,
            nombreTratamiento: programacionData.nombre_tratamiento || selectedPastilla.nombre_comercial,
            horarios: horariosParaAPI,
            fechaInicio: dataToSend.fecha_inicio, // USAR LA FECHA DE INICIO REAL DEL TRATAMIENTO
            dosisPorToma: programacionData.dosis_por_toma
          });

          // Mostrar mensaje de éxito
          Alert.alert("Éxito", mensaje);

          // Cerrar el modal y limpiar el formulario
          setModalVisible(false);
          resetearFormulario();

          // Forzar recarga de programaciones
          console.log("🔄 Recargando lista de programaciones...");
          await cargarProgramaciones();

          // También recargar las tomas de hoy
          await cargarTomasHoy();

          console.log("✅ Lista de programaciones actualizada");
        } else {
          // Mostrar mensaje de error detallado
          const errorMessage =
            response.data?.error ||
            response.error ||
            "Error desconocido al crear el tratamiento";
          console.error("Error al crear programación:", errorMessage);
          Alert.alert("Error", errorMessage);
        }
      }
    } catch (error) {
      alert("Error de conexión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función optimizada para programar notificaciones después de crear un tratamiento
  const programarNotificacionesTratamiento = async ({
    programacionId,
    nombreTratamiento,
    horarios,
    fechaInicio,
    dosisPorToma
  }) => {
    try {
      console.log("📅 Programando notificaciones para:", nombreTratamiento);

      // Mapeo optimizado de días de la semana
      const nombresDias = {
        'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4,
        'viernes': 5, 'sabado': 6, 'domingo': 0
      };

      let notificacionesProgramadas = 0;
      const ahora = Date.now();
      const fechaInicioTime = new Date(fechaInicio).getTime();

      // Procesar horarios de forma optimizada
      for (const horario of horarios) {
        const { dia_semana, hora } = horario;
        
        // Validación rápida del día
        const numeroDia = nombresDias[dia_semana.toLowerCase()];
        if (numeroDia === undefined) continue;

        // Cálculo optimizado de fecha
        const [horaNum, minutoNum] = hora.split(':').map(Number);
        const fechaNotificacion = new Date(fechaInicioTime);
        fechaNotificacion.setHours(horaNum, minutoNum, 0, 0);
        
        // Ajustar al día correcto de la semana
        const diasDiferencia = (numeroDia - fechaNotificacion.getDay() + 7) % 7;
        if (diasDiferencia > 0) {
          fechaNotificacion.setDate(fechaNotificacion.getDate() + diasDiferencia);
        }
        
        // Si ya pasó, programar para la próxima semana
        if (fechaNotificacion.getTime() <= ahora + (2 * 60 * 1000)) {
          fechaNotificacion.setDate(fechaNotificacion.getDate() + 7);
        }

        // Crear ID de alarma optimizado
        const alarmaId = `tratamiento_${programacionId}_${numeroDia}_${horaNum}${minutoNum}`;
        notificacionesProgramadas++;
      }

      console.log(`✅ ${notificacionesProgramadas} notificaciones programadas para "${nombreTratamiento}"`);

    } catch (error) {
      console.error("❌ Error programando notificaciones del tratamiento:", error);
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

    // Obtener horarios únicos sin duplicados
    const horariosUnicos = [];
    const horariosVistos = new Set();

    const horariosProcesados = Array.isArray(programacion.horarios)
      ? programacion.horarios
      : [];

    // Procesar horarios para obtener solo los únicos
    horariosProcesados.forEach((horario) => {
      const hora = horario.hora
        ? horario.hora.split(":").slice(0, 2).join(":")
        : "";
      const clave = hora; // Usamos solo la hora como clave única

      if (hora && !horariosVistos.has(clave)) {
        horariosVistos.add(clave);
        horariosUnicos.push({
          hora: hora,
          dosis: horario.dosis || 1,
        });
      }
    });

    console.log("Horarios únicos:", horariosUnicos);

    // Obtener días seleccionados únicos
    const diasSeleccionados = [
      ...new Set(
        horariosProcesados
          .map((h) => h.dia_semana || h.dia || h.dias)
          .filter(Boolean)
      ),
    ];

    console.log("Días seleccionados:", diasSeleccionados);

    // Crear formato para el estado
    const horariosFormato = horariosUnicos.map((horario) => ({
      hora: horario.hora,
      dosis: horario.dosis,
    }));

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

      // Procesar horarios para eliminar duplicados
      const horariosUnicos = [];
      const horariosVistos = new Set();

      // Primero normalizamos los horarios (quitamos segundos si existen)
      const horariosNormalizados = horariosConfigurados.map((horario) => ({
        ...horario,
        hora: (horario.hora && horario.hora.includes(":"))
          ? horario.hora.split(":").slice(0, 2).join(":")
          : horario.hora,
      }));

      // Filtramos duplicados
      horariosNormalizados.forEach((horario) => {
        if (!horariosVistos.has(horario.hora)) {
          horariosVistos.add(horario.hora);
          horariosUnicos.push(horario);
        }
      });

      // Creamos los horarios para la API
      const horariosParaAPI = horariosUnicos.flatMap((horario) =>
        programacionData.dias_seleccionados.map((dia) => ({
          dia_semana: dia,
          hora: horario.hora + ":00", // Agregar segundos al formato de hora
          dosis: horario.dosis || 1,
          activo: 1,
        }))
      );

      console.log("Horarios únicos para guardar:", horariosUnicos);
      console.log("Horarios para API:", horariosParaAPI);

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

  // Actualizar las alarmas cuando cambian
  const handleAlarmsChange = (updatedAlarms) => {
    setAlarms(updatedAlarms);
  };

  // Función para renderizar cuando la lista está vacía
  const renderEmptyComponent = () => {
    console.log("🔍 Mostrando componente vacío. Estado actual:", {
      loading,
      error,
      pastillasLength: pastillas.length,
      filteredPastillasLength: filteredPastillas.length,
      searchText,
    });

    return (
      <View
        style={[
          styles.emptyContainer,
          { justifyContent: "center", padding: 20 },
        ]}
      >
        <MaterialIcons
          name="medication"
          size={64}
          color="#7A2C34"
          style={styles.emptyIcon}
        />

        {loading ? (
          <>
            <Text style={styles.emptyText}>Cargando medicamentos...</Text>
            <ActivityIndicator
              size="large"
              color="#7A2C34"
              style={{ marginTop: 20 }}
            />
          </>
        ) : error ? (
          <>
            <Text style={[styles.emptyText, { color: "#ff6b6b" }]}>
              Error al cargar los medicamentos
            </Text>
            <Text
              style={[
                styles.emptySubtext,
                { textAlign: "center", marginTop: 10 },
              ]}
            >
              {error}
            </Text>
          </>
        ) : searchText && filteredPastillas.length === 0 ? (
          <>
            <Text style={styles.emptyText}>
              No se encontraron coincidencias
            </Text>
            <Text
              style={[
                styles.emptySubtext,
                { textAlign: "center", marginTop: 10 },
              ]}
            >
              No hay medicamentos que coincidan con "{searchText}"
            </Text>
          </>
        ) : pastillas.length === 0 ? (
          <>
            <Text style={styles.emptyText}>
              No hay medicamentos disponibles
            </Text>
            <Text
              style={[
                styles.emptySubtext,
                { textAlign: "center", marginTop: 10 },
              ]}
            >
              No se encontraron medicamentos en la base de datos
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>No hay medicamentos para mostrar</Text>
        )}

        {!loading && (
          <TouchableOpacity
            style={[styles.retryButton, { marginTop: 20 }]}
            onPress={cargarPastillas}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Renderizar item de pastilla
  const renderPastillaItem = ({ item }) => {
    if (!item) return null;

    // Normalizar los datos del ítem para manejar diferentes estructuras
    const medicamento = {
      id:
        item.remedio_global_id ||
        item.id ||
        Math.random().toString(36).substr(2, 9),
      nombre: (item.nombre_comercial || item.nombre || "Sin nombre").trim(),
      presentacion: (item.presentacion || "").trim(),
      peso_unidad: (item.peso_unidad || "").toString().trim(),
      laboratorio: (item.laboratorio || "").trim(),
      ...item, // Mantener el objeto original completo
    };

    // Formatear el peso si está disponible
    const mostrarPeso =
      medicamento.peso_unidad &&
      medicamento.peso_unidad !== "N/A" &&
      !isNaN(parseFloat(medicamento.peso_unidad));
    const pesoFormateado = mostrarPeso
      ? `${parseFloat(medicamento.peso_unidad).toLocaleString()} mg`
      : "";

    // Obtener descripción del medicamento (si existe)
    const descripcion =
      medicamento.descripcion || medicamento.indicaciones || "";

    return (
      <TouchableOpacity
        style={styles.pastillaCard}
        onPress={() => seleccionarPastilla(medicamento)}
        onLongPress={() => mostrarDetallesPastilla(medicamento)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={styles.pastillaCardContent}>
          <View style={styles.pastillaCardHeader}>
            <Text style={styles.pastillaCardNombre} numberOfLines={1}>
              {medicamento.nombre}
            </Text>
            <MaterialIcons
              name="keyboard-arrow-right"
              size={24}
              color="#9CA3AF"
            />
          </View>

          {descripcion ? (
            <Text style={styles.pastillaCardDescripcion} numberOfLines={1}>
              {descripcion}
            </Text>
          ) : null}

          {/* Se elimina presentación y peso a pedido del usuario */}

          <Text style={styles.pastillaCardInstruction}>
            Mantén presionado para ver detalles
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar header del modal con progreso (simplificado)
  const renderModalHeader = () => (
    <View style={styles.modalHeader}>
      <View style={{ flex: 1 }}>
        <View style={styles.modalTitleContainer}>
          <MaterialIcons
            name={editandoProgramacion ? "edit" : "add-circle"}
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
          {currentStep === 5 && "Paso 5: Configuración de alarmas"}
          {currentStep === 6 && "Paso 6: Confirmación"}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={() => setModalVisible(false)}
        style={styles.closeButton}
        accessibilityLabel="Cerrar"
      >
        <MaterialIcons name="close" size={20} color="#7A2C34" />
      </TouchableOpacity>
    </View>
  );

  // Renderizar barra de búsqueda (solo en paso 1)
  const renderSearchBar = () => {
    if (currentStep !== 1) return null;

    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#7A2C34" />
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
              <MaterialIcons name="cancel" size={20} color="#666" />
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
      { key: "lunes", label: "Lun", fullLabel: "Lunes", icon: "event-note" },
      {
        key: "martes",
        label: "Mar",
        fullLabel: "Martes",
        icon: "event-note",
      },
      {
        key: "miercoles",
        label: "Mié",
        fullLabel: "Miércoles",
        icon: "event-note",
      },
      {
        key: "jueves",
        label: "Jue",
        fullLabel: "Jueves",
        icon: "event-note",
      },
      {
        key: "viernes",
        label: "Vie",
        fullLabel: "Viernes",
        icon: "event-note",
      },
      {
        key: "sabado",
        label: "Sáb",
        fullLabel: "Sábado",
        icon: "event-note",
      },
      {
        key: "domingo",
        label: "Dom",
        fullLabel: "Domingo",
        icon: "event-note",
      },
    ];

    const diasSeleccionados = programacionData.dias_seleccionados || [];
    console.log(" Renderizando días - días seleccionados:", diasSeleccionados);
    console.log(" Estado completo de programacionData:", programacionData);

    return (
      <View style={styles.configuracionContainer}>
        {/* Header con información del medicamento */}
        <View style={styles.stepHeader}>
          <MaterialIcons name="medication" size={24} color="#7A2C34" />
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
            <MaterialIcons name="event-note" size={20} color="#7A2C34" />
            <Text style={styles.sectionTitle}>Selecciona los días</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Elige los días de la semana en los que tomarás tu medicamento
          </Text>

          <View style={styles.diasGrid}>
            {diasSemana.map((dia, index) => {
              const isSelected = diasSeleccionados.includes(dia.key);
              const isDomingo = dia.key === 'domingo';
              return (
                <TouchableOpacity
                  key={dia.key}
                  style={[
                    styles.diaCard,
                    isSelected ? styles.diaCardSelected : null,
                    isDomingo ? styles.diaCardCentrado : null,
                  ]}
                  onPress={() => toggleDia(dia.key)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
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
            <MaterialIcons name="check-circle" size={20} color="#28a745" />
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
          <MaterialIcons name="medication" size={24} color="#7A2C34" />
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
            <MaterialIcons name="access-time" size={35} color="#7A2C34" />
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
                        <MaterialIcons
                          name="access-time"
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
                      <MaterialIcons
                        name="delete-outline"
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
              <MaterialIcons name="access-time" size={48} color="#cbd5e0" />
              <Text style={styles.noHorariosText}>
                No hay horarios configurados
              </Text>
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

  // Mostrar selector de sonido con vista previa (nueva implementación)

  // Actualizar sonido de la alarma
  const updateAlarmSound = (index, sound) => {
    const newAlarms = [...alarms];
    if (!newAlarms[index]) {
      newAlarms[index] = createNewAlarm(index);
    }
    newAlarms[index].sound = sound;
    setAlarms(newAlarms);
    handleAlarmsChange(newAlarms);
  };

  // Crear nueva alarma con valores por defecto
  const createNewAlarm = (index) => {
    return {
      id: null,
      time: new Date(`2000-01-01T${programacionData.horarios[index].hora}`),
      enabled: true,
      sound: "default",
      vibrate: true,
      volume: 100, // Aumentado para mayor volumen
      name: `Alarma ${index + 1}`,
      days: programacionData.dias_seleccionados || [],
    };
  };

  // Renderizar paso 5: Configuración de alarmas
  const renderAlarmConfig = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Configuración de notificaciones</Text>
          <Text style={styles.stepSubtitle}>
            Configura las alarmas que se aplicarán a todos los horarios
          </Text>
        </View>

        <View style={styles.alarmConfigContainer}>
          <View style={styles.generalAlarmContainer}>
            {/* Activar/Desactivar alarmas */}
            <View style={styles.generalAlarmItem}>
              <View style={styles.generalAlarmContent}>
                <MaterialIcons
                  name={generalAlarmEnabled ? "notifications-active" : "notifications-off"}
                  size={24}
                  color={generalAlarmEnabled ? "#7A2C34" : "#999"}
                />
                <View style={styles.generalAlarmText}>
                  <Text style={styles.generalAlarmTitle}>
                    {generalAlarmEnabled ? "Alarmas activadas" : "Alarmas desactivadas"}
                  </Text>
                  <Text style={styles.generalAlarmSubtitle}>
                    {generalAlarmEnabled 
                      ? "Se reproducirán alarmas en todos los horarios programados"
                      : "No se reproducirán alarmas"
                    }
                  </Text>
                </View>
              </View>
              <Switch
                value={generalAlarmEnabled}
                onValueChange={(value) => {
                  setGeneralAlarmEnabled(value);
                  // Aplicar a todas las alarmas existentes
                  const newAlarms = alarms.map(alarm => ({
                    ...alarm,
                    enabled: value
                  }));
                  setAlarms(newAlarms);
                  handleAlarmsChange(newAlarms);
                }}
                trackColor={{ false: "#E0E0E0", true: "#7A2C34" }}
                thumbColor="white"
              />
            </View>

            {/* Selección de tono */}
            {generalAlarmEnabled && (
              <TouchableOpacity
                style={styles.generalAlarmItem}
                onPress={() => {
                  // Mostrar selector de sonido general
                  showSoundPicker(0); // Usar el primer índice como referencia
                }}
                activeOpacity={0.7}
              >
                <View style={styles.generalAlarmContent}>
                  <MaterialIcons
                    name={
                      generalSound === "alarm"
                        ? "alarm"
                        : generalSound === "tone"
                        ? "music-note"
                        : "notifications"
                    }
                    size={24}
                    color="#7A2C34"
                  />
                  <View style={styles.generalAlarmText}>
                    <Text style={styles.generalAlarmTitle}>Tono de alarma</Text>
                    <Text style={styles.generalAlarmSubtitle}>
                      {generalSound === "alarm"
                        ? "Sonido de alarma"
                        : generalSound === "tone"
                        ? "Tono musical"
                        : "Sonido predeterminado"
                      }
                    </Text>
                  </View>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            )}

            {/* Información adicional */}
            <View style={styles.alarmInfoContainer}>
              <MaterialIcons
                name="info-outline"
                size={20}
                color="rgba(122, 44, 52, 0.7)"
              />
              <Text style={styles.alarmInfoText}>
                Esta configuración se aplicará automáticamente a todas las alarmas de tu tratamiento.
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Renderizar paso 6: Confirmación
  const renderConfirmacion = () => {
    if (currentStep !== 6) return null;

    return (
      <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 80, // Reducido para que no quede espacio en blanco
            flexGrow: 0, // Evita que el contenido se expanda más allá del espacio necesario
          }}
          showsVerticalScrollIndicator={true}
        >
          {/* Tarjeta de Encabezado */}
          <View
            style={{
              backgroundColor: "#7A2C34",
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                width: 60,
                height: 60,
                borderRadius: 30,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <MaterialIcons name="check-circle" size={32} color="#fff" />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#fff",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {editandoProgramacion
                ? "Resumen de cambios"
                : "Resumen del Tratamiento"}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: "rgba(255, 255, 255, 0.9)",
                textAlign: "center",
              }}
            >
              {editandoProgramacion
                ? "Revisa los cambios antes de actualizar"
                : "Revisa todos los detalles del tratamiento"}
            </Text>
          </View>

          {/* Tarjeta de Información */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            {/* Información del medicamento */}
            {/* Header con información del medicamento */}
            <View style={styles.stepHeader}>
              <MaterialIcons name="medication" size={24} color="#7A2C34" />
              <View style={styles.stepHeaderContent}>
                <Text style={styles.stepHeaderTitle}>
                  Medicamento seleccionado
                </Text>
                <Text style={styles.stepHeaderSubtitle}>
                  {selectedPastilla?.nombre_comercial}
                </Text>
              </View>
            </View>

            {/* Días seleccionados */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons name="event" size={20} color="#7A2C34" />
                <Text
                  style={{ marginLeft: 8, fontWeight: "600", color: "#4a5568" }}
                >
                  Días seleccionados
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  paddingLeft: 28,
                }}
              >
                {[
                  "lunes",
                  "martes",
                  "miércoles",
                  "jueves",
                  "viernes",
                  "sábado",
                  "domingo",
                ].map((dia, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor:
                        programacionData.dias_seleccionados?.includes(
                          dia.toLowerCase().replace("á", "a").replace("é", "e")
                        )
                          ? "#7A2C34"
                          : "#edf2f7",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: programacionData.dias_seleccionados?.includes(
                          dia.toLowerCase().replace("á", "a").replace("é", "e")
                        )
                          ? "#fff"
                          : "#4a5568",
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      {dia.substring(0, 3)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fecha de fin */}
            {programacionData.fecha_fin && (
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons
                    name="event-available"
                    size={20}
                    color="#7A2C34"
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontWeight: "600",
                      color: "#4a5568",
                    }}
                  >
                    Fecha de finalización
                  </Text>
                </View>
                <View style={{ paddingLeft: 28 }}>
                  <Text style={{ color: "#4a5568" }}>
                    {programacionData.fecha_fin.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Horarios */}
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons name="access-time" size={20} color="#7A2C34" />
                <Text
                  style={{ marginLeft: 8, fontWeight: "600", color: "#4a5568" }}
                >
                  Horarios programados
                </Text>
              </View>
              <View style={{ paddingLeft: 28 }}>
                {programacionData.horarios?.length > 0 ? (
                  programacionData.horarios.map((horario, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        backgroundColor: "#f7fafc",
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <MaterialIcons
                        name="access-time"
                        size={18}
                        color="#7A2C34"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#2d3748",
                          fontWeight: "500",
                        }}
                      >
                        {horario.hora}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "#a0aec0", fontStyle: "italic" }}>
                    No hay horarios configurados
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Nota Informativa - Último elemento del ScrollView */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(122, 44, 52, 0.1)",
              borderRadius: 12,
              padding: 12,
              alignItems: "flex-start",
              marginBottom: 24, // Aumentado para dar más espacio al final
              marginTop: "auto", // Empuja este elemento hacia abajo
            }}
          >
            <MaterialIcons name="info-outline" size={20} color="#7A2C34" />
            <Text
              style={{
                flex: 1,
                marginLeft: 10,
                color: "#4a5568",
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {editandoProgramacion
                ? "Al confirmar, se actualizará tu tratamiento con los nuevos datos."
                : "Al confirmar, se creará tu tratamiento y podrás recibir recordatorios."}
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
        onPress={(e) => {
          if (menuVisible === programacion.programacion_id) {
            e.stopPropagation();
            return;
          }
          mostrarDetallesProgramacion(programacion);
        }}
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
              <MaterialIcons
                name={
                  programacion.estado === "activo"
                    ? "check-circle"
                    : "pause-circle-outline"
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
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                // Calcular posición del menú para evitar que se corte
                const { height: screenHeight } = Dimensions.get('window');
                e.target.measure((x, y, width, height, pageX, pageY) => {
                  const menuHeight = 120; // Altura aproximada del menú (3 items * 40px)
                  
                  // Posicionar el menú muy arriba, al nivel exacto del botón
                  let menuY = pageY - 80; // Subir 80px para alineación exacta
                  
                  // Si el menú se saldría de la pantalla, posicionarlo arriba del botón
                  if (menuY + menuHeight > screenHeight - 50) {
                    menuY = pageY - menuHeight + height;
                  }
                  
                  setMenuPosition({ x: pageX, y: menuY });
                  setMenuVisible(programacion.programacion_id);
                });
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingLeft: 8 }}
            >
              <MaterialIcons name="more-vert" size={22} color="#7A2C34" />
            </TouchableOpacity>
          </View>
        </View>
        {menuVisible === programacion.programacion_id && (
          <View style={styles.menuPlaceholder}>
            {/* El menú ahora se renderiza globalmente */}
          </View>
        )}
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
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalDetallesContent}>
            {/* Header del modal */}
            <View style={styles.modalDetallesHeader}>
              <View style={styles.modalDetallesHeaderContent}>
                <MaterialIcons
                  name="event-available"
                  size={24}
                  color="#7A2C34"
                />
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
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Contenido del modal */}
            <ScrollView
              style={[styles.modalDetallesBody, { maxHeight: "100%" }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalDetallesBodyContent}
            >
              {/* Información básica */}
              <View style={styles.medicamentoCard}>
                <MaterialIcons name="medication" size={32} color="#7A2C34" />
                <Text style={styles.medicamentoNombre}>
                  {programacionDetalles.nombre_comercial || "No especificado"}
                </Text>
              </View>

              <View style={styles.detallesContainer}>
                {/* Estado */}
                <View style={styles.detalleItem}>
                  <MaterialIcons
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
                    <MaterialIcons
                      name="event-available"
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
                    <MaterialIcons
                      name="access-time"
                      size={20}
                      color="#7A2C34"
                    />
                    <Text style={styles.horariosDetalleTitle}>
                      Horarios Programados
                    </Text>
                  </View>

                  {horariosReales && horariosReales.length > 0 ? (
                    <View style={styles.tablaHorizontalContainer}>
                      {/* Agrupar horarios por día */}
                      {(() => {
                        const horariosPorDia = horariosReales.reduce((acc, horario) => {
                          const dia = horario.dia || horario.dias || horario.dia_semana;
                          if (!acc[dia]) {
                            acc[dia] = [];
                          }
                          acc[dia].push(horario.hora);
                          return acc;
                        }, {});

                        return Object.entries(horariosPorDia).map(([dia, horas], index) => (
                          <View key={index} style={styles.diaHorarioCard}>
                            <View style={styles.diaHeaderHorizontal}>
                              <Text style={styles.diaTextHorizontal}>
                                {dia.charAt(0).toUpperCase() + dia.slice(1)}
                              </Text>
                            </View>
                            <View style={styles.horariosListHorizontal}>
                              {horas.map((hora, i) => {
                                const horaFormateada = (hora && hora.includes(":"))
                                  ? hora.split(":").slice(0, 2).join(":")
                                  : hora;
                                return (
                                  <Text
                                    key={i}
                                    style={styles.horarioTextHorizontal}
                                  >
                                    {horaFormateada}
                                  </Text>
                                );
                              })}
                            </View>
                          </View>
                        ));
                      })()}
                    </View>
                  ) : (
                    <View style={styles.noHorariosContainer}>
                      <MaterialIcons
                        name="access-time"
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

            {/* Footer removido a pedido: sin acciones (editar/desactivar/eliminar) */}
          </View>
        </View>
      </Modal>
    );
  };

  // Renderizar modal de detalles de pastilla
  const renderModalDetalles = () => {
    console.log("🔍 RENDER DEBUG - pastillaDetalles:", pastillaDetalles);
    console.log("🔍 RENDER DEBUG - modalTipo:", modalTipo);
    console.log("🔍 RENDER DEBUG - modalDetallesVisible:", modalDetallesVisible);
    console.log("🔍 RENDER DEBUG - forceModalRender:", forceModalRender);
    
    if (!pastillaDetalles || modalTipo !== "pastilla") {
      console.log("🔍 RENDER DEBUG - Modal no se renderiza por condición");
      return null;
    }

    console.log("🔍 RENDER DEBUG - Renderizando modal de pastilla");
    
    // Renderizar siempre que las condiciones se cumplan, independientemente de modalDetallesVisible
    return (
      <Modal
        key={`modal-${forceModalRender}`} // Key única para forzar re-render
        animationType="slide"
        transparent={true}
        visible={true} // Siempre visible si llegamos aquí
        onRequestClose={() => {
          console.log("🔍 MODAL DEBUG - onRequestClose llamado");
          setModalDetallesVisible(false);
          setModalTipo(null);
          setPastillaDetalles(null);
        }}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.modalDetallesContent}>
            {/* Header */}
            <View style={styles.modalDetallesHeader}>
              <View style={styles.modalDetallesHeaderContent}>
                <MaterialIcons name="medication" size={24} color="#7A2C34" />
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
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Contenido */}
            <ScrollView
              style={styles.modalDetallesBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalDetallesBodyContent}
            >
              {/* Información principal del medicamento */}
              <View style={{
                backgroundColor: '#fff',
                padding: 20,
                margin: 10,
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  textAlign: 'center',
                  marginBottom: 10
                }}>
                  {pastillaDetalles?.nombre_comercial || pastillaDetalles?.nombre || "Medicamento"}
                </Text>
                
                {pastillaDetalles?.nombre && pastillaDetalles?.nombre_comercial && 
                 pastillaDetalles.nombre !== pastillaDetalles.nombre_comercial && (
                  <Text style={{
                    fontSize: 16,
                    color: '#7f8c8d',
                    textAlign: 'center',
                    marginBottom: 20
                  }}>
                    {pastillaDetalles.nombre}
                  </Text>
                )}

                {/* Descripción */}
                <View style={{marginBottom: 15}}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#34495e',
                    marginBottom: 5
                  }}>Descripción:</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#2c3e50',
                    lineHeight: 20
                  }}>
                    {pastillaDetalles?.descripcion || "No hay descripción disponible"}
                  </Text>
                </View>

                {/* Presentación */}
                <View style={{marginBottom: 15}}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#34495e',
                    marginBottom: 5
                  }}>Presentación:</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#2c3e50'
                  }}>
                    {pastillaDetalles?.presentacion || "No especificada"}
                  </Text>
                </View>

                {/* Peso */}
                <View style={{marginBottom: 15}}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#34495e',
                    marginBottom: 5
                  }}>Peso por Unidad:</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#2c3e50'
                  }}>
                    {pastillaDetalles?.peso_unidad ? `${pastillaDetalles.peso_unidad} mg` : "No especificado"}
                  </Text>
                </View>

                {/* Efectos secundarios */}
                <View style={{marginBottom: 15}}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#e74c3c',
                    marginBottom: 5
                  }}>Efectos Secundarios:</Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#2c3e50',
                    lineHeight: 20
                  }}>
                    {pastillaDetalles?.efectos_secundarios || "No especificados"}
                  </Text>
                </View>
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
                <MaterialIcons name="check" size={20} color="#fff" />
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

  // Estado para el selector de sonido mejorado
  const [soundModalVisible, setSoundModalVisible] = useState(false);
  const [editingSoundIndex, setEditingSoundIndex] = useState(null);
  const [selectedSound, setSelectedSound] = useState("default");
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundPreviewTimeout, setSoundPreviewTimeout] = useState(null);
  
  // Estados para configuración general de alarmas
  const [generalAlarmEnabled, setGeneralAlarmEnabled] = useState(true);
  const [generalSound, setGeneralSound] = useState("default");

  // Estado para el modal de configuración de notificaciones
  const [notificationConfigModalVisible, setNotificationConfigModalVisible] =
    useState(false);

  // Mostrar el modal de selector de sonido
  const showSoundPicker = async (index) => {
    try {
      const currentSound = alarms[index]?.sound || "default";
      console.log(
        "Mostrando selector de sonido para alarma",
        index,
        "sonido actual:",
        currentSound
      );

      // Configurar el modo de audio antes de mostrar el modal
      const audioConfig = {
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: true,
        // Usar strings que son compatibles con expo-audio
        interruptionModeIOS: 'mixWithOthers',
        interruptionModeAndroid: 'doNotMix',
      };

      console.log("🔊 Configurando audio en showSoundPicker con:", audioConfig);
      await setAudioModeAsync(audioConfig);

      setSelectedSound(currentSound);
      setEditingSoundIndex(index);
      setSoundModalVisible(true);

      // Reproducir una vista previa del sonido actual
      setTimeout(() => {
        handleSoundPreview(currentSound).catch((e) =>
          console.error("Error al reproducir vista previa:", e)
        );
      }, 300);
    } catch (error) {
      console.error("Error al mostrar el selector de sonido:", error);
      Alert.alert("Error", "No se pudo abrir el selector de sonido");
    }
  };

  // Manejar la vista previa del sonido (optimizado para reproducción inmediata)
  const handleSoundPreview = async (sound) => {
    console.log("Reproduciendo sonido:", sound);

    // Limpiar cualquier timeout existente
    if (soundPreviewTimeout) {
      clearTimeout(soundPreviewTimeout);
      setSoundPreviewTimeout(null);
    }

    try {
      // Actualizar el estado de reproducción inmediatamente
      setIsPlaying(true);
      
      // Reproducir el sonido directamente (ahora es inmediato gracias a la precarga)
      await playSoundPreview(sound);
      
      // Configurar timeout para limpiar el estado de reproducción
      const timeout = setTimeout(() => {
        setIsPlaying(false);
        setSoundPreviewTimeout(null);
      }, 3000);

      setSoundPreviewTimeout(timeout);
    } catch (error) {
      console.error(" Error al reproducir el sonido:", error);

      // Restablecer el estado en caso de error
      setIsPlaying(false);
      setSoundPreviewTimeout(null);

      // Mostrar mensaje de error al usuario
      Alert.alert(
        "Error de reproducción",
        "No se pudo reproducir el sonido. Asegúrate de que el volumen esté encendido y que la aplicación tenga los permisos necesarios."
      );

      // Intentar limpiar en caso de error
      try {
        const audioConfig = {
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
          shouldDuckAndroid: false,
          // Usar strings que son compatibles con expo-audio
          interruptionModeIOS: 'mixWithOthers',
          interruptionModeAndroid: 'doNotMix',
        };

        console.log(
          "🔊 Configurando audio en manejo de error con:",
          audioConfig
        );
        await setAudioModeAsync(audioConfig);
      } catch (e) {
        console.error("Error al configurar el modo de audio:", e);
      }
    }
  };

  // Manejar la selección de un sonido
  const handleSoundSelect = (sound) => {
    setSelectedSound(sound);
    handleSoundPreview(sound);
  };

  // Confirmar la selección del sonido
  const handleSoundConfirm = async () => {
    try {
      if (editingSoundIndex === null || !selectedSound) {
        console.warn(
          "No hay un sonido seleccionado o índice de alarma inválido"
        );
        return;
      }

      console.log(
        `Confirmando selección de sonido: ${selectedSound} para alarma ${editingSoundIndex}`
      );

      // Detener cualquier reproducción en curso
      if (isPlaying) {
        setIsPlaying(false);
        
        // Detener cualquier sonido que se esté reproduciendo usando la función optimizada
        try {
          await stopCurrentSound();
        } catch (audioError) {
          console.warn(
            "No se pudo detener la reproducción de audio:",
            audioError
          );
        }
        
        if (soundPreviewTimeout) {
          clearTimeout(soundPreviewTimeout);
          setSoundPreviewTimeout(null);
        }
      }

      // Actualizar el sonido de la alarma
      updateAlarmSound(editingSoundIndex, selectedSound);

      // Cerrar el modal después de un breve retraso para una mejor experiencia de usuario
      setTimeout(() => {
        setSoundModalVisible(false);
        // Limpiar el estado después de cerrar el modal
        setTimeout(() => {
          setEditingSoundIndex(null);
          setSelectedSound("default");
        }, 300);
      }, 100);
    } catch (error) {
      console.error("Error al confirmar la selección de sonido:", error);
      Alert.alert("Error", "No se pudo guardar la selección de sonido");
    }
  };

  // Cancelar la selección
  const handleSoundCancel = async () => {
    try {
      console.log("Cancelando selección de sonido");

      // Detener cualquier reproducción en curso
      if (isPlaying) {
        console.log("Deteniendo reproducción en curso...");
        setIsPlaying(false);

        // Detener cualquier sonido que se esté reproduciendo usando la función optimizada
        try {
          await stopCurrentSound();
          
          // Limpiar cualquier timeout pendiente
          if (soundPreviewTimeout) {
            clearTimeout(soundPreviewTimeout);
            setSoundPreviewTimeout(null);
          }
        } catch (audioError) {
          console.warn(
            "No se pudo detener la reproducción de audio:",
            audioError
          );
        }
      }

      // Limpiar timeouts
      if (soundPreviewTimeout) {
        console.log("Limpiando timeout de vista previa");
        clearTimeout(soundPreviewTimeout);
        setSoundPreviewTimeout(null);
      }

      // Cerrar el modal
      setSoundModalVisible(false);

      // Limpiar estados después de la animación
      setTimeout(() => {
        setEditingSoundIndex(null);
        setSelectedSound("default");
        console.log("Selección de sonido cancelada");
      }, 300);
    } catch (error) {
      console.error("Error al cancelar la selección de sonido:", error);
      // Asegurarse de que el modal se cierre incluso si hay un error
      setSoundModalVisible(false);
    }
  };

  // Opciones de sonido disponibles
  const soundOptions = [
    { id: "default", label: "Predeterminado", icon: "notifications" },
    { id: "alarm", label: "Alarma", icon: "alarm" },
    { id: "tone", label: "Tono", icon: "music-note" },
  ];

  // Renderizar el modal de configuración de notificaciones
  const renderNotificationConfigModal = () => {
    if (!notificationConfigModalVisible) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationConfigModalVisible}
        onRequestClose={() => setNotificationConfigModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.notificationModalOverlay}>
          <View style={styles.notificationModalCard}>
            <View style={styles.notificationModalHeader}>
              <View style={styles.notificationModalHeaderContent}>
                <MaterialIcons name="notifications" size={24} color="#7A2C34" />
                <Text style={styles.notificationModalTitle}>
                  Configuración de notificaciones
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setNotificationConfigModalVisible(false)}
                style={styles.notificationCloseButton}
                accessibilityLabel="Cerrar"
              >
                <MaterialIcons name="close" size={20} color="#7A2C34" />
              </TouchableOpacity>
            </View>

            <Text style={styles.notificationModalSubtitle}>
              Activa o desactiva las notificaciones para cada horario
            </Text>

            <ScrollView
              style={styles.notificationModalContent}
              showsVerticalScrollIndicator={false}
            >
              {programacionData.horarios &&
              programacionData.horarios.length > 0 ? (
                programacionData.horarios.map((horario, index) => {
                  const alarm = alarms[index] || {
                    id: null,
                    time: new Date(`2000-01-01T${horario.hora}`),
                    enabled: true,
                    sound: "default",
                    vibrate: true,
                    volume: 100, // Aumentado para mayor volumen
                    name: `Alarma ${index + 1}`,
                  };

                  return (
                    <View
                      key={index}
                      style={[
                        styles.notificationAlarmItem,
                        !alarm.enabled && styles.notificationAlarmItemDisabled,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.notificationAlarmContent}
                        onPress={() => showSoundPicker(index)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.notificationAlarmTimeContainer}>
                          <View style={styles.notificationAlarmTimeRow}>
                            <Text style={styles.notificationAlarmTime}>
                              {new Date(
                                `2000-01-01T${horario.hora}`
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                            <View style={styles.notificationSoundIndicator}>
                              <MaterialIcons
                                name={
                                  alarm.sound === "alarm"
                                    ? "alarm"
                                    : alarm.sound === "tone"
                                    ? "music-note"
                                    : "notifications-none"
                                }
                                size={16}
                                color={alarm.enabled ? "#7A2C34" : "#999"}
                              />
                            </View>
                          </View>
                          <Text style={styles.notificationAlarmDias}>
                            {programacionData.dias_seleccionados
                              ? programacionData.dias_seleccionados
                                  .map(
                                    (dia) =>
                                      [
                                        "Dom",
                                        "Lun",
                                        "Mar",
                                        "Mié",
                                        "Jue",
                                        "Vie",
                                        "Sáb",
                                      ][dia]
                                  )
                                  .join(", ")
                              : ""}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <Switch
                        value={alarm.enabled}
                        onValueChange={(value) => {
                          const newAlarms = [...alarms];
                          if (!newAlarms[index]) {
                            newAlarms[index] = {
                              ...alarm,
                              enabled: value,
                              time: new Date(`2000-01-01T${horario.hora}`),
                              days: programacionData.dias_seleccionados || [],
                            };
                          } else {
                            newAlarms[index].enabled = value;
                          }
                          setAlarms(newAlarms);
                          handleAlarmsChange(newAlarms);
                        }}
                        trackColor={{ false: "#E0E0E0", true: "#7A2C34" }}
                        thumbColor={alarm.enabled ? "#fff" : "#f4f3f4"}
                        ios_backgroundColor="#E0E0E0"
                      />
                    </View>
                  );
                })
              ) : (
                <View style={styles.notificationNoAlarmsContainer}>
                  <MaterialIcons
                    name="notifications-off"
                    size={48}
                    color="#999"
                  />
                  <Text style={styles.notificationNoAlarmsText}>
                    No hay horarios configurados
                  </Text>
                  <Text style={styles.notificationNoAlarmsSubtext}>
                    Configura horarios en el paso anterior para activar las
                    notificaciones
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.notificationModalFooter}>
              <TouchableOpacity
                style={styles.notificationModalButton}
                onPress={() => setNotificationConfigModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.notificationModalButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Renderizar el modal de selección de sonido
  const renderSoundPickerModal = () => {
    if (!soundModalVisible) return null;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={soundModalVisible}
        onRequestClose={handleSoundCancel}
        statusBarTranslucent={true}
      >
        <View style={styles.soundModalOverlay}>
           <View style={styles.soundModalCard}>
             <View style={styles.soundModalHeader}>
               <View style={styles.soundModalHeaderContent}>
                 <MaterialIcons name="music-note" size={24} color="#7A2C34" />
                 <Text style={styles.soundModalTitle}>Seleccionar sonido</Text>
               </View>
               <TouchableOpacity
                 onPress={handleSoundCancel}
                 style={styles.soundCloseButton}
                 accessibilityLabel="Cerrar"
               >
                 <MaterialIcons name="close" size={20} color="#7A2C34" />
               </TouchableOpacity>
             </View>
             <Text style={styles.soundModalSubtitle}>
               {isPlaying
                 ? "Reproduciendo..."
                 : "Toca para escuchar una vista previa"}
             </Text>

            <View style={styles.soundOptionsContainer}>
              {soundOptions.map((option) => {
                const isSelected = selectedSound === option.id;
                const isCurrentlyPlaying = isPlaying && isSelected;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.soundOptionButton,
                      isSelected && styles.soundOptionSelected,
                      isPlaying && !isSelected && styles.soundOptionDisabled,
                    ]}
                    onPress={() => handleSoundSelect(option.id)}
                    disabled={isPlaying && !isSelected}
                    activeOpacity={0.7}
                  >
                    <View style={styles.soundOptionContent}>
                      <View
                        style={[
                          styles.soundIconContainer,
                          isSelected && styles.soundIconContainerSelected,
                        ]}
                      >
                        <MaterialIcons
                          name={isCurrentlyPlaying ? "volume-up" : option.icon}
                          size={24}
                          color={isSelected ? "#fff" : "#7A2C34"}
                        />
                      </View>

                      <Text
                        style={[
                          styles.soundOptionText,
                          isSelected && styles.soundOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>

                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <MaterialIcons
                            name="check-circle"
                            size={20}
                            color="#7A2C34"
                          />
                        </View>
                      )}

                      {isCurrentlyPlaying && (
                        <ActivityIndicator
                          size="small"
                          color="#7A2C34"
                          style={styles.playingIndicator}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.soundModalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  isPlaying && styles.disabledButton,
                ]}
                onPress={handleSoundCancel}
                disabled={isPlaying}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  isPlaying && styles.disabledButton,
                ]}
                onPress={handleSoundConfirm}
                disabled={isPlaying}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Renderizar botones de navegación
  const renderNavigationButtons = () => {
    // Si estamos en el paso de configuración de alarmas, mostramos botones personalizados
    if (currentStep === 5) {
      return (
        <View style={styles.navigationButtonsContainer}>
          <View style={styles.navButtonsRow}>
            <TouchableOpacity
              style={[styles.navButton, { flex: 1, marginRight: 8 }]}
              onPress={volverAPasoAnterior}
            >
              <Text style={styles.navButtonText}>Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]}
              onPress={avanzarAConfirmacionFinal}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                Continuar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Para los demás pasos, mostramos la navegación estándar
    return (
      <View style={styles.navigationButtonsContainer}>
        <View style={styles.navButtonsRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navButton, { flex: 1, marginRight: 8 }]}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={styles.navButtonText}>Atrás</Text>
            </TouchableOpacity>
          )}

          {currentStep === 1 && editandoProgramacion && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]}
              onPress={() => setCurrentStep(2)}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                Continuar
              </Text>
            </TouchableOpacity>
          )}

          {currentStep === 2 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]}
              onPress={avanzarADias}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                Continuar
              </Text>
            </TouchableOpacity>
          )}

          {currentStep === 3 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]}
              onPress={avanzarAConfirmacion}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                Continuar
              </Text>
            </TouchableOpacity>
          )}

          {currentStep === 4 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]}
              onPress={avanzarAConfiguracionAlarmas}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                Configurar alarmas
              </Text>
            </TouchableOpacity>
          )}

          {currentStep === 6 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary, { flex: 1 }]}
              onPress={crearProgramacion}
              disabled={!!loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text
                  style={[styles.navButtonText, styles.navButtonTextPrimary]}
                >
                  {editandoProgramacion
                    ? "Actualizar tratamiento"
                    : "Guardar tratamiento"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Función para formatear la hora
  const formatearHora = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
      <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
        <StatusBar backgroundColor="#7A2C34" barStyle="light-content" />

        {/* Contenido Principal */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                onRefresh();
                cargarTomasHoy();
              }}
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
              <MaterialIcons name="add" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Lista de Programaciones */}
        <View style={styles.programacionesContainer}>
          <View style={styles.programacionesHeader}>
            <MaterialIcons name="calendar-today" size={24} color="#7A2C34" />
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
              <MaterialIcons name="medication" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                No tienes tratamientos programados
              </Text>
              <Text style={styles.emptySubtext}>
                Toca "Programar tratamiento" para crear tu primer tratamiento
              </Text>
            </View>
          )}
        </View>
        {/* Menú contextual global */}
        {menuVisible && (
          <View style={[styles.contextMenu, {
            position: 'absolute',
            top: menuPosition.y,
            right: 10,
            zIndex: 9999,
            elevation: 9999,
          }]}>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => {
                setMenuVisible(null);
                const programacion = programaciones.find(p => p.programacion_id === menuVisible);
                if (programacion) editarProgramacion(programacion);
              }}
            >
              <MaterialIcons name="edit" size={18} color="#7A2C34" />
              <Text style={styles.contextMenuText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => {
                setMenuVisible(null);
                const programacion = programaciones.find(p => p.programacion_id === menuVisible);
                if (programacion) {
                  const nuevoEstado = programacion.estado === "activo" ? "inactivo" : "activo";
                  cambiarEstadoProgramacion(programacion.programacion_id, nuevoEstado);
                }
              }}
            >
              <MaterialIcons
                name="pause-circle-outline"
                size={18}
                color="#7A2C34"
              />
              <Text style={styles.contextMenuText}>
                {(() => {
                  const programacion = programaciones.find(p => p.programacion_id === menuVisible);
                  return programacion?.estado === "activo" ? "Desactivar" : "Activar";
                })()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => {
                setMenuVisible(null);
                const programacion = programaciones.find(p => p.programacion_id === menuVisible);
                if (programacion) confirmarEliminarProgramacion(programacion);
              }}
            >
              <MaterialIcons name="delete" size={18} color="#7A2C34" />
              <Text style={styles.contextMenuText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal para programación de medicamentos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {renderModalHeader()}

            {/* Contenido del modal */}
            {currentStep === 1 ? (
              <View style={{ flex: 1 }}>
                <View style={{ padding: 12 }}>
                  <TextInput
                    placeholder="Buscar pastilla..."
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={filtrarPastillas}
                    style={{
                      height: 44,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      backgroundColor: "#fff",
                    }}
                  />
                </View>
                {editandoProgramacion ? (
                  <View style={{ padding: 12 }}>
                    <View style={styles.infoCard}>
                      <View style={styles.infoCardRow}>
                        <MaterialIcons
                          name="medication"
                          size={20}
                          color="#7A2C34"
                        />
                        <Text style={styles.infoCardLabel}>
                          Medicamento seleccionado
                        </Text>
                      </View>
                      <Text style={styles.medicamentoNombre}>
                        {selectedPastilla?.nombre_comercial ||
                          selectedPastilla?.nombre ||
                          "Medicamento"}
                      </Text>
                      {selectedPastilla?.descripcion ? (
                        <Text
                          style={styles.pastillaCardDescripcion}
                          numberOfLines={2}
                        >
                          {selectedPastilla.descripcion}
                        </Text>
                      ) : null}
                      <Text style={{ color: "#718096", marginTop: 8 }}>
                        No puedes cambiar el medicamento al editar el
                        tratamiento.
                      </Text>
                    </View>
                  </View>
                ) : loading ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator size="large" color="#7A2C34" />
                    <Text style={{ marginTop: 10, color: "#666" }}>
                      Cargando medicamentos...
                    </Text>
                  </View>
                ) : error ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 20,
                    }}
                  >
                    <Text style={{ color: "#ff6b6b", marginBottom: 10 }}>
                      Error al cargar los medicamentos
                    </Text>
                    <Text style={{ color: "#666", textAlign: "center" }}>
                      {error}
                    </Text>
                    <TouchableOpacity
                      onPress={cargarPastillas}
                      style={{
                        marginTop: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        backgroundColor: "#7A2C34",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>
                        Reintentar
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    style={{ flex: 1 }}
                    data={filteredPastillas}
                    keyExtractor={(item) =>
                      item.remedio_global_id?.toString() ||
                      Math.random().toString()
                    }
                    renderItem={renderPastillaItem}
                    ListEmptyComponent={renderEmptyComponent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  />
                )}
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
                      <MaterialIcons name="edit" size={24} color="#7A2C34" />
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
                        <MaterialIcons
                          name="medication"
                          size={24}
                          color="#7A2C34"
                        />
                        <View style={styles.stepHeaderContent}>
                          <Text style={styles.stepHeaderTitle}>
                            Medicamento seleccionado
                          </Text>
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
                        <MaterialIcons name="event" size={20} color="#7A2C34" />
                      </TouchableOpacity>
                    </View>

                    {/* Información adicional */}
                    <View style={styles.infoContainer}>
                      <MaterialIcons name="info" size={16} color="#666" />
                      <Text style={styles.infoText}>
                        Si no seleccionas una fecha de fin, el tratamiento se
                        programará por 30 días
                      </Text>
                    </View>
                  </View>
                )}

                {currentStep === 3 && renderDias()}
                {currentStep === 4 && renderHorarios()}
                {currentStep === 5 && renderAlarmConfig()}
                {currentStep === 6 && renderConfirmacion()}
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
            horarioEditando !== null &&
            programacionData.horarios[horarioEditando]
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

      {/* Renderizar el modal de selección de sonido */}
      {renderSoundPickerModal()}

      {/* Renderizar el modal de configuración de notificaciones */}
      {renderNotificationConfigModal()}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

// Estilos importados desde medicamentos.styles.js
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
    width: "100%",
    height: "90%",
    maxHeight: "90%",
    paddingTop: 20,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "visible",
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
    padding: 10,
    borderRadius: 25,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 44,
    minHeight: 44,
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
    width: "100%",
  },
  pastillasListContent: {
    paddingBottom: 100, // Espacio para los botones de navegación
  },
  tablaRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  tablaRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tablaRowLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  tablaCell: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  tablaCellText: {
    fontSize: 15,
    color: "#7A2C34",
    textAlign: "center",
    fontWeight: "600",
  },
  diaText: {
    fontSize: 15,
    color: "#7A2C34",
    fontWeight: "700",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
    minWidth: 100,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  horarioText: {
    color: "#7A2C34",
    fontWeight: "700",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    fontSize: 15,
    letterSpacing: 0.1,
    textAlign: "center",
    minWidth: 80,
  },
  tablaHorizontalContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 8,
  },
  diaHorarioCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 6,
    marginHorizontal: 2,
    minWidth: "45%",
    maxWidth: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  diaHeaderHorizontal: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  diaTextHorizontal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7A2C34",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  horariosListHorizontal: {
    padding: 8,
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  horarioTextHorizontal: {
    color: "#7A2C34",
    fontWeight: "600",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 12,
    textAlign: "center",
    margin: 2,
    minWidth: 50,
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderBottomWidth: 0,
  },
  tablaHeaderCell: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  tablaHeaderText: {
    fontSize: 15,
    color: "#7A2C34",
    textAlign: "center",
    fontFamily: "System",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  pastillaItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 6,
    marginHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  pastillaItemDisabled: {
    backgroundColor: "#f9f9f9",
    opacity: 0.7,
  },
  pastillaInfo: {
    flex: 1,
    marginRight: 12,
  },
  pastillaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pastillaNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flexShrink: 1,
    marginRight: 8,
  },
  pastillaTipo: {
    backgroundColor: "#f0f7ff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  pastillaTipoText: {
    color: "#1a73e8",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pastillaDescripcion: {
    fontSize: 13.5,
    color: "#4a5568",
    lineHeight: 20,
    marginBottom: 8,
  },
  pastillaDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 6,
  },
  pastillaPresentacion: {
    fontSize: 12.5,
    color: "#4a5568",
    backgroundColor: "#f0f4f8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  pastillaPeso: {
    fontSize: 12.5,
    color: "#2b6cb0",
    backgroundColor: "#ebf8ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontWeight: "500",
  },
  longPressHint: {
    fontSize: 11,
    color: "#a0aec0",
    marginTop: 8,
    fontStyle: "italic",
  },
  pastillaArrow: {
    opacity: 0.7,
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
    padding: 20,
    marginTop: 20,
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7A2C34",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  // Estilos para el modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "90%",
    width: "100%",
    flexDirection: "column",
    overflow: "hidden",
    // Asegurar que el modal esté por encima de otros elementos
    elevation: 5,
    zIndex: 1000,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  stepContainer: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    flexDirection: "column",
    overflow: "visible",
    // Asegurar que el contenedor ocupe todo el espacio disponible
    minHeight: "100%",
  },
  medicamentosListContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  listContainer: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: "flex-start",
  },
  modalDetallesHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalDetallesContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "95%",
    maxHeight: "90%",
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalDetallesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fafafa",
  },
  modalDetallesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  modalDetallesBody: {
    maxHeight: "85%",
  },
  modalDetallesBodyContent: {
    padding: 24,
    alignItems: 'center',
  },
  modalDetallesFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#fff",
  },
  medicamentoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medicamentoNombre: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginTop: 12,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  detallesContainer: {
    marginBottom: 24,
    width: "100%",
  },
  detalleItem: {
    flexDirection: "row",
    marginBottom: 18,
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  detalleContent: {
    flex: 1,
    marginLeft: 12,
  },
  detalleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  detalleValue: {
    fontSize: 15,
    color: "#000000",
    lineHeight: 22,
    fontWeight: "500",
  },
  seleccionarButton: {
    backgroundColor: "#7A2C34",
    borderRadius: 25,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  seleccionarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },

  // Estilos para los botones de navegación
  navigationButtonsContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: "auto",
  },
  navButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#4a5568", // Gris oscuro para el botón Atrás
  },
  navButtonPrimary: {
    backgroundColor: "#7A2C34", // Color bordo para el botón Continuar
  },
  navButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  navButtonTextPrimary: {
    color: "#fff",
  },

  // Estilos para la barra de búsqueda
  searchContainer: {
    width: "100%",
    padding: 12,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    // Asegurar que la barra de búsqueda esté por encima de la lista
    zIndex: 2,
    // Evitar que la barra de búsqueda se encoja
    flexShrink: 0,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    width: "100%",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 8,
    color: "#2d3748",
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  // Contenedor principal de la lista de medicamentos
  medicamentosListContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  // Contenedor de los items de la lista
  listContainer: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  // Estilos para las tarjetas de pastillas (nuevo diseño)
  pastillaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  pastillaCardContent: {
    padding: 16,
  },
  pastillaCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pastillaCardNombre: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  pastillaCardDescripcion: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontStyle: "italic",
  },
  pastillaCardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pastillaCardTipo: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  pastillaCardDosis: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  pastillaCardInstruction: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a5568",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 8,
  },

  // Estilos para configuración
  configuracionContainer: {
    flex: 1,
    padding: 24, // Añadido padding para consistencia con el paso 2
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 16,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },

  // Estilos para la sección de días seleccionados
  inputContainer: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7A2C34",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  diasSeleccionadosText: {
    fontSize: 16,
    color: "#2d3748",
    lineHeight: 24,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
    fontFamily: "System",
    fontWeight: "500",
  },

  // Estilos para la sección de horarios
  horariosContainer: {
    marginBottom: 24,
  },
  horariosListContainer: {
    gap: 16, // Añade espacio entre los elementos hijos
  },
  horariosTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  horariosTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3748",
    marginLeft: 8,
  },
  horariosSubtitle: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 16,
    lineHeight: 20,
  },

  // ====================================
  // Estilos para configuración
  configuracionContainer: {
    flex: 1,
    padding: 24, // Añadido padding para consistencia con el paso 2
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 16,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },

  // Estilos para la sección de días seleccionados
  inputContainer: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7A2C34",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  diasSeleccionadosText: {
    fontSize: 16,
    color: "#2d3748",
    lineHeight: 24,
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
    fontFamily: "System",
    fontWeight: "500",
  },

  // Estilos para la sección de horarios
  horariosContainer: {
    marginBottom: 24,
  },
  horariosTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  horariosTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3748",
    marginLeft: 8,
  },
  horariosSubtitle: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 16,
    lineHeight: 20,
  },

  // ====================================

  // ESTILOS DE HORARIOS
  // ====================================

  // Contenedor del horario (área clickeable)
  horarioItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  // Línea vertical izquierda
  horarioLeftBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#7A2C34",
  },

  // Contenido del horario
  horarioContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 12,
    height: "100%",
    flex: 1,
  },

  // Botón del horario (área clickeable)
  horaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 10,
  },

  // Texto de la hora
  horarioHora: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a202c",
    marginLeft: 12,
    fontVariant: ["tabular-nums"],
    paddingVertical: 4,
  },

  // Detalles del horario (dosis)
  horarioDetails: {
    marginTop: 4,
    alignItems: "center",
  },

  // Texto de la dosis
  horarioDosisText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4a5568",
  },

  // Botón de eliminar horario
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    padding: 8,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Contenedor cuando no hay horarios
  noHorariosContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },

  // Textos cuando no hay horarios
  noHorariosText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4a5568",
    marginTop: 12,
    textAlign: "center",
  },
  noHorariosSubtext: {
    fontSize: 14,
    color: "#a0aec0",
    marginTop: 4,
    textAlign: "center",
  },

  // Botón para agregar nuevo horario
  agregarHorarioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7A2C34",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: "rgba(122, 44, 52, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  agregarHorarioText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    borderBottomColor: "rgba(0, 0, 0, 0.04)",
    paddingTop: 4,
  },
  step2HeaderContent: {
    marginBottom: 20,
    marginTop: 8,
  },
  step2Title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 6,
    fontFamily: "System",
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
  diaCardCentrado: {
    alignSelf: "center",
    marginLeft: "auto",
    marginRight: "auto",
  },
  diaCardText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#7A2C34",
    marginTop: 6,
    marginBottom: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  // Botón del horario (área clickeable)
  horaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: 10,
  },

  // Texto de la hora
  horarioHora: {
    fontSize: 40,
    fontWeight: "600",
    color: "#2d3748",
    textAlign: "center",
  },

  // Detalles del horario (dosis)
  horarioDetails: {
    marginTop: 4,
    alignItems: "center",
  },

  // Texto de la dosis
  horarioDosisText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4a5568",
  },

  // Estilos para el paso de confirmación
  confirmacionContainer: {
    flex: 1,
    padding: 0,
    backgroundColor: "#f8f9fa",
  },
  confirmacionContentContainer: {
    padding: 16,
    paddingBottom: 80, // Espacio para los botones de navegación
  },
  confirmacionHeaderCard: {
    backgroundColor: "#7A2C34",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  confirmacionHeaderIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  confirmacionTitulo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  confirmacionSubtitulo: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
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
    fontWeight: "600",
    color: "#1a202c",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#4a5568",
  },
  infoHighlight: {
    fontSize: 15,
    color: "#2d3748",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#edf2f7",
    marginVertical: 16,
  },
  diasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    margin: 8,
  },
  diaPill: {
    width: "14%",
    aspectRatio: 1,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  diaSeleccionado: {
    backgroundColor: "#7A2C34",
  },
  diaNoSeleccionado: {
    backgroundColor: "#f0f0f0",
  },
  diaText: {
    fontSize: 14,
    fontWeight: "600",
  },
  diaTextSeleccionado: {
    color: "#fff",
  },
  horariosGrid: {
    marginTop: 8,
  },
  horarioHora: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2d3748",
    marginLeft: 12,
  },
  horarioDosisBadge: {
    backgroundColor: "#7A2C34",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  horarioDosisText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  notaContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(122, 44, 52, 0.1)",
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  notaTexto: {
    flex: 1,
    marginLeft: 10,
    color: "#4a5568",
    fontSize: 14,
    lineHeight: 20,
  },
  confirmacionBotonesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cancelarButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelarButtonText: {
    color: "#4a5568",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmarButton: {
    flex: 2,
    backgroundColor: "#7A2C34",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginLeft: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  confirmarButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },

  // Contenedor cuando no hay horarios
  noHorariosContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },

  // Textos cuando no hay horarios
  noHorariosText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4a5568",
    marginTop: 12,
    textAlign: "center",
  },
  noHorariosSubtext: {
    fontSize: 14,
    color: "#a0aec0",
    marginTop: 4,
    textAlign: "center",
  },

  // Botón para agregar nuevo horario
  agregarHorarioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7A2C34",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: "rgba(122, 44, 52, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  agregarHorarioText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos para el contenedor del paso
  stepContainer: {
    marginTop: 32,
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 16, // Add horizontal padding
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginHorizontal: 16, // Add horizontal margin to match the container
  },
  stepHeaderContent: {
    marginLeft: 12,
  },
  stepHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5C1A1F",
  },
  stepHeaderSubtitle: {
    fontSize: 14,
    color: "#7A2C34",
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16, // Add horizontal margin to match the container
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  infoCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoCardLabel: {
    fontSize: 14,
    color: "#6C757D",
    marginLeft: 8,
    marginRight: 8,
    minWidth: 130,
  },
  infoCardValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "500",
    flex: 1,
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
    borderBottomColor: "rgba(0, 0, 0, 0.04)",
    paddingTop: 4,
  },
  step2HeaderContent: {
    marginBottom: 20,
    marginTop: 8,
  },
  step2Title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 6,
    fontFamily: "System",
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
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
    fontFamily: "System",
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#2c3e50",
    fontFamily: "System",
    shadowColor: "rgba(0,0,0,0.03)",
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
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "rgba(0,0,0,0.03)",
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
    color: "#2c3e50",
    fontFamily: "System",
  },
  placeholderText: {
    color: "#94a3b8",
    fontFamily: "System",
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
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    flex: 1,
    fontFamily: "System",
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
  // Estilos para el paso de configuración de alarmas
  stepHeader: {
    marginBottom: 20,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
    letterSpacing: -0.5,
    fontFamily: 'System',
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 24,
    paddingRight: 10,
    fontFamily: 'System',
  },
  alarmConfigContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 16,
    marginHorizontal: 20,
    padding: 0,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 500,
  },
  generalAlarmContainer: {
    padding: 20,
  },
  generalAlarmItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    padding: 18,
  },
  generalAlarmContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  generalAlarmText: {
    flex: 1,
    marginLeft: 16,
  },
  generalAlarmTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
    fontFamily: 'System',
  },
  generalAlarmSubtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    fontFamily: 'System',
  },
  alarmInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(122, 44, 52, 0.05)",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  alarmInfoText: {
    flex: 1,
    fontSize: 14,
    color: "rgba(122, 44, 52, 0.8)",
    lineHeight: 20,
    marginLeft: 12,
    fontFamily: 'System',
  },
  alarmConfigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#7A2C34',
    borderBottomWidth: 0,
  },
  alarmConfigIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alarmConfigButtonContent: {
    flex: 1,
  },
  alarmConfigButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  alarmConfigButtonSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  alarmsContainer: {
    padding: 20,
    paddingBottom: 12,
  },
  alarmItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.05)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
  },
  alarmContent: {
    flex: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alarmTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  soundIndicator: {
    marginLeft: 10,
    backgroundColor: "rgba(122, 44, 52, 0.1)",
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  alarmItemDisabled: {
    opacity: 0.7,
    backgroundColor: "#F8FAFC",
  },
  alarmTimeContainer: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  alarmDias: {
    fontSize: 13,
    color: "#64748B",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    fontWeight: '500',
    fontFamily: 'System',
  },
  noAlarmsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: "rgba(122, 44, 52, 0.2)",
    borderStyle: "dashed",
    width: '100%',
    alignSelf: 'center',
    maxWidth: 500,
  },
  noAlarmsText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7A2C34",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: 'System',
  },
  noAlarmsSubtext: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
    fontFamily: 'System',
  },
  emptyText: {
    fontSize: 16,
    color: "#6C757D",
    textAlign: "center",
    marginTop: 10,
  },
  // Estilos para la sección de tomas de hoy
  tomasHoyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    margin: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#343A40",
    marginLeft: 10,
  },
  tomasList: {
    marginTop: 10,
  },
  tomaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  tomaHoraContainer: {
    backgroundColor: "#7A2C34",
    borderRadius: 6,
    padding: 8,
    marginRight: 12,
    minWidth: 80,
    alignItems: "center",
  },
  tomaHora: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  tomaInfo: {
    flex: 1,
  },
  tomaNombre: {
    fontSize: 16,
    fontWeight: "500",
    color: "#343A40",
    marginBottom: 4,
  },
  tomaDescripcion: {
    fontSize: 14,
    color: "#6C757D",
  },
  tomasTitulo: {
    fontSize: 18,
    fontWeight: "600",
    color: "#343A40",
    marginBottom: 10,
  },
  tomaHora: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7A2C34",
  },
  tomaInfo: {
    flex: 1,
  },
  tomaNombre: {
    fontSize: 16,
    fontWeight: "500",
    color: "#343A40",
    marginBottom: 2,
  },
  tomaDescripcion: {
    fontSize: 13,
    color: "#6C757D",
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
    position: "relative",
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
  contextMenu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    elevation: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    paddingVertical: 6,
    zIndex: 9999,
  },
  contextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 160,
  },
  contextMenuText: {
    marginLeft: 8,
    color: "#2d3748",
    fontSize: 14,
    fontWeight: "500",
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
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 16,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  horariosDetalleContainer: {
    marginTop: 24,
    padding: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  horariosDetalleHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  horarioIcon: {
    marginRight: 10,
  },
  horariosDetalleTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: 0.2,
  },
  horariosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
  },
  horarioItem: {
    width: "50%",
    padding: 10,
    alarmConfigContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginHorizontal: 16,
      padding: 16,
      shadowColor: 'rgba(0,0,0,0.05)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    alarmConfigContent: {
      width: '100%',
      maxWidth: 500,
      alignSelf: 'center',
    },
    alarmConfigButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1.5,
      borderColor: '#EDEFF2',
      width: '100%',
    },
    alarmConfigIcon: {
      backgroundColor: 'rgba(122, 44, 52, 0.1)',
      borderRadius: 10,
      padding: 8,
      marginRight: 12,
    },
  },
  horarioHora: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  dosisBadge: {
    position: "absolute",
    top: -5,
    right: 5,
    backgroundColor: "#7A2C34",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dosisText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  confirmacionContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  confirmacionContentContainer: {
    paddingBottom: 30,
  },
  confirmacionHeaderCard: {
    backgroundColor: "#7A2C34",
    padding: 25,
    paddingTop: 40,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: -15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmacionHeaderIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 15,
  },
  confirmacionTitulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  confirmacionSubtitulo: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  infoContent: {
    paddingLeft: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#555",
  },
  infoHighlight: {
    fontSize: 16,
    color: "#7A2C34",
    fontWeight: "600",
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  medicamentoNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 15,
  },
  diasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 5,
  },
  diaPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  diaSeleccionado: {
    backgroundColor: "#7A2C34",
    borderColor: "#7A2C34",
  },
  diaNoSeleccionado: {
    backgroundColor: "#f8f9fa",
  },
  diaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  diaTextSeleccionado: {
    color: "#fff",
  },
  horariosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 5,
  },
  horarioCard: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  horarioHora: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  horarioDosisBadge: {
    backgroundColor: "#7A2C34",
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  horarioDosisText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  notaContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8F1F1",
    padding: 18,
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#7A2C34",
  },
  notaTexto: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#5E5E5E",
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
  // Estilos para el modal de selección de sonido
  soundModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  soundModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  soundModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  soundModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 10,
  },
  soundModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  soundCloseButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(122, 44, 52, 0.1)',
  },
  soundOptionsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  soundOptionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  soundOptionSelected: {
    backgroundColor: '#F8F1F1',
    borderColor: '#7A2C34',
  },
  soundOptionDisabled: {
    opacity: 0.6,
  },
  soundOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundIconContainer: {
    backgroundColor: 'rgba(122, 44, 52, 0.1)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  soundIconContainerSelected: {
    backgroundColor: '#7A2C34',
  },
  soundOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  soundOptionTextSelected: {
    color: '#7A2C34',
  },
  checkmarkContainer: {
    backgroundColor: 'rgba(122, 44, 52, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmButton: {
    backgroundColor: '#7A2C34',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuPlaceholder: {
    height: 0,
    width: 0,
  },
  disabledButton: {
    opacity: 0.5,
  },
  playingIndicator: {
    marginLeft: 10,
  },
});

// End of component
export default Medicamentos;
