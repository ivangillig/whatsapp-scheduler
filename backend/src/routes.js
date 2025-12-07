const express = require("express");
const router = express.Router();
const {
  createScheduledMessage,
  getScheduledMessages,
  deleteScheduledMessage,
  getContacts,
  saveContacts,
  deleteContact,
} = require("./database");
const { getWhatsAppStatus, logout } = require("./whatsapp");

// Obtener estado de WhatsApp
router.get("/whatsapp/status", (req, res) => {
  res.json(getWhatsAppStatus());
});

// Cerrar sesión de WhatsApp
router.post("/whatsapp/logout", async (req, res) => {
  try {
    await logout();
    res.json({ success: true, message: "Sesión cerrada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener contactos
router.get("/contacts", (req, res) => {
  try {
    const contacts = getContacts();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar contacto manualmente
router.post("/contacts", (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "El teléfono es requerido" });
    }

    // Normalizar el número de teléfono
    let normalizedPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }
    // Remover el + para el JID
    const phoneNumber = normalizedPhone.replace("+", "");
    const jid = `${phoneNumber}@s.whatsapp.net`;

    const contact = {
      jid,
      name: name || phoneNumber,
      notify: name,
      imgUrl: null,
    };

    saveContacts([contact]);
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar contacto
router.delete("/contacts/:jid", (req, res) => {
  try {
    const { jid } = req.params;
    deleteContact(decodeURIComponent(jid));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mensajes programados
router.get("/messages", (req, res) => {
  try {
    const { status } = req.query;
    const messages = getScheduledMessages(status);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear mensaje programado
router.post("/messages", (req, res) => {
  try {
    const { contactJid, contactName, message, scheduledAt } = req.body;

    if (!contactJid || !message || !scheduledAt) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const id = createScheduledMessage({
      contactJid,
      contactName,
      message,
      scheduledAt,
    });

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar mensaje programado
router.delete("/messages/:id", (req, res) => {
  try {
    const { id } = req.params;
    deleteScheduledMessage(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
