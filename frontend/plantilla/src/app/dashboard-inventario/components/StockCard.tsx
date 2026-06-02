/**
 * StockCard.tsx
 * -------------
 * CAPA DE VISTA — Componente de resumen de stock
 * Módulo de Inventario | Proyecto RDA3 — Comercial JW Cóndor
 *
 * Responsabilidades:
 *  ✅ Renderiza tarjetas visuales con el estado del stock consultado.
 *  ✅ Aplica lógica semántica: stock < 10 → badge destructive (rojo), ≥ 10 → badge verde.
 *  ✅ Muestra skeleton de carga mientras `loading.consultando` sea true.
 *  ✅ Solo lee estados del hook — no llama directamente al servicio.
 *  ✅ No realiza peticiones fetch/axios (Golden Rule #2).
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, TrendingUp, TrendingDown, Warehouse } from "lucide-react";
import type { ConsultarStockResponse } from "@/services/inventarioService";

// ─── Props ────────────────────────────────────────────────────────────────────

interface StockCardProps {
  /** Resultado de la última consulta al endpoint GET /api/inventario/stock/:idVariante */
  stockConsultado: ConsultarStockResponse | null;
  /** true mientras el endpoint está respondiendo */
  cargando: boolean;
  /** ID de variante actualmente consultada (para contexto visual) */
  idVariante?: number;
}

// ─── Umbral semántico ─────────────────────────────────────────────────────────

const UMBRAL_STOCK_CRITICO = 10;

// ─── Subcomponente: Tarjeta individual métrica ────────────────────────────────

interface MetricCardProps {
  titulo: string;
  valor: React.ReactNode;
  descripcion: string;
  icono: React.ReactNode;
  cargando: boolean;
}

function MetricCard({ titulo, valor, descripcion, icono, cargando }: MetricCardProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {titulo}
          </CardDescription>
          <span className="text-muted-foreground">{icono}</span>
        </div>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold tracking-tight">{valor}</div>
            <p className="text-muted-foreground mt-1 text-xs">{descripcion}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function StockCard({ stockConsultado, cargando, idVariante }: StockCardProps) {
  const stockDisponible = stockConsultado?.stock_disponible;
  const idBodega = stockConsultado?.id_bodega;

  // Lógica semántica: determina el badge según nivel de stock
  const nivelStock = (): { label: string; variant: "destructive" | "default" | "secondary" } => {
    if (stockDisponible === undefined) return { label: "Sin datos", variant: "secondary" };
    if (stockDisponible < UMBRAL_STOCK_CRITICO)
      return { label: `⚠ Stock crítico (< ${UMBRAL_STOCK_CRITICO})`, variant: "destructive" };
    return { label: "Stock saludable", variant: "default" };
  };

  const { label: badgeLabel, variant: badgeVariant } = nivelStock();

  // Color del valor principal según nivel de stock
  const colorValor =
    stockDisponible !== undefined && stockDisponible < UMBRAL_STOCK_CRITICO
      ? "text-destructive"
      : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="space-y-4">
      {/* Encabezado de sección con contexto de la variante consultada */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resumen de Inventario</h3>
          {idVariante && (
            <p className="text-muted-foreground text-sm">
              Variante ID:{" "}
              <span className="font-mono font-medium text-foreground">#{idVariante}</span>
            </p>
          )}
        </div>
        {!cargando && stockConsultado && (
          <Badge variant={badgeVariant} className="text-xs">
            {badgeLabel}
          </Badge>
        )}
      </div>

      {/* Grid de tarjetas métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Tarjeta 1: Stock disponible */}
        <MetricCard
          titulo="Stock Disponible"
          icono={<Package size={18} />}
          descripcion="Unidades listas para despacho en la bodega asignada"
          cargando={cargando}
          valor={
            stockDisponible !== undefined ? (
              <span className={colorValor}>{stockDisponible.toLocaleString("es-EC")}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          }
        />

        {/* Tarjeta 2: Bodega asignada */}
        <MetricCard
          titulo="Bodega Asignada"
          icono={<Warehouse size={18} />}
          descripcion="Nodo de almacenamiento que gestiona esta variante"
          cargando={cargando}
          valor={
            idBodega !== undefined ? (
              <span className="font-mono">BOD-{String(idBodega).padStart(3, "0")}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          }
        />

        {/* Tarjeta 3: Estado del sistema */}
        <MetricCard
          titulo="Estado del Nodo"
          icono={
            stockDisponible !== undefined && stockDisponible < UMBRAL_STOCK_CRITICO ? (
              <TrendingDown size={18} className="text-destructive" />
            ) : (
              <TrendingUp size={18} className="text-emerald-500" />
            )
          }
          descripcion={
            stockDisponible !== undefined && stockDisponible < UMBRAL_STOCK_CRITICO
              ? "Se recomienda generar una Orden de Compra"
              : "Niveles dentro del rango operativo"
          }
          cargando={cargando}
          valor={
            !stockConsultado ? (
              <span className="text-muted-foreground text-xl">Sin consulta</span>
            ) : stockDisponible !== undefined && stockDisponible < UMBRAL_STOCK_CRITICO ? (
              <span className="text-destructive text-xl">Crítico</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 text-xl">Óptimo</span>
            )
          }
        />
      </div>

      {/* Mensaje de estado vacío */}
      {!cargando && !stockConsultado && (
        <div className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed py-8 text-sm">
          <Package size={16} className="mr-2 opacity-50" />
          Ingresa un ID de variante para consultar el stock disponible.
        </div>
      )}
    </div>
  );
}
