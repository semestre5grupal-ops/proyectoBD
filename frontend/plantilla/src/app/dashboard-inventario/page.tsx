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
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
import { ControlesGestion, type RolInventario } from "./components/ControlesGestion";

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
// Azul corporativo — egresos/entregas
const COLOR_EGRESOS  = "#3b82f6";

const PIE_DATA = [
  { name: 'Pichincha', value: 65, color: '#10b981' },
  { name: 'Guayas', value: 25, color: '#10b981' },
  { name: 'Azuay', value: 5, color: '#ff0000' },
  { name: 'Manabí', value: 5, color: '#ff0000' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTE: Panel de analítica completo con Recharts
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
          Live BI Sync
        </Badge>
      </div>

      {/* KPIs superiores rápidos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total ingresos */}
        <div className="rounded-lg border bg-card p-4 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground">Ingresos (6M)</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {totalIngresos.toLocaleString("es-EC")}
          </p>
          <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={12} /> +12.4% vs semestre ant.
          </p>
        </div>

        {/* Total egresos */}
        <div className="rounded-lg border bg-card p-4 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground">Egresos (6M)</p>
          <p className="text-2xl font-bold text-destructive tabular-nums">
            {totalEgresos.toLocaleString("es-EC")}
          </p>
          <p className="flex items-center gap-1 text-xs text-destructive">
            <TrendingDown size={12} /> −8.1% vs semestre ant.
          </p>
        </div>

        {/* Balance neto */}
        <div className="rounded-lg border bg-card p-4 space-y-1 shadow-sm">
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
        <div className="rounded-lg border bg-card p-4 space-y-1 shadow-sm">
          <p className="text-xs text-muted-foreground">Stock actual</p>
          <p className="text-2xl font-bold tabular-nums">
            {ultimoStock.toLocaleString("es-EC")}
          </p>
          <p className="text-xs text-muted-foreground">Jun 2024</p>
        </div>
      </div>

      {/* Grid de 3 Tarjetas BI: Barras, Pastel, Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Tarjeta 1: Gráfico de Barras */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl p-5 flex flex-col">
          <h4 className="text-slate-100 font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-400"/> Movimientos (6 Meses)
          </h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATOS_ANALITICOS} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Recepciones" />
                <Bar dataKey="egresos" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Entregas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tarjeta 2: Gráfico de Pastel */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl p-5 flex flex-col">
          <h4 className="text-slate-100 font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400"/> Distribución de Stock
          </h4>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={PIE_DATA} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={65} 
                  outerRadius={100} 
                  paddingAngle={4} 
                  dataKey="value"
                  stroke="none"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} itemStyle={{color: '#f8fafc'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Leyenda manual */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-auto text-xs text-slate-300">
             {PIE_DATA.map((entry, index) => (
               <div key={index} className="flex items-center gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: entry.color}}></div>
                 {entry.name}
               </div>
             ))}
          </div>
        </div>

        {/* Mapa Cartográfico Interactivo BI (VERSIÓN A PRUEBA DE FALLOS) */}
        <div className="relative w-full h-[350px] md:h-[400px] rounded-xl overflow-hidden border border-gray-700 shadow-2xl bg-slate-800 flex items-center justify-center">
            
            {/* Imagen FORZADA del mapa de Ecuador. 'invert opacity-50' asegura que se vea blanco sobre el fondo oscuro */}
            <img 
                src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Ecuador_location_map.svg" 
                alt="Mapa de Ecuador" 
                className="absolute w-full h-full object-contain invert opacity-50 pointer-events-none p-2 md:p-6"
            />

            {/* Etiqueta de Sistema BI */}
            <div className="absolute top-4 right-4 bg-black/80 text-green-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md border border-green-500/30 font-mono z-10 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                BI Analytics Map
            </div>

            {/* NODO 1: Pichincha (Quito) - VERDE */}
            <div className="absolute top-[28%] left-[62%] group cursor-pointer z-20">
                <div className="w-5 h-5 bg-green-500 rounded-full border-[2px] border-white shadow-[0_0_15px_rgba(34,197,94,1)] animate-bounce"></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-2xl border border-slate-600">
                        <p className="font-bold text-green-400 border-b border-slate-600 pb-1 mb-1">Pichincha</p>
                        <div className="flex justify-between mt-1"><span className="text-gray-400">Compras:</span> <span className="font-mono">1,450 u.</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Ventas:</span> <span className="font-mono font-bold text-white">3,890 u.</span></div>
                    </div>
                </div>
            </div>

            {/* NODO 2: Guayas (Guayaquil) - VERDE */}
            <div className="absolute top-[62%] left-[42%] group cursor-pointer z-20">
                <div className="w-4 h-4 bg-green-500 rounded-full border-[2px] border-white shadow-[0_0_15px_rgba(34,197,94,1)] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-2xl border border-slate-600">
                        <p className="font-bold text-green-400 border-b border-slate-600 pb-1 mb-1">Guayas</p>
                        <div className="flex justify-between mt-1"><span className="text-gray-400">Compras:</span> <span className="font-mono">980 u.</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Ventas:</span> <span className="font-mono font-bold text-white">2,100 u.</span></div>
                    </div>
                </div>
            </div>

            {/* NODO 3: Azuay (Cuenca) - ROJO */}
            <div className="absolute top-[75%] left-[50%] group cursor-pointer z-20">
                <div className="w-4 h-4 bg-red-500 rounded-full border-[2px] border-white shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse"></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-2xl border border-red-900/50">
                        <p className="font-bold text-red-400 border-b border-slate-600 pb-1 mb-1">Azuay</p>
                        <div className="flex justify-between mt-1"><span className="text-gray-400">Compras:</span> <span className="font-mono text-red-300">120 u.</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Ventas:</span> <span className="font-mono font-bold text-red-400">85 u.</span></div>
                    </div>
                </div>
            </div>

            {/* NODO 4: Manabí (Manta) - ROJO */}
            <div className="absolute top-[48%] left-[32%] group cursor-pointer z-20">
                <div className="w-3 h-3 bg-red-500 rounded-full border-[2px] border-white shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-2xl border border-red-900/50">
                        <p className="font-bold text-red-400 border-b border-slate-600 pb-1 mb-1">Manabí</p>
                        <div className="flex justify-between mt-1"><span className="text-gray-400">Compras:</span> <span className="font-mono text-red-300">45 u.</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Ventas:</span> <span className="font-mono font-bold text-red-400">30 u.</span></div>
                    </div>
                </div>
            </div>
        </div>

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

  // ── Rol de Inventario (JEFE/AUXILIAR/OPERATIVO) leído del id_rol numérico del JWT ──
  const [rolInventario, setRolInventario] = useState<RolInventario | null>(null);

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

      // ── Mapeo al sistema de roles del Agente IA (id_rol numérico) ──────────
      // Acuerdo: 8 = Jefe, 9 = Auxiliar, 10 = Operativo
      const idRolNum = Number(payload.id_rol);
      if (idRolNum === 8) setRolInventario("JEFE_INVENTARIO");
      else if (idRolNum === 9) setRolInventario("AUXILIAR_INVENTARIO");
      else if (idRolNum === 10) setRolInventario("OPERATIVO_INVENTARIO");

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

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 4 — Controles de Gestión dinámicos por rol del Agente IA
            Visible solo cuando el JWT indica id_rol 8, 9 o 10.
            NOTA: No altera gráficos, consulta de variantes ni Firebase.
        ═══════════════════════════════════════════════════════════════════ */}
        {rolInventario && (
          <>
            <Separator />
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Controles de Gestión</h3>
                <Badge variant="outline" className="text-xs">
                  {rolInventario === "JEFE_INVENTARIO" && "Jefe de Inventario"}
                  {rolInventario === "AUXILIAR_INVENTARIO" && "Auxiliar de Inventario"}
                  {rolInventario === "OPERATIVO_INVENTARIO" && "Operativo de Bodega"}
                </Badge>
              </div>
              <ControlesGestion
                rolActivo={rolInventario}
                nombreUsuario={usuarioActivo.nombre}
              />
            </section>
          </>
        )}

      </div>
    </BaseLayout>
  );
}
