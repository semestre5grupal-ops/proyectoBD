"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { horarioService, type Horario } from "@/services/horarioService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, Clock, Search } from "lucide-react"
import { toast } from "sonner"

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null)
  
  const [formData, setFormData] = useState({
    hor_nombre_horario: "",
    hor_horastotal: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await horarioService.getAll()
      setHorarios(Array.isArray(data) ? data.filter((h: Horario) => h.hor_estado !== 'INC') : [])
      setCurrentPage(1)
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const filteredHorarios = horarios.filter(hor => 
    hor.hor_nombre_horario.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredHorarios.length / ITEMS_PER_PAGE)
  const currentHorarios = filteredHorarios.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleOpenModal = (hor?: Horario) => {
    if (hor) {
      setEditingHorario(hor)
      setFormData({
        hor_nombre_horario: hor.hor_nombre_horario,
        hor_horastotal: String(hor.hor_horastotal)
      })
    } else {
      setEditingHorario(null)
      setFormData({
        hor_nombre_horario: "",
        hor_horastotal: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingHorario(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (!formData.hor_nombre_horario || !formData.hor_horastotal) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    try {
      const data: Horario = {
        ...(editingHorario || {}),
        hor_nombre_horario: formData.hor_nombre_horario,
        hor_horastotal: parseFloat(formData.hor_horastotal),
        hor_tipo: formData.hor_tipo,
        hor_estado: editingHorario ? editingHorario.hor_estado : "ACT"
      }

      if (editingHorario && editingHorario.id_horario) {
        await horarioService.update(editingHorario.id_horario, data)
        toast.success("Horario actualizado exitosamente")
      } else {
        await horarioService.create(data)
        toast.success("Horario creado exitosamente")
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (hor: Horario) => {
    if (!hor.id_horario) return
    if (!confirm(`¿Seguro que deseas eliminar el horario "${hor.hor_nombre_horario}"?`)) return

    try {
      await horarioService.delete(hor.id_horario)
      toast.success("Horario eliminado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al eliminar"))
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Horarios" 
      description="Administración de los turnos y horas de trabajo."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Clock className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Horarios / Turnos</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus size={16} /> Nuevo Horario
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar horario..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando horarios...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Horario</TableHead>
                  <TableHead>Horas Totales</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentHorarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No hay horarios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentHorarios.map((hor) => (
                    <TableRow key={hor.id_horario}>
                      <TableCell className="font-medium">{hor.hor_nombre_horario}</TableCell>
                      <TableCell>{hor.hor_horastotal} hrs</TableCell>
                      <TableCell>{hor.hor_tipo}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(hor)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(hor)}>
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
            <DialogTitle>{editingHorario ? "Editar Horario" : "Nuevo Horario"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="hor_nombre_horario">Nombre del Horario *</Label>
              <Input id="hor_nombre_horario" value={formData.hor_nombre_horario} onChange={handleInputChange} placeholder="Ej: Turno Matutino" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="hor_horastotal">Horas Totales *</Label>
              <Input type="number" step="0.5" id="hor_horastotal" value={formData.hor_horastotal} onChange={handleInputChange} placeholder="Ej: 8" />
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
