"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { departamentoService, type Departamento } from "@/services/departamentoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, Building2, Search } from "lucide-react"
import { toast } from "sonner"

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscador
  const [searchTerm, setSearchTerm] = useState("")

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Departamento | null>(null)
  
  // Form fields
  const [depNombre, setDepNombre] = useState("")

  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    // Implement debounce for search
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [currentPage, searchTerm])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await departamentoService.getAll(currentPage, ITEMS_PER_PAGE, searchTerm)
      if (Array.isArray(res)) {
        setDepartamentos(res)
        setTotalPages(Math.ceil(res.length / ITEMS_PER_PAGE) || 1)
      } else {
        setDepartamentos(res.data || [])
        setTotalPages(res.totalPages || 1)
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const currentDepartamentos = departamentos;

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handleOpenModal = (dept?: Departamento) => {
    if (dept) {
      setEditingDept(dept)
      setDepNombre(dept.dep_nombre)
    } else {
      setEditingDept(null)
      setDepNombre("")
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDept(null)
    setDepNombre("")
  }

  const handleSave = async () => {
    if (!depNombre.trim()) {
      alert("Por favor ingresa el nombre del departamento")
      return
    }

    try {
      const data: Partial<Departamento> = {
        ...(editingDept || {}),
        dep_nombre: depNombre,
        dep_estado: editingDept ? editingDept.dep_estado : "ACT",
        dep_feccreacion: editingDept?.dep_feccreacion || new Date().toISOString()
      }

      if (editingDept && editingDept.id_departamento) {
        await departamentoService.update(editingDept.id_departamento, data)
        toast.success("Departamento actualizado exitosamente")
      } else {
        await departamentoService.create(data)
        toast.success("Departamento creado exitosamente")
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (dept: Departamento) => {
    if (!dept.id_departamento) return
    if (!confirm(`¿Seguro que deseas inactivar el departamento "${dept.dep_nombre}"?`)) return

    try {
      await departamentoService.update(dept.id_departamento, {
        ...dept,
        dep_estado: "INC"
      })
      toast.success("Departamento inactivado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al inactivar"))
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Departamentos" 
      description="Administración de los departamentos de la empresa."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Building2 className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Departamentos</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Departamento
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar departamento..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando departamentos...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDepartamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      No hay departamentos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDepartamentos.map((dept) => (
                    <TableRow key={dept.id_departamento}>
                      <TableCell className="font-medium">{dept.dep_nombre}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${dept.dep_estado === 'ACT' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                          {dept.dep_estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(dept)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        {dept.dep_estado !== 'INC' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(dept)}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Controles de Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Editar Departamento" : "Nuevo Departamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 px-1">
            <div className="grid gap-2">
              <Label htmlFor="dep_nombre">Nombre del Departamento *</Label>
              <Input 
                id="dep_nombre" 
                value={depNombre} 
                onChange={(e) => setDepNombre(e.target.value)} 
                placeholder="Ej. Recursos Humanos"
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
