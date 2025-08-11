import React, { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function WaQr() {
  const [qr, setQr] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQr = () => {
      fetch(`${API_BASE}/api/wa-qr`)
        .then(res => res.json())
        .then(data => {
          if (data.qr) {
            setQr(data.qr);
            setError(null);
          } else {
            setError('QR no disponible aún');
          }
        })
        .catch(() => setError('Error al obtener el QR'));
    };

    fetchQr(); // Primer intento inmediato
    const interval = setInterval(fetchQr, 10000); // Actualizar cada 10s
    return () => clearInterval(interval);
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
