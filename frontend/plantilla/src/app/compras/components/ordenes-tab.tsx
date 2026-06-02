import { useState } from "react";
import type { Compra, Proveedor, Proxoc } from "../services/compras-service";
import type { Variante } from "../services/inventario-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Check, X, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface OrdenesTabProps {
  orders: Compra[];
  suppliers: Proveedor[];
  variants: Variante[];
  onCreateOrder: (order: Compra) => Promise<boolean>;
  onUpdateOrderStatus: (id: number, status: 'ABI' | 'APR' | 'ANU') => Promise<boolean>;
}

export function OrdenesTab({
  orders,
  suppliers,
  variants,
  onCreateOrder,
  onUpdateOrderStatus
}: OrdenesTabProps) {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Compra | null>(null);

  // Creator Form state
  const [proveedorId, setProveedorId] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [ivaPercent, setIvaPercent] = useState("15"); // default 15%
  const [items, setItems] = useState<Proxoc[]>([]);

  // Item Selector State
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const handleVariantChange = (id: string) => {
    setSelectedVariantId(id);
    const variant = variants.find(v => v.id_variante === Number(id));
    if (variant) {
      // default cost can be half of price sale or variant base value
      setUnitCost(variant.var_precio_venta * 0.6); 
    }
  };

  const handleAddItem = () => {
    if (!selectedVariantId || quantity <= 0 || unitCost <= 0) return;
    const vId = Number(selectedVariantId);
    
    // Check if variant already added
    if (items.some(item => item.id_variante === vId)) {
      toast.error("Este producto ya está agregado en la orden");
      return;
    }

    const newItem: Proxoc = {
      id_variante: vId,
      pxo_cantidad: quantity,
      pxo_valor: Number(unitCost),
      pxo_subtotal: quantity * Number(unitCost)
    };

    setItems([...items, newItem]);
    setSelectedVariantId("");
    setQuantity(1);
    setUnitCost(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, item) => acc + (item.pxo_subtotal || 0), 0);
  const calculatedIvaVal = calculatedSubtotal * (Number(ivaPercent) / 100);
  const calculatedTotal = calculatedSubtotal + calculatedIvaVal;

  const resetForm = () => {
    setProveedorId("");
    setFechaEntrega("");
    setIvaPercent("15");
    setItems([]);
    setSelectedVariantId("");
    setQuantity(1);
    setUnitCost(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorId || items.length === 0) {
      toast.error("Complete el proveedor y agregue al menos un producto");
      return;
    }

    const payload: Compra = {
      id_proveedor: Number(proveedorId),
      oc_fechaentrega: fechaEntrega || null,
      oc_subtotal: Number(calculatedSubtotal.toFixed(2)),
      oc_iva: Number(ivaPercent),
      oc_total: Number(calculatedTotal.toFixed(2)),
      items: items.map(item => ({
        ...item,
        pxo_subtotal: Number((item.pxo_cantidad * item.pxo_valor).toFixed(2))
      }))
    };

    const success = await onCreateOrder(payload);
    if (success) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleOpenDetail = (order: Compra) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const filteredOrders = orders.filter(o => {
    const provName = suppliers.find(s => s.id_proveedor === o.id_proveedor)?.prv_nombre || "";
    return (
      provName.toLowerCase().includes(search.toLowerCase()) ||
      o.id_compra?.toString().includes(search) ||
      o.oc_estado?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por Razón Social o N° OC..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" /> Crear Orden de Compra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Compra</CardTitle>
          <CardDescription>
            Seguimiento de órdenes emitidas a proveedores y estados de aprobación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° OC</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Total ($)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron órdenes de compra.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const provName = suppliers.find(s => s.id_proveedor === order.id_proveedor)?.prv_nombre || `Proveedor ID: ${order.id_proveedor}`;
                    const formattedDate = order.oc_fecha ? new Date(order.oc_fecha).toLocaleDateString() : "";
                    const formattedDelivery = order.oc_fechaentrega ? new Date(order.oc_fechaentrega).toLocaleDateString() : "No definida";
                    
                    const badgeStyles = 
                      order.oc_estado === 'APR' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30' : 
                      order.oc_estado === 'ABI' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30' : 
                      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30';

                    const statusLabel = 
                      order.oc_estado === 'APR' ? 'Aprobada' : 
                      order.oc_estado === 'ABI' ? 'Abierta' : 'Anulada';

                    return (
                      <TableRow key={order.id_compra}>
                        <TableCell className="font-semibold">#{order.id_compra}</TableCell>
                        <TableCell>{provName}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>{formattedDelivery}</TableCell>
                        <TableCell className="font-medium">${Number(order.oc_total).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badgeStyles}>{statusLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right gap-1 flex items-center justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(order)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.oc_estado === 'ABI' && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                                onClick={() => onUpdateOrderStatus(order.id_compra!, 'APR')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => onUpdateOrderStatus(order.id_compra!, 'ANU')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
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

      {/* 1. Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Registrar Orden de Compra
              </DialogTitle>
              <DialogDescription>
                Rellene la cabecera y añada variantes al detalle de la compra.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Header Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="proveedor_opt">Proveedor *</Label>
                  <Select value={proveedorId} onValueChange={setProveedorId}>
                    <SelectTrigger id="proveedor_opt">
                      <SelectValue placeholder="Seleccione proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.filter(s => s.prv_estado === 'ACT').map(s => (
                        <SelectItem key={s.id_proveedor} value={s.id_proveedor?.toString() || ""}>
                          {s.prv_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="fecha_ent">Fecha Entrega</Label>
                  <Input
                    id="fecha_ent"
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="iva_percent">Porcentaje IVA (%) *</Label>
                  <Select value={ivaPercent} onValueChange={setIvaPercent}>
                    <SelectTrigger id="iva_percent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 %</SelectItem>
                      <SelectItem value="15">15 %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Detail Selector */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="text-sm font-semibold mb-3">Agregar Item al Detalle</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="variant_opt">Variante de Chocolate</Label>
                    <Select value={selectedVariantId} onValueChange={handleVariantChange}>
                      <SelectTrigger id="variant_opt">
                        <SelectValue placeholder="Seleccione variante" />
                      </SelectTrigger>
                      <SelectContent>
                        {variants.map(v => (
                          <SelectItem key={v.id_variante} value={v.id_variante.toString()}>
                            {v.var_nombre} (${v.var_precio_venta.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="qty_opt">Cantidad</Label>
                    <Input
                      id="qty_opt"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="unit_cost">Costo Unitario ($)</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    Agregar Item
                  </Button>
                </div>
              </div>

              {/* Items Grid */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Unitario</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead className="text-right w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground text-sm h-16">
                          No se han agregado productos a la orden.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, idx) => {
                        const variantName = variants.find(v => v.id_variante === item.id_variante)?.var_nombre || `Variante ${item.id_variante}`;
                        return (
                          <TableRow key={idx}>
                            <TableCell>{variantName}</TableCell>
                            <TableCell>{item.pxo_cantidad}</TableCell>
                            <TableCell>${item.pxo_valor.toFixed(2)}</TableCell>
                            <TableCell>${(item.pxo_cantidad * item.pxo_valor).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals Summary */}
              <div className="flex flex-col items-end gap-1.5 text-sm font-medium pr-4">
                <div>Subtotal: <span className="font-semibold">${calculatedSubtotal.toFixed(2)}</span></div>
                <div>IVA ({ivaPercent}%): <span className="font-semibold">${calculatedIvaVal.toFixed(2)}</span></div>
                <div className="text-base font-bold border-t pt-1 mt-1 text-primary">
                  Total Final: <span>${calculatedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={items.length === 0}>
                Registrar Compra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de Orden de Compra #{selectedOrder.id_compra}</DialogTitle>
                <DialogDescription>
                  Revisión de los productos solicitados y estado actual.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Proveedor</span>
                    <span className="font-semibold">
                      {suppliers.find(s => s.id_proveedor === selectedOrder.id_proveedor)?.prv_nombre || `ID: ${selectedOrder.id_proveedor}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Fecha Emisión</span>
                    <span className="font-semibold">
                      {selectedOrder.oc_fecha ? new Date(selectedOrder.oc_fecha).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>

                <div className="border rounded-lg mt-2 max-h-[250px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Costo Unitario</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, idx) => {
                        const variantName = variants.find(v => v.id_variante === item.id_variante)?.var_nombre || `Variante: ${item.id_variante}`;
                        return (
                          <TableRow key={idx}>
                            <TableCell>{variantName}</TableCell>
                            <TableCell>{item.pxo_cantidad}</TableCell>
                            <TableCell>${Number(item.pxo_valor).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">
                              ${((item.pxo_subtotal) ? item.pxo_subtotal : (item.pxo_cantidad * item.pxo_valor)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col items-end gap-1 text-sm font-semibold pr-2 mt-2">
                  <div>Subtotal: <span className="text-muted-foreground">${Number(selectedOrder.oc_subtotal).toFixed(2)}</span></div>
                  <div>IVA ({selectedOrder.oc_iva}%): <span className="text-muted-foreground">${(Number(selectedOrder.oc_total) - Number(selectedOrder.oc_subtotal)).toFixed(2)}</span></div>
                  <div className="text-base font-bold text-primary border-t pt-1">Total: <span>${Number(selectedOrder.oc_total).toFixed(2)}</span></div>
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
