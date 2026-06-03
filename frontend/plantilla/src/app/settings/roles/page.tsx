"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { rolService, type Rol } from "@/services/rolService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus } from "lucide-react"

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRol, setEditingRol] = useState<Rol | null>(null)
  const [rolNombre, setRolNombre] = useState("")

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const data = await rolService.getAll()
      setRoles(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Error al cargar roles")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (rol?: Rol) => {
    if (rol) {
      setEditingRol(rol)
      setRolNombre(rol.nombre_rol)
    } else {
      setEditingRol(null)
      setRolNombre("")
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRol(null)
    setRolNombre("")
  }

  const handleSave = async () => {
    if (!rolNombre.trim()) return

    try {
      if (editingRol && editingRol.id_rol) {
        await rolService.update(editingRol.id_rol, { nombre_rol: rolNombre })
      } else {
        await rolService.create({ nombre_rol: rolNombre })
      }
      handleCloseModal()
      fetchRoles()
    } catch (err: any) {
      console.error(err)
      alert("Ocurrió un error al guardar el rol")
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    if (!confirm("¿Seguro que deseas eliminar este rol?")) return

    try {
      await rolService.delete(id)
      fetchRoles()
    } catch (err: any) {
      console.error(err)
      alert("Ocurrió un error al eliminar el rol")
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Roles" 
      description="Administra los roles del sistema (Admin, Empleado, etc.)"
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold">Roles del Sistema</h2>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Rol
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando roles...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Nombre del Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      No hay roles registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((rol) => (
                    <TableRow key={rol.id_rol}>
                      <TableCell className="font-medium">{rol.id_rol}</TableCell>
                      <TableCell>{rol.nombre_rol}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(rol)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rol.id_rol)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRol ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre del Rol</Label>
              <Input 
                id="nombre" 
                value={rolNombre} 
                onChange={(e) => setRolNombre(e.target.value)} 
                placeholder="Ej. ADMINISTRADOR"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
