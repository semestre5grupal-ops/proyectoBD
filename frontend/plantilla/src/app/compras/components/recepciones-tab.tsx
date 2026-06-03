import { useState } from "react";
import type { Recepcion, Compra, Proveedor, Proxrec } from "../services/compras-service";
import { getRecepcionDetails } from "../services/compras-service";
import type { Bodega, Variante } from "../services/inventario-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Check, Search, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

interface RecepcionesTabProps {
  receptions: Recepcion[];
  orders: Compra[];
  suppliers: Proveedor[];
  warehouses: Bodega[];
  variants: Variante[];
  onCreateReception: (reception: Recepcion) => Promise<any>;
  onApproveReception: (id: number, details: Recepcion) => Promise<boolean>;
}

export function RecepcionesTab({
  receptions,
  orders,
  suppliers,
  warehouses,
  variants,
  onCreateReception,
  onApproveReception
}: RecepcionesTabProps) {
  const [search, setSearch] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReception, setSelectedReception] = useState<Recepcion | null>(null);

  // Form State
  const [compraId, setCompraId] = useState("");
  const [bodegaId, setBodegaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [items, setItems] = useState<Proxrec[]>([]);

  // When PO changes, populate items with PO variants
  const handleCompraChange = (id: string) => {
    setCompraId(id);
    const order = orders.find(o => o.id_compra === Number(id));
    if (order && order.items) {
      const initialItems: Proxrec[] = order.items.map(item => ({
        id_variante: item.id_variante,
        pxr_cantidad_solicitada: item.pxo_cantidad,
        pxr_qty_recibida: item.pxo_cantidad, // default to requested quantity
        pxr_diferencia: 0,
        pxr_motivo_diferencia: ""
      }));
      setItems(initialItems);
    } else {
      setItems([]);
    }
  };

  const handleQtyReceivedChange = (index: number, val: number) => {
    const nextItems = [...items];
    const item = nextItems[index];
    item.pxr_qty_recibida = Math.max(0, val);
    item.pxr_diferencia = item.pxr_cantidad_solicitada - item.pxr_qty_recibida;
    
    // Reset motivation if difference becomes zero
    if (item.pxr_diferencia === 0) {
      item.pxr_motivo_diferencia = "";
    }
    setItems(nextItems);
  };

  const handleMotivationChange = (index: number, val: string) => {
    const nextItems = [...items];
    nextItems[index].pxr_motivo_diferencia = val;
    setItems(nextItems);
  };

  const resetForm = () => {
    setCompraId("");
    setBodegaId("");
    setDescripcion("");
    setItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compraId || !bodegaId || !descripcion || items.length === 0) {
      toast.error("Por favor rellene todos los campos obligatorios");
      return;
    }

    // Validate motivation for items with difference
    const missingMotivation = items.some(
      item => item.pxr_diferencia !== 0 && !item.pxr_motivo_diferencia?.trim()
    );

    if (missingMotivation) {
      toast.error("Debe ingresar un motivo para los productos con diferencia de entrega");
      return;
    }

    const payload: Recepcion = {
      id_compra: Number(compraId),
      id_bodega: Number(bodegaId),
      rec_descripcion: descripcion,
      usu_responsable: "admin", // Administrator context
      items: items.map(item => ({
        ...item,
        pxr_motivo_diferencia: item.pxr_diferencia !== 0 ? item.pxr_motivo_diferencia : null
      }))
    };

    const created = await onCreateReception(payload);
    if (created) {
      setIsRegisterOpen(false);
      resetForm();
    }
  };

  const handleOpenDetail = async (reception: Recepcion) => {
    if (reception.id_recepcion) {
      try {
        const fullReception = await getRecepcionDetails(reception.id_recepcion);
        setSelectedReception(fullReception);
      } catch (e: any) {
        console.error("Error loading reception details", e);
        toast.error("No se pudo cargar el detalle de la recepción");
        setSelectedReception(reception);
      }
    } else {
      setSelectedReception(reception);
    }
    setIsDetailOpen(true);
  };

  const handleApprove = async (reception: Recepcion) => {
    if (!reception.id_recepcion) return;
    await onApproveReception(reception.id_recepcion, reception);
  };

  const filteredReceptions = receptions.filter(r => {
    const order = orders.find(o => o.id_compra === r.id_compra);
    const supplier = order ? suppliers.find(s => s.id_proveedor === order.id_proveedor) : null;
    const supName = supplier ? supplier.prv_nombre : "";
    return (
      supName.toLowerCase().includes(search.toLowerCase()) ||
      r.id_recepcion?.toString().includes(search) ||
      r.id_compra.toString().includes(search)
    );
  });

  // Approved and open orders to display in select dropdown
  const availableOrders = orders.filter(o => o.oc_estado === "APR");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Proveedor o N° OC..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { resetForm(); setIsRegisterOpen(true); }} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" /> Registrar Recepción
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recepciones Físicas de Mercadería</CardTitle>
          <CardDescription>
            Control de ingresos de mercancía a bodegas vinculados a órdenes de compra aprobadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Recep.</TableHead>
                  <TableHead>N° OC</TableHead>
                  <TableHead>Bodega</TableHead>
                  <TableHead>Fecha Recepción</TableHead>
                  <TableHead>Items Recibidos</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No se encontraron recepciones físicas.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceptions.map((rec) => {
                    const bodegaName = warehouses.find(w => w.id_bodega === rec.id_bodega)?.bod_nombre || `Bodega ID: ${rec.id_bodega}`;
                    const formattedDate = rec.rec_fechahora ? new Date(rec.rec_fechahora).toLocaleString() : "";
                    
                    const badgeStyles = 
                      rec.rec_estado === 'APR' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30' : 
                      rec.rec_estado === 'ABI' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30' : 
                      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30';

                    const statusLabel = 
                      rec.rec_estado === 'APR' ? 'Aprobada' : 
                      rec.rec_estado === 'ABI' ? 'Borrador' : 'Anulada';

                    return (
                      <TableRow key={rec.id_recepcion}>
                        <TableCell className="font-semibold">#{rec.id_recepcion}</TableCell>
                        <TableCell>#{rec.id_compra}</TableCell>
                        <TableCell>{bodegaName}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>{rec.rec_num_productos || 0} unidades</TableCell>
                        <TableCell className="text-sm">{rec.usu_responsable}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeStyles}>{statusLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right gap-1 flex items-center justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(rec)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {rec.rec_estado === 'ABI' && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                              onClick={() => handleApprove(rec)}
                              title="Aprobar Recepción e Incrementar Inventario"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* 1. Register Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" /> Registrar Recepción Física
              </DialogTitle>
              <DialogDescription>
                Seleccione una Orden de Compra aprobada, la Bodega de destino y verifique cantidades recibidas.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="order_sel">Orden de Compra Aprobada *</Label>
                  <Select value={compraId} onValueChange={handleCompraChange}>
                    <SelectTrigger id="order_sel">
                      <SelectValue placeholder="Seleccione orden de compra" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrders.map(o => {
                        const sName = suppliers.find(s => s.id_proveedor === o.id_proveedor)?.prv_nombre || "";
                        return (
                          <SelectItem key={o.id_compra} value={o.id_compra?.toString() || ""}>
                            OC #{o.id_compra} - {sName} (${Number(o.oc_total).toFixed(2)})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="bodega_sel">Bodega Destino *</Label>
                  <Select value={bodegaId} onValueChange={setBodegaId}>
                    <SelectTrigger id="bodega_sel">
                      <SelectValue placeholder="Seleccione bodega" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id_bodega} value={w.id_bodega.toString()}>
                          {w.bod_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="rec_desc">Descripción / Observación *</Label>
                <Input
                  id="rec_desc"
                  placeholder="Ej: Entrega de mercadería lote 45 con guía de remisión"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                />
              </div>

              {/* Items grid verification */}
              {items.length > 0 && (
                <div className="border rounded-lg mt-2 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cant. Solicitada</TableHead>
                        <TableHead className="w-28">Cant. Recibida</TableHead>
                        <TableHead>Diferencia</TableHead>
                        <TableHead>Motivo de Diferencia (Obligatorio si hay dif.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => {
                        const variantName = variants.find(v => v.id_variante === item.id_variante)?.var_nombre || `Variante ${item.id_variante}`;
                        const hasDiff = item.pxr_diferencia !== 0;
                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-semibold">{variantName}</TableCell>
                            <TableCell>{item.pxr_cantidad_solicitada}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={item.pxr_cantidad_solicitada}
                                value={item.pxr_qty_recibida}
                                onChange={(e) => handleQtyReceivedChange(idx, Number(e.target.value))}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant={hasDiff ? "destructive" : "secondary"}>
                                {item.pxr_diferencia}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Motivo de la falta/exceso de mercadería"
                                disabled={!hasDiff}
                                value={item.pxr_motivo_diferencia || ""}
                                onChange={(e) => handleMotivationChange(idx, e.target.value)}
                                className={`h-8 text-xs ${hasDiff && !item.pxr_motivo_diferencia?.trim() ? "border-red-500 bg-red-50/20 dark:bg-red-950/10" : ""}`}
                                required={hasDiff}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={items.length === 0}>
                Registrar Recepción
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[650px]">
          {selectedReception && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de Recepción Física #{selectedReception.id_recepcion}</DialogTitle>
                <DialogDescription>
                  Datos generales del ingreso de mercadería a inventario.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground block text-xs">Orden de Compra</span>
                    <span className="font-semibold">OC #{selectedReception.id_compra}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Bodega Destino</span>
                    <span className="font-semibold">
                      {warehouses.find(w => w.id_bodega === selectedReception.id_bodega)?.bod_nombre || `ID: ${selectedReception.id_bodega}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Fecha y Hora</span>
                    <span className="font-semibold">
                      {selectedReception.rec_fechahora ? new Date(selectedReception.rec_fechahora).toLocaleString() : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Responsable</span>
                    <span className="font-semibold">{selectedReception.usu_responsable}</span>
                  </div>
                </div>

                <div className="border rounded-lg mt-2 max-h-[250px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Solicitada</TableHead>
                        <TableHead>Recibida</TableHead>
                        <TableHead>Diferencia</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReception.items?.map((item, idx) => {
                        const variantName = variants.find(v => v.id_variante === item.id_variante)?.var_nombre || `Variante: ${item.id_variante}`;
                        return (
                          <TableRow key={idx}>
                            <TableCell>{variantName}</TableCell>
                            <TableCell>{item.pxr_cantidad_solicitada}</TableCell>
                            <TableCell>{item.pxr_qty_recibida}</TableCell>
                            <TableCell>
                              <Badge variant={item.pxr_diferencia !== 0 ? "destructive" : "secondary"}>
                                {item.pxr_diferencia}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={item.pxr_motivo_diferencia || ""}>
                              {item.pxr_motivo_diferencia || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
