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
        empleadoService.getEmpleados()
      ])
      
      // Ordenamos por fecha_hora descendente para ver las más recientes primero
      const sortedAsis = Array.isArray(asisData) 
        ? asisData.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
        : []
        
      setAsistencias(sortedAsis)
      setEmpleados(Array.isArray(empData) ? empData.filter(e => e.emp_estado !== 'INC' && e.emp_estado !== 'INA') : [])
      setCurrentPage(1)
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const getEmpleadoName = (id: number) => {
    const emp = empleados.find(e => e.id_empleado === id)
    return emp ? `${emp.emp_nom1} ${emp.emp_ap1}` : "Desconocido"
  }

  const getMovimientoLabel = (mov: string) => {
    if (!mov) return "Desconocido";
    const cleanMov = mov.trim();
    if (cleanMov === 'ENTRA') return 'Entrada';
    if (cleanMov === 'SALE') return 'Salida';
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
      const tzoffset = dt.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(dt.getTime() - tzoffset)).toISOString().slice(0, 16);
      
      setFormData({
        id_empleado: String(asis.id_empleado),
        fecha_hora: localISOTime,
        tipo_movimiento: getMovimientoLabel(asis.tipo_movimiento)
      })
    } else {
      setEditingAsistencia(null)
      const now = new Date()
      const tzoffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
      
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
    if (!formData.id_empleado || !formData.fecha_hora) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    try {
      const data: Asistencia = {
        ...(editingAsistencia || {}),
        id_empleado: parseInt(formData.id_empleado),
        fecha_hora: new Date(formData.fecha_hora).toISOString(),
        tipo_movimiento: formData.tipo_movimiento === 'Entrada' ? 'ENTRA' : 'SALE '
      }

      if (editingAsistencia && editingAsistencia.id_asistencia) {
        await asistenciaService.update(editingAsistencia.id_asistencia, data)
        toast.success("Asistencia actualizada exitosamente")
      } else {
        await asistenciaService.create(data)
        toast.success("Asistencia registrada exitosamente")
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (asis: Asistencia) => {
    if (!asis.id_asistencia) return
    if (!confirm(`¿Seguro que deseas eliminar este registro de asistencia?`)) return

    try {
      await asistenciaService.delete(asis.id_asistencia)
      toast.success("Registro eliminado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  return (
    <BaseLayout 
      title="Control de Asistencias" 
      description="Registro de marcaciones de entrada y salida."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <CalendarCheck className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Marcaciones de Asistencia</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus size={16} /> Registrar Marcación
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por empleado o movimiento..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando marcaciones...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Tipo Movimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAsistencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No hay registros de asistencia.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAsistencias.map((asis) => {
                    const dt = new Date(asis.fecha_hora);
                    return (
                      <TableRow key={asis.id_asistencia}>
                        <TableCell className="font-medium text-blue-600">{getEmpleadoName(asis.id_empleado)}</TableCell>
                        <TableCell>{dt.toLocaleDateString()}</TableCell>
                        <TableCell>{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            (asis.tipo_movimiento || '').trim() === 'ENTRA' 
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                              : 'bg-orange-50 text-orange-700 ring-orange-600/20'
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
                    )
                  })
                )}
              </TableBody>
            </Table>
            
            {filteredAsistencias.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando del {(currentPage - 1) * ITEMS_PER_PAGE + 1} al {Math.min(currentPage * ITEMS_PER_PAGE, filteredAsistencias.length)} de {filteredAsistencias.length} registros
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAsistencia ? "Editar Marcación" : "Registrar Marcación"}</DialogTitle>
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
                <option value="">Seleccione un empleado...</option>
                {empleados.map(emp => (
                  <option key={emp.id_empleado} value={emp.id_empleado}>
                    {emp.emp_nom1} {emp.emp_ap1} - {emp.emp_cedula}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="fecha_hora">Fecha y Hora *</Label>
              <Input type="datetime-local" id="fecha_hora" value={formData.fecha_hora} onChange={handleInputChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo_movimiento">Tipo de Movimiento *</Label>
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
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
