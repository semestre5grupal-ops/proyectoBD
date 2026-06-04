const InventarioModel = require('../models/inventarioModel');
const NotificacionesModel = require('../models/notificacionesModel');
const axios = require('axios');

// ENDPOINT: Descontar Stock (Gabriel - Ventas)
exports.descontarStock = async (req, res) => {
    try {
        const { idVariante, cantidad } = req.body;

        if (!idVariante || !cantidad || cantidad <= 0) {
            return res.status(400).json({ success: false, error: "Parámetros inválidos." });
        }

        const inventario = await InventarioModel.obtenerStockVariante(idVariante);
        if (!inventario) {
            return res.status(404).json({ success: false, error: "No existe el registro de inventario." });
        }

        if (inventario.inv_saldo_final < cantidad) {
            return res.status(400).json({ success: false, error: "Stock insuficiente en bodega." });
        }

        const nuevoSaldoFinal = inventario.inv_saldo_final - cantidad;
        const nuevaQtyEgresos = (inventario.inv_qty_egresos || 0) + cantidad;

        await InventarioModel.actualizarStock(
            inventario.id_bodega,
            idVariante,
            inventario.inv_periodo,
            nuevoSaldoFinal,
            nuevaQtyEgresos
        );

        return res.status(200).json({
            success: true,
            message: "Stock de inventario descontado con éxito del flujo de bodegas.",
            stock_restante: nuevoSaldoFinal
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ENDPOINT: Ingresar Stock por Compra (Liz - Compras)
exports.ingresarStock = async (req, res) => {
    try {
        const { idVariante, cantidad, idBodega, descripcion, usuario } = req.body;

        if (!idVariante || !cantidad || cantidad <= 0 || !idBodega || !usuario) {
            return res.status(400).json({
                success: false,
                error: "Parámetros inválidos. Campos requeridos completos."
            });
        }

        const inventario = await InventarioModel.obtenerStockVariante(idVariante);
        if (!inventario) {
            return res.status(404).json({ success: false, error: "No existe parametrización de inventario." });
        }

        const nuevoSaldoFinal = inventario.inv_saldo_final + cantidad;
        const nuevaQtyIngresos = (inventario.inv_qty_ingresos || 0) + cantidad;

        await InventarioModel.actualizarStockIngreso(
            idBodega,
            idVariante,
            inventario.inv_periodo,
            nuevoSaldoFinal,
            nuevaQtyIngresos
        );

        await InventarioModel.registrarRecepcion(idBodega, descripcion || "Ingreso por compras", cantidad, usuario);

        return res.status(200).json({
            success: true,
            message: "Mercadería ingresada al inventario y recepción registrada con éxito.",
            stock_actual: nuevoSaldoFinal
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ENDPOINT: Consultar disponibilidad (Gabriel - Ventas)
exports.consultarStock = async (req, res) => {
    try {
        const { idVariante } = req.params;
        const inventario = await InventarioModel.obtenerStockVariante(idVariante);
        if (!inventario) {
            return res.status(404).json({ success: false, error: "Variante sin inventario asignado." });
        }
        return res.status(200).json({
            success: true,
            id_bodega: inventario.id_bodega,
            stock_disponible: inventario.inv_saldo_final
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ENDPOINT: Sincronizar Catálogo hacia la Nube (Firebase NoSQL)
exports.sincronizarCloud = async (req, res) => {
    try {
        console.log("🔄 Iniciando sincronización masiva con Firebase...");

        // 1. Obtener la data estructurada desde Supabase
        const catalogo = await InventarioModel.obtenerCatalogoParaEcommerce();

        // 2. Enviar la data usando la API REST de Firebase (.json es obligatorio en Firebase)
        const firebaseUri = `${process.env.FIREBASE_DB_URL}/catalogo_ecommerce.json`;

        await axios.put(firebaseUri, catalogo);

        return res.status(200).json({
            success: true,
            message: "Ecosistema híbrido sincronizado. Catálogo en la nube Firebase actualizado con éxito.",
            items_sincronizados: catalogo.length
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Error en la sincronización híbrida: " + error.message
        });
    }
};

/**
 * PUT /api/inventario/ajustes/:id/aprobar
 * Llama al Stored Procedure para aprobar el ajuste y mover inventario físicamente.
 */
exports.aprobarAjuste = async (req, res) => {
    try {
        const idCabecera = req.params.id;
        const { idBodega, idVariante, cantidad } = req.body;
        
        if (!idCabecera || !idVariante || cantidad == null) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos obligatorios (idCabecera, idVariante, cantidad).'
            });
        }

        const usuario = req.usuarioAutenticado?.usu_nombre ?? req.usuarioAutenticado?.nombre ?? 'Sistema';

        await InventarioModel.aprobarAjusteFisico(
            idCabecera,
            idBodega || 1,
            idVariante,
            cantidad,
            usuario
        );

        return res.status(200).json({
            success: true,
            message: `Ajuste (Cabecera: ${idCabecera}) procesado en base de datos transaccional con éxito.`
        });
    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [aprobarAjuste]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al aprobar ajuste de stock.'
        });
    }
};

/**
 * POST /api/inventario/ajustes/pendiente
 * Crea la cabecera del ajuste con estado PEN y devuelve su ID (UUID).
 * Tras el INSERT exitoso, dispara automáticamente la alerta para el Jefe
 * en la tabla 'notificaciones_tareas' (fire-and-forget con try-catch aislado).
 */
exports.crearCabeceraPendiente = async (req, res) => {
    try {
        const { idBodega, idVariante, cantidad, descripcion, motivo } = req.body;

        if (!idVariante || cantidad == null) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos obligatorios (idVariante, cantidad).'
            });
        }

        const usuario = req.usuarioAutenticado?.usu_nombre ?? req.usuarioAutenticado?.nombre ?? 'Christian Auxiliar';
        const bodega   = idBodega || 1;
        const motivo_  = motivo || descripcion || 'Ajuste/Recepción vía Agente de Voz';

        const idCabecera = await InventarioModel.crearCabeceraAjustePendiente(
            bodega,
            idVariante,
            cantidad,
            usuario,
            motivo_
        );

        // ──────────────────────────────────────────────────────────────────────
        // NOTIFICACIÓN AUTOMÁTICA PARA EL JEFE — fire-and-forget
        // El catch aislado garantiza que un fallo en la alerta NUNCA
        // bloquea ni revierte la respuesta HTTP exitosa del ajuste.
        // ──────────────────────────────────────────────────────────────────────
        const mensajeNotificacion = `Se ha registrado un nuevo ajuste de inventario pendiente de aprobación para la cabecera #${idCabecera}.`;

        NotificacionesModel.crearNotificacion({
            accion:              'AUTORIZAR_AJUSTE',
            respuestaIa:         mensajeNotificacion,
            instruccionOriginal: mensajeNotificacion,
            usuarioOrigen:       usuario,
            rolOrigen:           'AUXILIAR_INVENTARIO',
            rolDestino:          'JEFE_INVENTARIO',
            payload: {
                idCabecera,
                idBodega:          bodega,
                idVariante:        Number(idVariante),
                cantidad:          Number(cantidad),
                cantidadEsperada:  Number(cantidad),
            },
        }).then(() => {
            console.log(`✅ [crearCabeceraPendiente] Alerta para JEFE_INVENTARIO creada → cabecera #${idCabecera}`);
        }).catch((err) => {
            // Error no crítico: se registra en logs pero no interrumpe el flujo
            console.warn(`⚠️  [crearCabeceraPendiente] No se pudo crear la notificación para el Jefe:`, err.message);
        });

        return res.status(201).json({
            success: true,
            message: 'Cabecera pendiente creada con éxito.',
            id: idCabecera
        });
    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [crearCabeceraPendiente]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al crear cabecera pendiente.'
        });
    }
};

/**
 * PUT /api/inventario/recepciones/:id/aprobar
 * Aprueba una recepción y mueve el inventario físicamente mediante RPC.
 */
exports.aprobarRecepcion = async (req, res) => {
    try {
        const idCabecera = parseInt(req.params.id, 10);
        const cantidad_real = req.body.cantidad ?? req.body.cantidadReal;

        if (!idCabecera || cantidad_real == null) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos obligatorios (idCabecera, cantidad / cantidadReal).'
            });
        }

        const id_bodega = req.body.idBodega ?? 1;
        const id_variante = req.body.idVariante ?? 1;
        const periodo = "2026-06";
        const usuario = req.usuarioAutenticado?.usu_nombre ?? req.usuarioAutenticado?.nombre ?? 'Sistema';

        await InventarioModel.aprobarRecepcionFisica(
            idCabecera,
            id_bodega,
            id_variante,
            cantidad_real,
            usuario,
            periodo
        );

        InventarioModel.registrarLogAuditoria(req.usuario?.usu_nombre, 'APROBAR_FISICO', 'recepciones', idCabecera);

        return res.status(200).json({
            success: true,
            message: `Recepción (Cabecera: ${idCabecera}) aprobada y stock actualizado con éxito.`
        });
    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [aprobarRecepcion]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al aprobar recepción.'
        });
    }
};

