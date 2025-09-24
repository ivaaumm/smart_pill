# Manual de Usuario - Smart Pill

## Índice
1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Inicio de Sesión](#inicio-de-sesión)
4. [Pantalla Principal (Home)](#pantalla-principal-home)
5. [Gestión de Medicamentos](#gestión-de-medicamentos)
6. [Sistema de Alarmas](#sistema-de-alarmas)
7. [Registro de Tomas](#registro-de-tomas)
8. [Perfil de Usuario](#perfil-de-usuario)
9. [Funcionalidades Adicionales](#funcionalidades-adicionales)
10. [Solución de Problemas](#solución-de-problemas)
11. [Soporte Técnico](#soporte-técnico)

---

## Introducción

**Smart Pill** es una aplicación móvil desarrollada con React Native y Expo que ayuda a los usuarios a gestionar sus medicamentos de manera eficiente. La aplicación permite programar alarmas para recordar las tomas de medicamentos, llevar un registro detallado de las dosis tomadas y gestionar múltiples tratamientos médicos.

### Características Principales
- ✅ Gestión completa de medicamentos y tratamientos
- ⏰ Sistema de alarmas personalizables con sonidos
- 📊 Registro detallado de tomas de medicamentos
- 👤 Perfiles de usuario personalizados
- 🔄 Sincronización en tiempo real con base de datos
- 📱 Interfaz intuitiva y fácil de usar
- 🎵 Múltiples opciones de sonido para alarmas

---

## Instalación y Configuración

### Requisitos del Sistema
- **Dispositivo móvil**: Android 6.0+ o iOS 11.0+
- **Conexión a Internet**: Requerida para sincronización de datos
- **Permisos necesarios**:
  - Notificaciones
  - Audio
  - Almacenamiento

### Instalación
1. Descarga la aplicación desde la tienda correspondiente
2. Instala la aplicación en tu dispositivo
3. Abre la aplicación por primera vez
4. Acepta los permisos solicitados
5. Procede al registro o inicio de sesión

### Configuración Inicial
Al abrir la aplicación por primera vez, se configurarán automáticamente:
- Permisos de audio y notificaciones
- Configuración de zona horaria (Argentina/Buenos Aires)
- Conexión con el servidor de base de datos

---

## Inicio de Sesión

### Pantalla de Login
La pantalla de inicio de sesión presenta:
- **Logo de Smart Pill**: Identificación visual de la aplicación
- **Campo Usuario**: Ingresa tu nombre de usuario
- **Campo Contraseña**: Ingresa tu contraseña (con opción de mostrar/ocultar)
- **Botón Iniciar Sesión**: Para acceder a la aplicación
- **Enlace de Registro**: Para crear una nueva cuenta

### Proceso de Autenticación
1. Ingresa tu **nombre de usuario** en el primer campo
2. Ingresa tu **contraseña** en el segundo campo
3. Usa el ícono del ojo para mostrar/ocultar la contraseña si es necesario
4. Presiona **"Iniciar Sesión"**
5. La aplicación verificará tus credenciales con el servidor
6. Si son correctas, serás redirigido a la pantalla principal

### Registro de Nuevo Usuario
Si no tienes cuenta:
1. Presiona el enlace **"Registrarse"**
2. Completa el formulario de registro
3. Confirma tu información
4. Una vez registrado, podrás iniciar sesión normalmente

---

## Pantalla Principal (Home)

### Vista General
La pantalla principal muestra un resumen completo de tus tratamientos activos organizados por categorías temporales:

#### Encabezado
- **Título**: "Mis Tratamientos"
- **Subtítulo**: "Resumen de medicamentos programados"
- **Color corporativo**: Fondo rojo vino (#7A2C34)

#### Información de Cada Medicamento
Cada tarjeta de medicamento muestra:
- **Ícono de pastilla**: Identificación visual
- **Hora programada**: Momento exacto de la toma
- **Nombre del medicamento**: Denominación comercial
- **Horarios**: Días y horas de repetición

### Funcionalidades
- **Actualización automática**: Los datos se refrescan automáticamente
- **Pull to refresh**: Desliza hacia abajo para actualizar manualmente
- **Navegación**: Toca cualquier medicamento para ver más detalles
- **Estado en tiempo real**: Muestra el estado actual de cada tratamiento

---

## Gestión de Medicamentos

### Pantalla de Medicamentos
Esta es una de las pantallas más completas de la aplicación, donde puedes:

#### Catálogo de Medicamentos
- **Búsqueda inteligente**: Campo de búsqueda para encontrar medicamentos
- **Lista completa**: Catálogo con todos los medicamentos disponibles
- **Información detallada**: Cada medicamento muestra:
  - Nombre comercial
  - Descripción
  - Presentación (comprimidos, cápsulas, etc.)
  - Peso por unidad
  - Efectos secundarios

#### Crear Nuevo Tratamiento
**Selección de Medicamento**
1. Busca el medicamento en el catálogo
2. Selecciona el medicamento deseado
3. Confirma la selección

**Configuración del Tratamiento**
- **Nombre del tratamiento**: Asigna un nombre personalizado
- **Fecha de inicio**: Cuándo comenzar el tratamiento
- **Fecha de fin**: Cuándo terminar el tratamiento

**Programación de Horarios**
- **Selección de días**: Elige qué días de la semana
- **Horarios específicos**: Define las horas exactas
- **Frecuencia**: Configura la repetición
- **Sonido de alarma**: Elige entre:
  - Alarma (predeterminado)
  - Tono suave
  - Sonido personalizado

#### Gestión de Tratamientos Existentes
- **Ver tratamientos activos**: Lista de todos los tratamientos en curso
- **Editar tratamientos**: Modificar horarios o fechas
- **Pausar tratamientos**: Suspender temporalmente
- **Eliminar tratamientos**: Eliminar definitivamente

### Configuración de Alarmas
#### Tipos de Repetición
- **Diario**: Todos los días
- **Días específicos**: Seleccionar días de la semana

#### Opciones de Sonido
- **Alarm**: Sonido de alarma tradicional
- **Default**: Tono suave predeterminado
- **Tone**: Melodía personalizada

## Sistema de Alarmas

### Pantalla de Alarma Activa
Cuando llega la hora de tomar un medicamento, aparece una pantalla de alarma a pantalla completa:

#### Elementos Visuales
- **Fondo rojo intenso**: Color corporativo para máxima visibilidad
- **Hora actual**: Muestra la hora exacta en formato grande
- **Ícono de alarma**: Animación pulsante para llamar la atención
- **Información del medicamento**:
  - Nombre del medicamento
  - Dosis exacta
  - Hora programada

#### Opciones de Respuesta
**Medicamento Tomado**
- Confirma que has tomado el medicamento
- Registra la toma en el historial
- Detiene la alarma
- Programa la siguiente toma

**Posponer (Snooze)**
- Pospone la alarma por 10 minutos
- Mantiene el registro como pendiente

**Omitir Toma**
- Marca la toma como omitida
- Registra la omisión en el historial
- Detiene la alarma
- Continúa con el programa normal

#### Contador Regresivo
- **Tiempo límite**: 5 minutos para responder
- **Auto-posposición**: Si no respondes, se pospone automáticamente
- **Indicador visual**: Muestra el tiempo restante


#### Configuración de Sonido
- **Prueba de sonido**: Botón para probar el sonido seleccionado
- **Volumen automático**: Ajuste según la configuración del dispositivo
- **Duración**: Sonido continuo hasta respuesta del usuario

---

## Registro de Tomas

### Pantalla de Historial
La pantalla de Registro de Tomas proporciona un historial completo de todas las interacciones con medicamentos:

#### Vista General
- **Encabezado**: "Registro de Tomas" con subtítulo informativo
- **Lista cronológica**: Registros ordenados por fecha y hora
- **Pull to refresh**: Actualización manual disponible

#### Información de Cada Registro
Cada tarjeta de registro muestra:

**Información del Medicamento**
- **Ícono de pastilla**: Identificación visual
- **Nombre del medicamento**: Denominación completa
- **Dosis**: Cantidad tomada o programada

**Detalles Temporales**
- **Fecha programada**: Cuándo debía tomarse
- **Hora programada**: Hora exacta planificada
- **Fecha/hora de acción**: Cuándo realmente se registró la acción

**Estado de la Toma**
- **Tomada**: Fondo verde, medicamento confirmado como tomado
- **Pospuesta**: Fondo naranja, toma retrasada
- **Omitida**: Fondo rojo, toma saltada intencionalmente
- **Pendiente**: Fondo gris, esperando acción del usuario

#### Funcionalidades Interactivas
**Confirmar Tomas Pendientes**
- Botón "Confirmar Toma" para registros pendientes
- Actualización inmediata del estado
- Sincronización automática con el servidor

**Filtros y Búsqueda**
- Filtrar por estado (tomada, omitida, pospuesta)
- Búsqueda por nombre de medicamento
- Filtro por rango de fechas

### Estadísticas de Adherencia
#### Métricas Disponibles
- **Porcentaje de adherencia**: Tomas confirmadas vs. programadas
- **Tomas consecutivas**: Racha de tomas sin omisiones
- **Medicamentos activos**: Número de tratamientos en curso
- **Próximas tomas**: Medicamentos pendientes hoy

## Perfil de Usuario

### Información Personal
La pantalla de perfil muestra y permite gestionar:

#### Avatar y Datos Básicos
- **Avatar personalizado**: Imagen de perfil o iniciales generadas automáticamente
- **Nombre usuario**: Información personal del usuario
- **Correo electrónico**: Email de contacto
- **Fecha de registro**: Cuándo se creó la cuenta

#### Configuración de Cuenta
**Editar Perfil**
- Modificar nombre y información personal
- Cambiar avatar o foto de perfil
- Actualizar datos de contacto

**Configuración de Notificaciones**
- Activar/desactivar notificaciones push
- Configurar horarios de silencio
- Personalizar tipos de alertas

**Configuración de Sonido**
- Seleccionar sonidos predeterminados
- Ajustar volumen de alarmas
- Configurar vibración

#### Gestión de Sesión
**Cerrar Sesión**
- Botón para cerrar sesión segura
- Limpia datos locales
- Redirige a pantalla de login
- Mantiene datos en servidor para próximo acceso

### Configuraciones Avanzadas
#### Preferencias de la Aplicación
- **Tema visual**: Personalización de colores
- **Idioma**: Configuración regional
- **Zona horaria**: Ajuste automático o manual
- **Formato de hora**: 12h o 24h

#### Privacidad y Seguridad
- **Cambio de contraseña**: Actualización segura
- **Verificación por correo electrónico**: Seguridad adicional

---

## Funcionalidades Adicionales

### Sistema de Conectividad
#### Diagnóstico de Red
- **Verificación automática**: Comprueba conexión al iniciar
- **Diagnóstico de problemas**: Identifica issues de conectividad
- **Modo offline**: Funcionalidad limitada sin conexión
- **Sincronización automática**: Al recuperar conexión

#### Gestión de Datos
- **Sincronización en tiempo real**: Datos actualizados constantemente
- **Cache local**: Almacenamiento temporal para acceso offline
- **Backup automático**: Respaldo regular de información
- **Restauración de datos**: Recuperación en caso de pérdida

### Pruebas y Configuración
#### Prueba de Sonidos
- **Pantalla dedicada**: Prueba todos los sonidos disponibles
- **Control de volumen**: Ajuste en tiempo real
- **Previsualización**: Escucha antes de seleccionar
- **Configuración por medicamento**: Sonidos específicos

#### Configuración de Bluetooth
- **Conectividad**: Integración con dispositivos externos
- **Sincronización**: Datos desde dispositivos conectados

### Herramientas de Desarrollo
#### Logs y Debugging
- **Registro de actividad**: Log detallado de acciones
- **Diagnóstico de errores**: Información para soporte técnico
- **Métricas de uso**: Estadísticas de utilización
- **Reportes automáticos**: Envío de errores al equipo técnico

---

## Solución de Problemas

### Problemas Comunes

#### La aplicación no se conecta al servidor
**Síntomas**: Mensajes de error de conexión, datos no actualizados
**Soluciones**:
1. Verificar conexión a Internet
2. Reiniciar la aplicación
3. Verificar configuración de red
4. Contactar soporte si persiste

#### Las alarmas no suenan
**Síntomas**: No hay sonido cuando llega la hora del medicamento
**Soluciones**:
1. Verificar permisos de notificaciones
2. Comprobar volumen del dispositivo
3. Revisar configuración de "No molestar"
4. Reiniciar la aplicación
5. Verificar que la alarma esté activa

#### Los datos no se sincronizan
**Síntomas**: Cambios no reflejados entre sesiones
**Soluciones**:
1. Verificar conexión a Internet
2. Cerrar y abrir la aplicación
3. Verificar espacio de almacenamiento
4. Limpiar cache de la aplicación

#### Error al iniciar sesión
**Síntomas**: Credenciales rechazadas, error de autenticación
**Soluciones**:
1. Verificar usuario y contraseña
2. Comprobar conexión a Internet
3. Intentar restablecer contraseña
4. Verificar que la cuenta esté activa

### Códigos de Error

#### Errores de Conexión
- **CONNECTION_ERROR**: Problema de conectividad
- **SERVER_TIMEOUT**: Servidor no responde
- **NETWORK_UNAVAILABLE**: Sin conexión a Internet

#### Errores de Autenticación
- **INVALID_CREDENTIALS**: Usuario o contraseña incorrectos
- **ACCOUNT_LOCKED**: Cuenta bloqueada temporalmente
- **SESSION_EXPIRED**: Sesión expirada, reiniciar sesión

#### Errores de Base de Datos
- **DATABASE_ERROR**: Error en operación de base de datos
- **DATA_SYNC_ERROR**: Error de sincronización
- **RECORD_NOT_FOUND**: Registro no encontrado

### Mantenimiento y Actualizaciones
#### Actualizaciones de la Aplicación
- **Automáticas**: Descarga automática desde tienda de aplicaciones
- **Manuales**: Verificación manual de actualizaciones
- **Notas de versión**: Información sobre nuevas características

#### Mantenimiento del Servidor
- **Horarios programados**: Generalmente durante madrugada
- **Notificaciones**: Aviso previo de mantenimientos
- **Tiempo estimado**: Duración aproximada de la interrupción

---

## Soporte Técnico

### Información de Contacto
#### Equipo de Desarrollo
- **Proyecto**: Smart Pill - Sistema de Gestión de Medicamentos
- **Tecnología**: React Native + Expo + PHP/MySQL
- **Versión actual**: 1.0.0

#### Canales de Soporte
**Soporte Técnico**
- Email: dylanechegaray18@gmail.com
- Horario: Lunes a Viernes, 9:00 - 18:00 (GMT-3)
- Tiempo de respuesta: 24-48 horas

**Reportar Errores**
- Incluir información del dispositivo
- Describir pasos para reproducir el error
- Adjuntar capturas de pantalla si es posible
- Mencionar versión de la aplicación

### Información del Sistema
#### Requisitos Técnicos
- **Frontend**: React Native 0.81.4
- **Framework**: Expo SDK 54
- **Backend**: PHP 7.4+
- **Base de datos**: MySQL 8.0+
- **Servidor web**: Apache/Nginx

#### Compatibilidad
- **Android**: 6.0 (API 23) o superior
- **iOS**: 11.0 o superior
- **Resolución**: Optimizado para pantallas 5" - 6.7"
- **RAM**: Mínimo 2GB recomendado

### Recursos Adicionales
#### Documentación Técnica
- Manual de instalación del servidor
- Documentación de API
- Guía de configuración de base de datos
- Scripts de migración y actualización

#### Archivos de Configuración
- **config.js**: Configuración del cliente
- **conexion.php**: Configuración de base de datos
- **credenciales.js**: Configuración de API
- **package.json**: Dependencias del proyecto

---

## Apéndices

### A. Estructura de la Base de Datos
#### Tablas Principales
- **usuarios**: Información de usuarios registrados
- **remedio_global**: Catálogo de medicamentos
- **programacion_tratamientos**: Tratamientos programados
- **registro_tomas**: Historial de tomas de medicamentos
- **alarmas**: Configuración de alarmas

### B. API Endpoints
#### Autenticación
- `POST /login.php`: Iniciar sesión
- `POST /registro.php`: Registrar nuevo usuario

#### Medicamentos
- `GET /catalogo_pastillas.php`: Obtener catálogo
- `GET /pastillas_usuario.php`: Medicamentos del usuario

#### Tratamientos
- `POST /crear_programacion.php`: Crear nuevo tratamiento
- `GET /obtener_programaciones.php`: Obtener tratamientos
- `PUT /actualizar_programacion.php`: Actualizar tratamiento

#### Registros
- `POST /registro_tomas.php`: Registrar toma
- `GET /registro_tomas.php`: Obtener historial
- `PUT /confirmar_toma.php`: Confirmar toma

### C. Archivos de Sonido
#### Sonidos Disponibles
- **alarm.mp3**: Sonido de alarma tradicional
- **default.mp3**: Tono suave predeterminado
- **tone.mp3**: Melodía personalizada

### D. Permisos Requeridos
#### Android
- `android.permission.VIBRATE`: Para vibración
- `android.permission.WAKE_LOCK`: Para despertar pantalla
- `android.permission.RECEIVE_BOOT_COMPLETED`: Para alarmas persistentes

#### iOS
- `NSUserNotificationUsageDescription`: Para notificaciones
- `NSMicrophoneUsageDescription`: Para audio
- `NSCameraUsageDescription`: Para avatar (opcional)

---

**© 2024 Smart Pill - Sistema de Gestión de Medicamentos**  
*Manual de Usuario v1.0*  
*Última actualización: Enero 2024*