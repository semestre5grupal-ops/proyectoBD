const EstadoDocService = require('../services/estadoDocumento.service');
const { DOC_ESTADO } = require('../common/dominios');

describe('EstadoDocumentoService.validarTransicion', () => {
    const validas = [
        [DOC_ESTADO.BOR, DOC_ESTADO.EMI],
        [DOC_ESTADO.BOR, DOC_ESTADO.ANU],
        [DOC_ESTADO.EMI, DOC_ESTADO.APR],
        [DOC_ESTADO.EMI, DOC_ESTADO.ABI],
        [DOC_ESTADO.EMI, DOC_ESTADO.ANU],
        [DOC_ESTADO.APR, DOC_ESTADO.ANU],
        [DOC_ESTADO.ABI, DOC_ESTADO.APR],
        [DOC_ESTADO.ABI, DOC_ESTADO.ANU],
    ];

    test.each(validas)('%s → %s es válida', (desde, hacia) => {
        expect(() => EstadoDocService.validarTransicion(desde, hacia)).not.toThrow();
    });

    const invalidas = [
        [DOC_ESTADO.BOR, DOC_ESTADO.APR],
        [DOC_ESTADO.BOR, DOC_ESTADO.ABI],
        [DOC_ESTADO.EMI, DOC_ESTADO.BOR],
        [DOC_ESTADO.APR, DOC_ESTADO.BOR],
        [DOC_ESTADO.APR, DOC_ESTADO.EMI],
        [DOC_ESTADO.ANU, DOC_ESTADO.BOR],
        [DOC_ESTADO.ANU, DOC_ESTADO.APR],
    ];

    test.each(invalidas)('%s → %s lanza 422', (desde, hacia) => {
        expect(() => EstadoDocService.validarTransicion(desde, hacia)).toThrow();
        try {
            EstadoDocService.validarTransicion(desde, hacia);
        } catch (e) {
            expect(e.status).toBe(422);
        }
    });

    test('estado desconocido lanza 422', () => {
        expect(() => EstadoDocService.validarTransicion('INVALIDO', DOC_ESTADO.EMI)).toThrow();
    });
});

describe('EstadoDocumentoService.validarEditable', () => {
    test('BOR es editable', () => {
        expect(() => EstadoDocService.validarEditable(DOC_ESTADO.BOR)).not.toThrow();
    });

    const noEditables = [DOC_ESTADO.EMI, DOC_ESTADO.APR, DOC_ESTADO.ABI, DOC_ESTADO.ANU];
    test.each(noEditables.map(e => [e]))('%s no es editable', ([estado]) => {
        expect(() => EstadoDocService.validarEditable(estado)).toThrow();
        try {
            EstadoDocService.validarEditable(estado);
        } catch (e) {
            expect(e.status).toBe(422);
        }
    });
});

describe('EstadoDocumentoService.esTerminal', () => {
    test('ANU es terminal', () => expect(EstadoDocService.esTerminal(DOC_ESTADO.ANU)).toBe(true));
    test('APR no es terminal', () => expect(EstadoDocService.esTerminal(DOC_ESTADO.APR)).toBe(false));
});
