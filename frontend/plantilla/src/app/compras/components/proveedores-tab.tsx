import { useState } from "react";
import type { Proveedor, Ciudad } from "../services/compras-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Search } from "lucide-react";

interface ProveedoresTabProps {
  suppliers: Proveedor[];
  cities: Ciudad[];
  onAddSupplier: (supplier: Proveedor) => Promise<boolean>;
  onEditSupplier: (id: number, supplier: Partial<Proveedor>) => Promise<boolean>;
}

export function ProveedoresTab({
  suppliers,
  cities,
  onAddSupplier,
  onEditSupplier
}: ProveedoresTabProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Proveedor | null>(null);

  // Form states
  const [nombre, setNombre] = useState("");
  const [ciruc, setCiruc] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mail, setMail] = useState("");
  const [celular, setCelular] = useState("");
  const [direccion, setDireccion] = useState("");
  const [estado, setEstado] = useState("ACT");
  const [ciudadId, setCiudadId] = useState("");

  const resetForm = () => {
    setNombre("");
    setCiruc("");
    setTelefono("");
    setMail("");
    setCelular("");
    setDireccion("");
    setEstado("ACT");
    setCiudadId("");
    setEditingSupplier(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (supplier: Proveedor) => {
    setEditingSupplier(supplier);
    setNombre(supplier.prv_nombre);
    setCiruc(supplier.prv_ciruc);
    setTelefono(supplier.prv_telefono || "");
    setMail(supplier.prv_mail || "");
    setCelular(supplier.prv_celular || "");
    setDireccion(supplier.prv_direccion || "");
    setEstado(supplier.prv_estado);
    setCiudadId(supplier.id_ciudad.toString());
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !ciruc || !ciudadId) return;

    const payload: Proveedor = {
      prv_nombre: nombre,
      prv_ciruc: ciruc,
      prv_telefono: telefono,
      prv_mail: mail,
      prv_celular: celular,
      prv_direccion: direccion,
      prv_estado: estado,
      id_ciudad: Number(ciudadId)
    };

    let success = false;
    if (editingSupplier && editingSupplier.id_proveedor) {
      success = await onEditSupplier(editingSupplier.id_proveedor, payload);
    } else {
      success = await onAddSupplier(payload);
    }

    if (success) {
      setIsOpen(false);
      resetForm();
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.prv_nombre.toLowerCase().includes(search.toLowerCase()) ||
    s.prv_ciruc.includes(search) ||
    s.prv_mail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, RUC o email..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" /> Agregar Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proveedores Registrados</CardTitle>
          <CardDescription>
            Lista de todos los proveedores activos e inactivos en el sistema de compras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CI / RUC</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron proveedores.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => {
                    const cityName = cities.find(c => c.id_ciudad === supplier.id_ciudad)?.ciu_nombre || `Ciudad ID: ${supplier.id_ciudad}`;
                    return (
                      <TableRow key={supplier.id_proveedor}>
                        <TableCell className="font-semibold">{supplier.prv_nombre}</TableCell>
                        <TableCell>{supplier.prv_ciruc}</TableCell>
                        <TableCell>{cityName}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {supplier.prv_celular && <div>Cel: {supplier.prv_celular}</div>}
                            {supplier.prv_telefono && <div>Telf: {supplier.prv_telefono}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{supplier.prv_mail}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={supplier.prv_estado === "ACT" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30" : "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400 dark:border-zinc-800/30"}
                          >
                            {supplier.prv_estado === "ACT" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(supplier)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
              </DialogTitle>
              <DialogDescription>
                Complete los datos obligatorios del proveedor.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">Nombre *</Label>
                <Input
                  id="nombre"
                  className="col-span-3"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ciruc" className="text-right">RUC / C.I. *</Label>
                <Input
                  id="ciruc"
                  className="col-span-3"
                  value={ciruc}
                  onChange={(e) => setCiruc(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ciudad" className="text-right">Ciudad *</Label>
                <Select value={ciudadId} onValueChange={setCiudadId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id_ciudad} value={city.id_ciudad?.toString() || ""}>
                        {city.ciu_nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mail" className="text-right">Email</Label>
                <Input
                  id="mail"
                  type="email"
                  className="col-span-3"
                  value={mail}
                  onChange={(e) => setMail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telefono" className="text-right">Teléfono</Label>
                <Input
                  id="telefono"
                  className="col-span-3"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="celular" className="text-right">Celular</Label>
                <Input
                  id="celular"
                  className="col-span-3"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="direccion" className="text-right">Dirección</Label>
                <Input
                  id="direccion"
                  className="col-span-3"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estado" className="text-right">Estado</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACT">Activo</SelectItem>
                    <SelectItem value="INA">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSupplier ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
