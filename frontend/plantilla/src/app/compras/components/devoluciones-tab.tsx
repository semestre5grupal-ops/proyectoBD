import { useState } from "react";
import type { Devolucion, Compra, Proveedor, Proxdevc } from "../services/compras-service";
import type { Bodega, Variante } from "../services/inventario-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Check, Search, Undo } from "lucide-react";
import { toast } from "sonner";

interface DevolucionesTabProps {
  returns: Devolucion[];
  orders: Compra[];
  suppliers: Proveedor[];
  warehouses: Bodega[];
  variants: Variante[];
  onCreateReturn: (devolucion: Devolucion) => Promise<any>;
  onApproveReturn: (id: number, details: Devolucion) => Promise<boolean>;
}

export function DevolucionesTab({
  returns,
  orders,
  suppliers,
  warehouses,
  variants,
  onCreateReturn,
  onApproveReturn
}: DevolucionesTabProps) {
  const [search, setSearch] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Devolucion | null>(null);

  // Form State
  const [compraId, setCompraId] = useState("");
  const [bodegaId, setBodegaId] = useState("");
  const [motivoGeneral, setMotivoGeneral] = useState("");
  const [items, setItems] = useState<Proxdevc[]>([]);

  // When PO changes, load items for return selection
  const handleCompraChange = (id: string) => {
    setCompraId(id);
    const order = orders.find(o => o.id_compra === Number(id));
    if (order && order.items) {
      // Default return quantity is 0, user will type what they want to return
      const initialItems: Proxdevc[] = order.items.map(item => ({
        id_variante: item.id_variante,
        pxdc_cantidad_recibida: item.pxo_cantidad,
        pxdc_cantidad_devuelta: 0,
        pxdc_diferencia: item.pxo_cantidad,
        pxdc_motivo: ""
      }));
      setItems(initialItems);
    } else {
      setItems([]);
    }
  };

  const handleQtyDevueltaChange = (index: number, val: number) => {
    const nextItems = [...items];
    const item = nextItems[index];
    // Limit return qty between 0 and original received quantity
    const qty = Math.min(item.pxdc_cantidad_recibida, Math.max(0, val));
    item.pxdc_cantidad_devuelta = qty;
    item.pxdc_diferencia = item.pxdc_cantidad_recibida - qty;
    setItems(nextItems);
  };

  const handleLineMotivoChange = (index: number, val: string) => {
    const nextItems = [...items];
    nextItems[index].pxdc_motivo = val;
    setItems(nextItems);
  };

  const resetForm = () => {
    setCompraId("");
    setBodegaId("");
    setMotivoGeneral("");
    setItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compraId || !bodegaId || !motivoGeneral || items.length === 0) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }

    // Filter to only submit items where returned quantity is > 0
    const itemsToSubmit = items.filter(item => item.pxdc_cantidad_devuelta > 0);
    if (itemsToSubmit.length === 0) {
      toast.error("Debe ingresar al menos una cantidad a devolver mayor a 0");
      return;
    }

    // Validate line motives for returned items
    const missingLineMotives = itemsToSubmit.some(item => !item.pxdc_motivo?.trim());
    if (missingLineMotives) {
      toast.error("Por favor ingrese una observación / motivo para cada producto que va a devolver");
      return;
    }

    const payload: Devolucion = {
      id_compra: Number(compraId),
      id_bodega: Number(bodegaId),
      devc_motivo: motivoGeneral,
      usu_responsable: "admin", // Administrator context
      items: itemsToSubmit.map(item => ({
        ...item,
        pxdc_motivo: item.pxdc_motivo || null
      }))
    };

    const created = await onCreateReturn(payload);
    if (created) {
      setIsRegisterOpen(false);
      resetForm();
    }
  };

  const handleOpenDetail = (dev: Devolucion) => {
    setSelectedReturn(dev);
    setIsDetailOpen(true);
  };

  const handleApprove = async (dev: Devolucion) => {
    if (!dev.id_devcompra_pk) return;
    await onApproveReturn(dev.id_devcompra_pk, dev);
  };

  const filteredReturns = returns.filter(r => {
    const order = orders.find(o => o.id_compra === r.id_compra);
    const supplier = order ? suppliers.find(s => s.id_proveedor === order.id_proveedor) : null;
    const supName = supplier ? supplier.prv_nombre : "";
    return (
      supName.toLowerCase().includes(search.toLowerCase()) ||
      r.id_devcompra_pk?.toString().includes(search) ||
      r.devc_motivo.toLowerCase().includes(search.toLowerCase())
    );
  });

  const availableOrders = orders.filter(o => o.oc_estado === "APR");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Proveedor o Motivo..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { resetForm(); setIsRegisterOpen(true); }} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" /> Registrar Devolución
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Devoluciones de Compra a Proveedores</CardTitle>
          <CardDescription>
            Registro de mercadería devuelta por mermas, fallas o roturas que descuentan stock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Devolución</TableHead>
                  <TableHead>N° OC Ref</TableHead>
                  <TableHead>Bodega Salida</TableHead>
                  <TableHead>Fecha Devolución</TableHead>
                  <TableHead>Motivo General</TableHead>
                  <TableHead>Unidades Devueltas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No se encontraron devoluciones registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReturns.map((dev) => {
                    const bodegaName = warehouses.find(w => w.id_bodega === dev.id_bodega)?.bod_nombre || `Bodega ID: ${dev.id_bodega}`;
                    const formattedDate = dev.devc_fechahora ? new Date(dev.devc_fechahora).toLocaleString() : "";
                    
                    const badgeStyles = 
                      dev.devc_estado === 'APR' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30' : 
                      dev.devc_estado === 'ABI' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30' : 
                      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30';

                    const statusLabel = 
                      dev.devc_estado === 'APR' ? 'Aprobada' : 
                      dev.devc_estado === 'ABI' ? 'Borrador' : 'Anulada';

                    return (
                      <TableRow key={dev.id_devcompra_pk}>
                        <TableCell className="font-semibold">#{dev.id_devcompra_pk}</TableCell>
                        <TableCell>#{dev.id_compra}</TableCell>
                        <TableCell>{bodegaName}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={dev.devc_motivo}>
                          {dev.devc_motivo}
                        </TableCell>
                        <TableCell>{dev.devc_num_produc || 0} unidades</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeStyles}>{statusLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right gap-1 flex items-center justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(dev)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {dev.devc_estado === 'ABI' && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                              onClick={() => handleApprove(dev)}
                              title="Aprobar Devolución y Descontar Inventario"
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
                <Undo className="h-5 w-5 text-primary" /> Registrar Devolución de Compra
              </DialogTitle>
              <DialogDescription>
                Seleccione una Orden de Compra aprobada para iniciar la devolución, y la Bodega de donde se descontará stock.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="order_sel_dev">Orden de Compra Referencia *</Label>
                  <Select value={compraId} onValueChange={handleCompraChange}>
                    <SelectTrigger id="order_sel_dev">
                      <SelectValue placeholder="Seleccione orden de compra" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrders.map(o => {
                        const sName = suppliers.find(s => s.id_proveedor === o.id_proveedor)?.prv_nombre || "";
                        return (
                          <SelectItem key={o.id_compra} value={o.id_compra?.toString() || ""}>
                            OC #{o.id_compra} - {sName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="bodega_sel_dev">Bodega de Salida *</Label>
                  <Select value={bodegaId} onValueChange={setBodegaId}>
                    <SelectTrigger id="bodega_sel_dev">
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
                <Label htmlFor="dev_motivo">Motivo General de la Devolución *</Label>
                <Input
                  id="dev_motivo"
                  placeholder="Ej: Inconsistencias de calidad, mercadería con empaques rotos"
                  value={motivoGeneral}
                  onChange={(e) => setMotivoGeneral(e.target.value)}
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
                        <TableHead>Cant. Comprada</TableHead>
                        <TableHead className="w-28">Cant. Devolver</TableHead>
                        <TableHead>Observación / Motivo Particular (Obligatorio)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => {
                        const variantName = variants.find(v => v.id_variante === item.id_variante)?.var_nombre || `Variante ${item.id_variante}`;
                        const isReturning = item.pxdc_cantidad_devuelta > 0;
                        return (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-semibold">{variantName}</TableCell>
                            <TableCell>{item.pxdc_cantidad_recibida}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={item.pxdc_cantidad_recibida}
                                value={item.pxdc_cantidad_devuelta}
                                onChange={(e) => handleQtyDevueltaChange(idx, Number(e.target.value))}
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Indique la causa específica del lote"
                                disabled={!isReturning}
                                value={item.pxdc_motivo || ""}
                                onChange={(e) => handleLineMotivoChange(idx, e.target.value)}
                                className={`h-8 text-xs ${isReturning && !item.pxdc_motivo?.trim() ? "border-red-500 bg-red-50/20 dark:bg-red-950/10" : ""}`}
                                required={isReturning}
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
              <Button type="submit" disabled={items.filter(i => i.pxdc_cantidad_devuelta > 0).length === 0}>
                Registrar Devolución
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[650px]">
          {selectedReturn && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de Devolución de Compra #{selectedReturn.id_devcompra_pk}</DialogTitle>
                <DialogDescription>
                  Datos generales y desglose de items devueltos a bodega.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground block text-xs">Orden de Compra Ref.</span>
                    <span className="font-semibold">OC #{selectedReturn.id_compra}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Bodega Salida</span>
                    <span className="font-semibold">
                      {warehouses.find(w => w.id_bodega === selectedReturn.id_bodega)?.bod_nombre || `ID: ${selectedReturn.id_bodega}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Fecha y Hora</span>
                    <span className="font-semibold">
                      {selectedReturn.devc_fechahora ? new Date(selectedReturn.devc_fechahora).toLocaleString() : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Motivo General</span>
                    <span className="font-semibold">{selectedReturn.devc_motivo}</span>
                  </div>
                </div>

                <div className="border rounded-lg mt-2 max-h-[250px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad Comprada</TableHead>
                        <TableHead>Cantidad Devuelta</TableHead>
                        <TableHead>Motivo Específico</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn.items?.map((item, idx) => {
                        const variantName = variants.find(v => v.id_variante === item.id_variante)?.var_nombre || `Variante: ${item.id_variante}`;
                        return (
                          <TableRow key={idx}>
                            <TableCell>{variantName}</TableCell>
                            <TableCell>{item.pxdc_cantidad_recibida}</TableCell>
                            <TableCell className="font-semibold text-destructive">{item.pxdc_cantidad_devuelta}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={item.pxdc_motivo || ""}>
                              {item.pxdc_motivo || "-"}
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
