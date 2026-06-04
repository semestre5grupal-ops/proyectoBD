const supabase = require('../config/db');
const DocumentoModel = require('../models/documentoModel');
const DocumentoxpagoModel = require('../models/documentoxpagoModel');
const CuotaModel = require('../models/cuotaModel');
const MetodoPagoModel = require('../models/metodoPagoModel');
const { round } = require('../common/dinero');
const { DOC_ESTADO, CUO_ESTADO } = require('../common/dominios');

function agregarMeses(fecha, meses) {
    const d = new Date(fecha);
    d.setMonth(d.getMonth() + meses);
    return d.toISOString();
}

const PagoService = {
    /**
     * Registra los pagos de un documento y genera cuotas si corresponde.
     * Soporta pago mixto (varios métodos).
     * @param {number} documentoId
     * @param {Array}  pagos  [{id_metodopago, monto, referencia?, meses?}]
     * @param {number} docTotal
     * @returns {{ estadoDestino, docPago }}
     */
    registrarPagos: async (documentoId, pagos, docTotal) => {
        if (!Array.isArray(pagos) || pagos.length === 0) {
            const err = new Error('Se requiere al menos un método de pago.');
            err.status = 400;
            throw err;
        }

        const totalAbonado = pagos.reduce((s, p) => s + Number(p.monto), 0);
        if (round(totalAbonado, 2) !== round(Number(docTotal), 2)) {
            const err = new Error(
                `La suma de pagos (${totalAbonado}) no concilia con el total del documento (${docTotal}).`
            );
            err.status = 400;
            throw err;
        }

        let hayDiferido = false;
        const emision = new Date().toISOString();

        for (const pago of pagos) {
            const metodo = await MetodoPagoModel.getById(pago.id_metodopago);
            if (!metodo) {
                const err = new Error(`Método de pago ${pago.id_metodopago} no encontrado.`);
                err.status = 404;
                throw err;
            }

            if (metodo.mpg_numero_referencia && !pago.referencia) {
                const err = new Error(
                    `El método '${metodo.mpg_nombre}' requiere número de referencia.`
                );
                err.status = 400;
                throw err;
            }

            // Nota: el campo en BD tiene typo 'dxp_monto_aboonado' (doble 'o') — respetado.
            await DocumentoxpagoModel.create({
                id_documento: documentoId,
                id_metodopago: pago.id_metodopago,
                dxp_monto_aboonado: round(Number(pago.monto), 2),
                dxp_referencia: pago.referencia || null,
                dxp_mesesplazo: pago.meses || metodo.mpg_plazos || null,
            });

            if (metodo.mpg_diferido) {
                hayDiferido = true;
                const meses = pago.meses || metodo.mpg_plazos || 1;
                await PagoService._generarCuotas(documentoId, pago.monto, meses, emision);
            }
        }

        const estadoDestino = hayDiferido ? DOC_ESTADO.ABI : DOC_ESTADO.APR;
        const docPago = hayDiferido ? null : emision;

        return { estadoDestino, docPago };
    },

    _generarCuotas: async (documentoId, montoFinanciado, nMeses, emision) => {
        const montoPorCuota = round(Number(montoFinanciado) / nMeses, 2);
        let acumulado = 0;

        for (let i = 1; i <= nMeses; i++) {
            const esUltima = i === nMeses;
            const monto = esUltima
                ? round(Number(montoFinanciado) - acumulado, 2)
                : montoPorCuota;
            acumulado = round(acumulado + monto, 2);

            await CuotaModel.create({
                id_documento: documentoId,
                cuo_numero: i,
                cuo_monto: monto,
                cuo_pendiente: monto,
                cuo_fecha_pagado: null,
                cuo_fecha_estimada: agregarMeses(emision, i),
                cuo_estado: CUO_ESTADO.ACT,
            });
        }
    },

    /**
     * Registra un abono a una cuota específica.
     * Si todas las cuotas quedan saldadas, pasa el documento ABI → APR.
     */
    abonarCuota: async (cuotaId, montoAbono, documentoId) => {
        const cuota = await CuotaModel.getById(cuotaId);
        if (!cuota) {
            const err = new Error('Cuota no encontrada.');
            err.status = 404;
            throw err;
        }
        if (cuota.id_documento !== documentoId) {
            const err = new Error('La cuota no pertenece al documento indicado.');
            err.status = 403;
            throw err;
        }
        if (Number(cuota.cuo_pendiente) <= 0) {
            const err = new Error('La cuota ya está saldada.');
            err.status = 409;
            throw err;
        }

        const abono = round(Number(montoAbono), 2);
        if (abono <= 0 || abono > Number(cuota.cuo_pendiente)) {
            const err = new Error(
                `Monto de abono ${abono} inválido. Pendiente: ${cuota.cuo_pendiente}.`
            );
            err.status = 400;
            throw err;
        }

        const nuevoPendiente = round(Number(cuota.cuo_pendiente) - abono, 2);
        const saldada = nuevoPendiente === 0;

        await CuotaModel.update(cuotaId, {
            id_documento: cuota.id_documento,
            cuo_numero: cuota.cuo_numero,
            cuo_monto: cuota.cuo_monto,
            cuo_pendiente: nuevoPendiente,
            cuo_fecha_pagado: saldada ? new Date().toISOString() : cuota.cuo_fecha_pagado,
            cuo_fecha_estimada: cuota.cuo_fecha_estimada,
            cuo_estado: saldada ? CUO_ESTADO.SAL : cuota.cuo_estado,
        });

        if (saldada) {
            const todasCuotas = await CuotaModel.getByDocumento(documentoId);
            const todasSaldadas = todasCuotas.every(c => c.cuo_estado === CUO_ESTADO.SAL);

            if (todasSaldadas) {
                const doc = await DocumentoModel.getById(documentoId);
                // TODO[OI-02]: sin transacción nativa; secuencial con compensación si falla.
                await supabase
                    .from('documentos')
                    .update({ doc_pago: new Date().toISOString(), doc_estado: DOC_ESTADO.APR })
                    .eq('id_documento', documentoId);
            }
        }

        return CuotaModel.getById(cuotaId);
    },

    // Anula las cuotas activas de un documento (borrado lógico).
    anularCuotas: async (documentoId) => {
        const cuotas = await CuotaModel.getByDocumento(documentoId);
        for (const c of cuotas) {
            if (c.cuo_estado !== CUO_ESTADO.SAL) {
                await CuotaModel.update(c.id_cuota, { ...c, cuo_estado: CUO_ESTADO.ANU });
            }
        }
    },
};

module.exports = PagoService;
