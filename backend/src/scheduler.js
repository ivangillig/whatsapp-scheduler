const cron = require("node-cron");
const { getPendingMessages, updateMessageStatus } = require("./database");
const { sendMessage, getWhatsAppStatus } = require("./whatsapp");

let schedulerTask = null;
let socketIO = null;

function initScheduler(io) {
  socketIO = io;

  // Revisar mensajes pendientes cada minuto
  schedulerTask = cron.schedule("* * * * *", async () => {
    await processPendingMessages();
  });

  console.log("⏰ Scheduler iniciado - revisando mensajes cada minuto");
}

async function processPendingMessages() {
  const status = getWhatsAppStatus();

  if (!status.connected) {
    console.log("⚠️ WhatsApp no conectado, saltando procesamiento");
    return;
  }

  const pendingMessages = getPendingMessages();

  if (pendingMessages.length === 0) {
    return;
  }

  console.log(`📨 Procesando ${pendingMessages.length} mensajes pendientes...`);

  for (const msg of pendingMessages) {
    try {
      await sendMessage(msg.contact_jid, msg.message);
      updateMessageStatus(msg.id, "sent");
      console.log(`✅ Mensaje ${msg.id} enviado a ${msg.contact_name}`);

      // Notificar al frontend
      if (socketIO) {
        socketIO.emit("message-updated", { id: msg.id, status: "sent" });
      }
    } catch (error) {
      console.error(`❌ Error enviando mensaje ${msg.id}:`, error.message);
      updateMessageStatus(msg.id, "failed", error.message);

      // Notificar al frontend
      if (socketIO) {
        socketIO.emit("message-updated", {
          id: msg.id,
          status: "failed",
          error: error.message,
        });
      }
    }

    // Pequeña pausa entre mensajes para evitar spam
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

function stopScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    console.log("⏹️ Scheduler detenido");
  }
}

module.exports = {
  initScheduler,
  stopScheduler,
  processPendingMessages,
};
