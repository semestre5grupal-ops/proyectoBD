const axios = require('axios');
const jwt = require('jsonwebtoken');

// Variable de entorno renombrada a INVENTARIO_API_URL per spec.
// El .env existente usa URL_API_INVENTARIO; mantener compatibilidad con fallback.
const BASE_URL =
    process.env.INVENTARIO_API_URL ||
    process.env.URL_API_INVENTARIO ||
    'https://api-inventario-1r1w.onrender.com';

const TIMEOUT_MS = parseInt(process.env.HTTP_TIMEOUT_MS || '5000', 10);
const MAX_RETRIES_LECTURA = 2; // Solo lecturas: obtenerVariante, verificarStock

function generarToken() {
    return jwt.sign(
        { servicio: 'api-ventas', tipo: 'inter-servicio' },
        process.env.JWT_SECRET || 'super_secreto_para_desarrollo_local_123',
        { expiresIn: '5m' }
    );
}

function crearCliente() {
    return axios.create({
        baseURL: `${BASE_URL}/api/inventario`,
        timeout: TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
    });
}

function authHeaders() {
    return { Authorization: `Bearer ${generarToken()}` };
}

async function conReintentos(fn) {
    let ultimo;
    for (let intento = 0; intento < MAX_RETRIES_LECTURA; intento++) {
        try {
            return await fn();
        } catch (err) {
            ultimo = err;
            if (intento < MAX_RETRIES_LECTURA - 1) {
                await new Promise(r => setTimeout(r, 300 * (intento + 1)));
            }
        }
    }
    throw ultimo;
}

const InventarioClient = {
    // GET /variantes/:id → {id_variante, nombre, valor_unitario, iva_incluido}
    obtenerVariante: (idVariante) =>
        conReintentos(async () => {
            const { data } = await crearCliente().get(`/variantes/${idVariante}`, { headers: authHeaders() });
            return data;
        }),

    // POST /stock/verificar → [{id_variante, suficiente, disponible}]
    verificarStock: (items) =>
        conReintentos(async () => {
            const { data } = await crearCliente().post('/stock/verificar', { items }, { headers: authHeaders() });
            return data;
        }),

    // POST /stock/reservar → {reserva_id}
    // TODO[OI-08]: en implementación mínima, descuenta stock inmediatamente.
    // TODO[OI-03]: reserva_id es efímero y no se persiste en la BD de ventas.
    // NUNCA reintentar escrituras de estado.
    reservar: async ({ documento_id, items }) => {
        const { data } = await crearCliente().post('/stock/reservar', { documento_id, items }, { headers: authHeaders() });
        return data;
    },

    // POST /stock/confirmar → 200
    // NO idempotente: invocar UNA sola vez por saga.
    confirmar: async ({ reserva_id, documento_id }) => {
        const { data } = await crearCliente().post('/stock/confirmar', { reserva_id, documento_id }, { headers: authHeaders() });
        return data;
    },

    // POST /stock/liberar → 200 (compensación)
    liberar: async ({ reserva_id, documento_id }) => {
        const { data } = await crearCliente().post('/stock/liberar', { reserva_id, documento_id }, { headers: authHeaders() });
        return data;
    },

    // POST /stock/reponer → 200 (NCR devolución / anulación FAC APR)
    // TODO[OI-07]: opcional, pendiente conectar al flujo de anulación NCR.
    reponer: async ({ documento_id, items }) => {
        const { data } = await crearCliente().post('/stock/reponer', { documento_id, items }, { headers: authHeaders() });
        return data;
    },
};

module.exports = InventarioClient;
