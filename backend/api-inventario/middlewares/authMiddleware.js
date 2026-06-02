const jwt = require('jsonwebtoken');

/**
 * Middleware para autenticar el token JWT y proteger los endpoints de inventario.
 * Verifica la firma digital del token usando la clave secreta compartida.
 */
const verificarToken = (req, res, next) => {
    // 1. Extraer el encabezado de autorización
    const authHeader = req.headers['authorization'];

    // El token viene en formato: "Bearer eyJhbG..."
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Acceso denegado. No se proporcionó un token de autenticación válido."
        });
    }

    try {
        // 2. Verificar el token con la clave secreta declarada en tus variables de entorno
        // Recuerda que process.env.JWT_SECRET debe ser idéntica a la de Alejandro
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Inyectar los datos del usuario autenticado en la petición (request)
        req.usuarioAutenticado = decoded;

        // Continuar al controlador de inventario de forma segura
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: "Token inválido, expirado o alterado. Autenticación fallida."
        });
    }
};

/**
 * Middleware de autorización basado en Roles (RBAC)
 * Permite restringir acciones específicas en el backend
 */
const restringirA = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuarioAutenticado || !rolesPermitidos.includes(req.usuarioAutenticado.rol)) {
            return res.status(403).json({
                success: false,
                error: "Permisos insuficientes. Tu rol no está autorizado para ejecutar esta acción de inventario."
            });
        }
        next();
    };
};

module.exports = {
    verificarToken,
    restringirA
};