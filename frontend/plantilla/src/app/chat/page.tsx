"use client"

/**
 * page.tsx — Centro de Comando Asistido por IA (Agentic ERP Task Center)
 * -----------------------------------------------------------------------
 * VISTA PRINCIPAL del módulo de chat refactorizado
 * Proyecto RDA3 · Comercial JW Cóndor
 *
 * FASE 4 — RBAC + Agente:
 *  ✅ Lee el JWT del localStorage para determinar el rol del usuario.
 *  ✅ Selector de rol temporal (DropdownMenu) para modo desarrollo.
 *  ✅ UI adaptativa por rol: JEFE (full), AUXILIAR (limitado), OPERATIVO (solo lectura).
 *  ✅ Banner "Esperando instrucciones" para OPERATIVO_INVENTARIO.
 *  ✅ Conectado a use-agent.ts como única fuente de verdad del pipeline IA.
 *  ✅ MessageList renderiza task_cards con confirmarTarea / rechazarTarea.
 *  ✅ MessageInput conectado a toggleVoz / escuchando del hook.
 *
 * Golden Rules:
 *  ✅ Cero lógica de negocio en la vista — todo delega a useAgent().
 *  ✅ No fetch directo — el hook orquesta ollamaService + inventarioService.
 */

import { useState, useEffect, useRef } from "react"
import {
  Bot,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  ChevronDown,
  Wifi,
  WifiOff,
  Mic,
  AlertTriangle,
  X,
  Brain,
  Loader2,
  Inbox,
} from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { useAgent } from "@/app/chat/hooks/use-agent"
import { MessageList } from "@/app/chat/components/message-list"
import { MessageInput } from "@/app/chat/components/message-input"
import { mapearRolJWT } from "@/app/chat/prompts/system-prompts"
import { verificarOllama } from "@/services/ollamaService"
import type { RolInventario } from "@/app/chat/types/erp-agent"
import type { Message } from "@/app/chat/use-chat"

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN VISUAL POR ROL
// ═══════════════════════════════════════════════════════════════════════════════

const ROL_CONFIG: Record<
  RolInventario,
  {
    label: string
    descripcion: string
    colorClass: string
    Icon: React.ElementType
    puedeEscribir: boolean
    puedeVoz: boolean
  }
> = {
  JEFE_INVENTARIO: {
    label: "Jefe de Inventario",
    descripcion: "Permisos completos: ingresar, descontar, dar de baja, sincronizar.",
    colorClass: "bg-primary text-primary-foreground hover:bg-primary/90",
    Icon: ShieldCheck,
    puedeEscribir: true,
    puedeVoz: true,
  },
  AUXILIAR_INVENTARIO: {
    label: "Auxiliar de Inventario",
    descripcion: "Solo ingresos y consultas de stock.",
    colorClass:
      "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700",
    Icon: ShieldAlert,
    puedeEscribir: true,
    puedeVoz: true,
  },
  OPERATIVO_INVENTARIO: {
    label: "Operativo de Inventario",
    descripcion: "Solo confirmación de tareas asignadas.",
    colorClass: "bg-muted text-muted-foreground hover:bg-muted/80 border",
    Icon: ShieldOff,
    puedeEscribir: false,
    puedeVoz: false,
  },
}

