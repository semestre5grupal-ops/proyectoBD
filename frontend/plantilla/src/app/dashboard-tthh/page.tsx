"use client";

import { useEffect, useState } from "react";
import { Users, Briefcase, Bot, TrendingUp, Building2, UserPlus, Clock } from "lucide-react";
import { BaseLayout } from "@/components/layouts/base-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { empleadoService } from "@/services/empleadoService";
import { departamentoService } from "@/services/departamentoService";
import { cargoService } from "@/services/cargoService";

export default function DashboardTTHHPage() {
  const [stats, setStats] = useState({
    empleados: 0,
    departamentos: 0,
    cargos: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [empData, depData, carData] = await Promise.all([
          empleadoService.getEmpleados(),
          departamentoService.getAll(),
          cargoService.getAll()
        ]);
        
        setStats({
          empleados: Array.isArray(empData) ? empData.length : 0,
          departamentos: Array.isArray(depData) ? depData.length : 0,
          cargos: Array.isArray(carData) ? carData.length : 0,
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      }
    }
    loadStats();
  }, []);

  return (
    <BaseLayout 
      title="Dashboard - Talento Humano" 
      description="Resumen ejecutivo del módulo de RRHH"
    >
      <div className="flex flex-col gap-6 px-4 lg:px-6 mt-6">
        
        {/* Banner de Bienvenida y Agente IA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">¡Bienvenido al Panel de Talento Humano!</h2>
            <p className="text-blue-100 opacity-90">
              Gestiona a tu personal de forma más eficiente. ¿Sabías que ahora tienes un asistente de Inteligencia Artificial que puede ejecutar tareas por ti?
            </p>
          </div>
          <Button 
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm whitespace-nowrap"
            size="lg"
            onClick={() => window.location.href = '/chat-tthh'}
          >
            <Bot className="mr-2 h-5 w-5 text-blue-600" />
            Abrir Agente TTHH
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.empleados}</div>
              <p className="text-xs text-muted-foreground">+2 este mes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamentos Activos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.departamentos}</div>
              <p className="text-xs text-muted-foreground">Estructura organizacional</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargos Definidos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cargos}</div>
              <p className="text-xs text-muted-foreground">Perfiles de puesto</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gasto Nómina Estimado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450.00</div>
              <p className="text-xs text-muted-foreground">Proyección actual</p>
            </CardContent>
          </Card>
        </div>

        {/* Accesos Rápidos */}
        <h3 className="text-lg font-semibold mt-4">Accesos Rápidos</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = '/tthh/empleados'}>
            <CardHeader className="pb-2">
              <UserPlus className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Gestión de Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Registra, edita y da de baja al personal.</p>
            </CardContent>
          </Card>
          
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = '/tthh/departamentos'}>
            <CardHeader className="pb-2">
              <Building2 className="h-8 w-8 text-indigo-500 mb-2" />
              <CardTitle>Estructura de la Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Administra departamentos y cargos.</p>
            </CardContent>
          </Card>
          
          <Card className="hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.location.href = '/tthh/roles-pago'}>
            <CardHeader className="pb-2">
              <Clock className="h-8 w-8 text-emerald-500 mb-2" />
              <CardTitle>Nómina y Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Controla sueldos, rubros y pagos.</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </BaseLayout>
  );
}
