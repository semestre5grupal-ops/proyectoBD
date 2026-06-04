"use client"

/**
 * task-card.tsx
 * -------------
 * COMPONENTE DE TARJETA DE TAREA ERP
 * Proyecto RDA3 · Módulo de Compras (Liz)
 *
 * Se renderiza dentro de message-list.tsx cuando un mensaje tiene
 * `type === 'task_card'`. Muestra la instrucción generada por la IA
 * con sus datos de payload y dos botones de acción: Confirmar / Rechazar.
 *
 * Props:
 *   tarea             — TareaCompras generada por use-agent.ts
 *   onConfirmar       — Callback que invoca confirmarTarea() del hook
 *   onRechazar        — Callback que invoca rechazarTarea() del hook
 *   procesando        — Si true, muestra spinner y desactiva botones
 */

import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  Package,
  Loader2,
  Warehouse,
  Hash,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  CloudUpload,
  Search,
  AlertTriangle,
  Info,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { TareaCompras, AccionCompras } from "@/app/chat-compras/types/erp-agent"

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN VISUAL POR ACCIÓN
// ═══════════════════════════════════════════════════════════════════════════════

interface AccionConfig {
  label: string
  labelCorto: string
  Icon: React.ElementType
  colorBorder: string
  colorBadge: string
  colorIcono: string
}

