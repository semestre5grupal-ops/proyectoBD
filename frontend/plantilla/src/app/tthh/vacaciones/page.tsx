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
        empleadoService.getEmpleados()
      ])
      
      setVacaciones(Array.isArray(vacData) ? vacData.filter((v: Vacacion) => v.vac_estado !== 'INC') : [])
      setContratos(Array.isArray(conData) ? conData : [])
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

  const getEmpleadoFromContrato = (id_contrato: number) => {
    const con = contratos.find(c => c.id_contrato === id_contrato)
    if (!con) return "Contrato Desconocido"
    const emp = empleados.find(e => e.id_empleado === con.id_empleado)
    return emp ? `${emp.emp_nom1} ${emp.emp_ap1}` : "Empleado Desconocido"
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
      const next = { ...prev, [id]: value }
      // Auto-calcular saldo: dias ganados - dias perdidos/gozados
      if (id === 'vac_diasg' || id === 'vac_diasp') {
        const ganados = parseInt(id === 'vac_diasg' ? value : next.vac_diasg) || 0
        const perdidos = parseInt(id === 'vac_diasp' ? value : next.vac_diasp) || 0
        next.vac_saldo = String(ganados - perdidos)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!formData.id_contrato || !formData.vac_periodo) {
      toast.error("Por favor selecciona el contrato y el periodo")
      return
    }

    try {
      const data: Vacacion = {
        ...(editingVac || {}),
        id_contrato: parseInt(formData.id_contrato),
        vac_estado: editingVac ? editingVac.vac_estado : "Programada",
        vac_periodo: formData.vac_periodo,
        vac_diasg: parseInt(formData.vac_diasg) || 0,
        vac_diasp: parseInt(formData.vac_diasp) || 0,
        vac_saldo: parseInt(formData.vac_saldo) || 0,
        vac_fechafin: formData.vac_fechafin
      }

      if (editingVac && editingVac.id_vacacion) {
        await vacacionService.update(editingVac.id_vacacion, data)
        setVacaciones(prev => prev.map(v => v.id_vacacion === editingVac.id_vacacion ? { ...v, ...data } : v))
        toast.success("Saldo de vacaciones actualizado")
      } else {
        const created = await vacacionService.create(data)
        setVacaciones(prev => [created, ...prev])
        toast.success("Saldo de vacaciones registrado")
      }
      handleCloseModal()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (vac: Vacacion) => {
    if (!vac.id_vacacion) return
    if (!confirm(`¿Seguro que deseas eliminar el registro de vacaciones de este periodo?`)) return

    try {
      await vacacionService.delete(vac.id_vacacion)
      setVacaciones(prev => prev.filter(v => v.id_vacacion !== vac.id_vacacion))
      toast.success("Registro eliminado")
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  return (
    <BaseLayout 
      title="Saldos de Vacaciones" 
      description="Control de días ganados, gozados y saldos de vacaciones por contrato."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Plane className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Vacaciones</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2 bg-sky-600 hover:bg-sky-700">
            <Plus size={16} /> Asignar Saldo
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por empleado o periodo..." 
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
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-center">Días Ganados</TableHead>
                  <TableHead className="text-center">Días Gozados</TableHead>
                  <TableHead className="text-center">Saldo Disponible</TableHead>
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
                    <TableRow key={vac.id_vacacion}>
                      <TableCell className="font-medium text-blue-600">{getEmpleadoFromContrato(vac.id_contrato)}</TableCell>
                      <TableCell>{vac.vac_periodo}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">+{vac.vac_diasg}</TableCell>
                      <TableCell className="text-center text-red-500 font-medium">-{vac.vac_diasp}</TableCell>
                      <TableCell className="text-center font-bold">{vac.vac_saldo}</TableCell>
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
            <DialogTitle>{editingVac ? "Editar Saldo" : "Asignar Saldo de Vacaciones"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id_contrato">Contrato del Empleado *</Label>
              <select 
                id="id_contrato" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.id_contrato}
                onChange={handleInputChange as any}
                disabled={!!editingVac}
              >
                <option value="">Seleccione un contrato...</option>
                {contratos.map(con => (
                  <option key={con.id_contrato} value={con.id_contrato}>
                    {getEmpleadoFromContrato(con.id_contrato)} (Contrato #{con.id_contrato})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="vac_periodo">Periodo *</Label>
              <Input id="vac_periodo" value={formData.vac_periodo} onChange={handleInputChange} placeholder="Ej: 2023-2024" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vac_diasg" className="text-emerald-600">Días Ganados</Label>
                <Input type="number" id="vac_diasg" value={formData.vac_diasg} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vac_diasp" className="text-red-500">Días Gozados</Label>
                <Input type="number" id="vac_diasp" value={formData.vac_diasp} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vac_saldo">Saldo</Label>
                <Input type="number" id="vac_saldo" value={formData.vac_saldo} disabled className="bg-muted font-bold" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
