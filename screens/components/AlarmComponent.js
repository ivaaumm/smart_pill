import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_CONFIG, getApiUrl } from '../../config';

const AlarmComponent = ({ programacionId, onAlarmsChange, initialAlarms = [] }) => {
  const [alarms, setAlarms] = useState(initialAlarms.map(alarm => ({
    ...alarm,
    enabled: alarm.enabled !== undefined ? alarm.enabled : true,
    sound: alarm.sound || 'default',
    vibrate: alarm.vibrate !== undefined ? alarm.vibrate : true,
    volume: alarm.volume || 80,
    name: alarm.name || 'Alarma de medicamento'
  })));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingAlarmIndex, setEditingAlarmIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiUrl] = useState(getApiUrl());
  const [expandedAlarm, setExpandedAlarm] = useState(null);

  // Cargar alarmas al montar el componente
  useEffect(() => {
    if (programacionId) {
      cargarAlarmas();
    }
  }, [programacionId]);

  // Notificar cambios en las alarmas
  useEffect(() => {
    onAlarmsChange(alarms);
  }, [alarms]);

  const cargarAlarmas = async () => {
    if (!programacionId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}obtener_alarmas.php?programacion_id=${programacionId}`);
      const data = await response.json();
      
      if (data.success) {
        const alarmasFormateadas = data.data.map(alarma => ({
          id: alarma.id,
          time: new Date(`2000-01-01T${alarma.hora}`),
          enabled: alarma.activa,
          days: Array(7).fill(0).map((_, i) => 
            (alarma.dias && alarma.dias.includes) ? 
              (alarma.dias.includes(String(i + 1)) ? 1 : 0) : 0
          ),
          sound: alarma.sonido,
          vibrate: alarma.vibrar,
          horarioId: alarma.horario_id
        }));
        setAlarms(alarmasFormateadas);
      }
    } catch (error) {
      console.error('Error al cargar alarmas:', error);
      Alert.alert('Error', 'No se pudieron cargar las alarmas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlarm = () => {
    const newAlarm = {
      id: null, // Será asignado por el servidor
      time: new Date(),
      enabled: true,
      days: [1, 1, 1, 1, 1, 0, 0], // Lunes a Viernes activados por defecto
      sound: 'default',
      vibrate: true,
      isNew: true // Marcar como nueva alarma
    };
    
    setAlarms([...alarms, newAlarm]);
    setEditingAlarmIndex(alarms.length);
    
    // Mostrar el selector de tiempo inmediatamente para la nueva alarma
    if (Platform.OS === 'android') {
      setShowTimePicker(true);
    }
  };

  const deleteAlarm = async (id, index) => {
    if (alarms.length > 1) {
      setAlarms(alarms.filter(alarm => alarm.id !== id));
    }
  };

  const toggleAlarm = async (alarmIndex) => {
    const updatedAlarms = [...alarms];
    updatedAlarms[alarmIndex].enabled = !updatedAlarms[alarmIndex].enabled;
    setAlarms(updatedAlarms);
    
    // Guardar cambios en el servidor
    await guardarAlarma(updatedAlarms[alarmIndex]);
  };

  const toggleDay = async () => {
    // No hacer nada, los días son de solo lectura
    return;
  };

  // Función para manejar cambios en la hora (ahora es de solo lectura)
  const handleTimeChange = async (event, selectedTime) => {
    const isAndroid = Platform.OS === 'android';
    
    // Cerrar el time picker en Android después de seleccionar
    if (isAndroid) {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      // Obtener la hora y minutos seleccionados
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      
      // Crear string en formato HH:MM (24 horas)
      const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // Crear un objeto Date con la hora actual pero con la hora seleccionada
      const now = new Date();
      const exactTime = new Date(now);
      exactTime.setHours(hours, minutes, 0, 0);
      
      console.log('Hora seleccionada (formato 24h):', timeString);
      console.log('Objeto Date creado:', exactTime.toString());
      
      const updatedAlarms = [...alarms];
      updatedAlarms[editingAlarmIndex].time = timeString; // Guardar como string HH:MM
      updatedAlarms[editingAlarmIndex].timeObject = exactTime; // Guardar también como objeto Date
      
      setAlarms(updatedAlarms);
      
      // Guardar la alarma en el servidor
      await guardarAlarma(updatedAlarms[editingAlarmIndex]);
    }
    
    // En iOS mantenemos el time picker abierto
    if (!isAndroid) {
      setShowTimePicker(true);
    }
  };

  const formatTime = (time) => {
    try {
      // Si el tiempo es nulo o indefinido, retornar un string vacío
      if (time === null || time === undefined) {
        return '';
      }
      
      // Si es un string en formato HH:MM, devolverlo formateado a 24h
      if (typeof time === 'string') {
        // Extraer horas y minutos usando una expresión regular más flexible
        const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          
          // Asegurarse de que las horas estén en rango 0-23
          hours = Math.max(0, Math.min(23, hours));
          
          // Devolver en formato 24h siempre
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }
      
      // Si es un objeto Date
      if (time instanceof Date && !isNaN(time.getTime())) {
        return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;                                                                                                                                                                  
      }
      
      // Si no es un formato reconocido, intentar convertirlo a string y extraer la hora
      const strTime = String(time);
      const timeMatch = strTime.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      
      // Si no es un formato reconocido, devolver el valor original
      return String(time);
      
      // Si no coincide con ningún formato, retornar string vacío
      return '';
    } catch (error) {
      console.error('Error formateando la hora:', error);
      return '';
    }
  };

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  if (loading && alarms.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando alarmas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={handleAddAlarm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.addButtonText}>+ Agregar Alarma</Text>
        )}
      </TouchableOpacity>

      {alarms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No hay alarmas configuradas</Text>
          <Text style={styles.emptyStateSubtext}>Presiona el botón de arriba para agregar una nueva alarma</Text>
        </View>
      ) : (
        <ScrollView style={styles.alarmsContainer}>
          {alarms.map((alarm, index) => (
            <View key={index} style={[
              styles.alarmCard,
              !alarm.enabled && styles.disabledAlarmCard
            ]}>
              {/* Alarm Header */}
              <TouchableOpacity 
                style={styles.alarmHeader}
                onPress={() => toggleAlarmExpansion(index)}
                activeOpacity={0.7}
              >
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText} numberOfLines={1}>
                    {formatTime(alarm.time) || '--:--'}
                  </Text>
                  {alarm.name ? (
                    <Text style={styles.alarmName} numberOfLines={1}>
                      {alarm.name}
                    </Text>
                  ) : null}
                </View>
                <Switch
                  value={alarm.enabled}
                  onValueChange={() => toggleAlarm(index)}
                  trackColor={{ false: '#E0E0E0', true: '#7A2C34' }}
                  thumbColor="white"
                />
              </TouchableOpacity>

              {/* Expanded Content */}
              {expandedAlarm === index && alarm.enabled && (
                <View style={styles.expandedContent}>
                  {/* Alarm Name */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingIcon}>
                      <MaterialIcons name="edit" size={20} color="#7A2C34" />
                    </View>
                    <TextInput
                      style={styles.nameInput}
                      value={alarm.name}
                      onChangeText={(text) => handleNameChange(index, text)}
                      placeholder="Nombre de la alarma"
                      placeholderTextColor="#999"
                    />
                  </View>

                  {/* Sound Selection */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingIcon}>
                      <MaterialIcons name="music-note" size={20} color="#7A2C34" />
                    </View>
                    <Text style={styles.settingLabel}>Sonido</Text>
                    <View style={styles.soundPicker}>
                      <TouchableOpacity 
                        style={[
                          styles.soundOption, 
                          alarm.sound === 'default' && styles.soundOptionSelected
                        ]}
                        onPress={() => handleSoundChange(index, 'default')}
                      >
                        <Text style={[
                          styles.soundOptionText,
                          alarm.sound === 'default' && styles.soundOptionTextSelected
                        ]}>
                          Predeterminado
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.soundOption, 
                          alarm.sound === 'alarm' && styles.soundOptionSelected
                        ]}
                        onPress={() => handleSoundChange(index, 'alarm')}
                      >
                        <Text style={[
                          styles.soundOptionText,
                          alarm.sound === 'alarm' && styles.soundOptionTextSelected
                        ]}>
                          Alarma
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Vibration Toggle */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingIcon}>
                      <MaterialIcons name="vibration" size={20} color="#7A2C34" />
                    </View>
                    <Text style={styles.settingLabel}>Vibración</Text>
                    <Switch
                      value={alarm.vibrate}
                      onValueChange={() => toggleVibration(index)}
                      trackColor={{ false: '#E0E0E0', true: '#7A2C34' }}
                      thumbColor="white"
                    />
                  </View>

                  {/* Volume Slider */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingIcon}>
                      <MaterialIcons name="volume-up" size={20} color="#7A2C34" />
                    </View>
                    <Text style={styles.settingLabel}>Volumen</Text>
                    <View style={styles.volumeContainer}>
                      <MaterialIcons name="volume-down" size={20} color="#666" />
                      <Slider
                        style={styles.volumeSlider}
                        minimumValue={0}
                        maximumValue={100}
                        step={5}
                        value={alarm.volume}
                        onValueChange={(value) => handleVolumeChange(index, value)}
                        minimumTrackTintColor="#7A2C34"
                        maximumTrackTintColor="#E0E0E0"
                        thumbTintColor="#7A2C34"
                      />
                      <MaterialIcons name="volume-up" size={20} color="#666" />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {showTimePicker && editingAlarmIndex !== null && (
        <DateTimePicker
          value={alarms[editingAlarmIndex]?.time || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          style={styles.timePicker}
        />
      )}
      
      {Platform.OS === 'ios' && showTimePicker && (
        <TouchableOpacity
          style={styles.iosDoneButton}
          onPress={() => setShowTimePicker(false)}
        >
          <Text style={styles.iosDoneButtonText}>Listo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alarmsContainer: {
    flex: 1,
  },
  alarmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDEFF2',
  },
  disabledAlarmCard: {
    opacity: 0.7,
  },
  alarmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  alarmName: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDEFF2',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0E6E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
  },
  soundPicker: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 2,
  },
  soundOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  soundOptionSelected: {
    backgroundColor: '#7A2C34',
  },
  soundOptionText: {
    color: '#7F8C8D',
    fontSize: 12,
    fontWeight: '500',
  },
  soundOptionTextSelected: {
    color: '#FFFFFF',
  },
  nameInput: {
    flex: 1,
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEFF2',
    color: '#2C3E50',
    paddingLeft: 8,
  },
  volumeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  readOnlyLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  disabledText: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  dayButtonActive: {
    backgroundColor: '#4CAF50',
  },
  disabledDayButton: {
    opacity: 0.5,
  },
  dayText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  dayTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  alarmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  alarmStatus: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#F44336',
    fontWeight: '500',
  },
  timePicker: {
    backgroundColor: 'white',
  },
  iosDoneButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  iosDoneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    color: '#7A2C34',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AlarmComponent;
