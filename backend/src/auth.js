const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Configuración - usa variables de entorno en producción
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "whatsapp-scheduler-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Usuario único - DEBE configurarse vía variables de entorno
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USER || !ADMIN_PASSWORD) {
  console.error(
    "❌ ERROR: ADMIN_USER y ADMIN_PASSWORD deben estar configuradas en las variables de entorno"
  );
}

// Debug: mostrar configuración al iniciar
console.log("🔐 Auth config:", {
  ADMIN_USER,
  ADMIN_PASSWORD,
  PASSWORD_FROM_ENV: !!process.env.ADMIN_PASSWORD,
});

/**
 * Verifica las credenciales del usuario
 */
function verifyCredentials(username, password) {
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    console.error("❌ Credenciales no configuradas");
    return false;
  }
  console.log("🔑 Login attempt:", {
    inputUser: username,
    expectedUser: ADMIN_USER,
    userMatch: username === ADMIN_USER,
    inputPass: password,
    expectedPass: ADMIN_PASSWORD,
    passMatch: password === ADMIN_PASSWORD,
  });
  if (username !== ADMIN_USER) {
    return false;
  }
  return password === ADMIN_PASSWORD;
}

/**
 * Genera un token JWT
 */
function generateToken(username) {
  return jwt.sign({ username, iat: Date.now() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verifica un token JWT
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware de autenticación para rutas protegidas
 */
function authMiddleware(req, res, next) {
  // Obtener token de cookie o header Authorization
  const token =
    req.cookies?.auth_token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No autorizado", needsAuth: true });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res
      .status(401)
      .json({ error: "Token inválido o expirado", needsAuth: true });
  }

  req.user = decoded;
  next();
}

/**
 * Genera un hash de contraseña (útil para generar el ADMIN_PASSWORD_HASH)
 */
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

module.exports = {
  verifyCredentials,
  generateToken,
  verifyToken,
  authMiddleware,
  hashPassword,
  JWT_SECRET,
};
