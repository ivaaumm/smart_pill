<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include "conexion.php";

try {
    // Sonidos predefinidos para cada tipo de alarma
    $sonidos_predefinidos = [
        [
            "id" => "default",
            "nombre" => "Sonido predeterminado",
            "descripcion" => "Sonido estándar del sistema",
            "archivo" => "default.mp3",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
            "duracion" => "3 segundos",
            "categoria" => "sistema"
        ],
        [
            "id" => "gentle",
            "nombre" => "Suave y relajante",
            "descripcion" => "Sonido suave para medicamentos diarios",
            "archivo" => "gentle.mp3",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/chime-1.wav",
            "duracion" => "2 segundos",
            "categoria" => "diario"
        ],
        [
            "id" => "urgent",
            "nombre" => "Urgente",
            "descripcion" => "Sonido de emergencia para medicamentos críticos",
            "archivo" => "urgent.mp3",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/emergency-alarm-1.wav",
            "duracion" => "5 segundos",
            "categoria" => "urgente"
        ],
        [
            "id" => "bell",
            "nombre" => "Campana clásica",
            "descripcion" => "Sonido de campana tradicional",
            "archivo" => "bell.mp3",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/bell-ringing-01.wav",
            "duracion" => "4 segundos",
            "categoria" => "clasico"
        ],
        [
            "id" => "chime",
            "nombre" => "Carillón musical",
            "descripcion" => "Sonido musical suave",
            "archivo" => "chime.mp3",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/chime-2.wav",
            "duracion" => "3 segundos",
            "categoria" => "musical"
        ],
        [
            "id" => "digital",
            "nombre" => "Digital moderno",
            "descripcion" => "Sonido digital contemporáneo",
            "archivo" => "digital.mp3",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/digital-1.wav",
            "duracion" => "2 segundos",
            "categoria" => "moderno"
        ],
        [
            "id" => "nature",
            "nombre" => "Naturaleza",
            "descripcion" => "Sonidos relajantes de la naturaleza",
            "archivo" => "nature.mp3",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/birds-1.wav",
            "duracion" => "6 segundos",
            "categoria" => "relajante"
        ],
        [
            "id" => "vibrate_only",
            "nombre" => "Solo vibración",
            "descripcion" => "Sin sonido, solo vibración",
            "archivo" => null,
            "url_descarga" => null,
            "duracion" => "0 segundos",
            "categoria" => "silencioso"
        ]
    ];
    
    // Sonidos del sistema (como los del reloj)
    $sonidos_sistema = [
        [
            "id" => "system_default",
            "nombre" => "Sistema predeterminado",
            "descripcion" => "Sonido estándar del dispositivo",
            "archivo" => "system_default",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/notification-1.wav",
            "duracion" => "1 segundo",
            "categoria" => "sistema"
        ],
        [
            "id" => "system_gentle",
            "nombre" => "Sistema suave",
            "descripcion" => "Sonido suave del sistema",
            "archivo" => "system_gentle",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/notification-2.wav",
            "duracion" => "1 segundo",
            "categoria" => "sistema"
        ],
        [
            "id" => "system_alert",
            "nombre" => "Sistema alerta",
            "descripcion" => "Sonido de alerta del sistema",
            "archivo" => "system_alert",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/alert-1.wav",
            "duracion" => "2 segundos",
            "categoria" => "sistema"
        ],
        [
            "id" => "system_notification",
            "nombre" => "Sistema notificación",
            "descripcion" => "Sonido de notificación del sistema",
            "archivo" => "system_notification",
            "url_descarga" => "https://www.soundjay.com/misc/sounds/notification-3.wav",
            "duracion" => "1 segundo",
            "categoria" => "sistema"
        ]
    ];
    
    // Configuraciones de vibración disponibles
    $vibraciones = [
        [
            "id" => 0,
            "nombre" => "Sin vibración",
            "descripcion" => "No vibrar",
            "patron" => "ninguno"
        ],
        [
            "id" => 1,
            "nombre" => "Vibración suave",
            "descripcion" => "Vibración corta y suave",
            "patron" => "corta"
        ],
        [
            "id" => 2,
            "nombre" => "Vibración media",
            "descripcion" => "Vibración moderada",
            "patron" => "media"
        ],
        [
            "id" => 3,
            "nombre" => "Vibración fuerte",
            "descripcion" => "Vibración intensa",
            "patron" => "fuerte"
        ]
    ];
    
    // Intervalos de repetición disponibles (en minutos)
    $intervalos_repeticion = [
        [
            "minutos" => 1,
            "descripcion" => "Cada minuto"
        ],
        [
            "minutos" => 2,
            "descripcion" => "Cada 2 minutos"
        ],
        [
            "minutos" => 5,
            "descripcion" => "Cada 5 minutos"
        ],
        [
            "minutos" => 10,
            "descripcion" => "Cada 10 minutos"
        ],
        [
            "minutos" => 15,
            "descripcion" => "Cada 15 minutos"
        ],
        [
            "minutos" => 30,
            "descripcion" => "Cada 30 minutos"
        ]
    ];
    
    // Configuraciones predefinidas para diferentes tipos de medicamentos
    $configuraciones_predefinidas = [
        [
            "id" => "medicamento_diario",
            "nombre" => "Medicamento diario",
            "descripcion" => "Para medicamentos que se toman todos los días",
            "sonido" => "gentle",
            "vibracion" => 1,
            "repetir_alarma" => 1,
            "intervalo_repeticion" => 5,
            "archivo_sonido" => "gentle.mp3",
            "url_sonido" => "https://www.soundjay.com/misc/sounds/chime-1.wav"
        ],
        [
            "id" => "antibiotico",
            "nombre" => "Antibiótico",
            "descripcion" => "Para antibióticos y medicamentos críticos",
            "sonido" => "urgent",
            "vibracion" => 2,
            "repetir_alarma" => 1,
            "intervalo_repeticion" => 2,
            "archivo_sonido" => "urgent.mp3",
            "url_sonido" => "https://www.soundjay.com/misc/sounds/emergency-alarm-1.wav"
        ],
        [
            "id" => "analgesico",
            "nombre" => "Analgésico",
            "descripcion" => "Para analgésicos y antiinflamatorios",
            "sonido" => "bell",
            "vibracion" => 1,
            "repetir_alarma" => 1,
            "intervalo_repeticion" => 5,
            "archivo_sonido" => "bell.mp3",
            "url_sonido" => "https://www.soundjay.com/misc/sounds/bell-ringing-01.wav"
        ],
        [
            "id" => "vitaminas",
            "nombre" => "Vitaminas",
            "descripcion" => "Para vitaminas y suplementos",
            "sonido" => "chime",
            "vibracion" => 1,
            "repetir_alarma" => 0,
            "intervalo_repeticion" => 5,
            "archivo_sonido" => "chime.mp3",
            "url_sonido" => "https://www.soundjay.com/misc/sounds/chime-2.wav"
        ],
        [
            "id" => "medicamento_noche",
            "nombre" => "Medicamento nocturno",
            "descripcion" => "Para medicamentos que se toman por la noche",
            "sonido" => "nature",
            "vibracion" => 1,
            "repetir_alarma" => 1,
            "intervalo_repeticion" => 10,
            "archivo_sonido" => "nature.mp3",
            "url_sonido" => "https://www.soundjay.com/misc/sounds/birds-1.wav"
        ],
        [
            "id" => "medicamento_silencioso",
            "nombre" => "Medicamento silencioso",
            "descripcion" => "Solo vibración, sin sonido",
            "sonido" => "vibrate_only",
            "vibracion" => 2,
            "repetir_alarma" => 1,
            "intervalo_repeticion" => 5,
            "archivo_sonido" => null,
            "url_sonido" => null
        ]
    ];
    
    echo json_encode([
        "success" => true,
        "sonidos_predefinidos" => $sonidos_predefinidos,
        "sonidos_sistema" => $sonidos_sistema,
        "vibraciones" => $vibraciones,
        "intervalos_repeticion" => $intervalos_repeticion,
        "configuraciones_predefinidas" => $configuraciones_predefinidas,
        "configuracion_predeterminada" => [
            "sonido" => "default",
            "vibracion" => 1,
            "repetir_alarma" => 1,
            "intervalo_repeticion" => 5
        ],
        "categorias" => [
            "sistema" => "Sonidos del sistema",
            "diario" => "Medicamentos diarios",
            "urgente" => "Medicamentos críticos",
            "clasico" => "Sonidos clásicos",
            "musical" => "Sonidos musicales",
            "moderno" => "Sonidos modernos",
            "relajante" => "Sonidos relajantes",
            "silencioso" => "Solo vibración"
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "debug_info" => [
            "php_version" => PHP_VERSION,
            "timestamp" => date('Y-m-d H:i:s')
        ]
    ]);
}

$conn->close();
?> 