# WhatsApp Scheduler 📱⏰

Aplicación para programar mensajes de WhatsApp usando [Baileys](https://github.com/WhiskeySockets/Baileys).

## Características

- ✅ Conectar WhatsApp escaneando código QR
- ✅ Sincronización automática de contactos
- ✅ Programar mensajes para fecha y hora específica
- ✅ Ver historial de mensajes (pendientes, enviados, fallidos)
- ✅ Interfaz web simple y responsive
- ✅ Preparado para Docker / Raspberry Pi

## Estructura del Proyecto

```
whatsapp-scheduler/
├── backend/                 # API Node.js + Baileys
│   ├── src/
│   │   ├── index.js        # Servidor Express + Socket.IO
│   │   ├── database.js     # SQLite con better-sqlite3
│   │   ├── whatsapp.js     # Integración con Baileys
│   │   ├── scheduler.js    # Cron job para enviar mensajes
│   │   └── routes.js       # API REST
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── WhatsAppStatus.jsx
│   │   │   ├── ScheduleMessage.jsx
│   │   │   └── MessageList.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Para desarrollo/producción
└── docker-compose.rpi.yml  # Optimizado para Raspberry Pi
```

## Desarrollo Local

### Requisitos
- Node.js 18+
- npm o yarn

### Backend

```bash
cd backend
npm install
npm run dev
```

El backend estará en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará en `http://localhost:5173`

## Despliegue con Docker

### En tu PC (desarrollo)

```bash
docker-compose up --build
```

Accede a `http://localhost`

### En Raspberry Pi

1. Copia el proyecto a tu Raspberry:
```bash
scp -r whatsapp-scheduler/ pi@raspberrypi.local:~/
```

2. En la Raspberry:
```bash
cd ~/whatsapp-scheduler

# Edita docker-compose.rpi.yml y cambia 'raspberrypi.local' 
# por la IP de tu Raspberry si es necesario

docker-compose -f docker-compose.rpi.yml up --build -d
```

3. Accede desde tu navegador: `http://raspberrypi.local` o `http://<IP_RASPBERRY>`

## Uso

1. **Conectar WhatsApp**: Al abrir la app, verás un código QR. Escanéalo con WhatsApp (Ajustes → Dispositivos vinculados → Vincular dispositivo)

2. **Esperar sincronización**: Los contactos se sincronizarán automáticamente

3. **Programar mensaje**: 
   - Selecciona un contacto
   - Elige fecha y hora
   - Escribe el mensaje
   - Click en "Programar Mensaje"

4. **Ver mensajes**: En la pestaña "Mensajes" puedes ver el estado de todos los mensajes programados

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/whatsapp/status` | Estado de conexión de WhatsApp |
| POST | `/api/whatsapp/logout` | Cerrar sesión de WhatsApp |
| GET | `/api/contacts` | Lista de contactos |
| GET | `/api/messages` | Mensajes programados |
| POST | `/api/messages` | Crear mensaje programado |
| DELETE | `/api/messages/:id` | Eliminar mensaje |

## Notas Importantes

⚠️ **WhatsApp puede banear cuentas** que envíen muchos mensajes automatizados. Usa esta herramienta con responsabilidad y para uso personal.

⚠️ La sesión de WhatsApp se mantiene en el volumen Docker `whatsapp-data`. Si eliminas el volumen, tendrás que escanear el QR nuevamente.

## Tecnologías

- **Backend**: Node.js, Express, Socket.IO, Baileys, better-sqlite3, node-cron
- **Frontend**: React, Vite, TailwindCSS
- **Despliegue**: Docker, Docker Compose, Nginx

## Licencia

MIT
