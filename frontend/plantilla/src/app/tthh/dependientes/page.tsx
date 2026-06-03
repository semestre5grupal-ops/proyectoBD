"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { dependienteService, type Dependiente } from "@/services/dependienteService"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { EmpleadoAsyncSelect } from "@/components/ui/empleado-async-select"
import { Edit2, Trash2, Plus, Baby, Search } from "lucide-react"
import { toast } from "sonner"

export default function DependientesPage() {
  const [dependientes, setDependientes] = useState<Dependiente[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDep, setEditingDep] = useState<Dependiente | null>(null)
  
  const [formData, setFormData] = useState({
    id_empleado: "",
    dep_ceddoc: "",
    dep_nom1: "",
    dep_nom2: "",
    dep_ap1: "",
    dep_ap2: "",
    dep_fechanacimiento: "",
    dep_sexo: "M",
    dep_parentesco: "Hijo/a",
    dep_estado: "ACT"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [depData] = await Promise.all([
        dependienteService.getAll(),
      ])
      setDependientes(Array.isArray(depData) ? depData.filter((d: Dependiente) => d.dep_estado !== 'INC') : [])
      // Empleados are no longer loaded here, they are loaded asynchronously
      // setEmpleados(Array.isArray(empData) ? empData : [])
      setCurrentPage(1)
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const getEmpleadoName = (id: number) => {
    const emp = empleados.find(e => e.id_empleado === id)
    return emp ? `${emp.emp_nom1} ${emp.emp_ap1}` : `Empleado #${id}`
  }

  const filteredDependientes = dependientes.filter(dep => {
    const term = searchTerm.toLowerCase()
    const empName = getEmpleadoName(dep.id_empleado).toLowerCase()
    const depName = `${dep.dep_nom1} ${dep.dep_ap1}`.toLowerCase()
    return (
      empName.includes(term) ||
      depName.includes(term) ||
      dep.dep_ceddoc.includes(term)
    )
  })

  const totalPages = Math.ceil(filteredDependientes.length / ITEMS_PER_PAGE)
  const currentDependientes = filteredDependientes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenModal = (dep?: Dependiente) => {
    if (dep) {
      setEditingDep(dep)
      setFormData({
        id_empleado: String(dep.id_empleado),
        dep_ceddoc: dep.dep_ceddoc,
        dep_nom1: dep.dep_nom1,
        dep_nom2: dep.dep_nom2 || "",
        dep_ap1: dep.dep_ap1,
        dep_ap2: dep.dep_ap2 || "",
        dep_fechanacimiento: dep.dep_fechanacimiento ? new Date(dep.dep_fechanacimiento).toISOString().split('T')[0] : "",
        dep_sexo: dep.dep_sexo,
        dep_parentesco: dep.dep_parentesco,
        dep_estado: dep.dep_estado
      })
    } else {
      setEditingDep(null)
      setFormData({
        id_empleado: "",
        dep_ceddoc: "",
        dep_nom1: "",
        dep_nom2: "",
        dep_ap1: "",
        dep_ap2: "",
        dep_fechanacimiento: "",
        dep_sexo: "M",
        dep_parentesco: "Hijo/a",
        dep_estado: "ACT"
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDep(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (!formData.id_empleado || !formData.dep_ceddoc || !formData.dep_nom1 || !formData.dep_ap1 || !formData.dep_fechanacimiento) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    try {
      const data: Dependiente = {
        ...(editingDep || {}),
        id_empleado: parseInt(formData.id_empleado),
        dep_ceddoc: formData.dep_ceddoc,
        dep_nom1: formData.dep_nom1,
        dep_nom2: formData.dep_nom2,
        dep_ap1: formData.dep_ap1,
        dep_ap2: formData.dep_ap2,
        dep_fechanacimiento: new Date(formData.dep_fechanacimiento).toISOString(),
        dep_sexo: formData.dep_sexo,
        dep_parentesco: formData.dep_parentesco,
        dep_estado: editingDep ? editingDep.dep_estado : "ACT"
      }

      // Evitar enviar un sexo vacío
      if (!data.dep_sexo) {
        toast.error("Por favor selecciona el sexo");
        return;
      }

      if (editingDep && editingDep.id_dependiente) {
        await dependienteService.update(editingDep.id_dependiente, data)
        toast.success("Dependiente actualizado exitosamente")
      } else {
        await dependienteService.create(data)
        toast.success("Dependiente creado exitosamente")
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (dep: Dependiente) => {
    if (!dep.id_dependiente) return
    if (!confirm(`¿Seguro que deseas eliminar a este dependiente?`)) return

    try {
      await dependienteService.delete(dep.id_dependiente)
      toast.success("Dependiente eliminado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Dependientes" 
      description="Cargas familiares y dependientes de los empleados."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Baby className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Dependientes (Cargas Familiares)</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Dependiente
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por nombre, cédula o empleado..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando dependientes...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado Asociado</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Nombre del Dependiente</TableHead>
                  <TableHead>Parentesco</TableHead>
                  <TableHead>Nacimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDependientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No hay dependientes registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDependientes.map((dep) => (
                    <TableRow key={dep.id_dependiente}>
                      <TableCell className="font-medium text-blue-600">{getEmpleadoName(dep.id_empleado)}</TableCell>
                      <TableCell>{dep.dep_ceddoc}</TableCell>
                      <TableCell>{dep.dep_nom1} {dep.dep_ap1}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20">
                          {dep.dep_parentesco}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(dep.dep_fechanacimiento).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(dep)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dep)}>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDep ? "Editar Dependiente" : "Nuevo Dependiente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id_empleado" className="text-right">Empleado</Label>
                <div className="col-span-3">
                  <EmpleadoAsyncSelect 
                    value={formData.id_empleado}
                    onChange={(id, emp) => {
                      setFormData(prev => ({ ...prev, id_empleado: id }))
                      if (emp && !empleados.find(e => e.id_empleado === emp.id_empleado)) {
                        setEmpleados(prev => [...prev, emp])
                      }
                    }}
                  />
                </div>
              </div>

            <div className="grid gap-2">
              <Label htmlFor="dep_ceddoc">Documento / Cédula *</Label>
              <Input id="dep_ceddoc" value={formData.dep_ceddoc} onChange={handleInputChange} maxLength={10} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dep_nom1">Primer Nombre *</Label>
                <Input id="dep_nom1" value={formData.dep_nom1} onChange={handleInputChange} maxLength={50} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dep_nom2">Segundo Nombre</Label>
                <Input id="dep_nom2" value={formData.dep_nom2} onChange={handleInputChange} maxLength={50} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dep_ap1">Primer Apellido *</Label>
                <Input id="dep_ap1" value={formData.dep_ap1} onChange={handleInputChange} maxLength={50} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dep_ap2">Segundo Apellido</Label>
                <Input id="dep_ap2" value={formData.dep_ap2} onChange={handleInputChange} maxLength={50} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dep_fechanacimiento">Fecha Nacimiento *</Label>
                <Input type="date" id="dep_fechanacimiento" value={formData.dep_fechanacimiento} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dep_sexo">Sexo *</Label>
                <select 
                  id="dep_sexo" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.dep_sexo}
                  onChange={handleInputChange as any}
                >
                  <option value="">Seleccione...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dep_parentesco">Parentesco *</Label>
              <select 
                id="dep_parentesco" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.dep_parentesco}
                onChange={handleInputChange as any}
              >
                <option value="Hijo/a">Hijo/a</option>
                <option value="Cónyuge">Cónyuge</option>
                <option value="Padre/Madre">Padre/Madre</option>
                <option value="Otro">Otro</option>
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
