/**
 * StockTable.tsx
 * ---------------
 * CAPA DE VISTA — Tabla de Movimientos de Inventario
 * Módulo de Inventario | Proyecto RDA3 — Comercial JW Cóndor
 *
 * Responsabilidades:
 *  ✅ Renderiza una tabla Shadcn/ui con columnas que reflejan la estructura
 *     física real de la tabla `inventario_bodegas` en Supabase.
 *  ✅ Columnas: ID Bodega, ID Variante, Período, Saldo Inicial, Ingresos, Egresos, Saldo Final.
 *  ✅ Aplica lógica semántica de color en "Saldo Final" (< 10 → rojo, ≥ 10 → verde).
 *  ✅ Muestra skeleton de filas mientras carga.
 *  ✅ Acepta datos reales del controlador O datos mock con la misma forma de tipo.
 *  ✅ No realiza peticiones fetch (Golden Rule #2).
 */

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Tipo que refleja las columnas físicas de inventario_bodegas ──────────────

export interface FilaInventario {
  /** FK → tabla bodegas */
  id_bodega: number;
  /** FK → variantes_producto */
  id_variante: number;
  /** Período contable (formato: YYYY-MM o similar) */
  inv_periodo: string;
  /** Stock inicial al comienzo del período */
  inv_saldo_inicial: number;
  /** Acumulado de unidades ingresadas en el período */
  inv_qty_ingresos: number;
  /** Acumulado de unidades egresadas en el período */
  inv_qty_egresos: number;
  /** Stock disponible actual: saldo_inicial + ingresos - egresos */
  inv_saldo_final: number;
}

// ─── Datos mock estructurados con las columnas físicas reales ─────────────────
// Usados como fallback si no se pasan datos reales desde el controlador.

const MOCK_INVENTARIO: FilaInventario[] = [
  {
    id_bodega: 1,
    id_variante: 101,
    inv_periodo: "2024-06",
    inv_saldo_inicial: 200,
    inv_qty_ingresos: 150,
    inv_qty_egresos: 95,
    inv_saldo_final: 255,
  },
  {
    id_bodega: 1,
    id_variante: 102,
    inv_periodo: "2024-06",
    inv_saldo_inicial: 80,
    inv_qty_ingresos: 0,
    inv_qty_egresos: 76,
    inv_saldo_final: 4,
  },
  {
    id_bodega: 2,
    id_variante: 203,
    inv_periodo: "2024-06",
    inv_saldo_inicial: 500,
    inv_qty_ingresos: 300,
    inv_qty_egresos: 412,
    inv_saldo_final: 388,
  },
  {
    id_bodega: 2,
    id_variante: 204,
    inv_periodo: "2024-06",
    inv_saldo_inicial: 30,
    inv_qty_ingresos: 0,
    inv_qty_egresos: 28,
    inv_saldo_final: 2,
  },
  {
    id_bodega: 3,
    id_variante: 310,
    inv_periodo: "2024-06",
    inv_saldo_inicial: 1200,
    inv_qty_ingresos: 600,
    inv_qty_egresos: 741,
    inv_saldo_final: 1059,
  },
];

// ─── Umbral de stock crítico (consistente con StockCard) ─────────────────────

const UMBRAL_STOCK_CRITICO = 10;

// ─── Props ────────────────────────────────────────────────────────────────────

interface StockTableProps {
  /** Filas de inventario. Si es undefined o vacío, usa MOCK_INVENTARIO. */
  filas?: FilaInventario[];
  /** true mientras se cargan datos reales del backend */
  cargando?: boolean;
  /** Título descriptivo sobre la tabla */
  titulo?: string;
}

// ─── Subcomponente: Badge de nivel de stock ───────────────────────────────────

