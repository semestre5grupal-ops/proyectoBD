"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { StatCards } from "./components/stat-cards"
import { DataTable } from "./components/data-table"
import { empleadoService, type Empleado } from "@/services/empleadoService"

interface User {
  id: number
  name: string
  email: string
  avatar: string
  role: string
  plan: string
  billing: string
  status: string
  joinedDate: string
  lastLogin: string
}

interface UserFormValues {
  name: string
  email: string
  role: string
  plan: string
  billing: string
  status: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEmpleados()
  }, [])

  const fetchEmpleados = async () => {
    try {
      setLoading(true)
      const data = await empleadoService.getEmpleados()
      // Map Empleado to User interface for the existing DataTable
      const mappedUsers: User[] = data.map((emp) => ({
        id: emp.id_empleado || 0,
        name: `${emp.emp_nombre} ${emp.emp_apellido}`,
        email: `${emp.emp_cedula}@empresa.com`,
        avatar: generateAvatar(`${emp.emp_nombre} ${emp.emp_apellido}`),
        role: "Empleado",
        plan: "N/A",
        billing: emp.emp_telefono,
        status: "Active",
        joinedDate: emp.emp_fecha_contratacion ? new Date(emp.emp_fecha_contratacion).toISOString().split('T')[0] : "N/A",
        lastLogin: "N/A",
      }))
      setUsers(mappedUsers)
    } catch (err: any) {
      setError(err.message || "Error al cargar empleados")
    } finally {
      setLoading(false)
    }
  }

  const generateAvatar = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleAddUser = async (userData: UserFormValues) => {
    try {
      const names = userData.name.split(" ");
      const newEmp: Empleado = {
        emp_nombre: names[0] || "Nombre",
        emp_apellido: names.slice(1).join(" ") || "Apellido",
        emp_cedula: "9999999999", // placeholder
        emp_telefono: "0999999999", // placeholder
        emp_direccion: "Desconocida", // placeholder
        emp_fecha_contratacion: new Date().toISOString(),
      };
      await empleadoService.createEmpleado(newEmp);
      fetchEmpleados();
    } catch (err) {
      console.error("Error al crear:", err);
    }
  }

  const handleDeleteUser = async (id: number) => {
    try {
      await empleadoService.deleteEmpleado(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  }

  const handleEditUser = (user: User) => {
    console.log("Edit user:", user)
  }

  return (
    <BaseLayout 
      title="Gestión de Empleados" 
      description="Administra los empleados del módulo de Talento Humano"
    >
      <div className="flex flex-col gap-4">
        <div className="@container/main px-4 lg:px-6">
          <StatCards />
        </div>
        
        <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
          {loading ? (
            <div className="flex justify-center p-8">Cargando empleados...</div>
          ) : error ? (
            <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
          ) : (
            <DataTable 
              users={users}
              onDeleteUser={handleDeleteUser}
              onEditUser={handleEditUser}
              onAddUser={handleAddUser}
            />
          )}
        </div>
      </div>
    </BaseLayout>
  )
}
