# MANUAL DE USUARIO
## SISTEMA SMART PILL
### GESTIÓN INTELIGENTE DE MEDICAMENTOS

---

**Versión:** 1.0  
**Fecha de Elaboración:** Enero 2025  
**Última Modificación:** Enero 2025  
**Desarrollado por:** Equipo Smart Pill  
**Tipo de Sistema:** Aplicación Móvil de Gestión de Medicamentos  

---

## ÍNDICE

1. [PRESENTACIÓN](#1-presentación)
   - 1.1 [Antecedentes](#11-antecedentes)
   - 1.2 [Objetivos](#12-objetivos)
   - 1.3 [Introducción](#13-introducción)

2. [GENERALIDADES DEL SISTEMA](#2-generalidades-del-sistema)
   - 2.1 [Descripción General](#21-descripción-general)
   - 2.2 [Características Principales](#22-características-principales)
   - 2.3 [Botones y Controles](#23-botones-y-controles)
   - 2.4 [Sistema de Ayuda](#24-sistema-de-ayuda)

3. [REQUERIMIENTOS TÉCNICOS](#3-requerimientos-técnicos)
   - 3.1 [Requerimientos de Hardware](#31-requerimientos-de-hardware)
   - 3.2 [Requerimientos de Software](#32-requerimientos-de-software)
   - 3.3 [Conectividad](#33-conectividad)

4. [INSTALACIÓN Y CONFIGURACIÓN](#4-instalación-y-configuración)
   - 4.1 [Proceso de Instalación](#41-proceso-de-instalación)
   - 4.2 [Configuración Inicial](#42-configuración-inicial)
   - 4.3 [Permisos del Sistema](#43-permisos-del-sistema)

5. [ENTRADA Y SALIDA DEL SISTEMA](#5-entrada-y-salida-del-sistema)
   - 5.1 [Inicio de Sesión](#51-inicio-de-sesión)
   - 5.2 [Registro de Usuario](#52-registro-de-usuario)
   - 5.3 [Cierre de Sesión](#53-cierre-de-sesión)

6. [USO DE LA APLICACIÓN](#6-uso-de-la-aplicación)
   - 6.1 [Pantalla Principal](#61-pantalla-principal)
   - 6.2 [Gestión de Medicamentos](#62-gestión-de-medicamentos)
   - 6.3 [Sistema de Alarmas](#63-sistema-de-alarmas)
   - 6.4 [Registro de Tomas](#64-registro-de-tomas)
   - 6.5 [Perfil de Usuario](#65-perfil-de-usuario)
   - 6.6 [Reportes y Estadísticas](#66-reportes-y-estadísticas)

7. [MANEJO DE ERRORES](#7-manejo-de-errores)
   - 7.1 [Errores Comunes](#71-errores-comunes)
   - 7.2 [Soluciones](#72-soluciones)
   - 7.3 [Códigos de Error](#73-códigos-de-error)

8. [CONTINGENCIAS](#8-contingencias)
   - 8.1 [Problemas de Conectividad](#81-problemas-de-conectividad)
   - 8.2 [Pérdida de Datos](#82-pérdida-de-datos)
   - 8.3 [Fallas del Sistema](#83-fallas-del-sistema)

9. [GLOSARIO](#9-glosario)

10. [ANEXOS](#10-anexos)
    - 10.1 [Diagramas de Flujo](#101-diagramas-de-flujo)
    - 10.2 [Capturas de Pantalla](#102-capturas-de-pantalla)
    - 10.3 [Información Técnica Adicional](#103-información-técnica-adicional)

---

## 1. PRESENTACIÓN

### 1.1 Antecedentes

La gestión adecuada de medicamentos representa uno de los desafíos más importantes en el cuidado de la salud personal. Estudios demuestran que el incumplimiento en la toma de medicamentos es una de las principales causas de complicaciones médicas y reingresos hospitalarios.

En respuesta a esta problemática, surge Smart Pill como una solución tecnológica innovadora que aprovecha las capacidades de los dispositivos móviles para crear un sistema integral de gestión de medicamentos.

### 1.2 Objetivos

#### Objetivo General
Proporcionar una herramienta digital completa que facilite la gestión, seguimiento y control de medicamentos para mejorar la adherencia terapéutica de los usuarios.

#### Objetivos Específicos
- Automatizar recordatorios de toma de medicamentos mediante alarmas personalizables
- Mantener un registro detallado y preciso de todas las tomas de medicamentos
- Facilitar la gestión de múltiples tratamientos simultáneos
- Generar reportes de adherencia para seguimiento médico
- Proporcionar una interfaz intuitiva y accesible para usuarios de todas las edades

### 1.3 Introducción

Smart Pill es una aplicación móvil desarrollada con tecnología React Native que transforma la gestión de medicamentos en una experiencia simple y eficiente. La aplicación combina funcionalidades avanzadas de programación de alarmas, registro de tomas y generación de reportes en una interfaz amigable y fácil de usar.

El sistema está diseñado para adaptarse a las necesidades específicas de cada usuario, permitiendo la configuración de múltiples medicamentos, horarios flexibles y diferentes tipos de tratamientos médicos.

---

## 2. GENERALIDADES DEL SISTEMA

### 2.1 Descripción General

Smart Pill es un sistema de gestión de medicamentos que opera como aplicación móvil nativa, desarrollada con las siguientes tecnologías:

- **Frontend:** React Native 0.81.4 con Expo SDK 54
- **Backend:** PHP con MySQL
- **Arquitectura:** Cliente-Servidor con API REST
- **Plataformas:** Android 6.0+ e iOS 11.0+

### 2.2 Características Principales

#### Gestión Completa de Medicamentos
- Catálogo extenso con más de 90 medicamentos predefinidos
- Información detallada de cada medicamento (efectos secundarios, presentación, dosificación)

#### Sistema de Alarmas Inteligente
- Programación flexible de horarios
- Múltiples opciones de sonido (alarm.mp3, default.mp3, tone.mp3)
- Alarmas persistentes que se mantienen activas hasta ser atendidas
- Opciones de posponer, omitir o confirmar toma

#### Registro y Seguimiento
- Historial completo de todas las tomas
- Estados detallados: tomado, pospuesto, omitido
- Observaciones personalizables para cada registro
- Generación de reportes en PDF

#### Sincronización en Tiempo Real
- Conexión constante con base de datos centralizada
- Respaldo automático de información
- Acceso desde múltiples dispositivos

### 2.3 Botones y Controles

#### Iconografía del Sistema
- **MaterialIcons:** Biblioteca estándar para iconos
- **Colores:** Esquema consistente con tonos azules y verdes
- **Navegación:** Drawer navigation y stack navigation

#### Controles Principales
- **Botón Flotante (+):** Agregar nuevo medicamento
- **Botón de Alarma:** Acceso rápido a alarmas activas
- **Botón de Perfil:** Configuración de usuario
- **Botón de Reportes:** Generación de documentos PDF

### 2.4 Sistema de Ayuda

La aplicación incluye múltiples niveles de asistencia:

- **Tooltips:** Ayuda contextual en elementos específicos
- **Mensajes de Estado:** Información en tiempo real sobre operaciones
- **Validaciones:** Verificación automática de datos ingresados
- **Mensajes de Error:** Descripción clara de problemas y soluciones

---

## 3. REQUERIMIENTOS TÉCNICOS

### 3.1 Requerimientos de Hardware

#### Dispositivos Android
- **Procesador:** ARM64 o x86_64
- **RAM:** Mínimo 2GB, recomendado 4GB
- **Almacenamiento:** 100MB libres para la aplicación
- **Pantalla:** Resolución mínima 720x1280 píxeles
- **Audio:** Altavoces o auriculares para alarmas

#### Dispositivos iOS
- **Procesador:** A9 o superior
- **RAM:** Mínimo 2GB
- **Almacenamiento:** 100MB libres
- **Pantalla:** Compatible con iPhone 6 en adelante
- **Audio:** Sistema de audio funcional

### 3.2 Requerimientos de Software

#### Android
- **Sistema Operativo:** Android 6.0 (API nivel 23) o superior
- **Google Play Services:** Versión actualizada
- **Permisos:** Notificaciones, audio, almacenamiento

#### iOS
- **Sistema Operativo:** iOS 11.0 o superior
- **App Store:** Acceso para instalación
- **Permisos:** Notificaciones, audio

### 3.3 Conectividad

#### Conexión a Internet
- **Tipo:** WiFi o datos móviles
- **Velocidad:** Mínimo 1 Mbps para sincronización
- **Estabilidad:** Conexión estable para operaciones en tiempo real

#### Servidor Backend
- **Protocolo:** HTTP/HTTPS
- **Puerto:** Configurable (por defecto 8081)
- **Base de Datos:** MySQL 5.7 o superior

---

## 4. INSTALACIÓN Y CONFIGURACIÓN

### 4.1 Proceso de Instalación

#### Instalación desde Código Fuente (Desarrollo)

1. **Preparación del Entorno**
   ```bash
   # Instalar Node.js (versión 16 o superior)
   # Instalar Expo CLI
   npm install -g @expo/cli
   ```

2. **Descarga del Proyecto**
   ```bash
   # Clonar repositorio
   git clone [repositorio-smart-pill]
   cd smart_pill
   ```

3. **Instalación de Dependencias**
   ```bash
   # Instalar dependencias de Node.js
   npm install
   ```

4. **Configuración del Backend**
   - Configurar servidor XAMPP o similar
   - Importar base de datos desde `/database/smart_pill.sql`
   - Configurar credenciales en `credenciales.js`

5. **Inicio de la Aplicación**
   ```bash
   # Iniciar servidor de desarrollo
   npm start
   ```

### 4.2 Configuración Inicial

#### Primera Ejecución

1. **Verificación de Conectividad**
   - La aplicación verifica automáticamente la conexión al servidor
   - Muestra mensajes de estado de conectividad

2. **Configuración de Audio**
   - Configuración automática del sistema de audio
   - Verificación de permisos de audio

3. **Registro de Usuario**
   - Crear cuenta nueva o iniciar sesión
   - Configurar perfil básico

### 4.3 Permisos del Sistema

#### Android
```xml
android.permission.RECEIVE_BOOT_COMPLETED
android.permission.WAKE_LOCK
android.permission.VIBRATE
android.permission.INTERNET
android.permission.ACCESS_NETWORK_STATE
```

#### iOS
```xml
NSUserNotificationUsageDescription
NSMicrophoneUsageDescription
NSCameraUsageDescription (opcional)
```

---

## 5. ENTRADA Y SALIDA DEL SISTEMA

### 5.1 Inicio de Sesión

#### Pantalla de Login

(imagen aqui)

La pantalla de inicio de sesión presenta los siguientes elementos:

- **Campo Usuario:** Ingreso de nombre de usuario o email
- **Campo Contraseña:** Ingreso seguro de contraseña
- **Botón "Iniciar Sesión":** Validación y acceso al sistema
- **Enlace "Registrarse":** Acceso a creación de cuenta nueva
- **Indicador de Estado:** Muestra el progreso de la autenticación

#### Proceso de Autenticación

1. **Validación Local**
   - Verificación de campos obligatorios
   - Validación de formato de datos

2. **Autenticación Remota**
   - Envío de credenciales al servidor
   - Verificación en base de datos
   - Generación de sesión de usuario

3. **Manejo de Errores**
   - Credenciales incorrectas
   - Problemas de conectividad
   - Usuario no encontrado

### 5.2 Registro de Usuario

#### Formulario de Registro

(imagen aqui)

El proceso de registro incluye:

- **Información Personal**
  - Nombre completo
  - Fecha de nacimiento
  - Género

- **Credenciales de Acceso**
  - Nombre de usuario único
  - Contraseña segura
  - Confirmación de contraseña

- **Información de Contacto**
  - Email (opcional)
  - Teléfono (opcional)

#### Validaciones del Registro

- **Unicidad:** Verificación de usuario único
- **Seguridad:** Validación de contraseña fuerte
- **Formato:** Verificación de datos válidos

### 5.3 Cierre de Sesión

#### Opciones de Salida

1. **Cierre Manual**
   - Acceso desde menú de perfil
   - Confirmación de cierre de sesión
   - Limpieza de datos temporales

2. **Cierre Automático**
   - Por inactividad prolongada
   - Por problemas de seguridad
   - Por actualización del sistema

---

## 6. USO DE LA APLICACIÓN

### 6.1 Pantalla Principal

#### Interfaz Principal (Home)

(imagen aqui)

La pantalla principal presenta:

- **Barra de Navegación Superior**
  - Título de la aplicación
  - Botón de menú (hamburguesa)
  - Indicador de conectividad

- **Área de Contenido Central**
  - Resumen de medicamentos activos
  - Próximas alarmas programadas
  - Accesos rápidos a funciones principales

- **Navegación Inferior**
  - Pestañas de acceso rápido
  - Indicadores de notificaciones
  - Botón de acción flotante

#### Menú de Navegación Lateral

(imagen aqui)

El drawer navigation incluye:

- **Perfil de Usuario**
- **Medicamentos**
- **Alarmas**
- **Registro de Tomas**
- **Configuración**
- **Ayuda**
- **Cerrar Sesión**

### 6.2 Gestión de Medicamentos

#### Catálogo de Medicamentos

(imagen aqui)

El sistema incluye un catálogo extenso con:

- **Medicamentos Predefinidos:** Más de 90 opciones
- **Información Detallada:**
  - Nombre comercial
  - Descripción médica
  - Efectos secundarios
  - Peso por unidad
  - Presentación (tableta, cápsula, jarabe, etc.)

#### Agregar Nuevo Medicamento

(imagen aqui)

Proceso paso a paso:

1. **Selección del Medicamento**
   - Búsqueda en catálogo
   - Selección de medicamento específico

2. **Configuración de Tratamiento**
   - Tipo de tratamiento
   - Duración del tratamiento
   - Dosis por toma

3. **Programación de Horarios**
   - Frecuencia diaria
   - Horarios específicos
   - Días de la semana

#### Editar Medicamento Existente

- **Modificar Horarios:** Cambio de frecuencia y horarios
- **Actualizar Dosis:** Ajuste de cantidad por toma
- **Cambiar Duración:** Extensión o reducción del tratamiento
- **Agregar Observaciones:** Notas personales sobre el medicamento

### 6.3 Sistema de Alarmas

#### Configuración de Alarmas

(imagen aqui)

Características del sistema de alarmas:

- **Horarios Flexibles:** Configuración por minutos, horas o días
- **Sonidos Personalizables:** Selección entre múltiples tonos
- **Repetición Inteligente:** Alarmas que se repiten hasta ser atendidas
- **Información Contextual:** Detalles del medicamento en la alarma

#### Pantalla de Alarma Activa

(imagen aqui)

Cuando se activa una alarma, se muestra:

- **Información del Medicamento**
  - Nombre del medicamento
  - Dosis a tomar
  - Hora programada

- **Opciones de Respuesta**
  - **Tomado:** Confirmar que se tomó el medicamento
  - **Posponer:** Retrasar la alarma 5-15 minutos
  - **Omitir:** Marcar como no tomado

- **Controles de Audio**
  - Silenciar temporalmente
  - Cambiar volumen
  - Detener alarma

#### Gestión de Alarmas Múltiples

- **Vista de Lista:** Todas las alarmas programadas
- **Filtros:** Por medicamento, hora o estado
- **Edición Masiva:** Modificar múltiples alarmas
- **Historial:** Registro de alarmas pasadas

### 6.4 Registro de Tomas

#### Pantalla de Registro

(imagen aqui)

El registro de tomas incluye:

- **Lista Cronológica**
  - Fecha y hora de cada toma
  - Estado de la toma
  - Medicamento correspondiente

- **Estados Posibles**
  - **Tomado:** Medicamento consumido correctamente
  - **Rechazado:** Usuario decidió no tomar
  - **Pospuesto:** Toma retrasada
  - **Omitido:** No se tomó en el horario

- **Observaciones**
  - Notas personales sobre cada toma
  - Efectos secundarios observados
  - Circunstancias especiales

#### Filtros y Búsqueda

- **Por Fecha:** Rango de fechas específico
- **Por Medicamento:** Filtrar por medicamento específico
- **Por Estado:** Solo tomas tomadas, rechazadas, etc.
- **Búsqueda de Texto:** En observaciones y notas

#### Edición de Registros

- **Modificar Estado:** Cambiar estado de una toma
- **Agregar Observaciones:** Añadir notas posteriores
- **Corregir Hora:** Ajustar tiempo de registro
- **Eliminar Registro:** Remover entradas erróneas

### 6.5 Perfil de Usuario

#### Información Personal

(imagen aqui)

El perfil incluye:

- **Datos Básicos**
  - Nombre completo
  - Fecha de nacimiento
  - Información de contacto

- **Configuraciones**
  - Preferencias de notificación
  - Configuración de sonidos
  - Idioma de la aplicación

- **Estadísticas Personales**
  - Medicamentos activos
  - Adherencia general
  - Tiempo usando la aplicación

#### Configuración de Preferencias

- **Notificaciones**
  - Habilitar/deshabilitar alarmas
  - Configurar volumen
  - Seleccionar tonos

- **Interfaz**
  - Tema de la aplicación
  - Tamaño de fuente
  - Configuración de accesibilidad

### 6.6 Reportes y Estadísticas

#### Generación de Reportes PDF

(imagen aqui)

El sistema genera reportes que incluyen:

- **Información del Usuario**
  - Datos personales
  - Período del reporte

- **Resumen de Medicamentos**
  - Lista de medicamentos activos
  - Horarios programados
  - Dosis por medicamento

- **Registro Detallado de Tomas**
  - Cronología completa
  - Estados de cada toma
  - Observaciones relevantes

#### Estadísticas de Adherencia

- **Porcentaje General:** Adherencia total del usuario
- **Por Medicamento:** Adherencia específica por medicamento
- **Tendencias:** Gráficos de adherencia en el tiempo
- **Comparativas:** Períodos anteriores vs actuales

---

## 7. MANEJO DE ERRORES

### 7.1 Errores Comunes

#### Errores de Conectividad

| Error | Descripción | Causa Probable |
|-------|-------------|----------------|
| ERR_NETWORK | Sin conexión a internet | Conectividad de red |
| ERR_TIMEOUT | Tiempo de espera agotado | Servidor lento o sobrecargado |
| ERR_ABORTED | Conexión abortada | Interrupción de red |

#### Errores de Autenticación

| Error | Descripción | Causa Probable |
|-------|-------------|----------------|
| AUTH_FAILED | Credenciales incorrectas | Usuario o contraseña erróneos |
| USER_NOT_FOUND | Usuario no existe | Cuenta no registrada |
| SESSION_EXPIRED | Sesión expirada | Tiempo de sesión agotado |

#### Errores de Base de Datos

| Error | Descripción | Causa Probable |
|-------|-------------|----------------|
| DB_CONNECTION | Error de conexión BD | Servidor de BD inaccesible |
| DB_QUERY_ERROR | Error en consulta | Problema en estructura de datos |
| DB_CONSTRAINT | Violación de restricción | Datos duplicados o inválidos |

### 7.2 Soluciones

#### Problemas de Conectividad

1. **Verificar Conexión a Internet**
   - Comprobar WiFi o datos móviles
   - Probar con otras aplicaciones
   - Reiniciar conexión de red

2. **Configuración del Servidor**
   - Verificar dirección IP del servidor
   - Comprobar puerto de conexión
   - Validar configuración de firewall

3. **Reinicio de Aplicación**
   - Cerrar y abrir la aplicación
   - Limpiar caché de la aplicación
   - Reiniciar dispositivo si es necesario

#### Problemas de Autenticación

1. **Verificar Credenciales**
   - Confirmar usuario y contraseña
   - Verificar mayúsculas y minúsculas
   - Comprobar caracteres especiales

2. **Recuperación de Cuenta**
   - Usar función de recuperación
   - Contactar soporte técnico
   - Crear nueva cuenta si es necesario

#### Problemas de Sincronización

1. **Sincronización Manual**
   - Usar opción de sincronizar
   - Verificar última sincronización
   - Comprobar conflictos de datos

2. **Limpieza de Datos**
   - Limpiar caché local
   - Resincronizar desde servidor
   - Verificar integridad de datos

### 7.3 Códigos de Error

#### Códigos HTTP

- **200:** Operación exitosa
- **400:** Solicitud incorrecta
- **401:** No autorizado
- **403:** Acceso prohibido
- **404:** Recurso no encontrado
- **500:** Error interno del servidor
- **503:** Servicio no disponible

#### Códigos de Aplicación

- **APP001:** Error de inicialización
- **APP002:** Problema de permisos
- **APP003:** Error de configuración
- **APP004:** Fallo en alarma
- **APP005:** Error de sincronización

---

## 8. CONTINGENCIAS

### 8.1 Problemas de Conectividad

#### Funcionamiento Offline

La aplicación mantiene funcionalidad básica sin conexión:

- **Alarmas Locales:** Continúan funcionando
- **Registro Temporal:** Se almacena localmente
- **Sincronización Posterior:** Al recuperar conexión

#### Procedimientos de Emergencia

1. **Pérdida de Conexión Durante Uso**
   - Continuar usando funciones offline
   - Guardar datos localmente
   - Sincronizar al recuperar conexión

2. **Falla del Servidor**
   - Notificar a soporte técnico
   - Usar modo offline extendido
   - Mantener registro manual si es crítico

### 8.2 Pérdida de Datos

#### Prevención

- **Respaldo Automático:** Sincronización constante
- **Almacenamiento Local:** Copia de seguridad local
- **Exportación de Datos:** Reportes PDF regulares

#### Recuperación

1. **Datos Locales Perdidos**
   - Sincronizar desde servidor
   - Recuperar desde último respaldo
   - Reconstruir información crítica

2. **Datos del Servidor Perdidos**
   - Usar respaldo local
   - Contactar administrador del sistema
   - Implementar recuperación de emergencia

### 8.3 Fallas del Sistema

#### Tipos de Fallas

- **Falla de Aplicación:** Cierre inesperado
- **Falla de Sistema Operativo:** Problemas del dispositivo
- **Falla de Hardware:** Problemas físicos del dispositivo

#### Procedimientos de Recuperación

1. **Reinicio de Aplicación**
   - Cerrar aplicación completamente
   - Limpiar memoria RAM
   - Reiniciar aplicación

2. **Reinicio de Sistema**
   - Reiniciar dispositivo
   - Verificar espacio de almacenamiento
   - Actualizar sistema operativo

3. **Reinstalación**
   - Desinstalar aplicación
   - Limpiar datos residuales
   - Reinstalar versión actualizada

---

## 9. GLOSARIO

**Adherencia Terapéutica:** Grado en que el comportamiento de una persona coincide con las recomendaciones médicas.

**API REST:** Interfaz de programación de aplicaciones que utiliza protocolos HTTP para la comunicación.

**Backend:** Parte del sistema que maneja la lógica del servidor y la base de datos.

**Base de Datos:** Sistema de almacenamiento estructurado de información.

**Drawer Navigation:** Tipo de navegación lateral deslizable en aplicaciones móviles.

**Expo:** Plataforma de desarrollo para aplicaciones React Native.

**Frontend:** Parte del sistema que interactúa directamente con el usuario.

**MySQL:** Sistema de gestión de bases de datos relacionales.

**Notificación Push:** Mensaje enviado desde un servidor a un dispositivo móvil.

**React Native:** Framework para desarrollo de aplicaciones móviles multiplataforma.

**Sincronización:** Proceso de actualización de datos entre dispositivo y servidor.

**Stack Navigation:** Tipo de navegación por apilamiento de pantallas.

**UI/UX:** Interfaz de Usuario / Experiencia de Usuario.

**XAMPP:** Paquete de software que incluye Apache, MySQL, PHP y Perl.

---

## 10. ANEXOS

### 10.1 Diagramas de Flujo

#### Flujo de Inicio de Sesión

(imagen aqui)

```
Inicio → Pantalla Login → Validar Credenciales → ¿Válidas? 
    ↓ No                                           ↓ Sí
Mostrar Error ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← Pantalla Principal
```

#### Flujo de Gestión de Alarmas

(imagen aqui)

```
Alarma Programada → Mostrar Notificación → Usuario Responde
    ↓                                           ↓
¿Hora Actual? → Sí → Activar Alarma → ¿Tomado?
    ↓ No                                  ↓ Sí      ↓ No
Esperar ← ← ← ← ← ← ← ← ← ← ← ← ← ← Registrar → Posponer/Omitir
```

#### Flujo de Registro de Medicamento

(imagen aqui)

```
Seleccionar Medicamento → Configurar Tratamiento → Programar Horarios
    ↓                           ↓                       ↓
Validar Datos → Guardar en BD → Crear Alarmas → Confirmar Creación
```

### 10.2 Capturas de Pantalla

#### Pantalla de Login
(imagen aqui)

#### Pantalla Principal
(imagen aqui)

#### Gestión de Medicamentos
(imagen aqui)

#### Alarma Activa
(imagen aqui)

#### Registro de Tomas
(imagen aqui)

#### Perfil de Usuario
(imagen aqui)

#### Reporte PDF
(imagen aqui)

### 10.3 Información Técnica Adicional

#### Estructura de Base de Datos

**Tabla usuarios:**
- usuario_id (PK)
- nombre
- email
- password
- fecha_registro

**Tabla remedio_global:**
- remedio_global_id (PK)
- nombre_comercial
- descripcion
- efectos_secundarios
- peso_unidad
- presentacion

**Tabla programacion_tratamientos:**
- programacion_id (PK)
- usuario_id (FK)
- remedio_global_id (FK)
- fecha_inicio
- fecha_fin
- dosis
- frecuencia

**Tabla alarmas:**
- alarma_id (PK)
- programacion_id (FK)
- hora_programada
- estado
- fecha_creacion

**Tabla registro_tomas:**
- registro_id (PK)
- programacion_id (FK)
- fecha_hora
- estado
- observaciones

#### Configuración de Desarrollo

**Archivo package.json (principales dependencias):**
```json
{
  "dependencies": {
    "expo": "~54.0.10",
    "react": "19.1.0",
    "react-native": "0.81.4",
    "@react-navigation/native-stack": "^7.3.21",
    "expo-notifications": "~0.32.11",
    "expo-audio": "~1.0.13"
  }
}
```

**Configuración del Servidor:**
- Puerto por defecto: 8081
- Protocolo: HTTP/HTTPS
- Base de datos: MySQL 5.7+
- PHP: 7.4+

#### Permisos Detallados

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.INTERNET" />
```

**iOS (ios/SmartPill/Info.plist):**
```xml
<key>NSUserNotificationUsageDescription</key>
<string>Esta aplicación necesita enviar notificaciones para recordar la toma de medicamentos</string>
```

---

**© 2025 Smart Pill - Sistema de Gestión de Medicamentos**  
**Manual de Usuario v1.0**  
**Página [NÚMERO] de [TOTAL]**  
**Última actualización: Enero 2025**