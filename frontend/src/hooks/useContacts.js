import { useState, useEffect } from 'react';
import { contactsService } from '../services/api';

export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await contactsService.getContacts();
        setContacts(data);
      } catch (err) {
        setError('Error al cargar contactos');
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const importContacts = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await contactsService.importContacts(file);
      // Después de importar, podrías querer refrescar la lista de contactos
      const updatedContacts = await contactsService.getContacts();
      setContacts(updatedContacts);
      return result;
    } catch (err) {
      setError('Error al importar contactos');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { contacts, loading, error, importContacts };
}


