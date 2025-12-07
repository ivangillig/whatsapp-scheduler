const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { saveContacts, clearContacts } = require("./database");

const AUTH_PATH = process.env.AUTH_PATH || path.join(__dirname, "../data/auth");

let sock = null;
let io = null;
let connectionStatus = {
  connected: false,
  qr: null,
  user: null,
};

function getWhatsAppStatus() {
  return connectionStatus;
}

function getSock() {
  return sock;
}

async function initWhatsApp(socketIo) {
  io = socketIo;
  await connectWhatsApp();
}

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["WhatsApp Scheduler", "Chrome", "1.0.0"],
    syncFullHistory: false,
  });

  // Guardar credenciales cuando se actualicen
  sock.ev.on("creds.update", saveCreds);

  // Manejar actualizaciones de conexión
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Generar QR como data URL para mostrar en frontend
      const qrDataUrl = await QRCode.toDataURL(qr);
      connectionStatus.qr = qrDataUrl;
      connectionStatus.connected = false;
      io?.emit("whatsapp-qr", qrDataUrl);
      console.log("📱 Escanea el código QR");
    }

    if (connection === "close") {
      connectionStatus.connected = false;
      connectionStatus.qr = null;
      io?.emit("whatsapp-status", connectionStatus);

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("🔄 Reconectando...");
        setTimeout(connectWhatsApp, 5000);
      } else {
        console.log("❌ Sesión cerrada. Necesitas escanear el QR nuevamente.");
      }
    }

    if (connection === "open") {
      connectionStatus.connected = true;
      connectionStatus.qr = null;
      connectionStatus.user = sock.user;
      io?.emit("whatsapp-status", connectionStatus);
      console.log("✅ WhatsApp conectado:", sock.user?.name || sock.user?.id);
    }
  });

  // Sincronizar contactos desde el historial de mensajes
  sock.ev.on("messaging-history.set", ({ contacts, chats }) => {
    console.log(
      `📋 Historial recibido: ${contacts?.length || 0} contactos, ${
        chats?.length || 0
      } chats`
    );

    if (contacts && contacts.length > 0) {
      const contactList = contacts.map((c) => ({
        jid: c.id,
        name: c.name || c.notify || c.id?.split("@")[0],
        notify: c.notify,
        imgUrl: null,
      }));
      saveContacts(contactList);
      io?.emit("contacts-updated", contactList.length);
    }

    // También extraer contactos de los chats
    if (chats && chats.length > 0) {
      const chatContacts = chats
        .filter((chat) => chat.id?.endsWith("@s.whatsapp.net"))
        .map((chat) => ({
          jid: chat.id,
          name: chat.name || chat.id?.split("@")[0],
          notify: chat.name,
          imgUrl: null,
        }));

      if (chatContacts.length > 0) {
        console.log(
          `📋 Extrayendo ${chatContacts.length} contactos de chats...`
        );
        saveContacts(chatContacts);
        io?.emit("contacts-updated", chatContacts.length);
      }
    }
  });

  // Sincronizar contactos
  sock.ev.on("contacts.set", ({ contacts }) => {
    console.log(
      `📋 Sincronizando ${
        Object.keys(contacts).length
      } contactos (contacts.set)...`
    );

    const contactList = Object.values(contacts).map((c) => ({
      jid: c.id,
      name: c.name || c.notify || c.id.split("@")[0],
      notify: c.notify,
      imgUrl: null,
    }));

    saveContacts(contactList);
    io?.emit("contacts-updated", contactList.length);
  });

  // Actualización de contactos individuales
  sock.ev.on("contacts.update", (updates) => {
    console.log(`📋 Actualizando ${updates.length} contactos...`);
    const contactList = updates.map((c) => ({
      jid: c.id,
      name: c.name || c.notify,
      notify: c.notify,
      imgUrl: null,
    }));
    saveContacts(contactList);
    io?.emit("contacts-updated", contactList.length);
  });

  // Extraer contactos de chats recibidos
  sock.ev.on("chats.set", ({ chats }) => {
    console.log(`📋 Chats recibidos: ${chats?.length || 0}`);

    if (chats && chats.length > 0) {
      const chatContacts = chats
        .filter((chat) => chat.id?.endsWith("@s.whatsapp.net"))
        .map((chat) => ({
          jid: chat.id,
          name: chat.name || chat.id?.split("@")[0],
          notify: chat.name,
          imgUrl: null,
        }));

      if (chatContacts.length > 0) {
        console.log(
          `📋 Extrayendo ${chatContacts.length} contactos de chats.set...`
        );
        saveContacts(chatContacts);
        io?.emit("contacts-updated", chatContacts.length);
      }
    }
  });

  return sock;
}

async function sendMessage(jid, message) {
  if (!sock || !connectionStatus.connected) {
    throw new Error("WhatsApp no está conectado");
  }

  await sock.sendMessage(jid, { text: message });
  console.log(`📤 Mensaje enviado a ${jid}`);
}

async function logout() {
  if (sock) {
    try {
      await sock.logout();
    } catch (error) {
      console.log("Error al cerrar sesión:", error.message);
    }

    // Limpiar archivos de autenticación
    try {
      if (fs.existsSync(AUTH_PATH)) {
        const files = fs.readdirSync(AUTH_PATH);
        for (const file of files) {
          fs.unlinkSync(path.join(AUTH_PATH, file));
        }
        console.log("🗑️ Archivos de autenticación eliminados");
      }
    } catch (error) {
      console.log("Error al limpiar auth:", error.message);
    }

    connectionStatus = {
      connected: false,
      qr: null,
      user: null,
    };
    clearContacts();
    io?.emit("whatsapp-status", connectionStatus);

    // Reconectar para generar nuevo QR
    console.log("🔄 Generando nuevo código QR...");
    setTimeout(connectWhatsApp, 1000);
  }
}

module.exports = {
  initWhatsApp,
  getWhatsAppStatus,
  getSock,
  sendMessage,
  logout,
};
