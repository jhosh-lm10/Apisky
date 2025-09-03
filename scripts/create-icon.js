const fs = require('fs');
const path = require('path');

async function createIcon() {
  try {
    console.log('🎨 Verificando icono...');
    
    const pngPath = path.join(__dirname, '..', 'assets', 'icon.png');
    
    if (!fs.existsSync(pngPath)) {
      console.warn('⚠️  No se encontró el archivo icon.png, continuando sin icono personalizado...');
      return;
    }
    
    console.log('✅ Icono PNG encontrado');
  } catch (error) {
    console.warn('⚠️  Error verificando icono (continuando):', error.message);
  }
}

createIcon();
