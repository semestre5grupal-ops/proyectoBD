const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Acceso denegado. Token no proporcionado o inválido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secreto_para_desarrollo_local_123');
    req.usuario = decoded; // { id_usuario, id_rol, usu_nombre }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token expirado o inválido.' });
  }
};

module.exports = authMiddleware;
