"use client"

import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Search, Percent } from "lucide-react";
import type { Vendedor } from "../services/ventas-service";

interface VendedoresTabProps {
  vendedores: Vendedor[];
  onAddVendedor: (payload: Omit<Vendedor, "id_vendedor">) => Promise<boolean>;
  onEditVendedor: (id: number, payload: Partial<Vendedor>) => Promise<boolean>;
}

export function VendedoresTab({ vendedores, onAddVendedor, onEditVendedor }: VendedoresTabProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Vendedor | null>(null);

  // Form state
  const [idEmpleado, setIdEmpleado] = useState("");
  const [comision, setComision] = useState("5.0");
  const [meta, setMeta] = useState("1000");
  const [estado, setEstado] = useState("ACT");

  const reset = () => {
    setIdEmpleado(""); setComision("5.0"); setMeta("1000"); setEstado("ACT");
    setEditing(null);
  };

  const openAdd = () => { reset(); setIsOpen(true); };
  const openEdit = (v: Vendedor) => {
    setEditing(v);
    setIdEmpleado(String(v.id_empleado));
    setComision(String(v.ven_comision));
    setMeta(String(v.ven_meta));
    setEstado(v.ven_estado);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idEmpleado) return;

    const payload = {
      id_empleado: Number(idEmpleado),
      ven_comision: parseFloat(comision),
      ven_meta: parseInt(meta, 10),
      ven_estado: estado,
    };

    const ok = editing?.id_vendedor
      ? await onEditVendedor(editing.id_vendedor, payload)
      : await onAddVendedor(payload);

    if (ok) { setIsOpen(false); reset(); }
  };

  const filtered = vendedores.filter(v => {
    const q = search.toLowerCase();
    return String(v.id_vendedor).includes(q) || String(v.id_empleado).includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID vendedor o empleado..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openAdd} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" /> Agregar Vendedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendedores Registrados</CardTitle>
          <CardDescription>
            Fuerza de ventas — comisiones, metas y estado de actividad.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Vendedor</TableHead>
                <TableHead>ID Empleado</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Meta (USD)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No se encontraron vendedores.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(v => (
                  <TableRow key={v.id_vendedor}>
                    <TableCell className="font-mono text-sm font-semibold">#{v.id_vendedor}</TableCell>
                    <TableCell className="font-mono text-sm">{v.id_empleado}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{v.ven_comision}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${Number(v.ven_meta).toLocaleString("es-EC")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={v.ven_estado === "ACT"
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400"}>
                        {v.ven_estado === "ACT" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Vendedor" : "Registrar Vendedor"}</DialogTitle>
              <DialogDescription>
                Asocie un empleado del sistema a la fuerza de ventas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="empleado" className="text-right">ID Empleado *</Label>
                <Input
                  id="empleado"
                  className="col-span-3"
                  type="number"
                  min="1"
                  value={idEmpleado}
                  onChange={e => setIdEmpleado(e.target.value)}
                  required
                  placeholder="ID del empleado en talento humano"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="comision" className="text-right">Comisión % *</Label>
                <Input
                  id="comision"
                  className="col-span-3"
                  type="number"
                  step="0.1"
                  min="0"
                  max="99.9"
                  value={comision}
                  onChange={e => setComision(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="meta" className="text-right">Meta (USD) *</Label>
                <Input
                  id="meta"
                  className="col-span-3"
                  type="number"
                  min="0"
                  value={meta}
                  onChange={e => setMeta(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Estado</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACT">Activo</SelectItem>
                    <SelectItem value="INA">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
