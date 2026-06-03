/**
 * page.tsx — Dashboard de Inventario (Paul)
 * -------------------------------------------
 * CAPA DE VISTA PRINCIPAL — Módulo de Inventario
 * Proyecto RDA3 — Comercial JW Cóndor
 *
 * SESIÓN 4 — Mejoras implementadas:
 *  ✅ Panel analítico visual con gráficos SVG (Light/Dark mode).
 *  ✅ Control de acceso por roles (ADMIN / EMPLEADO_BODEGA / CLIENTE_VISITANTE).
 *  ✅ Selector de rol temporal en esquina superior (stub para SSO de Alejandro).
 *  ✅ Renderizado condicional estricto: formulario, sincronización y tabla por rol.
 *  ✅ Golden Rules: hook instanciado UNA sola vez, sin lógica de negocio en la vista.
 *
 * SESIÓN 4 — Integración JWT:
 *  ✅ Lee jwt_token del localStorage (establecido por authService de Alejandro).
 *  ✅ Decodifica el payload Base64 para extraer id_rol y usu_nombre del usuario real.
 *  ✅ Mapea id_rol (número) al tipo RolUsuario usado por el RBAC del módulo.
 *  ✅ Fallback a stub de desarrollo cuando no hay sesión activa.
 *  ✅ El selector manual se oculta automáticamente cuando hay token real.
 */

import { useState, useEffect } from "react";
import {
  Package,
  Search,
  AlertCircle,
  X,
  Wifi,
  Database,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  ChevronDown,
  Lock,
} from "lucide-react";

import { BaseLayout } from "@/components/layouts/base-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Controlador del módulo (hook centralizado — instanciado UNA sola vez) ──────
import { useInventarioController } from "@/controllers/inventarioController";

// ── Subcomponentes de la Vista ─────────────────────────────────────────────────
import { StockCard } from "./components/StockCard";
import { IngresarStockForm } from "./components/IngresarStockForm";
import { SincronizarButton } from "./components/SincronizarButton";
import { StockTable } from "./components/StockTable";

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DE ROL — Stub compatible con el SSO de Alejandro
// ═══════════════════════════════════════════════════════════════════════════════

type RolUsuario = "ADMIN" | "EMPLEADO_BODEGA" | "CLIENTE_VISITANTE";

