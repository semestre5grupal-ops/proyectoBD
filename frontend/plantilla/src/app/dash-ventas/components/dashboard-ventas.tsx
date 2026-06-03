"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { VentasResponse } from "../services/reportes-service"

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

const desglosConfig = {
  subtotal: { label: "Subtotal", color: "var(--primary)" },
  descuento: { label: "Descuento", color: "var(--destructive)" },
  iva: { label: "IVA", color: "var(--chart-2)" },
} satisfies ChartConfig

interface DashboardVentasProps {
  ventas: VentasResponse | null;
  loading: boolean;
}

export function DashboardVentas({ ventas, loading }: DashboardVentasProps) {
  if (loading && !ventas) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const desglose = ventas
    ? [
        { concepto: "Subtotal", subtotal: ventas.subtotal, descuento: 0, iva: 0 },
        { concepto: "Descuento", subtotal: 0, descuento: ventas.descuento, iva: 0 },
        { concepto: "IVA", subtotal: 0, descuento: 0, iva: ventas.iva },
      ]
    : [];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Ticket promedio */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket promedio</CardTitle>
          <CardDescription>Por factura aprobada en el período</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-28">
          {ventas ? (
            <span className="text-3xl font-bold tabular-nums">
              {usd.format(ventas.ticket_promedio)}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">Sin datos</span>
          )}
        </CardContent>
      </Card>

      {/* NCR */}
      <Card>
        <CardHeader>
          <CardTitle>Notas de crédito</CardTitle>
          <CardDescription>Volumen de NCR en el período</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-28">
          {ventas ? (
            <span className="text-3xl font-bold tabular-nums">{ventas.volumen_ncr}</span>
          ) : (
            <span className="text-muted-foreground text-sm">Sin datos</span>
          )}
        </CardContent>
      </Card>

      {/* Desglose subtotal / descuento / IVA */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose</CardTitle>
          <CardDescription>Subtotal · Descuento · IVA</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {ventas ? (
            <ChartContainer config={desglosConfig} className="h-28 w-full">
              <BarChart data={desglose} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
                  }
                />
                <YAxis type="category" dataKey="concepto" tickLine={false} axisLine={false} width={72} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="subtotal" stackId="a" fill="var(--color-subtotal)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="descuento" stackId="a" fill="var(--color-descuento)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="iva" stackId="a" fill="var(--color-iva)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <span className="text-muted-foreground text-sm">Sin datos</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
