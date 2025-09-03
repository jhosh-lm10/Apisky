const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build de producción...');

// 1. Instalar dependencias del backend si no están instaladas
console.log('📦 Verificando dependencias del backend...');
try {
  const backendNodeModules = path.join(__dirname, '..', 'Backend', 'node_modules');
  if (!fs.existsSync(backendNodeModules)) {
    console.log('📥 Instalando dependencias del backend...');
    execSync('npm install', { cwd: path.join(__dirname, '..', 'Backend'), stdio: 'inherit' });
  }
} catch (error) {
  console.error('❌ Error instalando dependencias del backend:', error.message);
  process.exit(1);
}

// 2. Instalar dependencias del frontend si no están instaladas
console.log('📦 Verificando dependencias del frontend...');
try {
  const frontendNodeModules = path.join(__dirname, '..', 'frontend', 'node_modules');
  if (!fs.existsSync(frontendNodeModules)) {
    console.log('📥 Instalando dependencias del frontend...');
    execSync('npm install', { cwd: path.join(__dirname, '..', 'frontend'), stdio: 'inherit' });
  }
} catch (error) {
  console.error('❌ Error instalando dependencias del frontend:', error.message);
  process.exit(1);
}

// 3. Compilar frontend
console.log('🎨 Compilando frontend...');
try {
  execSync('npm run build', { cwd: path.join(__dirname, '..', 'frontend'), stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error compilando frontend:', error.message);
  process.exit(1);
}

// 4. Crear icono
console.log('🎨 Creando icono...');
try {
  execSync('node scripts/create-icon.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
} catch (error) {
  console.warn('⚠️  No se pudo crear el icono .ico (continuando):', error.message);
}

// 5. Limpiar carpeta dist
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  console.log('🧹 Limpiando carpeta dist...');
  fs.rmSync(distPath, { recursive: true, force: true });
}

console.log('✅ Build de producción completado. Listo para crear ejecutable.');
