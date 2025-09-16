-- Tabla para registros profesionales de tomas de medicamentos
CREATE TABLE `registro_tomas` (
  `registro_id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `horario_id` int(11) NOT NULL,
  `remedio_global_id` int(11) NOT NULL,
  `programacion_id` int(11) NOT NULL,
  `fecha_programada` date NOT NULL,
  `hora_programada` time NOT NULL,
  `fecha_hora_accion` datetime DEFAULT NULL,
  `estado` enum('pendiente','tomada','rechazada','pospuesta') DEFAULT 'pendiente',
  `estado_anterior` enum('pendiente','tomada','rechazada','pospuesta') DEFAULT NULL,
  `dosis_programada` varchar(50) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `es_cambio_estado` tinyint(1) DEFAULT 0 COMMENT '1 si es un cambio de estado de una toma pospuesta',
  `registro_original_id` int(11) DEFAULT NULL COMMENT 'ID del registro original si es un cambio de estado',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`registro_id`),
  KEY `idx_usuario_fecha` (`usuario_id`, `fecha_programada`),
  KEY `idx_estado` (`estado`),
  KEY `idx_horario` (`horario_id`),
  KEY `idx_remedio` (`remedio_global_id`),
  KEY `idx_programacion` (`programacion_id`),
  KEY `idx_registro_original` (`registro_original_id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`usuario_id`) ON DELETE CASCADE,
  FOREIGN KEY (`horario_id`) REFERENCES `horarios_tratamiento`(`horario_id`) ON DELETE CASCADE,
  FOREIGN KEY (`remedio_global_id`) REFERENCES `remedios_globales`(`remedio_global_id`) ON DELETE CASCADE,
  FOREIGN KEY (`programacion_id`) REFERENCES `programacion_tratamientos`(`programacion_id`) ON DELETE CASCADE,
  FOREIGN KEY (`registro_original_id`) REFERENCES `registro_tomas`(`registro_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- Índices adicionales para optimización
CREATE INDEX `idx_fecha_estado` ON `registro_tomas` (`fecha_programada`, `estado`);
CREATE INDEX `idx_usuario_estado_fecha` ON `registro_tomas` (`usuario_id`, `estado`, `fecha_programada`);