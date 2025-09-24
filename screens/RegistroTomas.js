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
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../UserContextProvider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const RegistroTomas = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

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

  const cargarRegistrosInterno = async () => {
    // Buscar desde hace 7 días hasta 7 días en el futuro para incluir registros programados
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaDesde.getDate() - 7);
    const fechaDesdeStr = fechaDesde.toISOString().split('T')[0];
    
    const fechaHasta = new Date();
    fechaHasta.setDate(fechaHasta.getDate() + 7);
    const fechaHastaStr = fechaHasta.toISOString().split('T')[0];
    
    const url = `http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=${user.usuario_id}&fecha_desde=${fechaDesdeStr}&fecha_hasta=${fechaHastaStr}`;
    
    console.log(`🔍 Cargando registros para usuario ${user.usuario_id}`);
    console.log(`📅 Rango de fechas: ${fechaDesdeStr} hasta ${fechaHastaStr}`);
    console.log(`🌐 URL completa: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`📡 Status de respuesta: ${response.status}`);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log(`📥 Respuesta cruda (primeros 500 chars):`, responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📋 Respuesta parseada:', data);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        console.error('❌ Respuesta que causó el error:', responseText);
        if (loading) {
          Alert.alert('Error', 'Error en el formato de respuesta del servidor');
        }
        return;
      }
      
      // Corregir: usar data.registros en lugar de data directamente
      if (data.success && Array.isArray(data.registros)) {
        console.log(`✅ ${data.registros.length} registros encontrados`);
        console.log('📋 Registros detallados:', data.registros.map(r => ({
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
            console.log('🔄 Registros actualizados - hay cambios');
            lastUpdateRef.current = Date.now();
            return data.registros;
          } else {
            console.log('✅ Registros sin cambios');
            return prevRegistros;
          }
        });
      } else {
        console.log('⚠️ No se encontraron registros o estructura incorrecta');
        console.log('⚠️ Estructura de data:', data);
        setRegistros([]);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Error HTTP ${response.status}:`, errorText);
      if (loading) {
        Alert.alert('Error', `No se pudieron cargar los registros (${response.status})`);
      }
      setRegistros([]);
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
        observaciones: 'Actualizado desde el registro de tomas'
      };
      
      console.log('📤 Enviando datos:', requestData);
      
      // PRIMERO: Enviar al endpoint de debug para capturar la petición
      try {
        console.log('🔍 Enviando petición al endpoint de debug...');
        const debugResponse = await fetch(
          'http://192.168.1.87/smart_pill/debug_peticiones_app.php',
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
        'http://192.168.1.87/smart_pill/smart_pill_api/registro_tomas.php',
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
        
        // Emitir evento de cambio de estado para actualización automática
        DeviceEventEmitter.emit('medicationStateChanged', {
          registroId: registroId,
          nuevoEstado: 'tomada',
          timestamp: Date.now(),
          source: 'RegistroTomas'
        });
        
        Alert.alert('Éxito', 'Toma confirmada correctamente');
        
        // Actualizar inmediatamente sin esperar al intervalo
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
      return new Date(fecha).toLocaleDateString('es-ES', {
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
        
        {(item.estado === 'pospuesta' || item.estado === 'rechazada' || item.estado === 'omitida') && (
          <TouchableOpacity
            style={styles.confirmarButton}
            onPress={() => confirmarToma(item.registro_id)}
          >
            <MaterialIcons name="check" size={20} color="white" />
            <Text style={styles.confirmarButtonText}>Marcar como Tomada</Text>
          </TouchableOpacity>
        )}
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
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="file-download" size={20} color="#7A2C34" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="insert-chart" size={20} color="#7A2C34" />
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
            <TouchableOpacity style={styles.refreshButton} onPress={cargarRegistros}>
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text style={styles.refreshButtonText}>Actualizar</Text>
            </TouchableOpacity>
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
});

export default RegistroTomas;