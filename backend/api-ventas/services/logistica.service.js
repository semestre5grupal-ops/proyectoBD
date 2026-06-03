const DocumentoModel = require('../models/documentoModel');
const LogisticaModel = require('../models/logisticaModel');
const ProductoxdocumentoModel = require('../models/productoxdocumentoModel');
const ProductoxlogisticaModel = require('../models/productoxlogisticaModel');
const { DOC_TIPO, LOG_ESTADO } = require('../common/dominios');

const TRANSICIONES_LOG = Object.freeze({
    [LOG_ESTADO.PEN]: [LOG_ESTADO.CUR],
    [LOG_ESTADO.CUR]: [LOG_ESTADO.ENT],
    [LOG_ESTADO.ENT]: [],
});

const LogisticaService = {
    /**
     * Crea el despacho logístico para una FAC aprobada.
     * Solo FAC genera logística; rechaza PRO y NCR.
     */
    crearDespacho: async (documentoId, idDireccion) => {
        const doc = await DocumentoModel.getById(documentoId);
        if (!doc) {
            const err = new Error('Documento no encontrado.');
            err.status = 404;
            throw err;
        }
        if (doc.doc_tipo !== DOC_TIPO.FAC) {
            const err = new Error(`Solo FAC genera logística. Tipo recibido: '${doc.doc_tipo}'.`);
            err.status = 422;
            throw err;
        }
        if (doc.doc_estado !== 'APR' && doc.doc_estado !== 'ABI') {
            const err = new Error('El documento debe estar en estado APR o ABI para crear logística.');
            err.status = 422;
            throw err;
        }

        const logistica = await LogisticaModel.create({
            id_documento: documentoId,
            id_direccion: idDireccion,
            log_despacho: new Date().toISOString(),
            log_estimada: null,
            log_real: null,
            log_estado: LOG_ESTADO.PEN,
        });

        // Registrar las líneas del documento en PRODUCTOSXLOGISTICA
        const lineas = await ProductoxdocumentoModel.getByDocumento(documentoId);
        for (const linea of lineas) {
            await ProductoxlogisticaModel.create({
                id_logistica: logistica.id_logistica,
                id_variante: linea.id_variante,
                pxl_cantidad: linea.pxd_cantidad,
                pxl_estado: LOG_ESTADO.PEN,
            });
        }

        return logistica;
    },

    /**
     * Avanza el estado logístico: PEN→CUR→ENT.
     * Al llegar a ENT registra LOG_REAL.
     */
    avanzarEstado: async (logisticaId) => {
        const log = await LogisticaModel.getById(logisticaId);
        if (!log) {
            const err = new Error('Registro logístico no encontrado.');
            err.status = 404;
            throw err;
        }

        const permitidos = TRANSICIONES_LOG[log.log_estado];
        if (!permitidos || permitidos.length === 0) {
            const err = new Error(`Estado logístico '${log.log_estado}' es terminal o desconocido.`);
            err.status = 422;
            throw err;
        }

        const nuevoEstado = permitidos[0];
        const logReal = nuevoEstado === LOG_ESTADO.ENT ? new Date().toISOString() : log.log_real;

        const actualizada = await LogisticaModel.update(logisticaId, {
            id_documento: log.id_documento,
            id_direccion: log.id_direccion,
            log_despacho: log.log_despacho,
            log_estimada: log.log_estimada,
            log_real: logReal,
            log_estado: nuevoEstado,
        });

        // Actualizar estado de las líneas de logística
        const lineasLog = await ProductoxlogisticaModel.getByLogistica(logisticaId);
        for (const ll of lineasLog) {
            await ProductoxlogisticaModel.update(logisticaId, ll.id_variante, {
                pxl_cantidad: ll.pxl_cantidad,
                pxl_estado: nuevoEstado,
            });
        }

        return actualizada;
    },

    // Baja lógica de un despacho (no DELETE físico).
    darBaja: async (logisticaId) => {
        const log = await LogisticaModel.getById(logisticaId);
        if (!log) {
            const err = new Error('Registro logístico no encontrado.');
            err.status = 404;
            throw err;
        }
        return LogisticaModel.update(logisticaId, { ...log, log_estado: 'ANU' });
    },
};

module.exports = LogisticaService;
