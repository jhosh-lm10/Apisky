require('dotenv').config();
const path = require('path');
// Asegurar resolución de módulos cuando se ejecuta desde app.asar.unpacked
try {
  const Module = require('module');
  const extraPaths = [];
  const resourcesPath = process.resourcesPath || '';
  if (resourcesPath) {
    extraPaths.push(path.join(resourcesPath, 'app.asar', 'node_modules'));
    extraPaths.push(path.join(resourcesPath, 'app.asar.unpacked', 'node_modules'));
  }
  extraPaths.push(path.resolve(__dirname, '..', 'node_modules'));
  extraPaths.push(path.resolve(process.cwd(), 'node_modules'));
  const existing = new Set(Module.globalPaths);
  for (const p of extraPaths) {
    if (p && !existing.has(p)) Module.globalPaths.push(p);
  }
  // Refrescar NODE_PATH
  const sep = process.platform === 'win32' ? ';' : ':';
  const nodePathParts = (process.env.NODE_PATH ? process.env.NODE_PATH.split(sep) : []).concat(extraPaths);
  process.env.NODE_PATH = Array.from(new Set(nodePathParts.filter(Boolean))).join(sep);
  Module._initPaths();
} catch {}
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
let puppeteerExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH || null;
try {
  if (!puppeteerExecutablePath) {
    // Obtener la ruta del ejecutable de Chromium que descarga Puppeteer
    const puppeteer = require('puppeteer');
    if (typeof puppeteer.executablePath === 'function') {
      puppeteerExecutablePath = puppeteer.executablePath();
    }
  }
  // Si estamos empaquetados, asegurarnos de apuntar a la ruta desempaquetada
  if (puppeteerExecutablePath && puppeteerExecutablePath.includes('app.asar')) {
    puppeteerExecutablePath = puppeteerExecutablePath.replace('app.asar', 'app.asar.unpacked');
  }
} catch {}
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const qrcode = require('qrcode-terminal');

// Directorio de datos escribible (para sesiones y uploads)
// Preferir ruta en AppData/home para evitar permisos y conflictos al empaquetar
const DEFAULT_DATA_DIR = (() => {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Apisky');
  }
  return path.join(os.homedir(), '.apisky');
})();
const DATA_DIR = process.env.APISKY_DATA_DIR || DEFAULT_DATA_DIR;
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch {}

// Configuración de multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Usar un nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

// Subida específica para IMÁGENES
const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter: (req, file, cb) => {
    // Permitir variantes comunes de JPEG/PNG/WebP
    const allowedTypes = new Set([
      'image/jpeg', 'image/jpg', 'image/pjpeg',
      'image/png',
      'image/webp'
    ]);
    if (allowedTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (JPEG, PNG, WebP).'));
    }
  }
});

// Subida específica para CONTACTOS (CSV/XLS/XLSX)
const uploadContacts = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedDocs = new Set([
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]);
    if (allowedDocs.has(file.mimetype) || /\.(csv|xlsx?|CSV|XLSX?)$/.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Use CSV o XLSX.'));
    }
  }
});

// Directorio de uploads garantizado arriba

const app = express();
app.use(cors());
app.use(express.json());

// Variables globales
let client;
let qrCodeString = null;
let isReady = false;

// Ruta donde se guarda la sesión de whatsapp-web.js (LocalAuth)
const SESSION_DIR = path.join(DATA_DIR, '.wwebjs_auth');

// Normaliza números a chatId válido de WhatsApp (NNNN@c.us)
function normalizeChatId(to) {
  try {
    const raw = String(to || '').trim();
    if (!raw) return null;
    const parsed = parsePhoneNumberFromString(raw);
    if (parsed && parsed.isValid()) {
      const e164 = parsed.number.replace(/^\+/, '');
      return `${e164}@c.us`;
    }
    const withoutSuffix = raw.replace(/@c\.us$/i, '');
    const digitsOnly = withoutSuffix.replace(/[^\d]/g, '');
    if (!digitsOnly) return null;
    return `${digitsOnly}@c.us`;
  } catch {
    return null;
  }
}

