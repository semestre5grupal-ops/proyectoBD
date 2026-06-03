"use client"

import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { rubroService, type Rubro } from "@/services/rubroService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, Plus, Receipt, Search } from "lucide-react"
import { toast } from "sonner"

export default function RubrosPage() {
  const [rubros, setRubros] = useState<Rubro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRubro, setEditingRubro] = useState<Rubro | null>(null)
  
  const [formData, setFormData] = useState({
    rub_descripcion: "",
    rub_estado: "ACT",
    rub_tipo: "Ingreso",
    rub_calculable: "No"
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await rubroService.getAll()
      setRubros(Array.isArray(data) ? data.filter((r: Rubro) => r.rub_estado !== 'INC') : [])
      setCurrentPage(1)
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const filteredRubros = rubros.filter(rub => 
    rub.rub_descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rub.rub_tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredRubros.length / ITEMS_PER_PAGE)
  const currentRubros = filteredRubros.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handlePreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))

  const handleOpenModal = (rub?: Rubro) => {
    if (rub) {
      setEditingRubro(rub)
      setFormData({
        rub_descripcion: rub.rub_descripcion,
        rub_estado: rub.rub_estado,
        // Map boolean to select value string
        rub_tipo: (rub.rub_tipo === true || String(rub.rub_tipo).toLowerCase() === 'ingreso' || String(rub.rub_tipo) === '1') ? "Ingreso" : "Descuento",
        rub_escalculable: Boolean(rub.rub_escalculable)
      })
    } else {
      setEditingRubro(null)
      setFormData({
        rub_descripcion: "",
        rub_estado: "ACT",
        rub_tipo: "Ingreso",
        rub_escalculable: false
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRubro(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSave = async () => {
    if (!formData.rub_descripcion || !formData.rub_tipo) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    try {
      const dataToSave = {
        ...formData,
        // Ensure rub_tipo is sent as boolean to the backend
        rub_tipo: formData.rub_tipo === "Ingreso" || formData.rub_tipo === true || String(formData.rub_tipo) === "1" ? true : false,
        rub_escalculable: Boolean(formData.rub_escalculable)
      }

      if (editingRubro) {
        await rubroService.update(editingRubro.id_rubros, dataToSave as Rubro)
        toast.success("Rubro actualizado exitosamente")
      } else {
        await rubroService.create(dataToSave as Rubro)
        toast.success("Rubro creado exitosamente")
      }
      handleCloseModal()
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al guardar"))
    }
  }

  const handleDelete = async (rub: Rubro) => {
    if (!rub.id_rubros) return
    if (!confirm(`¿Seguro que deseas inactivar el rubro "${rub.rub_descripcion}"?`)) return

    try {
      await rubroService.update(rub.id_rubros, {
        ...rub,
        rub_estado: "INC"
      })
      toast.success("Rubro inactivado")
      fetchData()
    } catch (err: any) {
      console.error(err)
      toast.error("Error: " + (err.message || "Ocurrió un error al inactivar"))
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Rubros" 
      description="Ingresos y descuentos aplicables en la nómina."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Receipt className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Catálogo de Rubros</h2>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus size={16} /> Nuevo Rubro
          </Button>
        </div>

        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border w-full max-w-md">
          <Search className="text-muted-foreground ml-2 mr-2 w-5 h-5" />
          <Input 
            placeholder="Buscar por descripción o tipo..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando rubros...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Calculable</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRubros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No hay rubros registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentRubros.map((rub) => {
                    const isIngreso = rub.rub_tipo === true || String(rub.rub_tipo).toLowerCase() === 'ingreso' || String(rub.rub_tipo) === '1';
                    return (
                    <TableRow key={rub.id_rubros}>
                      <TableCell className="font-medium">{rub.rub_descripcion}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          isIngreso
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                            : 'bg-red-50 text-red-700 ring-red-600/20'
                        }`}>
                          {isIngreso ? 'Ingreso' : 'Descuento'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${rub.rub_escalculable ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/10'}`}>
                          {rub.rub_escalculable ? 'Sí' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(rub)}>
                          <Edit2 size={16} className="text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rub)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            
            {filteredRubros.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando del {(currentPage - 1) * ITEMS_PER_PAGE + 1} al {Math.min(currentPage * ITEMS_PER_PAGE, filteredRubros.length)} de {filteredRubros.length} rubros
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRubro ? "Editar Rubro" : "Nuevo Rubro"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rub_descripcion">Descripción *</Label>
              <Input id="rub_descripcion" value={formData.rub_descripcion} onChange={handleInputChange} placeholder="Ej: Horas Extra, IESS" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rub_tipo">Tipo *</Label>
                <select 
                  id="rub_tipo" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.rub_tipo}
                  onChange={handleInputChange as any}
                >
                  <option value="Ingreso">Ingreso</option>
                  <option value="Descuento">Descuento</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rub_escalculable">¿Es Calculable?</Label>
                <select 
                  id="rub_escalculable" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.rub_escalculable ? "true" : "false"}
                  onChange={(e) => setFormData(prev => ({ ...prev, rub_escalculable: e.target.value === "true" }))}
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
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
