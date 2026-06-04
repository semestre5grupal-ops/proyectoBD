"use client"

import { useSearchParams } from "react-router-dom";
import { BaseLayout } from "@/components/layouts/base-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, Users, UserCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVentas } from "./hooks/use-ventas";
import { DocumentosTab } from "./components/documentos-tab";
import { ClientesTab } from "./components/clientes-tab";
import { VendedoresTab } from "./components/vendedores-tab";

export default function VentasPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "documentos";

  const {
    loading,
    documentos, clientes, vendedores, ciudades, metodosPago,
    handleCreateDocumento, handleDeleteDocumento,
    handleEmitir, handleAprobar, handleAnular,
    handleGenerarFactura, handleGenerarNotaCredito,
    handleCreateCliente, handleUpdateCliente,
    handleCreateVendedor, handleUpdateVendedor,
    recargar,
  } = useVentas();

  // Métricas rápidas
  const totalDocumentos = documentos.length;
  const docsAprobados = documentos.filter(d => d.doc_estado === "APR").length;
  const clientesActivos = clientes.filter(c => c.cli_estado).length;
  const vendedoresActivos = vendedores.filter(v => v.ven_estado === "ACT").length;

  return (
    <BaseLayout title="Gestión de Ventas" description="CRUD de documentos, clientes y vendedores.">
      <div className="flex flex-col gap-6 px-4 lg:px-6">

        {/* Barra de contexto */}
        <div className="flex items-center justify-between border rounded-lg p-3 bg-primary/5 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Módulo operativo de <strong>Ventas</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
              Gestión Operativa
            </Badge>
            <Button size="sm" variant="ghost" onClick={recargar} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Recargar
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocumentos}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{docsAprobados} aprobados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Aprobadas</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{docsAprobados}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Con pago registrado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientesActivos}</div>
              <p className="text-xs text-muted-foreground mt-0.5">de {clientes.length} registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedores Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendedoresActivos}</div>
              <p className="text-xs text-muted-foreground mt-0.5">de {vendedores.length} registrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        {loading && documentos.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Cargando datos del módulo de ventas...
          </div>
        ) : (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
            </TabsList>

            <TabsContent value="documentos" className="focus-visible:outline-none">
              <DocumentosTab
                documentos={documentos}
                clientes={clientes}
                vendedores={vendedores}
                metodosPago={metodosPago}
                onCreateDocumento={handleCreateDocumento}
                onDeleteDocumento={handleDeleteDocumento}
                onEmitir={handleEmitir}
                onAprobar={handleAprobar}
                onAnular={handleAnular}
                onGenerarFactura={handleGenerarFactura}
                onGenerarNCR={handleGenerarNotaCredito}
              />
            </TabsContent>

            <TabsContent value="clientes" className="focus-visible:outline-none">
              <ClientesTab
                clientes={clientes}
                ciudades={ciudades}
                onAddCliente={handleCreateCliente}
                onEditCliente={handleUpdateCliente}
              />
            </TabsContent>

            <TabsContent value="vendedores" className="focus-visible:outline-none">
              <VendedoresTab
                vendedores={vendedores}
                onAddVendedor={handleCreateVendedor}
                onEditVendedor={handleUpdateVendedor}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </BaseLayout>
  );
}
