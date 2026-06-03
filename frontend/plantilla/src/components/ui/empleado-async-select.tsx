import { useState, useEffect, useRef } from "react"
import { empleadoService, type Empleado } from "@/services/empleadoService"
import { Search, Loader2 } from "lucide-react"

interface EmpleadoAsyncSelectProps {
  value: string; // The id_empleado
  onChange: (id: string, empleado: Empleado | null) => void;
  error?: boolean;
}

export function EmpleadoAsyncSelect({ value, onChange, error }: EmpleadoAsyncSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [options, setOptions] = useState<Empleado[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<Empleado | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Initialize selected item if value exists but we don't have the object yet
  // In a real app, you might want to fetch the specific employee by ID here
  // For now, the parent should preferably handle displaying the selected name 
  // or we just show the search box.

  useEffect(() => {
    // Close dropdown if clicked outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchOptions = async () => {
      if (!searchTerm.trim() && !isOpen) return;
      
      try {
        setIsLoading(true)
        // Fetch up to 10 employees matching the search term
        const res = await empleadoService.getEmpleados(1, 10, searchTerm)
        setOptions(res.data || [])
      } catch (err) {
        console.error("Error fetching employees", err)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchOptions()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, isOpen])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`flex items-center border rounded-md px-3 py-2 bg-background cursor-text ${error ? 'border-red-500 ring-red-500' : 'border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'}`}
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
        <input
          type="text"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          placeholder={selectedEmp ? `${selectedEmp.emp_nom1} ${selectedEmp.emp_ap1}` : "Buscar empleado por nombre o cédula..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
            if (selectedEmp) {
              setSelectedEmp(null)
              onChange("", null)
            }
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2 shrink-0" />}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-md max-h-60 overflow-auto">
          {options.length === 0 && !isLoading ? (
            <div className="p-4 text-sm text-center text-muted-foreground">
              No se encontraron empleados.
            </div>
          ) : (
            options.map((emp) => (
              <div
                key={emp.id_empleado}
                className="px-4 py-2 cursor-pointer hover:bg-slate-100 text-sm flex flex-col"
                onClick={() => {
                  setSelectedEmp(emp)
                  setSearchTerm("") // Clear search term after selection, we'll show name in placeholder or separate state
                  setIsOpen(false)
                  onChange(emp.id_empleado ? String(emp.id_empleado) : "", emp)
                }}
              >
                <span className="font-medium">{emp.emp_nom1} {emp.emp_ap1} {emp.emp_ap2}</span>
                <span className="text-xs text-muted-foreground">C.I: {emp.emp_cedula}</span>
              </div>
            ))
          )}
        </div>
      )}
      
      {value && selectedEmp && (
        <div className="mt-2 flex items-center justify-between bg-slate-100 px-3 py-2 rounded-md text-sm border">
          <span>
            <strong>Seleccionado:</strong> {selectedEmp.emp_nom1} {selectedEmp.emp_ap1}
          </span>
          <button 
            type="button"
            className="text-red-500 hover:text-red-700 font-semibold text-xs"
            onClick={() => {
              setSelectedEmp(null)
              onChange("", null)
            }}
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  )
}
