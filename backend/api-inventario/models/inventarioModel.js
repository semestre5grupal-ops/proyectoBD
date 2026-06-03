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
    },

    crearCabeceraAjustePendiente: async (idBodega, idVariante, cantidad, usuario, descripcion) => {
        // 1. Insertar Cabecera en la tabla 'ajustes'
        const { data: cabecera, error: errCabecera } = await supabase
            .from('ajustes')
            .insert({
                id_bodega: Number(idBodega),
                aju_fechahora: new Date().toISOString(),
                aju_descripcion: descripcion,
                aju_num_produc_: 1,
                usu_responsable: usuario,
                aju_estado: 'PEN'
            })
            .select('id_ajuste')
            .single();

        if (errCabecera) {
            console.error('🔥 ERROR SUPABASE [crearCabeceraAjustePendiente - ajustes]:', errCabecera);
            throw new Error(errCabecera.message);
        }

        const idInsertado = cabecera.id_ajuste;

        // 2. Insertar Detalle en la tabla 'proxaju'
        const qty = Number(cantidad);
        const { error: errDetalle } = await supabase
            .from('proxaju')
            .insert({
                id_variante: Number(idVariante),
                id_ajuste: idInsertado,
                pxa_stock_sistema: 0,
                pxa_stock_fisico_real: qty,
                pxa_qty_ajustada: qty,
                pxa_tipo_ajuste: qty > 0 ? 'I' : 'E',
                pxa_motivo_ajuste: descripcion,
                pxa_estado: 'PEN'
            });

        if (errDetalle) {
            console.error('🔥 ERROR SUPABASE [crearCabeceraAjustePendiente - proxaju]:', errDetalle);
            throw new Error(errDetalle.message);
        }

        return idInsertado; // Retorna el Número Entero (SERIAL)
    },

    aprobarAjusteFisico: async (idCabecera, idBodega, idVariante, cantidad, usuario) => {
        const periodo = new Date().toISOString().slice(0, 7);
        
        const { data, error } = await supabase.rpc('fn_aprobar_ajuste_inventario', {
            p_id_cabecera: Number(idCabecera),
            p_id_bodega: Number(idBodega),
            p_id_variante: Number(idVariante),
            p_cantidad: Number(cantidad),
            p_usuario: usuario,
            p_periodo: periodo
        });

        if (error) {
            console.error('🔥 ERROR SUPABASE RPC [fn_aprobar_ajuste_inventario]:', error);
            throw new Error(error.message);
        }

        return data;
    }
};

module.exports = InventarioModel;