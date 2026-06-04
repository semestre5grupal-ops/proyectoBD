/**
 * ControlesGestion.tsx
 * ─────────────────────
 * Sección de CRUD condicional por rol del usuario conectado.
 * Se inyecta DEBAJO de los gráficos del Dashboard de Inventario.
 *
 * FUENTE DE DATOS: GET /api/inventario/tareas/pendientes
 *   El backend filtra automáticamente por el rol_destino del JWT.
 *   Response: { success: true, data: NotificacionTarea[] }
 *
 * RBAC (basado en id_rol del JWT):
 *   JEFE_INVENTARIO    (8)  → Ajustes pendientes (accion === 'AUTORIZAR_AJUSTE')
 *   AUXILIAR_INVENTARIO(9)  → Formulario crear ajuste
 *   OPERATIVO_INVENTARIO(10)→ Pestañas Recepciones / Entregas pendientes
 *
 * REGLA DE ORO: No toca gráficos, StockCard, IngresarStockForm ni SincronizarButton.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  PlusCircle,
  PackageCheck,
  Truck,
  RefreshCcw,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Warehouse,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  aprobarAjusteCabecera,
  crearAjusteCabeceraPendiente,
  aprobarRecepcionCabecera,
  aprobarEntregaCabecera,
  marcarNotificacionEjecutada,
} from "@/services/inventarioService";

// ─── URL base (misma variable que inventarioService) ─────────────────────────
const API_BASE_URL =
  (import.meta.env.VITE_API_INVENTARIO as string | undefined) ??
  "http://localhost:4000";

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

export type RolInventario =
  | "JEFE_INVENTARIO"
  | "AUXILIAR_INVENTARIO"
  | "OPERATIVO_INVENTARIO";

/** Estructura real que devuelve GET /api/inventario/tareas/pendientes */
interface NotificacionTarea {
  id: string;                              // UUID de la notificación
  accion: string;                          // 'AUTORIZAR_AJUSTE' | 'CONFIRMAR_RECEPCION' | 'CONFIRMAR_ENTREGA'
  rol_origen: string;
  rol_destino: string;
  usuario_origen: string;
  respuesta_ia: string;
  instruccion_original: string;
  estado: string;
  creado_en: string;
  payload_json: {
    idCabecera?: number | string;
    idBodega?: number;
    idVariante?: number;
    cantidad?: number;
    cantidadEsperada?: number;
    [key: string]: unknown;
  };
}