interface UsuarioActivo {
  nombre: string;
  rol: RolUsuario;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATOS ANALÍTICOS SIMULADOS
// Estructurados para reflejar el flujo real de las tablas Supabase
// ═══════════════════════════════════════════════════════════════════════════════

interface PuntoAnalítico {
  periodo: string;
  ingresos: number;
  egresos: number;
  stockFinal: number;
}

const DATOS_ANALITICOS: PuntoAnalítico[] = [
  { periodo: "Ene", ingresos: 420, egresos: 310, stockFinal: 1840 },
  { periodo: "Feb", ingresos: 380, egresos: 290, stockFinal: 1930 },
  { periodo: "Mar", ingresos: 510, egresos: 450, stockFinal: 1990 },
  { periodo: "Abr", ingresos: 290, egresos: 360, stockFinal: 1920 },
  { periodo: "May", ingresos: 640, egresos: 510, stockFinal: 2050 },
  { periodo: "Jun", ingresos: 725, egresos: 580, stockFinal: 2195 },
];

// Máximos para normalizar la altura de las barras (0–100%)
const MAX_INGRESOS = Math.max(...DATOS_ANALITICOS.map((d) => d.ingresos));
const MAX_EGRESOS  = Math.max(...DATOS_ANALITICOS.map((d) => d.egresos));
const MAX_STOCK    = Math.max(...DATOS_ANALITICOS.map((d) => d.stockFinal));

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES DE COLOR — definidas una sola vez para usar en SVG y leyendas
// ═══════════════════════════════════════════════════════════════════════════════

// Verde esmeralda — ingresos/recepciones
const COLOR_INGRESOS = "#10b981";
// Azul corporativo — egresos/entregas (contraste limpio en light y dark mode)
const COLOR_EGRESOS  = "#3b82f6";

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: Gráfico de barras agrupadas (SVG nativo)
//
// POR QUÉ SVG y no divs:
//   Los divs con height:% heredan el alto del padre más cercano con altura
//   concreta. Cuando el padre es un flex-item sin px fijo, la herencia se rompe
//   y la segunda barra (egresos) colapsa a su mínimo. SVG usa coordenadas
//   absolutas en un viewBox fijo — siempre renderiza correctamente.
// ═══════════════════════════════════════════════════════════════════════════════

function GraficoBarrasAgrupadas() {
  // Dimensiones del viewBox (unidades SVG, no px)
  const VW = 400;          // ancho total
  const VH = 180;          // alto total
  const PAD_L = 8;         // margen izquierdo
  const PAD_R = 8;         // margen derecho
  const PAD_T = 16;        // margen superior (espacio para labels de valor)
  const PAD_B = 24;        // margen inferior (espacio para etiquetas X)
  const usableW = VW - PAD_L - PAD_R;
  const usableH = VH - PAD_T - PAD_B;

  const n       = DATOS_ANALITICOS.length;
  const grupW   = usableW / n;   // ancho de cada grupo (mes)
  const barW    = grupW * 0.32;  // ancho de cada barra individual
  const gap     = grupW * 0.06;  // separación entre las dos barras del grupo

  // Base Y (eje X)
  const baseY = PAD_T + usableH;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full"
      style={{ height: "180px" }}
      aria-label="Gráfico de barras agrupadas: recepciones vs entregas por período"
    >
      {/* ── Línea de base ────────────────────────────────────────────────── */}
      <line
        x1={PAD_L} y1={baseY}
        x2={VW - PAD_R} y2={baseY}
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />

      {/* ── Líneas guía horizontales (25 % / 50 % / 75 %) ──────────────── */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={PAD_L}
          y1={PAD_T + usableH * (1 - f)}
          x2={VW - PAD_R}
          y2={PAD_T + usableH * (1 - f)}
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
      ))}

      {/* ── Barras agrupadas por período ─────────────────────────────────── */}
      {DATOS_ANALITICOS.map((d, i) => {
        // Centro del grupo en X
        const cx = PAD_L + i * grupW + grupW / 2;

        // Posición X de cada barra (ingreso a la izquierda, egreso a la derecha)
        const xIngreso = cx - gap / 2 - barW;
        const xEgreso  = cx + gap / 2;

        // Alturas proporcionales al máximo de cada serie (0–usableH px SVG)
        const hIngreso = (d.ingresos / MAX_INGRESOS) * usableH;
        const hEgreso  = (d.egresos  / MAX_EGRESOS)  * usableH;

        // Y superior de cada barra (SVG: Y crece hacia abajo)
        const yIngreso = baseY - hIngreso;
        const yEgreso  = baseY - hEgreso;

        return (
          <g key={d.periodo}>
            {/* ── Barra INGRESOS (verde esmeralda) ── */}
            <rect
              x={xIngreso}
              y={yIngreso}
              width={barW}
              height={Math.max(hIngreso, 1)}
              rx={2} ry={2}
              fill={COLOR_INGRESOS}
              fillOpacity={0.9}
            >
              <title>{`Ingresos ${d.periodo}: ${d.ingresos.toLocaleString("es-EC")} uds.`}</title>
            </rect>

            {/* Valor encima de la barra de ingresos */}
            <text
              x={xIngreso + barW / 2}
              y={yIngreso - 3}
              textAnchor="middle"
              fontSize="7"
              fontWeight="600"
              fill={COLOR_INGRESOS}
            >
              {d.ingresos}
            </text>

            {/* ── Barra EGRESOS (azul corporativo) ── */}
            <rect
              x={xEgreso}
              y={yEgreso}
              width={barW}
              height={Math.max(hEgreso, 1)}
              rx={2} ry={2}
              fill={COLOR_EGRESOS}
              fillOpacity={0.85}
            >
              <title>{`Egresos ${d.periodo}: ${d.egresos.toLocaleString("es-EC")} uds.`}</title>
            </rect>

            {/* Valor encima de la barra de egresos */}
            <text
              x={xEgreso + barW / 2}
              y={yEgreso - 3}
              textAnchor="middle"
              fontSize="7"
              fontWeight="600"
              fill={COLOR_EGRESOS}
            >
              {d.egresos}
            </text>

            {/* ── Etiqueta del período (eje X) ── */}
            <text
              x={cx}
              y={baseY + 14}
              textAnchor="middle"
              fontSize="9"
              fill="hsl(var(--muted-foreground))"
            >
              {d.periodo}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: Panel de analítica completo
// ═══════════════════════════════════════════════════════════════════════════════

function PanelAnalitico() {
  const totalIngresos = DATOS_ANALITICOS.reduce((s, d) => s + d.ingresos, 0);
  const totalEgresos  = DATOS_ANALITICOS.reduce((s, d) => s + d.egresos, 0);
  const balanceNeto   = totalIngresos - totalEgresos;
  const ultimoStock   = DATOS_ANALITICOS[DATOS_ANALITICOS.length - 1].stockFinal;

  return (
    <section className="space-y-4">
      {/* Encabezado de sección */}
      <div className="flex items-center gap-2">
        <BarChart3 size={18} className="text-primary" />
        <h3 className="text-lg font-semibold">Analítica de Inventario — Ene–Jun 2024</h3>
        <Badge variant="secondary" className="text-xs">
          1 000 registros semilla
        </Badge>
      </div>

      {/* KPIs superiores rápidos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total ingresos */}
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Ingresos (6M)</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {totalIngresos.toLocaleString("es-EC")}
          </p>
          <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={12} /> +12.4% vs semestre ant.
          </p>
        </div>

        {/* Total egresos */}
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Egresos (6M)</p>
          <p className="text-2xl font-bold text-destructive tabular-nums">
            {totalEgresos.toLocaleString("es-EC")}
          </p>
          <p className="flex items-center gap-1 text-xs text-destructive">
            <TrendingDown size={12} /> −8.1% vs semestre ant.
          </p>
        </div>

        {/* Balance neto */}
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Balance neto</p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              balanceNeto >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            )}
          >
            {balanceNeto >= 0 ? "+" : ""}
            {balanceNeto.toLocaleString("es-EC")}
          </p>
          <p className="text-xs text-muted-foreground">Unidades acumuladas</p>
        </div>

        {/* Stock actual */}
        <div className="rounded-lg border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Stock actual</p>
          <p className="text-2xl font-bold tabular-nums">
            {ultimoStock.toLocaleString("es-EC")}
          </p>
          <p className="text-xs text-muted-foreground">Jun 2024</p>
        </div>
      </div>

      {/* ── Gráficos: Barras (Ingresos/Egresos) + Línea SVG (Stock) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ══════════════════════════════════════════════════
            GRÁFICO 1 — Barras agrupadas: Recepciones vs Entregas
            Altura dinámica vía style={{ height }} — JIT-safe.
        ══════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recepciones vs Entregas por Período</CardTitle>
            <CardDescription className="text-xs">
              Flujo transaccional de{" "}
              <span className="font-mono text-foreground">inventario_bodegas</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Leyenda con los colores reales del SVG */}
            <div className="mb-3 flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2.5 rounded-sm"
                  style={{ backgroundColor: COLOR_INGRESOS }}
                />
                Ingresos (recepciones)
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2.5 rounded-sm"
                  style={{ backgroundColor: COLOR_EGRESOS }}
                />
                Egresos (entregas)
              </span>
            </div>

            {/* SVG de barras agrupadas — coordenadas absolutas, sin herencia CSS */}
            <GraficoBarrasAgrupadas />
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════
            GRÁFICO 2 — Línea SVG nativa: Evolución inv_saldo_final
            <polyline> traza la curva real; <circle> marca cada punto
            con tooltip nativo (title) al hacer hover.
        ══════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Evolución del Stock Disponible</CardTitle>
            <CardDescription className="text-xs">
              <span className="font-mono text-foreground">inv_saldo_final</span>{" "}
              por período contable
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Leyenda */}
            <div className="mb-3 flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <svg width="16" height="4">
                  <line x1="0" y1="2" x2="16" y2="2" stroke="var(--primary)" strokeWidth="2" />
                </svg>
                Stock final (uds.)
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="8" height="8">
                  <circle cx="4" cy="4" r="3" fill="var(--primary)" />
                </svg>
                Punto de período
              </span>
            </div>

            {/*
              SVG con viewBox fijo 300×150.
              Los puntos se calculan con coordenadas normalizadas:
                x = margen + (idx / (n-1)) * anchoÚtil
                y = margenInferior - (stock / MAX_STOCK) * altoÚtil
              Esto produce coordenadas correctas sin JS del DOM.
            */}
            {(() => {
              const W = 300;     // ancho del viewBox
              const H = 150;     // alto del viewBox
              const PAD_L = 12;  // margen izquierdo
              const PAD_R = 12;  // margen derecho
              const PAD_T = 16;  // margen superior (espacio para el pico)
              const PAD_B = 24;  // margen inferior (espacio para etiquetas)
              const usableW = W - PAD_L - PAD_R;
              const usableH = H - PAD_T - PAD_B;
              const n = DATOS_ANALITICOS.length;
              const minStock = Math.min(...DATOS_ANALITICOS.map((d) => d.stockFinal));
              const rangoStock = MAX_STOCK - minStock || 1; // evita división por cero

              const pts = DATOS_ANALITICOS.map((d, i) => ({
                x: PAD_L + (i / (n - 1)) * usableW,
                // Normaliza en el rango [minStock, MAX_STOCK] para maximizar la amplitud visual
                y: PAD_T + usableH - ((d.stockFinal - minStock) / rangoStock) * usableH,
                data: d,
              }));

              const polylinePoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

              return (
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full"
                  style={{ height: "160px" }}
                  aria-label="Gráfico de línea: evolución del stock disponible"
                >
                  {/* Línea de base */}
                  <line
                    x1={PAD_L}
                    y1={H - PAD_B}
                    x2={W - PAD_R}
                    y2={H - PAD_B}
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                  />

                  {/* Área bajo la curva (relleno semitransparente) */}
                  <polyline
                    points={[
                      `${pts[0].x.toFixed(1)},${(H - PAD_B).toFixed(1)}`,
                      ...pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
                      `${pts[n - 1].x.toFixed(1)},${(H - PAD_B).toFixed(1)}`,
                    ].join(" ")}
                    fill="var(--primary)"
                    fillOpacity="0.08"
                    stroke="none"
                  />

                  {/* Línea principal del stock */}
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {/* Puntos interactivos con tooltip nativo */}
                  {pts.map((p, i) => (
                    <g key={i}>
                      {/* Halo invisible para área de hover más grande */}
                      <circle cx={p.x} cy={p.y} r={10} fill="transparent">
                        <title>{`${p.data.periodo}: ${p.data.stockFinal.toLocaleString("es-EC")} uds.`}</title>
                      </circle>
                      {/* Punto visible */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={4}
                        fill="var(--primary)"
                        stroke="hsl(var(--background))"
                        strokeWidth="2"
                      />
                      {/* Etiqueta de eje X */}
                      <text
                        x={p.x}
                        y={H - PAD_B + 14}
                        textAnchor="middle"
                        fontSize="9"
                        fill="hsl(var(--muted-foreground))"
                      >
                        {p.data.periodo}
                      </text>
                      {/* Valor sobre el punto (solo el primero y el último, para no saturar) */}
                      {(i === 0 || i === n - 1) && (
                        <text
                          x={p.x + (i === 0 ? 4 : -4)}
                          y={p.y - 8}
                          textAnchor={i === 0 ? "start" : "end"}
                          fontSize="9"
                          fontWeight="600"
                          fill="hsl(var(--foreground))"
                        >
                          {p.data.stockFinal.toLocaleString("es-EC")}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              );
            })()}

            {/* Resumen textual bajo el SVG */}
            <p className="mt-1 text-right text-xs text-muted-foreground">
              Cierre Jun:{" "}
              <span className="font-semibold text-foreground">
                {ultimoStock.toLocaleString("es-EC")} uds.
              </span>
              {" · "}
              <span
                className={cn(
                  "font-semibold",
                  ultimoStock >= DATOS_ANALITICOS[0].stockFinal
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                {ultimoStock >= DATOS_ANALITICOS[0].stockFinal ? "▲" : "▼"}{" "}
                {Math.abs(ultimoStock - DATOS_ANALITICOS[0].stockFinal).toLocaleString("es-EC")} vs Ene
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: Badge + icono de rol
// ═══════════════════════════════════════════════════════════════════════════════

const ROL_CONFIG: Record<
  RolUsuario,
  { label: string; colorClass: string; Icon: React.ElementType }
> = {
  ADMIN: {
    label: "Administrador",
    colorClass:
      "bg-primary text-primary-foreground hover:bg-primary/90",
    Icon: ShieldCheck,
  },
  EMPLEADO_BODEGA: {
    label: "Empleado Bodega",
    colorClass:
      "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700",
    Icon: ShieldAlert,
  },
  CLIENTE_VISITANTE: {
    label: "Visitante (Solo Lectura)",
    colorClass:
      "bg-muted text-muted-foreground hover:bg-muted/80 border",
    Icon: ShieldOff,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardInventarioPage() {

  // ── Única instancia del controlador para todo el módulo ────────────────────
  const {
    loading,
    isAnyLoading,
    stockConsultado,
    resultadoIngreso,
    resultadoSincronizacion,
    error,
    handleConsultarStock,
    handleIngresarStock,
    handleSincronizarCloud,
    limpiarError,
  } = useInventarioController();

  // ── Estado local: ID de variante a consultar ───────────────────────────────
  const [inputVariante, setInputVariante] = useState<string>("");

  // ── Estado de sesión del usuario: se inicializa leyendo el JWT del browser ──
  // Estrategia:
  //   1. Leer jwt_token del localStorage (establecido por authService de Alejandro).
  //   2. Decodificar el payload Base64 sin verificar firma (solo para UI — el
  //      backend verifica la firma con verificarToken()).
  //   3. Mapear id_rol (número) al enum RolUsuario de este módulo.
  //   4. Si no hay token (modo dev / sin sesión), usar stub "Paul Admin / ADMIN".
  //
  // Mapeo de roles acordado con Alejandro (authMiddleware.js):
  //   id_rol === 1  → ADMIN
  //   id_rol === 2  → EMPLEADO_BODEGA
  //   cualquier otro → CLIENTE_VISITANTE
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioActivo>({
    nombre: "Paul Admin",
    rol: "ADMIN",
  });

  // Flag para saber si hay sesión real (oculta el selector manual en producción)
  const [hayTokenReal, setHayTokenReal] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return; // sin sesión: deja el stub activo

    try {
      const parts = token.split(".");
      if (parts.length !== 3) return;

      // Decodificación del payload Base64Url → JSON
      // (misma técnica usada en src/app/compras/page.tsx)
      const payload = JSON.parse(atob(parts[1])) as {
        id_rol?: number;
        usu_nombre?: string;
        rol?: string;           // por si el SSO envía el string directamente
      };

      // Nombre a mostrar: prioriza usu_nombre, fallback a "Usuario"
      const nombre = payload.usu_nombre ?? "Usuario";

      // Determinar RolUsuario según el campo que traiga el JWT
      let rol: RolUsuario;
      if (typeof payload.rol === "string" &&
          ["ADMIN", "EMPLEADO_BODEGA", "CLIENTE_VISITANTE"].includes(payload.rol)) {
        // El SSO ya envía el string del rol directamente
        rol = payload.rol as RolUsuario;
      } else {
        // Mapeo numérico: id_rol 1 = ADMIN, 2 = EMPLEADO_BODEGA, resto = visitante
        const idRol = Number(payload.id_rol);
        rol = idRol === 1 ? "ADMIN"
            : idRol === 2 ? "EMPLEADO_BODEGA"
            : "CLIENTE_VISITANTE";
      }

      setUsuarioActivo({ nombre, rol });
      setHayTokenReal(true);
    } catch {
      // Token malformado: deja el stub activo sin romper la UI
      console.warn("[InventarioDashboard] No se pudo decodificar el JWT.");
    }
  }, []); // solo al montar — el token no cambia sin recarga de página

  const ejecutarConsulta = () => {
    const id = parseInt(inputVariante, 10);
    if (!isNaN(id) && id > 0) {
      handleConsultarStock(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") ejecutarConsulta();
  };

  // ── Flags de permisos derivados del rol activo ─────────────────────────────
  const puedeIngresarStock =
    usuarioActivo.rol === "ADMIN" || usuarioActivo.rol === "EMPLEADO_BODEGA";
  const puedeSincronizar = usuarioActivo.rol === "ADMIN";
  const puedeVerTabla    = usuarioActivo.rol === "ADMIN";
  const esSoloLectura    = usuarioActivo.rol === "CLIENTE_VISITANTE";

  const rolCfg = ROL_CONFIG[usuarioActivo.rol];
  const RolIcon = rolCfg.Icon;

  return (
    <BaseLayout
      title="Dashboard de Inventario"
      description="Control de stock, recepciones y sincronización con Firebase · Comercial JW Cóndor"
    >
      <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">

        {/* ══════════════════════════════════════════════════════════════════
            BANNER SUPERIOR — Identidad del módulo + Selector de Rol (STUB)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Identidad */}
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Package size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Módulo de Inventario</h2>
                  <Badge variant="default" className="bg-emerald-600 text-white text-xs hover:bg-emerald-600">
                    LIVE
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Responsable: <strong>Paul</strong> · API:{" "}
                  <span className="font-mono text-xs">api-inventario-1r1w.onrender.com</span>
                </p>
              </div>
            </div>

            {/* Bloque derecho: conexiones + selector de rol */}
            <div className="flex flex-col items-end gap-2">
              {/* Estado de conexión */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Database size={14} />
                  Supabase PostgreSQL
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Wifi size={14} />
                  Firebase Realtime DB
                </span>
              </div>

              {/* ─── Selector de rol: solo visible en modo dev (sin JWT real) ─── */}
              {!hayTokenReal ? (
                /* Dropdown de simulación — desaparece cuando hay sesión real */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      id="selector-rol-usuario"
                      variant="outline"
                      size="sm"
                      className={cn("h-8 gap-2 text-xs font-medium", rolCfg.colorClass)}
                    >
                      <RolIcon size={13} />
                      {usuarioActivo.nombre}
                      <ChevronDown size={12} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Simular sesión (stub SSO — modo dev)
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      id="rol-admin"
                      onClick={() =>
                        setUsuarioActivo({ nombre: "Paul Admin", rol: "ADMIN" })
                      }
                      className="gap-2 text-sm"
                    >
                      <ShieldCheck size={14} className="text-primary" />
                      <div>
                        <p className="font-medium">ADMIN</p>
                        <p className="text-xs text-muted-foreground">Permisos completos</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      id="rol-empleado"
                      onClick={() =>
                        setUsuarioActivo({ nombre: "María Bodega", rol: "EMPLEADO_BODEGA" })
                      }
                      className="gap-2 text-sm"
                    >
                      <ShieldAlert size={14} className="text-amber-500" />
                      <div>
                        <p className="font-medium">EMPLEADO_BODEGA</p>
                        <p className="text-xs text-muted-foreground">Sin sincronización masiva</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      id="rol-visitante"
                      onClick={() =>
                        setUsuarioActivo({ nombre: "Cliente Visitante", rol: "CLIENTE_VISITANTE" })
                      }
                      className="gap-2 text-sm"
                    >
                      <ShieldOff size={14} className="text-muted-foreground" />
                      <div>
                        <p className="font-medium">CLIENTE_VISITANTE</p>
                        <p className="text-xs text-muted-foreground">Solo lectura</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* Badge de sesión real — reemplaza el selector en producción */
                <div
                  id="sesion-activa-badge"
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium",
                    rolCfg.colorClass
                  )}
                >
                  <RolIcon size={13} />
                  <span>{usuarioActivo.nombre}</span>
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {rolCfg.label}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Decoración de fondo */}
          <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/5" />
          <div className="pointer-events-none absolute -bottom-6 right-16 size-24 rounded-full bg-primary/5" />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BANNER DE PERMISOS — Visible solo para roles restringidos
        ═══════════════════════════════════════════════════════════════════ */}
        {esSoloLectura && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
          >
            <Lock size={16} className="shrink-0" />
            <div>
              <p className="font-semibold">Modo de Solo Lectura</p>
              <p className="text-xs opacity-80">
                Tu sesión como{" "}
                <strong>{usuarioActivo.nombre}</strong> no tiene permisos para
                registrar movimientos de inventario.
              </p>
            </div>
            <Badge
              variant="outline"
              className="ml-auto shrink-0 border-amber-400 text-amber-700 dark:border-amber-600 dark:text-amber-400"
            >
              Permisos Insuficientes
            </Badge>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ALERTA DE ERROR — Visible solo cuando el controlador reporta error
        ═══════════════════════════════════════════════════════════════════ */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Error en la operación</p>
                <p className="mt-0.5 text-destructive/80">{error}</p>
              </div>
            </div>
            <Button
              id="btn-cerrar-error-inventario"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={limpiarError}
            >
              <X size={14} />
              <span className="sr-only">Cerrar alerta</span>
            </Button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 1 — Panel analítico de inventario (gráficos CSS Tailwind)
        ═══════════════════════════════════════════════════════════════════ */}
        <PanelAnalitico />

        <Separator />

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 2 — Consulta rápida de stock + KPIs (StockCard)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">Consulta de Stock por Variante</h3>
          </div>

          {/* Buscador de variante */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="input-consultar-variante"
                type="number"
                placeholder="ID de variante... (Ej: 101)"
                className="pl-9"
                value={inputVariante}
                onChange={(e) => setInputVariante(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAnyLoading}
                min={1}
              />
            </div>
            <Button
              id="btn-consultar-stock"
              onClick={ejecutarConsulta}
              disabled={isAnyLoading || !inputVariante}
              variant="default"
            >
              {loading.consultando ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Consultando...
                </span>
              ) : (
                <>
                  <Search size={15} className="mr-1.5" />
                  Consultar Stock
                </>
              )}
            </Button>
          </div>

          {/* Tarjetas KPI — leen stockConsultado del controlador */}
          <StockCard
            stockConsultado={stockConsultado}
            cargando={loading.consultando}
            idVariante={inputVariante ? parseInt(inputVariante, 10) : undefined}
          />
        </section>

        <Separator />

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 3 — Grilla principal con renderizado condicional por ROL
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">

            {/* Columna lateral: Formulario + Sincronización */}
            <div className="flex flex-col gap-6">

              {/* ─── Formulario: visible para ADMIN y EMPLEADO_BODEGA ─── */}
              {puedeIngresarStock ? (
                <IngresarStockForm
                  onSubmit={handleIngresarStock}
                  cargandoIngreso={loading.ingresando}
                  bloqueadoGlobal={isAnyLoading}
                  resultadoIngreso={resultadoIngreso}
                />
              ) : (
                /* ─── Tarjeta bloqueada para CLIENTE_VISITANTE ─── */
                <Card className="border-dashed opacity-60">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lock size={18} className="text-muted-foreground" />
                      <CardTitle className="text-base text-muted-foreground">
                        Ingresar Mercadería a Bodega
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Esta funcionalidad requiere permisos de escritura.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant="outline"
                      className="border-amber-400 text-amber-700 dark:border-amber-600 dark:text-amber-400"
                    >
                      <Lock size={11} className="mr-1" />
                      Modo Solo Lectura — Permisos Insuficientes
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* ─── Sincronización: visible SOLO para ADMIN ─── */}
              {puedeSincronizar && (
                <SincronizarButton
                  onSincronizar={handleSincronizarCloud}
                  cargandoSincronizacion={loading.sincronizando}
                  bloqueadoGlobal={isAnyLoading}
                  resultadoSincronizacion={resultadoSincronizacion}
                />
              )}

              {/* ─── Aviso para EMPLEADO_BODEGA sobre sincronización ─── */}
              {usuarioActivo.rol === "EMPLEADO_BODEGA" && (
                <Card className="border-dashed opacity-60">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-muted-foreground" />
                      <CardTitle className="text-sm text-muted-foreground">
                        Sincronizar E-Commerce
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      La sincronización masiva con Firebase está reservada para
                      el rol <strong>ADMIN</strong>.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>

            {/* Columna principal: Tabla — visible solo para ADMIN */}
            <div>
              {puedeVerTabla ? (
                <StockTable
                  titulo="Movimientos de Inventario — inventario_bodegas"
                  cargando={loading.consultando}
                />
              ) : (
                /* Placeholder de tabla bloqueada */
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center opacity-60">
                  <Lock size={32} className="text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-muted-foreground">
                      Tabla de Movimientos
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Acceso restringido al rol <strong>ADMIN</strong>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-400 text-amber-700 dark:border-amber-600 dark:text-amber-400"
                  >
                    Permisos Insuficientes
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </BaseLayout>
  );
}
