const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando prueba de build...');

// Verificar que todos los archivos necesarios existen
const requiredFiles = [
  'electron/main.js',
  'electron/preload.js', 
  'Backend/index.js',
  'Backend/package.json',
  'frontend/package.json',
  'assets/icon.png'
];

console.log('📋 Verificando archivos requeridos...');
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo faltante: ${file}`);
    process.exit(1);
  }
  console.log(`✅ ${file}`);
}

// Verificar dependencias principales
console.log('📦 Verificando dependencias principales...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const requiredDeps = ['electron', 'electron-builder', 'concurrently'];
  
  for (const dep of requiredDeps) {
    if (!packageJson.devDependencies[dep]) {
      console.error(`❌ Dependencia faltante: ${dep}`);
      process.exit(1);
    }
    console.log(`✅ ${dep}`);
  }
} catch (error) {
  console.error('❌ Error leyendo package.json:', error.message);
  process.exit(1);
}

// Verificar que las carpetas de dist del frontend existen o se pueden crear
console.log('📁 Verificando estructura de directorios...');
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (!fs.existsSync(frontendDist)) {
  console.log('⚠️  Frontend no compilado. Esto es normal si es la primera vez.');
}

// Verificar que el backend tiene sus dependencias
const backendNodeModules = path.join(__dirname, '..', 'Backend', 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
  console.log('⚠️  Dependencias del backend no instaladas. Se instalarán automáticamente.');
}

console.log('✅ Verificación completada. El proyecto está listo para compilar.');
console.log('\n📖 Comandos disponibles:');
console.log('  npm run build:exe      - Crear ejecutable (sin instalador)');
console.log('  npm run build:installer - Crear instalador completo');
console.log('  npm run build:portable - Crear versión portable');
console.log('  npm run build:all      - Crear todas las versiones');
console.log('\n🚀 Para empezar, ejecuta: npm run build:installer');