export interface ControlesGestionProps {
  rolActivo: RolInventario;
  nombreUsuario: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER — fetch autenticado con JWT
// ═══════════════════════════════════════════════════════════════════════════════

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("jwt_token");
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${endpoint}`);
  return res.json() as Promise<T>;
}

// ─── Carga las tareas pendientes del usuario autenticado ─────────────────────
async function cargarTareasPendientes(): Promise<NotificacionTarea[]> {
  const data = await apiFetch<{
    success: boolean;
    data?: NotificacionTarea[];
    tareas?: NotificacionTarea[];
  }>("/api/inventario/tareas/pendientes");
  return data.data ?? data.tareas ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: Feedback inline
// ═══════════════════════════════════════════════════════════════════════════════

function Feedback({ tipo, msg }: { tipo: "ok" | "error"; msg: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
        tipo === "ok"
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {tipo === "ok" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL JEFE_INVENTARIO
// Lee tareas del endpoint y filtra las de accion === 'AUTORIZAR_AJUSTE'.
// Columnas: #Cabecera · Variante · Cantidad esperada · Botones
// ═══════════════════════════════════════════════════════════════════════════════

function PanelJefe({ nombreUsuario }: { nombreUsuario: string }) {
  const [todasLasTareas, setTodasLasTareas] = useState<NotificacionTarea[]>([]);
  const [cargando, setCargando]             = useState(false);
  const [loadingId, setLoadingId]           = useState<string | null>(null);
  const [feedback, setFeedback]             = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  // Filtro en cliente por accion
  const ajustes = todasLasTareas.filter((t) => t.accion === "AUTORIZAR_AJUSTE");

  const recargar = useCallback(async () => {
    setCargando(true);
    setFeedback(null);
    try {
      setTodasLasTareas(await cargarTareasPendientes());
    } catch {
      setFeedback({ tipo: "error", msg: "No se pudieron cargar los ajustes. Verifica la sesión." });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void recargar(); }, [recargar]);

  const aprobar = async (tarea: NotificacionTarea) => {
    setLoadingId(tarea.id);
    setFeedback(null);
    const p = tarea.payload_json;
    try {
      await aprobarAjusteCabecera(p.idCabecera ?? tarea.id, {
        idVariante: p.idVariante ?? 1,
        cantidad:   p.cantidad   ?? p.cantidadEsperada ?? 0,
        idBodega:   p.idBodega   ?? 1,
        usuario:    nombreUsuario,
      });
      // Marcar la notificación como ejecutada
      await marcarNotificacionEjecutada(tarea.id).catch(() => {/* no crítico */});
      setFeedback({ tipo: "ok", msg: `Ajuste (cabecera #${p.idCabecera}) aprobado correctamente.` });
      void recargar();
    } catch (e) {
      setFeedback({ tipo: "error", msg: `Error al aprobar: ${e instanceof Error ? e.message : "desconocido"}` });
    } finally {
      setLoadingId(null);
    }
  };

  const cancelar = async (tarea: NotificacionTarea) => {
    setLoadingId(tarea.id);
    setFeedback(null);
    try {
      await apiFetch(`/api/inventario/tareas/${tarea.id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado: "rechazada" }),
      });
      setFeedback({ tipo: "ok", msg: `Ajuste (cabecera #${tarea.payload_json.idCabecera}) cancelado.` });
      void recargar();
    } catch {
      setFeedback({ tipo: "error", msg: `No se pudo cancelar la tarea #${tarea.id}.` });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            <CardTitle className="text-base">Ajustes Pendientes de Aprobación</CardTitle>
            {ajustes.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {ajustes.length}
              </Badge>
            )}
          </div>
          <Button
            id="btn-recargar-ajustes-jefe"
            variant="ghost" size="sm"
            onClick={() => void recargar()}
            disabled={cargando}
            className="h-7 gap-1.5 text-xs"
          >
            {cargando ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
            Recargar
          </Button>
        </div>
        <CardDescription className="text-xs">
          Ajustes enviados por el Auxiliar. Revisa y aprueba o cancela cada solicitud.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {feedback && <Feedback tipo={feedback.tipo} msg={feedback.msg} />}

        {cargando && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={22} className="animate-spin text-primary" />
          </div>
        )}

        {!cargando && ajustes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
            <ClipboardList size={28} className="opacity-40" />
            <p className="text-sm font-medium">No hay ajustes pendientes</p>
            <p className="text-xs opacity-70">El Auxiliar no ha enviado solicitudes aún.</p>
          </div>
        )}

        {!cargando && ajustes.map((t) => {
          const p = t.payload_json;
          return (
            <div
              key={t.id}
              className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Datos del ajuste */}
              <div className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {p.idCabecera != null && (
                    <Badge variant="outline" className="font-mono text-xs">
                      Cabecera #{p.idCabecera}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs capitalize">
                    {t.estado}
                  </Badge>
                </div>
                <p>
                  <span className="font-medium">Variante:</span> {p.idVariante ?? "—"} ·{" "}
                  <span className="font-medium">Cantidad esperada:</span>{" "}
                  <span
                    className={
                      (p.cantidadEsperada ?? p.cantidad ?? 0) < 0
                        ? "font-semibold text-destructive"
                        : "font-semibold text-emerald-600"
                    }
                  >
                    {(p.cantidadEsperada ?? p.cantidad) != null
                      ? `${(p.cantidadEsperada ?? p.cantidad)! > 0 ? "+" : ""}${p.cantidadEsperada ?? p.cantidad}`
                      : "—"}
                  </span>
                </p>
                {t.usuario_origen && (
                  <p className="text-xs text-muted-foreground">
                    Enviado por: <strong>{t.usuario_origen}</strong>
                  </p>
                )}
                {t.respuesta_ia && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.respuesta_ia}</p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  id={`btn-aprobar-ajuste-${t.id}`}
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => void aprobar(t)}
                  disabled={loadingId === t.id}
                >
                  {loadingId === t.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <CheckCircle2 size={13} />}
                  Aprobar Ajuste
                </Button>
                <Button
                  id={`btn-cancelar-ajuste-${t.id}`}
                  size="sm" variant="outline"
                  className="h-8 gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => void cancelar(t)}
                  disabled={loadingId === t.id}
                >
                  <XCircle size={13} />
                  Cancelar
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL AUXILIAR_INVENTARIO
// Formulario para crear ajuste → POST /api/inventario/ajustes/pendiente
// ═══════════════════════════════════════════════════════════════════════════════

function PanelAuxiliar({ nombreUsuario }: { nombreUsuario: string }) {
  const [idVariante, setIdVariante] = useState("");
  const [cantidad,   setCantidad]   = useState("");
  const [motivo,     setMotivo]     = useState("");
  const [cargando,   setCargando]   = useState(false);
  const [feedback,   setFeedback]   = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idVar = parseInt(idVariante, 10);
    const cant  = parseInt(cantidad, 10);

    if (isNaN(idVar) || idVar <= 0) {
      setFeedback({ tipo: "error", msg: "Ingresa un ID de variante válido (número ≥ 1)." });
      return;
    }
    if (isNaN(cant) || cant === 0) {
      setFeedback({ tipo: "error", msg: "La cantidad no puede ser 0. Usa positivo (ingreso) o negativo (descuento)." });
      return;
    }
    if (!motivo.trim()) {
      setFeedback({ tipo: "error", msg: "El motivo es obligatorio." });
      return;
    }

    setCargando(true);
    setFeedback(null);
    try {
      const res = await crearAjusteCabeceraPendiente({
        idVariante: idVar,
        cantidad: cant,
        motivo: motivo.trim(),
        descripcion: motivo.trim(),
        usuario: nombreUsuario,
        idBodega: 1,
      });
      setFeedback({
        tipo: "ok",
        msg: `Ajuste creado (ID cabecera: ${res.id}). El Jefe recibirá la alerta automáticamente.`,
      });
      setIdVariante("");
      setCantidad("");
      setMotivo("");
    } catch (e) {
      setFeedback({ tipo: "error", msg: e instanceof Error ? e.message : "Error al crear el ajuste." });
    } finally {
      setCargando(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-amber-500" />
          <CardTitle className="text-base">Crear Ajuste de Stock</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Reporta un desajuste. Al guardar, el Jefe de Inventario recibirá una alerta automáticamente.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {feedback && <Feedback tipo={feedback.tipo} msg={feedback.msg} />}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="input-ajuste-variante" className="text-xs font-medium text-muted-foreground">
                ID de Variante *
              </label>
              <Input
                id="input-ajuste-variante"
                type="number" min="1"
                placeholder="Ej: 101"
                value={idVariante}
                onChange={(e) => setIdVariante(e.target.value)}
                disabled={cargando}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="input-ajuste-cantidad" className="text-xs font-medium text-muted-foreground">
                Cantidad * <span className="text-[10px] opacity-70">(negativo = descuento)</span>
              </label>
              <Input
                id="input-ajuste-cantidad"
                type="number"
                placeholder="Ej: -10 o +5"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                disabled={cargando}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="input-ajuste-motivo" className="text-xs font-medium text-muted-foreground">
              Motivo del Ajuste *
            </label>
            <Input
              id="input-ajuste-motivo"
              type="text"
              placeholder="Ej: Producto dañado en transporte, conteo físico discrepante..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={cargando}
              required
              maxLength={255}
            />
          </div>

          <Button
            id="btn-crear-ajuste"
            type="submit"
            disabled={cargando || !idVariante || !cantidad || !motivo}
            className="w-full gap-2 sm:w-auto"
          >
            {cargando ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
            {cargando ? "Enviando ajuste..." : "Crear Ajuste de Stock"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL OPERATIVO_INVENTARIO
// Dos pestañas. Filtra en cliente:
//   Recepciones → accion === 'CONFIRMAR_RECEPCION'
//   Entregas    → accion === 'CONFIRMAR_ENTREGA'
// El botón "Confirmar" llama a la RPC con el ID de la notificación y cantidadReal.
// ═══════════════════════════════════════════════════════════════════════════════

type TabOperativo = "recepciones" | "entregas";

function PanelOperativo({ nombreUsuario }: { nombreUsuario: string }) {
  const [todasLasTareas, setTodasLasTareas] = useState<NotificacionTarea[]>([]);
  const [tabActiva, setTabActiva]           = useState<TabOperativo>("recepciones");
  const [cargando, setCargando]             = useState(false);
  const [loadingId, setLoadingId]           = useState<string | null>(null);
  const [cantidades, setCantidades]         = useState<Record<string, string>>({});
  const [feedback, setFeedback]             = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  // Filtros en cliente por accion
  const recepciones = todasLasTareas.filter((t) => t.accion === "CONFIRMAR_RECEPCION");
  const entregas    = todasLasTareas.filter((t) => t.accion === "CONFIRMAR_ENTREGA");
  const listActiva  = tabActiva === "recepciones" ? recepciones : entregas;

  const recargar = useCallback(async () => {
    setCargando(true);
    setFeedback(null);
    try {
      setTodasLasTareas(await cargarTareasPendientes());
    } catch {
      setFeedback({ tipo: "error", msg: "No se pudieron cargar las tareas. Verifica la sesión." });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void recargar(); }, [recargar]);

  /** Confirmar recepción: llama RPC y luego marca la notificación como ejecutada */
  const confirmarRecepcion = async (tarea: NotificacionTarea) => {
    const cantidadReal = parseInt(cantidades[tarea.id] ?? "", 10);
    if (isNaN(cantidadReal) || cantidadReal < 0) {
      setFeedback({ tipo: "error", msg: `Ingresa una cantidad real válida para la tarea #${tarea.id.slice(0, 8)}.` });
      return;
    }
    setLoadingId(tarea.id);
    setFeedback(null);
    const p = tarea.payload_json;
    try {
      // 1. Ejecutar la RPC de aprobación con cantidadReal del operativo
      await aprobarRecepcionCabecera(p.idCabecera ?? tarea.id, {
        idVariante:   p.idVariante  ?? 1,
        cantidadReal,
        idBodega:     p.idBodega    ?? 1,
        usuario:      nombreUsuario,
      });
      // 2. Marcar la notificación como ejecutada (best-effort)
      await marcarNotificacionEjecutada(tarea.id).catch(() => {/* no crítico */});
      setFeedback({ tipo: "ok", msg: `Recepción (cabecera #${p.idCabecera}) confirmada con ${cantidadReal} uds.` });
      void recargar();
    } catch (e) {
      setFeedback({ tipo: "error", msg: `Error al confirmar: ${e instanceof Error ? e.message : "desconocido"}` });
    } finally {
      setLoadingId(null);
    }
  };

  /** Confirmar entrega: llama RPC y marca la notificación como ejecutada */
  const confirmarEntrega = async (tarea: NotificacionTarea) => {
    const cantidadReal = parseInt(cantidades[tarea.id] ?? "", 10);
    if (isNaN(cantidadReal) || cantidadReal < 0) {
      setFeedback({ tipo: "error", msg: `Ingresa una cantidad real válida para la tarea #${tarea.id.slice(0, 8)}.` });
      return;
    }
    setLoadingId(tarea.id);
    setFeedback(null);
    const p = tarea.payload_json;
    try {
      await aprobarEntregaCabecera(p.idCabecera ?? tarea.id, {
        idVariante:   p.idVariante  ?? 1,
        cantidadReal,
        idBodega:     p.idBodega    ?? 1,
        usuario:      nombreUsuario,
      });
      await marcarNotificacionEjecutada(tarea.id).catch(() => {/* no crítico */});
      setFeedback({ tipo: "ok", msg: `Entrega (cabecera #${p.idCabecera}) confirmada con ${cantidadReal} uds.` });
      void recargar();
    } catch (e) {
      setFeedback({ tipo: "error", msg: `Error al confirmar: ${e instanceof Error ? e.message : "desconocido"}` });
    } finally {
      setLoadingId(null);
    }
  };

  const cancelarTarea = async (tarea: NotificacionTarea) => {
    setLoadingId(tarea.id);
    setFeedback(null);
    try {
      await apiFetch(`/api/inventario/tareas/${tarea.id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado: "rechazada" }),
      });
      setFeedback({ tipo: "ok", msg: `Tarea #${tarea.id.slice(0, 8)} cancelada.` });
      void recargar();
    } catch {
      setFeedback({ tipo: "error", msg: `No se pudo cancelar la tarea.` });
    } finally {
      setLoadingId(null);
    }
  };

  const renderFila = (tarea: NotificacionTarea) => {
    const esRecepcion = tabActiva === "recepciones";
    const p = tarea.payload_json;
    return (
      <div key={tarea.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        {/* Info */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="font-mono text-xs">
            #{tarea.id.slice(0, 8)}
          </Badge>
          {p.idCabecera != null && (
            <Badge variant="secondary" className="text-xs">
              Cabecera #{p.idCabecera}
            </Badge>
          )}
          {p.idVariante != null && (
            <span className="text-xs text-muted-foreground">
              Variante: <span className="font-medium text-foreground">{p.idVariante}</span>
            </span>
          )}
          {(p.cantidadEsperada ?? p.cantidad) != null && (
            <span className="text-xs text-muted-foreground">
              Qty solicitada:{" "}
              <span className="font-medium text-foreground">
                {p.cantidadEsperada ?? p.cantidad}
              </span>
            </span>
          )}
        </div>

        {tarea.respuesta_ia && (
          <p className="text-xs text-muted-foreground line-clamp-2">{tarea.respuesta_ia}</p>
        )}

        {/* Input cantidad real + botones */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label
              htmlFor={`input-cantidad-real-${tarea.id}`}
              className="shrink-0 text-xs font-medium text-muted-foreground"
            >
              Cantidad Real:
            </label>
            <Input
              id={`input-cantidad-real-${tarea.id}`}
              type="number"
              min="0"
              placeholder="Uds. reales"
              className="h-8 w-32 text-sm"
              value={cantidades[tarea.id] ?? ""}
              onChange={(e) =>
                setCantidades((prev) => ({ ...prev, [tarea.id]: e.target.value }))
              }
              disabled={loadingId === tarea.id}
            />
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <Button
              id={`btn-confirmar-${esRecepcion ? "recepcion" : "entrega"}-${tarea.id}`}
              size="sm"
              className="h-8 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() =>
                void (esRecepcion ? confirmarRecepcion(tarea) : confirmarEntrega(tarea))
              }
              disabled={loadingId === tarea.id || !cantidades[tarea.id]}
            >
              {loadingId === tarea.id
                ? <Loader2 size={13} className="animate-spin" />
                : <CheckCircle2 size={13} />}
              Confirmar
            </Button>
            <Button
              id={`btn-cancelar-tarea-${tarea.id}`}
              size="sm" variant="outline"
              className="h-8 gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => void cancelarTarea(tarea)}
              disabled={loadingId === tarea.id}
            >
              <XCircle size={13} />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse size={18} className="text-blue-500" />
            <CardTitle className="text-base">Tareas Pendientes — Operativo de Bodega</CardTitle>
          </div>
          <Button
            id="btn-recargar-tareas-operativo"
            variant="ghost" size="sm"
            onClick={() => void recargar()}
            disabled={cargando}
            className="h-7 gap-1.5 text-xs"
          >
            {cargando ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
            Recargar
          </Button>
        </div>
        <CardDescription className="text-xs">
          Confirma cada tarea ingresando la cantidad física real recibida o entregada.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && <Feedback tipo={feedback.tipo} msg={feedback.msg} />}

        {/* Pestañas */}
        <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
          {(["recepciones", "entregas"] as TabOperativo[]).map((tab) => {
            const count = tab === "recepciones" ? recepciones.length : entregas.length;
            const Icon  = tab === "recepciones" ? PackageCheck : Truck;
            const label = tab === "recepciones" ? "Recepciones (Compras)" : "Entregas (Ventas)";
            return (
              <button
                key={tab}
                id={`tab-operativo-${tab}`}
                type="button"
                onClick={() => setTabActiva(tab)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tabActiva === tab
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={13} />
                {label}
                {count > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Spinner */}
        {cargando && (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={22} className="animate-spin text-primary" />
          </div>
        )}

        {/* Lista vacía */}
        {!cargando && listActiva.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
            {tabActiva === "recepciones"
              ? <PackageCheck size={28} className="opacity-40" />
              : <Truck size={28} className="opacity-40" />}
            <p className="text-sm font-medium">
              No hay {tabActiva === "recepciones" ? "recepciones" : "entregas"} pendientes
            </p>
            <p className="text-xs opacity-70">
              {tabActiva === "recepciones"
                ? "Compras no ha enviado órdenes de recepción."
                : "Ventas no ha enviado órdenes de entrega."}
            </p>
          </div>
        )}

        {/* Filas */}
        {!cargando && listActiva.map(renderFila)}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL exportado
// ═══════════════════════════════════════════════════════════════════════════════

export function ControlesGestion({ rolActivo, nombreUsuario }: ControlesGestionProps) {
  if (rolActivo === "JEFE_INVENTARIO")      return <PanelJefe     nombreUsuario={nombreUsuario} />;
  if (rolActivo === "AUXILIAR_INVENTARIO")  return <PanelAuxiliar nombreUsuario={nombreUsuario} />;
  if (rolActivo === "OPERATIVO_INVENTARIO") return <PanelOperativo nombreUsuario={nombreUsuario} />;
  return null;
}
