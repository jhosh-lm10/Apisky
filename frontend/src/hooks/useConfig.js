import { useState, useEffect } from 'react';
import { configService } from '../services/api';

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, loading: false, phoneNumber: null });
  const [emailStatus, setEmailStatus] = useState({ connected: false, loading: false });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await configService.getConfig();
        setConfig(data);
      } catch (err) {
        setError('Error al cargar configuración');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const updateConfig = async (newConfig) => {
    setLoading(true);
    setError(null);
    try {
      const result = await configService.updateConfig(newConfig);
      setConfig(newConfig); // Actualizar el estado local con la nueva configuración
      return result;
    } catch (err) {
      setError('Error al actualizar configuración');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const checkWhatsappStatus = async () => {
    setWhatsappStatus(prev => ({ ...prev, loading: true }));
    try {
      const status = await configService.checkWhatsappStatus();
      setWhatsappStatus({ ...status, loading: false });
    } catch (err) {
      setWhatsappStatus({ connected: false, loading: false, phoneNumber: null });
      setError('Error al verificar estado de WhatsApp');
    }
  };

  const checkEmailStatus = async () => {
    setEmailStatus(prev => ({ ...prev, loading: true }));
    try {
      const status = await configService.checkEmailStatus();
      setEmailStatus({ ...status, loading: false });
    } catch (err) {
      setEmailStatus({ connected: false, loading: false });
      setError('Error al verificar estado de Email');
    }
  };

  return { config, loading, error, updateConfig, whatsappStatus, emailStatus, checkWhatsappStatus, checkEmailStatus };
}


