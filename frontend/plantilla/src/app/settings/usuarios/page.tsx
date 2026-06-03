"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { usuarioService, Usuario } from "@/services/usuarioService"
import { rolService, Rol } from "@/services/rolService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, Shield } from "lucide-react"

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  
  // Form fields
  const [usuNombre, setUsuNombre] = useState("")
  const [usuContra, setUsuContra] = useState("")
  const [idRol, setIdRol] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersData, rolesData] = await Promise.all([
        usuarioService.getAll(),
        rolService.getAll()
      ])
      setUsuarios(usersData)
      setRoles(rolesData)
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario)
      setUsuNombre(usuario.usu_nombre)
      setUsuContra("") // Don't show password, allow resetting
      setIdRol(usuario.id_rol.toString())
    } else {
      setEditingUsuario(null)
      setUsuNombre("")
      setUsuContra("")
      setIdRol("")
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUsuario(null)
    setUsuNombre("")
    setUsuContra("")
    setIdRol("")
  }

  const handleSave = async () => {
    if (!usuNombre.trim() || !idRol) {
      alert("Por favor llena los campos requeridos (Nombre y Rol)")
      return
    }

    try {
      const data: Partial<Usuario> = {
        usu_nombre: usuNombre,
        id_rol: parseInt(idRol)
      }
      // Solo enviar contraseña si se digitó una nueva
      if (usuContra.trim()) {
        data.usu_contra = usuContra
      }

      if (editingUsuario && editingUsuario.id_usuario) {
        await usuarioService.update(editingUsuario.id_usuario, data)
      } else {
        if (!usuContra.trim()) {
          alert("La contraseña es requerida para un nuevo usuario")
          return
        }
        await usuarioService.create(data)
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      alert("Ocurrió un error al guardar el usuario")
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return

    try {
      await usuarioService.delete(id)
      fetchData()
    } catch (err: any) {
      console.error(err)
      alert("Ocurrió un error al eliminar el usuario")
    }
  }

  const getRoleName = (rolId: number) => {
    const rol = roles.find(r => r.id_rol === rolId)
    return rol ? rol.rol_nombre : "Desconocido"
  }

  return (
    <BaseLayout 
      title="Gestión de Usuarios" 
      description="Cuentas de acceso al sistema (Login) y asignación de roles."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Cuentas de Usuario</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Usuario
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando usuarios...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Nombre de Usuario</TableHead>
                  <TableHead>Rol Asignado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id_usuario}>
                      <TableCell className="font-medium">{usuario.id_usuario}</TableCell>
                      <TableCell>{usuario.usu_nombre}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {getRoleName(usuario.id_rol)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(usuario)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(usuario.id_usuario)}>
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
            <DialogTitle>{editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre de Usuario (Username)</Label>
              <Input 
                id="nombre" 
                value={usuNombre} 
                onChange={(e) => setUsuNombre(e.target.value)} 
                placeholder="Ej. juan.perez"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="contra">Contraseña {editingUsuario && "(Dejar en blanco para no cambiar)"}</Label>
              <Input 
                id="contra" 
                type="password"
                value={usuContra} 
                onChange={(e) => setUsuContra(e.target.value)} 
                placeholder={editingUsuario ? "Nueva contraseña..." : "Contraseña..."}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rol">Rol del Sistema</Label>
              <Select value={idRol} onValueChange={setIdRol}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(rol => (
                    <SelectItem key={rol.id_rol} value={rol.id_rol!.toString()}>
                      {rol.rol_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
