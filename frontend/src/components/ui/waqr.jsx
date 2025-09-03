import React, { useEffect, useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function WaQr() {
  const [imgUrl, setImgUrl] = useState(`${API_BASE}/api/wa-qr.png?ts=${Date.now()}`);
  const [error, setError] = useState(null);

  useEffect(() => {
    // refrescar la imagen cada 8s para evitar expiración del QR
    const interval = setInterval(() => {
      setImgUrl(`${API_BASE}/api/wa-qr.png?ts=${Date.now()}`);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-lg font-bold mb-2">Escanea el QR con WhatsApp</h2>
      <img
        src={imgUrl}
        alt="QR para WhatsApp"
        className="border rounded shadow"
        onError={() => setError('QR no disponible aún')}
        onLoad={() => setError(null)}
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
