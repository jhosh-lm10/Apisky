require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

let qrCodeString = null;
let isReady = false;

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend WhatsApp escuchando en puerto ${PORT}`);
});
