"use client"

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { ClientesResponse } from "../services/reportes-service"

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--muted-foreground)",
  "var(--destructive)",
  "var(--secondary)",
]

const ciudadConfig = {
  total: { label: "Ventas", color: "var(--primary)" },
} satisfies ChartConfig

const catConfig = {
  total: { label: "Clientes", color: "var(--primary)" },
} satisfies ChartConfig

interface DashboardClientesProps {
  clientes: ClientesResponse | null;
  loading: boolean;
}

export function DashboardClientes({ clientes, loading }: DashboardClientesProps) {
  if (loading && !clientes) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const porCiudad = clientes?.por_ciudad ?? [];
  const porCategoria = clientes?.por_categoria ?? [];
  const topClientes = clientes?.top_clientes ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Ventas por ciudad */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas por ciudad</CardTitle>
          <CardDescription>Ingresos acumulados por ciudad</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {porCiudad.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <ChartContainer config={ciudadConfig} className="h-[220px] w-full">
              <BarChart data={porCiudad} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => usd.format(v)} />
                <YAxis type="category" dataKey="ciudad" tickLine={false} axisLine={false} width={72} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={2} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Por categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes por categoría</CardTitle>
          <CardDescription>Distribución de clientes (cat. 1–9)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center pb-4">
          {porCategoria.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <ChartContainer config={catConfig} className="h-[220px] w-full">
              <PieChart>
                <Pie
                  data={porCategoria}
                  dataKey="total"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ categoria, percent }: { categoria: number; percent: number }) =>
                    `Cat.${categoria} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {porCategoria.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top 10 clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Top clientes</CardTitle>
          <CardDescription>Por monto total del período</CardDescription>
        </CardHeader>
        <CardContent>
          {topClientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClientes.slice(0, 10).map((c) => (
                  <TableRow key={c.id_cliente}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell className="text-right">{usd.format(c.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
