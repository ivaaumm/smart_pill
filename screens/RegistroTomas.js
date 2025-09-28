import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  DeviceEventEmitter,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../UserContextProvider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../config';

const RegistroTomas = () => {
  const { user } = useUser();
  const navigation = useNavigation();
  
  // Estados principales
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTiempo, setFiltroTiempo] = useState('todos');
  const [filtroTratamiento, setFiltroTratamiento] = useState('todos');
  const [filtroMedicamento, setFiltroMedicamento] = useState('');
  const [fechaDesde, setFechaDesde] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 días atrás
  const [fechaHasta, setFechaHasta] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 días adelante
  const [showDatePickerDesde, setShowDatePickerDesde] = useState(false);
  const [showDatePickerHasta, setShowDatePickerHasta] = useState(false);
  const [medicamentosDisponibles, setMedicamentosDisponibles] = useState([]);
  const [tratamientosDisponibles, setTratamientosDisponibles] = useState([]);
  
  // Estados para el modal de observaciones
  const [modalObservacionesVisible, setModalObservacionesVisible] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [observacionTexto, setObservacionTexto] = useState('');
  const [guardandoObservacion, setGuardandoObservacion] = useState(false);
  const [alturaObservacion, setAlturaObservacion] = useState(100);
  
  // Estados para auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // Configuración de actualización automática
  const AUTO_REFRESH_INTERVAL = 30000; // 30 segundos
  const MIN_UPDATE_INTERVAL = 5000; // Mínimo 5 segundos entre actualizaciones

  useEffect(() => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    cargarRegistros();
    
    // Configurar listener para eventos de cambio de estado
    const eventListener = DeviceEventEmitter.addListener('medicationStateChanged', (data) => {
      console.log('🔄 Evento de cambio de estado recibido:', data);
      // Actualizar solo si ha pasado el tiempo mínimo
      const now = Date.now();
      if (now - lastUpdateRef.current >= MIN_UPDATE_INTERVAL) {
        lastUpdateRef.current = now;
        cargarRegistrosSilencioso();
      }
    });

    return () => {
      eventListener.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  // Configurar actualización automática cuando la pantalla está enfocada
  useFocusEffect(
    React.useCallback(() => {
      if (autoRefreshEnabled) {
        // Iniciar actualización automática
        intervalRef.current = setInterval(() => {
          console.log('🔄 Actualización automática ejecutándose...');
          cargarRegistrosSilencioso();
        }, AUTO_REFRESH_INTERVAL);
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [autoRefreshEnabled])
  );

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    let registrosFiltrados = [...registros];

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      registrosFiltrados = registrosFiltrados.filter(registro => registro.estado === filtroEstado);
    }

    // Filtro por tiempo
    if (filtroTiempo !== 'todos') {
      const ahora = new Date();
      let fechaLimite;
      
      if (filtroTiempo === 'semana') {
        fechaLimite = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filtroTiempo === 'mes') {
        fechaLimite = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (fechaLimite) {
        registrosFiltrados = registrosFiltrados.filter(registro => {
          const fechaRegistro = new Date(registro.fecha_programada);
          return fechaRegistro >= fechaLimite;
        });
      }
    }

    // Filtro por tratamiento
    if (filtroTratamiento !== 'todos') {
      registrosFiltrados = registrosFiltrados.filter(registro => 
        registro.nombre_tratamiento && registro.nombre_tratamiento.toLowerCase().includes(filtroTratamiento.toLowerCase())
      );
    }

    // Filtro por medicamento
    if (filtroMedicamento && filtroMedicamento !== 'todos') {
      registrosFiltrados = registrosFiltrados.filter(registro => 
        (registro.nombre_comercial && registro.nombre_comercial.toLowerCase().includes(filtroMedicamento.toLowerCase())) ||
        (registro.nombre_tratamiento && registro.nombre_tratamiento.toLowerCase().includes(filtroMedicamento.toLowerCase()))
      );
    }

    // Filtro por rango de fechas
    registrosFiltrados = registrosFiltrados.filter(registro => {
      const fechaRegistro = new Date(registro.fecha_programada);
      return fechaRegistro >= fechaDesde && fechaRegistro <= fechaHasta;
    });

    setRegistrosFiltrados(registrosFiltrados);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroTiempo('todos');
    setFiltroTratamiento('todos');
    setFiltroMedicamento('');
    setFechaDesde(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    setFechaHasta(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  // Función para extraer medicamentos únicos
  const extraerMedicamentosUnicos = (registros) => {
    const medicamentos = new Set();
    registros.forEach(registro => {
      if (registro.nombre_comercial) medicamentos.add(registro.nombre_comercial);
      if (registro.nombre_tratamiento) medicamentos.add(registro.nombre_tratamiento);
    });
    return Array.from(medicamentos).sort();
  };

  // Función para extraer tratamientos únicos
  const extraerTratamientosUnicos = (registros) => {
    const tratamientos = new Set();
    registros.forEach(registro => {
      if (registro.nombre_tratamiento) tratamientos.add(registro.nombre_tratamiento);
    });
    return Array.from(tratamientos).sort();
  };

  // Aplicar filtros cuando cambien los datos o filtros
  useEffect(() => {
    aplicarFiltros();
    setMedicamentosDisponibles(extraerMedicamentosUnicos(registros));
    setTratamientosDisponibles(extraerTratamientosUnicos(registros));
  }, [registros, filtroEstado, filtroTiempo, filtroTratamiento, filtroMedicamento, fechaDesde, fechaHasta]);

  // Funciones para manejar observaciones
  const abrirModalObservaciones = (registro) => {
    setRegistroSeleccionado(registro);
    setObservacionTexto(registro.observaciones || '');
    setAlturaObservacion(100); // Resetear altura al abrir modal
    setModalObservacionesVisible(true);
  };

  const cerrarModalObservaciones = () => {
    setModalObservacionesVisible(false);
    setRegistroSeleccionado(null);
    setObservacionTexto('');
    setAlturaObservacion(100); // Resetear altura al cerrar modal
  };

  const guardarObservacion = async () => {
    if (!registroSeleccionado) return;

    console.log('🔄 Iniciando guardarObservacion...');
    console.log('📋 Datos a enviar:', {
      registro_id: registroSeleccionado.registro_id,
      observaciones: observacionTexto.trim(),
      url: `${API_URL}/actualizar_observaciones.php`
    });

    setGuardandoObservacion(true);
    try {
      console.log('🌐 Realizando fetch a:', `${API_URL}/actualizar_observaciones.php`);
      
      const response = await fetch(`${API_URL}/actualizar_observaciones.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registro_id: registroSeleccionado.registro_id,
          observaciones: observacionTexto.trim()
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        console.error('❌ Response no OK. Status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        console.log('✅ Observación guardada exitosamente');
        
        // Actualizar el registro local con el campo correcto
        setRegistros(prevRegistros => 
          prevRegistros.map(registro => 
            registro.registro_id === registroSeleccionado.registro_id 
              ? { ...registro, observaciones: observacionTexto.trim() }
              : registro
          )
        );
        
        // Recargar datos del servidor para asegurar sincronización
        await cargarRegistrosInterno();
        
        Alert.alert('Éxito', 'Observación guardada correctamente');
        cerrarModalObservaciones();
      } else {
        console.error('❌ Error del servidor:', data.message || data.error);
        Alert.alert('Error', data.message || data.error || 'No se pudo guardar la observación');
      }
    } catch (error) {
      console.error('💥 Error completo al guardar observación:', error);
      console.error('💥 Error name:', error.name);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      
      let errorMessage = 'Error de conexión al guardar la observación';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setGuardandoObservacion(false);
      console.log('🏁 Finalizando guardarObservacion');
    }
  };
  const cargarRegistros = async () => {
    if (!user?.usuario_id) return;
    
    try {
      setLoading(true);
      await cargarRegistrosInterno();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para cargar registros sin mostrar loading (para actualizaciones automáticas)
  const cargarRegistrosSilencioso = async () => {
    if (!user?.usuario_id || loading || refreshing) return;
    
    try {
      await cargarRegistrosInterno();
    } catch (error) {
      console.log('⚠️ Error en actualización silenciosa (no crítico):', error);
    }
  };

  const cargarRegistrosInterno = async (loading = true) => {
    try {
      console.log('🚀 [REGISTRO TOMAS] Iniciando carga de registros...');
      console.log('👤 [REGISTRO TOMAS] Usuario actual:', user);
      
      if (!user || !user.usuario_id) {
        console.log('❌ [REGISTRO TOMAS] No hay usuario logueado');
        return;
      }

      if (loading) {
        setIsLoading(true);
      }

      // Buscar desde hace 7 días hasta 7 días en el futuro para incluir registros programados
      const fechaDesde = new Date();
      fechaDesde.setDate(fechaDesde.getDate() - 7);
      const fechaDesdeStr = fechaDesde.toISOString().split('T')[0];
      
      const fechaHasta = new Date();
      fechaHasta.setDate(fechaHasta.getDate() + 7);
      const fechaHastaStr = fechaHasta.toISOString().split('T')[0];
      
      const url = `${API_URL}/registro_tomas.php?usuario_id=${user.usuario_id}&fecha_desde=${fechaDesdeStr}&fecha_hasta=${fechaHastaStr}`;
      
      console.log(`🔍 [REGISTRO TOMAS] Cargando registros para usuario ${user.usuario_id}`);
      console.log(`📅 [REGISTRO TOMAS] Rango de fechas: ${fechaDesdeStr} hasta ${fechaHastaStr}`);
      console.log(`🌐 [REGISTRO TOMAS] URL completa: ${url}`);
      console.log(`🔧 [REGISTRO TOMAS] API_URL configurada: ${API_URL}`);
      
      const response = await fetch(url);
      
      console.log(`📡 [REGISTRO TOMAS] Status de respuesta: ${response.status}`);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`📥 [REGISTRO TOMAS] Respuesta cruda (primeros 500 chars):`, responseText.substring(0, 500));
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('📋 [REGISTRO TOMAS] Respuesta parseada:', data);
        } catch (parseError) {
          console.error('❌ [REGISTRO TOMAS] Error parseando JSON:', parseError);
          console.error('❌ [REGISTRO TOMAS] Respuesta que causó el error:', responseText);
          if (loading) {
            Alert.alert('Error', 'Error en el formato de respuesta del servidor');
          }
          return;
        }
        
        // Corregir: usar data.registros en lugar de data directamente
        if (data.success && Array.isArray(data.registros)) {
          console.log(`✅ [REGISTRO TOMAS] ${data.registros.length} registros encontrados`);
          console.log('📋 [REGISTRO TOMAS] Registros detallados:', data.registros.map(r => ({
            id: r.registro_id,
            medicamento: r.nombre_comercial,
            fecha: r.fecha_programada,
            hora: r.hora_programada,
            estado: r.estado
          })));
        
        // Actualizar estado solo si hay cambios
        setRegistros(prevRegistros => {
          const newRegistrosStr = JSON.stringify(data.registros);
          const prevRegistrosStr = JSON.stringify(prevRegistros);
          
          if (newRegistrosStr !== prevRegistrosStr) {
            console.log('🔄 [REGISTRO TOMAS] Registros actualizados - hay cambios');
            console.log('📊 [REGISTRO TOMAS] Estado anterior:', prevRegistros.length, 'registros');
            console.log('📊 [REGISTRO TOMAS] Estado nuevo:', data.registros.length, 'registros');
            
            // Preservar observaciones locales que no están en el servidor
            const registrosConObservacionesLocales = data.registros.map(registroServidor => {
              const registroLocal = prevRegistros.find(r => r.registro_id === registroServidor.registro_id);
              
              // Si hay una observación local que no está en el servidor, preservarla
              if (registroLocal && 
                  registroLocal.observaciones && 
                  registroLocal.observaciones.trim() !== '' &&
                  (!registroServidor.observaciones || registroServidor.observaciones.trim() === '')) {
                console.log(`🔄 [REGISTRO TOMAS] Preservando observación local para registro ${registroServidor.registro_id}:`, registroLocal.observaciones);
                return {
                  ...registroServidor,
                  observaciones: registroLocal.observaciones
                };
              }
              
              return registroServidor;
            });
            
            lastUpdateRef.current = Date.now();
            return registrosConObservacionesLocales;
          } else {
            console.log('✅ [REGISTRO TOMAS] Registros sin cambios');
            return prevRegistros;
          }
        });
      } else {
        console.log('⚠️ [REGISTRO TOMAS] No se encontraron registros o estructura incorrecta');
        console.log('⚠️ [REGISTRO TOMAS] Estructura de data:', data);
        console.log('⚠️ [REGISTRO TOMAS] data.success:', data.success);
        console.log('⚠️ [REGISTRO TOMAS] Array.isArray(data.registros):', Array.isArray(data.registros));
        setRegistros([]);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ [REGISTRO TOMAS] Error HTTP ${response.status}:`, errorText);
      if (loading) {
        Alert.alert('Error', `No se pudieron cargar los registros (${response.status})`);
      }
      setRegistros([]);
    }
  } catch (error) {
    console.error('❌ [REGISTRO TOMAS] Error en cargarRegistrosInterno:', error);
    if (loading) {
      Alert.alert('Error', 'Error de conexión al cargar registros');
    }
    setRegistros([]);
  } finally {
    if (loading) {
      setIsLoading(false);
    }
    setRefreshing(false);
  }
};

  const onRefresh = () => {
    setRefreshing(true);
    cargarRegistros();
  };

  const confirmarToma = async (registroId) => {
    try {
      console.log(`🔄 Confirmando toma para registro ID: ${registroId}`);
      
      const requestData = {
        registro_id: registroId,
        estado: 'tomada',
        observaciones: ''
      };
      
      console.log('📤 Enviando datos:', requestData);
      
      // PRIMERO: Enviar al endpoint de debug para capturar la petición
      try {
        console.log('🔍 Enviando petición al endpoint de debug...');
        const debugResponse = await fetch(
          `${API_URL}/../debug_peticiones_app.php`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          }
        );
        const debugData = await debugResponse.json();
        console.log('🔍 Debug response:', debugData);
      } catch (debugError) {
        console.log('⚠️ Error en debug endpoint (no crítico):', debugError);
      }
      
      // SEGUNDO: Enviar al endpoint real
      console.log('📡 Enviando petición al endpoint real...');
      const response = await fetch(
          `${API_URL}/registro_tomas.php`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        }
      );
      
      console.log(`📡 Respuesta HTTP status: ${response.status}`);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Respuesta exitosa:', responseData);
        
        // Actualizar inmediatamente el estado local
        setRegistros(prevRegistros => 
          prevRegistros.map(registro => 
            registro.registro_id === registroId 
              ? { ...registro, estado: 'tomada' }
              : registro
          )
        );
        
        // Emitir evento de cambio de estado para actualización automática
        DeviceEventEmitter.emit('medicationStateChanged', {
          registroId: registroId,
          nuevoEstado: 'tomada',
          timestamp: Date.now(),
          source: 'RegistroTomas'
        });
        
        Alert.alert('Éxito', 'Toma confirmada correctamente');
        
        // Actualizar desde el servidor para sincronizar
        setTimeout(() => {
          cargarRegistrosSilencioso();
        }, 1000);
        
      } else {
        const errorData = await response.text();
        console.error('❌ Error en respuesta:', errorData);
        Alert.alert('Error', `No se pudo confirmar la toma. Status: ${response.status}\nRespuesta: ${errorData.substring(0, 200)}`);
      }
    } catch (error) {
      console.error('❌ Error en confirmarToma:', error);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Error', 'Error de conexión: ' + error.message);
    }
  };

  // Función para descargar y compartir PDF
  const descargarReportePDF = async () => {
    try {
      if (!user || !user.usuario_id) {
        Alert.alert('Error', 'No se pudo identificar el usuario');
        return;
      }

      // Mostrar indicador de carga
      Alert.alert('Generando PDF', 'Por favor espera mientras se genera el reporte...');

      // Calcular fechas para el reporte (últimos 30 días)
      const fechaHasta = new Date();
      const fechaDesde = new Date();
      fechaDesde.setDate(fechaDesde.getDate() - 30);

      const fechaDesdeStr = fechaDesde.toISOString().split('T')[0];
      const fechaHastaStr = fechaHasta.toISOString().split('T')[0];

      // Construir URL del endpoint
      const url = `${API_URL}/generar_reporte_pdf.php?usuario_id=${user.usuario_id}&fecha_desde=${fechaDesdeStr}&fecha_hasta=${fechaHastaStr}`;
      
      console.log('🔗 URL del reporte PDF:', url);

      // Descargar el archivo PDF
      const fileName = `reporte_medicamentos_${fechaDesdeStr}_${fechaHastaStr}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      
      if (downloadResult.status === 200) {
        console.log('✅ PDF descargado exitosamente:', downloadResult.uri);
        
        // Verificar si se puede compartir
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // Compartir el archivo como un comprobante
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Compartir Reporte de Medicamentos',
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert(
            'Descarga Completa', 
            `El reporte se ha guardado en: ${downloadResult.uri}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        throw new Error(`Error en la descarga: ${downloadResult.status}`);
      }

    } catch (error) {
      console.error('❌ Error al descargar reporte PDF:', error);
      Alert.alert('Error', 'No se pudo generar el reporte PDF. Verifica tu conexión e inténtalo de nuevo.');
    }
  };

  const renderRegistro = ({ item }) => {
    const getEstadoColor = (estado) => {
      switch (estado) {
        case 'tomada': return '#28a745';
        case 'completada': return '#28a745';
        case 'pospuesta': return '#ffc107';
        case 'rechazada': return '#dc3545';
        case 'perdida': return '#dc3545';
        case 'omitida': return '#dc3545';
        default: return '#7A2C34';
      }
    };

    const getEstadoIcon = (estado) => {
      switch (estado) {
        case 'tomada': return 'check-circle';
        case 'completada': return 'check-circle';
        case 'pospuesta': return 'schedule';
        case 'rechazada': return 'cancel';
        case 'perdida': return 'cancel';
        case 'omitida': return 'cancel';
        default: return 'help';
      }
    };

    const getEstadoTexto = (estado) => {
      switch (estado) {
        case 'tomada': return 'Tomada';
        case 'completada': return 'Completada';
        case 'pospuesta': return 'Pospuesta';
        case 'perdida': return 'Perdida';
        case 'rechazada': return 'Rechazada';
        case 'omitida': return 'Omitida';
        default: return 'Desconocido';
      }
    };

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
      
      return fechaObj.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    };

    return (
      <View style={styles.registroCard}>
        <View style={styles.registroHeader}>
          <View style={styles.medicamentoInfo}>
            <MaterialIcons name="medication" size={24} color="#7A2C34" />
            <View style={styles.medicamentoTexto}>
              <Text style={styles.medicamentoNombre}>
                {item.nombre_tratamiento || item.nombre_comercial || 'Medicamento'}
              </Text>
              <Text style={styles.medicamentoComercial}>
                {item.nombre_comercial}
              </Text>
              {item.dosis && (
                <Text style={styles.dosis}>{item.dosis}</Text>
              )}
            </View>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
            <MaterialIcons 
              name={getEstadoIcon(item.estado)} 
              size={16} 
              color="white" 
              style={styles.estadoIcon}
            />
            <Text style={styles.estadoTexto}>{getEstadoTexto(item.estado)}</Text>
          </View>
        </View>
        
        <View style={styles.fechaHoraContainer}>
          <View style={styles.fechaInfo}>
            <MaterialIcons name="event" size={16} color="#666" />
            <Text style={styles.fechaTexto}>
              {formatearFecha(item.fecha_programada)}
            </Text>
          </View>
          <View style={styles.horaInfo}>
            <MaterialIcons name="access-time" size={16} color="#666" />
            <Text style={styles.horaTexto}>{item.hora_programada ? item.hora_programada.substring(0, 5) : '--:--'}</Text>
          </View>
        </View>
        
        {/* Mostrar observación existente si la hay */}
        {item.observaciones && (
          <View style={styles.observacionContainer}>
            <MaterialIcons name="note" size={16} color="#666" />
            <Text style={styles.observacionTexto}>{item.observaciones}</Text>
          </View>
        )}
        
        {/* Botones de acción */}
        <View style={styles.botonesContainer}>
          {(item.estado === 'pospuesta' || item.estado === 'rechazada' || item.estado === 'omitida') && (
            <TouchableOpacity
              style={styles.confirmarButton}
              onPress={() => confirmarToma(item.registro_id)}
            >
              <MaterialIcons name="check" size={20} color="white" />
              <Text style={styles.confirmarButtonText}>Marcar como Tomada</Text>
            </TouchableOpacity>
          )}
          
          {/* Botón de observaciones */}
          <TouchableOpacity
            style={styles.observacionButton}
            onPress={() => abrirModalObservaciones(item)}
          >
            <MaterialIcons name="note-add" size={20} color="#7A2C34" />
            <Text style={styles.observacionButtonText}>
              {item.observaciones ? 'Editar Observación' : 'Agregar Observación'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A2C34" />
          <Text style={styles.loadingText}>Cargando registros...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      
      {/* Panel de Filtros */}
      <View style={[styles.filtrosContainer, { marginTop: 20 }]}>
        {/* Primera fila - Filtros por Estado */}
        <View style={styles.filtrosRow}>
          <TouchableOpacity 
            style={[
              styles.filtroButton, 
              filtroEstado === 'tomada' && styles.filtroButtonActive,
              filtroEstado === 'tomada' && styles.filtroButtonTomada
            ]}
            onPress={() => setFiltroEstado(filtroEstado === 'tomada' ? 'todos' : 'tomada')}
          >
            <MaterialIcons name="check-circle" size={16} color={filtroEstado === 'tomada' ? '#fff' : '#4CAF50'} />
            <Text style={[
              styles.filtroButtonText,
              filtroEstado === 'tomada' && styles.filtroButtonTextActive
            ]}>Tomadas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filtroButton, 
              filtroEstado === 'pospuesta' && styles.filtroButtonActive,
              filtroEstado === 'pospuesta' && styles.filtroButtonPospuesta
            ]}
            onPress={() => setFiltroEstado(filtroEstado === 'pospuesta' ? 'todos' : 'pospuesta')}
          >
            <MaterialIcons name="schedule" size={16} color={filtroEstado === 'pospuesta' ? '#fff' : '#FF9800'} />
            <Text style={[
              styles.filtroButtonText,
              filtroEstado === 'pospuesta' && styles.filtroButtonTextActive
            ]}>Pospuestas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filtroButton, 
              filtroEstado === 'omitida' && styles.filtroButtonActive,
              filtroEstado === 'omitida' && styles.filtroButtonOmitida
            ]}
            onPress={() => setFiltroEstado(filtroEstado === 'omitida' ? 'todos' : 'omitida')}
          >
            <MaterialIcons name="cancel" size={16} color={filtroEstado === 'omitida' ? '#fff' : '#F44336'} />
            <Text style={[
              styles.filtroButtonText,
              filtroEstado === 'omitida' && styles.filtroButtonTextActive
            ]}>Omitidas</Text>
          </TouchableOpacity>
        </View>

        {/* Segunda fila - Filtros por Tiempo */}
        <View style={styles.filtrosRow}>
          <TouchableOpacity 
            style={[
              styles.filtroButton, 
              filtroTiempo === 'semana' && styles.filtroButtonActive,
              filtroTiempo === 'semana' && styles.filtroButtonTiempo
            ]}
            onPress={() => setFiltroTiempo(filtroTiempo === 'semana' ? 'todos' : 'semana')}
          >
            <Text style={[
              styles.filtroButtonText,
              filtroTiempo === 'semana' && styles.filtroButtonTextActive
            ]}>Última semana</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filtroButton, 
              filtroTiempo === 'mes' && styles.filtroButtonActive,
              filtroTiempo === 'mes' && styles.filtroButtonTiempo
            ]}
            onPress={() => setFiltroTiempo(filtroTiempo === 'mes' ? 'todos' : 'mes')}
          >
            <Text style={[
              styles.filtroButtonText,
              filtroTiempo === 'mes' && styles.filtroButtonTextActive
            ]}>Último mes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filtroButton, 
              filtroTiempo === 'todos' && styles.filtroButtonActive,
              filtroTiempo === 'todos' && styles.filtroButtonTiempo
            ]}
            onPress={() => setFiltroTiempo('todos')}
          >
            <Text style={[
              styles.filtroButtonText,
              filtroTiempo === 'todos' && styles.filtroButtonTextActive
            ]}>Todos</Text>
          </TouchableOpacity>
        </View>

        {/* Tercera fila - Filtros por Tratamiento */}
        {tratamientosDisponibles.length > 0 && (
          <View style={styles.filtrosRow}>
            <TouchableOpacity 
              style={[
                styles.filtroButton, 
                filtroTratamiento === 'todos' && styles.filtroButtonActive,
                filtroTratamiento === 'todos' && styles.filtroButtonTratamiento
              ]}
              onPress={() => setFiltroTratamiento('todos')}
            >
              <MaterialIcons name="medical-services" size={16} color={filtroTratamiento === 'todos' ? '#fff' : '#2196F3'} />
              <Text style={[
                styles.filtroButtonText,
                filtroTratamiento === 'todos' && styles.filtroButtonTextActive
              ]}>Todos</Text>
            </TouchableOpacity>

            {tratamientosDisponibles.slice(0, 2).map((tratamiento, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.filtroButton, 
                  filtroTratamiento === tratamiento && styles.filtroButtonActive,
                  filtroTratamiento === tratamiento && styles.filtroButtonTratamiento
                ]}
                onPress={() => setFiltroTratamiento(filtroTratamiento === tratamiento ? 'todos' : tratamiento)}
              >
                <MaterialIcons name="medical-services" size={16} color={filtroTratamiento === tratamiento ? '#fff' : '#2196F3'} />
                <Text style={[
                  styles.filtroButtonText,
                  filtroTratamiento === tratamiento && styles.filtroButtonTextActive
                ]} numberOfLines={1}>
                  {tratamiento.length > 12 ? tratamiento.substring(0, 12) + '...' : tratamiento}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Iconos adicionales */}
        <View style={styles.filtrosIconsRow}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={descargarReportePDF}
          >
            <MaterialIcons name="file-download" size={20} color="#7A2C34" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#7A2C34']}
            tintColor="#7A2C34"
          />
        }
      >
        {(!registrosFiltrados || registrosFiltrados.length === 0) ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No hay registros disponibles</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán tus tomas de medicamentos una vez que comiences a registrarlas
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {(registrosFiltrados || []).map((item) => (
              <View key={item.registro_id?.toString() || Math.random().toString()}>
                {renderRegistro({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* DateTimePickers */}
      {showDatePickerDesde && (
        <DateTimePicker
          value={fechaDesde}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePickerDesde(false);
            if (selectedDate) {
              setFechaDesde(selectedDate);
            }
          }}
        />
      )}

      {showDatePickerHasta && (
        <DateTimePicker
          value={fechaHasta}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePickerHasta(false);
            if (selectedDate) {
              setFechaHasta(selectedDate);
            }
          }}
        />
      )}

      {/* Modal de Observaciones */}
      <Modal
        visible={modalObservacionesVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={cerrarModalObservaciones}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {registroSeleccionado?.observaciones ? 'Editar Observación' : 'Agregar Observación'}
              </Text>
              <TouchableOpacity onPress={cerrarModalObservaciones}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                {registroSeleccionado?.nombre_tratamiento || registroSeleccionado?.nombre_comercial}
              </Text>
              <Text style={styles.modalFecha}>
                {registroSeleccionado?.fecha_programada} - {registroSeleccionado?.hora_programada?.substring(0, 5)}
              </Text>
              
              <TextInput
                style={[styles.observacionInput, { height: Math.max(100, alturaObservacion) }]}
                placeholder="Escribe tu observación aquí..."
                value={observacionTexto}
                onChangeText={setObservacionTexto}
                onContentSizeChange={(event) => {
                  const nuevaAltura = event.nativeEvent.contentSize.height;
                  console.log('📏 Altura del contenido:', nuevaAltura);
                  setAlturaObservacion(Math.max(100, nuevaAltura + 40)); // +40 para padding extra
                }}
                multiline={true}
                scrollEnabled={false}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cerrarModalObservaciones}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, guardandoObservacion && styles.saveButtonDisabled]}
                onPress={guardarObservacion}
                disabled={guardandoObservacion}
              >
                {guardandoObservacion ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#7A2C34',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  registroCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#7A2C34',
  },
  registroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicamentoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  medicamentoTexto: {
    marginLeft: 12,
    flex: 1,
  },
  medicamentoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  medicamentoComercial: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  dosis: {
    fontSize: 14,
    color: '#7A2C34',
    fontWeight: '500',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 100,
    justifyContent: 'center',
  },
  estadoIcon: {
    marginRight: 4,
  },
  estadoTexto: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fechaHoraContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  fechaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  horaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  fechaTexto: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  horaTexto: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  confirmarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7A2C34',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confirmarButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7A2C34',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerText: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  filtrosContainer: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  filtrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  filtroButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  filtroButtonActive: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filtroButtonTomada: {
    backgroundColor: '#4CAF50',
  },
  filtroButtonPospuesta: {
    backgroundColor: '#FF9800',
  },
  filtroButtonOmitida: {
    backgroundColor: '#F44336',
  },
  filtroButtonTiempo: {
    backgroundColor: '#7A2C34',
  },
  filtroButtonTratamiento: {
    backgroundColor: '#2196F3',
  },
  filtroButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  filtroButtonTextActive: {
    color: '#fff',
  },
  filtrosIconsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  // Estilos para observaciones
  observacionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  observacionTexto: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  botonesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  observacionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#7A2C34',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: 120,
  },
  observacionButtonText: {
    color: '#7A2C34',
    fontWeight: '500',
    fontSize: 12,
    marginLeft: 4,
  },
  // Estilos para el modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A2C34',
    marginBottom: 4,
  },
  modalFecha: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  observacionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#7A2C34',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RegistroTomas;