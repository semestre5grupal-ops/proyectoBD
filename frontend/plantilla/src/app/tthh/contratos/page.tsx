"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { contratoService, type Contrato } from "@/services/contratoService"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { cargoService, type Cargo } from "@/services/cargoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { EmpleadoAsyncSelect } from "@/components/ui/empleado-async-select"
import { Edit2, Trash2, Plus, FileText, Search } from "lucide-react"
import { toast } from "sonner"

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscador
  const [searchTerm, setSearchTerm] = useState("")

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCon, setEditingCon] = useState<Contrato | null>(null)
  
  // Form fields
  const [formData, setFormData] = useState({
    con_tipo: "F",
    con_fechainicio: "",
    con_fecha_fin: "",
    con_sueldobase: "",
    id_empleado: "",
    id_cargo: ""
  })

  const getTipoLabel = (tipo: string) => {
    switch(tipo) {
      case 'I': return 'Indefinido';
      case 'T': return 'Temporal';
      case 'P': return 'Servicios Profesionales';
      case 'O': return 'Por Obra Cierta';
      default: return tipo;
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [conData, carData] = await Promise.all([
        contratoService.getAll(),
        cargoService.getAll()
      ])
      setContratos(Array.isArray(conData) ? conData.filter((c: Contrato) => c.con_estado !== 'INC') : [])
      // Empleados are no longer loaded here, they are loaded asynchronously
      // setEmpleados(Array.isArray(empData) ? empData : [])
      setCargos(Array.isArray(carData) ? carData.filter((c: Cargo) => c.car_estado === 'ACT') : [])
      setCurrentPage(1)
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const getEmpleadoName = (id: number) => {
    // We might not have all employees in memory anymore.
    // However, we only need it for the table. Let's try to get it if we stored it,
    // otherwise just fetch it on demand or the backend should ideally join the name.
    // For now, if we don't have it, we'll return ID or a generic string.
    const emp = empleados.find(e => e.id_empleado === id)
    return emp ? `${emp.emp_nom1} ${emp.emp_ap1}` : `Empleado #${id}`
  }

  const getCargoName = (id: number) => {
    const car = cargos.find(c => c.id_cargo === id)
    return car ? car.car_nombre : "Desconocido"
  }

  const filteredContratos = contratos.filter(con => {
    const term = searchTerm.toLowerCase()
    const empName = getEmpleadoName(con.id_empleado).toLowerCase()
    const tipoLabel = getTipoLabel(con.con_tipo).toLowerCase()
    return (
      empName.includes(term) ||
      tipoLabel.includes(term)
    )
  })

  const totalPages = Math.ceil(filteredContratos.length / ITEMS_PER_PAGE)
  const currentContratos = filteredContratos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenModal = (con?: Contrato) => {
    if (con) {
      setEditingCon(con)
      setFormData({
        con_tipo: con.con_tipo,
        con_fechainicio: con.con_fechainicio ? new Date(con.con_fechainicio).toISOString().split('T')[0] : "",
        con_fecha_fin: con.con_fecha_fin ? new Date(con.con_fecha_fin).toISOString().split('T')[0] : "",
        con_sueldobase: String(con.con_sueldobase),
        id_empleado: String(con.id_empleado),
        id_cargo: String(con.id_cargo)
      })
    } else {
      setEditingCon(null)
      setFormData({
        con_tipo: "I",
        con_fechainicio: new Date().toISOString().split('T')[0],
        con_fecha_fin: "",
        con_sueldobase: "",
        id_empleado: "",
        id_cargo: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCon(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleCargoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cargoId = e.target.value;
    const selectedCargo = cargos.find(c => c.id_cargo === parseInt(cargoId));
    setFormData(prev => ({
      ...prev,
      id_cargo: cargoId,
      con_sueldobase: selectedCargo ? String(selectedCargo.car_sueldobase) : prev.con_sueldobase
    }));
  }

  const handleSave = async () => {
    if (!formData.id_empleado || !formData.id_cargo || !formData.con_fechainicio || !formData.con_sueldobase) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    // Validación: Un empleado no puede tener más de un contrato activo
    if (!editingCon) {
      const empId = parseInt(formData.id_empleado);
      const hasActive = contratos.some(c => c.id_empleado === empId && c.con_estado === 'ACT');
      if (hasActive) {
        toast.error("Este empleado ya tiene un contrato activo. Debes inactivarlo o finalizarlo antes de crear uno nuevo.");
        return;
      }
    }

    try {
      const data: any = {
        ...(editingCon || {}),
        con_estado: editingCon ? editingCon.con_estado : "ACT",
        con_empfechaingreso: formData.con_fechainicio,
        con_tipo: formData.con_tipo,
        con_fechainicio: new Date(formData.con_fechainicio).toISOString(),
        con_fecha_fin: formData.con_fecha_fin ? new Date(formData.con_fecha_fin).toISOString() : null,
        con_sueldobase: parseFloat(formData.con_sueldobase),
        id_empleado: parseInt(formData.id_empleado),
        id_cargo: parseInt(formData.id_cargo),
        con_mensualiza_d3: false,
        con_mensualiza_d4: false,
        con_mensualiza_fr: false
      }

      if (editingCon && editingCon.id_contrato) {
        await contratoService.update(editingCon.id_contrato, data)
        toast.success("Contrato actualizado exitosamente")
      } else {
        await contratoService.create(data)
        toast.success("Contrato creado exitosamente")
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (con: Contrato) => {
    if (!con.id_contrato) return
    if (!confirm(`¿Seguro que deseas eliminar este contrato?`)) return

    try {
      await contratoService.delete(con.id_contrato)
      toast.success("Contrato eliminado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Contratos" 
      description="Administración de los contratos de los empleados."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <FileText className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Contratos</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Contrato
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por empleado o tipo..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando contratos...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentContratos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      No hay contratos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentContratos.map((con) => (
                    <TableRow key={con.id_contrato}>
                      <TableCell className="font-medium">{getEmpleadoName(con.id_empleado)}</TableCell>
                      <TableCell>{getCargoName(con.id_cargo)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-purple-50 text-purple-700 ring-purple-600/20">
                          {getTipoLabel(con.con_tipo)}
                        </span>
                      </TableCell>
                      <TableCell>${Number(con.con_sueldobase).toFixed(2)}</TableCell>
                      <TableCell>{new Date(con.con_fechainicio).toLocaleDateString()}</TableCell>
                      <TableCell>{con.con_fecha_fin ? new Date(con.con_fecha_fin).toLocaleDateString() : 'Indefinido'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(con)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(con)}>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCon ? "Editar Contrato" : "Nuevo Contrato"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id_empleado" className="text-right">Empleado</Label>
                <div className="col-span-3">
                  <EmpleadoAsyncSelect 
                    value={formData.id_empleado}
                    onChange={(id, emp) => {
                      setFormData(prev => ({ ...prev, id_empleado: id }))
                      // Optionally store the selected employee in the employees array so getEmpleadoName works
                      if (emp && !empleados.find(e => e.id_empleado === emp.id_empleado)) {
                        setEmpleados(prev => [...prev, emp])
                      }
                    }}
                  />
                </div>
              </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="id_cargo">Cargo *</Label>
                <select 
                  id="id_cargo" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.id_cargo}
                  onChange={handleCargoChange as any}
                >
                  <option value="">Seleccione...</option>
                  {cargos.map(car => (
                    <option key={car.id_cargo} value={car.id_cargo}>
                      {car.car_nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="con_tipo">Tipo *</Label>
                <select 
                  id="con_tipo" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.con_tipo}
                  onChange={handleInputChange as any}
                >
                  <option value="I">Indefinido</option>
                  <option value="T">Temporal</option>
                  <option value="P">Servicios Profesionales</option>
                  <option value="O">Por Obra Cierta</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="con_sueldobase">Salario Mensual ($) *</Label>
              <Input type="number" step="0.01" id="con_sueldobase" value={formData.con_sueldobase} onChange={handleInputChange} />
              <p className="text-[10px] text-muted-foreground">Al cambiar el cargo se sugiere su sueldo base automáticamente.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="con_fechainicio">Fecha Inicio *</Label>
                <Input type="date" id="con_fechainicio" value={formData.con_fechainicio} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="con_fecha_fin">Fecha Fin (Opcional)</Label>
                <Input type="date" id="con_fecha_fin" value={formData.con_fecha_fin} onChange={handleInputChange} />
              </div>
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
