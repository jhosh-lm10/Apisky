import React, { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function WaQr() {
  const [qr, setQr] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchQr = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wa-qr`);
        if (!isMounted) return;
        
        if (res.ok) {
          const data = await res.json();
          if (data.qr) {
            setQr(data.qr);
            setError(null);
          } else {
            setError('QR no disponible aún');
          }
        } else if (res.status === 404) {
          // Si el endpoint no existe, no mostrar error
          setError('QR no disponible aún');
        } else {
          setError('Error al obtener el QR');
        }
      } catch (err) {
        if (!isMounted) return;
        // Solo mostrar error si no es un error de red (backend no disponible)
        if (err.name !== 'TypeError') {
          setError('Error al obtener el QR');
        }
      }
    };

    // Retrasar el primer intento para evitar peticiones innecesarias
    const timeoutId = setTimeout(fetchQr, 500);
    const interval = setInterval(fetchQr, 10000); // Actualizar cada 10s
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-lg font-bold mb-2">Escanea el QR con WhatsApp</h2>
      {qr ? (
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=250x250`}
          alt="QR para WhatsApp"
          className="border rounded shadow"
        />
      ) : (
        <p className="text-red-500">{error || 'Cargando QR...'}</p>
      )}
    </div>
  );
}
