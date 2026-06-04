const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const notificacionesController = require('../controllers/notificacionesController');

// Middleware de autenticación y autorización (RBAC)
const { verificarToken, restringirA } = require('../middlewares/authMiddleware');

// ─── NOTIFICACIONES DE TAREAS ─────────────────────────────────────────────────
// GET: Cualquier usuario autenticado puede leer sus tareas pendientes.
router.get('/tareas/pendientes', verificarToken, notificacionesController.obtenerTareasPendientes);

// POST: El frontend persiste la intención de la IA tan pronto como Ollama genera el JSON.
//       Solo se llama cuando rol_destino !== rol del usuario actual.
router.post('/tareas', verificarToken, notificacionesController.crearTarea);

// PUT: El frontend actualiza el estado de la tarea una vez confirmada.
router.put('/tareas/:id/estado', verificarToken, notificacionesController.actualizarEstadoTarea);

// ─── CONSULTA DE STOCK ────────────────────────────────────────────────────────
// Cualquier usuario autenticado puede revisar existencias (sin restricción de rol).
router.get('/stock/:idVariante', verificarToken, inventarioController.consultarStock);

// ─── OPERACIONES DE STOCK ─────────────────────────────────────────────────────
// Ingresar stock: solo JEFE o OPERATIVO (quien recibe físicamente la mercadería).
router.post('/ingresar', verificarToken, restringirA('JEFE_INVENTARIO', 'OPERATIVO_INVENTARIO'), inventarioController.ingresarStock);

// Descontar stock: solo JEFE o OPERATIVO (quien procesa la salida de mercadería).
router.post('/descontar', verificarToken, restringirA('JEFE_INVENTARIO', 'OPERATIVO_INVENTARIO'), inventarioController.descontarStock);

// Aprobar Ajuste (RPC): solo JEFE o OPERATIVO
router.put('/ajustes/:id/aprobar', verificarToken, restringirA('JEFE_INVENTARIO', 'OPERATIVO_INVENTARIO'), inventarioController.aprobarAjuste);

// Crear Cabecera Pendiente (Pre-Ajuste): JEFE, OPERATIVO o AUXILIAR
router.post('/ajustes/pendiente', verificarToken, restringirA('JEFE_INVENTARIO', 'OPERATIVO_INVENTARIO', 'AUXILIAR_INVENTARIO'), inventarioController.crearCabeceraPendiente);

// Aprobar Recepción (RPC): JEFE u OPERATIVO
router.put('/recepciones/:id/aprobar', verificarToken, restringirA('JEFE_INVENTARIO', 'OPERATIVO_INVENTARIO'), inventarioController.aprobarRecepcion);

// Aprobar Entrega (RPC): JEFE u OPERATIVO
router.put('/entregas/:id/aprobar', verificarToken, restringirA('JEFE_INVENTARIO', 'OPERATIVO_INVENTARIO'), inventarioController.aprobarEntrega);

// ─── SINCRONIZACIÓN CLOUD ─────────────────────────────────────────────────────
// Operación masiva hacia Firebase: exclusivo para el Jefe de Inventario.
router.get('/sincronizar-cloud', verificarToken, restringirA('JEFE_INVENTARIO'), inventarioController.sincronizarCloud);

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRACIÓN CON OTROS MÓDULOS — Sin restricción de rol extra
// Cualquier usuario autenticado con JWT válido puede notificar recepciones y
// entregas (Compras / Ventas usan sus propios tokens del sistema central).
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/inventario/recepciones — Compras (Liz) notifica llegada de OC
router.post('/recepciones', verificarToken, inventarioController.registrarRecepcion);

// POST /api/inventario/entregas — Ventas (Gabo) notifica salida de mercadería
router.post('/entregas', verificarToken, inventarioController.registrarEntrega);

router.get('/recepciones', verificarToken, inventarioController.consultarRecepciones);


module.exports = router;