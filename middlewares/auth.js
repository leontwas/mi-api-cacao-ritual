const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_dev';
  
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido en el header Authorization' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token malformado' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = decoded; // decoded contiene { id, email, rol }
    next();
  });
}

function soloAdmin(req, res, next) {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
}

module.exports = {
  verificarToken,
  soloAdmin
};
