-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-09-2025 a las 20:04:38
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `smart_pill`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alarmas`
--

CREATE TABLE `alarmas` (
  `alarma_id` int(11) NOT NULL,
  `programacion_id` int(11) NOT NULL,
  `horario_id` int(11) DEFAULT NULL,
  `hora` time NOT NULL,
  `dias_semana` varchar(20) NOT NULL COMMENT 'Comma-separated day numbers (1=Lunes, 7=Domingo)',
  `activa` tinyint(1) DEFAULT 1,
  `sonido` varchar(100) DEFAULT 'default',
  `vibrar` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alarma_remedio`
--

CREATE TABLE `alarma_remedio` (
  `alarma_id` int(11) NOT NULL,
  `remedio_usuario_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `horarios_tratamiento`
--

CREATE TABLE `horarios_tratamiento` (
  `horario_id` int(11) NOT NULL,
  `tratamiento_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `remedio_global_id` int(11) NOT NULL,
  `dia_semana` enum('lunes','martes','miercoles','jueves','viernes','sabado','domingo') NOT NULL,
  `hora` time NOT NULL,
  `dosis` varchar(50) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `horarios_tratamiento`
--

INSERT INTO `horarios_tratamiento` (`horario_id`, `tratamiento_id`, `usuario_id`, `remedio_global_id`, `dia_semana`, `hora`, `dosis`, `activo`, `fecha_creacion`) VALUES
(154, 26, 1, 17, 'sabado', '15:05:00', '1', 1, '2025-09-12 18:01:41'),
(155, 26, 1, 17, 'domingo', '15:05:00', '1', 1, '2025-09-12 18:01:41'),
(156, 26, 1, 17, 'viernes', '15:05:00', '1', 1, '2025-09-12 18:01:41'),
(157, 26, 1, 17, 'miercoles', '15:05:00', '1', 1, '2025-09-12 18:01:41'),
(158, 26, 1, 17, 'martes', '15:05:00', '1', 1, '2025-09-12 18:01:41'),
(159, 26, 1, 17, 'lunes', '15:05:00', '1', 1, '2025-09-12 18:01:41'),
(160, 26, 1, 17, 'jueves', '15:05:00', '1', 1, '2025-09-12 18:01:41');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_pastillas`
--

CREATE TABLE `movimientos_pastillas` (
  `movimiento_id` int(11) NOT NULL,
  `remedio_usuario_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `fecha_hora` datetime DEFAULT NULL,
  `cantidad_cambiada` int(11) DEFAULT NULL,
  `peso_medido` decimal(10,2) DEFAULT NULL,
  `tipo_movimiento` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `programacion_horarios`
--

CREATE TABLE `programacion_horarios` (
  `horario_id` int(11) NOT NULL,
  `programacion_id` int(11) NOT NULL,
  `hora` time NOT NULL,
  `dias_semana` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `programacion_tratamientos`
--

CREATE TABLE `programacion_tratamientos` (
  `programacion_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `remedio_global_id` int(11) NOT NULL,
  `nombre_tratamiento` varchar(100) DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `dosis_por_toma` varchar(50) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` enum('activo','pausado','completado','cancelado') DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tiene_alarmas` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `programacion_tratamientos`
--

INSERT INTO `programacion_tratamientos` (`programacion_id`, `usuario_id`, `remedio_global_id`, `nombre_tratamiento`, `fecha_inicio`, `fecha_fin`, `dosis_por_toma`, `observaciones`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `tiene_alarmas`) VALUES
(26, 1, 17, 'Aciclovir', '2025-09-12', '2025-10-12', '1 tableta', NULL, 'activo', '2025-09-12 18:01:41', '2025-09-12 18:01:41', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `remedios_globales`
--

CREATE TABLE `remedios_globales` (
  `remedio_global_id` int(11) NOT NULL,
  `nombre_comercial` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `remedio_global`
--

CREATE TABLE `remedio_global` (
  `remedio_global_id` int(11) NOT NULL,
  `nombre_comercial` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `efectos_secundarios` text DEFAULT NULL,
  `peso_unidad` decimal(10,2) DEFAULT NULL,
  `presentacion` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `remedio_global`
--

INSERT INTO `remedio_global` (`remedio_global_id`, `nombre_comercial`, `descripcion`, `efectos_secundarios`, `peso_unidad`, `presentacion`) VALUES
(1, 'Paracetamol', 'Analgésico y antipirético de uso común', 'Náuseas, erupciones cutáneas, daño hepático en dosis altas', 500.00, 'Tableta'),
(2, 'Ibuprofeno', 'Antiinflamatorio no esteroideo (AINE)', 'Dolor estomacal, mareos, úlceras', 400.00, 'Cápsula'),
(3, 'Amoxicilina', 'Antibiótico del grupo de las penicilinas', 'Diarrea, alergias, candidiasis oral', 500.00, 'Tableta'),
(4, 'Omeprazol', 'Inhibidor de la bomba de protones para reducir la acidez', 'Dolor de cabeza, diarrea, náuseas', 20.00, 'Cápsula'),
(5, 'Loratadina', 'Antihistamínico para alergias', 'Somnolencia, dolor de cabeza, sequedad bucal', 10.00, 'Tableta'),
(6, 'Metformina', 'Tratamiento para la diabetes tipo 2', 'Problemas gastrointestinales, acidosis láctica rara', 850.00, 'Tableta'),
(7, 'Salbutamol', 'Broncodilatador para el asma', 'Temblor, taquicardia, nerviosismo', 100.00, 'Inhalador'),
(8, 'Losartán', 'Antihipertensivo, bloqueador de los receptores de angiotensina II', 'Mareos, fatiga, hiperpotasemia', 50.00, 'Tableta'),
(9, 'Atorvastatina', 'Reductor del colesterol', 'Dolor muscular, náuseas, problemas hepáticos', 20.00, 'Tableta'),
(10, 'Clonazepam', 'Benzodiacepina usada para ansiedad o epilepsia', 'Somnolencia, dependencia, mareos', 0.50, 'Tableta'),
(11, 'Levotiroxina', 'Hormona tiroidea sintética para el hipotiroidismo', 'Ansiedad, insomnio, palpitaciones', 100.00, 'Tableta'),
(12, 'Diclofenac', 'Antiinflamatorio no esteroideo', 'Náuseas, úlceras, mareos', 50.00, 'Tableta'),
(13, 'Ranitidina', 'Reductor de ácido gástrico (uso restringido)', 'Dolor de cabeza, estreñimiento, confusión', 150.00, 'Tableta'),
(14, 'Cetirizina', 'Antihistamínico contra la rinitis y urticaria', 'Somnolencia, sequedad bucal, fatiga', 10.00, 'Tableta'),
(15, 'Dexametasona', 'Corticoide de uso antiinflamatorio y inmunosupresor', 'Aumento de peso, insomnio, hipertensión', 4.00, 'Tableta'),
(16, 'Azitromicina', 'Antibiótico de amplio espectro', 'Diarrea, náuseas, dolor abdominal', 500.00, 'Tableta'),
(17, 'Aciclovir', 'Antiviral para herpes', 'Dolor de cabeza, náuseas, diarrea', 400.00, 'Tableta'),
(18, 'Diazepam', 'Ansiolítico y relajante muscular', 'Somnolencia, dependencia, alteraciones cognitivas', 10.00, 'Tableta'),
(19, 'Furosemida', 'Diurético para tratar retención de líquidos', 'Desequilibrio electrolítico, deshidratación, hipotensión', 40.00, 'Tableta'),
(20, 'Enalapril', 'Inhibidor de la ECA para hipertensión', 'Tos seca, mareos, erupciones cutáneas', 10.00, 'Tableta'),
(21, 'Prednisona', 'Corticosteroide inmunosupresor y antiinflamatorio', 'Aumento de apetito, insomnio, osteoporosis', 20.00, 'Tableta'),
(22, 'Insulina glargina', 'Insulina de acción prolongada', 'Hipoglucemia, aumento de peso, reacciones locales', 100.00, 'Inyectable'),
(23, 'Fluoxetina', 'Antidepresivo inhibidor de la recaptación de serotonina', 'Insomnio, náuseas, ansiedad', 20.00, 'Cápsula'),
(24, 'Clopidogrel', 'Antiplaquetario usado en prevención de trombosis', 'Hemorragias, dolor de cabeza, náuseas', 75.00, 'Tableta'),
(25, 'Hidroclorotiazida', 'Diurético tiazídico', 'Desequilibrio electrolítico, mareos, aumento de glucosa', 25.00, 'Tableta'),
(26, 'Warfarina', 'Anticoagulante oral', 'Sangrados, náuseas, calambres musculares', 5.00, 'Tableta'),
(27, 'Esomeprazol', 'Inhibidor de la bomba de protones', 'Dolor de cabeza, diarrea, náuseas', 40.00, 'Cápsula'),
(28, 'Sertralina', 'Antidepresivo ISRS', 'Insomnio, disfunción sexual, temblores', 50.00, 'Tableta'),
(29, 'Tramadol', 'Analgésico opioide débil', 'Somnolencia, náuseas, dependencia', 50.00, 'Cápsula'),
(30, 'Naproxeno', 'AINE para dolores musculares y articulares', 'Náuseas, dolor estomacal, hipertensión', 500.00, 'Tableta'),
(31, 'Tamsulosina', 'Alfa bloqueador para hiperplasia prostática', 'Mareos, eyaculación anormal, congestión nasal', 0.40, 'Cápsula'),
(32, 'Ketorolaco', 'AINE potente para dolor agudo', 'Úlceras, sangrados gastrointestinales, mareos', 10.00, 'Tableta'),
(33, 'Ciprofloxacino', 'Antibiótico fluoroquinolona', 'Diarrea, náuseas, dolor articular', 500.00, 'Tableta'),
(34, 'Alprazolam', 'Ansiolítico de acción rápida', 'Somnolencia, dependencia, mareos', 0.50, 'Tableta'),
(35, 'Atenolol', 'Betabloqueador para hipertensión y arritmias', 'Fatiga, bradicardia, insomnio', 50.00, 'Tableta'),
(36, 'Insulina regular', 'Insulina de acción rápida', 'Hipoglucemia, lipodistrofia, visión borrosa', 100.00, 'Inyectable'),
(37, 'Budesonida', 'Corticoide inhalado para asma y EPOC', 'Candidiasis oral, ronquera, tos', 200.00, 'Inhalador'),
(38, 'Rivaroxabán', 'Anticoagulante oral directo', 'Hemorragias, anemia, náuseas', 20.00, 'Tableta'),
(39, 'Lamotrigina', 'Antiepiléptico y estabilizador del ánimo', 'Erupción cutánea, mareos, visión borrosa', 100.00, 'Tableta'),
(40, 'Montelukast', 'Antiasmático y antialérgico', 'Dolor de cabeza, fatiga, cambios de humor', 10.00, 'Tableta'),
(41, 'Olmesartán', 'Antihipertensivo ARA II', 'Mareos, diarrea, hiperpotasemia', 20.00, 'Tableta'),
(42, 'Espironolactona', 'Diurético ahorrador de potasio', 'Hiperpotasemia, ginecomastia, fatiga', 25.00, 'Tableta'),
(43, 'Levetiracetam', 'Antiepiléptico', 'Somnolencia, irritabilidad, mareos', 500.00, 'Tableta'),
(44, 'Metoclopramida', 'Antiemético y procinético digestivo', 'Somnolencia, temblores, diarrea', 10.00, 'Tableta'),
(45, 'Carbamazepina', 'Antiepiléptico y estabilizador del ánimo', 'Mareos, visión doble, erupciones cutáneas', 200.00, 'Tableta'),
(46, 'Topiramato', 'Antiepiléptico y tratamiento de migrañas', 'Pérdida de peso, problemas de memoria, somnolencia', 50.00, 'Tableta'),
(47, 'Bisoprolol', 'Betabloqueante selectivo', 'Fatiga, bradicardia, hipotensión', 5.00, 'Tableta'),
(48, 'Rosuvastatina', 'Estatina para reducir colesterol', 'Dolor muscular, náuseas, dolor abdominal', 10.00, 'Tableta'),
(49, 'Pantoprazol', 'Inhibidor de la bomba de protones', 'Diarrea, dolor de cabeza, náuseas', 40.00, 'Tableta'),
(50, 'Doxiciclina', 'Antibiótico de la familia de las tetraciclinas', 'Fotosensibilidad, náuseas, diarrea', 100.00, 'Cápsula'),
(51, 'Clorfenamina', 'Antihistamínico para alergias', 'Somnolencia, mareos, boca seca', 4.00, 'Tableta'),
(52, 'Fenitoína', 'Antiepiléptico estabilizador de membrana', 'Hiperplasia gingival, visión doble, somnolencia', 100.00, 'Tableta'),
(53, 'Lansoprazol', 'Inhibidor de la bomba de protones', 'Dolor abdominal, diarrea, mareos', 30.00, 'Cápsula'),
(54, 'Valproato de sodio', 'Tratamiento para epilepsia y trastorno bipolar', 'Aumento de peso, temblor, alteración hepática', 500.00, 'Tableta'),
(55, 'Bromazepam', 'Ansiolítico de acción intermedia', 'Somnolencia, mareos, dependencia', 3.00, 'Tableta'),
(56, 'Propranolol', 'Betabloqueante no selectivo', 'Mareos, fatiga, bradicardia', 40.00, 'Tableta'),
(57, 'Loperamida', 'Antidiarreico', 'Estreñimiento, náuseas, distensión abdominal', 2.00, 'Cápsula'),
(58, 'Metamizol sódico', 'Analgésico y antipirético potente', 'Reacciones alérgicas, agranulocitosis', 500.00, 'Inyectable'),
(59, 'Desloratadina', 'Antihistamínico de segunda generación', 'Dolor de cabeza, fatiga, boca seca', 5.00, 'Tableta'),
(60, 'Ondansetrón', 'Antiemético para náuseas intensas', 'Estreñimiento, dolor de cabeza, fatiga', 8.00, 'Tableta'),
(61, 'Amiodarona', 'Antiarrítmico clase III', 'Alteraciones tiroideas, fotosensibilidad, fibrosis pulmonar', 200.00, 'Tableta'),
(62, 'Duloxetina', 'Antidepresivo dual', 'Náuseas, sequedad bucal, insomnio', 60.00, 'Cápsula'),
(63, 'Escitalopram', 'ISRS para ansiedad y depresión', 'Insomnio, náuseas, fatiga', 10.00, 'Tableta'),
(64, 'Mebendazol', 'Antiparasitario de amplio espectro', 'Dolor abdominal, diarrea, mareos', 100.00, 'Tableta'),
(65, 'Albendazol', 'Antiparasitario', 'Dolor de cabeza, náuseas, alteración hepática', 400.00, 'Tableta'),
(66, 'Clindamicina', 'Antibiótico lincosamida', 'Diarrea, colitis pseudomembranosa, náuseas', 300.00, 'Cápsula'),
(67, 'Nitrofurantoína', 'Antibiótico para infecciones urinarias', 'Náuseas, dolor de cabeza, orina oscura', 100.00, 'Cápsula'),
(68, 'Ketoconazol', 'Antifúngico oral', 'Toxicidad hepática, náuseas, alteración hormonal', 200.00, 'Tableta'),
(69, 'Itraconazol', 'Antifúngico sistémico', 'Dolor abdominal, náuseas, elevación de transaminasas', 100.00, 'Cápsula'),
(70, 'Lorazepam', 'Ansiolítico y sedante', 'Somnolencia, dependencia, debilidad muscular', 2.00, 'Tableta'),
(71, 'Risperidona', 'Antipsicótico atípico', 'Sedación, aumento de peso, temblores', 2.00, 'Tableta'),
(72, 'Quetiapina', 'Antipsicótico y estabilizador del ánimo', 'Somnolencia, aumento de apetito, mareos', 100.00, 'Tableta'),
(73, 'Haloperidol', 'Antipsicótico típico', 'Temblor, rigidez, sedación', 5.00, 'Tableta'),
(74, 'Aripiprazol', 'Antipsicótico atípico con acción parcial dopaminérgica', 'Insomnio, ansiedad, náuseas', 10.00, 'Tableta'),
(75, 'Baclofeno', 'Relajante muscular', 'Somnolencia, mareos, debilidad muscular', 10.00, 'Tableta'),
(76, 'Gabapentina', 'Antiepiléptico y para neuropatías', 'Somnolencia, mareos, aumento de peso', 300.00, 'Cápsula'),
(77, 'Pregabalina', 'Tratamiento para dolor neuropático y ansiedad', 'Mareos, somnolencia, aumento de peso', 75.00, 'Cápsula'),
(78, 'Nifedipino', 'Antihipertensivo bloqueador de canales de calcio', 'Edema, mareos, dolor de cabeza', 30.00, 'Tableta'),
(79, 'Verapamilo', 'Calcioantagonista para hipertensión y arritmias', 'Estreñimiento, hipotensión, bradicardia', 80.00, 'Tableta'),
(80, 'Nitroglicerina', 'Vasodilatador para angina', 'Cefalea, hipotensión, mareos', 0.50, 'Sublingual'),
(81, 'Isosorbide dinitrato', 'Tratamiento de angina de pecho', 'Dolor de cabeza, hipotensión, taquicardia', 10.00, 'Tableta'),
(82, 'Digoxina', 'Tratamiento para insuficiencia cardíaca y arritmias', 'Visión borrosa, náuseas, arritmias', 0.25, 'Tableta'),
(83, 'Levocetirizina', 'Antihistamínico moderno', 'Somnolencia, boca seca, fatiga', 5.00, 'Tableta'),
(84, 'Carvedilol', 'Betabloqueante no selectivo con actividad alfa', 'Mareos, fatiga, hipotensión', 25.00, 'Tableta'),
(85, 'Trazodona', 'Antidepresivo sedante usado para insomnio', 'Somnolencia, sequedad bucal, mareos', 100.00, 'Tableta'),
(86, 'Tiotropio', 'Broncodilatador para EPOC', 'Boca seca, tos, dolor de cabeza', 18.00, 'Inhalador'),
(87, 'Formoterol', 'Broncodilatador beta-2 agonista', 'Temblor, palpitaciones, nerviosismo', 12.00, 'Inhalador'),
(88, 'Bromhexina', 'Mucolítico para tos productiva', 'Náuseas, vómitos, diarrea', 8.00, 'Jarabe'),
(89, 'Ambroxol', 'Mucolítico y expectorante', 'Gusto metálico, náuseas, erupción cutánea', 15.00, 'Jarabe'),
(90, 'Codeína', 'Antitusígeno opiáceo', 'Somnolencia, estreñimiento, dependencia', 30.00, 'Jarabe'),
(91, 'Clonidina', 'Tratamiento de hipertensión y abstinencia', 'Somnolencia, sequedad bucal, bradicardia', 0.15, 'Tableta'),
(92, 'Benazepril', 'IECA para presión alta', 'Tos, mareos, hiperpotasemia', 10.00, 'Tableta'),
(93, 'Ramipril', 'Inhibidor de la ECA', 'Tos seca, mareos, fatiga', 5.00, 'Tableta'),
(94, 'Pioglitazona', 'Antidiabético sensibilizador de insulina', 'Aumento de peso, edema, riesgo cardíaco', 15.00, 'Tableta'),
(95, 'Linagliptina', 'Inhibidor de DPP-4 para diabetes tipo 2', 'Nasofaringitis, dolor de cabeza, hipoglucemia', 5.00, 'Tableta'),
(96, 'Empagliflozina', 'Antidiabético que elimina glucosa por orina', 'Infecciones urinarias, deshidratación, hipotensión', 10.00, 'Tableta');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `remedio_usuario`
--

CREATE TABLE `remedio_usuario` (
  `remedio_usuario_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `remedio_global_id` int(11) DEFAULT NULL,
  `nombre_custom` varchar(100) DEFAULT NULL,
  `descripcion_custom` text DEFAULT NULL,
  `efectos_secundarios` text DEFAULT NULL,
  `peso_unidad` decimal(10,2) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `cantidad_inicial` int(11) DEFAULT NULL,
  `cantidad_actual` int(11) DEFAULT NULL,
  `es_global` tinyint(1) DEFAULT NULL,
  `tipo_tratamiento` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tratamientos`
--

CREATE TABLE `tratamientos` (
  `tratamiento_id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `tratamientos`
--

INSERT INTO `tratamientos` (`tratamiento_id`, `nombre`, `descripcion`) VALUES
(1, 'Analgésico', 'Tratamiento para aliviar el dolor'),
(2, 'Antibiótico', 'Tratamiento para infecciones bacterianas'),
(3, 'Antiinflamatorio', 'Tratamiento para reducir la inflamación'),
(4, 'Antihistamínico', 'Tratamiento para alergias'),
(5, 'Antipirético', 'Tratamiento para reducir la fiebre'),
(6, 'Ansiolítico', 'Tratamiento para reducir la ansiedad'),
(7, 'Antidepresivo', 'Tratamiento para trastornos depresivos'),
(8, 'Anticonvulsivo', 'Tratamiento para epilepsia y convulsiones'),
(9, 'Antipsicótico', 'Tratamiento para trastornos psicóticos'),
(10, 'Broncodilatador', 'Tratamiento para abrir las vías respiratorias'),
(11, 'Hipotensor', 'Tratamiento para reducir la presión arterial'),
(12, 'Hipoglucemiante', 'Tratamiento para reducir niveles de glucosa'),
(13, 'Anticoagulante', 'Tratamiento para evitar coágulos sanguíneos'),
(14, 'Antifúngico', 'Tratamiento para infecciones por hongos'),
(15, 'Antiviral', 'Tratamiento para infecciones virales'),
(16, 'Relajante muscular', 'Tratamiento para relajar los músculos'),
(17, 'Antiemético', 'Tratamiento para prevenir náuseas y vómitos'),
(18, 'Antidiarreico', 'Tratamiento para controlar la diarrea'),
(19, 'Laxante', 'Tratamiento para aliviar el estreñimiento'),
(20, 'Hormonal', 'Tratamiento con hormonas o sustitución hormonal'),
(21, 'Antiparasitario', 'Tratamiento para infecciones por parásitos'),
(22, 'Corticoide', 'Tratamiento con efectos antiinflamatorios e inmunosupresores'),
(23, 'Neuroprotector', 'Tratamiento para proteger las neuronas'),
(24, 'Antimigrañoso', 'Tratamiento específico para migrañas'),
(25, 'Otros', 'Tratamientos no clasificados en las categorías anteriores');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `usuario_id` int(11) NOT NULL,
  `nombre_usuario` varchar(100) NOT NULL,
  `contrasena_hash` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`usuario_id`, `nombre_usuario`, `contrasena_hash`, `email`, `fecha_creacion`, `fecha_nacimiento`, `avatar`) VALUES
(1, 'nahir', '$2y$10$VVoGninh/bXKfnKZc6KDpuDO1noY069yWF5hYIH2ngAvIHPE/Pcui', 'nahirailin1234@gmail.com', '2025-08-31 22:21:58', '2006-08-28', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alarmas`
--
ALTER TABLE `alarmas`
  ADD PRIMARY KEY (`alarma_id`),
  ADD KEY `programacion_id` (`programacion_id`),
  ADD KEY `horario_id` (`horario_id`),
  ADD KEY `idx_alarmas_programacion` (`programacion_id`),
  ADD KEY `idx_alarmas_activas` (`activa`),
  ADD KEY `idx_alarmas_horario` (`horario_id`);

--
-- Indices de la tabla `alarma_remedio`
--
ALTER TABLE `alarma_remedio`
  ADD PRIMARY KEY (`alarma_id`,`remedio_usuario_id`),
  ADD KEY `remedio_usuario_id` (`remedio_usuario_id`);

--
-- Indices de la tabla `horarios_tratamiento`
--
ALTER TABLE `horarios_tratamiento`
  ADD PRIMARY KEY (`horario_id`),
  ADD KEY `tratamiento_id` (`tratamiento_id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `horarios_tratamiento_ibfk_3` (`remedio_global_id`);

--
-- Indices de la tabla `movimientos_pastillas`
--
ALTER TABLE `movimientos_pastillas`
  ADD PRIMARY KEY (`movimiento_id`),
  ADD KEY `remedio_usuario_id` (`remedio_usuario_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `programacion_horarios`
--
ALTER TABLE `programacion_horarios`
  ADD PRIMARY KEY (`horario_id`),
  ADD KEY `programacion_id` (`programacion_id`);

--
-- Indices de la tabla `programacion_tratamientos`
--
ALTER TABLE `programacion_tratamientos`
  ADD PRIMARY KEY (`programacion_id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `remedio_global_id` (`remedio_global_id`);

--
-- Indices de la tabla `remedios_globales`
--
ALTER TABLE `remedios_globales`
  ADD PRIMARY KEY (`remedio_global_id`);

--
-- Indices de la tabla `remedio_global`
--
ALTER TABLE `remedio_global`
  ADD PRIMARY KEY (`remedio_global_id`);

--
-- Indices de la tabla `remedio_usuario`
--
ALTER TABLE `remedio_usuario`
  ADD PRIMARY KEY (`remedio_usuario_id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `remedio_global_id` (`remedio_global_id`),
  ADD KEY `tipo_tratamiento` (`tipo_tratamiento`);

--
-- Indices de la tabla `tratamientos`
--
ALTER TABLE `tratamientos`
  ADD PRIMARY KEY (`tratamiento_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`usuario_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alarmas`
--
ALTER TABLE `alarmas`
  MODIFY `alarma_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `horarios_tratamiento`
--
ALTER TABLE `horarios_tratamiento`
  MODIFY `horario_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT de la tabla `movimientos_pastillas`
--
ALTER TABLE `movimientos_pastillas`
  MODIFY `movimiento_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `programacion_horarios`
--
ALTER TABLE `programacion_horarios`
  MODIFY `horario_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `programacion_tratamientos`
--
ALTER TABLE `programacion_tratamientos`
  MODIFY `programacion_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `remedios_globales`
--
ALTER TABLE `remedios_globales`
  MODIFY `remedio_global_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `remedio_global`
--
ALTER TABLE `remedio_global`
  MODIFY `remedio_global_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT de la tabla `remedio_usuario`
--
ALTER TABLE `remedio_usuario`
  MODIFY `remedio_usuario_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tratamientos`
--
ALTER TABLE `tratamientos`
  MODIFY `tratamiento_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `usuario_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alarmas`
--
ALTER TABLE `alarmas`
  ADD CONSTRAINT `alarmas_ibfk_1` FOREIGN KEY (`programacion_id`) REFERENCES `programacion_tratamientos` (`programacion_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alarmas_ibfk_2` FOREIGN KEY (`horario_id`) REFERENCES `programacion_horarios` (`horario_id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `alarma_remedio`
--
ALTER TABLE `alarma_remedio`
  ADD CONSTRAINT `alarma_remedio_ibfk_1` FOREIGN KEY (`alarma_id`) REFERENCES `alarmas` (`alarma_id`),
  ADD CONSTRAINT `alarma_remedio_ibfk_2` FOREIGN KEY (`remedio_usuario_id`) REFERENCES `remedio_usuario` (`remedio_usuario_id`);

--
-- Filtros para la tabla `horarios_tratamiento`
--
ALTER TABLE `horarios_tratamiento`
  ADD CONSTRAINT `horarios_tratamiento_ibfk_1` FOREIGN KEY (`tratamiento_id`) REFERENCES `programacion_tratamientos` (`programacion_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `horarios_tratamiento_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `horarios_tratamiento_ibfk_3` FOREIGN KEY (`remedio_global_id`) REFERENCES `remedio_global` (`remedio_global_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `movimientos_pastillas`
--
ALTER TABLE `movimientos_pastillas`
  ADD CONSTRAINT `movimientos_pastillas_ibfk_1` FOREIGN KEY (`remedio_usuario_id`) REFERENCES `remedio_usuario` (`remedio_usuario_id`),
  ADD CONSTRAINT `movimientos_pastillas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`);

--
-- Filtros para la tabla `programacion_horarios`
--
ALTER TABLE `programacion_horarios`
  ADD CONSTRAINT `programacion_horarios_ibfk_1` FOREIGN KEY (`programacion_id`) REFERENCES `programacion_tratamientos` (`programacion_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `programacion_tratamientos`
--
ALTER TABLE `programacion_tratamientos`
  ADD CONSTRAINT `programacion_tratamientos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `programacion_tratamientos_ibfk_2` FOREIGN KEY (`remedio_global_id`) REFERENCES `remedio_global` (`remedio_global_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `remedio_usuario`
--
ALTER TABLE `remedio_usuario`
  ADD CONSTRAINT `remedio_usuario_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`),
  ADD CONSTRAINT `remedio_usuario_ibfk_2` FOREIGN KEY (`remedio_global_id`) REFERENCES `remedio_global` (`remedio_global_id`),
  ADD CONSTRAINT `remedio_usuario_ibfk_3` FOREIGN KEY (`tipo_tratamiento`) REFERENCES `tratamientos` (`tratamiento_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
