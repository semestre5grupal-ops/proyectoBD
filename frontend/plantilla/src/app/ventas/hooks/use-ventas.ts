import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  getDocumentos, getClientes, getVendedores, getCiudades, getMetodosPago,
  createDocumento, updateDocumento, deleteDocumento,
  emitirDocumento, aprobarDocumento, anularDocumento, generarFactura, generarNotaCredito,
  createCliente, updateCliente, deleteCliente,
  createVendedor, updateVendedor, deleteVendedor,
  type Documento, type Cliente, type Vendedor, type Ciudad, type MetodoPago, type PagoInput,
} from "../services/ventas-service";

export function useVentas() {
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getDocumentos(),
      getClientes(),
      getVendedores(),
      getCiudades(),
      getMetodosPago(),
    ]);

    const [rdocs, rclientes, rvendedores, rciudades, rmetodos] = results;

    if (rdocs.status === "fulfilled") setDocumentos(rdocs.value);
    else toast.error(`Documentos: ${rdocs.reason?.message ?? "Error de carga"}`);

    if (rclientes.status === "fulfilled") setClientes(rclientes.value);
    else toast.error(`Clientes: ${rclientes.reason?.message ?? "Error de carga"}`);

    if (rvendedores.status === "fulfilled") setVendedores(rvendedores.value);
    else toast.error(`Vendedores: ${rvendedores.reason?.message ?? "Error de carga"}`);

    if (rciudades.status === "fulfilled") setCiudades(rciudades.value);
    else toast.error(`Ciudades: ${rciudades.reason?.message ?? "Error de carga"}`);

    if (rmetodos.status === "fulfilled") setMetodosPago(rmetodos.value);
    else toast.error(`Métodos de pago: ${rmetodos.reason?.message ?? "Error de carga"}`);

    setLoading(false);
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  // ── Documentos ─────────────────────────────────────────────────────────────

  const handleCreateDocumento = async (payload: Omit<Documento, "id_documento">): Promise<boolean> => {
    try {
      const nuevo = await createDocumento(payload);
      setDocumentos(prev => [nuevo, ...prev]);
      toast.success("Documento creado correctamente.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al crear documento: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleUpdateDocumento = async (id: number, payload: Partial<Documento>): Promise<boolean> => {
    try {
      const actualizado = await updateDocumento(id, payload);
      setDocumentos(prev => prev.map(d => d.id_documento === id ? { ...d, ...actualizado } : d));
      toast.success("Documento actualizado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al actualizar: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleDeleteDocumento = async (id: number): Promise<boolean> => {
    try {
      await deleteDocumento(id);
      setDocumentos(prev => prev.filter(d => d.id_documento !== id));
      toast.success("Documento eliminado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al eliminar: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleEmitir = async (id: number): Promise<boolean> => {
    try {
      const actualizado = await emitirDocumento(id);
      setDocumentos(prev => prev.map(d => d.id_documento === id ? { ...d, ...actualizado } : d));
      toast.success("Documento emitido.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al emitir: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleAprobar = async (id: number, pagos: PagoInput[]): Promise<boolean> => {
    try {
      const actualizado = await aprobarDocumento(id, pagos);
      setDocumentos(prev => prev.map(d => d.id_documento === id ? { ...d, ...actualizado } : d));
      toast.success("Documento aprobado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al aprobar: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleAnular = async (id: number): Promise<boolean> => {
    try {
      const actualizado = await anularDocumento(id);
      setDocumentos(prev => prev.map(d => d.id_documento === id ? { ...d, ...actualizado } : d));
      toast.success("Documento anulado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al anular: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleGenerarFactura = async (id: number): Promise<boolean> => {
    try {
      const nueva = await generarFactura(id);
      setDocumentos(prev => [nueva, ...prev]);
      toast.success("Factura generada desde proforma.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al generar factura: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleGenerarNotaCredito = async (id: number, descripcion?: string): Promise<boolean> => {
    try {
      const nueva = await generarNotaCredito(id, descripcion);
      setDocumentos(prev => [nueva, ...prev]);
      toast.success("Nota de crédito generada.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al generar NCR: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  // ── Clientes ───────────────────────────────────────────────────────────────

  const handleCreateCliente = async (payload: Omit<Cliente, "id_cliente">): Promise<boolean> => {
    try {
      const nuevo = await createCliente(payload);
      setClientes(prev => [...prev, nuevo]);
      toast.success("Cliente creado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al crear cliente: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleUpdateCliente = async (id: number, payload: Partial<Cliente>): Promise<boolean> => {
    try {
      const actualizado = await updateCliente(id, payload);
      setClientes(prev => prev.map(c => c.id_cliente === id ? { ...c, ...actualizado } : c));
      toast.success("Cliente actualizado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al actualizar cliente: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleDeleteCliente = async (id: number): Promise<boolean> => {
    try {
      await deleteCliente(id);
      setClientes(prev => prev.filter(c => c.id_cliente !== id));
      toast.success("Cliente eliminado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al eliminar cliente: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  // ── Vendedores ─────────────────────────────────────────────────────────────

  const handleCreateVendedor = async (payload: Omit<Vendedor, "id_vendedor">): Promise<boolean> => {
    try {
      const nuevo = await createVendedor(payload);
      setVendedores(prev => [...prev, nuevo]);
      toast.success("Vendedor creado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al crear vendedor: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleUpdateVendedor = async (id: number, payload: Partial<Vendedor>): Promise<boolean> => {
    try {
      const actualizado = await updateVendedor(id, payload);
      setVendedores(prev => prev.map(v => v.id_vendedor === id ? { ...v, ...actualizado } : v));
      toast.success("Vendedor actualizado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al actualizar vendedor: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const handleDeleteVendedor = async (id: number): Promise<boolean> => {
    try {
      await deleteVendedor(id);
      setVendedores(prev => prev.filter(v => v.id_vendedor !== id));
      toast.success("Vendedor eliminado.");
      return true;
    } catch (err: unknown) {
      toast.error(`Error al eliminar vendedor: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  return {
    loading,
    documentos, clientes, vendedores, ciudades, metodosPago,
    handleCreateDocumento, handleUpdateDocumento, handleDeleteDocumento,
    handleEmitir, handleAprobar, handleAnular,
    handleGenerarFactura, handleGenerarNotaCredito,
    handleCreateCliente, handleUpdateCliente, handleDeleteCliente,
    handleCreateVendedor, handleUpdateVendedor, handleDeleteVendedor,
    recargar: cargarTodo,
  };
}
