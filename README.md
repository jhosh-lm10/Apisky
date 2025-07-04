# CRM Visual

Proyecto base para un CRM sencillo con pipeline tipo kanban y panel de chat integrado.

## Requisitos

- Node.js y npm instalados.

## Puesta en marcha

### Backend

```bash
cd Backend
npm install
node index.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Estructura

- **Backend**: servidor Express con endpoints para pipeline, contactos y mensajes.
- **frontend**: aplicación React + Vite que muestra el tablero del pipeline y un chat lateral.
