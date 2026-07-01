// middlewares/auth.js
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_dev';
  // Extraer el token del header Authorization, soportando el formato: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido en el header Authorization' });
  }

  const token = authHeader.split(' ')[1]; // Si viene como "Bearer token123"
  if (!token) {
    return res.status(401).json({ error: 'Token malformado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = decoded; // Se guarda el payload decodificado
    next();
  });
}

module.exports = verificarToken;
