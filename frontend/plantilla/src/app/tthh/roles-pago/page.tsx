"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { rolPagoService, type RolPago } from "@/services/rolPagoService"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { rubroService, type Rubro } from "@/services/rubroService"
import { rubrosxrolService, type Rubrosxrol } from "@/services/rubrosxrolService"
import { periodoService, type Periodo } from "@/services/periodoService"
import { contratoService, type Contrato } from "@/services/contratoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, DollarSign, Search, Calculator, CheckCircle, X } from "lucide-react"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/usePermissions"

interface SelectedRubro {
  id: string; // unique id for frontend
  id_rubro: string;
  cantidad: string;
  tipo: string;
}

export default function RolesPagoPage() {
  const { canApprove } = usePermissions()
  const [roles, setRoles] = useState<RolPago[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [rubrosxrol, setRubrosxrol] = useState<Rubrosxrol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRol, setEditingRol] = useState<RolPago | null>(null)
  
  const [formData, setFormData] = useState({
    id_empleado: "",
    id_rolpago2: "",
    rol_dias_trabajados: "30",
    rol_bontotal: "0",
    rol_comtotal: "0",
    rol_destotal: "0",
    rol_neto: "0",
    rol_estado: "GEN"
  })

  const [selectedRubros, setSelectedRubros] = useState<SelectedRubro[]>([])

  // Periodo fijo por regla de negocio: Junio 2026
  const PERIODO_ACTUAL_ID = '2026-06'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // 1. Carga principal: solo roles para que la tabla aparezca rápido
      const rolData = await rolPagoService.getAll().catch(() => [])
      setRoles(Array.isArray(rolData) ? rolData : [])
      setLoading(false) // Mostrar tabla lo antes posible

      // 2. Carga secundaria: datos para los dropdowns del modal (en segundo plano)
      const [empData, rubData, perData, conData, rxrData] = await Promise.all([
        empleadoService.getEmpleados(1, 500).catch(() => ({ data: [] })),
        rubroService.getAll().catch(() => []),
        periodoService.getAllList().catch(() => []),
        contratoService.getAll().catch(() => []),
        rubrosxrolService.getAll().catch(() => [])
      ])

      if (Array.isArray(empData)) {
        setEmpleados(empData)
      } else {
        setEmpleados(empData.data || [])
      }

      setRubros(Array.isArray(rubData) ? rubData.filter((r: Rubro) => r.rub_estado === 'ACT') : [])
      
      const periodosRaw = Array.isArray(perData) ? perData : (perData as any).data || []
      setPeriodos(periodosRaw.filter((p: Periodo) => p.per_estado !== 'INC' && p.per_estado !== 'CER'))
      
      setContratos(Array.isArray(conData) ? conData.filter((c: any) => c.con_estado !== 'INC') : [])
      setRubrosxrol(Array.isArray(rxrData) ? rxrData : [])
      setCurrentPage(1)
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
      setLoading(false)
    }
  }

  const getEmpleadoName = (id: number, rol?: any) => {
    // 1. Primero usamos el campo JOIN del backend (siempre disponible)
    if (rol?.emp_nombre_completo) return rol.emp_nombre_completo
    // 2. Fallback: búsqueda en memoria (cuando ya cargaron)
    if (!id) return "Sin empleado"
    const emp = empleados.find(e => e.id_empleado === id)
    return emp ? `${emp.emp_nom1} ${emp.emp_ap1}` : `#${id}`
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'GEN': return 'Generado';
      case 'PEN': return 'Pendiente';
      case 'PAG': return 'Pagado';
      case 'ANU': return 'Anulado';
      default: return estado;
    }
  }

  const filteredRoles = roles.filter(rol => {
    const term = searchTerm.toLowerCase()
    const empName = getEmpleadoName(rol.id_empleado, rol).toLowerCase()
    const estadoLabel = getEstadoLabel(rol.rol_estado).toLowerCase()
    return (
      empName.includes(term) ||
      estadoLabel.includes(term) ||
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
      
      const existingDetalles = rubrosxrol.filter(r => r.id_rol === rol.id_rol)
      setSelectedRubros(existingDetalles.map(d => ({
        id: d.id_dxe ? String(d.id_dxe) : Math.random().toString(),
        id_rubro: String(d.id_rubros),
        cantidad: String(d.dxe_cantidad),
        tipo: ""
      })))
    } else {
      setEditingRol(null)
      setFormData({
        id_empleado: "",
        id_rolpago2: PERIODO_ACTUAL_ID, // Siempre Junio 2026 para nuevos roles
        rol_dias_trabajados: "30",
        rol_bontotal: "0",
        rol_comtotal: "0",
        rol_destotal: "0",
        rol_neto: "0",
        rol_estado: "GEN"
      })
      setSelectedRubros([])
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRol(null)
  }

  // Recalcular montos al cambiar dias o rubros
  useEffect(() => {
    let bonos = 0
    let comisiones = 0
    let descuentos = 0

    selectedRubros.forEach(sr => {
      const amt = parseFloat(sr.cantidad) || 0
      const r = rubros.find(x => String(x.id_rubros) === String(sr.id_rubro))
      if (r) {
        const isIngreso = r.rub_tipo === true || String(r.rub_tipo).toLowerCase() === "ingreso" || String(r.rub_tipo) === "1";
        const isDescuento = r.rub_tipo === false || String(r.rub_tipo).toLowerCase() === "descuento" || String(r.rub_tipo) === "0";

        if (isIngreso) {
          if (r.rub_descripcion.toLowerCase().includes('comisi')) {
            comisiones += amt
          } else {
            bonos += amt
          }
        } else if (isDescuento) {
          descuentos += amt
        }
      }
    })

    let sueldoBase = 0
    if (formData.id_empleado) {
      const empId = parseInt(formData.id_empleado)
      // Buscar contrato activo
      const contrato = contratos.find(c => c.id_empleado === empId)
      if (contrato) {
        // En frontend contratoService usa con_salario, pero en DB es con_sueldobase. Soportamos ambos.
        sueldoBase = Number((contrato as any).con_sueldobase) || Number(contrato.con_salario) || 0
      }
    }

    const diario = sueldoBase / 30
    const dias = parseInt(formData.rol_dias_trabajados) || 0
    const sueldoGanado = diario * dias
    
    const neto = (sueldoGanado + bonos + comisiones - descuentos).toFixed(2)

    setFormData(prev => ({
      ...prev,
      rol_bontotal: bonos.toFixed(2),
      rol_comtotal: comisiones.toFixed(2),
      rol_destotal: descuentos.toFixed(2),
      rol_neto: neto
    }))

  }, [selectedRubros, formData.rol_dias_trabajados, formData.id_empleado, rubros, contratos])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const addRubroLine = () => {
    // Usamos el prefijo "0." generado por Math.random para identificar rubros nuevos en la UI
    setSelectedRubros(prev => [...prev, { id: Math.random().toString(), id_rubro: "", cantidad: "0", tipo: "" }])
  }

  const removeRubroLine = (id: string) => {
    setSelectedRubros(prev => prev.filter(r => r.id !== id))
  }

  const updateRubroLine = (id: string, field: keyof SelectedRubro, value: string) => {
    setSelectedRubros(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value }
      }
      return r
    }))
  }

  const handleSave = async () => {
    // Periodo FIJO: Junio 2026 (regla de negocio)
    const periodoId = PERIODO_ACTUAL_ID
    const periodoLabel = 'Junio 2026'

    if (!formData.id_empleado) {
      toast.error("Por favor selecciona un empleado")
      return
    }

    // Verificar que el periodo exista en la lista cargada
    const periodoValido = periodos.find(p => String(p.id_rolpago2) === periodoId)
    if (!periodoValido && periodos.length > 0) {
      toast.error(`El periodo ${periodoLabel} no existe o no está activo. Crea los periodos primero.`)
      return
    }

    // Prevenir duplicado: mismo empleado + mismo periodo
    if (!editingRol) {
      const hasAnyRole = roles.find(r =>
        String(r.id_empleado) === String(formData.id_empleado) &&
        String(r.id_rolpago2) === periodoId
      )
      if (hasAnyRole) {
        toast.error(`Este empleado ya tiene un rol de pago en ${periodoLabel}. Edita el rol existente.`)
        return
      }
    }

    try {
      const data: RolPago = {
        ...(editingRol || {}),
        id_empleado: parseInt(formData.id_empleado),
        id_rolpago2: editingRol ? editingRol.id_rolpago2 : (periodoId as any),
        rol_dias_trabajados: parseInt(formData.rol_dias_trabajados) || 0,
        rol_bontotal: parseFloat(formData.rol_bontotal) || 0,
        rol_comtotal: parseFloat(formData.rol_comtotal) || 0,
        rol_destotal: parseFloat(formData.rol_destotal) || 0,
        rol_neto: parseFloat(formData.rol_neto) || 0,
        rol_estado: "GEN"
      }

      if (editingRol && editingRol.id_rol) {
        await rolPagoService.update(editingRol.id_rol, data)
        for (const sr of selectedRubros) {
          if (sr.id.startsWith("0.") && sr.id_rubro && parseFloat(sr.cantidad) > 0) {
            await rubrosxrolService.create({
              id_rol: editingRol.id_rol,
              id_rubros: parseInt(sr.id_rubro),
              dxe_cantidad: parseFloat(sr.cantidad),
              dxe_estado: 'ACT'
            }).catch(e => console.error(e))
          }
        }
        setRoles(prev => prev.map(r => r.id_rol === editingRol.id_rol ? { ...r, ...data } : r))
        toast.success("Rol de pago actualizado")
      } else {
        const nuevoRol = await rolPagoService.create(data)
        for (const sr of selectedRubros) {
          if (sr.id_rubro && parseFloat(sr.cantidad) > 0) {
            await rubrosxrolService.create({
              id_rol: nuevoRol.id_rol!,
              id_rubros: parseInt(sr.id_rubro),
              dxe_cantidad: parseFloat(sr.cantidad),
              dxe_estado: 'ACT'
            })
          }
        }
        setRoles(prev => [nuevoRol, ...prev])
        toast.success("Rol de pago generado con éxito")
      }
      handleCloseModal()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleApprove = async (rol: RolPago) => {
    if (!rol.id_rol) return
    if (!confirm(`¿Seguro que deseas Aprobar y Marcar como Pagado este rol?`)) return
    
    try {
      await rolPagoService.update(rol.id_rol, { ...rol, rol_estado: 'PAG' })
      setRoles(prev => prev.map(r => r.id_rol === rol.id_rol ? { ...r, rol_estado: 'PAG' } : r))
      toast.success("Rol aprobado (Pagado)")
    } catch (err: any) {
      toast.error("Error al aprobar")
    }
  }

  const handleDelete = async (rol: RolPago) => {
    if (!rol.id_rol) return
    if (!confirm(`¿Seguro que deseas Anular este rol de pago?`)) return

    try {
      // Usamos update en lugar de delete para evadir un error de backend en producción (Render) 
      // donde DELETE intentaba setear 'Anulado' excediendo el límite de 3 caracteres.
      await rolPagoService.update(rol.id_rol, { ...rol, rol_estado: 'ANU' })
      setRoles(prev => prev.map(r => r.id_rol === rol.id_rol ? { ...r, rol_estado: 'ANU' } : r))
      toast.success("Rol de pago anulado")
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
                      <TableCell className="font-medium text-blue-600">{getEmpleadoName(rol.id_empleado, rol)}</TableCell>
                      <TableCell className="text-center">{rol.rol_dias_trabajados}</TableCell>
                      <TableCell className="text-right text-emerald-600">+${Number(rol.rol_bontotal).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sky-600">+${Number(rol.rol_comtotal).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-500">-${Number(rol.rol_destotal).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">${Number(rol.rol_neto).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          rol.rol_estado === 'PAG' || rol.rol_estado === 'Pagado'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                            : rol.rol_estado === 'ANU' || rol.rol_estado === 'Anulado'
                            ? 'bg-red-50 text-red-700 ring-red-600/20'
                            : 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                        }`}>
                          {getEstadoLabel(rol.rol_estado)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {(canApprove && (rol.rol_estado === 'GEN' || rol.rol_estado === 'Generado' || rol.rol_estado === 'PEN' || rol.rol_estado === 'Pendiente')) && (
                          <Button variant="ghost" size="icon" title="Aprobar (Marcar Pagado)" onClick={() => handleApprove(rol)}>
                            <CheckCircle size={18} className="text-emerald-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => handleOpenModal(rol)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        {(canApprove && rol.rol_estado !== 'ANU' && rol.rol_estado !== 'Anulado') && (
                          <Button variant="ghost" size="icon" title="Anular" onClick={() => handleDelete(rol)}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        )}
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle>{editingRol ? "Editar Rol de Pago" : "Generar Nuevo Rol de Pago"}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Periodo: <span className="font-semibold text-indigo-600">
              {editingRol 
                ? `${editingRol.id_rolpago2}` 
                : `Junio 2026 (${PERIODO_ACTUAL_ID})`
              }
            </span> &nbsp;|&nbsp; Nómina obligatoria del mes en curso
          </p>
        </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="rol_dias_trabajados">Días Trabajados *</Label>
                <Input type="number" id="rol_dias_trabajados" value={formData.rol_dias_trabajados} onChange={handleInputChange} />
              </div>
            </div>

            {/* Cabecera-Detalle de Rubros */}
            <div className="mt-4 border rounded-md p-4 bg-slate-50">
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base font-semibold">Detalle de Rubros (Bonos / Descuentos)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addRubroLine} className="gap-1 h-8">
                  <Plus size={14} /> Añadir Rubro
                </Button>
              </div>
              
              {selectedRubros.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No se han añadido rubros adicionales.</p>
              ) : (
                <div className="grid gap-3">
                  {selectedRubros.map((sr, index) => (
                    <div key={sr.id} className="flex items-center gap-3 bg-white p-2 border rounded-sm">
                      <select 
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={sr.id_rubro}
                        onChange={(e) => updateRubroLine(sr.id, 'id_rubro', e.target.value)}
                      >
                        <option value="">Seleccione un rubro...</option>
                        {rubros.map(r => (
                          <option key={r.id_rubros} value={r.id_rubros}>
                            {r.rub_descripcion} ({r.rub_tipo === true || String(r.rub_tipo).toLowerCase() === 'ingreso' || String(r.rub_tipo) === '1' ? 'Ingreso' : 'Descuento'})
                          </option>
                        ))}
                      </select>
                      <div className="w-32 flex items-center relative">
                        <span className="absolute left-3 text-muted-foreground text-sm">$</span>
                        <Input 
                          type="number" 
                          className="h-9 pl-7" 
                          placeholder="Monto"
                          value={sr.cantidad}
                          onChange={(e) => updateRubroLine(sr.id, 'cantidad', e.target.value)}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRubroLine(sr.id)} className="h-9 w-9">
                        <X size={16} className="text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div className="grid gap-2">
                <Label className="text-emerald-600">Total Bonos ($)</Label>
                <Input value={formData.rol_bontotal} disabled className="bg-emerald-50 border-emerald-200 text-emerald-700 font-medium" />
              </div>
              <div className="grid gap-2">
                <Label className="text-sky-600">Total Comisiones ($)</Label>
                <Input value={formData.rol_comtotal} disabled className="bg-sky-50 border-sky-200 text-sky-700 font-medium" />
              </div>
              <div className="grid gap-2">
                <Label className="text-red-500">Total Descuentos ($)</Label>
                <Input value={formData.rol_destotal} disabled className="bg-red-50 border-red-200 text-red-700 font-medium" />
              </div>
            </div>

            <div className="grid gap-2 border-t pt-4 bg-muted p-3 rounded-md">
              <Label htmlFor="rol_neto" className="text-lg">Neto a Pagar ($)</Label>
              <Input type="number" step="0.01" id="rol_neto" value={formData.rol_neto} disabled className="text-2xl font-bold border-0 bg-transparent px-0 focus-visible:ring-0 text-indigo-700" />
              <p className="text-xs text-muted-foreground">* Sueldo base calculado en base a días trabajados ($16.66 / día aprox) + Rubros</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Guardar y Generar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
