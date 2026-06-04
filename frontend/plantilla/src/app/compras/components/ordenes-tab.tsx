import { useState, useEffect } from "react";
import type { Compra, Proveedor, Proxoc } from "../services/compras-service";
import { getCompraDetails } from "../services/compras-service";
import type { Variante } from "../services/inventario-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Eye, Search, ShoppingCart, Trash2, Pencil, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CompraDetailModal } from "./compra-detail-modal";
import { getRolCompras } from "../utils/rbac";

interface VariantAttributes {
  id_variante: number;
  productName: string;
  colorOrFlavor: string;
  sizeOrWeight: string;
}

const parseVariantAttributes = (v: { id_variante: number; var_nombre?: string; var_precio_venta?: number }): VariantAttributes => {
  const name = v.var_nombre || `Variante ${v.id_variante}`;
  const nameLower = name.toLowerCase();
  let productName = name;
  let colorOrFlavor = "Estándar";
  let sizeOrWeight = "Única";

  const colors = ["rojo", "roja", "azul", "negro", "negra", "blanco", "blanca", "amarillo", "verde", "gris", "marrón", "cafe", "rosa", "lila"];
  const sizes = ["xs", "s", "m", "l", "xl", "xxl", "30", "32", "34", "36", "38", "40", "unidad"];

  for (const c of colors) {
    if (nameLower.includes(c)) {
      colorOrFlavor = c.charAt(0).toUpperCase() + c.slice(1);
      productName = productName.replace(new RegExp(c, "gi"), "").trim();
      break;
    }
  }

  for (const s of sizes) {
    const regex = new RegExp(`\\b${s}\\b|${s}`, "i");
    if (regex.test(nameLower)) {
      sizeOrWeight = s.toUpperCase();
      productName = productName.replace(regex, "").trim();
      break;
    }
  }

  productName = productName.replace(/\s+/g, " ").trim();
  if (!productName) productName = name;

  return {
    id_variante: v.id_variante,
    productName,
    colorOrFlavor,
    sizeOrWeight
  };
};

interface OrdenesTabProps {
  orders: Compra[];
  suppliers: Proveedor[];
  variants: Variante[];
  onCreateOrder: (order: Compra) => Promise<boolean>;
  onUpdateOrderStatus: (id: number, status: 'ABI' | 'APR' | 'ANU') => Promise<boolean>;
  onUpdateOrder: (id: number, order: Compra) => Promise<boolean>;
}

