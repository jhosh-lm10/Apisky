# CRM Backend

Servidor básico construido con Node.js y Express para gestionar la información del pipeline de ventas. Toda la información se almacena en `data.json` a modo de ejemplo.

## Instalación

```bash
npm install
```

## Ejecución

```bash
node index.js
```

## Endpoints

- `GET /api/stages` – Lista las etapas ordenadas
- `POST /api/stages` – Crea una nueva etapa
- `PUT /api/stages/:id` – Actualiza una etapa
- `DELETE /api/stages/:id` – Elimina una etapa
- `GET /api/pipeline-contacts` – Obtiene los contactos
- `POST /api/pipeline-contacts` – Crea un contacto
- `PUT /api/pipeline-contacts/:id` – Actualiza un contacto
- `DELETE /api/pipeline-contacts/:id` – Elimina un contacto
- `GET /api/messages/:contactId` – Lista los mensajes de un contacto
- `POST /api/messages` – Envía un mensaje