// Mensajes de bienvenida para cada rol al abrir el chat
const MENSAJES_BIENVENIDA: Record<RolInventario, string> = {
  JEFE_INVENTARIO:
    "¡Hola! Soy tu Agente ERP de Inventario. Puedes darme instrucciones en lenguaje natural o por voz. Ejemplos: \"Ingresa 50 unidades del producto 12\", \"Consulta el stock del artículo 7\", \"Sincroniza el catálogo con Firebase\".",
  AUXILIAR_INVENTARIO:
    "¡Hola! Puedo ayudarte a ingresar stock y consultar disponibilidad. Dime qué necesitas: \"Ingresa 20 unidades del producto 5 en bodega 1\" o \"¿Cuántas unidades tiene la variante 3?\".",
  OPERATIVO_INVENTARIO:
    "Modo Operativo activo. Recibirás las tareas asignadas por el Jefe de Inventario aquí. Confírmalas una vez ejecutadas físicamente.",
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK AUXILIAR — Estado de Ollama (ping)
// ═══════════════════════════════════════════════════════════════════════════════

function useOllamaStatus() {
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    verificarOllama().then((ok) => {
      if (mounted) setOllamaOnline(ok)
    })
    // Re-verificar cada 30 segundos
    const interval = setInterval(async () => {
      const ok = await verificarOllama()
      if (mounted) setOllamaOnline(ok)
    }, 30_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return ollamaOnline
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function ChatAgentePage() {
  // ── Agente: pipeline completo ───────────────────────────────────────────────
  const agent = useAgent()

  // ── Estado de conexión con Ollama ───────────────────────────────────────────
  const ollamaOnline = useOllamaStatus()

  // ── Selector de rol para modo desarrollo (stub SSO) ────────────────────────
  // En producción se oculta cuando hay JWT real (hayTokenReal)
  const [rolOverride, setRolOverride] = useState<RolInventario | null>(null)
  const [hayTokenReal, setHayTokenReal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("jwt_token")
    if (!token) return
    try {
      const parts = token.split(".")
      if (parts.length !== 3) return
      const payload = JSON.parse(atob(parts[1])) as { id_rol?: number; rol?: string }
      const rol = mapearRolJWT(payload)
      setRolOverride(rol)
      setHayTokenReal(true)
    } catch {
      // Token malformado — deja el rol del hook activo
    }
  }, [])

  // Rol efectivo: override del selector > rol del JWT del hook
  const rolEfectivo: RolInventario = rolOverride ?? agent.rolActivo
  const rolCfg = ROL_CONFIG[rolEfectivo]
  const RolIcon = rolCfg.Icon

  // ── Scroll al fondo cuando llegan mensajes nuevos ───────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [agent.mensajes.length])

  // ── Mensaje de bienvenida al montar (solo una vez) ──────────────────────────
  const welcomeSentRef = useRef(false)
  useEffect(() => {
    if (!welcomeSentRef.current && agent.mensajes.length === 0) {
      welcomeSentRef.current = true
      // No usamos sendMessage para no invocar a Ollama — solo UI
    }
  }, [agent.mensajes.length])

  // ── Adaptador de tipos: MensajeERP → Message (para MessageList) ────────────
  // MessageList recibe Message[] del Zustand original.
  // MensajeERP es structuralmente compatible (mismos campos + tarea opcional).
  const mensajesAdaptados = agent.mensajes as unknown as Message[]

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <BaseLayout
      title="Centro de Comando IA — Inventario"
      description="Agentic ERP Task Center · Módulo de Inventario · Comercial JW Cóndor"
    >
      <div className="flex flex-col h-[calc(100vh-120px)] min-h-[600px] px-4 pb-4 lg:px-6 gap-0">

        {/* ══════════════════════════════════════════════════════════════════
            HEADER DEL AGENTE
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between py-3 border-b gap-3 flex-wrap">

          {/* Identidad del módulo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 border border-primary/20">
              <Brain size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                Centro de Comando IA
              </h1>
              <p className="text-xs text-muted-foreground">
                Módulo Inventario · Comercial JW Cóndor
              </p>
            </div>
          </div>

          {/* Controles del lado derecho */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Indicador de estado Ollama */}
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border",
                ollamaOnline === null
                  ? "text-muted-foreground border-border"
                  : ollamaOnline
                  ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                  : "text-destructive border-destructive/30 bg-destructive/5"
              )}
            >
              {ollamaOnline === null ? (
                <Loader2 size={11} className="animate-spin" />
              ) : ollamaOnline ? (
                <Wifi size={11} />
              ) : (
                <WifiOff size={11} />
              )}
              <span>
                {ollamaOnline === null
                  ? "Verificando Ollama..."
                  : ollamaOnline
                  ? "Ollama activo"
                  : "Ollama desconectado"}
              </span>
            </div>

            {/* Indicador de escucha de voz */}
            {agent.escuchando && (
              <Badge
                variant="destructive"
                className="gap-1.5 animate-pulse text-xs"
              >
                <Mic size={11} />
                Escuchando...
              </Badge>
            )}

            {/* Agente procesando */}
            {agent.agentThinking && (
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <Loader2 size={11} className="animate-spin" />
                Procesando...
              </Badge>
            )}

            {/* ── Selector de rol (visible solo en modo dev sin JWT) ─── */}
            {!hayTokenReal ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    id="selector-rol-agente"
                    variant="outline"
                    size="sm"
                    className={cn("h-8 gap-1.5 text-xs font-medium", rolCfg.colorClass)}
                  >
                    <RolIcon size={13} />
                    {rolCfg.label}
                    <ChevronDown size={11} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Simular sesión (modo dev)
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    id="rol-jefe"
                    onClick={() => setRolOverride("JEFE_INVENTARIO")}
                    className="gap-2 text-sm cursor-pointer"
                  >
                    <ShieldCheck size={14} className="text-primary" />
                    <div>
                      <p className="font-medium">JEFE_INVENTARIO</p>
                      <p className="text-xs text-muted-foreground">
                        Todos los permisos
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    id="rol-auxiliar"
                    onClick={() => setRolOverride("AUXILIAR_INVENTARIO")}
                    className="gap-2 text-sm cursor-pointer"
                  >
                    <ShieldAlert size={14} className="text-amber-500" />
                    <div>
                      <p className="font-medium">AUXILIAR_INVENTARIO</p>
                      <p className="text-xs text-muted-foreground">
                        Solo ingresos y consultas
                      </p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    id="rol-operativo"
                    onClick={() => setRolOverride("OPERATIVO_INVENTARIO")}
                    className="gap-2 text-sm cursor-pointer"
                  >
                    <ShieldOff size={14} className="text-muted-foreground" />
                    <div>
                      <p className="font-medium">OPERATIVO_INVENTARIO</p>
                      <p className="text-xs text-muted-foreground">
                        Solo confirma tareas asignadas
                      </p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Badge de sesión real */
              <div
                id="sesion-activa-agente"
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium",
                  rolCfg.colorClass
                )}
              >
                <RolIcon size={13} />
                <span>{agent.nombreUsuario}</span>
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {rolCfg.label}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BANNER DE OPERATIVO — solo visible para OPERATIVO_INVENTARIO
        ══════════════════════════════════════════════════════════════════ */}
        {rolEfectivo === "OPERATIVO_INVENTARIO" && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-muted/60 border-b text-sm text-muted-foreground">
            <Inbox size={16} className="shrink-0 text-muted-foreground" />
            <span>
              <strong className="text-foreground">Modo Operativo:</strong>{" "}
              Esperando instrucciones del Jefe de Inventario. Confirma las tareas
              pendientes que aparezcan en este canal.
            </span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            BANNER DE ERROR DEL AGENTE
        ══════════════════════════════════════════════════════════════════ */}
        {agent.agentError && (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{agent.agentError}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={agent.limpiarError}
            >
              <X size={13} />
            </Button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ÁREA DE MENSAJES
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-h-0 flex flex-col border-x border-b rounded-b-lg overflow-hidden bg-background">
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-0">

              {/* ── Mensaje de bienvenida del sistema ────────────────── */}
              <div className="flex gap-3 px-4 pt-5 pb-3">
                <div className="w-8 shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Bot size={16} className="text-primary" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Agente ERP · {rolCfg.label}
                  </span>
                  <div className="rounded-lg px-3 py-2 bg-muted text-sm max-w-lg">
                    {MENSAJES_BIENVENIDA[rolEfectivo]}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Sistema activo
                  </span>
                </div>
              </div>

              <Separator className="mx-4 my-1" />

              {/* ── Lista de mensajes del agente ─────────────────────── */}
              {agent.mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                    <Brain size={28} className="opacity-40" />
                  </div>
                  <p className="text-sm">
                    Escribe una instrucción o usa el micrófono para empezar
                  </p>
                </div>
              ) : (
                <div className="px-0">
                  <MessageList
                    messages={mensajesAdaptados}
                    users={[]}
                    currentUserId="user"
                    onConfirmarTarea={agent.confirmarTarea}
                    onRechazarTarea={agent.rechazarTarea}
                  />
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={bottomRef} className="h-2" />
            </div>
          </ScrollArea>

          {/* ══════════════════════════════════════════════════════════════
              INPUT DE MENSAJE / CONTROL DE VOZ
          ══════════════════════════════════════════════════════════════ */}
          {rolCfg.puedeEscribir ? (
            <div className="border-t">
              <MessageInput
                onSendMessage={agent.sendMessage}
                disabled={agent.agentThinking || !ollamaOnline}
                placeholder={
                  !ollamaOnline
                    ? "Ollama desconectado — inicia el servidor local"
                    : agent.agentThinking
                    ? "Procesando tu instrucción..."
                    : `Instrucción para ${rolCfg.label}...`
                }
                toggleVoz={rolCfg.puedeVoz ? agent.toggleVoz : undefined}
                escuchando={agent.escuchando}
              />
            </div>
          ) : (
            /* Panel de solo lectura para OPERATIVO */
            <div className="border-t px-4 py-3 bg-muted/30 flex items-center gap-3">
              <ShieldOff size={16} className="text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                Modo solo lectura — confirma las tareas pendientes que aparezcan arriba.
              </p>
            </div>
          )}
        </div>

        {/* ── Pie: atribución del modelo ────────────────────────────────────── */}
        <p className="text-center text-[10px] text-muted-foreground pt-1.5">
          Impulsado por{" "}
          <span className="font-mono">
            {(import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? "llama3.2"}
          </span>{" "}
          vía Ollama local · Los datos se procesan en tu equipo
        </p>
      </div>
    </BaseLayout>
  )
}
