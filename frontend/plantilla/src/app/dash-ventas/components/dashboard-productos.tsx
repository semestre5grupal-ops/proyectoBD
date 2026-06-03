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
import type { ProductosResponse } from "../services/reportes-service"

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

const cantConfig = {
  cantidad: { label: "Unidades", color: "var(--primary)" },
} satisfies ChartConfig

const ingConfig = {
  subtotal: { label: "Ingresos", color: "var(--chart-2)" },
} satisfies ChartConfig

function varLabel(nombre: string | undefined, id: number) {
  if (nombre) return nombre.length > 16 ? nombre.slice(0, 16) + "…" : nombre;
  return `Var.#${id}`;
}

interface DashboardProductosProps {
  productos: ProductosResponse | null;
  loading: boolean;
}

export function DashboardProductos({ productos, loading }: DashboardProductosProps) {
  if (loading && !productos) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const topCant = (productos?.top_cantidad ?? []).map((p) => ({
    ...p,
    _label: varLabel(p.nombre, p.id_variante),
  }));

  const topIng = (productos?.ingresos ?? []).map((p) => ({
    ...p,
    _label: varLabel(p.nombre, p.id_variante),
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Top por cantidad */}
      <Card>
        <CardHeader>
          <CardTitle>Top variantes — cantidad</CardTitle>
          <CardDescription>Unidades vendidas en el período</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {topCant.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <ChartContainer config={cantConfig} className="h-[240px] w-full">
              <BarChart data={topCant} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="_label" tickLine={false} axisLine={false} width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={2} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top por ingresos */}
      <Card>
        <CardHeader>
          <CardTitle>Top variantes — ingresos</CardTitle>
          <CardDescription>Subtotal generado por variante</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {topIng.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <ChartContainer config={ingConfig} className="h-[240px] w-full">
              <BarChart data={topIng} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => usd.format(v)}
                />
                <YAxis type="category" dataKey="_label" tickLine={false} axisLine={false} width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="subtotal" fill="var(--color-subtotal)" radius={2} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