/**
 * PUT /api/inventario/entregas/:id/aprobar
 * Aprueba una entrega y descuenta el inventario físicamente mediante RPC.
 */
exports.aprobarEntrega = async (req, res) => {
    try {
        const idCabecera = parseInt(req.params.id, 10);
        const cantidad_real = req.body.cantidad ?? req.body.cantidadReal;

        if (!idCabecera || cantidad_real == null) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos obligatorios (idCabecera, cantidad / cantidadReal).'
            });
        }

        const id_bodega = req.body.idBodega ?? 1;
        const id_variante = req.body.idVariante ?? 1;
        const periodo = "2026-06";
        const usuario = req.usuarioAutenticado?.usu_nombre ?? req.usuarioAutenticado?.nombre ?? 'Sistema';

        await InventarioModel.aprobarEntregaFisica(
            idCabecera,
            id_bodega,
            id_variante,
            cantidad_real,
            usuario,
            periodo
        );

        InventarioModel.registrarLogAuditoria(req.usuario?.usu_nombre, 'APROBAR_FISICO', 'entregas', idCabecera);

        return res.status(200).json({
            success: true,
            message: `Entrega (Cabecera: ${idCabecera}) aprobada y stock descontado con éxito.`
        });
    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [aprobarEntrega]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al aprobar entrega.'
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRACIÓN COMPRAS (Liz)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/inventario/recepciones
 *
 * Registra una orden de compra recibida por Compras (Liz):
 *   A. Inserta cabecera en 'recepciones' (rec_estado = 'PEN').
 *   B. Inserta filas de detalle en 'proxrec' por cada producto.
 *   C. Genera alerta en 'notificaciones_tareas' para OPERATIVO_INVENTARIO.
 *
 * Body: { id_compra, id_bodega, descripcion, usuario_responsable,
 *         productos: [{ id_variante, pxo_cantidad }] }
 */
