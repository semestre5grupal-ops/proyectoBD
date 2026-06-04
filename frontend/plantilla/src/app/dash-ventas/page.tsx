import { Link } from "react-router-dom"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useReportes } from "./hooks/use-reportes"
import { DateRangeFilter } from "./components/date-range-filter"
import { SectionCards } from "./components/section-cards"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DashboardVentas } from "./components/dashboard-ventas"
import { DashboardComercial } from "./components/dashboard-comercial"
import { DashboardClientes } from "./components/dashboard-clientes"
import { DashboardProductos } from "./components/dashboard-productos"
import { FileText, Users, UserCheck, ArrowRight } from "lucide-react"

const CRUD_LINKS = [
  {
    title: "Documentos",
    description: "Proformas, facturas y notas de crédito. Emitir, aprobar y anular.",
    icon: FileText,
    href: "/ventas?tab=documentos",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    title: "Clientes",
    description: "Base de clientes: registro, categorías y estado.",
    icon: Users,
    href: "/ventas?tab=clientes",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/20",
  },
  {
    title: "Vendedores",
    description: "Fuerza de ventas: comisiones, metas y activación.",
    icon: UserCheck,
    href: "/ventas?tab=vendedores",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/20",
  },
]

export default function Page() {
  const { loading, rango, setRango, kpis, ventas, comercial, clientes, productos } =
    useReportes();

  return (
    <BaseLayout title="Ventas" description="Panel general de ventas">
      <div className="@container/main px-4 lg:px-6 space-y-6">

        {/* ── Acceso rápido a paneles CRUD ─────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold mb-3">Gestión Operativa</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {CRUD_LINKS.map(({ title, description, icon: Icon, href, color, bg }) => (
              <Link key={href} to={href} className="group">
                <Card className="hover:shadow-md transition-shadow border-border/60 hover:border-primary/30">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
                    <div className={`rounded-lg p-2 ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">{description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Selector de rango ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold">Período</h2>
          <DateRangeFilter rango={rango} onRangoChange={setRango} />
        </div>

        {/* KPIs */}
        <SectionCards kpis={kpis} loading={loading} />

        {/* Gráfico de ingresos por fecha */}
        <ChartAreaInteractive
          serie={ventas?.ingresos_serie ?? []}
          loading={loading}
        />

        {/* Dashboards analíticos en tabs */}
        <Tabs defaultValue="facturacion">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="facturacion">Facturación</TabsTrigger>
            <TabsTrigger value="comercial">Comercial</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="facturacion" className="mt-4">
            <DashboardVentas ventas={ventas} loading={loading} />
          </TabsContent>

          <TabsContent value="comercial" className="mt-4">
            <DashboardComercial comercial={comercial} loading={loading} />
          </TabsContent>

          <TabsContent value="clientes" className="mt-4">
            <DashboardClientes clientes={clientes} loading={loading} />
          </TabsContent>

          <TabsContent value="productos" className="mt-4">
            <DashboardProductos productos={productos} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