// Validar si el destinatario existe en WhatsApp (compatibilidad con diferentes versiones)
async function isRecipientValid(chatId) {
  try {
    if (!client) return false;
    if (typeof client.isRegisteredUser === 'function') {
      return await client.isRegisteredUser(chatId);
    }
    if (typeof client.getNumberId === 'function') {
      const numeric = String(chatId).replace(/@c\.us$/i, '');
      const result = await client.getNumberId(numeric);
      return !!result;
    }
    // Si la API no provee verificación, asumir válido para no bloquear
    return true;
  } catch {
    return false;
  }
}

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
  
    const clientOptions = {
    authStrategy: new LocalAuth({
      dataPath: SESSION_DIR,
      clientId: 'whatsapp-client'
    }),
    puppeteer: {
        executablePath: puppeteerExecutablePath || undefined,
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
  };

    newClient = new Client(clientOptions);

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
    res.set('Cache-Control', 'no-store');
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
        const chatId = normalizeChatId(to);
        if (!chatId) {
          return res.status(400).json({ success: false, message: 'Número de destino inválido' });
        }
        await client.sendMessage(chatId, message);
        if (typeof addHistory === 'function') addHistory({ to: chatId, status: 'sent', type: 'text' });
        res.json({ success: true });
    } catch (err) {
        if (typeof addHistory === 'function') addHistory({ to: String(to), status: 'failed', error: err.message, type: 'text' });
        res.status(500).json({ success: false, message: err.message });
    }
});

