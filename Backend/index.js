require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración en memoria (puedes cambiar a base de datos si lo deseas)
let config = {
  whatsappToken: process.env.ULTRAMSG_TOKEN || '',
  whatsappInstance: process.env.ULTRAMSG_INSTANCE || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: process.env.SMTP_PORT || '',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || ''
};

// Endpoint para obtener configuración
app.get('/api/config', (req, res) => {
  res.json(config);
});

// Endpoint para actualizar configuración
app.post('/api/config', (req, res) => {
  config = { ...config, ...req.body };
  res.json({ success: true, message: 'Configuración guardada exitosamente.' });
});

// Endpoint para enviar WhatsApp (UltraMsg)
app.post('/api/send-whatsapp', async (req, res) => {
  const { to, message } = req.body;
  try {
    const url = `https://api.ultramsg.com/${config.whatsappInstance}/messages/chat`;
    const response = await axios.post(url, {
      token: config.whatsappToken,
      to,
      body: message
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Endpoint para enviar email
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
    await transporter.sendMail({
      from: config.smtpUser,
      to,
      subject,
      text
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Estado de WhatsApp
app.get('/api/whatsapp-status', (req, res) => {
  res.json({ connected: !!config.whatsappToken && !!config.whatsappInstance, phoneNumber: 'Simulado' });
});

// Estado de Email
app.get('/api/email-status', (req, res) => {
  res.json({ connected: !!config.smtpHost && !!config.smtpUser && !!config.smtpPass });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Apisky backend escuchando en puerto ${PORT}`);
});
