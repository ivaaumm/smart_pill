-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 08-09-2025 a las 01:39:56
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

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `remedio_global`
--
ALTER TABLE `remedio_global`
  ADD PRIMARY KEY (`remedio_global_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `remedio_global`
--
ALTER TABLE `remedio_global`
  MODIFY `remedio_global_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
