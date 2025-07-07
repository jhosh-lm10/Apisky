require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Configuración de multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    // Usar un nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (JPEG, PNG, WebP).'));
    }
  }
});

// Asegurarse de que el directorio de uploads exista
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const app = express();
app.use(cors());
app.use(express.json());

// Variables globales
let client;
let qrCodeString = null;
let isReady = false;

// Ruta donde se guarda la sesión de whatsapp-web.js (LocalAuth)
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth');

// Función para forzar el reinicio de la sesión de WhatsApp
async function forzarReinicioSesion() {
  console.log('🔁  Forzando reinicio de sesión...');
  
  // 1. Destruir el cliente actual si existe
  if (client) {
    try {
      await client.destroy();
      console.log('Cliente de WhatsApp cerrado.');
      // Esperar un momento para que se liberen los recursos
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      console.warn('No se pudo cerrar el cliente limpiamente:', e.message);
    }
  }
  
  // 2. Limpiar la sesión
  const limpiezaExitosa = await limpiarSesion(3, 1000);
  
  // 3. Reiniciar
  if (limpiezaExitosa) {
    console.log('Reiniciando cliente WhatsApp...');
    initializeWhatsApp();
    return { success: true, message: 'Sesión reiniciada. Escanea el nuevo QR.' };
  } else {
    return { success: false, message: 'No se pudo limpiar la sesión. Intenta reiniciar el servidor.' };
  }
}

// Función utilitaria para limpiar la sesión con reintentos en caso de archivos bloqueados (EBUSY)
async function limpiarSesion(retries = 5, delayMs = 1000) {
  // Si la carpeta no existe, nada que hacer
  if (!fs.existsSync(SESSION_DIR)) return true;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await fs.promises.rm(SESSION_DIR, { recursive: true, force: true });
      console.log('⚠️  Sesión de WhatsApp eliminada. Se requerirá volver a escanear el QR.');
      return true;
    } catch (err) {
      if (err.code === 'EBUSY' && attempt < retries) {
        console.warn(`Intento ${attempt}/${retries}: el directorio de sesión está bloqueado. Reintentando en ${delayMs}ms...`);
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }
      console.error('Error eliminando la sesión:', err);
      return false;
    }
  }
  return false;
}

// Inicializar cliente WhatsApp
const initializeWhatsApp = () => {
  console.log('Inicializando WhatsApp...');

  // Si existe un cliente anterior, destruirlo para liberar locks
  if (client) {
    try {
      client.destroy();
    } catch (e) {
      console.warn('No se pudo destruir cliente anterior:', e.message);
    }
  }

  let newClient;
  try {
  console.log('Inicializando WhatsApp...');
  
    newClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: SESSION_DIR,
      clientId: 'whatsapp-client'
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

    // Asignar el cliente sólo si se creó sin errores
    client = newClient;

    client.on('qr', (qr) => {
    qrCodeString = qr;
    qrcode.generate(qr, { small: true });
    console.log('Escanea este QR con WhatsApp para iniciar sesión');
  });

  client.on('ready', () => {
    isReady = true;
    console.log('WhatsApp Web conectado y listo!');
  });

  client.on('disconnected', async (reason) => {
    isReady = false;
    console.log('Cliente desconectado:', reason);
    // Limpiar sesión y volver a inicializar después de 5 segundos
    await limpiarSesion();
    setTimeout(initializeWhatsApp, 5000);
  });

  // Manejar cambios de estado
  client.on('change_state', async (state) => {
    console.log('Estado de conexión cambiado a:', state);
    if (['CONFLICT', 'UNPAIRED', 'UNPAIRED_IDLE'].includes(state)) {
      console.log('Sesión cerrada desde el dispositivo. Reiniciando...');
      await limpiarSesion();
      // No salir del proceso, mejor reiniciar
      setTimeout(initializeWhatsApp, 1000);
    }
  });

    client.on('auth_failure', async (msg) => {
    console.error('Error de autenticación:', msg);
    await limpiarSesion();
    console.log('Sesión inválida eliminada. Reiniciando...');
    setTimeout(initializeWhatsApp, 5000);
  });

  // Inicializar con manejo de errores
    client.initialize().catch(err => {
    console.error('Error al inicializar WhatsApp:', err);
    // Reintentar después de 5 segundos
    setTimeout(initializeWhatsApp, 5000);
  });
  } catch (err) {
    // Manejar errores de creación del cliente, por ejemplo EBUSY en Windows
    console.error('Error creando cliente WhatsApp:', err);

    if (err.message && err.message.includes('EBUSY')) {
      console.log('El directorio de sesión está bloqueado. Intentando limpiar y reintentar...');
      limpiarSesion().then(() => {
        setTimeout(initializeWhatsApp, 2000);
      });
    } else {
      // Reintentar genérico
      setTimeout(initializeWhatsApp, 5000);
    }
  }
};

