import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContextProvider';

const RegistroTomas = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    cargarRegistros();
  }, [user]);

  const cargarRegistros = async () => {
    if (!user?.usuario_id) return;
    
    try {
      setLoading(true);
      const fechaDesde = new Date();
      fechaDesde.setDate(fechaDesde.getDate() - 7); // Últimos 7 días
      const fechaDesdeStr = fechaDesde.toISOString().split('T')[0];
      
      const response = await fetch(
        `http://192.168.0.125/smart_pill/smart_pill_api/registro_tomas.php?usuario_id=${user.usuario_id}&fecha_desde=${fechaDesdeStr}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setRegistros(Array.isArray(data) ? data : []);
      } else {
        Alert.alert('Error', 'No se pudieron cargar los registros');
        setRegistros([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión: ' + error.message);
      setRegistros([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarRegistros();
  };

  const confirmarToma = async (registroId) => {
    try {
      const response = await fetch(
        'http://192.168.0.125/smart_pill/smart_pill_api/confirmar_toma.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registro_id: registroId,
            estado: 'completada'
          })
        }
      );
      
      if (response.ok) {
        Alert.alert('Éxito', 'Toma confirmada correctamente');
        cargarRegistros();
      } else {
        Alert.alert('Error', 'No se pudo confirmar la toma');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión: ' + error.message);
    }
  };

  const renderRegistro = ({ item }) => {
    const getEstadoColor = (estado) => {
      switch (estado) {
        case 'completada': return '#28a745';
        case 'pospuesta': return '#ffc107';
        case 'perdida': return '#dc3545';
        default: return '#7A2C34';
      }
    };

    const getEstadoIcon = (estado) => {
      switch (estado) {
        case 'completada': return 'check-circle';
        case 'pospuesta': return 'schedule';
        case 'perdida': return 'cancel';
        default: return 'pending';
      }
    };

    const getEstadoTexto = (estado) => {
      switch (estado) {
        case 'completada': return 'Completada';
        case 'pospuesta': return 'Pospuesta';
        case 'perdida': return 'Perdida';
        default: return 'Pendiente';
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
                {item.nombre_comercial || 'Medicamento'}
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
            <Text style={styles.horaTexto}>{item.hora_programada}</Text>
          </View>
        </View>
        
        {item.estado === 'pendiente' && (
          <TouchableOpacity
            style={styles.confirmarButton}
            onPress={() => confirmarToma(item.registro_id)}
          >
            <MaterialIcons name="check" size={20} color="white" />
            <Text style={styles.confirmarButtonText}>Confirmar Toma</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Registro de Tomas</Text>
          <Text style={styles.subtitle}>Historial de medicamentos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7A2C34" />
          <Text style={styles.loadingText}>Cargando registros...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Registro de Tomas</Text>
        <Text style={styles.subtitle}>
          {(registros && registros.length > 0) ? `${registros.length} registros encontrados` : 'Historial de medicamentos'}
        </Text>
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
        {(!registros || registros.length === 0) ? (
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
            {(registros || []).map((item) => (
              <View key={item.registro_id?.toString() || Math.random().toString()}>
                {renderRegistro({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
});

export default RegistroTomas;