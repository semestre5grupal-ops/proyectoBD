"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { asistenciaService, type Asistencia } from "@/services/asistenciaService"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, CalendarCheck, Search } from "lucide-react"
import { toast } from "sonner"

export default function AsistenciasPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAsistencia, setEditingAsistencia] = useState<Asistencia | null>(null)
  
  const [formData, setFormData] = useState({
    id_empleado: "",
    fecha_hora: "",
    tipo_movimiento: "Entrada"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [asisData, empData] = await Promise.all([
        asistenciaService.getAll(),
        empleadoService.getEmpleados(1, 1000)
      ])
      
      // Ordenamos por fecha_hora descendente para ver las más recientes primero
      const sortedAsis = Array.isArray(asisData) 
        ? asisData.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
        : []
        
      setAsistencias(sortedAsis)
      if (empData && Array.isArray(empData.data)) {
        setEmpleados(empData.data.filter((e: Empleado) => e.emp_estado !== 'INC' && e.emp_estado !== 'INA'))
      } else if (Array.isArray(empData)) {
        setEmpleados((empData as Empleado[]).filter((e: Empleado) => e.emp_estado !== 'INC' && e.emp_estado !== 'INA'))
      }
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

  const getMovimientoLabel = (mov: string) => {
    if (!mov) return "Desconocido";
    const cleanMov = mov.trim();
    if (cleanMov === 'ENTRA' || cleanMov === 'Entrada') return 'Entrada';
    if (cleanMov === 'SALE' || cleanMov === 'Salida') return 'Salida';
    return mov;
  }

  const filteredAsistencias = asistencias.filter(asis => {
    const term = searchTerm.toLowerCase()
    const empName = getEmpleadoName(asis.id_empleado).toLowerCase()
    const movLabel = getMovimientoLabel(asis.tipo_movimiento).toLowerCase()
    return (
      empName.includes(term) ||
      movLabel.includes(term)
    )
  })

  const totalPages = Math.ceil(filteredAsistencias.length / ITEMS_PER_PAGE)
  const currentAsistencias = filteredAsistencias.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenModal = (asis?: Asistencia) => {
    if (asis) {
      setEditingAsistencia(asis)
      
      // Formatear la fecha para input datetime-local (YYYY-MM-DDThh:mm)
      const dt = new Date(asis.fecha_hora)
      const tzoffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dt.getTime() - tzoffset)).toISOString().slice(0, 16);
      
      setFormData({
        id_empleado: String(asis.id_empleado),
        fecha_hora: localISOTime,
        tipo_movimiento: asis.tipo_movimiento === 'ENTRA' ? 'Entrada' : 'Salida'
      })
    } else {
      setEditingAsistencia(null)
      
      const dt = new Date()
      const tzoffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dt.getTime() - tzoffset)).toISOString().slice(0, 16);
      
      setFormData({
        id_empleado: "",
        fecha_hora: localISOTime,
        tipo_movimiento: "Entrada"
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAsistencia(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (!formData.id_empleado || !formData.fecha_hora || !formData.tipo_movimiento) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    try {
      const data: any = {
        ...(editingAsistencia || {}),
        id_empleado: parseInt(formData.id_empleado),
        fecha_hora: new Date(formData.fecha_hora).toISOString(),
        tipo_movimiento: formData.tipo_movimiento === 'Entrada' ? 'ENTRA' : 'SALE',
        asis_estado: "ACT"
      }

      if (editingAsistencia && editingAsistencia.id_asistencia) {
        await asistenciaService.update(editingAsistencia.id_asistencia, data)
        setAsistencias(prev => prev.map(a => a.id_asistencia === editingAsistencia.id_asistencia ? { ...a, ...data } : a))
        toast.success("Asistencia actualizada exitosamente")
      } else {
        const created = await asistenciaService.create(data)
        setAsistencias(prev => [created, ...prev])
        toast.success("Asistencia registrada exitosamente")
      }
      handleCloseModal()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (asis: Asistencia) => {
    if (!asis.id_asistencia) return
    if (!confirm(`¿Seguro que deseas eliminar esta asistencia?`)) return

    try {
      await asistenciaService.delete(asis.id_asistencia)
      setAsistencias(prev => prev.filter(a => a.id_asistencia !== asis.id_asistencia))
      toast.success("Asistencia eliminada")
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  return (
    <BaseLayout 
      title="Control de Asistencias" 
      description="Marcado de entradas y salidas de los empleados."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <CalendarCheck className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Asistencias</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Registrar Asistencia
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
          <div className="flex justify-center p-8">Cargando asistencias...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Tipo Movimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAsistencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No hay asistencias registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAsistencias.map((asis) => (
                    <TableRow key={asis.id_asistencia}>
                      <TableCell className="font-medium">{getEmpleadoName(asis.id_empleado)}</TableCell>
                      <TableCell>{new Date(asis.fecha_hora).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          getMovimientoLabel(asis.tipo_movimiento) === 'Entrada' 
                            ? 'bg-green-50 text-green-700 ring-green-600/20' 
                            : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                        }`}>
                          {getMovimientoLabel(asis.tipo_movimiento)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(asis)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(asis)}>
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
            <DialogTitle>{editingAsistencia ? "Editar Asistencia" : "Registrar Asistencia"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid gap-2">
              <Label htmlFor="id_empleado">Empleado *</Label>
              <select 
                id="id_empleado"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.id_empleado}
                onChange={handleInputChange as any}
              >
                <option value="">Seleccione...</option>
                {empleados.map(emp => (
                  <option key={emp.id_empleado} value={emp.id_empleado}>
                    {emp.emp_nom1} {emp.emp_ap1} ({emp.emp_cedula})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fecha_hora">Fecha y Hora *</Label>
              <Input type="datetime-local" id="fecha_hora" value={formData.fecha_hora} onChange={handleInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo_movimiento">Movimiento *</Label>
              <select 
                id="tipo_movimiento" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.tipo_movimiento}
                onChange={handleInputChange as any}
              >
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
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
