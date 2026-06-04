"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { cargoService, type Cargo } from "@/services/cargoService"
import { departamentoService, type Departamento } from "@/services/departamentoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, Briefcase, Search } from "lucide-react"
import { toast } from "sonner"

export default function CargosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([])
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
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null)
  
  // Form fields
  const [carNombre, setCarNombre] = useState("")
  const [carSueldobase, setCarSueldobase] = useState<number>(0)
  const [idDepartamento, setIdDepartamento] = useState<string>("")

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
      const [cargosRes, deptosData] = await Promise.all([
        cargoService.getAll(currentPage, ITEMS_PER_PAGE, searchTerm),
        departamentoService.getAllList()
      ])
      if (Array.isArray(cargosRes)) {
        setCargos(cargosRes.filter((c: Cargo) => c.car_estado !== 'INC'))
        setTotalPages(Math.ceil(cargosRes.length / ITEMS_PER_PAGE) || 1)
      } else {
        setCargos(cargosRes.data || [])
        setTotalPages(cargosRes.totalPages || 1)
      }
      setDepartamentos(Array.isArray(deptosData) ? deptosData : [])
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const getDeptName = (idDept: number) => {
    const dept = departamentos.find(d => d.id_departamento === idDept)
    return dept ? dept.dep_nombre : "Desconocido"
  }

  const currentCargos = cargos;

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handleOpenModal = (cargo?: Cargo) => {
    if (cargo) {
      setEditingCargo(cargo)
      setCarNombre(cargo.car_nombre)
      setCarSueldobase(cargo.car_sueldobase)
      setIdDepartamento(cargo.id_departamento.toString())
    } else {
      setEditingCargo(null)
      setCarNombre("")
      setCarSueldobase(0)
      setIdDepartamento("")
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCargo(null)
    setCarNombre("")
    setCarSueldobase(0)
    setIdDepartamento("")
  }

  const handleSave = async () => {
    if (!carNombre.trim() || !idDepartamento || carSueldobase < 0) {
      alert("Por favor llena todos los campos correctamente")
      return
    }

    try {
      const data: Partial<Cargo> = {
        ...(editingCargo || {}),
        car_nombre: carNombre,
        car_sueldobase: Number(carSueldobase),
        id_departamento: parseInt(idDepartamento),
        car_feccreacion: editingCargo?.car_feccreacion || new Date().toISOString()
      }

      if (editingCargo && editingCargo.id_cargo) {
        await cargoService.update(editingCargo.id_cargo, data)
        setCargos(prev => prev.map(c =>
          c.id_cargo === editingCargo.id_cargo
            ? { ...c, car_nombre: carNombre, car_sueldobase: Number(carSueldobase), id_departamento: parseInt(idDepartamento) }
            : c
        ))
        toast.success("Cargo actualizado exitosamente")
      } else {
        const created = await cargoService.create(data)
        setCargos(prev => [created, ...prev])
        toast.success("Cargo creado exitosamente")
      }
      handleCloseModal()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (cargo: Cargo) => {
    if (!cargo.id_cargo) return
    if (!confirm(`¿Seguro que deseas inactivar el cargo "${cargo.car_nombre}"?`)) return

    try {
      await cargoService.update(cargo.id_cargo, { ...cargo, car_estado: "INC" })
      setCargos(prev => prev.filter(c => c.id_cargo !== cargo.id_cargo))
      toast.success("Cargo inactivado")
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al inactivar"))
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Cargos" 
      description="Administración de los puestos de trabajo y sueldos base."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Briefcase className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Cargos</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Cargo
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por cargo o departamento..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando cargos...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Sueldo Base</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCargos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No hay cargos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentCargos.map((cargo) => (
                    <TableRow key={cargo.id_cargo}>
                      <TableCell className="font-medium">{cargo.car_nombre}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {getDeptName(cargo.id_departamento)}
                        </span>
                      </TableCell>
                      <TableCell>${Number(cargo.car_sueldobase).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${cargo.car_estado === 'ACT' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                          {cargo.car_estado || 'ACT'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cargo)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cargo)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCargo ? "Editar Cargo" : "Nuevo Cargo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre del Cargo</Label>
              <Input 
                id="nombre" 
                value={carNombre} 
                onChange={(e) => setCarNombre(e.target.value)} 
                placeholder="Ej. Desarrollador Senior"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sueldo">Sueldo Base ($)</Label>
              <Input 
                id="sueldo" 
                type="number"
                min="0"
                step="0.01"
                value={carSueldobase} 
                onChange={(e) => setCarSueldobase(parseFloat(e.target.value))} 
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Select value={idDepartamento} onValueChange={setIdDepartamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map(dept => (
                    <SelectItem key={dept.id_departamento} value={dept.id_departamento!.toString()}>
                      {dept.dep_nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
