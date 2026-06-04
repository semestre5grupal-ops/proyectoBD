"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { departamentoService, type Departamento } from "@/services/departamentoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, Users, Search } from "lucide-react"
import { toast } from "sonner"

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null)
  
  const [formData, setFormData] = useState({
    emp_cedula: "",
    emp_nom1: "",
    emp_nom2: "",
    emp_ap1: "",
    emp_ap2: "",
    emp_fechanacimiento: "",
    emp_sexo: "M",
    emp_direccion: "",
    emp_telefono: "",
    emp_email: "",
    id_departamento: ""
  })

  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [currentPage, searchTerm])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [empRes, depData] = await Promise.all([
        empleadoService.getEmpleados(currentPage, ITEMS_PER_PAGE, searchTerm),
        departamentoService.getAllList()
      ])
      if (Array.isArray(empRes)) {
        setEmpleados(empRes.filter(e => e.emp_estado !== 'INC' && e.emp_estado !== 'INA'))
        setTotalPages(Math.ceil(empRes.length / ITEMS_PER_PAGE) || 1)
      } else {
        setEmpleados(empRes.data || [])
        setTotalPages(empRes.totalPages || 1)
      }
      setDepartamentos(Array.isArray(depData) ? depData : [])
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const currentEmpleados = empleados;

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handleOpenModal = (emp?: Empleado) => {
    if (emp) {
      setEditingEmp(emp)
      setFormData({
        emp_cedula: emp.emp_cedula,
        emp_nom1: emp.emp_nom1,
        emp_nom2: emp.emp_nom2 || "",
        emp_ap1: emp.emp_ap1,
        emp_ap2: emp.emp_ap2 || "",
        emp_fechanacimiento: emp.emp_fechanacimiento ? new Date(emp.emp_fechanacimiento).toISOString().split('T')[0] : "",
        emp_sexo: emp.emp_sexo || "M",
        emp_direccion: emp.emp_direccion || "",
        emp_telefono: emp.emp_telefono || "",
        emp_email: emp.emp_email || "",
        id_departamento: emp.id_departamento ? String(emp.id_departamento) : ""
      })
    } else {
      setEditingEmp(null)
      setFormData({
        emp_cedula: "",
        emp_nom1: "",
        emp_nom2: "",
        emp_ap1: "",
        emp_ap2: "",
        emp_fechanacimiento: "",
        emp_sexo: "M",
        emp_direccion: "",
        emp_telefono: "",
        emp_email: "",
        id_departamento: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEmp(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (!formData.emp_cedula || !formData.emp_nom1 || !formData.emp_ap1 || !formData.emp_fechanacimiento) {
      toast.error("Por favor completa los campos obligatorios (Cédula, 1er Nombre, 1er Apellido, Nacimiento)")
      return
    }

    try {
      const data: Empleado = {
        ...(editingEmp || {}),
        emp_cedula: formData.emp_cedula,
        emp_nom1: formData.emp_nom1,
        emp_nom2: formData.emp_nom2,
        emp_ap1: formData.emp_ap1,
        emp_ap2: formData.emp_ap2,
        emp_fechanacimiento: new Date(formData.emp_fechanacimiento).toISOString(),
        emp_sexo: formData.emp_sexo,
        emp_direccion: formData.emp_direccion,
        emp_telefono: formData.emp_telefono,
        emp_email: formData.emp_email,
        id_departamento: formData.id_departamento ? parseInt(formData.id_departamento) : null
      }

      if (editingEmp && editingEmp.id_empleado) {
        await empleadoService.updateEmpleado(editingEmp.id_empleado, data)
        setEmpleados(prev => prev.map(e =>
          e.id_empleado === editingEmp.id_empleado ? { ...e, ...data } : e
        ))
        toast.success("Empleado actualizado exitosamente")
      } else {
        const created = await empleadoService.createEmpleado(data)
        setEmpleados(prev => [created, ...prev])
        toast.success("Empleado creado exitosamente")
      }
      handleCloseModal()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (emp: Empleado) => {
    if (!emp.id_empleado) return
    if (!confirm(`¿Seguro que deseas eliminar al empleado "${emp.emp_nom1} ${emp.emp_ap1}"?`)) return

    try {
      await empleadoService.deleteEmpleado(emp.id_empleado)
      setEmpleados(prev => prev.filter(e => e.id_empleado !== emp.id_empleado))
      toast.success("Empleado eliminado")
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  const getDepartamentoName = (id: number | null | undefined) => {
    if (!id) return "Sin Asignar"
    const depto = departamentos.find(d => d.id_departamento === id)
    return depto ? depto.dep_nombre : "Desconocido"
  }

  return (
    <BaseLayout 
      title="Gestión de Empleados" 
      description="Administración del personal y su información base."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Users className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Empleados</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Empleado
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por nombre, apellido o cédula..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando empleados...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentEmpleados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No hay empleados registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentEmpleados.map((emp) => (
                    <TableRow key={emp.id_empleado}>
                      <TableCell className="font-medium">{emp.emp_nom1} {emp.emp_ap1}</TableCell>
                      <TableCell>{emp.emp_cedula}</TableCell>
                      <TableCell>{emp.emp_email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
                          {getDepartamentoName(emp.id_departamento)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(emp)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingEmp ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid gap-2">
              <Label htmlFor="emp_cedula">Cédula *</Label>
              <Input id="emp_cedula" value={formData.emp_cedula} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emp_nom1">Primer Nombre *</Label>
                <Input id="emp_nom1" value={formData.emp_nom1} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp_nom2">Segundo Nombre</Label>
                <Input id="emp_nom2" value={formData.emp_nom2} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emp_ap1">Primer Apellido *</Label>
                <Input id="emp_ap1" value={formData.emp_ap1} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp_ap2">Segundo Apellido</Label>
                <Input id="emp_ap2" value={formData.emp_ap2} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emp_fechanacimiento">Fecha Nacimiento *</Label>
                <Input type="date" id="emp_fechanacimiento" value={formData.emp_fechanacimiento} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp_sexo">Sexo *</Label>
                <select 
                  id="emp_sexo" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.emp_sexo}
                  onChange={handleInputChange as any}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="emp_telefono">Teléfono</Label>
                <Input id="emp_telefono" value={formData.emp_telefono} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp_email">Email</Label>
                <Input type="email" id="emp_email" value={formData.emp_email} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emp_direccion">Dirección</Label>
              <Input id="emp_direccion" value={formData.emp_direccion} onChange={handleInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="id_departamento">Departamento</Label>
              <select 
                id="id_departamento" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.id_departamento}
                onChange={handleInputChange as any}
              >
                <option value="">Seleccione un departamento...</option>
                {departamentos.map(dept => (
                  <option key={dept.id_departamento} value={dept.id_departamento}>
                    {dept.dep_nombre}
                  </option>
                ))}
              </select>
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
