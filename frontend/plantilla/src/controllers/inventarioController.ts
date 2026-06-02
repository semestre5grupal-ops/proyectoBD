/**
 * inventarioController.ts
 * ------------------------
 * CAPA DE CONTROLADORES — Módulo de Inventario
 * Proyecto RDA3 — Comercial JW Cóndor
 *
 * Golden Rules aplicadas:
 *  ✅ Importa EXCLUSIVAMENTE desde la capa de servicios (inventarioService.ts).
 *  ✅ Encapsula los handlers con try-catch estructurado.
 *  ✅ Expone estados reactivos limpios (loading, error, data) listos para la Vista.
 *  ✅ No realiza peticiones fetch/axios directamente (eso es responsabilidad del servicio).
 *  ✅ No modifica el DOM directamente (eso es responsabilidad de la Vista).
 *
 * Patrón: Custom Hook de React — useInventarioController()
 * La capa de "controlador" en un frontend React se implementa como un hook porque:
 *   - Coordina múltiples estados reactivos relacionados.
 *   - Encapsula la lógica de llamada, validación y manejo de errores.
 *   - La Vista solo invoca los handlers y lee los estados expuestos.
 */

import { useState, useCallback } from "react";
import {
  consultarStock,
  descontarStock,
  ingresarStock,
  sincronizarCloud,
  type IngresarStockPayload,
  type ConsultarStockResponse,
  type DescontarStockResponse,
  type IngresarStockResponse,
  type SincronizarCloudResponse,
} from "@/services/inventarioService";

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS — Estado interno del controlador
// ═══════════════════════════════════════════════════════════════════════════════

/** Estado de carga independiente por operación para granularidad en la UI */
interface LoadingState {
  consultando: boolean;
  descontando: boolean;
  ingresando: boolean;
  sincronizando: boolean;
}

/** Estado de datos expuestos a la Vista */
interface InventarioState {
  /** Resultado de la última consulta de stock */
  stockConsultado: ConsultarStockResponse | null;
  /** Resultado de la última operación de descuento */
  resultadoDescuento: DescontarStockResponse | null;
  /** Resultado de la última operación de ingreso */
  resultadoIngreso: IngresarStockResponse | null;
  /** Resultado de la última sincronización con Firebase */
  resultadoSincronizacion: SincronizarCloudResponse | null;
}

/** Interfaz pública del hook — lo que recibe la Vista */
export interface InventarioControllerReturn {
  // ── Estados de datos ───────────────────────────────────────────────────────
  stockConsultado: ConsultarStockResponse | null;
  resultadoDescuento: DescontarStockResponse | null;
  resultadoIngreso: IngresarStockResponse | null;
  resultadoSincronizacion: SincronizarCloudResponse | null;

  // ── Estados de carga granulares ────────────────────────────────────────────
  loading: LoadingState;

  /** true cuando CUALQUIER operación está en curso (útil para deshabilitar UI global) */
  isAnyLoading: boolean;

  // ── Estado de error global del módulo ──────────────────────────────────────
  /** Mensaje de error del último fallo. null si no hay error activo. */
  error: string | null;

  // ── Handlers (llamados por la Vista) ───────────────────────────────────────
  handleConsultarStock: (idVariante: number) => Promise<void>;
  handleDescontarStock: (idVariante: number, cantidad: number) => Promise<void>;
  handleIngresarStock: (payload: IngresarStockPayload) => Promise<void>;
  handleSincronizarCloud: () => Promise<void>;

  /** Limpia el estado de error manualmente (para botones "Cerrar alerta" en la Vista) */
  limpiarError: () => void;

