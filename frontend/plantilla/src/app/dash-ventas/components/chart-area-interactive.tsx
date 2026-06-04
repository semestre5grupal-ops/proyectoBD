"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import type { PuntoSerie } from "../services/reportes-service"

const chartConfig = {
  total: {
    label: "Ingresos",
    color: "var(--primary)",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  serie: PuntoSerie[];
  loading: boolean;
}

export function ChartAreaInteractive({ serie, loading }: ChartAreaInteractiveProps) {
  if (loading && serie.length === 0) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Ingresos por fecha</CardTitle>
          <CardDescription>Evolución de ventas en el período seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Ingresos por fecha</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Evolución de ventas en el período seleccionado
          </span>
          <span className="@[540px]/card:hidden">Ingresos del período</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={serie}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="fecha"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(v: string) =>
                new Date(v).toLocaleDateString("es-EC", { month: "short", day: "numeric" })
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
              }
              width={80}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value as string).toLocaleDateString("es-EC", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  formatter={(value) =>
                    new Intl.NumberFormat("es-EC", {
                      style: "currency",
                      currency: "USD",
                    }).format(value as number)
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="total"
              type="natural"
              fill="url(#fillTotal)"
              stroke="var(--color-total)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
