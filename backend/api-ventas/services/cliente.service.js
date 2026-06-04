const ClienteModel = require('../models/clienteModel');
const supabase = require('../config/db');
const { DOC_TIPO, DOC_ESTADO } = require('../common/dominios');

const CATEGORIA_DEFAULT = 5;
const CATEGORIA_MIN = 1;
const CATEGORIA_MAX = 9;

// TODO[OI-05]: umbrales de recálculo de CLI_CATEGORIA por recurrencia sin especificar en el SRS.
// Definir con el equipo comercial. Valores provisionales basados en número de facturas aprobadas.
const UMBRALES = [
    { minFacturas: 50, categoria: 1 },
    { minFacturas: 40, categoria: 2 },
    { minFacturas: 30, categoria: 3 },
    { minFacturas: 20, categoria: 4 },
    { minFacturas: 10, categoria: 5 },
    { minFacturas: 5,  categoria: 6 },
    { minFacturas: 3,  categoria: 7 },
    { minFacturas: 1,  categoria: 8 },
    { minFacturas: 0,  categoria: 9 },
];

const ClienteService = {
    crear: async ({ id_ciudad, cli_nombre, cli_ciruc, cli_celular, cli_telefono, cli_correo }) => {
        // Validaciones de NOT NULL
        const faltantes = ['id_ciudad', 'cli_nombre', 'cli_ciruc', 'cli_celular', 'cli_correo']
            .filter(f => !arguments[0]?.[f]);

        if (!id_ciudad || !cli_nombre || !cli_ciruc || !cli_celular || !cli_correo) {
            const err = new Error('Campos obligatorios: id_ciudad, cli_nombre, cli_ciruc, cli_celular, cli_correo.');
            err.status = 400;
            throw err;
        }

        ClienteService._validarCiruc(cli_ciruc);
        ClienteService._validarCelular(cli_celular);
        if (cli_telefono) ClienteService._validarTelefono(cli_telefono);
        ClienteService._validarEmail(cli_correo);

        return ClienteModel.create({
            id_ciudad,
            cli_nombre,
            cli_ciruc,
            cli_celular,
            cli_telefono: cli_telefono || null,
            cli_correo,
            cli_categoria: CATEGORIA_DEFAULT,
            cli_estado: 'ACT',
        });
    },

    /**
     * Recalcula CLI_CATEGORIA según la recurrencia de compras (FAC APR).
     * TODO[OI-05]: umbrales provisionales — confirmar valores finales con el equipo.
     */
    recalcularCategoria: async (clienteId) => {
        const cliente = await ClienteModel.getById(clienteId);
        if (!cliente) {
            const err = new Error('Cliente no encontrado.');
            err.status = 404;
            throw err;
        }

        const { data: docs, error } = await supabase
            .from('documentos')
            .select('id_documento', { count: 'exact' })
            .eq('id_cliente', clienteId)
            .eq('doc_tipo', DOC_TIPO.FAC)
            .eq('doc_estado', DOC_ESTADO.APR);

        if (error) throw new Error(error.message);

        const totalFacturas = docs ? docs.length : 0;
        const umbral = UMBRALES.find(u => totalFacturas >= u.minFacturas);
        const nuevaCategoria = umbral
            ? Math.max(CATEGORIA_MIN, Math.min(CATEGORIA_MAX, umbral.categoria))
            : CATEGORIA_DEFAULT;

        if (nuevaCategoria !== cliente.cli_categoria) {
            return ClienteModel.update(clienteId, { ...cliente, cli_categoria: nuevaCategoria });
        }
        return cliente;
    },

    _validarCiruc: (ciruc) => {
        if (!/^\d{13}$/.test(String(ciruc))) {
            const err = new Error('CLI_CIRUC debe tener exactamente 13 dígitos numéricos.');
            err.status = 400;
            throw err;
        }
    },

    _validarCelular: (celular) => {
        if (!/^\d{10}$/.test(String(celular))) {
            const err = new Error('CLI_CELULAR debe tener exactamente 10 dígitos numéricos.');
            err.status = 400;
            throw err;
        }
    },

    _validarTelefono: (telefono) => {
        if (!/^\d{8}$/.test(String(telefono))) {
            const err = new Error('CLI_TELEFONO debe tener exactamente 8 dígitos numéricos.');
            err.status = 400;
            throw err;
        }
    },

    _validarEmail: (email) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            const err = new Error('CLI_CORREO no tiene un formato de email válido.');
            err.status = 400;
            throw err;
        }
    },
};

module.exports = ClienteService;