  /** Reinicia todos los estados de resultado a null */
  reiniciarEstado: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO INICIAL
// ═══════════════════════════════════════════════════════════════════════════════

const LOADING_INICIAL: LoadingState = {
  consultando: false,
  descontando: false,
  ingresando: false,
  sincronizando: false,
};

const DATOS_INICIALES: InventarioState = {
  stockConsultado: null,
  resultadoDescuento: null,
  resultadoIngreso: null,
  resultadoSincronizacion: null,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOK — useInventarioController
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Controlador del módulo de Inventario implementado como Custom Hook de React.
 *
 * Uso en la Vista (page.tsx o componentes):
 * ```tsx
 * const {
 *   stockConsultado, loading, error,
 *   handleConsultarStock, handleIngresarStock,
 *   handleSincronizarCloud, limpiarError
 * } = useInventarioController();
 * ```
 */
export function useInventarioController(): InventarioControllerReturn {
  // ── Estado de carga ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState<LoadingState>(LOADING_INICIAL);

  // ── Estado de error global del módulo ──────────────────────────────────────
  const [error, setError] = useState<string | null>(null);

  // ── Estados de resultados de cada operación ────────────────────────────────
  const [datos, setDatos] = useState<InventarioState>(DATOS_INICIALES);

  // ── Derivado: ¿hay ALGUNA operación en curso? ─────────────────────────────
  const isAnyLoading = Object.values(loading).some(Boolean);

  // ── Utilidades internas ───────────────────────────────────────────────────

  /** Limpia el error activo. Expuesto a la Vista para cerrar alertas. */
  const limpiarError = useCallback(() => setError(null), []);

  /** Reinicia todos los datos de resultados. Útil al montar un nuevo formulario. */
  const reiniciarEstado = useCallback(() => {
    setDatos(DATOS_INICIALES);
    setError(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS — Cada uno corresponde a un endpoint del servicio
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handler: Consultar stock disponible de una variante.
   * Llama a GET /api/inventario/stock/:idVariante
   */
  const handleConsultarStock = useCallback(
    async (idVariante: number): Promise<void> => {
      // Validación del controlador (no del servicio — el servicio no valida)
      if (!idVariante || idVariante <= 0) {
        setError("El ID de variante debe ser un número positivo válido.");
        return;
      }

      setError(null);
      setLoading((prev) => ({ ...prev, consultando: true }));

      try {
        const resultado = await consultarStock(idVariante);
        setDatos((prev) => ({ ...prev, stockConsultado: resultado }));
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : "Error desconocido al consultar el stock.";
        setError(mensaje);
        // Limpiamos el dato anterior para no mostrar información obsoleta
        setDatos((prev) => ({ ...prev, stockConsultado: null }));
      } finally {
        setLoading((prev) => ({ ...prev, consultando: false }));
      }
    },
    []
  );

  /**
   * Handler: Descontar stock tras una venta manual.
   * Llama a POST /api/inventario/descontar
   */
  const handleDescontarStock = useCallback(
    async (idVariante: number, cantidad: number): Promise<void> => {
      if (!idVariante || idVariante <= 0) {
        setError("ID de variante inválido para descontar stock.");
        return;
      }
      if (!cantidad || cantidad <= 0) {
        setError("La cantidad a descontar debe ser mayor a cero.");
        return;
      }

      setError(null);
      setLoading((prev) => ({ ...prev, descontando: true }));

      try {
        const resultado = await descontarStock(idVariante, cantidad);
        setDatos((prev) => ({ ...prev, resultadoDescuento: resultado }));

        // Actualizamos también el stock consultado si coincide la variante,
        // para mantener la UI en sincronía sin hacer una segunda petición.
        if (datos.stockConsultado && resultado.stock_restante !== undefined) {
          setDatos((prev) => ({
            ...prev,
            resultadoDescuento: resultado,
            stockConsultado: prev.stockConsultado
              ? {
                  ...prev.stockConsultado,
                  stock_disponible: resultado.stock_restante,
                }
              : null,
          }));
        }
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : "Error desconocido al descontar el stock.";
        setError(mensaje);
        setDatos((prev) => ({ ...prev, resultadoDescuento: null }));
      } finally {
        setLoading((prev) => ({ ...prev, descontando: false }));
      }
    },
    [datos.stockConsultado]
  );

  /**
   * Handler: Ingresar mercadería a bodega.
   * Llama a POST /api/inventario/ingresar
   * Además de actualizar el stock, el backend genera un registro en `recepciones`.
   */
  const handleIngresarStock = useCallback(
    async (payload: IngresarStockPayload): Promise<void> => {
      // Validaciones del controlador antes de llamar al servicio
      if (!payload.idVariante || payload.idVariante <= 0) {
        setError("ID de variante inválido.");
        return;
      }
      if (!payload.cantidad || payload.cantidad <= 0) {
        setError("La cantidad a ingresar debe ser mayor a cero.");
        return;
      }
      if (!payload.idBodega || payload.idBodega <= 0) {
        setError("Debe especificar una bodega destino válida.");
        return;
      }
      if (!payload.usuario || payload.usuario.trim() === "") {
        setError("El campo 'usuario' es obligatorio para el registro de auditoría.");
        return;
      }

      setError(null);
      setLoading((prev) => ({ ...prev, ingresando: true }));

      try {
        const resultado = await ingresarStock(payload);
        setDatos((prev) => ({
          ...prev,
          resultadoIngreso: resultado,
          // Actualizamos el stock consultado en memoria si el resultado trae stock_actual
          stockConsultado:
            prev.stockConsultado && resultado.stock_actual !== undefined
              ? { ...prev.stockConsultado, stock_disponible: resultado.stock_actual }
              : prev.stockConsultado,
        }));
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : "Error desconocido al ingresar el stock.";
        setError(mensaje);
        setDatos((prev) => ({ ...prev, resultadoIngreso: null }));
      } finally {
        setLoading((prev) => ({ ...prev, ingresando: false }));
      }
    },
    []
  );

  /**
   * Handler: Sincronizar catálogo con Firebase Realtime Database.
   * Llama a GET /api/inventario/sincronizar-cloud
   * Operación de larga duración (reemplaza el nodo /catalogo_ecommerce completo).
   */
  const handleSincronizarCloud = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading((prev) => ({ ...prev, sincronizando: true }));

    try {
      const resultado = await sincronizarCloud();
      setDatos((prev) => ({ ...prev, resultadoSincronizacion: resultado }));
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : "Error desconocido durante la sincronización con Firebase.";
      setError(mensaje);
      setDatos((prev) => ({ ...prev, resultadoSincronizacion: null }));
    } finally {
      setLoading((prev) => ({ ...prev, sincronizando: false }));
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETORNO PÚBLICO — Interfaz que consume la Vista
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Datos
    stockConsultado: datos.stockConsultado,
    resultadoDescuento: datos.resultadoDescuento,
    resultadoIngreso: datos.resultadoIngreso,
    resultadoSincronizacion: datos.resultadoSincronizacion,

    // Control de carga
    loading,
    isAnyLoading,

    // Error
    error,

    // Handlers
    handleConsultarStock,
    handleDescontarStock,
    handleIngresarStock,
    handleSincronizarCloud,

    // Utilidades
    limpiarError,
    reiniciarEstado,
  };
}