export function OrdenesTab({
  orders,
  suppliers,
  variants,
  onCreateOrder,
  onUpdateOrderStatus,
  onUpdateOrder
}: OrdenesTabProps) {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Compra | null>(null);
  const [defaultEditMode, setDefaultEditMode] = useState(false);
  const [role, setRole] = useState<'JEFE' | 'AUX' | 'OPER' | 'NONE'>('NONE');

  useEffect(() => {
    setRole(getRolCompras());
  }, []);

  // Creator Form state
  const [proveedorId, setProveedorId] = useState("");
  const [isProveedorOpen, setIsProveedorOpen] = useState(false);
  const [fechaEmision, setFechaEmision] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [ivaPercent, setIvaPercent] = useState("15"); // default 15%
  const [items, setItems] = useState<Proxoc[]>([]);

  const today = new Date();
  today.setDate(today.getDate() - 1);
  const maxEmisionDate = today.toISOString().split("T")[0];

  // Item Selector State
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  // Dynamic dropdown state selectors
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Parse all variants to get attributes
  const parsedVariants = variants.map(v => parseVariantAttributes(v));

  // 1. Unique Products list
  const uniqueProducts = Array.from(new Set(parsedVariants.map(pv => pv.productName))).sort();

  // 2. Colors list based on selected product
  const availableColors = selectedProduct
    ? Array.from(new Set(parsedVariants.filter(pv => pv.productName === selectedProduct).map(pv => pv.colorOrFlavor))).sort()
    : [];

  // 3. Sizes list based on selected product & color
  const availableSizes = selectedProduct && selectedColor
    ? Array.from(
        new Set(
          parsedVariants
            .filter(pv => pv.productName === selectedProduct && pv.colorOrFlavor === selectedColor)
            .map(pv => pv.sizeOrWeight)
        )
      ).sort()
    : [];

  // Resolve id_variante from options selection
  useEffect(() => {
    if (selectedProduct && selectedColor && selectedSize) {
      const match = parsedVariants.find(
        pv =>
          pv.productName === selectedProduct &&
          pv.colorOrFlavor === selectedColor &&
          pv.sizeOrWeight === selectedSize
      );
      if (match) {
        setSelectedVariantId(match.id_variante.toString());
        const variant = variants.find(v => v.id_variante === match.id_variante);
        if (variant) {
          setUnitCost((variant.var_precio_venta || 10) * 0.6);
        }
      } else {
        setSelectedVariantId("");
      }
    } else {
      setSelectedVariantId("");
    }
  }, [selectedProduct, selectedColor, selectedSize, variants]);

  // Auto-select single options
  useEffect(() => {
    if (selectedProduct) {
      if (availableColors.length === 1 && selectedColor !== availableColors[0]) {
        setSelectedColor(availableColors[0]);
      }
    }
  }, [selectedProduct, availableColors, selectedColor]);

  useEffect(() => {
    if (selectedProduct && selectedColor) {
      if (availableSizes.length === 1 && selectedSize !== availableSizes[0]) {
        setSelectedSize(availableSizes[0]);
      }
    }
  }, [selectedProduct, selectedColor, availableSizes, selectedSize]);

  // Reset selectors on create open toggle
  useEffect(() => {
    setSelectedProduct("");
    setSelectedColor("");
    setSelectedSize("");
    setSelectedVariantId("");
  }, [isCreateOpen]);

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
    setSelectedProduct("");
    setSelectedColor("");
    setSelectedSize("");
    setSelectedVariantId("");
    setQuantity(1);
    setUnitCost(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, item) => acc + (Number(item.pxo_subtotal) || (Number(item.pxo_cantidad) * Number(item.pxo_valor || 0))), 0);
  const calculatedIvaVal = calculatedSubtotal * (Number(ivaPercent) / 100);
  const calculatedTotal = calculatedSubtotal + calculatedIvaVal;

  const resetForm = () => {
    setProveedorId("");
    setFechaEmision("");
    setFechaEntrega("");
    setIvaPercent("15");
    setItems([]);
    setSelectedProduct("");
    setSelectedColor("");
    setSelectedSize("");
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
      oc_fecha: fechaEmision || undefined,
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

  const handleOpenDetail = async (order: Compra, editMode = false) => {
    if (order.id_compra) {
      try {
        const fullOrder = await getCompraDetails(order.id_compra);
        setSelectedOrder(fullOrder);
      } catch (e: any) {
        console.error("Error loading order details", e);
        toast.error("No se pudo cargar el detalle de la orden");
        setSelectedOrder(order);
      }
    } else {
      setSelectedOrder(order);
    }
    setDefaultEditMode(editMode);
    setIsDetailOpen(true);
  };

  const filteredOrders = orders.filter(o => {
    const provName = suppliers.find(s => s.id_proveedor === o.id_proveedor)?.prv_nombre || "";
    return (
      provName.toLowerCase().includes(search.toLowerCase()) ||
      o.id_compra?.toString().includes(search) ||
      (o.oc_estado && o.oc_estado.toLowerCase().includes(search.toLowerCase()))
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
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(order, false)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.oc_estado === 'ABI' && (role === 'JEFE' || role === 'AUX') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary hover:text-primary/80"
                              onClick={() => handleOpenDetail(order, true)}
                            >
                              <Pencil className="h-4 w-4" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Proveedor *</Label>
                  <Popover open={isProveedorOpen} onOpenChange={setIsProveedorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isProveedorOpen}
                        className="w-full justify-between font-normal"
                      >
                        {proveedorId
                          ? suppliers.find((s) => s.id_proveedor?.toString() === proveedorId)?.prv_nombre
                          : "Seleccione proveedor..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar proveedor..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron proveedores.</CommandEmpty>
                          <CommandGroup>
                            {suppliers.filter(s => s.prv_estado === 'ACT').map((s) => (
                              <CommandItem
                                key={s.id_proveedor}
                                value={s.prv_nombre}
                                onSelect={() => {
                                  setProveedorId(s.id_proveedor?.toString() || "");
                                  setIsProveedorOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    proveedorId === s.id_proveedor?.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {s.prv_nombre}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="fecha_emi">Fecha Emisión OC</Label>
                  <Input
                    id="fecha_emi"
                    type="date"
                    max={maxEmisionDate}
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                  />
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
                  <Select value={ivaPercent} disabled>
                    <SelectTrigger id="iva_percent" className="bg-muted/50 opacity-100 disabled:cursor-not-allowed">
                      <SelectValue placeholder="15 %" />
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
                
                {/* Producto Row */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="product_sel">Producto</Label>
                    <Select value={selectedProduct} onValueChange={(val) => { setSelectedProduct(val); setSelectedColor(""); setSelectedSize(""); }}>
                      <SelectTrigger id="product_sel" className="w-full">
                        <SelectValue placeholder="Seleccione producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueProducts.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Color and Talla Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="color_sel">Color</Label>
                    <Select value={selectedColor} onValueChange={(val) => { setSelectedColor(val); setSelectedSize(""); }} disabled={!selectedProduct}>
                      <SelectTrigger id="color_sel">
                        <SelectValue placeholder={selectedProduct ? "Seleccione color" : "Primero elija producto"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColors.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="size_sel">Talla</Label>
                    <Select value={selectedSize} onValueChange={setSelectedSize} disabled={!selectedColor}>
                      <SelectTrigger id="size_sel">
                        <SelectValue placeholder={selectedColor ? "Seleccione talla" : "Primero elija color"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSizes.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cantidad and Costo Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="flex flex-col gap-2 md:col-span-4 lg:col-span-3">
                    <Label htmlFor="qty_opt">Cantidad</Label>
                    <Input
                      id="qty_opt"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-4 lg:col-span-3">
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

                  <div className="md:col-span-4 lg:col-span-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={handleAddItem}
                      disabled={!selectedVariantId}
                    >
                      Agregar Item
                    </Button>
                  </div>
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
                            <TableCell>${Number(item.pxo_valor).toFixed(2)}</TableCell>
                            <TableCell>${(Number(item.pxo_cantidad) * Number(item.pxo_valor)).toFixed(2)}</TableCell>
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
      <CompraDetailModal
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        order={selectedOrder}
        suppliers={suppliers}
        variants={variants}
        onUpdateOrderStatus={onUpdateOrderStatus}
        onUpdateOrder={onUpdateOrder}
        defaultEditMode={defaultEditMode}
      />
    </div>
  );
}