// Iniciar WhatsApp
initializeWhatsApp();

// Endpoint para obtener el QR
app.get('/api/wa-qr', (req, res) => {
    if (qrCodeString) {
        res.json({ qr: qrCodeString });
    } else {
        res.status(404).json({ error: 'QR no disponible aún' });
    }
});

// Endpoint para ver estado
app.get('/api/wa-status', (req, res) => {
    res.json({ ready: isReady });
});

// Endpoint para enviar mensaje
app.post('/api/send-wa', async (req, res) => {
    const { to, message } = req.body;
    if (!isReady) {
        return res.status(503).json({ success: false, message: 'WhatsApp no está listo. Escanea el QR primero.' });
    }
    try {
        // El número debe ser en formato internacional, ej: 549XXXXXXXXXX@c.us
        const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
        await client.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Endpoint para enviar imagen por WhatsApp
app.post('/api/send-wa-image', upload.single('image'), async (req, res) => {
    const { to, caption } = req.body;
    const imageFile = req.file;

    if (!isReady) {
        return res.status(503).json({ success: false, message: 'WhatsApp no está listo. Escanea el QR primero.' });
    }

    if (!imageFile) {
        return res.status(400).json({ success: false, message: 'No se proporcionó ninguna imagen.' });
    }

    try {
        const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
        
        // Leer el archivo como buffer
        const fileBuffer = fs.readFileSync(imageFile.path);
        const base64Data = fileBuffer.toString('base64');
        
        // Obtener el tipo MIME de la imagen
        const mimeType = imageFile.mimetype;
        
        // Crear el objeto MessageMedia con los datos correctos
        const media = new MessageMedia(mimeType, base64Data, imageFile.originalname);
        
        // Enviar el mensaje con la imagen
        await client.sendMessage(chatId, media, { caption });
        
        // Eliminar el archivo temporal después de enviarlo
        fs.unlinkSync(imageFile.path);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error al enviar la imagen:', err);
        // Asegurarse de eliminar el archivo temporal en caso de error
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: 'Error al enviar la imagen: ' + err.message });
    }
});

// Endpoint para cerrar sesión manualmente
app.post('/api/wa-logout', async (req, res) => {
  try {
    // 1. Cerrar la sesión de WhatsApp
    if (client) {
      await client.logout();
      await client.destroy();
      client = null;
      isReady = false;
    }
    
    // 2. Limpiar la sesión
    await limpiarSesion();
    
    // 3. Reiniciar el cliente
    initializeWhatsApp();
    
    res.json({ 
      success: true, 
      message: 'Sesión cerrada correctamente. Escanea el nuevo QR para continuar.' 
    });
  } catch (err) {
    console.error('Error en wa-logout:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cerrar sesión: ' + (err.message || 'Error desconocido')
    });
  }
});

// Endpoint para forzar reinicio de sesión
app.post('/api/forzar-reinicio', async (req, res) => {
  try {
    const resultado = await forzarReinicioSesion();
    res.json(resultado);
  } catch (error) {
    console.error('Error en forzar-reinicio:', error);
    res.status(500).json({ success: false, message: 'Error al forzar el reinicio' });
  }
});

// Endpoint para obtener contactos de WhatsApp
app.get('/api/wa-contacts', async (req, res) => {
  try {
    if (!isReady) {
      // Si WhatsApp aún no está listo, devolver 503 para que el frontend reintente
      return res.status(503).json({ error: 'WhatsApp no está listo aún' });
    }

    const contacts = await client.getContacts();

    const filtered = contacts
      // Excluir grupos y el propio usuario
      .filter(c => !c.isGroup)
      .map(c => ({
        name: c.pushname || c.name || c.id.user,
        number: c.id.user,
        id: c.id._serialized,
      }));

    res.json(filtered);
  } catch (err) {
    console.error('Error al obtener contactos:', err);
    res.status(500).json({ error: 'No se pudieron obtener los contactos de WhatsApp.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend WhatsApp escuchando en puerto ${PORT}`);
    console.log(`Abre http://localhost:${PORT} en tu navegador`);
});

// Manejar cierre de proceso
process.on('SIGINT', async () => {
  console.log('\nCerrando servidor...');
  try {
    if (client) {
      await client.destroy();
    }
    process.exit(0);
  } catch (err) {
    console.error('Error al cerrar el cliente:', err);
    process.exit(1);
  }
});
