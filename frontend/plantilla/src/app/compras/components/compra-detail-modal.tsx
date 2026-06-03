import { useState, useEffect } from "react";
import type { Compra, Proveedor, Proxoc } from "../services/compras-service";
import type { Variante } from "../services/inventario-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit2, Check, X, Plus, Trash2, ShieldAlert } from "lucide-react";
import { getRolCompras } from "../utils/rbac";

interface VariantAttributes {
  id_variante: number;
  productName: string;
  colorOrFlavor: string;
  sizeOrWeight: string;
}

const parseVariantAttributes = (v: { id_variante: number; var_nombre: string; var_precio_venta: number }): VariantAttributes => {
  const name = v.var_nombre;
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

interface CompraDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Compra | null;
  suppliers: Proveedor[];
  variants: Variante[];
  onUpdateOrderStatus: (id: number, status: 'ABI' | 'APR' | 'ANU') => Promise<boolean>;
  onUpdateOrder: (id: number, order: Compra) => Promise<boolean>;
  defaultEditMode?: boolean;
}

export function CompraDetailModal({
  isOpen,
  onOpenChange,
  order,
  suppliers,
  variants,
  onUpdateOrderStatus,
  onUpdateOrder,
  defaultEditMode = false
}: CompraDetailModalProps) {
  const [role, setRole] = useState<'JEFE' | 'AUX' | 'OPER' | 'NONE'>('NONE');
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit Form States
  const [proveedorId, setProveedorId] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [ivaPercent, setIvaPercent] = useState("15");
  const [items, setItems] = useState<Proxoc[]>([]);

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
          setUnitCost(variant.var_precio_venta * 0.6);
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

  // Reset selectors on edit toggle
  useEffect(() => {
    setSelectedProduct("");
    setSelectedColor("");
    setSelectedSize("");
    setSelectedVariantId("");
  }, [isEditing]);

  // Initialize roles and states
  useEffect(() => {
    if (isOpen) {
      setRole(getRolCompras());
      setIsEditing(defaultEditMode);
      if (order) {
        setProveedorId(order.id_proveedor.toString());
        setFechaEntrega(order.oc_fechaentrega ? order.oc_fechaentrega.split('T')[0] : "");
        setIvaPercent(order.oc_iva.toString());
        setItems(order.items || []);
      }
    }
  }, [isOpen, order, defaultEditMode]);

  if (!order) return null;

  const handleAddItem = () => {
    if (!selectedVariantId || quantity <= 0 || unitCost <= 0) return;
    const vId = Number(selectedVariantId);
    
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

  const handleUpdateItemQty = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].pxo_cantidad = qty;
    updated[index].pxo_subtotal = qty * updated[index].pxo_valor;
    setItems(updated);
  };

  const handleUpdateItemCost = (index: number, cost: number) => {
    const updated = [...items];
    updated[index].pxo_valor = cost;
    updated[index].pxo_subtotal = updated[index].pxo_cantidad * cost;
    setItems(updated);
  };

  // Calculations
  const calculatedSubtotal = items.reduce((acc, item) => acc + (item.pxo_subtotal || (item.pxo_cantidad * item.pxo_valor)), 0);
  const calculatedIvaVal = calculatedSubtotal * (Number(ivaPercent) / 100);
  const calculatedTotal = calculatedSubtotal + calculatedIvaVal;

  const handleSaveChanges = async () => {
    if (items.length === 0) {
      toast.error("La orden debe tener al menos un producto");
      return;
    }

    const payload: Compra = {
      id_proveedor: Number(proveedorId),
      oc_fechaentrega: fechaEntrega || null,
      oc_subtotal: Number(calculatedSubtotal.toFixed(2)),
      oc_iva: Number(ivaPercent),
      oc_total: Number(calculatedTotal.toFixed(2)),
      items: items.map(item => ({
        id_variante: item.id_variante,
        pxo_cantidad: item.pxo_cantidad,
        pxo_valor: item.pxo_valor,
        pxo_subtotal: Number((item.pxo_cantidad * item.pxo_valor).toFixed(2))
      }))
    };

    const success = await onUpdateOrder(order.id_compra!, payload);
    if (success) {
      setIsEditing(false);
      onOpenChange(false);
    }
  };

  const handleStatusChange = async (newStatus: 'ABI' | 'APR' | 'ANU') => {
    const success = await onUpdateOrderStatus(order.id_compra!, newStatus);
    if (success) {
      onOpenChange(false);
    }
  };

  const provName = suppliers.find(s => s.id_proveedor === order.id_proveedor)?.prv_nombre || `ID: ${order.id_proveedor}`;
  const formattedDate = order.oc_fecha ? new Date(order.oc_fecha).toLocaleDateString() : "";

  const badgeStyles = 
    order.oc_estado === 'APR' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30' : 
    order.oc_estado === 'ABI' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30' : 
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30';

  const statusLabel = 
    order.oc_estado === 'APR' ? 'Aprobada' : 
    order.oc_estado === 'ABI' ? 'Abierta' : 'Anulada';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-4">
            <span className="flex items-center gap-2">
              Orden de Compra #{order.id_compra}
              <Badge variant="outline" className={badgeStyles}>{statusLabel}</Badge>
            </span>
            {order.oc_estado === 'ANU' && (
              <span className="text-destructive font-bold text-sm tracking-wider flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" /> ANULADA
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Creada el {formattedDate}. Visualización y control según rol de acceso.
          </DialogDescription>
        </DialogHeader>

        {order.oc_estado === 'ANU' && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-lg p-3 text-center my-2">
            Esta orden de compra ha sido anulada y no puede recibir modificaciones ni cambios de estado.
          </div>
        )}

        <div className="grid gap-6 py-2">
          {/* Header Details */}
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_proveedor">Proveedor *</Label>
                <Select value={proveedorId} onValueChange={setProveedorId}>
                  <SelectTrigger id="edit_proveedor">
                    <SelectValue placeholder="Seleccione proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.prv_estado === 'ACT' || s.id_proveedor === order.id_proveedor).map(s => (
                      <SelectItem key={s.id_proveedor} value={s.id_proveedor?.toString() || ""}>
                        {s.prv_nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_fecha_ent">Fecha Entrega</Label>
                <Input
                  id="edit_fecha_ent"
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_iva_percent">Porcentaje IVA (%) *</Label>
                <Select value={ivaPercent} onValueChange={setIvaPercent}>
                  <SelectTrigger id="edit_iva_percent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 %</SelectItem>
                    <SelectItem value="15">15 %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-muted/20 p-3 rounded-lg">
              <div>
                <span className="text-muted-foreground block text-xs">Proveedor</span>
                <span className="font-semibold">{provName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Fecha Emisión</span>
                <span className="font-semibold">{formattedDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Fecha de Entrega</span>
                <span className="font-semibold">
                  {order.oc_fechaentrega ? new Date(order.oc_fechaentrega).toLocaleDateString() : "No definida"}
                </span>
              </div>
            </div>
          )}

          {/* Add Item form if editing */}
          {isEditing && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold mb-3">Agregar Item al Detalle</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit_product_sel">Producto</Label>
                  <Select value={selectedProduct} onValueChange={(val) => { setSelectedProduct(val); setSelectedColor(""); setSelectedSize(""); }}>
                    <SelectTrigger id="edit_product_sel">
                      <SelectValue placeholder="Seleccione producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueProducts.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit_color_sel">Color</Label>
                  <Select value={selectedColor} onValueChange={(val) => { setSelectedColor(val); setSelectedSize(""); }} disabled={!selectedProduct}>
                    <SelectTrigger id="edit_color_sel">
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
                  <Label htmlFor="edit_size_sel">Talla</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize} disabled={!selectedColor}>
                    <SelectTrigger id="edit_size_sel">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit_qty_opt">Cantidad</Label>
                  <Input
                    id="edit_qty_opt"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit_unit_cost">Costo Unitario ($)</Label>
                  <Input
                    id="edit_unit_cost"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value)))}
                  />
                </div>

                <div>
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
          )}

          {/* Details Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo Unitario</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  {isEditing && <TableHead className="text-right w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isEditing ? 5 : 4} className="text-center text-muted-foreground text-sm h-16">
                      No se han agregado productos a la orden.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => {
                    const variantName = variants.find(v => v.id_variante === item.id_variante)?.var_nombre || `Variante ${item.id_variante}`;
                    const subtotal = item.pxo_subtotal || (item.pxo_cantidad * item.pxo_valor);
                    return (
                      <TableRow key={idx}>
                        <TableCell>{variantName}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-20 h-8"
                              min="1"
                              value={item.pxo_cantidad}
                              onChange={(e) => handleUpdateItemQty(idx, Math.max(1, Number(e.target.value)))}
                            />
                          ) : (
                            item.pxo_cantidad
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              className="w-24 h-8"
                              step="0.01"
                              min="0.01"
                              value={item.pxo_valor}
                              onChange={(e) => handleUpdateItemCost(idx, Math.max(0.01, Number(e.target.value)))}
                            />
                          ) : (
                            `$${item.pxo_valor.toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${subtotal.toFixed(2)}
                        </TableCell>
                        {isEditing && (
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col items-end gap-1.5 text-sm font-semibold pr-4">
            <div>Subtotal: <span className="font-semibold">${calculatedSubtotal.toFixed(2)}</span></div>
            <div>IVA ({ivaPercent}%): <span className="font-semibold">${calculatedIvaVal.toFixed(2)}</span></div>
            <div className="text-base font-bold border-t pt-1 mt-1 text-primary">
              Total Final: <span>${calculatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Dialog Actions based on Role & State */}
        <DialogFooter className="flex flex-wrap gap-2 justify-between items-center sm:justify-between w-full mt-4">
          <div className="flex gap-2">
            {/* Editing actions */}
            {isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSaveChanges}>
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <>
                {/* Standard View actions */}
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
                {order.oc_estado === 'ABI' && (role === 'JEFE' || role === 'AUX') && (
                  <Button type="button" variant="outline" onClick={() => setIsEditing(true)} className="gap-1">
                    <Edit2 className="h-4 w-4" /> Editar
                  </Button>
                )}
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex gap-2">
              {/* JEFE Action: Approve Order */}
              {order.oc_estado === 'ABI' && role === 'JEFE' && (
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700 text-white gap-1"
                  onClick={() => handleStatusChange('APR')}
                >
                  <Check className="h-4 w-4" /> Aprobar Orden
                </Button>
              )}

              {/* JEFE Action: Cancel Order (Active in ABI, or emergency rollback in APR) */}
              {(order.oc_estado === 'ABI' || order.oc_estado === 'APR') && role === 'JEFE' && (
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => handleStatusChange('ANU')}
                >
                  <X className="h-4 w-4" /> Anular Orden
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
