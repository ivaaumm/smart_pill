// Prueba mínima para debuggear el problema de notificaciones inmediatas

const testNotificationTiming = () => {
  console.log('🧪 === PRUEBA DE TIMING DE NOTIFICACIONES ===');
  
  // Simular datos de la base de datos
  const tratamientoData = {
    programacion_id: 26,
    fecha_inicio: '2025-09-12',
    horarios: [
      { dia: 'lunes', hora: '15:05:00' },
      { dia: 'martes', hora: '15:05:00' },
      { dia: 'miercoles', hora: '15:05:00' },
      { dia: 'jueves', hora: '15:05:00' },
      { dia: 'viernes', hora: '15:05:00' },
      { dia: 'sabado', hora: '15:05:00' },
      { dia: 'domingo', hora: '15:05:00' }
    ]
  };
  
  const ahora = new Date();
  console.log('📅 Fecha/hora actual:', ahora.toLocaleString('es-AR'));
  console.log('📅 Fecha de inicio del tratamiento:', tratamientoData.fecha_inicio);
  
  // Verificar si la fecha de inicio es en el pasado
  const fechaInicio = new Date(tratamientoData.fecha_inicio);
  const esFechaInicioEnPasado = fechaInicio < ahora;
  console.log('⚠️ ¿Fecha de inicio en el pasado?', esFechaInicioEnPasado);
  
  if (esFechaInicioEnPasado) {
    const diasDiferencia = Math.floor((ahora - fechaInicio) / (1000 * 60 * 60 * 24));
    console.log('📊 Días transcurridos desde el inicio:', diasDiferencia);
  }
  
  // Simular el cálculo de fechas para cada horario
  tratamientoData.horarios.forEach((horario, index) => {
    console.log(`\n🕐 Procesando horario ${index + 1}: ${horario.dia} a las ${horario.hora}`);
    
    // Mapeo de días
    const nombresDias = {
      lunes: 1, martes: 2, miercoles: 3, jueves: 4,
      viernes: 5, sabado: 6, domingo: 0
    };
    
    const diaNumero = nombresDias[horario.dia.toLowerCase()];
    const diaActual = ahora.getDay();
    
    // Calcular diferencia de días
    let diferenciaDias = (diaNumero - diaActual + 7) % 7;
    
    // Crear fecha de notificación
    let fechaNotificacion = new Date(ahora);
    fechaNotificacion.setDate(ahora.getDate() + diferenciaDias);
    
    // Extraer hora del string "15:05:00"
    const [hora, minuto] = horario.hora.split(':').map(Number);
    console.log('  - Hora extraída:', hora, 'Minuto:', minuto);
    fechaNotificacion.setHours(hora, minuto, 0, 0);
    
    // Debug de zona horaria
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutos = fechaNotificacion.getTimezoneOffset();
    console.log('  - Zona horaria:', timeZone);
    console.log('  - Offset UTC (minutos):', offsetMinutos);
    console.log('  - Fecha con toString():', fechaNotificacion.toString());
    console.log('  - Fecha con toISOString():', fechaNotificacion.toISOString());
    
    console.log('  - Día actual (0-6):', diaActual);
    console.log('  - Día objetivo (0-6):', diaNumero);
    console.log('  - Diferencia de días:', diferenciaDias);
    console.log('  - Fecha calculada inicial:', fechaNotificacion.toLocaleString('es-AR'));
    
    // Verificar si está en el pasado
    if (fechaNotificacion <= ahora) {
      console.log('  ⚠️ Fecha en el pasado, ajustando a próxima semana');
      fechaNotificacion.setDate(fechaNotificacion.getDate() + 7);
      console.log('  - Fecha ajustada:', fechaNotificacion.toLocaleString('es-AR'));
    }
    
    // Verificar margen de 5 minutos
    const cincoMinutosEnFuturo = new Date(ahora.getTime() + 5 * 60 * 1000);
    if (fechaNotificacion <= cincoMinutosEnFuturo) {
      console.log('  ⚠️ Muy próxima (< 5 min), ajustando a próxima semana');
      fechaNotificacion.setDate(fechaNotificacion.getDate() + 7);
      console.log('  - Fecha final ajustada:', fechaNotificacion.toLocaleString('es-AR'));
    }
    
    const tiempoHastaAlarma = fechaNotificacion.getTime() - ahora.getTime();
    const minutosHastaAlarma = Math.round(tiempoHastaAlarma / (1000 * 60));
    
    console.log('  📊 Tiempo hasta alarma (ms):', tiempoHastaAlarma);
    console.log('  📊 Tiempo hasta alarma (minutos):', minutosHastaAlarma);
    console.log('  ✅ Es en el futuro:', fechaNotificacion > ahora);
    
    if (minutosHastaAlarma < 5) {
      console.log('  🚨 PROBLEMA: Alarma programada para menos de 5 minutos!');
    }
  });
  
  console.log('\n🧪 === FIN DE LA PRUEBA ===');
};

// Ejecutar la prueba
testNotificationTiming();

// Exportar para uso en React Native si es necesario
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testNotificationTiming };
}