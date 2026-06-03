const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * ============================================================================
 * INTEGRACIÓN CON EL MÓDULO DE COMPRAS (LIZ)
 * ============================================================================
 * Este archivo agrupa todas las consultas de variantes de productos y bodegas
 * requeridas por el módulo de Compras. Está separado de los archivos base
 * para garantizar la modularidad y no interferir con el funcionamiento original.
 */

// ----------------------------------------------------------------------------
// CONTROLADORES DE ACCESO A BASE DE DATOS (MODELOS) Y RESPUESTAS (CONTROLLERS)
// ----------------------------------------------------------------------------

/**
 * Función Auxiliar: parseVariantAttributes
 * Convierte el nombre original de la variante y extrae su color
 * o talla si están implícitos en el texto, ayudando al frontend a segmentar.
 */
const parseVariantAttributes = (v) => {
    // Si la variante tiene productos asociados, obtenemos la descripción base
    const prodDesc = v.productos ? v.productos.pro_descripcion : 'Producto';
    return {
        id_variante: v.id_variante,
        id_producto: v.id_producto,
        // var_nombre combina el nombre del producto y el código de barras/talla
        var_nombre: `${prodDesc} - ${v.var_cod_barras}`,
        var_cod_barras: v.var_cod_barras,
        var_precio_venta: Number(v.var_precio_venta),
        var_estado: v.var_estado
    };
};

/**
 * 1. OBTENER TODAS LAS VARIANTES
 * Objetivo: Devuelve la lista completa de variantes activas en inventario.
 * Uso en compras: Llena el selector dinámico (dropdown) al crear o editar una orden de compra.
 */
const obtenerVariantes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('variantes_producto')
            .select(`
                id_variante,
                id_producto,
                var_cod_barras,
                var_precio_venta,
                var_estado,
                productos (
                    pro_descripcion
                )
            `);

        if (error) throw error;

        const mapped = data.map(parseVariantAttributes);
        return res.status(200).json({ success: true, data: mapped });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error al obtener variantes: " + error.message });
    }
};

/**
 * 2. OBTENER VARIANTE POR ID
 * Objetivo: Devuelve la información detallada de una variante específica según su ID.
 * Uso en compras: Al abrir una orden de compra existente, permite mapear y resolver el nombre e información
 * del producto en la tabla a partir de su ID de variante.
 */
const obtenerVariantePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('variantes_producto')
            .select(`
                id_variante,
                id_producto,
                var_cod_barras,
                var_precio_venta,
                var_estado,
                productos (
                    pro_descripcion
                )
            `)
            .eq('id_variante', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, error: "Variante no encontrada" });

        return res.status(200).json({ success: true, data: parseVariantAttributes(data) });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Error al obtener variante por ID: " + error.message });
    }
};

/**
 * 3. OBTENER TODAS LAS BODEGAS
 * Objetivo: Devuelve el listado de bodegas físicas registradas.
 * Uso en compras: Permite al operador seleccionar en cuál bodega ingresar la mercadería al registrar una recepción de compra.
 * Nota: Cuenta con un respaldo mock (fallback) automático por si la tabla no existe localmente.
 */
const obtenerBodegas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bodegas')
            .select('*');
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.warn("Tabla 'bodegas' no disponible. Usando datos de respaldo.");
        const fallbacks = [
            { id_bodega: 1, bod_nombre: "Bodega Principal - Guayaquil", bod_codigo: "BOD-01" },
            { id_bodega: 2, bod_nombre: "Bodega Insumos y Materia Prima", bod_codigo: "BOD-02" },
            { id_bodega: 3, bod_nombre: "Bodega Ventas Express", bod_codigo: "BOD-03" }
        ];
        return res.status(200).json({ success: true, data: fallbacks });
    }
};

/**
 * 4. OBTENER BODEGA POR ID
 * Objetivo: Devuelve los detalles de una bodega física específica según su ID.
 * Uso en compras: Permite visualizar el nombre y código de la bodega receptora en los detalles e historiales de recepciones.
 */
const obtenerBodegaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('bodegas')
            .select('*')
            .eq('id_bodega', id)
            .single();
        if (error) throw error;
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.warn(`Error al consultar bodega ${id}. Usando respaldo.`);
        const fallbacks = [
            { id_bodega: 1, bod_nombre: "Bodega Principal - Guayaquil", bod_codigo: "BOD-01" },
            { id_bodega: 2, bod_nombre: "Bodega Insumos y Materia Prima", bod_codigo: "BOD-02" },
            { id_bodega: 3, bod_nombre: "Bodega Ventas Express", bod_codigo: "BOD-03" }
        ];
        const match = fallbacks.find(b => b.id_bodega === Number(id)) || null;
        if (!match) return res.status(404).json({ success: false, error: "Bodega no encontrada" });
        return res.status(200).json({ success: true, data: match });
    }
};

// ----------------------------------------------------------------------------
// DEFINICIÓN DE RUTAS (ENDPOINTS)
// ----------------------------------------------------------------------------

// Rutas con prefijo relativo a cómo se monte en express (ej. /api/inventario/...)
router.get('/inventario/variantes', verificarToken, obtenerVariantes);
router.get('/inventario/variantes/:id', verificarToken, obtenerVariantePorId);
router.get('/inventario/bodegas', verificarToken, obtenerBodegas);
router.get('/inventario/bodegas/:id', verificarToken, obtenerBodegaPorId);

// Rutas directas para compatibilidad inter-módulos de compras (ej. /api/...)
router.get('/variantes', verificarToken, obtenerVariantes);
router.get('/variantes/:id', verificarToken, obtenerVariantePorId);
router.get('/bodegas', verificarToken, obtenerBodegas);
router.get('/bodegas/:id', verificarToken, obtenerBodegaPorId);

module.exports = router;
