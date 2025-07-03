// services/api.js
// Servicio de autenticación simulado
const authService = {
  login: async ({ username, password }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'admin' && password === '123456') {
          resolve({ success: true, message: 'Inicio de sesión exitoso' });
        } else {
          reject({ success: false, message: 'Credenciales inválidas' });
        }
      }, 1000);
    });
  },
  logout: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, message: 'Sesión cerrada' });
      }, 500);
    });
  },
};

// Servicio de contactos real usando el backend de WhatsApp
const contactsService = {
  getContacts: async () => {
    // Llama al backend para obtener los contactos reales de WhatsApp
    const res = await fetch('http://localhost:3001/api/wa-contacts');
    if (!res.ok) throw new Error('No se pudieron obtener los contactos');
    return await res.json();
  },
  importContacts: async (file) => {
    return new Promise(resolve => {
      setTimeout(() => {
        // Simular procesamiento de archivo
        console.log('Simulando importación de archivo:', file.name);
        resolve({ success: true, imported: 100, duplicates: 10, failed: 0 });
      }, 2000);
    });
  },
};

// Servicio de mensajes simulado
const messagesService = {
  sendMessage: async ({ content, channel, recipients }) => {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Simulando envío de mensaje por ${channel}:`, { content, recipients });
        resolve({ success: true, sent: 100, failed: 0 });
      }, 1500);
    });
  },
};

// Servicio de estadísticas simulado
const statsService = {
  getDashboardStats: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          totalContacts: 1234,
          messagesSent: 5678,
          deliveryRate: 94.2,
          scheduledMessages: 23,
          monthlyGrowth: {
            contacts: 5,
            messages: 10,
            deliveryRate: 0.5
          }
        });
      }, 1000);
    });
  },
  getHistoryStats: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          totalSent: 15000,
          delivered: 14500,
          failed: 500,
          whatsappSent: 10000,
          emailSent: 5000,
          recentSends: [
            { id: 1, campaign: 'Oferta Black Friday', date: '2024-11-29', channel: 'email', status: 'delivered', sent: 5000, delivered: 4900, failed: 100 },
            { id: 2, campaign: 'Lanzamiento Nuevo Producto', date: '2025-01-10', channel: 'whatsapp', status: 'delivered', sent: 3000, delivered: 2950, failed: 50 },
            { id: 3, campaign: 'Encuesta de Satisfacción', date: '2025-02-01', channel: 'email', status: 'delivered', sent: 2000, delivered: 1980, failed: 20 },
            { id: 4, campaign: 'Promoción Verano', date: '2025-03-05', channel: 'whatsapp', status: 'failed', sent: 1000, delivered: 800, failed: 200 },
          ]
        });
      }, 1000);
    });
  },
};

// Servicio de configuración simulado
const configService = {
  getConfig: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          whatsappToken: 'simulated_whatsapp_token',
          whatsappPhoneId: '1234567890',
          smtpHost: 'smtp.simulated.com',
          smtpPort: 587,
          smtpUser: 'user@simulated.com',
          smtpPass: 'simulated_pass'
        });
      }, 500);
    });
  },
  updateConfig: async (newConfig) => {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Simulando actualización de configuración:', newConfig);
        resolve({ success: true, message: 'Configuración guardada exitosamente.' });
      }, 1000);
    });
  },
  checkWhatsappStatus: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ connected: true, phoneNumber: '+1234567890' });
      }, 500);
    });
  },
  checkEmailStatus: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ connected: true });
      }, 500);
    });
  },
};

// Servicio real para enviar WhatsApp usando el backend
export async function sendWhatsAppMessage({ to, message }) {
  const res = await fetch('http://localhost:3001/api/send-wa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error enviando mensaje');
  return data;
}

export { authService, contactsService, messagesService, statsService, configService };


