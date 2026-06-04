const DocumentoService = require('../services/documento.service');
const PagoService = require('../services/pago.service');

function handleError(res, err) {
    const status = err.status || 500;
    const body = { success: false, message: err.message };
    if (err.detalle) body.detalle = err.detalle;
    return res.status(status).json(body);
}

// POST /documentos/:id/emitir
exports.emitir = async (req, res) => {
    try {
        const data = await DocumentoService.emitir(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

// POST /documentos/:id/aprobar
// Body: { pagos: [{id_metodopago, monto, referencia?, meses?}] }
exports.aprobar = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id_usuario || req.usuario?.id || null;
        const data = await DocumentoService.aprobar(req.params.id, req.body, usuarioId);
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

// POST /documentos/:id/anular
exports.anular = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id_usuario || req.usuario?.id || null;
        const data = await DocumentoService.anular(req.params.id, usuarioId);
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

// POST /documentos/:id/factura  (genera FAC desde PRO)
exports.generarFactura = async (req, res) => {
    try {
        const usuarioId = req.usuario?.id_usuario || req.usuario?.id || null;
        const data = await DocumentoService.generarFacturaDesdeProforma(req.params.id, usuarioId);
        res.status(201).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

// POST /documentos/:id/nota-credito
// Body: { doc_descripcion? }
exports.generarNotaCredito = async (req, res) => {
    try {
        const data = await DocumentoService.generarNotaCredito(req.params.id, req.body);
        res.status(201).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

// POST /documentos/:id/pagos  — Registro de pago sin aprobar (para flujos futuros).
// Body: { pagos: [...] }
exports.registrarPagos = async (req, res) => {
    try {
        const { pagos, doc_total } = req.body;
        const data = await PagoService.registrarPagos(req.params.id, pagos, doc_total);
        res.status(201).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};

// POST /cuotas/:id/abonar  — Abona a una cuota específica.
// Body: { monto, documento_id }
exports.abonarCuota = async (req, res) => {
    try {
        const { monto, documento_id } = req.body;
        const usuarioId = req.usuario?.id_usuario || req.usuario?.id || null;
        const data = await PagoService.abonarCuota(req.params.id, monto, documento_id);
        res.status(200).json({ success: true, data });
    } catch (err) {
        handleError(res, err);
    }
};
