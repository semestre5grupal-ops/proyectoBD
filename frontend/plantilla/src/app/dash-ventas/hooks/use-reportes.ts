import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format } from "date-fns";
import * as reportesService from "../services/reportes-service";
import type {
  Rango,
  KpisResponse,
  VentasResponse,
  ComercialResponse,
  ClientesResponse,
  ProductosResponse,
} from "../services/reportes-service";

function hoy() {
  return format(new Date(), "yyyy-MM-dd");
}

function rangoMesActual(): Rango {
  const now = new Date();
  return {
    desde: format(startOfMonth(now), "yyyy-MM-dd"),
    hasta: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

export function useReportes() {
  const [loading, setLoading] = useState(false);
  const [rango, setRango] = useState<Rango>(rangoMesActual);

  const [kpis, setKpis] = useState<KpisResponse | null>(null);
  const [ventas, setVentas] = useState<VentasResponse | null>(null);
  const [comercial, setComercial] = useState<ComercialResponse | null>(null);
  const [clientes, setClientes] = useState<ClientesResponse | null>(null);
  const [productos, setProductos] = useState<ProductosResponse | null>(null);

  const cargarTodo = useCallback(async (r: Rango) => {
    setLoading(true);
    const results = await Promise.allSettled([
      reportesService.getKpis(r),
      reportesService.getVentas(r),
      reportesService.getComercial(r),
      reportesService.getClientes(r),
      reportesService.getProductos(r),
    ]);

    const [rKpis, rVentas, rComercial, rClientes, rProductos] = results;

    if (rKpis.status === "fulfilled") setKpis(rKpis.value);
    else toast.error("Error al cargar KPIs de ventas");

    if (rVentas.status === "fulfilled") setVentas(rVentas.value);
    else toast.error("Error al cargar datos de facturación");

    if (rComercial.status === "fulfilled") setComercial(rComercial.value);
    else toast.error("Error al cargar datos comerciales");

    if (rClientes.status === "fulfilled") setClientes(rClientes.value);
    else toast.error("Error al cargar datos de clientes");

    if (rProductos.status === "fulfilled") setProductos(rProductos.value);
    else toast.error("Error al cargar datos de productos");

    setLoading(false);
  }, []);

  const actualizarRango = useCallback(
    (nuevoRango: Rango) => {
      setRango(nuevoRango);
      cargarTodo(nuevoRango);
    },
    [cargarTodo]
  );

  useEffect(() => {
    cargarTodo(rango);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    rango,
    setRango: actualizarRango,
    kpis,
    ventas,
    comercial,
    clientes,
    productos,
    refrescar: () => cargarTodo(rango),
    hoy,
  };
}
