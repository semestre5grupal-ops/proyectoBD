/**
 * IngresarStockForm.tsx
 * ----------------------
 * CAPA DE VISTA — Formulario de Ingreso de Mercadería
 * Módulo de Inventario | Proyecto RDA3 — Comercial JW Cóndor
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PackagePlus, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { IngresarStockPayload, IngresarStockResponse } from "@/services/inventarioService";

// ─── Esquema de validación Zod ────────────────────────────────────────────────
const ingresarStockSchema = z.object({
  // z.coerce.number() convierte automáticamente el string del <input type="number">
  // a número antes de que Zod valide — patrón estándar para react-hook-form + Zod.
  // Elimina la necesidad de conversiones manuales en onChange y de casts "as unknown as number".
  idVariante: z.coerce
    .number({ message: "Debe ser un número entero positivo." })
    .int("El ID debe ser un número entero.")
    .positive("El ID de variante debe ser mayor a cero."),
  cantidad: z.coerce
    .number({ message: "Ingresa una cantidad numérica." })
    .int("La cantidad debe ser un número entero.")
    .positive("La cantidad debe ser mayor a cero."),
  idBodega: z.coerce
    .number({ message: "Debe ser un número entero positivo." })
    .int("El ID de bodega debe ser un número entero.")
    .positive("El ID de bodega debe ser mayor a cero."),
  descripcion: z
    .string()
    .max(200, "Máximo 200 caracteres.")
    .optional()
    .default("Ingreso manual de mercadería"),
  usuario: z
    .string()
    .min(1, "El nombre de usuario es obligatorio para la auditoría.")
    .max(80, "Máximo 80 caracteres."),
});

// z.infer extrae el tipo de SALIDA de Zod (después del coerce -> { idVariante: number, ... })
type IngresarStockFormOutput = z.infer<typeof ingresarStockSchema>;
// z.input extrae el tipo de ENTRADA de Zod (antes del coerce -> { idVariante: unknown, ... })
type IngresarStockFormInput = z.input<typeof ingresarStockSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
interface IngresarStockFormProps {
  onSubmit: (payload: IngresarStockPayload) => Promise<void>;
  cargandoIngreso: boolean;
  bloqueadoGlobal: boolean;
  resultadoIngreso: IngresarStockResponse | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function IngresarStockForm({
  onSubmit,
  cargandoIngreso,
  bloqueadoGlobal,
  resultadoIngreso,
}: IngresarStockFormProps) {

  // Al usar z.coerce, el tipo que maneja react-hook-form (input) es diferente
  // al tipo que devuelve Zod tras validar (output).
  // Genéricos: <TFieldValues (Input), TContext, TTransformedValues (Output)>
  const form = useForm<IngresarStockFormInput, unknown, IngresarStockFormOutput>({
    resolver: zodResolver(ingresarStockSchema),
    defaultValues: {
      // Con z.coerce, los defaultValues pueden ser strings vacíos sin casts.
      // react-hook-form los enviará a Zod, que los coercionará a number antes de validar.
      idVariante: "" as unknown as number,
      cantidad: "" as unknown as number,
      idBodega: "" as unknown as number,
      descripcion: "Ingreso manual de mercadería",
      usuario: "",
    },
  });

  // Resetear el formulario al recibir un ingreso exitoso
  useEffect(() => {
    if (resultadoIngreso?.success) {
      form.reset();
    }
  }, [resultadoIngreso, form]);

  // Adaptador: convierte los valores del form al contrato del servicio
  const handleFormSubmit = async (values: IngresarStockFormOutput) => {
    await onSubmit({
      idVariante: values.idVariante,
      cantidad: values.cantidad,
      idBodega: values.idBodega,
      descripcion: values.descripcion ?? "Ingreso manual de mercadería",
      usuario: values.usuario,
    });
  };

  return (
    <Card className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PackagePlus size={20} className="text-primary" />
          <CardTitle className="text-base">Ingresar Mercadería a Bodega</CardTitle>
        </div>
        <CardDescription>
          Registra la entrada de productos al inventario. Se generará un
          comprobante en la tabla de{" "}
          <span className="font-mono text-foreground">recepciones</span> automáticamente.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Banner de éxito */}
        {resultadoIngreso?.success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>
              {resultadoIngreso.message ?? "Ingreso registrado."}{" "}
              {resultadoIngreso.stock_actual !== undefined && (
                <strong>Stock actual: {resultadoIngreso.stock_actual.toLocaleString("es-EC")} uds.</strong>
              )}
            </span>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Fila 1: ID Variante + Cantidad */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Campo: idVariante */}
              <FormField
                control={form.control}
                name="idVariante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID de Variante</FormLabel>
                    <FormControl>
                      <Input
                        id="ingresar-id-variante"
                        type="number"
                        placeholder="Ej: 42"
                        disabled={bloqueadoGlobal}
                        {...field}
                        value={(field.value as string | number) ?? ""}
                        // z.coerce se encarga de la conversión — onChange queda limpio
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>PK en la tabla variantes_producto</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo: cantidad */}
              <FormField
                control={form.control}
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        id="ingresar-cantidad"
                        type="number"
                        placeholder="Ej: 100"
                        disabled={bloqueadoGlobal}
                        {...field}
                        value={(field.value as string | number) ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Unidades físicas a ingresar</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fila 2: ID Bodega + Usuario */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Campo: idBodega */}
              <FormField
                control={form.control}
                name="idBodega"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID de Bodega</FormLabel>
                    <FormControl>
                      <Input
                        id="ingresar-id-bodega"
                        type="number"
                        placeholder="Ej: 1"
                        disabled={bloqueadoGlobal}
                        {...field}
                        value={(field.value as string | number) ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>Nodo de destino de la mercadería</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo: usuario */}
              <FormField
                control={form.control}
                name="usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario Responsable</FormLabel>
                    <FormControl>
                      <Input
                        id="ingresar-usuario"
                        type="text"
                        placeholder="Ej: liz.compras"
                        disabled={bloqueadoGlobal}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Queda registrado en auditoría</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo: descripcion (ancho completo) */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      id="ingresar-descripcion"
                      type="text"
                      placeholder="Ej: Ingreso por Orden de Compra #OC-2024-001"
                      disabled={bloqueadoGlobal}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Referencia del movimiento (opcional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botón de envío con spinner condicional */}
            <Button
              id="btn-ingresar-stock"
              type="submit"
              className="w-full sm:w-auto"
              disabled={bloqueadoGlobal}
            >
              {cargandoIngreso ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Registrando ingreso...
                </>
              ) : (
                <>
                  <PackagePlus size={16} className="mr-2" />
                  Ingresar a Bodega
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}