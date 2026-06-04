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
import { Plus, Edit2, Search } from "lucide-react";
import type { Cliente, Ciudad } from "../services/ventas-service";

const CATEGORIA_LABELS: Record<string, string> = {
  ORO: "Oro", PLA: "Plata", BRO: "Bronce", EST: "Estándar",
};
const CATEGORIA_CLASS: Record<string, string> = {
  ORO: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400",
  PLA: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400",
  BRO: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400",
  EST: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400",
};

interface ClientesTabProps {
  clientes: Cliente[];
  ciudades: Ciudad[];
  onAddCliente: (payload: Omit<Cliente, "id_cliente">) => Promise<boolean>;
  onEditCliente: (id: number, payload: Partial<Cliente>) => Promise<boolean>;
}

export function ClientesTab({ clientes, ciudades, onAddCliente, onEditCliente }: ClientesTabProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);

  // Form state
  const [nombre, setNombre] = useState("");
  const [ciruc, setCiruc] = useState("");
  const [celular, setCelular] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [categoria, setCategoria] = useState("EST");
  const [estado, setEstado] = useState(true);
  const [ciudadId, setCiudadId] = useState("");

  const reset = () => {
    setNombre(""); setCiruc(""); setCelular(""); setTelefono("");
    setCorreo(""); setCategoria("EST"); setEstado(true); setCiudadId("");
    setEditing(null);
  };

  const openAdd = () => { reset(); setIsOpen(true); };
  const openEdit = (c: Cliente) => {
    setEditing(c);
    setNombre(c.cli_nombre);
    setCiruc(c.cli_ciruc);
    setCelular(c.cli_celular);
    setTelefono(c.cli_telefono);
    setCorreo(c.cli_correo);
    setCategoria(c.cli_categoria);
    setEstado(c.cli_estado);
    setCiudadId(String(c.id_ciudad));
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !ciruc || !ciudadId) return;

    const payload = {
      id_ciudad: Number(ciudadId),
      cli_nombre: nombre,
      cli_ciruc: ciruc,
      cli_celular: celular,
      cli_telefono: telefono,
      cli_correo: correo,
      cli_categoria: categoria,
      cli_estado: estado,
    };

    const ok = editing?.id_cliente
      ? await onEditCliente(editing.id_cliente, payload)
      : await onAddCliente(payload);

    if (ok) { setIsOpen(false); reset(); }
  };

  const ciudadNombre = (id: number) => ciudades.find(c => c.id_ciudad === id)?.ciu_nombre?.trim() ?? `Ciudad #${id}`;

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase();
    return c.cli_nombre.toLowerCase().includes(q) || c.cli_ciruc.includes(q) || c.cli_correo.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, RUC o correo..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openAdd} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" /> Agregar Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Registrados</CardTitle>
          <CardDescription>Base de clientes del módulo de ventas.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CI / RUC</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No se encontraron clientes.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(c => (
                  <TableRow key={c.id_cliente}>
                    <TableCell className="font-semibold">{c.cli_nombre}</TableCell>
                    <TableCell className="font-mono text-xs">{c.cli_ciruc}</TableCell>
                    <TableCell>{ciudadNombre(c.id_ciudad)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.cli_correo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={CATEGORIA_CLASS[c.cli_categoria] ?? ""}>
                        {CATEGORIA_LABELS[c.cli_categoria] ?? c.cli_categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.cli_estado
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400"}>
                        {c.cli_estado ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
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
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Cliente" : "Registrar Cliente"}</DialogTitle>
              <DialogDescription>Complete los datos del cliente.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {[
                { label: "Nombre *", id: "nombre", value: nombre, set: setNombre, required: true },
                { label: "CI / RUC *", id: "ciruc", value: ciruc, set: setCiruc, required: true },
                { label: "Celular *", id: "celular", value: celular, set: setCelular, required: true },
                { label: "Teléfono", id: "telefono", value: telefono, set: setTelefono, required: false },
                { label: "Correo *", id: "correo", value: correo, set: setCorreo, required: true },
              ].map(({ label, id, value, set, required }) => (
                <div key={id} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={id} className="text-right">{label}</Label>
                  <Input
                    id={id}
                    className="col-span-3"
                    value={value}
                    onChange={e => set(e.target.value)}
                    required={required}
                  />
                </div>
              ))}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Ciudad *</Label>
                <Select value={ciudadId} onValueChange={setCiudadId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {ciudades.map(c => (
                      <SelectItem key={c.id_ciudad} value={String(c.id_ciudad)}>
                        {c.ciu_nombre.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Categoría</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORO">Oro</SelectItem>
                    <SelectItem value="PLA">Plata</SelectItem>
                    <SelectItem value="BRO">Bronce</SelectItem>
                    <SelectItem value="EST">Estándar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Estado</Label>
                <Select value={estado ? "true" : "false"} onValueChange={v => setEstado(v === "true")}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
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
