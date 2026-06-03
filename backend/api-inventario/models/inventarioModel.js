const supabase = require('../config/db');

const InventarioModel = {
    // 1. Obtener el registro de inventario (Trae saldo, egresos e ingresos acumulados)
    obtenerStockVariante: async (idVariante) => {
        const { data, error } = await supabase
            .from('inventario_bodegas')
            .select('id_bodega, inv_periodo, inv_saldo_final, inv_qty_egresos, inv_qty_ingresos')
            .eq('id_variante', idVariante)
            .limit(1);

        if (error) throw new Error(error.message);
        return data && data.length > 0 ? data[0] : null;
    },

    // 2. Actualizar saldo final y cantidad de egresos (Ventas de Gabriel)
    actualizarStock: async (idBodega, idVariante, invPeriodo, nuevoSaldoFinal, nuevaQtyEgresos) => {
        const { data, error } = await supabase
            .from('inventario_bodegas')
            .update({
                inv_saldo_final: nuevoSaldoFinal,
                inv_qty_egresos: nuevaQtyEgresos
            })
            .eq('id_bodega', idBodega)
            .eq('id_variante', idVariante)
            .eq('inv_periodo', invPeriodo)
            .select();

        if (error) throw new Error(error.message);
        return data;
    },

    // 3. Actualizar saldo final y cantidad de ingresos (Compras de Liz)
    actualizarStockIngreso: async (idBodega, idVariante, invPeriodo, nuevoSaldoFinal, nuevaQtyIngresos) => {
        const { data, error } = await supabase
            .from('inventario_bodegas')
            .update({
                inv_saldo_final: nuevoSaldoFinal,
                inv_qty_ingresos: nuevaQtyIngresos
            })
            .eq('id_bodega', idBodega)
            .eq('id_variante', idVariante)
            .eq('inv_periodo', invPeriodo)
            .select();

        if (error) throw new Error(error.message);
        return data;
    },

    // 4. Registrar la auditoría de recepción física en base al script comercialRDA2
    registrarRecepcion: async (idBodega, descripcion, numProductos, usuario) => {
        const { data, error } = await supabase
            .from('recepciones')
            .insert([
                {
                    id_bodega: idBodega,
                    rec_descripcion: descripcion,
                    rec_fechahora: new Date(),
                    rec_num_productos: numProductos,
                    usu_responsable: usuario,
                    rec_estado: 'ACT'
                }
            ])
            .select();

        if (error) throw new Error(error.message);
        return data[0];
    },

    // ─── Endpoints para api-ventas (saga de stock) ───────────────────────────

    // Obtiene datos de una variante incluyendo precio de venta.
    obtenerVariante: async (idVariante) => {
        const { data, error } = await supabase
            .from('variantes_producto')
            .select('id_variante, var_cod_barras, var_precio_venta, var_estado, productos(pro_descripcion)')
            .eq('id_variante', idVariante)
            .single();
        if (error) throw new Error(error.message);
        return {
            id_variante: data.id_variante,
            nombre: data.productos?.pro_descripcion || data.var_cod_barras,
            valor_unitario: data.var_precio_venta,
            iva_incluido: false,
        };
    },

    // Verifica disponibilidad de un lote de ítems sin modificar stock.
    verificarStockLote: async (items) => {
        const resultado = [];
        for (const item of items) {
            const stock = await InventarioModel.obtenerStockVariante(item.id_variante);
            resultado.push({
                id_variante: item.id_variante,
                suficiente: stock ? stock.inv_saldo_final >= Number(item.cantidad) : false,
                disponible: stock ? stock.inv_saldo_final : 0,
            });
        }
        return resultado;
    },

    // Descuenta stock de forma inmediata (implementación mínima de reserva).
    // TODO[OI-08]: saga completa requiere tabla de reservas para distinguir reservar/confirmar.
    // TODO[OI-03]: reserva_id es efímero; no se persiste en BD de ventas.
    reservarStockLote: async (documentoId, items) => {
        for (const item of items) {
            const stock = await InventarioModel.obtenerStockVariante(item.id_variante);
            if (!stock || stock.inv_saldo_final < Number(item.cantidad)) {
                throw new Error(`Stock insuficiente para variante ${item.id_variante}.`);
            }
            await InventarioModel.actualizarStock(
                stock.id_bodega,
                item.id_variante,
                stock.inv_periodo,
                stock.inv_saldo_final - Number(item.cantidad),
                (stock.inv_qty_egresos || 0) + Number(item.cantidad)
            );
        }
        return { reserva_id: `${documentoId}-${Date.now()}` };
    },

    // Libera (revierte) stock descontado en reservarStockLote.
    liberarStockLote: async (items) => {
        for (const item of items) {
            const stock = await InventarioModel.obtenerStockVariante(item.id_variante);
            if (!stock) continue;
            await InventarioModel.actualizarStock(
                stock.id_bodega,
                item.id_variante,
                stock.inv_periodo,
                stock.inv_saldo_final + Number(item.cantidad),
                Math.max(0, (stock.inv_qty_egresos || 0) - Number(item.cantidad))
            );
        }
    },

    // Repone stock (para anulaciones o devoluciones NCR). TODO[OI-07]
    reponerStockLote: async (items) => {
        for (const item of items) {
            const stock = await InventarioModel.obtenerStockVariante(item.id_variante);
            if (!stock) continue;
            await InventarioModel.actualizarStockIngreso(
                stock.id_bodega,
                item.id_variante,
                stock.inv_periodo,
                stock.inv_saldo_final + Number(item.cantidad),
                (stock.inv_qty_ingresos || 0) + Number(item.cantidad)
            );
        }
    },

    // 5. Obtener todo el catálogo unificado para el E-commerce
    obtenerCatalogoParaEcommerce: async () => {
        // Obtenemos los productos con sus variantes e inventarios
        const { data: productos, error: errProd } = await supabase
            .from('productos')
            .select(`
                id_producto,
                pro_descripcion,
                pro_valor_compra,
                pro_estado,
                variantes_producto (
                    id_variante,
                    var_cod_barras,
                    var_precio_venta,
                    var_estado
                )
            `)
            .eq('pro_estado', 'ACT');

        if (errProd) throw new Error(errProd.message);

        const { data: stock, error: errStock } = await supabase
            .from('inventario_bodegas')
            .select('id_variante, inv_saldo_final');

        if (errStock) throw new Error(errStock.message);

        // Mapeamos y unificamos la data en formato limpio para NoSQL
        return productos.map(p => {
            return {
                id_producto: p.id_producto,
                descripcion: p.pro_descripcion,
                precio_base: p.pro_valor_compra,
                variantes: (p.variantes_producto || []).map(v => {
                    const stockFisico = stock.find(s => s.id_variante === v.id_variante);
                    return {
                        id_variante: v.id_variante,
                        codigo_barras: v.var_cod_barras,
                        precio_venta: v.var_precio_venta,
                        stock: stockFisico ? stockFisico.inv_saldo_final : 0
                    };
                })
            };
        });
    }
};

module.exports = InventarioModel;