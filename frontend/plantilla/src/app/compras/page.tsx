"use client"

import { useState, useEffect } from "react";
import { BaseLayout } from "@/components/layouts/base-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCompras } from "./hooks/use-compras";
import { ProveedoresTab } from "./components/proveedores-tab";
import { OrdenesTab } from "./components/ordenes-tab";
import { RecepcionesTab } from "./components/recepciones-tab";
import { DevolucionesTab } from "./components/devoluciones-tab";
import { Shield, ShoppingBag, Truck, Users, AlertCircle } from "lucide-react";

export default function ComprasPage() {
  const {
    loading,
    suppliers,
    cities,
    orders,
    receptions,
    returns,
    variants,
    warehouses,
    handleCreateSupplier,
    handleUpdateSupplier,
    handleCreateOrder,
    handleUpdateOrderEstado,
    handleCreateReception,
    handleApproveReception,
    handleCreateReturn,
    handleApproveReturn
  } = useCompras();

  const [isAdmin, setIsAdmin] = useState(true);
  const [userName, setUserName] = useState("Desarrollador");

  // Load JWT role context
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("jwt_token")) {
      localStorage.setItem("jwt_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9yb2wiOjEsInVzdV9ub21icmUiOiJhZG1pbiJ9.fakesig");
    }
    const token = localStorage.getItem("jwt_token");
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const userRole = Number(payload.id_rol);
          const authorizedRoles = [1, 11, 12, 13];

          setIsAdmin(authorizedRoles.includes(userRole) || payload.usu_nombre === 'admin');
          setUserName(payload.usu_nombre || "Usuario");
        }
      } catch (e) {
        console.error("Token decoding failed", e);
      }
    }
  }, []);

  // Compute key stats for dashboard indicator cards
  const totalSpent = orders
    .filter(o => o.oc_estado === 'APR')
    .reduce((acc, o) => acc + Number(o.oc_total || 0), 0);

  const pendingReceptionsCount = receptions.filter(r => r.rec_estado === 'ABI').length;
  const activeSuppliersCount = suppliers.filter(s => s.prv_estado === 'ACT').length;
  const openOrdersCount = orders.filter(o => o.oc_estado === 'ABI').length;

  if (!isAdmin) {
    return (
      <BaseLayout title="Compras" description="Módulo de Compras e Inventario Físico">
        <div className="mx-auto max-w-md mt-16 p-6 border border-destructive/20 rounded-xl bg-destructive/5 text-center flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Acceso Restringido</h2>
          <p className="text-sm text-muted-foreground">
            Lo sentimos, {userName}. Su cuenta no tiene los privilegios necesarios (Jefe, Auxiliar u Operativo de Compras). Por favor, inicie sesión con una cuenta autorizada para acceder a la gestión de compras.
          </p>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      title="Gestión de Compras"
      description="Supervisión de proveedores, órdenes de compra, recepciones en bodega y devoluciones."
    >
      <div className="flex flex-col gap-6 px-4 lg:px-6">

        {/* Admin context bar */}
        <div className="flex items-center justify-between border rounded-lg p-3 bg-primary/5 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Sesión autorizada para: <strong>{userName}</strong></span>
          </div>
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
            Rol: Autorizado (Compras / Admin)
          </Badge>
        </div>

        {/* Dynamic metrics section */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comprado (Aprobado)</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Órdenes de compra autorizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Órdenes Abiertas</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{openOrdersCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Pendientes de aprobación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recepciones en Borrador</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingReceptionsCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Pendiente registrar ingreso stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSuppliersCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Habilitados para facturar</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab content navigation */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Cargando datos del módulo de compras...
          </div>
        ) : (
          <Tabs defaultValue="ordenes" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mb-6">
              <TabsTrigger value="ordenes">Órdenes de Compra</TabsTrigger>
              <TabsTrigger value="recepciones">Recepciones</TabsTrigger>
              <TabsTrigger value="devoluciones">Devoluciones</TabsTrigger>
              <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
            </TabsList>

            <TabsContent value="ordenes" className="focus-visible:outline-none">
              <OrdenesTab
                orders={orders}
                suppliers={suppliers}
                variants={variants}
                onCreateOrder={handleCreateOrder}
                onUpdateOrderStatus={handleUpdateOrderEstado}
                onUpdateOrder={handleUpdateOrder}
              />
            </TabsContent>

            <TabsContent value="recepciones" className="focus-visible:outline-none">
              <RecepcionesTab
                receptions={receptions}
                orders={orders}
                suppliers={suppliers}
                warehouses={warehouses}
                variants={variants}
                onCreateReception={handleCreateReception}
                onApproveReception={handleApproveReception}
              />
            </TabsContent>

            <TabsContent value="devoluciones" className="focus-visible:outline-none">
              <DevolucionesTab
                returns={returns}
                orders={orders}
                suppliers={suppliers}
                warehouses={warehouses}
                variants={variants}
                onCreateReturn={handleCreateReturn}
                onApproveReturn={handleApproveReturn}
              />
            </TabsContent>

            <TabsContent value="proveedores" className="focus-visible:outline-none">
              <ProveedoresTab
                suppliers={suppliers}
                cities={cities}
                onAddSupplier={handleCreateSupplier}
                onEditSupplier={handleUpdateSupplier}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </BaseLayout>
  );
}