exports.registrarRecepcion = async (req, res) => {
    try {
        const { id_compra, id_bodega, descripcion, usuario_responsable, productos } = req.body;

        // ── Validación de entrada ─────────────────────────────────────────────
        if (!id_compra) {
            return res.status(400).json({ success: false, error: 'El campo id_compra es obligatorio.' });
        }
        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ success: false, error: 'El arreglo "productos" es obligatorio y no puede estar vacío.' });
        }
        for (const p of productos) {
            if (!p.id_variante || p.pxo_cantidad == null) {
                return res.status(400).json({ success: false, error: 'Cada producto debe tener id_variante y pxo_cantidad.' });
            }
        }

        const usuario = usuario_responsable
            ?? req.usuarioAutenticado?.usu_nombre
            ?? req.usuarioAutenticado?.nombre
            ?? 'Compras';
        const bodega = Number(id_bodega) || 1;

        // ── A + B: Cabecera y detalle ─────────────────────────────────────────
        const { idCabecera } = await InventarioModel.registrarRecepcionConDetalle({
            idCompra: id_compra,
            idBodega: bodega,
            descripcion: descripcion || `Recepción OC #${id_compra}`,
            usuarioResponsable: usuario,
            productos,
        });

        // ── C: Notificación automática para el Operativo ──────────────────────
        const cantidadTotal = productos.reduce((s, p) => s + Number(p.pxo_cantidad), 0);
        const mensajeNotif  = `Nueva recepción de Compras registrada. OC #${id_compra} — ${productos.length} producto(s), ${cantidadTotal} unidades en total. Cabecera de recepción: #${idCabecera}.`;

        NotificacionesModel.crearNotificacion({
            accion:              'CONFIRMAR_RECEPCION',
            respuestaIa:         mensajeNotif,
            instruccionOriginal: mensajeNotif,
            usuarioOrigen:       usuario,
            rolOrigen:           'COMPRAS',
            rolDestino:          'OPERATIVO_INVENTARIO',
            payload: {
                idCabecera,
                idBodega:          bodega,
                cantidadEsperada:  cantidadTotal,
                productos: productos.map((p) => ({
                    idVariante: Number(p.id_variante),
                    cantidad:   Number(p.pxo_cantidad),
                })),
            },
        }).then(() => {
            console.log(`✅ [registrarRecepcion] Alerta CONFIRMAR_RECEPCION → OPERATIVO | cabecera #${idCabecera}`);
        }).catch((err) => {
            console.warn(`⚠️  [registrarRecepcion] No se pudo crear la notificación para el Operativo:`, err.message);
        });

        InventarioModel.registrarLogAuditoria(req.usuario?.usu_nombre || req.body?.usuario_responsable, 'CREAR_PENDIENTE', 'recepciones', idCabecera);

        return res.status(201).json({
            success: true,
            message: `Recepción de OC #${id_compra} registrada. Cabecera #${idCabecera} creada con estado PEN. El Operativo fue notificado.`,
            idCabecera,
        });

    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [registrarRecepcion]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al registrar la recepción.',
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRACIÓN VENTAS (Gabo)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/inventario/entregas
 *
 * Registra una orden de entrega generada por Ventas (Gabo):
 *   A. Inserta cabecera en 'entregas' (ent_estado = 'PEN').
 *   B. Inserta filas de detalle en 'proxent' por cada producto.
 *   C. Genera alerta en 'notificaciones_tareas' para OPERATIVO_INVENTARIO.
 *
 * Body: { id_documento, id_bodega, descripcion, usuario_responsable,
 *         productos: [{ id_variante, pxd_cantidad }] }
 */
