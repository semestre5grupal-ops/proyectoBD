const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Acceso denegado. No se proporcionó token.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Acceso denegado. Formato de token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secreto_para_desarrollo_local_123');
    req.usuario = decoded; // { id_usuario, id_rol, usu_nombre }
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Token inválido o expirado.' });
  }
};

// Check if user has specific role (optional helper)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.id_rol)) {
      return res.status(403).json({ success: false, error: 'No autorizado para realizar esta acción.' });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
