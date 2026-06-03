"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { rolPagoService, type RolPago } from "@/services/rolPagoService"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, DollarSign, Search, Calculator } from "lucide-react"
import { toast } from "sonner"

export default function RolesPagoPage() {
  const [roles, setRoles] = useState<RolPago[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRol, setEditingRol] = useState<RolPago | null>(null)
  
  const [formData, setFormData] = useState({
    id_empleado: "",
    id_rolpago2: "1",
    rol_dias_trabajados: "30",
    rol_bontotal: "0",
    rol_comtotal: "0",
    rol_destotal: "0",
    rol_neto: "0",
    rol_estado: "Generado"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rolData, empData] = await Promise.all([
        rolPagoService.getAll(),
        empleadoService.getEmpleados()
      ])
      
      setRoles(Array.isArray(rolData) ? rolData : [])
      setEmpleados(Array.isArray(empData) ? empData : [])
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

  const filteredRoles = roles.filter(rol => {
    const term = searchTerm.toLowerCase()
    const empName = getEmpleadoName(rol.id_empleado).toLowerCase()
    return (
      empName.includes(term) ||
      rol.rol_estado.toLowerCase().includes(term)
    )
  })

  const totalPages = Math.ceil(filteredRoles.length / ITEMS_PER_PAGE)
  const currentRoles = filteredRoles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenModal = (rol?: RolPago) => {
    if (rol) {
      setEditingRol(rol)
      setFormData({
        id_empleado: String(rol.id_empleado),
        id_rolpago2: String(rol.id_rolpago2),
        rol_dias_trabajados: String(rol.rol_dias_trabajados),
        rol_bontotal: String(rol.rol_bontotal),
        rol_comtotal: String(rol.rol_comtotal),
        rol_destotal: String(rol.rol_destotal),
        rol_neto: String(rol.rol_neto),
        rol_estado: rol.rol_estado
      })
    } else {
      setEditingRol(null)
      setFormData({
        id_empleado: "",
        id_rolpago2: "1",
        rol_dias_trabajados: "30",
        rol_bontotal: "0",
        rol_comtotal: "0",
        rol_destotal: "0",
        rol_neto: "0",
        rol_estado: "Generado"
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRol(null)
  }

  const calcularNeto = (nextFormData: typeof formData) => {
    const bonos = parseFloat(nextFormData.rol_bontotal) || 0
    const comisiones = parseFloat(nextFormData.rol_comtotal) || 0
    const descuentos = parseFloat(nextFormData.rol_destotal) || 0
    
    // Sueldo base mockeado para calcular (esto debería venir del contrato)
    const sueldoBase = 500
    const diario = sueldoBase / 30
    const dias = parseInt(nextFormData.rol_dias_trabajados) || 0
    
    const sueldoGanado = diario * dias
    
    return (sueldoGanado + bonos + comisiones - descuentos).toFixed(2)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    
    setFormData(prev => {
      const next = { ...prev, [id]: value }
      if (['rol_dias_trabajados', 'rol_bontotal', 'rol_comtotal', 'rol_destotal'].includes(id)) {
        next.rol_neto = calcularNeto(next)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!formData.id_empleado) {
      toast.error("Por favor selecciona un empleado")
      return
    }

    try {
      const data: RolPago = {
        ...(editingRol || {}),
        id_empleado: parseInt(formData.id_empleado),
        id_rolpago2: parseInt(formData.id_rolpago2) || 1,
        rol_dias_trabajados: parseInt(formData.rol_dias_trabajados) || 0,
        rol_bontotal: parseFloat(formData.rol_bontotal) || 0,
        rol_comtotal: parseFloat(formData.rol_comtotal) || 0,
        rol_destotal: parseFloat(formData.rol_destotal) || 0,
        rol_neto: parseFloat(formData.rol_neto) || 0,
        rol_estado: formData.rol_estado
      }

      if (editingRol && editingRol.id_rol) {
        await rolPagoService.update(editingRol.id_rol, data)
        toast.success("Rol de pago actualizado")
      } else {
        await rolPagoService.create(data)
        toast.success("Rol de pago generado")
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (rol: RolPago) => {
    if (!rol.id_rol) return
    if (!confirm(`¿Seguro que deseas anular este rol de pago?`)) return

    try {
      // Usamos el delete logico / o fisico segun backend, aqui fisico
      await rolPagoService.delete(rol.id_rol)
      toast.success("Rol de pago anulado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al anular"))
    }
  }

  return (
    <BaseLayout 
      title="Roles de Pago" 
      description="Cálculo y generación de nómina mensual."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <DollarSign className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Nómina (Roles)</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Calculator size={16} /> Generar Rol
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por empleado o estado..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando roles de pago...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead className="text-center">Días Trab.</TableHead>
                  <TableHead className="text-right text-emerald-600">Bonos</TableHead>
                  <TableHead className="text-right text-sky-600">Comisiones</TableHead>
                  <TableHead className="text-right text-red-500">Descuentos</TableHead>
                  <TableHead className="text-right font-bold">Neto a Pagar</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                      No hay roles generados en este periodo.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRoles.map((rol) => (
                    <TableRow key={rol.id_rol}>
                      <TableCell className="font-medium text-blue-600">{getEmpleadoName(rol.id_empleado)}</TableCell>
                      <TableCell className="text-center">{rol.rol_dias_trabajados}</TableCell>
                      <TableCell className="text-right text-emerald-600">+${Number(rol.rol_bontotal).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sky-600">+${Number(rol.rol_comtotal).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-500">-${Number(rol.rol_destotal).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">${Number(rol.rol_neto).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          rol.rol_estado === 'Pagado' 
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                            : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                        }`}>
                          {rol.rol_estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(rol)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rol)}>
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
            <DialogTitle>{editingRol ? "Editar Rol de Pago" : "Generar Rol de Pago"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id_empleado">Empleado *</Label>
              <select 
                id="id_empleado" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.id_empleado}
                onChange={handleInputChange as any}
                disabled={!!editingRol}
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
                <Label htmlFor="rol_dias_trabajados">Días Trabajados *</Label>
                <Input type="number" id="rol_dias_trabajados" value={formData.rol_dias_trabajados} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rol_estado">Estado *</Label>
                <select 
                  id="rol_estado" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.rol_estado}
                  onChange={handleInputChange as any}
                >
                  <option value="Generado">Generado (Pendiente)</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="rol_bontotal" className="text-emerald-600">Bonos ($)</Label>
                <Input type="number" step="0.01" id="rol_bontotal" value={formData.rol_bontotal} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rol_comtotal" className="text-sky-600">Comisiones ($)</Label>
                <Input type="number" step="0.01" id="rol_comtotal" value={formData.rol_comtotal} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rol_destotal" className="text-red-500">Descuentos ($)</Label>
                <Input type="number" step="0.01" id="rol_destotal" value={formData.rol_destotal} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid gap-2 border-t pt-4 bg-muted p-3 rounded-md">
              <Label htmlFor="rol_neto" className="text-lg">Neto a Pagar ($)</Label>
              <Input type="number" step="0.01" id="rol_neto" value={formData.rol_neto} disabled className="text-lg font-bold border-0 bg-transparent px-0 focus-visible:ring-0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Guardar Rol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