const ACCION_CONFIG: Record<AccionCompras, AccionConfig> = {
  INGRESAR_STOCK: {
    label: "Ingreso de Stock",
    labelCorto: "INGRESO",
    Icon: ArrowDownCircle,
    colorBorder: "border-emerald-500/40 dark:border-emerald-500/30",
    colorBadge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    colorIcono: "text-emerald-500",
  },
  DESCONTAR_STOCK: {
    label: "Descuento de Stock",
    labelCorto: "DESCUENTO",
    Icon: ArrowUpCircle,
    colorBorder: "border-amber-500/40 dark:border-amber-500/30",
    colorBadge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    colorIcono: "text-amber-500",
  },
  DAR_DE_BAJA: {
    label: "Baja de Variante",
    labelCorto: "BAJA LÓGICA",
    Icon: XCircle,
    colorBorder: "border-destructive/40",
    colorBadge: "bg-destructive/10 text-destructive border-destructive/30",
    colorIcono: "text-destructive",
  },
  CONSULTAR: {
    label: "Consulta de Stock",
    labelCorto: "CONSULTA",
    Icon: Search,
    colorBorder: "border-blue-500/40 dark:border-blue-500/30",
    colorBadge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    colorIcono: "text-blue-500",
  },
  SINCRONIZAR: {
    label: "Sincronización Firebase",
    labelCorto: "SINCRONIZAR",
    Icon: CloudUpload,
    colorBorder: "border-purple-500/40 dark:border-purple-500/30",
    colorBadge: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    colorIcono: "text-purple-500",
  },
  INFORMATIVO: {
    label: "Información",
    labelCorto: "INFO",
    Icon: Info,
    colorBorder: "border-border",
    colorBadge: "bg-muted text-muted-foreground border-border",
    colorIcono: "text-muted-foreground",
  },
  CONFIRMAR_RECEPCION: {
    label: "Confirmar Recepción",
    labelCorto: "CONFIRMACIÓN",
    Icon: CheckCircle2,
    colorBorder: "border-emerald-500/40 dark:border-emerald-500/30",
    colorBadge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    colorIcono: "text-emerald-500",
  },
  CREAR_PRODUCTO: {
    label: "Orden de Recepción (Jefe → Operativo)",
    labelCorto: "DELEGACIÓN",
    Icon: Package,
    colorBorder: "border-blue-500/40 dark:border-blue-500/30",
    colorBadge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    colorIcono: "text-blue-500",
  },
  AUTORIZAR_AJUSTE: {
    label: "Ajuste Autorizado",
    labelCorto: "AJUSTE",
    Icon: ArrowDownCircle,
    colorBorder: "border-amber-500/40 dark:border-amber-500/30",
    colorBadge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    colorIcono: "text-amber-500",
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTE — Fila de dato del payload
// ═══════════════════════════════════════════════════════════════════════════════

function FilaDato({
  icon: Icon,
  label,
  valor,
}: {
  icon: React.ElementType
  label: string
  valor: string | number | undefined | null
}) {
  if (valor == null || valor === "") return null
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={13} className="text-muted-foreground shrink-0" />
      <span className="text-muted-foreground min-w-[80px]">{label}</span>
      <span className="font-mono font-semibold text-foreground">{valor}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

interface TaskCardProps {
  tarea: TareaCompras
  onConfirmar: (tareaId: string) => Promise<void>
  onRechazar: (tareaId: string) => void
}

export function TaskCard({ tarea, onConfirmar, onRechazar }: TaskCardProps) {
  const [procesando, setProcesando] = useState(false)

  const cfg = ACCION_CONFIG[tarea.accion]
  const { Icon: AccionIcon } = cfg

  const esFinalizado =
    tarea.estado === "ejecutada" ||
    tarea.estado === "rechazada" ||
    tarea.estado === "error"

  const handleConfirmar = async () => {
    if (procesando || esFinalizado) return
    setProcesando(true)
    try {
      await onConfirmar(tarea.id)
    } finally {
      setProcesando(false)
    }
  }

  const handleRechazar = () => {
    if (procesando || esFinalizado) return
    onRechazar(tarea.id)
  }

  return (
    <Card
      className={cn(
        "w-full max-w-sm border-2 shadow-sm transition-all duration-300",
        cfg.colorBorder,
        esFinalizado && "opacity-70"
      )}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center rounded-md p-1.5",
                "bg-background border",
                cfg.colorBorder
              )}
            >
              <AccionIcon size={16} className={cfg.colorIcono} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold leading-tight">
                {cfg.label}
              </CardTitle>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Módulo · Compras ERP
              </p>
            </div>
          </div>

          {/* Badge de estado */}
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0.5 shrink-0", cfg.colorBadge)}
          >
            {cfg.labelCorto}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      {/* ── Datos del payload ───────────────────────────────────────────────── */}
      <CardContent className="px-4 py-3 space-y-2">
        {/* Mensaje de la IA */}
        <p className="text-sm text-foreground leading-snug">
          {tarea.mensaje_usuario}
        </p>

        {/* Datos estructurados — solo si existen */}
        {(tarea.payload.idVariante != null ||
          tarea.payload.cantidad != null ||
          tarea.payload.idBodega != null ||
          tarea.payload.descripcion) && (
          <>
            <Separator className="my-2" />
            <div className="space-y-1.5">
              <FilaDato
                icon={Hash}
                label="Variante"
                valor={tarea.payload.idVariante}
              />
              <FilaDato
                icon={Layers}
                label="Cantidad"
                valor={
                  tarea.payload.cantidad != null
                    ? `${tarea.payload.cantidad} uds.`
                    : null
                }
              />
              <FilaDato
                icon={Warehouse}
                label="Bodega"
                valor={
                  tarea.payload.idBodega != null
                    ? `#${tarea.payload.idBodega}`
                    : null
                }
              />
              <FilaDato
                icon={Package}
                label="Nota"
                valor={tarea.payload.descripcion}
              />
            </div>
          </>
        )}

        {/* Indicador de estado finalizado */}
        {tarea.estado === "ejecutada" && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            <CheckCircle2 size={13} />
            Tarea ejecutada exitosamente
          </div>
        )}
        {tarea.estado === "rechazada" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1">
            <XCircle size={13} />
            Tarea cancelada por el usuario
          </div>
        )}
        {tarea.estado === "error" && (
          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium mt-1">
            <AlertTriangle size={13} />
            Error al ejecutar la tarea
          </div>
        )}
      </CardContent>

      {/* ── Botones de acción — solo visibles mientras está pendiente ──────── */}
      {(tarea.estado === "pendiente" || tarea.estado === "confirmada") && (
        <>
          <Separator />
          <CardFooter className="px-4 py-3 flex gap-2">
            {/* Confirmar y Ejecutar */}
            <Button
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={handleConfirmar}
              disabled={procesando}
            >
              {procesando ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  Confirmar y Ejecutar
                </>
              )}
            </Button>

            {/* Rechazar */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleRechazar}
              disabled={procesando}
            >
              <XCircle size={13} />
              Rechazar
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
