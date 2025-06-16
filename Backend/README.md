# Apisky Backend

Este backend está construido con Node.js y Express. Provee endpoints para:
- Enviar mensajes de WhatsApp (ejemplo con UltraMsg)
- Enviar emails (usando nodemailer)
- Guardar y obtener configuración de integración

## Instalación

1. Instala las dependencias:
   ```sh
   npm install
   ```
2. Crea un archivo `.env` con tus credenciales (ver ejemplo más abajo).
3. Inicia el servidor:
   ```sh
   node index.js
   ```

## Endpoints principales
- `POST /api/send-whatsapp` — Enviar mensaje de WhatsApp
- `POST /api/send-email` — Enviar email
- `GET /api/config` y `POST /api/config` — Obtener/guardar configuración

## Ejemplo de archivo `.env`
```
ULTRAMSG_TOKEN=tu_token_ultramsg
ULTRAMSG_INSTANCE=tu_instance_ultramsg
SMTP_HOST=smtp.tuemail.com
SMTP_PORT=587
SMTP_USER=usuario@tuemail.com
SMTP_PASS=tu_password
```

## Notas
- Personaliza los endpoints según tus necesidades.
- Este backend es solo un punto de partida.