// Endpoint para enviar imagen por WhatsApp
app.post('/api/send-wa-image', uploadImage.single('image'), async (req, res) => {
    const { to, caption } = req.body;
    const imageFile = req.file;

    if (!isReady) {
        return res.status(503).json({ success: false, message: 'WhatsApp no está listo. Escanea el QR primero.' });
    }

    if (!imageFile) {
        return res.status(400).json({ success: false, message: 'No se proporcionó ninguna imagen.' });
    }

    try {
        const chatId = normalizeChatId(to);
        if (!chatId) {
          if (req.file && req.file.path) {
            try { fs.unlinkSync(req.file.path); } catch {}
          }
          return res.status(400).json({ success: false, message: 'Número de destino inválido' });
        }
        // Validar que el número existe en WhatsApp
        const valid = await isRecipientValid(chatId);
        if (!valid) {
          try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch {}
          return res.status(404).json({ success: false, message: 'El número no está registrado en WhatsApp' });
        }
        
        // Leer el archivo como buffer
        const fileBuffer = fs.readFileSync(imageFile.path);
        const base64Data = fileBuffer.toString('base64');
        
        // Obtener el tipo MIME de la imagen
        const mimeType = imageFile.mimetype;
        
        // Crear el objeto MessageMedia con los datos correctos
        const media = new MessageMedia(mimeType, base64Data, imageFile.originalname);
        
        // Enviar el mensaje con la imagen
        await client.sendMessage(chatId, media, { caption });
        if (typeof addHistory === 'function') addHistory({ to: chatId, status: 'sent', type: 'image' });
        
        // Eliminar el archivo temporal después de enviarlo
        fs.unlinkSync(imageFile.path);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error al enviar la imagen:', err);
        // Asegurarse de eliminar el archivo temporal en caso de error
        if (req.file && req.file.path) {
            try { fs.unlinkSync(req.file.path); } catch {}
        }
        if (typeof addHistory === 'function') addHistory({ to: String(to), status: 'failed', error: err.message, type: 'image' });
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

    // Obtener solo los contactos guardados en la agenda
    const contacts = (await client.getContacts())
      .filter(c => c.isMyContact && c.name && !c.isGroup);
    
    console.log(`=== SE ENCONTRARON ${contacts.length} CONTACTOS EN LA AGENDA ===`);
    
    // Mostrar información de muestra de los contactos
    console.log('=== MUESTRA DE CONTACTOS (primeros 5) ===');
    contacts.slice(0, 5).forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}: ${c.id?.user}`);
    });
    console.log('======================================\n');
    
    // Filtrar y formatear contactos
    const contactMap = new Map();
    
    // Procesar los contactos filtrados
    // Ordenar por nombre y por longitud de número (más corto primero)
    contacts
      .sort((a, b) => {
        const nameCmp = (a.name || '').localeCompare(b.name || '');
        if (nameCmp !== 0) return nameCmp;
        const lenA = (a.id.user || '').length;
        const lenB = (b.id.user || '').length;
        return lenA - lenB; // número más corto primero
      })
      .forEach(c => {
        let number = (c.id.user || '').replace(/[^\d+]/g, ''); // Eliminar todo excepto dígitos y +
        
        // Verificar si el número tiene formato internacional
        const isInternational = number.startsWith('+') || number.startsWith('00');
        
        // Validación mejorada para números internacionales
        const isValidNumber = (() => {
          // Eliminar prefijos internacionales para validación
          const cleanNumber = number.replace(/^\+/, '').replace(/^00/, '');
          
          // Longitud típica de números internacionales (incluyendo código de país)
          // Mínimo 8 dígitos (países pequeños) y máximo 15 (incluyendo códigos de país largos)
          return /^\d{8,15}$/.test(cleanNumber);
        })();
        
        // Si ya existe el contacto, verificar cuál número es mejor
        if (contactMap.has(c.name)) {
          const existing = contactMap.get(c.name);

          const existingValid = /^\d{8,15}$/.test(existing.number.replace(/^\+/, '').replace(/^00/, ''));

          // Reemplazar si (1) el existente es inválido y el nuevo es válido
          //    o (2) ambos válidos, pero el nuevo es más corto
          const shouldReplace = (!existingValid && isValidNumber) ||
                               (existingValid && isValidNumber && number.length < existing.number.length);

          if (shouldReplace) {
            contactMap.set(c.name, {
              name: c.name,
              number: number,
              id: c.id._serialized,
              isInternational: isInternational,
              isImported: false
            });
            console.log(`Actualizando número para ${c.name}: ${existing.number} -> ${number}`);
          }
        } 
        // Si no existe, agregarlo si el número parece válido
        else if (isValidNumber) {
          contactMap.set(c.name, {
            name: c.name,
            number: number,
            id: c.id._serialized,
            isInternational: isInternational,
            isImported: false
          });
        } else {
          console.log(`Contacto con número potencialmente inválido omitido: ${c.name} (${number})`);
        }
      });

    // Convertir a array y formatear números
    const validContacts = Array.from(contactMap.values())
      .map(contact => {
        // Formatear número para mostrar (agregar + si es internacional)
        let displayNumber = contact.number;
        if (contact.isInternational && !contact.number.startsWith('+')) {
          displayNumber = `+${contact.number.replace(/^00/, '')}`;
        }
        
        // Obtener el segmento guardado si existe
        const segment = contactSegments[contact.id] || contactSegments[contact.number] || null;
        
        return {
          ...contact,
          number: displayNumber,
          segment: segment || undefined // Usar undefined en lugar de null para que no aparezca en el JSON
        };
      });
      
    // Unir con contactos importados (si existen) y evitar duplicados por id
    const existingIds = new Set(validContacts.map(c => c.id));
    const merged = [...validContacts];
    for (const c of (global.importedContacts || [])) {
      if (!existingIds.has(c.id)) merged.push(c);
    }
    console.log(`Se encontraron ${merged.length} contactos con números válidos (incluye importados)`);
    res.json(merged);
  } catch (err) {
    console.error('Error al obtener contactos:', err);
    res.status(500).json({ error: 'No se pudieron obtener los contactos de WhatsApp.' });
  }
});

// Objeto para almacenar los segmentos de los contactos (en producción, usa una base de datos)
const contactSegments = {};
// Almacenamiento simple de contactos importados
const CONTACTS_FILE = path.join(__dirname, 'contacts.json');
global.importedContacts = [];
function saveContacts() {
  try { fs.writeFileSync(CONTACTS_FILE, JSON.stringify(global.importedContacts, null, 2)); } catch {}
}
function loadContacts() {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      global.importedContacts = JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('No se pudo cargar contacts.json:', e.message);
    global.importedContacts = [];
  }
}
loadContacts();

// Endpoint para actualizar segmentos de contactos
app.post('/api/update-segments', express.json(), (req, res) => {
  try {
    const { segments } = req.body;
    if (!segments) {
      return res.status(400).json({ success: false, message: 'Datos de segmentos no proporcionados' });
    }
    
    // Actualizar los segmentos
    Object.assign(contactSegments, segments);
    
    // Guardar en un archivo para persistencia (en producción, usa una base de datos)
    fs.writeFileSync('contactSegments.json', JSON.stringify(contactSegments, null, 2));
    
    res.json({ success: true, message: 'Segmentos actualizados correctamente' });
  } catch (err) {
    console.error('Error al actualizar segmentos:', err);
    res.status(500).json({ success: false, message: 'Error al actualizar segmentos' });
  }
});

// Importar contactos desde CSV/XLSX: columnas requeridas: name,number
app.post('/api/contacts/import', uploadContacts.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Archivo no enviado' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    let records = [];
    if (ext === '.csv') {
      const content = fs.readFileSync(req.file.path, 'utf8');
      const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length === 0) throw new Error('Archivo vacío');
      const headerParts = lines[0].split(',').map(h => h.trim().toLowerCase());
      const isLikelyHeader = headerParts.length > 1 || ['name','number','telefono','tel','phone','mobile','celular','whatsapp'].includes(headerParts[0]);
      if (!isLikelyHeader) {
        // Caso: CSV de una sola columna solo con números, sin encabezado
        for (const line of lines) {
          records.push({ name: '', number: line.trim() });
        }
      } else {
        const findIndex = (names) => {
          for (const n of names) {
            const idx = headerParts.indexOf(n);
            if (idx !== -1) return idx;
          }
          return -1;
        };
        const nameIdx = findIndex(['name','nombre']);
        const numberIdx = findIndex(['number','telefono','tel','phone','mobile','celular','whatsapp','número','numero']);
        if (numberIdx === -1) {
          // Fallback: tratar el primer campo como número
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            records.push({ name: (nameIdx !== -1 ? (cols[nameIdx] || '').trim() : ''), number: (cols[0] || '').trim() });
          }
        } else {
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            records.push({ name: (nameIdx !== -1 ? (cols[nameIdx] || '').trim() : ''), number: (cols[numberIdx] || '').trim() });
          }
        }
      }
    } else if (ext === '.xlsx' || ext === '.xls') {
      const XLSX = require('xlsx');
      const wb = XLSX.readFile(req.file.path);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      let json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (json.length > 0) {
        records = json.map(r => {
          // Buscar claves probables para número
          const number = String(r.number || r.Number || r.NUMERO || r.telefono || r.Telefono || r.TELEFONO || r.tel || r.Tel || r.TEL || r.phone || r.Phone || r.PHONE || r.mobile || r.Mobile || r.MOBILE || '').trim();
          const name = String(r.name || r.Name || r.NOMBRE || r.nombre || '').trim();
          return { name, number };
        });
        // Si no encontramos números, intentar modo por filas (header:1)
        if (records.every(rec => !rec.number)) {
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          for (const row of rows) {
            if (!row || row.length === 0) continue;
            const first = String(row[0] || '').trim();
            if (first) records.push({ name: '', number: first });
          }
        }
      } else {
        // Fallback si json vacío: usar modo filas
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        for (const row of rows) {
          if (!row || row.length === 0) continue;
          const first = String(row[0] || '').trim();
          if (first) records.push({ name: '', number: first });
        }
      }
    } else {
      throw new Error('Formato no soportado. Use CSV o XLSX');
    }

    let imported = 0, duplicates = 0, failed = 0;
    const existingKey = new Set((global.importedContacts || []).map(c => (c.id || '').replace(/@c\.us$/, '')));
    for (const rec of records) {
      const chatId = normalizeChatId(rec.number);
      if (!chatId) { failed++; continue; }
      const idBare = chatId.replace(/@c\.us$/, '');
      if (existingKey.has(idBare)) { duplicates++; continue; }
      (global.importedContacts || []).push({
        id: chatId,
        name: rec.name || idBare,
        number: `+${idBare}`,
        segment: undefined,
        isImported: true
      });
      existingKey.add(idBare);
      imported++;
    }
    saveContacts();
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.json({ success: true, imported, duplicates, failed });
  } catch (e) {
    console.error('Error importando CSV:', e);
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch {}
    return res.status(500).json({ success: false, message: 'Error importando contactos' });
  }
});

// Exportar contactos importados actuales
app.get('/api/contacts/export', async (req, res) => {
  try {
    const rows = [['name','number','segment']];
    for (const c of (global.importedContacts || [])) {
      rows.push([c.name || '', c.number || '', c.segment || '']);
    }
    const csvContent = rows.map(r => r.map(x => String(x).replace(/,/g, ' ')).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send(csvContent);
  } catch (e) {
    console.error('Error exportando CSV:', e);
    res.status(500).send('Error exportando');
  }
});

// Historial básico de envíos
const sendHistory = [];
function addHistory(entry) {
  sendHistory.push({ id: Date.now() + Math.random(), timestamp: new Date().toISOString(), ...entry });
  if (sendHistory.length > 1000) sendHistory.shift();
}
app.get('/api/messages/history', (req, res) => {
  res.json(sendHistory);
});

// Eliminar contacto importado por id o número
app.delete('/api/contacts/:id', (req, res) => {
  try {
    const idOrNumber = req.params.id;
    const before = (global.importedContacts || []).length;
    global.importedContacts = (global.importedContacts || []).filter(c => c.id !== idOrNumber && c.number !== idOrNumber);
    saveContacts();
    const after = (global.importedContacts || []).length;
    res.json({ success: true, removed: before - after });
  } catch (e) {
    console.error('Error eliminando contacto:', e);
    res.status(500).json({ success: false });
  }
});

// Cola simple con delay configurable y soporte de media
let isQueueRunning = false;
const queue = [];
async function runQueue() {
  if (isQueueRunning) return;
  isQueueRunning = true;
  while (queue.length > 0) {
    const job = queue.shift();
    const { chatId, text, media, caption, delayMs } = job;
    try {
      if (media) {
        await client.sendMessage(chatId, media, { caption });
      } else {
        await client.sendMessage(chatId, text);
      }
      addHistory({ to: chatId, status: 'sent', type: media ? 'image' : 'text' });
    } catch (e) {
      addHistory({ to: chatId, status: 'failed', error: e.message });
    }
    if (delayMs && delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  isQueueRunning = false;
}

// Endpoint de envío masivo con delay configurable (texto)
app.post('/api/send-bulk', express.json(), async (req, res) => {
  try {
    const { recipients, message, delaySeconds } = req.body;
    if (!isReady) return res.status(503).json({ success: false, message: 'WhatsApp no está listo' });
    if (!Array.isArray(recipients) || recipients.length === 0) return res.status(400).json({ success: false, message: 'Sin destinatarios' });
    const minDelayMs = 300; // pequeño retraso para robustez
    const delayMs = Math.max(minDelayMs, Number(delaySeconds || 0) * 1000);
    let enqueued = 0;
    const invalid = [];
    for (const r of recipients) {
      const chatId = normalizeChatId(r);
      if (!chatId) { invalid.push(r); continue; }
      const valid = await isRecipientValid(chatId);
      if (!valid) { invalid.push(r); continue; }
      queue.push({ chatId, text: message || '', delayMs });
      enqueued++;
    }
    runQueue();
    res.json({ success: true, enqueued, invalid, invalidCount: invalid.length });
  } catch (e) {
    console.error('Error en envío masivo:', e);
    res.status(500).json({ success: false, message: 'Error en envío masivo' });
  }
});

// Envío masivo de imágenes con delay configurable: multipart/form-data con fields: recipients(JSON array), caption, image
app.post('/api/send-bulk-image', uploadImage.single('image'), async (req, res) => {
  try {
    if (!isReady) return res.status(503).json({ success: false, message: 'WhatsApp no está listo' });
    const { recipients: recipientsStr, caption, delaySeconds } = req.body;
    const imageFile = req.file;
    if (!imageFile) return res.status(400).json({ success: false, message: 'Imagen requerida' });
    let recipients;
    try { recipients = JSON.parse(recipientsStr || '[]'); } catch { recipients = []; }
    if (!Array.isArray(recipients) || recipients.length === 0) return res.status(400).json({ success: false, message: 'Sin destinatarios' });

    const buffer = fs.readFileSync(imageFile.path);
    const base64 = buffer.toString('base64');
    const media = new MessageMedia(imageFile.mimetype, base64, imageFile.originalname);
    const minDelayMs = 300;
    const delayMs = Math.max(minDelayMs, Number(delaySeconds || 0) * 1000);
    let enqueued = 0;
    const invalid = [];
    for (const r of recipients) {
      const chatId = normalizeChatId(r);
      if (!chatId) { invalid.push(r); continue; }
      const valid = await isRecipientValid(chatId);
      if (!valid) { invalid.push(r); continue; }
      queue.push({ chatId, media, caption, delayMs });
      enqueued++;
    }
    runQueue();
    try { fs.unlinkSync(imageFile.path); } catch {}
    res.json({ success: true, enqueued, invalid, invalidCount: invalid.length });
  } catch (e) {
    console.error('Error en envío masivo de imagen:', e);
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ success: false, message: 'Error en envío masivo de imagen' });
  }
});

// Cargar segmentos guardados al iniciar el servidor
if (fs.existsSync('contactSegments.json')) {
  try {
    const data = fs.readFileSync('contactSegments.json', 'utf8');
    Object.assign(contactSegments, JSON.parse(data));
    console.log('Segmentos de contactos cargados correctamente');
  } catch (err) {
    console.error('Error al cargar segmentos de contactos:', err);
  }
}

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// Ruta para servir el frontend en cualquier ruta que NO empiece con /api (debe ir al final)
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
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
