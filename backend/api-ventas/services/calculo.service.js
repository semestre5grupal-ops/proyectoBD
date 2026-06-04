const { round } = require('../common/dinero');

// TASA_IVA configurable; default 15 % según SRS.
const TASA_IVA = () => parseFloat(process.env.TASA_IVA || '0.15');

const CalculoService = {
    /**
     * Calcula subtotal / base / iva / total a partir de las líneas del documento.
     * @param {Array} lineas  - Registros de productosxdocumento con pxd_cantidad y pxd_valor_unitario.
     * @param {number} descuento - DOC_DESCUENTO (≥ 0; no puede superar subtotal).
     * @returns {{ subtotal, base, iva, total }}
     *
     * TODO[OI-01]: el enunciado original indicaba "total = suma de subtotal y descuento".
     * Implementado como base + iva (subtotal − descuento + iva) que es la fórmula económica correcta.
     * Confirmar con el equipo antes de modificar.
     */
    calcular: (lineas, descuento = 0) => {
        if (!Array.isArray(lineas) || lineas.length === 0) {
            const err = new Error('El documento debe tener al menos una línea de producto.');
            err.status = 400;
            throw err;
        }

        for (const l of lineas) {
            if (!(Number(l.pxd_cantidad) > 0)) {
                const err = new Error(`Cantidad inválida (${l.pxd_cantidad}) en variante ${l.id_variante}.`);
                err.status = 400;
                throw err;
            }
        }

        const subtotal = lineas.reduce(
            (sum, l) => sum + round(Number(l.pxd_cantidad) * Number(l.pxd_valor_unitario), 4),
            0
        );

        const desc = Number(descuento);
        if (desc < 0 || desc > subtotal) {
            const err = new Error(`Descuento ${desc} fuera del rango [0, ${subtotal}].`);
            err.status = 400;
            throw err;
        }

        const base = round(subtotal - desc, 4);
        const iva = round(base * TASA_IVA(), 4);
        const total = round(base + iva, 4); // TODO[OI-01]

        return { subtotal, base, iva, total };
    },

    // Calcula el pxd_valor_subtotal de una línea individual.
    calcularLinea: (cantidad, valorUnitario) => {
        if (!(Number(cantidad) > 0)) {
            const err = new Error('La cantidad debe ser mayor a 0.');
            err.status = 400;
            throw err;
        }
        return round(Number(cantidad) * Number(valorUnitario), 4);
    },
};

module.exports = CalculoService;
