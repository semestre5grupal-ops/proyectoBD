const jwt = require('jsonwebtoken');

/**
 * Mapa de id_rol numérico → nombre de rol string.
 * Sincronizado con la tabla 'roles' de Supabase (api-talento-humano):
 *   id_rol 8  → JEFE_INVENTARIO
 *   id_rol 9  → AUXILIAR_INVENTARIO
 *   id_rol 10 → OPERATIVO_INVENTARIO
 */
const MAPA_ROLES = {
  8:  'JEFE_INVENTARIO',
  9:  'AUXILIAR_INVENTARIO',
  10: 'OPERATIVO_INVENTARIO',
};

const resolverRol = (idRol) => MAPA_ROLES[Number(idRol)] ?? null;

/**
 * Middleware: verifica la firma del JWT y expone req.usuarioAutenticado.
 * Inyecta rol_nombre resolviendo id_rol → string para que restringirA() funcione.
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Acceso denegado. No se proporcionó un token de autenticación válido."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ── DIAGNÓSTICO TEMPORAL ─────────────────────────────────────────────
        // Imprime el payload completo para confirmar los campos exactos del JWT.
        // REMOVER este log antes de la entrega final en producción.
        console.log("=== [authMiddleware] TOKEN DECODIFICADO ===");
        console.log(JSON.stringify(decoded, null, 2));
        console.log("===========================================");

        // Resolver rol_nombre desde id_rol numérico, o usar el rol si ya viene como string
        if (decoded.rol && typeof decoded.rol === 'string') {
            decoded.rol_nombre = decoded.rol;
        } else {
            // Number() asegura el cast correcto si JWT trae el id como string
            decoded.rol_nombre = resolverRol(decoded.id_rol);
        }

        console.log(`[authMiddleware] id_rol=${decoded.id_rol} / rol=${decoded.rol} → rol_nombre='${decoded.rol_nombre}'`);

        req.usuarioAutenticado = decoded;
        next();
    } catch (error) {
        console.error("[authMiddleware] Error al verificar token:", error.message);
        return res.status(403).json({
            success: false,
            error: "Token inválido, expirado o alterado. Autenticación fallida."
        });
    }
};

/**
 * Middleware RBAC: verifica que el rol del usuario esté en la lista de permitidos.
 *
 * Acepta la verificación si:
 *   A) rol_nombre string coincide (ej. 'JEFE_INVENTARIO') — flujo normal
 *   B) id_rol numérico coincide directamente — fallback defensivo por si
 *      resolverRol() no mapeó correctamente y el check A falla
 */
const restringirA = (...rolesPermitidos) => {
    // Construir también el set de id_rol numéricos equivalentes a los roles permitidos
    const idsPermitidos = Object.entries(MAPA_ROLES)
        .filter(([, nombre]) => rolesPermitidos.includes(nombre))
        .map(([id]) => Number(id));

    return (req, res, next) => {
        const { rol_nombre, id_rol } = req.usuarioAutenticado ?? {};

        // Check A: por nombre de rol string (flujo normal)
        const pasaCheck_A = rol_nombre && rolesPermitidos.includes(rol_nombre);
        // Check B: por id_rol numérico (fallback defensivo)
        const pasaCheck_B = id_rol != null && idsPermitidos.includes(Number(id_rol));

        console.log(`[authMiddleware] restringirA → id_rol=${id_rol}, rol_nombre='${rol_nombre}' | ` +
                    `requerido=[${rolesPermitidos}] | checkA=${pasaCheck_A}, checkB=${pasaCheck_B}`);

        if (!pasaCheck_A && !pasaCheck_B) {
            return res.status(403).json({
                success: false,
                error: `Permisos insuficientes. Rol '${rol_nombre ?? id_rol ?? 'desconocido'}' ` +
                       `no está autorizado. Se requiere uno de: ${rolesPermitidos.join(', ')}.`
            });
        }
        next();
    };
};

module.exports = {
    verificarToken,
    restringirA
};