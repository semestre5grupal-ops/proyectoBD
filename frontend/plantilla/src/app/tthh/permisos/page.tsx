"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { permisoService, type Permiso } from "@/services/permisoService"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, FileSignature, Search, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function PermisosPage() {
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPermiso, setEditingPermiso] = useState<Permiso | null>(null)
  
  const [formData, setFormData] = useState({
    id_empleado: "",
    per_fecha_inicio: "",
    per_fecha_fin: "",
    per_estado: "PEN",
    per_observacion: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [perData, empData] = await Promise.all([
        permisoService.getAll(),
        empleadoService.getEmpleados()
      ])
      
      const sortedPer = Array.isArray(perData) 
        ? perData.sort((a, b) => new Date(b.per_fecha_inicio).getTime() - new Date(a.per_fecha_inicio).getTime())
        : []
        
      setPermisos(Array.isArray(perData) ? perData.filter((p: Permiso) => p.per_estado !== 'INC' && p.per_estado !== 'INA') : [])
      
      if (Array.isArray(empData)) {
        setEmpleados(empData)
      } else {
        setEmpleados(empData.data || [])
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
    return emp ? `${emp.emp_nom1} ${emp.emp_ap1}` : "Desconocido"
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PEN': return 'Pendiente';
      case 'APR': return 'Aprobado';
      case 'REC': return 'Rechazado';
      case 'REZ': return 'Rechazado';
      default: return estado;
    }
  }

  const filteredPermisos = permisos.filter(per => {
    const term = searchTerm.toLowerCase()
    const empName = getEmpleadoName(per.id_empleado).toLowerCase()
    const estadoLabel = getEstadoLabel(per.per_estado).toLowerCase()
    return (
      empName.includes(term) ||
      estadoLabel.includes(term) ||
      per.per_observacion?.toLowerCase().includes(term)
    )
  })

  const totalPages = Math.ceil(filteredPermisos.length / ITEMS_PER_PAGE)
  const currentPermisos = filteredPermisos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenModal = (per?: Permiso) => {
    if (per) {
      setEditingPermiso(per)
      setFormData({
        id_empleado: String(per.id_empleado),
        per_fecha_inicio: per.per_fecha_inicio ? new Date(per.per_fecha_inicio).toISOString().split('T')[0] : "",
        per_fecha_fin: per.per_fecha_fin ? new Date(per.per_fecha_fin).toISOString().split('T')[0] : "",
        per_estado: per.per_estado,
        per_observacion: per.per_observacion
      })
    } else {
      setEditingPermiso(null)
      const now = new Date()
      setFormData({
        id_empleado: "",
        per_fecha_inicio: now.toISOString().split('T')[0],
        per_fecha_fin: now.toISOString().split('T')[0],
        per_estado: "PEN",
        per_observacion: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPermiso(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (!formData.id_empleado || !formData.per_fecha_inicio || !formData.per_fecha_fin) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    try {
      const data: any = {
        ...(editingPermiso || {}),
        id_empleado: parseInt(formData.id_empleado),
        per_fecha_inicio: formData.per_fecha_inicio,
        per_fecha_fin: formData.per_fecha_fin,
        per_estado: editingPermiso ? editingPermiso.per_estado : "PEN",
        per_observacion: formData.per_observacion
      }

      if (editingPermiso && editingPermiso.id_permiso) {
        await permisoService.update(editingPermiso.id_permiso, data)
        toast.success("Permiso actualizado exitosamente")
      } else {
        await permisoService.create(data)
        toast.success("Permiso registrado exitosamente")
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (per: Permiso) => {
    if (!per.id_permiso) return
    if (!confirm(`¿Seguro que deseas eliminar este permiso?`)) return

    try {
      await permisoService.delete(per.id_permiso)
      toast.success("Permiso eliminado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  const handleApprove = async (per: Permiso) => {
    if (!per.id_permiso) return
    if (!confirm(`¿Seguro que deseas Aprobar el permiso de ${getEmpleadoName(per.id_empleado)}?`)) return
    try {
      await permisoService.update(per.id_permiso, { ...per, per_estado: 'APR' })
      toast.success("Permiso aprobado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error al aprobar: " + (err.message || "Ocurrió un error"))
    }
  }

  const handleReject = async (per: Permiso) => {
    if (!per.id_permiso) return
    if (!confirm(`¿Seguro que deseas Rechazar el permiso de ${getEmpleadoName(per.id_empleado)}?`)) return
    try {
      await permisoService.update(per.id_permiso, { ...per, per_estado: 'REZ' })
      toast.success("Permiso rechazado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error al rechazar: " + (err.message || "Ocurrió un error"))
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Permisos" 
      description="Registro de permisos de ausencia y justificaciones."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <FileSignature className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Permisos</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus size={16} /> Registrar Permiso
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por empleado, estado u observación..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando permisos...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead>Hasta</TableHead>
                  <TableHead>Observación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPermisos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No hay permisos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPermisos.map((per) => {
                    const dtInicio = new Date(per.per_fecha_inicio);
                    const dtFin = new Date(per.per_fecha_fin);
                    return (
                      <TableRow key={per.id_permiso}>
                        <TableCell className="font-medium text-blue-600">{getEmpleadoName(per.id_empleado)}</TableCell>
                        <TableCell>{dtInicio.toLocaleDateString()}</TableCell>
                        <TableCell>{dtFin.toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={per.per_observacion}>
                          {per.per_observacion}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            per.per_estado === 'APR' || per.per_estado === 'Aprobado'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                              : per.per_estado === 'REZ' || per.per_estado === 'REC' || per.per_estado === 'Rechazado'
                              ? 'bg-red-50 text-red-700 ring-red-600/20'
                              : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                          }`}>
                            {getEstadoLabel(per.per_estado)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {(per.per_estado === 'PEN' || per.per_estado === 'Pendiente') && (
                            <>
                              <Button variant="ghost" size="icon" title="Aprobar" onClick={() => handleApprove(per)}>
                                <CheckCircle size={16} className="text-emerald-600" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Rechazar" onClick={() => handleReject(per)}>
                                <XCircle size={16} className="text-red-500" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => handleOpenModal(per)}>
                            <Edit2 size={16} className="text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Eliminar" onClick={() => handleDelete(per)}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingPermiso ? "Editar Permiso" : "Registrar Permiso"}</DialogTitle>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="per_fecha_inicio">Desde *</Label>
                <Input type="date" id="per_fecha_inicio" value={formData.per_fecha_inicio} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="per_fecha_fin">Hasta *</Label>
                <Input type="date" id="per_fecha_fin" value={formData.per_fecha_fin} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="per_observacion">Observación</Label>
              <textarea 
                id="per_observacion" 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.per_observacion}
                onChange={handleInputChange as any}
                placeholder="Motivo del permiso..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
