const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function createZip() {
  try {
    console.log('📦 Creando archivo ZIP para distribución...');
    
    const projectRoot = path.join(__dirname, '..');
    const distDir = path.join(projectRoot, 'dist');
    const exeDir = path.join(distDir, 'Apisky-Executable');
    const zipPath = path.join(distDir, 'Apisky-Portable.zip');
    
    // Verificar que existe el directorio del ejecutable
    if (!await fs.pathExists(exeDir)) {
      console.error('❌ Error: No se encontró el directorio del ejecutable. Ejecuta primero: npm run build:exe');
      process.exit(1);
    }
    
    // Eliminar ZIP anterior si existe
    if (await fs.pathExists(zipPath)) {
      await fs.remove(zipPath);
    }
    
    // Usar PowerShell para crear el ZIP
    const powershellCommand = `powershell -command "Compress-Archive -Path '${exeDir}\\*' -DestinationPath '${zipPath}' -Force"`;
    
    console.log('🔄 Comprimiendo archivos...');
    execSync(powershellCommand, { stdio: 'inherit' });
    
    // Obtener tamaño del archivo
    const stats = await fs.stat(zipPath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log('✅ Archivo ZIP creado exitosamente!');
    console.log(`📁 Ubicación: ${zipPath}`);
    console.log(`📊 Tamaño: ${sizeInMB} MB`);
    console.log('');
    console.log('🎯 Instrucciones para distribución:');
    console.log('1. Envía el archivo "Apisky-Portable.zip"');
    console.log('2. El usuario debe extraer el ZIP');
    console.log('3. Ejecutar "Instalar-Dependencias.bat" (primera vez)');
    console.log('4. Ejecutar "Iniciar-Apisky.bat" para usar');
    console.log('');
    console.log('📋 Contenido del ZIP:');
    console.log('- Backend/ (servidor Node.js)');
    console.log('- frontend/dist/ (interfaz web)');
    console.log('- Instalar-Dependencias.bat');
    console.log('- Iniciar-Apisky.bat');
    console.log('- README.txt');
    
  } catch (error) {
    console.error('❌ Error creando el ZIP:', error);
    process.exit(1);
  }
}

createZip();
