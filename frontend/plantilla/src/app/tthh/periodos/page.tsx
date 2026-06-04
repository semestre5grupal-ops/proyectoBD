"use client"

import { useState, useEffect, useMemo } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { periodoService, type Periodo } from "@/services/periodoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/usePermissions"

export default function PeriodosPage() {
  const { canManagePeriods } = usePermissions()
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado del modal de Año
  const [isYearModalOpen, setIsYearModalOpen] = useState(false)
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear())
  const [isGenerating, setIsGenerating] = useState(false)

  // Estado para acordeón de años
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await periodoService.getAll(1, 1000)
      if (Array.isArray(res)) {
        setPeriodos(res.filter((p: Periodo) => p.per_estado !== 'INC'))
      } else {
        setPeriodos(Array.isArray(res.data) ? res.data.filter((p: Periodo) => p.per_estado !== 'INC') : [])
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  // Agrupar períodos por año basado en la fecha de inicio
  const periodosByYear = useMemo(() => {
    const grouped: Record<string, Periodo[]> = {}
    periodos.forEach(p => {
      const year = p.per_fechainicio.split('-')[0]
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(p)
    })

    // Ordenar los años de mayor a menor y los meses de enero a diciembre
    const sortedGrouped: Record<string, Periodo[]> = {}
    Object.keys(grouped).sort((a, b) => Number(b) - Number(a)).forEach(year => {
      sortedGrouped[year] = grouped[year].sort((a, b) => 
        new Date(a.per_fechainicio).getTime() - new Date(b.per_fechainicio).getTime()
      )
    })

    return sortedGrouped
  }, [periodos])

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }))
  }

  const handleGenerateYear = async () => {
    if (!targetYear || targetYear < 2000 || targetYear > 2100) {
      alert("Por favor ingresa un año válido (ej. 2024)")
      return
    }

    if (periodosByYear[targetYear.toString()]) {
      alert("Este año ya tiene períodos generados.")
      return
    }

    try {
      setIsGenerating(true)
      await periodoService.createYearPeriods(targetYear)
      setIsYearModalOpen(false)
      // Expandir automáticamente el año recién creado
      setExpandedYears(prev => ({ ...prev, [targetYear.toString()]: true }))
      fetchData()
    } catch (err: any) {
      console.error(err)
      alert("Ocurrió un error al generar los períodos: " + (err.message || ""))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCerrarPeriodo = async (per: Periodo) => {
    if (!per.id_rolpago2) return
    if (!confirm(`¿Seguro que deseas cerrar el período "${per.per_descripcion}"? Esta acción no se puede deshacer fácilmente.`)) return

    try {
      await periodoService.update(per.id_rolpago2, { ...per, per_estado: "CER" })
      setPeriodos(prev => prev.map(p =>
        p.id_rolpago2 === per.id_rolpago2 ? { ...p, per_estado: 'CER' } : p
      ))
      toast.success(`Periodo "${per.per_descripcion}" cerrado`)
    } catch (err: any) {
      console.error(err)
      alert("Ocurrió un error al cerrar el período: " + (err.message || ""))
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es })
    } catch {
      return dateString
    }
  }

  return (
    <BaseLayout 
      title="Gestión de Períodos" 
      description="Administración anual de los períodos de nómina."
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6 mt-6">
        
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Periodos</h2>
          </div>
          {canManagePeriods && (
            <Button onClick={() => setIsYearModalOpen(true)} className="gap-2">
              Generar Periodos del Año
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Cargando períodos...</div>
        ) : error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-md">{error}</div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.keys(periodosByYear).length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm border text-center text-muted-foreground">
                No hay períodos generados aún. Haz clic en "Generar Nuevo Año".
              </div>
            ) : (
              Object.keys(periodosByYear).map(year => (
                <div key={year} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleYear(year)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedYears[year] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <h3 className="text-lg font-bold">Año {year}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {periodosByYear[year].length} meses registrados
                    </div>
                  </div>
                  
                  {expandedYears[year] && (
                    <div className="border-t bg-slate-50/50">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">Descripción</TableHead>
                            <TableHead>Fecha Inicio</TableHead>
                            <TableHead>Fecha Fin</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {periodosByYear[year].map((per) => (
                            <TableRow key={per.id_rolpago2}>
                              <TableCell className="font-medium">{per.per_descripcion}</TableCell>
                              <TableCell>{formatDate(per.per_fechainicio)}</TableCell>
                              <TableCell>{formatDate(per.per_fechafin)}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${(per.per_estado === 'ABI' || per.per_estado === 'ABIERTO' || per.per_estado === 'ACT' || per.per_estado === 'ACTIVO') ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                                  {per.per_estado}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {(canManagePeriods && per.per_estado !== 'CER' && per.per_estado !== 'CERRADO') && (
                                  <Button variant="outline" size="sm" className="h-8 px-2 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700" onClick={() => handleCerrarPeriodo(per)}>
                                    Cerrar Período
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Modal para Generar Nuevo Año */}
      <Dialog open={isYearModalOpen} onOpenChange={setIsYearModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Períodos Anuales</DialogTitle>
            <DialogDescription>
              Esta acción generará automáticamente los 12 períodos mensuales para el año seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="year">Año a generar</Label>
              <Input 
                id="year" 
                type="number"
                value={targetYear} 
                onChange={(e) => setTargetYear(parseInt(e.target.value))} 
                placeholder="Ej. 2024"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsYearModalOpen(false)} disabled={isGenerating}>Cancelar</Button>
            <Button onClick={handleGenerateYear} disabled={isGenerating}>
              {isGenerating ? "Generando..." : "Generar 12 Meses"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseLayout>
  )
}