function BadgeStock({ valor }: { valor: number }) {
  const esCritico = valor < UMBRAL_STOCK_CRITICO;
  return (
    <Badge
      variant={esCritico ? "destructive" : "outline"}
      className={cn(
        "font-mono tabular-nums",
        !esCritico && "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      )}
    >
      {valor.toLocaleString("es-EC")}
    </Badge>
  );
}

// ─── Subcomponente: Filas skeleton ────────────────────────────────────────────

function SkeletonFilas({ cantidad = 5 }: { cantidad?: number }) {
  return (
    <>
      {Array.from({ length: cantidad }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full max-w-[80px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function StockTable({
  filas,
  cargando = false,
  titulo = "Detalle de Inventario por Bodega",
}: StockTableProps) {

  const datos: FilaInventario[] = filas && filas.length > 0 ? filas : MOCK_INVENTARIO;
  const esMock = !filas || filas.length === 0;

  return (
    <div className="space-y-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{titulo}</h3>
          <p className="text-muted-foreground text-sm">
            Columnas físicas de la tabla{" "}
            <span className="font-mono text-foreground">inventario_bodegas</span>{" "}
            en Supabase
            {esMock && !cargando && (
              <span className="ml-2 rounded-sm bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                datos de demostración
              </span>
            )}
          </p>
        </div>

        {/* Leyenda semántica */}
        <div className="hidden items-center gap-3 text-xs sm:flex">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            Stock saludable (≥ {UMBRAL_STOCK_CRITICO})
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-destructive" />
            Stock crítico (&lt; {UMBRAL_STOCK_CRITICO})
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border">
        <Table>
          <TableCaption className="pb-3">
            {cargando
              ? "Cargando datos del inventario..."
              : esMock
              ? "Vista previa con datos de demostración — conecta el controlador para ver datos reales."
              : `Mostrando ${datos.length} registro${datos.length !== 1 ? "s" : ""} del inventario.`}
          </TableCaption>

          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">ID Bodega</TableHead>
              <TableHead className="font-semibold">ID Variante</TableHead>
              <TableHead className="font-semibold">Período</TableHead>
              <TableHead className="text-right font-semibold">Saldo Inicial</TableHead>
              <TableHead className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                + Ingresos
              </TableHead>
              <TableHead className="text-right font-semibold text-destructive">
                − Egresos
              </TableHead>
              <TableHead className="text-right font-semibold">Saldo Final</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {cargando ? (
              <SkeletonFilas cantidad={5} />
            ) : (
              datos.map((fila) => (
                <TableRow
                  key={`${fila.id_bodega}-${fila.id_variante}-${fila.inv_periodo}`}
                  className={cn(
                    "transition-colors",
                    fila.inv_saldo_final < UMBRAL_STOCK_CRITICO &&
                      "bg-destructive/5 hover:bg-destructive/10"
                  )}
                >
                  {/* ID Bodega */}
                  <TableCell>
                    <span className="font-mono text-xs font-medium">
                      BOD-{String(fila.id_bodega).padStart(3, "0")}
                    </span>
                  </TableCell>

                  {/* ID Variante */}
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      #{fila.id_variante}
                    </span>
                  </TableCell>

                  {/* Período */}
                  <TableCell>
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {fila.inv_periodo}
                    </span>
                  </TableCell>

                  {/* Saldo Inicial */}
                  <TableCell className="text-right">
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {fila.inv_saldo_inicial.toLocaleString("es-EC")}
                    </span>
                  </TableCell>

                  {/* Ingresos */}
                  <TableCell className="text-right">
                    <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{fila.inv_qty_ingresos.toLocaleString("es-EC")}
                    </span>
                  </TableCell>

                  {/* Egresos */}
                  <TableCell className="text-right">
                    <span className="font-mono tabular-nums text-destructive">
                      −{fila.inv_qty_egresos.toLocaleString("es-EC")}
                    </span>
                  </TableCell>

                  {/* Saldo Final — con badge semántico */}
                  <TableCell className="text-right">
                    <BadgeStock valor={fila.inv_saldo_final} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
