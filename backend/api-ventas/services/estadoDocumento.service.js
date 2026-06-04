const { DOC_ESTADO } = require('../common/dominios');

// TODO[OI-04]: transiciones inferidas del SRS inline. Validar contra Apéndice B oficial.
const TRANSICIONES = Object.freeze({
    [DOC_ESTADO.BOR]: [DOC_ESTADO.EMI, DOC_ESTADO.ANU],
    [DOC_ESTADO.EMI]: [DOC_ESTADO.APR, DOC_ESTADO.ABI, DOC_ESTADO.ANU],
    [DOC_ESTADO.APR]: [DOC_ESTADO.ANU],               // APR→ANU(compensa)
    [DOC_ESTADO.ABI]: [DOC_ESTADO.APR, DOC_ESTADO.ANU], // ABI→APR(saldado)
    [DOC_ESTADO.ANU]: [],                              // terminal
});

// Solo en BOR se pueden editar líneas, montos y pagos.
const ESTADOS_EDITABLES = [DOC_ESTADO.BOR];

const EstadoDocumentoService = {
    validarTransicion: (estadoActual, estadoDestino) => {
        const permitidos = TRANSICIONES[estadoActual];
        if (!permitidos) {
            const err = new Error(`Estado desconocido: '${estadoActual}'.`);
            err.status = 422;
            throw err;
        }
        if (!permitidos.includes(estadoDestino)) {
            const err = new Error(
                `Transición inválida: '${estadoActual}' → '${estadoDestino}'. ` +
                `Permitidos desde '${estadoActual}': [${permitidos.join(', ') || 'ninguno'}].`
            );
            err.status = 422;
            throw err;
        }
    },

    validarEditable: (estadoActual) => {
        if (!ESTADOS_EDITABLES.includes(estadoActual)) {
            const err = new Error(
                `No se puede editar un documento en estado '${estadoActual}'. ` +
                `Solo se permiten modificaciones en estado BOR.`
            );
            err.status = 422;
            throw err;
        }
    },

    esTerminal: (estado) => estado === DOC_ESTADO.ANU,

    transicionesDesde: (estado) => TRANSICIONES[estado] || [],
};

module.exports = EstadoDocumentoService;
