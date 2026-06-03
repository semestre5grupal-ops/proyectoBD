const supabase = require('../config/db');
const DocumentoModel = require('../models/documentoModel');
const ProductoxdocumentoModel = require('../models/productoxdocumentoModel');
const CuotaModel = require('../models/cuotaModel');
const CalculoService = require('./calculo.service');
const EstadoDocService = require('./estadoDocumento.service');
const PagoService = require('./pago.service');
const InventarioClient = require('../integrations/inventario.client');
const { DOC_TIPO, DOC_ESTADO, PXD_ESTADO } = require('../common/dominios');

// Auditoría mínima: registra en consola quién ejecutó qué y cuándo.
// TODO: reemplazar por tabla de auditoría cuando se defina en el esquema.
function auditLog(accion, documentoId, usuarioId) {
    console.log(JSON.stringify({ accion, documento_id: documentoId, usuario_id: usuarioId, ts: new Date().toISOString() }));
}

const DocumentoService = {
    /**
     * Crea un documento nuevo en estado BOR.
     * id_vendedor proviene del usuario autenticado (req.usuario).
     */
    crear: async ({ id_cliente, id_vendedor, doc_tipo, doc_descripcion, doc_id_documento = null, doc_descuento = 0 }) => {
        if (!Object.values(DOC_TIPO).includes(doc_tipo)) {
            const err = new Error(`doc_tipo inválido: '${doc_tipo}'. Valores: ${Object.values(DOC_TIPO).join(', ')}.`);
            err.status = 400;
            throw err;
        }
        if (!doc_descripcion || !String(doc_descripcion).trim()) {
            const err = new Error('doc_descripcion es obligatoria.');
            err.status = 400;
            throw err;
        }
        if (!id_cliente) {
            const err = new Error('id_cliente es obligatorio.');
            err.status = 400;
            throw err;
        }
        if (!id_vendedor) {
            const err = new Error('id_vendedor es obligatorio (tomado del usuario autenticado).');
            err.status = 400;
            throw err;
        }

        // NCR solo puede originarse desde una FAC.
        if (doc_tipo === DOC_TIPO.NCR) {
            if (!doc_id_documento) {
                const err = new Error('NCR requiere doc_id_documento apuntando a una FAC en estado APR.');
                err.status = 400;
                throw err;
            }
            const factura = await DocumentoModel.getById(doc_id_documento);
            if (!factura || factura.doc_tipo !== DOC_TIPO.FAC || factura.doc_estado !== DOC_ESTADO.APR) {
                const err = new Error('doc_id_documento debe referenciar una FAC en estado APR.');
                err.status = 422;
                throw err;
            }
        }

        return DocumentoModel.create({
            id_cliente,
            id_vendedor,
            doc_id_documento: doc_id_documento || null,
            doc_tipo,
            doc_emision: new Date().toISOString(),
            doc_pago: null,
            doc_descripcion: String(doc_descripcion).trim(),
            doc_subtotal: 0,
            doc_iva: 0,
            doc_descuento: Number(doc_descuento) || 0,
            doc_total: 0,
            doc_estado: DOC_ESTADO.BOR,
        });
    },

    /**
     * Emite el documento (BOR → EMI) recalculando los totales desde las líneas.
     */
    emitir: async (documentoId) => {
        const doc = await DocumentoModel.getById(documentoId);
        if (!doc) { const e = new Error('Documento no encontrado.'); e.status = 404; throw e; }

        EstadoDocService.validarTransicion(doc.doc_estado, DOC_ESTADO.EMI);

        const lineas = await ProductoxdocumentoModel.getByDocumento(documentoId);
        const { subtotal, iva, total } = CalculoService.calcular(lineas, doc.doc_descuento || 0);

        // Actualizar subtotales de líneas
        for (const l of lineas) {
            const vSub = CalculoService.calcularLinea(l.pxd_cantidad, l.pxd_valor_unitario);
            if (vSub !== Number(l.pxd_valor_subtotal)) {
                await ProductoxdocumentoModel.update(documentoId, l.id_variante, {
                    pxd_cantidad: l.pxd_cantidad,
                    pxd_valor_unitario: l.pxd_valor_unitario,
                    pxd_valor_subtotal: vSub,
                    pxd_estado: l.pxd_estado,
                });
            }
        }

        return DocumentoModel.update(documentoId, {
            ...doc,
            doc_subtotal: subtotal,
            doc_iva: iva,
            doc_total: total,
            doc_estado: DOC_ESTADO.EMI,
        });
    },

    /**
     * Aprueba el documento (EMI → APR|ABI) mediante saga contra Inventario.
     *
     * Flujo:
     *  1. Validar estado y tipo.
     *  2. verificarStock — 409 si falta stock.
     *  3. reservar stock (descuento inmediato).  TODO[OI-08]
     *  4. Registrar pagos → determinar estado destino.
     *  5. confirmar stock (NO idempotente, una sola vez).
     *  6. Emitir señal de asiento contable (gancho vacío).
     *  7. Persistir estados de documento y líneas.
     *
     * Compensación: si falla cualquier paso 3–5 → liberar stock y abort.
     * TODO[OI-02]: las escrituras son secuenciales sin transacción nativa de Supabase.
     *             Para ACID real usar supabase.rpc('fn_aprobar_documento', {...}).
     */
    aprobar: async (documentoId, { pagos }, usuarioId) => {
        const doc = await DocumentoModel.getById(documentoId);
        if (!doc) { const e = new Error('Documento no encontrado.'); e.status = 404; throw e; }

        // Candado: rechazar reproceso si ya está APR/ABI.  TODO[OI-03]
        if ([DOC_ESTADO.APR, DOC_ESTADO.ABI].includes(doc.doc_estado)) {
            const e = new Error(`Documento ya procesado (${doc.doc_estado}). No se puede reprocesar.`);
            e.status = 409;
            throw e;
        }

        EstadoDocService.validarTransicion(doc.doc_estado, DOC_ESTADO.APR);

        if (![DOC_TIPO.FAC, DOC_TIPO.NCR].includes(doc.doc_tipo)) {
            const e = new Error(`Solo FAC y NCR pueden aprobarse. Tipo: '${doc.doc_tipo}'.`);
            e.status = 422;
            throw e;
        }

        const lineas = await ProductoxdocumentoModel.getByDocumento(documentoId);
        if (!lineas || lineas.length === 0) {
            const e = new Error('El documento no tiene líneas de producto.'); e.status = 400; throw e;
        }

        const items = lineas.map(l => ({ id_variante: l.id_variante, cantidad: Number(l.pxd_cantidad) }));

        // Paso 2: verificar stock (reintentable).
        const stockCheck = await InventarioClient.verificarStock(items);
        const faltantes = stockCheck.filter(s => !s.suficiente);
        if (faltantes.length > 0) {
            const e = new Error('Stock insuficiente para procesar el documento.');
            e.status = 409;
            e.detalle = faltantes;
            throw e;
        }

        // Paso 3: reservar (NO reintentable).
        let reservaId = null;
        try {
            const reserva = await InventarioClient.reservar({ documento_id: documentoId, items });
            reservaId = reserva.reserva_id;
        } catch (err) {
            const e = new Error('No se pudo reservar el stock: ' + (err.response?.data?.error || err.message));
            e.status = 409;
            throw e;
        }

        // Paso 4: registrar pagos.
        let estadoDestino, docPago;
        try {
            ({ estadoDestino, docPago } = await PagoService.registrarPagos(documentoId, pagos, doc.doc_total));
        } catch (err) {
            // Compensar stock.
            await InventarioClient.liberar({ reserva_id: reservaId, documento_id: documentoId }).catch(() => {});
            throw err;
        }

        // Paso 5: confirmar stock (NO idempotente — invocar UNA sola vez).
        try {
            await InventarioClient.confirmar({ reserva_id: reservaId, documento_id: documentoId });
        } catch (err) {
            await InventarioClient.liberar({ reserva_id: reservaId, documento_id: documentoId }).catch(() => {});
            const e = new Error('Error al confirmar stock en Inventario: ' + (err.response?.data?.error || err.message));
            e.status = 502;
            throw e;
        }

        // Paso 6: gancho de asiento contable (no implementar contabilidad aquí).
        // TODO: emit('asiento_contable', { documento_id, tipo: doc.doc_tipo, total: doc.doc_total });

        // Paso 7: persistir estados.
        // TODO[OI-02]: secuencial sin transacción nativa.
        await DocumentoModel.update(documentoId, { ...doc, doc_estado: estadoDestino, doc_pago: docPago });

        for (const l of lineas) {
            await ProductoxdocumentoModel.update(documentoId, l.id_variante, {
                pxd_cantidad: l.pxd_cantidad,
                pxd_valor_unitario: l.pxd_valor_unitario,
                pxd_valor_subtotal: l.pxd_valor_subtotal,
                pxd_estado: PXD_ESTADO.APR,
            });
        }

        auditLog('APROBAR', documentoId, usuarioId);
        return DocumentoModel.getById(documentoId);
    },

    /**
     * Anula el documento (→ ANU). Baja lógica siempre; nunca DELETE.
     * Si estaba APR/ABI: reposición de stock y señal de reverso contable.
     */
    anular: async (documentoId, usuarioId) => {
        const doc = await DocumentoModel.getById(documentoId);
        if (!doc) { const e = new Error('Documento no encontrado.'); e.status = 404; throw e; }

        EstadoDocService.validarTransicion(doc.doc_estado, DOC_ESTADO.ANU);

        const requiereCompensacion = [DOC_ESTADO.APR, DOC_ESTADO.ABI].includes(doc.doc_estado);

        if (requiereCompensacion) {
            const lineas = await ProductoxdocumentoModel.getByDocumento(documentoId);
            const items = lineas.map(l => ({ id_variante: l.id_variante, cantidad: Number(l.pxd_cantidad) }));

            // Reponer stock (compensación).  TODO[OI-07]: conectar NCR cuando esté especificado.
            await InventarioClient.reponer({ documento_id: documentoId, items }).catch(err => {
                console.error('WARN: fallo al reponer stock en anulación', err.message);
            });

            // Anular cuotas pendientes.
            await PagoService.anularCuotas(documentoId);

            // TODO: emit('reverso_contable', { documento_id, tipo: doc.doc_tipo });
        }

        // Anular líneas del documento.
        const lineas = requiereCompensacion
            ? await ProductoxdocumentoModel.getByDocumento(documentoId)
            : [];
        for (const l of lineas) {
            await ProductoxdocumentoModel.update(documentoId, l.id_variante, {
                pxd_cantidad: l.pxd_cantidad,
                pxd_valor_unitario: l.pxd_valor_unitario,
                pxd_valor_subtotal: l.pxd_valor_subtotal,
                pxd_estado: PXD_ESTADO.ANU,
            });
        }

        await DocumentoModel.update(documentoId, { ...doc, doc_estado: DOC_ESTADO.ANU });

        auditLog('ANULAR', documentoId, usuarioId);
        return DocumentoModel.getById(documentoId);
    },

    /**
     * Genera una FAC a partir de una PRO (copia líneas y datos del cliente/vendedor).
     */
    generarFacturaDesdeProforma: async (proformaId, usuarioId) => {
        const pro = await DocumentoModel.getById(proformaId);
        if (!pro) { const e = new Error('Proforma no encontrada.'); e.status = 404; throw e; }
        if (pro.doc_tipo !== DOC_TIPO.PRO) {
            const e = new Error('El documento origen debe ser una PRO.'); e.status = 422; throw e;
        }

        const lineas = await ProductoxdocumentoModel.getByDocumento(proformaId);

        const fac = await DocumentoService.crear({
            id_cliente: pro.id_cliente,
            id_vendedor: pro.id_vendedor || usuarioId,
            doc_tipo: DOC_TIPO.FAC,
            doc_descripcion: `Factura generada desde PRO #${proformaId}`,
            doc_id_documento: proformaId,
            doc_descuento: pro.doc_descuento,
        });

        for (const l of lineas) {
            await ProductoxdocumentoModel.create({
                id_documento: fac.id_documento,
                id_variante: l.id_variante,
                pxd_cantidad: l.pxd_cantidad,
                pxd_valor_unitario: l.pxd_valor_unitario,
                pxd_valor_subtotal: l.pxd_valor_subtotal,
                pxd_estado: PXD_ESTADO.BOR,
            });
        }

        return fac;
    },

    /**
     * Genera una NCR a partir de una FAC APR.
     */
    generarNotaCredito: async (facturaId, { doc_descripcion }) => {
        const fac = await DocumentoModel.getById(facturaId);
        if (!fac) { const e = new Error('Factura no encontrada.'); e.status = 404; throw e; }
        if (fac.doc_tipo !== DOC_TIPO.FAC || fac.doc_estado !== DOC_ESTADO.APR) {
            const e = new Error('Solo se puede generar NCR desde una FAC en estado APR.'); e.status = 422; throw e;
        }

        const lineas = await ProductoxdocumentoModel.getByDocumento(facturaId);

        const ncr = await DocumentoService.crear({
            id_cliente: fac.id_cliente,
            id_vendedor: fac.id_vendedor,
            doc_tipo: DOC_TIPO.NCR,
            doc_descripcion: doc_descripcion || `Nota de crédito para FAC #${facturaId}`,
            doc_id_documento: facturaId,
            doc_descuento: fac.doc_descuento,
        });

        for (const l of lineas) {
            await ProductoxdocumentoModel.create({
                id_documento: ncr.id_documento,
                id_variante: l.id_variante,
                pxd_cantidad: l.pxd_cantidad,
                pxd_valor_unitario: l.pxd_valor_unitario,
                pxd_valor_subtotal: l.pxd_valor_subtotal,
                pxd_estado: PXD_ESTADO.BOR,
            });
        }

        return ncr;
    },
};

module.exports = DocumentoService;
