const DOC_TIPO = Object.freeze({ FAC: 'FAC', PRO: 'PRO', NCR: 'NCR' });

const DOC_ESTADO = Object.freeze({ BOR: 'BOR', ABI: 'ABI', APR: 'APR', EMI: 'EMI', ANU: 'ANU' });

const PXD_ESTADO = Object.freeze({ ABI: 'ABI', APR: 'APR', ANU: 'ANU', BOR: 'BOR', EMI: 'EMI' });

const INT_TIPO = Object.freeze({ DUD: 'DUD', REC: 'REC', SEG: 'SEG', DEV: 'DEV', FEE: 'FEE' });

// TODO[OI-04]: el CHECK de INT_TIPO en el DDL apunta a INT_ESTADO; validar contra Apéndice B del SRS.
const INT_ESTADO = Object.freeze({ DUD: 'DUD', REC: 'REC', SEG: 'SEG', DEV: 'DEV', FEE: 'FEE' });

const INT_CANAL = Object.freeze({ CEL: 'CEL', TEL: 'TEL', COR: 'COR', PRE: 'PRE' });

const LOG_ESTADO = Object.freeze({ PEN: 'PEN', CUR: 'CUR', ENT: 'ENT' });

const CUO_ESTADO = Object.freeze({ ACT: 'ACT', SAL: 'SAL', ANU: 'ANU' });

module.exports = { DOC_TIPO, DOC_ESTADO, PXD_ESTADO, INT_TIPO, INT_ESTADO, INT_CANAL, LOG_ESTADO, CUO_ESTADO };
