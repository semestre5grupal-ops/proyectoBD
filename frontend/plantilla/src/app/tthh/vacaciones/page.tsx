"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { vacacionService, type Vacacion } from "@/services/vacacionService"
import { contratoService, type Contrato } from "@/services/contratoService"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, Plane, Search } from "lucide-react"
import { toast } from "sonner"

export default function VacacionesPage() {
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVac, setEditingVac] = useState<Vacacion | null>(null)
  
  const [formData, setFormData] = useState({
    id_contrato: "",
    vac_periodo: new Date().getFullYear().toString(),
    vac_diasg: "15",
    vac_diasp: "0",
    vac_saldo: "15"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [vacData, conData, empData] = await Promise.all([
        vacacionService.getAll(),
        contratoService.getAll(),
        empleadoService.getEmpleados(1, 1000)
      ])
      
      setVacaciones(Array.isArray(vacData) ? vacData.filter((v: Vacacion) => v.vac_estado !== 'INC') : [])
      setContratos(Array.isArray(conData) ? conData : [])
      if (empData && Array.isArray(empData.data)) {
        setEmpleados(empData.data)
      } else if (Array.isArray(empData)) {
        setEmpleados(empData)
      }
      setCurrentPage(1)
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const getEmpleadoFromContrato = (id_contrato: number) => {
    const con = contratos.find(c => c.id_contrato === id_contrato)
    if (!con) return "Contrato Desconocido"
    const emp = empleados.find(e => e.id_empleado === con.id_empleado)
    return emp ? `${emp.emp_nom1} ${emp.emp_ap1}` : `Empleado #${con.id_empleado}`
  }

  const filteredVacaciones = vacaciones.filter(vac => {
    const term = searchTerm.toLowerCase()
    const empName = getEmpleadoFromContrato(vac.id_contrato).toLowerCase()
    return (
      empName.includes(term) ||
      vac.vac_periodo.includes(term)
    )
  })

  const totalPages = Math.ceil(filteredVacaciones.length / ITEMS_PER_PAGE)
  const currentVacaciones = filteredVacaciones.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenModal = (vac?: Vacacion) => {
    if (vac) {
      setEditingVac(vac)
      setFormData({
        id_contrato: String(vac.id_contrato),
        vac_periodo: vac.vac_periodo,
        vac_diasg: String(vac.vac_diasg),
        vac_diasp: String(vac.vac_diasp),
        vac_saldo: String(vac.vac_saldo)
      })
    } else {
      setEditingVac(null)
      setFormData({
        id_contrato: "",
        vac_periodo: new Date().getFullYear().toString(),
        vac_diasg: "15",
        vac_diasp: "0",
        vac_saldo: "15"
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingVac(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [id]: value }
      if (id === 'vac_diasg' || id === 'vac_diasp') {
        const dg = parseFloat(updated.vac_diasg) || 0
        const dp = parseFloat(updated.vac_diasp) || 0
        updated.vac_saldo = String(dg - dp)
      }
      return updated
    })
  }

  const handleSave = async () => {
    if (!formData.id_contrato || !formData.vac_periodo || !formData.vac_diasg || !formData.vac_saldo) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    try {
      const data: any = {
        ...(editingVac || {}),
        id_contrato: parseInt(formData.id_contrato),
        vac_periodo: formData.vac_periodo,
        vac_diasg: parseFloat(formData.vac_diasg),
        vac_diasp: parseFloat(formData.vac_diasp),
        vac_saldo: parseFloat(formData.vac_saldo),
        vac_estado: editingVac ? editingVac.vac_estado : "ACT"
      }

      if (editingVac && editingVac.id_vacaciones) {
        await vacacionService.update(editingVac.id_vacaciones, data)
        setVacaciones(prev => prev.map(v => v.id_vacaciones === editingVac.id_vacaciones ? { ...v, ...data } : v))
        toast.success("Registro de vacaciones actualizado exitosamente")
      } else {
        const created = await vacacionService.create(data)
        setVacaciones(prev => [created, ...prev])
        toast.success("Registro de vacaciones creado exitosamente")
      }
      handleCloseModal()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (vac: Vacacion) => {
    if (!vac.id_vacaciones) return
    if (!confirm(`¿Seguro que deseas eliminar este registro de vacaciones?`)) return

    try {
      await vacacionService.delete(vac.id_vacaciones)
      setVacaciones(prev => prev.filter(v => v.id_vacaciones !== vac.id_vacaciones))
      toast.success("Registro de vacaciones eliminado")
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Vacaciones" 
      description="Control del saldo de días de vacaciones de los empleados."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Plane className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Vacaciones</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Registro
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por empleado o período..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando vacaciones...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Período (Año)</TableHead>
                  <TableHead>Días Ganados</TableHead>
                  <TableHead>Días Tomados</TableHead>
                  <TableHead>Saldo de Días</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentVacaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      No hay registros de vacaciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentVacaciones.map((vac) => (
                    <TableRow key={vac.id_vacaciones}>
                      <TableCell className="font-medium">{getEmpleadoFromContrato(vac.id_contrato)}</TableCell>
                      <TableCell>{vac.vac_periodo}</TableCell>
                      <TableCell>{vac.vac_diasg}</TableCell>
                      <TableCell>{vac.vac_diasp}</TableCell>
                      <TableCell className="font-semibold">{vac.vac_saldo}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(vac)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vac)}>
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
            <DialogTitle>{editingVac ? "Editar Registro" : "Nuevo Registro de Vacaciones"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid gap-2">
              <Label htmlFor="id_contrato">Contrato (Empleado) *</Label>
              <select 
                id="id_contrato" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.id_contrato}
                onChange={handleInputChange as any}
              >
                <option value="">Seleccione...</option>
                {contratos.map(con => (
                  <option key={con.id_contrato} value={con.id_contrato}>
                    {getEmpleadoFromContrato(con.id_contrato)} (Cargo: {con.id_cargo})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vac_periodo">Período (Año) *</Label>
              <Input id="vac_periodo" type="number" min="2000" max="2100" value={formData.vac_periodo} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="vac_diasg">Días Ganados *</Label>
                <Input id="vac_diasg" type="number" value={formData.vac_diasg} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vac_diasp">Días Tomados *</Label>
                <Input id="vac_diasp" type="number" value={formData.vac_diasp} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vac_saldo">Saldo Restante</Label>
                <Input id="vac_saldo" type="number" value={formData.vac_saldo} disabled />
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
