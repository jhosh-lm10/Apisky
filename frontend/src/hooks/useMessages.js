import { useEffect, useState } from 'react';
import { messagesService } from '../services/api';

export function useMessages() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const sendMessage = async (messageData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await messagesService.sendMessage(messageData);
      return result;
    } catch (err) {
      setError(err.message || 'Error al enviar mensaje');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Poll historial
  useEffect(() => {
    let timer = null;
    const fetchHistory = async () => {
      try {
        const h = await messagesService.getHistory();
        setHistory(h);
      } catch {}
    };
    fetchHistory();
    timer = setInterval(fetchHistory, 2000);
    return () => { if (timer) clearInterval(timer); };
  }, []);

  return { sendMessage, loading, error, history };
}

export function useWhatsApp() {
  // Implementación futura para funcionalidades específicas de WhatsApp
  return {};
}


