// Simple API services for the CRM example

// Autenticación ficticia
export const authService = {
  login: async ({ username, password }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'admin' && password === '123456') {
          resolve({ success: true });
        } else {
          reject(new Error('Credenciales inválidas'));
        }
      }, 500);
    });
  },
  logout: async () => new Promise(r => setTimeout(r, 300)),
};

// Servicios de pipeline y contactos
export const pipelineService = {
  getStages: async () => {
    const res = await fetch('http://localhost:3001/api/stages');
    return res.json();
  },
  createStage: async (name) => {
    const res = await fetch('http://localhost:3001/api/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
  updateStage: async (id, payload) => {
    const res = await fetch(`http://localhost:3001/api/stages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  deleteStage: async (id) => {
    const res = await fetch(`http://localhost:3001/api/stages/${id}`, { method: 'DELETE' });
    return res.json();
  },
  getContacts: async () => {
    const res = await fetch('http://localhost:3001/api/pipeline-contacts');
    return res.json();
  },
  updateContact: async (id, payload) => {
    const res = await fetch(`http://localhost:3001/api/pipeline-contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  createContact: async (payload) => {
    const res = await fetch('http://localhost:3001/api/pipeline-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

export const messagesService = {
  getMessages: async (contactId) => {
    const res = await fetch(`http://localhost:3001/api/messages/${contactId}`);
    return res.json();
  },
  sendMessage: async ({ contactId, content }) => {
    const res = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, content }),
    });
    return res.json();
  },
};

// Estadísticas de ejemplo
export const statsService = {
  getDashboardStats: async () => {
    return {
      totalContacts: 0,
      messagesSent: 0,
      deliveryRate: 0,
      scheduledMessages: 0,
    };
  },
};
