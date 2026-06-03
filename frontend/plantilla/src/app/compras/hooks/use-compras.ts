import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import * as comprasService from "../services/compras-service";
import * as inventarioService from "../services/inventario-service";

export function useCompras() {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<comprasService.Proveedor[]>([]);
  const [cities, setCities] = useState<comprasService.Ciudad[]>([]);
  const [orders, setOrders] = useState<comprasService.Compra[]>([]);
  const [receptions, setReceptions] = useState<comprasService.Recepcion[]>([]);
  const [returns, setReturns] = useState<comprasService.Devolucion[]>([]);
  
  const [variants, setVariants] = useState<inventarioService.Variante[]>([]);
  const [warehouses, setWarehouses] = useState<inventarioService.Bodega[]>([]);

  const fetchCities = useCallback(async () => {
    try {
      const data = await comprasService.getCiudades();
      setCities(data);
    } catch (e: any) {
      console.error(e);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await comprasService.getProveedores();
      setSuppliers(data);
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar proveedores");
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await comprasService.getCompras();
      setOrders(data);
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar órdenes de compra");
    }
  }, []);

  const fetchReceptions = useCallback(async () => {
    try {
      const data = await comprasService.getRecepciones();
      setReceptions(data);
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar recepciones");
    }
  }, []);

  const fetchReturns = useCallback(async () => {
    try {
      const data = await comprasService.getDevoluciones();
      setReturns(data);
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar devoluciones");
    }
  }, []);

  const fetchCatalogues = useCallback(async () => {
    try {
      const [vars, whs] = await Promise.all([
        inventarioService.getVariantes(),
        inventarioService.getBodegas()
      ]);
      setVariants(vars);
      setWarehouses(whs);
    } catch (e: any) {
      console.error(e);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchCities(),
      fetchSuppliers(),
      fetchOrders(),
      fetchReceptions(),
      fetchReturns(),
      fetchCatalogues()
    ]);
    setLoading(false);
  }, [fetchCities, fetchSuppliers, fetchOrders, fetchReceptions, fetchReturns, fetchCatalogues]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Actions
  const handleCreateSupplier = async (supplier: comprasService.Proveedor) => {
    try {
      await comprasService.createProveedor(supplier);
      toast.success("Proveedor creado con éxito");
      await fetchSuppliers();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Error al crear proveedor");
      return false;
    }
  };

  const handleUpdateSupplier = async (id: number, supplier: Partial<comprasService.Proveedor>) => {
    try {
      await comprasService.updateProveedor(id, supplier);
      toast.success("Proveedor actualizado con éxito");
      await fetchSuppliers();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar proveedor");
      return false;
    }
  };

  const handleCreateOrder = async (order: comprasService.Compra) => {
    try {
      await comprasService.createCompra(order);
      toast.success("Orden de compra creada con éxito");
      await fetchOrders();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Error al crear orden de compra");
      return false;
    }
  };

  const handleUpdateOrderEstado = async (id: number, estado: 'ABI' | 'APR' | 'ANU') => {
    try {
      await comprasService.updateCompraEstado(id, estado);
      toast.success(`Orden de compra actualizada a ${estado}`);
      await fetchOrders();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar estado de la orden");
      return false;
    }
  };

  const handleUpdateOrder = async (id: number, order: comprasService.Compra) => {
    try {
      await comprasService.updateCompra(id, order);
      toast.success("Orden de compra actualizada con éxito");
      await fetchOrders();
      return true;
    } catch (e: any) {
      toast.error(e.message || "Error al actualizar la orden de compra");
      return false;
    }
  };

  const handleCreateReception = async (reception: comprasService.Recepcion) => {
    try {
      // 1. Create the reception in api-compras
      const created = await comprasService.createRecepcion(reception);
      toast.success("Recepción registrada con éxito en compras");
      await fetchReceptions();
      return created;
    } catch (e: any) {
      toast.error(e.message || "Error al registrar recepción");
      return null;
    }
  };

  const handleApproveReception = async (id: number, details: comprasService.Recepcion) => {
    try {
      // Approve in Compras backend
      await comprasService.aprobarRecepcion(id);
      
      // Inject variants into inventory
      let successIngress = true;
      for (const item of details.items) {
        try {
          await inventarioService.ingresarStock({
            idVariante: item.id_variante,
            cantidad: item.pxr_qty_recibida,
            idBodega: details.id_bodega,
            descripcion: `Ingreso por recepción compras PO #${details.id_compra}`,
            usuario: details.usu_responsable || "admin"
          });
        } catch (stockErr: any) {
          console.error("Error updating inventory variant stock:", item.id_variante, stockErr);
          successIngress = false;
        }
      }

      if (successIngress) {
        toast.success("Recepción aprobada e inventario incrementado con éxito");
      } else {
        toast.warning("Recepción aprobada en compras, pero algunos stocks de inventario fallaron al actualizar");
      }

      await Promise.all([fetchReceptions(), fetchOrders(), fetchCatalogues()]);
      return true;
    } catch (e: any) {
      toast.error(e.message || "Error al aprobar recepción");
      return false;
    }
  };

  const handleCreateReturn = async (devolucion: comprasService.Devolucion) => {
    try {
      const created = await comprasService.createDevolucion(devolucion);
      toast.success("Devolución registrada en compras");
      await fetchReturns();
      return created;
    } catch (e: any) {
      toast.error(e.message || "Error al registrar devolución");
      return null;
    }
  };

  const handleApproveReturn = async (id: number, details: comprasService.Devolucion) => {
    try {
      await comprasService.aprobarDevolucion(id);

      // Decrement variants in inventory
      let successEgress = true;
      for (const item of details.items) {
        try {
          await inventarioService.descontarStock({
            idVariante: item.id_variante,
            cantidad: item.pxdc_cantidad_devuelta
          });
        } catch (stockErr: any) {
          console.error("Error decrementing inventory variant stock:", item.id_variante, stockErr);
          successEgress = false;
        }
      }

      if (successEgress) {
        toast.success("Devolución aprobada y stock descontado con éxito");
      } else {
        toast.warning("Devolución aprobada en compras, pero algunos stocks de inventario fallaron al descontar");
      }

      await Promise.all([fetchReturns(), fetchOrders(), fetchCatalogues()]);
      return true;
    } catch (e: any) {
      toast.error(e.message || "Error al aprobar devolución");
      return false;
    }
  };

  return {
    loading,
    suppliers,
    cities,
    orders,
    receptions,
    returns,
    variants,
    warehouses,
    refreshAll: loadAll,
    handleCreateSupplier,
    handleUpdateSupplier,
    handleCreateOrder,
    handleUpdateOrder,
    handleUpdateOrderEstado,
    handleCreateReception,
    handleApproveReception,
    handleCreateReturn,
    handleApproveReturn
  };
}
