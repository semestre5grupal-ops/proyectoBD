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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { ComercialResponse } from "../services/reportes-service"

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
const pct = (v: number, meta: number) =>
  meta > 0 ? ((v / meta) * 100).toFixed(1) + "%" : "—"

const chartConfig = {
  total_vendido: { label: "Vendido", color: "var(--primary)" },
  meta: { label: "Meta", color: "var(--muted-foreground)" },
} satisfies ChartConfig

interface DashboardComercialProps {
  comercial: ComercialResponse | null;
  loading: boolean;
}

export function DashboardComercial({ comercial, loading }: DashboardComercialProps) {
  if (loading && !comercial) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const ranking = comercial?.ranking ?? [];

  if (ranking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comercial</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin datos de vendedores para el período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Ranking BarChart */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de vendedores</CardTitle>
          <CardDescription>Total vendido vs. meta</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <BarChart
              data={ranking}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => usd.format(v)}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                tickLine={false}
                axisLine={false}
                width={90}
                tickFormatter={(v: string | number) =>
                  String(v).length > 12 ? String(v).slice(0, 12) + "…" : String(v)
                }
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="meta" fill="var(--color-meta)" radius={2} />
              <Bar dataKey="total_vendido" fill="var(--color-total_vendido)" radius={2} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Tabla detalle */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle vendedores</CardTitle>
          <CardDescription>Cumplimiento y comisión proyectada</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">FAC</TableHead>
                <TableHead className="text-right">Cumpl.</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((v) => (
                <TableRow key={v.id_vendedor}>
                  <TableCell className="font-medium">
                    {v.nombre ?? `Vendedor #${v.id_vendedor}`}
                  </TableCell>
                  <TableCell className="text-right">{v.num_facturas}</TableCell>
                  <TableCell className="text-right">{pct(v.total_vendido, v.meta)}</TableCell>
                  <TableCell className="text-right">
                    {usd.format(v.comision_proyectada)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
