const supabase = require('../config/db');
const VendedorModel = require('../models/vendedorModel');
const { round } = require('../common/dinero');
const { DOC_TIPO, DOC_ESTADO } = require('../common/dominios');

const VendedorService = {
    /**
     * Comisión proyectada = Σ DOC_TOTAL(FAC APR del vendedor en período) × VEN_COMISION/100.
     * TODO[OI-06]: el período por defecto es MENSUAL; ¿la fuente oficial viene de api-talento-humano?
     * Implementado como rango { desde, hasta } para máxima flexibilidad.
     */
    comisionProyectada: async (vendedorId, { desde, hasta }) => {
        const vendedor = await VendedorModel.getById(vendedorId);
        if (!vendedor) {
            const err = new Error('Vendedor no encontrado.');
            err.status = 404;
            throw err;
        }

        const { data: docs, error } = await supabase
            .from('documentos')
            .select('doc_total')
            .eq('id_vendedor', vendedorId)
            .eq('doc_tipo', DOC_TIPO.FAC)
            .eq('doc_estado', DOC_ESTADO.APR)
            .gte('doc_emision', desde)
            .lte('doc_emision', hasta);

        if (error) throw new Error(error.message);

        const totalVentas = (docs || []).reduce((s, d) => s + Number(d.doc_total), 0);
        const comision = round(totalVentas * Number(vendedor.ven_comision) / 100, 2);

        return {
            id_vendedor: vendedorId,
            // Nombre/empleado resuelto por el frontend vía api-talento-humano.
            id_empleado: vendedor.id_empleado,
            total_ventas: round(totalVentas, 2),
            porcentaje_comision: vendedor.ven_comision,
            comision_proyectada: comision,
        };
    },

    /**
     * Cumplimiento de meta = total_ventas / VEN_META × 100 %.
     * TODO[OI-06]: confirmar si el período activo viene de api-talento-humano.
     */
    cumplimientoMeta: async (vendedorId, { desde, hasta }) => {
        const { total_ventas, id_empleado } = await VendedorService.comisionProyectada(vendedorId, { desde, hasta });
        const vendedor = await VendedorModel.getById(vendedorId);
        const meta = Number(vendedor.ven_meta);
        const cumplimiento = meta > 0 ? round((total_ventas / meta) * 100, 2) : 0;

        return {
            id_vendedor: vendedorId,
            id_empleado,
            total_ventas,
            meta,
            cumplimiento_pct: cumplimiento,
        };
    },

    /**
     * Ranking de vendedores por total de ventas en el período.
     * El frontend resuelve el nombre vía api-talento-humano usando id_empleado.
     */
    rankingVendedores: async ({ desde, hasta }) => {
        const { data: vendedores, error } = await supabase.from('vendedores').select('*').eq('ven_estado', 'ACT');
        if (error) throw new Error(error.message);

        const ranking = await Promise.all(
            (vendedores || []).map(async (v) => {
                const r = await VendedorService.comisionProyectada(v.id_vendedor, { desde, hasta });
                return { ...r, ven_meta: v.ven_meta };
            })
        );

        return ranking.sort((a, b) => b.total_ventas - a.total_ventas);
    },
};

module.exports = VendedorService;
