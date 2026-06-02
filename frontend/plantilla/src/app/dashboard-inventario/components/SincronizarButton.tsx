/**
 * SincronizarButton.tsx
 * ----------------------
 * CAPA DE VISTA — Botón de Sincronización Firebase
 * Módulo de Inventario | Proyecto RDA3 — Comercial JW Cóndor
 *
 * Responsabilidades:
 *  ✅ Invoca el handler del controlador para disparar GET /api/inventario/sincronizar-cloud.
 *  ✅ Renderiza Loader2 con animate-spin mientras loading.sincronizando es true.
 *  ✅ Se deshabilita completamente si isAnyLoading para evitar ejecuciones dobles.
 *  ✅ Muestra feedback del resultado (items sincronizados) tras la operación.
 *  ✅ No realiza fetch directamente — Golden Rule #2.
 */

import { CloudUpload, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SincronizarCloudResponse } from "@/services/inventarioService";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SincronizarButtonProps {
  /** Handler del controlador — dispara la sincronización masiva con Firebase */
  onSincronizar: () => Promise<void>;
  /** true mientras GET /sincronizar-cloud está en vuelo */
  cargandoSincronizacion: boolean;
  /** true si CUALQUIER operación del módulo está en curso */
  bloqueadoGlobal: boolean;
  /** Resultado de la última sincronización exitosa */
  resultadoSincronizacion: SincronizarCloudResponse | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function SincronizarButton({
  onSincronizar,
  cargandoSincronizacion,
  bloqueadoGlobal,
  resultadoSincronizacion,
}: SincronizarButtonProps) {

  // Formatea la marca de tiempo del último sync (en memoria, no persiste)
  // En fases posteriores, esto puede venir del backend como campo de auditoría.
  const ahora = resultadoSincronizacion?.success
    ? new Date().toLocaleString("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <Card className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudUpload size={20} className="text-primary" />
            <CardTitle className="text-base">Sincronizar E-Commerce</CardTitle>
          </div>
          {/* Badge de estado de sincronización */}
          {resultadoSincronizacion?.success ? (
            <Badge
              variant="default"
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700"
            >
              <CheckCircle2 size={12} className="mr-1" />
              Sincronizado
            </Badge>
          ) : (
            <Badge variant="secondary">
              <RefreshCw size={12} className="mr-1" />
              Pendiente
            </Badge>
          )}
        </div>
        <CardDescription>
          Publica el catálogo completo de productos activos desde{" "}
          <span className="font-mono text-foreground">Supabase</span> hacia{" "}
          <span className="font-mono text-foreground">Firebase Realtime Database</span>.
          Esta operación reemplaza el nodo{" "}
          <span className="font-mono text-foreground">/catalogo_ecommerce</span> completo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resultado de la última sincronización */}
        {resultadoSincronizacion?.success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Catálogo publicado exitosamente
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-emerald-700 dark:text-emerald-400">
                  <span>
                    📦{" "}
                    <strong>
                      {(resultadoSincronizacion.items_sincronizados ?? 0).toLocaleString("es-EC")}
                    </strong>{" "}
                    productos sincronizados
                  </span>
                  {ahora && (
                    <span>
                      🕐 <strong>{ahora}</strong>
                    </span>
                  )}
                </div>
                {resultadoSincronizacion.message && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    {resultadoSincronizacion.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Aviso de alcance de la operación */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>⚡ Nota:</strong> Esta es una operación de escritura total. El catálogo
            actual en Firebase será reemplazado completamente con los datos actualizados
            de Supabase. Úsala tras confirmar el ingreso o ajuste de productos.
          </p>
        </div>

        {/* Botón principal con estado de carga */}
        <Button
          id="btn-sincronizar-cloud"
          variant="default"
          size="lg"
          className="w-full gap-2 transition-all duration-200"
          disabled={bloqueadoGlobal}
          onClick={onSincronizar}
        >
          {cargandoSincronizacion ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sincronizando con Firebase...
            </>
          ) : resultadoSincronizacion?.success ? (
            <>
              <RefreshCw size={18} />
              Re-sincronizar Catálogo
            </>
          ) : (
            <>
              <CloudUpload size={18} />
              Publicar Catálogo al E-Commerce
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
