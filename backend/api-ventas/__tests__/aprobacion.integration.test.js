process.env.TASA_IVA = '0.15';
process.env.JWT_SECRET = 'test_secret';

// Mocks deben declararse antes del require del servicio
jest.mock('../integrations/inventario.client');
jest.mock('../models/documentoModel');
jest.mock('../models/productoxdocumentoModel');
jest.mock('../models/documentoxpagoModel');
jest.mock('../models/cuotaModel');
jest.mock('../models/metodoPagoModel');

const InventarioClient = require('../integrations/inventario.client');
const DocumentoModel = require('../models/documentoModel');
const ProductoxdocumentoModel = require('../models/productoxdocumentoModel');
const DocumentoxpagoModel = require('../models/documentoxpagoModel');
const CuotaModel = require('../models/cuotaModel');
const MetodoPagoModel = require('../models/metodoPagoModel');
const DocumentoService = require('../services/documento.service');
const { DOC_TIPO, DOC_ESTADO, PXD_ESTADO } = require('../common/dominios');

const DOC_BASE = {
    id_documento: 42,
    id_cliente: 1,
    id_vendedor: 1,
    doc_tipo: DOC_TIPO.FAC,
    doc_estado: DOC_ESTADO.EMI,
    doc_subtotal: 100,
    doc_iva: 15,
    doc_descuento: 0,
    doc_total: 115,
    doc_emision: new Date().toISOString(),
    doc_pago: null,
    doc_descripcion: 'Test',
};

const LINEAS = [
    { id_variante: 10, pxd_cantidad: 2, pxd_valor_unitario: 50, pxd_valor_subtotal: 100, pxd_estado: PXD_ESTADO.EMI },
];

const METODO_CONTADO = { id_metodopago: 1, mpg_nombre: 'Efectivo', mpg_diferido: false, mpg_plazos: null, mpg_numero_referencia: false };

beforeEach(() => {
    jest.clearAllMocks();

    DocumentoModel.getById.mockResolvedValue({ ...DOC_BASE });
    DocumentoModel.update.mockImplementation(async (id, data) => data);

    ProductoxdocumentoModel.getByDocumento.mockResolvedValue(LINEAS);
    ProductoxdocumentoModel.update.mockResolvedValue({});

    DocumentoxpagoModel.create.mockResolvedValue({});
    CuotaModel.create.mockResolvedValue({});
    MetodoPagoModel.getById.mockResolvedValue(METODO_CONTADO);

    InventarioClient.verificarStock.mockResolvedValue([{ id_variante: 10, suficiente: true, disponible: 50 }]);
    InventarioClient.reservar.mockResolvedValue({ reserva_id: 'res-001' });
    InventarioClient.confirmar.mockResolvedValue({ ok: true });
    InventarioClient.liberar.mockResolvedValue({ ok: true });
});

describe('DocumentoService.aprobar — flujo exitoso (contado)', () => {
    test('llama a verificar, reservar y confirmar en orden', async () => {
        await DocumentoService.aprobar(42, { pagos: [{ id_metodopago: 1, monto: 115 }] }, 99);

        expect(InventarioClient.verificarStock).toHaveBeenCalledWith([{ id_variante: 10, cantidad: 2 }]);
        expect(InventarioClient.reservar).toHaveBeenCalledWith({ documento_id: 42, items: [{ id_variante: 10, cantidad: 2 }] });
        expect(InventarioClient.confirmar).toHaveBeenCalledWith({ reserva_id: 'res-001', documento_id: 42 });
        expect(InventarioClient.liberar).not.toHaveBeenCalled();
    });

    test('persiste estado APR en el documento (pago contado)', async () => {
        await DocumentoService.aprobar(42, { pagos: [{ id_metodopago: 1, monto: 115 }] }, 99);

        const updateCall = DocumentoModel.update.mock.calls[0];
        expect(updateCall[1].doc_estado).toBe(DOC_ESTADO.APR);
        expect(updateCall[1].doc_pago).not.toBeNull();
    });

    test('actualiza estado de líneas a APR', async () => {
        await DocumentoService.aprobar(42, { pagos: [{ id_metodopago: 1, monto: 115 }] }, 99);

        expect(ProductoxdocumentoModel.update).toHaveBeenCalledWith(42, 10, expect.objectContaining({
            pxd_estado: PXD_ESTADO.APR,
        }));
    });
});

describe('DocumentoService.aprobar — fallo de stock', () => {
    test('lanza 409 y NO llama a reservar si stock insuficiente', async () => {
        InventarioClient.verificarStock.mockResolvedValue([{ id_variante: 10, suficiente: false, disponible: 0 }]);

        await expect(
            DocumentoService.aprobar(42, { pagos: [{ id_metodopago: 1, monto: 115 }] }, 99)
        ).rejects.toMatchObject({ status: 409 });

        expect(InventarioClient.reservar).not.toHaveBeenCalled();
        expect(InventarioClient.confirmar).not.toHaveBeenCalled();
    });
});

describe('DocumentoService.aprobar — compensación al fallar confirmar', () => {
    test('llama a liberar si confirmar falla', async () => {
        InventarioClient.confirmar.mockRejectedValue(new Error('Timeout en Inventario'));

        await expect(
            DocumentoService.aprobar(42, { pagos: [{ id_metodopago: 1, monto: 115 }] }, 99)
        ).rejects.toMatchObject({ status: 502 });

        expect(InventarioClient.liberar).toHaveBeenCalledWith({ reserva_id: 'res-001', documento_id: 42 });
        // Estado del documento NO debe haber cambiado a APR.
        const updateCall = DocumentoModel.update.mock.calls.find(c => c[1]?.doc_estado === DOC_ESTADO.APR);
        expect(updateCall).toBeUndefined();
    });
});

describe('DocumentoService.aprobar — candado anti-reproceso', () => {
    test('lanza 409 si el documento ya está APR', async () => {
        DocumentoModel.getById.mockResolvedValue({ ...DOC_BASE, doc_estado: DOC_ESTADO.APR });

        await expect(
            DocumentoService.aprobar(42, { pagos: [{ id_metodopago: 1, monto: 115 }] }, 99)
        ).rejects.toMatchObject({ status: 409 });

        expect(InventarioClient.verificarStock).not.toHaveBeenCalled();
    });

    test('lanza 409 si el documento ya está ABI', async () => {
        DocumentoModel.getById.mockResolvedValue({ ...DOC_BASE, doc_estado: DOC_ESTADO.ABI });

        await expect(
            DocumentoService.aprobar(42, { pagos: [{ id_metodopago: 1, monto: 115 }] }, 99)
        ).rejects.toMatchObject({ status: 409 });
    });
});

describe('DocumentoService.aprobar — tipo inválido', () => {
    test('lanza 422 si doc_tipo es PRO', async () => {
        DocumentoModel.getById.mockResolvedValue({ ...DOC_BASE, doc_tipo: DOC_TIPO.PRO });

        await expect(
            DocumentoService.aprobar(42, { pagos: [{ id_metodopago: 1, monto: 115 }] }, 99)
        ).rejects.toMatchObject({ status: 422 });
    });
});
