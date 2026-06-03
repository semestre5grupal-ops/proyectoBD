"use client"

import { useState, useEffect } from "react";
import { BaseLayout } from "@/components/layouts/base-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, AlertCircle } from "lucide-react";
import { useCompras } from "../hooks/use-compras";
import { ProveedoresTab } from "../components/proveedores-tab";
import { getRolCompras } from "../utils/rbac";

export default function ProveedoresPage() {
  const {
    loading,
    suppliers,
    cities,
    handleCreateSupplier,
    handleUpdateSupplier
  } = useCompras();

  const [role, setRole] = useState<'JEFE' | 'AUX' | 'OPER' | 'NONE'>('NONE');
  const [userName, setUserName] = useState("Desarrollador");

  useEffect(() => {
    setRole(getRolCompras());
    const token = localStorage.getItem("jwt_token");
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setUserName(payload.usu_nombre || "Usuario");
        }
      } catch (e) {
        console.error("Token decoding failed", e);
      }
    }
  }, []);

  if (role === 'NONE' || role === 'OPER') {
    return (
      <BaseLayout title="Proveedores" description="Módulo de Gestión de Proveedores">
        <div className="mx-auto max-w-md mt-16 p-6 border border-destructive/20 rounded-xl bg-destructive/5 text-center flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Acceso Restringido</h2>
          <p className="text-sm text-muted-foreground">
            Lo sentimos, {userName}. Su cuenta no tiene los privilegios necesarios (Jefe o Auxiliar de Compras). Por favor, inicie sesión con una cuenta autorizada para acceder a la gestión de proveedores.
          </p>
        </div>
      </BaseLayout>
    );
  }

  const activeSuppliersCount = suppliers.filter(s => s.prv_estado === 'ACT').length;

  return (
    <BaseLayout
      title="Gestión de Proveedores"
      description="Directorio y registro de proveedores habilitados en el sistema de compras."
    >
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        {/* Admin context bar */}
        <div className="flex items-center justify-between border rounded-lg p-3 bg-primary/5 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Sesión autorizada para: <strong>{userName}</strong></span>
          </div>
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
            Rol: {role === 'JEFE' ? 'Jefe de Compras' : 'Auxiliar de Compras'}
          </Badge>
        </div>

        {/* Indicator card */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSuppliersCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Habilitados para emitir órdenes</p>
            </CardContent>
          </Card>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Cargando proveedores...
          </div>
        ) : (
          <ProveedoresTab
            suppliers={suppliers}
            cities={cities}
            onAddSupplier={handleCreateSupplier}
            onEditSupplier={handleUpdateSupplier}
          />
        )}
      </div>
    </BaseLayout>
  );
}
