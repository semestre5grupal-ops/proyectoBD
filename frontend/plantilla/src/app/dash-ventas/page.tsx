import { BaseLayout } from "@/components/layouts/base-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useReportes } from "./hooks/use-reportes"
import { DateRangeFilter } from "./components/date-range-filter"
import { SectionCards } from "./components/section-cards"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DashboardVentas } from "./components/dashboard-ventas"
import { DashboardComercial } from "./components/dashboard-comercial"
import { DashboardClientes } from "./components/dashboard-clientes"
import { DashboardProductos } from "./components/dashboard-productos"

export default function Page() {
  const { loading, rango, setRango, kpis, ventas, comercial, clientes, productos } =
    useReportes();

  return (
    <BaseLayout title="Ventas" description="Panel general de ventas">
      <div className="@container/main px-4 lg:px-6 space-y-6">
        {/* Selector de rango */}
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
