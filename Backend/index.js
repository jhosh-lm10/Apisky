require('dotenv').config();
const express = require('express');
const cors = require('cors');

let Client, LocalAuth, qrcode;
if (process.env.NODE_ENV !== 'test') {
  ({ Client, LocalAuth } = require('whatsapp-web.js'));
  qrcode = require('qrcode-terminal');
}

const app = express();
app.use(cors());
app.use(express.json());
const { getData, saveData } = require('./db');

// Leer ruta de Chrome desde variable de entorno con valor por defecto
const chromePath = process.env.CHROME_PATH ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe';

// Inicializar cliente WhatsApp o stubs en entorno de pruebas
let client;
let qrCodeString = null;
let isReady = false;

if (process.env.NODE_ENV !== 'test') {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox'],
      executablePath: chromePath // cambia mediante CHROME_PATH si es necesario
    }
  });

  client.on('qr', (qr) => {
    qrCodeString = qr;
    qrcode.generate(qr, { small: true });
    console.log('Escanea este QR con WhatsApp para iniciar sesión');
  });

  client.on('ready', () => {
    isReady = true;
    console.log('WhatsApp Web conectado y listo!');
  });

  client.on('auth_failure', () => {
    isReady = false;
    console.log('Fallo de autenticación, reinicia el cliente.');
  });

  client.on('disconnected', () => {
    isReady = false;
    console.log('Cliente desconectado, esperando nuevo QR...');
  });

  client.initialize();
} else {
  client = {
    sendMessage: async () => true,
    getContacts: async () => [
      {
        pushname: 'Test',
        name: 'Test',
        number: '12345',
        id: { _serialized: '12345@c.us' },
        isUser: true,
      },
    ],
  };
  isReady = true;
  qrCodeString = 'TEST_QR';
}

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

// Endpoint para obtener contactos de WhatsApp
app.get('/api/wa-contacts', async (req, res) => {
  try {
    const contacts = await client.getContacts();
    const filtered = contacts
      .filter(c => c.isUser && c.number)
      .map(c => ({
        name: c.pushname || c.name || c.number,
        number: c.number,
        id: c.id._serialized,
      }));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener los contactos de WhatsApp.' });
  }
});

// ---------- Pipeline CRUD Endpoints ----------
app.get('/api/stages', (req, res) => {
  const data = getData();
  res.json(data.stages.sort((a, b) => a.position - b.position));
});

app.post('/api/stages', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const data = getData();
  const id = Date.now();
  const position = data.stages.length + 1;
  data.stages.push({ id, name, position });
  saveData(data);
  res.json({ id, name, position });
});

app.put('/api/stages/:id', (req, res) => {
  const { id } = req.params;
  const { name, position } = req.body;
  const data = getData();
  const stage = data.stages.find(s => s.id == id);
  if (!stage) return res.status(404).json({ error: 'not found' });
  if (name !== undefined) stage.name = name;
  if (position !== undefined) stage.position = position;
  saveData(data);
  res.json(stage);
});

app.delete('/api/stages/:id', (req, res) => {
  const { id } = req.params;
  const data = getData();
  const idx = data.stages.findIndex(s => s.id == id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  data.stages.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// Contacts CRUD (for pipeline)
app.get('/api/pipeline-contacts', (req, res) => {
  const data = getData();
  res.json(data.contacts);
});

app.post('/api/pipeline-contacts', (req, res) => {
  const { name, project, amount, stageId } = req.body;
  const data = getData();
  const id = Date.now();
  data.contacts.push({ id, name, project, amount, stageId });
  saveData(data);
  res.json({ id, name, project, amount, stageId });
});

app.put('/api/pipeline-contacts/:id', (req, res) => {
  const { id } = req.params;
  const data = getData();
  const contact = data.contacts.find(c => c.id == id);
  if (!contact) return res.status(404).json({ error: 'not found' });
  const { name, project, amount, stageId } = req.body;
  if (name !== undefined) contact.name = name;
  if (project !== undefined) contact.project = project;
  if (amount !== undefined) contact.amount = amount;
  if (stageId !== undefined) contact.stageId = stageId;
  saveData(data);
  res.json(contact);
});

app.delete('/api/pipeline-contacts/:id', (req, res) => {
  const { id } = req.params;
  const data = getData();
  const idx = data.contacts.findIndex(c => c.id == id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  data.contacts.splice(idx, 1);
  saveData(data);
  res.json({ success: true });
});

// Messages
app.get('/api/messages/:contactId', (req, res) => {
  const { contactId } = req.params;
  const data = getData();
  const msgs = data.messages.filter(m => m.contactId == contactId);
  res.json(msgs);
});

app.post('/api/messages', (req, res) => {
  const { contactId, content, direction = 'out' } = req.body;
  const data = getData();
  const id = Date.now();
  const timestamp = new Date().toISOString();
  const message = { id, contactId, content, direction, timestamp };
  data.messages.push(message);
  saveData(data);
  res.json(message);
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend WhatsApp escuchando en puerto ${PORT}`);
  });
}

module.exports = app;
