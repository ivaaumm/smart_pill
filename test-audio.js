const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const soundsDir = path.join(__dirname, 'assets/sounds');
const soundFiles = ['default.mp3', 'alarm.mp3', 'tone.mp3'];

console.log('=== Verificando archivos de sonido ===');
console.log(`Directorio: ${soundsDir}\n`);

soundFiles.forEach(file => {
  const filePath = path.join(soundsDir, file);
  
  try {
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo no encontrado: ${file}`);
      return;
    }
    
    // Obtener información del archivo
    const stats = fs.statSync(filePath);
    const fileSize = (stats.size / 1024).toFixed(2);
    
    // Verificar el tipo de archivo
    const fileType = execSync(`file "${filePath}"`).toString().trim();
    
    // Intentar obtener duración del audio (requiere ffprobe)
    let duration = 'Desconocida';
    try {
      const ffprobeOutput = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
      duration = parseFloat(ffprobeOutput).toFixed(2) + ' segundos';
    } catch (e) {
      console.warn(`  ⚠️ No se pudo obtener la duración (¿ffprobe instalado?): ${e.message}`);
    }
    
    console.log(`✅ ${file}:`);
    console.log(`   - Tamaño: ${fileSize} KB`);
    console.log(`   - Tipo: ${fileType}`);
    console.log(`   - Duración: ${duration}`);
    console.log('');
    
  } catch (error) {
    console.error(`❌ Error al verificar ${file}:`, error.message);
  }
});

console.log('=== Prueba completada ===');
