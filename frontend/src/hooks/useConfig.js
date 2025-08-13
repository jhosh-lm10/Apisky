import { useState, useEffect, useCallback, useRef } from 'react';
import { configService } from '../services/api';

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState({ 
    connected: false, 
    loading: true, // Iniciar como loading para evitar parpadeo
    phoneNumber: null 
  });
  const lastCheckRef = useRef(0);
  const isCheckingRef = useRef(false);

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

  const checkWhatsappStatus = useCallback(async () => {
    const now = Date.now();
    
    // Evitar múltiples verificaciones simultáneas
    if (isCheckingRef.current) return;
    
    // Solo verificar si han pasado al menos 10 segundos desde la última verificación
    if (now - lastCheckRef.current < 10000) return;
    
    isCheckingRef.current = true;
    lastCheckRef.current = now;
    
    try {
      const status = await configService.checkWhatsappStatus();
      const newStatus = { ...status, loading: false };
      
      // Solo actualizar si el estado realmente cambió
      setWhatsappStatus(prev => {
        if (prev.connected === newStatus.connected && 
            prev.phoneNumber === newStatus.phoneNumber) {
          return prev; // No cambiar si es el mismo estado
        }
        return newStatus;
      });
      
      // Cachear el estado exitoso
      localStorage.setItem('whatsapp_status', JSON.stringify(newStatus));
    } catch (err) {
      const errorStatus = { connected: false, loading: false, phoneNumber: null };
      
      // Solo actualizar si el estado realmente cambió
      setWhatsappStatus(prev => {
        if (prev.connected === false && prev.loading === false) {
          return prev; // No cambiar si ya está en estado de error
        }
        return errorStatus;
      });
      
      // Cachear el estado de error también
      localStorage.setItem('whatsapp_status', JSON.stringify(errorStatus));
      setError('Error al verificar estado de WhatsApp');
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // Verificar estado de WhatsApp al montar y luego cada 15 segundos
  useEffect(() => {
    // Cachear estado previo para evitar parpadeos
    const cachedStatus = localStorage.getItem('whatsapp_status');
    if (cachedStatus) {
      try {
        const parsed = JSON.parse(cachedStatus);
        setWhatsappStatus(prev => ({ ...prev, ...parsed, loading: true }));
      } catch (e) {
        // Si el cache está corrupto, ignorar
      }
    }
    
    checkWhatsappStatus();
    const interval = setInterval(checkWhatsappStatus, 15000); // Cambiado a 15 segundos
    return () => clearInterval(interval);
  }, [checkWhatsappStatus]);

  return { config, loading, error, updateConfig, whatsappStatus, checkWhatsappStatus };
}


