const supabase = require('../config/db');
const { DOC_TIPO, DOC_ESTADO } = require('../common/dominios');
const { round } = require('../common/dinero');
const VendedorService = require('./vendedor.service');

// Documentos FAC aprobados dentro del rango de fechas.
async function facAprobadas(desde, hasta) {
    const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('doc_tipo', DOC_TIPO.FAC)
        .eq('doc_estado', DOC_ESTADO.APR)
        .gte('doc_emision', desde)
        .lte('doc_emision', hasta);
    if (error) throw new Error(error.message);
    return data || [];
}

const ReporteService = {
    // KPIs globales (año actual + mes actual + conteos).
    kpis: async () => {
        const ahora = new Date();
        const inicioAnio = new Date(ahora.getFullYear(), 0, 1).toISOString();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
        const fin = ahora.toISOString();

        const [resAnio, resMes, resNcr] = await Promise.all([
            supabase.from('documentos').select('doc_total')
                .eq('doc_tipo', DOC_TIPO.FAC).eq('doc_estado', DOC_ESTADO.APR)
                .gte('doc_emision', inicioAnio).lte('doc_emision', fin),
            supabase.from('documentos').select('doc_total')
                .eq('doc_tipo', DOC_TIPO.FAC).eq('doc_estado', DOC_ESTADO.APR)
                .gte('doc_emision', inicioMes).lte('doc_emision', fin),
            supabase.from('documentos').select('id_documento', { count: 'exact' })
                .eq('doc_tipo', DOC_TIPO.NCR).not('doc_id_documento', 'is', null),
        ]);

        if (resAnio.error) throw new Error(resAnio.error.message);
        if (resMes.error) throw new Error(resMes.error.message);
        if (resNcr.error) throw new Error(resNcr.error.message);

        return {
            ventas_anio: round((resAnio.data || []).reduce((s, d) => s + Number(d.doc_total), 0), 2),
            ventas_mes: round((resMes.data || []).reduce((s, d) => s + Number(d.doc_total), 0), 2),
            num_fac_aprobadas: (resAnio.data || []).length,
            num_ncr: (resNcr.data || []).length,
        };
    },

    // D1 — Ventas/Facturación.
    ventasFacturacion: async ({ desde, hasta }) => {
        const docs = await facAprobadas(desde, hasta);
        if (docs.length === 0) return { ingresos: 0, ticket_promedio: 0, subtotal: 0, descuento: 0, iva: 0, ncr: 0 };

        const ingresos = round(docs.reduce((s, d) => s + Number(d.doc_total), 0), 2);
        const ticket_promedio = round(ingresos / docs.length, 2);
        const subtotal = round(docs.reduce((s, d) => s + Number(d.doc_subtotal || 0), 0), 2);
        const descuento = round(docs.reduce((s, d) => s + Number(d.doc_descuento || 0), 0), 2);
        const iva = round(docs.reduce((s, d) => s + Number(d.doc_iva || 0), 0), 2);

        const { data: ncrDocs, error: errNcr } = await supabase
            .from('documentos')
            .select('doc_total')
            .eq('doc_tipo', DOC_TIPO.NCR)
            .not('doc_id_documento', 'is', null)
            .gte('doc_emision', desde)
            .lte('doc_emision', hasta);
        if (errNcr) throw new Error(errNcr.message);

        const ncr = round((ncrDocs || []).reduce((s, d) => s + Number(d.doc_total), 0), 2);

        return { ingresos, ticket_promedio, subtotal, descuento, iva, ncr };
    },

    // D2 — Comercial: metas, comisiones, ranking.
    comercial: async ({ desde, hasta }) => {
        const { data: vendedores, error } = await supabase
            .from('vendedores').select('id_vendedor').eq('ven_estado', 'ACT');
        if (error) throw new Error(error.message);

        const datos = await Promise.all(
            (vendedores || []).map(async (v) => {
                const [comision, meta] = await Promise.all([
                    VendedorService.comisionProyectada(v.id_vendedor, { desde, hasta }),
                    VendedorService.cumplimientoMeta(v.id_vendedor, { desde, hasta }),
                ]);
                return { ...comision, ...meta };
            })
        );

        return datos.sort((a, b) => b.total_ventas - a.total_ventas);
    },

    // D3 — Clientes/Geografía.
    clientesGeografia: async ({ desde, hasta }) => {
        const { data: docs, error } = await supabase
            .from('documentos')
            .select('doc_total, id_cliente, clientes(cli_categoria, id_ciudad, ciudades(ciu_nombre))')
            .eq('doc_tipo', DOC_TIPO.FAC)
            .eq('doc_estado', DOC_ESTADO.APR)
            .gte('doc_emision', desde)
            .lte('doc_emision', hasta);
        if (error) throw new Error(error.message);

        const porCiudad = {};
        const porCategoria = {};
        const porCliente = {};

        for (const d of (docs || [])) {
            const ciudad = d.clientes?.ciudades?.ciu_nombre || 'Sin ciudad';
            const cat = d.clientes?.cli_categoria || 0;
            const idCli = d.id_cliente;
            const total = Number(d.doc_total);

            porCiudad[ciudad] = round((porCiudad[ciudad] || 0) + total, 2);
            porCategoria[cat] = round((porCategoria[cat] || 0) + total, 2);
            porCliente[idCli] = round((porCliente[idCli] || 0) + total, 2);
        }

        const top10Clientes = Object.entries(porCliente)
            .map(([id_cliente, total]) => ({ id_cliente: Number(id_cliente), total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return {
            ventas_por_ciudad: Object.entries(porCiudad).map(([ciudad, total]) => ({ ciudad, total })),
            ventas_por_categoria: Object.entries(porCategoria).map(([categoria, total]) => ({ categoria: Number(categoria), total })),
            top10_clientes: top10Clientes,
        };
    },

    // D4 — Productos: Top variantes.
    productos: async ({ desde, hasta }) => {
        // Obtener IDs de FAC APR en el período.
        const { data: docIds, error: errDocs } = await supabase
            .from('documentos')
            .select('id_documento')
            .eq('doc_tipo', DOC_TIPO.FAC)
            .eq('doc_estado', DOC_ESTADO.APR)
            .gte('doc_emision', desde)
            .lte('doc_emision', hasta);
        if (errDocs) throw new Error(errDocs.message);

        if (!docIds || docIds.length === 0) return { top_variantes: [] };

        const ids = docIds.map(d => d.id_documento);
        const { data: lineas, error: errLineas } = await supabase
            .from('productosxdocumento')
            .select('id_variante, pxd_cantidad, pxd_valor_subtotal')
            .in('id_documento', ids);
        if (errLineas) throw new Error(errLineas.message);

        const porVariante = {};
        for (const l of (lineas || [])) {
            const id = l.id_variante;
            if (!porVariante[id]) porVariante[id] = { id_variante: id, cantidad_total: 0, ingresos_total: 0 };
            porVariante[id].cantidad_total += Number(l.pxd_cantidad);
            porVariante[id].ingresos_total = round(porVariante[id].ingresos_total + Number(l.pxd_valor_subtotal || 0), 2);
        }

        const top_variantes = Object.values(porVariante)
            .sort((a, b) => b.cantidad_total - a.cantidad_total)
            .slice(0, 20);

        return { top_variantes };
    },
};

module.exports = ReporteService;
