const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const { initDatabase } = require("./database");
const { initWhatsApp, getWhatsAppStatus } = require("./whatsapp");
const { initScheduler } = require("./scheduler");
const apiRoutes = require("./routes");
const {
  authMiddleware,
  verifyCredentials,
  generateToken,
  verifyToken,
} = require("./auth");

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Socket.IO para comunicación en tiempo real (QR, estado, etc.)
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Hacer io accesible en las rutas
app.set("io", io);

// ===== RUTAS DE AUTENTICACIÓN (públicas) =====
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }

  if (!verifyCredentials(username, password)) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = generateToken(username);

  // Enviar token en response (el frontend lo guarda en localStorage)
  res.json({ success: true, username, token });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ success: true });
});

app.get("/api/auth/check", (req, res) => {
  const token =
    req.cookies?.auth_token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.json({ authenticated: false });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.clearCookie("auth_token");
    return res.json({ authenticated: false });
  }

  res.json({ authenticated: true, username: decoded.username });
});

// ===== RUTAS PROTEGIDAS =====
app.use("/api", authMiddleware, apiRoutes);

// Health check (público)
app.get("/health", (req, res) => {
  res.json({ status: "ok", whatsapp: getWhatsAppStatus() });
});

// Socket.IO connections - verificar auth
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.cookie?.split("auth_token=")[1]?.split(";")[0];

  if (!token) {
    return next(new Error("Autenticación requerida"));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error("Token inválido"));
  }

  socket.user = decoded;
  next();
});

io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);

  // Enviar estado actual de WhatsApp
  socket.emit("whatsapp-status", getWhatsAppStatus());

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Inicializar base de datos
    await initDatabase();
    console.log("✅ Base de datos inicializada");

    // Inicializar WhatsApp
    await initWhatsApp(io);
    console.log("✅ WhatsApp inicializado");

    // Inicializar scheduler (pasamos io para notificaciones)
    initScheduler(io);
    console.log("✅ Scheduler inicializado");

    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar:", error);
    process.exit(1);
  }
}

start();