exports.registrarEntrega = async (req, res) => {
    try {
        const { id_documento, id_bodega, descripcion, usuario_responsable, productos } = req.body;

        // ── Validación de entrada ─────────────────────────────────────────────
        if (!id_documento) {
            return res.status(400).json({ success: false, error: 'El campo id_documento es obligatorio.' });
        }
        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({ success: false, error: 'El arreglo "productos" es obligatorio y no puede estar vacío.' });
        }
        for (const p of productos) {
            if (!p.id_variante || p.pxd_cantidad == null) {
                return res.status(400).json({ success: false, error: 'Cada producto debe tener id_variante y pxd_cantidad.' });
            }
        }

        const usuario = usuario_responsable
            ?? req.usuarioAutenticado?.usu_nombre
            ?? req.usuarioAutenticado?.nombre
            ?? 'Ventas';
        const bodega = Number(id_bodega) || 1;

        // ── A + B: Cabecera y detalle ─────────────────────────────────────────
        const { idCabecera } = await InventarioModel.registrarEntregaConDetalle({
            idDocumento: id_documento,
            idBodega: bodega,
            descripcion: descripcion || `Entrega documento #${id_documento}`,
            usuarioResponsable: usuario,
            productos,
        });

        // ── C: Notificación automática para el Operativo ──────────────────────
        const cantidadTotal = productos.reduce((s, p) => s + Number(p.pxd_cantidad), 0);
        const mensajeNotif  = `Nueva entrega de Ventas registrada. Documento #${id_documento} — ${productos.length} producto(s), ${cantidadTotal} unidades. Cabecera de entrega: #${idCabecera}.`;

        NotificacionesModel.crearNotificacion({
            accion:              'CONFIRMAR_ENTREGA',
            respuestaIa:         mensajeNotif,
            instruccionOriginal: mensajeNotif,
            usuarioOrigen:       usuario,
            rolOrigen:           'VENTAS',
            rolDestino:          'OPERATIVO_INVENTARIO',
            payload: {
                idCabecera,
                idBodega:         bodega,
                cantidadEsperada: cantidadTotal,
                productos: productos.map((p) => ({
                    idVariante: Number(p.id_variante),
                    cantidad:   Number(p.pxd_cantidad),
                })),
            },
        }).then(() => {
            console.log(`✅ [registrarEntrega] Alerta CONFIRMAR_ENTREGA → OPERATIVO | cabecera #${idCabecera}`);
        }).catch((err) => {
            console.warn(`⚠️  [registrarEntrega] No se pudo crear la notificación para el Operativo:`, err.message);
        });

        InventarioModel.registrarLogAuditoria(req.usuario?.usu_nombre || req.body?.usuario_responsable, 'CREAR_PENDIENTE', 'entregas', idCabecera);

        return res.status(201).json({
            success: true,
            message: `Entrega del documento #${id_documento} registrada. Cabecera #${idCabecera} creada con estado PEN. El Operativo fue notificado.`,
            idCabecera,
        });

    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [registrarEntrega]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al registrar la entrega.',
        });
    }
};

/**
 * GET /api/inventario/recepciones
 * Obtiene el historial completo de recepciones (con o sin detalle).
 */
exports.consultarRecepciones = async (req, res) => {
    try {
        const recepciones = await InventarioModel.obtenerRecepciones();
        
        return res.status(200).json({
            success: true,
            data: recepciones
        });
    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [consultarRecepciones]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al obtener recepciones.'
        });
    }
};
