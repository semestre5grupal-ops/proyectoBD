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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, MoreHorizontal, SendHorizontal, CheckCircle2, XCircle,
  FileText, CreditCard, Trash2,
} from "lucide-react";
import type { Documento, Cliente, Vendedor, MetodoPago, PagoInput } from "../services/ventas-service";

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

// ── Badges ────────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = { PRO: "Proforma", FAC: "Factura", NCR: "N. Crédito" };
const TIPO_CLASS: Record<string, string> = {
  PRO: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30",
  FAC: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30",
  NCR: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800/30",
};

const ESTADO_LABELS: Record<string, string> = {
  BOR: "Borrador", EMI: "Emitido", APR: "Aprobado", ANU: "Anulado",
};
const ESTADO_CLASS: Record<string, string> = {
  BOR: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-950/20 dark:text-zinc-400 dark:border-zinc-800/30",
  EMI: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30",
  APR: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30",
  ANU: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface DocumentosTabProps {
  documentos: Documento[];
  clientes: Cliente[];
  vendedores: Vendedor[];
  metodosPago: MetodoPago[];
  onCreateDocumento: (payload: Omit<Documento, "id_documento">) => Promise<boolean>;
  onDeleteDocumento: (id: number) => Promise<boolean>;
  onEmitir: (id: number) => Promise<boolean>;
  onAprobar: (id: number, pagos: PagoInput[]) => Promise<boolean>;
  onAnular: (id: number) => Promise<boolean>;
  onGenerarFactura: (id: number) => Promise<boolean>;
  onGenerarNCR: (id: number, descripcion?: string) => Promise<boolean>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentosTab({
  documentos, clientes, vendedores, metodosPago,
  onCreateDocumento, onDeleteDocumento,
  onEmitir, onAprobar, onAnular, onGenerarFactura, onGenerarNCR,
}: DocumentosTabProps) {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAprobarOpen, setIsAprobarOpen] = useState(false);
  const [isNCROpen, setIsNCROpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);

  // Create form state
  const [tipo, setTipo] = useState("PRO");
  const [idCliente, setIdCliente] = useState("");
  const [idVendedor, setIdVendedor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [iva, setIva] = useState("0");
  const [descuento, setDescuento] = useState("0");

  // Aprobar form state
  const [idMetodo, setIdMetodo] = useState("");
  const [montoAprobar, setMontoAprobar] = useState("");
  const [referencia, setReferencia] = useState("");

  // NCR form state
  const [ncrDescripcion, setNcrDescripcion] = useState("");

  const resetCreate = () => {
    setTipo("PRO"); setIdCliente(""); setIdVendedor("");
    setDescripcion(""); setSubtotal(""); setIva("0"); setDescuento("0");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const sub = parseFloat(subtotal) || 0;
    const ivaVal = parseFloat(iva) || 0;
    const descVal = parseFloat(descuento) || 0;
    const total = sub + ivaVal - descVal;

    const ok = await onCreateDocumento({
      id_cliente: Number(idCliente),
      id_vendedor: Number(idVendedor),
      doc_id_documento: null,
      doc_tipo: tipo,
      doc_emision: new Date().toISOString(),
      doc_pago: null,
      doc_descripcion: descripcion,
      doc_subtotal: sub,
      doc_iva: ivaVal,
      doc_descuento: descVal,
      doc_total: total,
      doc_estado: "BOR",
    });
    if (ok) { setIsCreateOpen(false); resetCreate(); }
  };

  const handleAprobar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc?.id_documento) return;
    const pagos: PagoInput[] = [{
      id_metodopago: Number(idMetodo),
      monto: parseFloat(montoAprobar) || selectedDoc.doc_total,
      referencia: referencia || undefined,
    }];
    const ok = await onAprobar(selectedDoc.id_documento, pagos);
    if (ok) { setIsAprobarOpen(false); setSelectedDoc(null); setIdMetodo(""); setMontoAprobar(""); setReferencia(""); }
  };

  const handleNCR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc?.id_documento) return;
    const ok = await onGenerarNCR(selectedDoc.id_documento, ncrDescripcion || undefined);
    if (ok) { setIsNCROpen(false); setSelectedDoc(null); setNcrDescripcion(""); }
  };

  const clienteNombre = (id: number) => clientes.find(c => c.id_cliente === id)?.cli_nombre ?? `Cliente #${id}`;
  const vendedorNombre = (id: number) => {
    const v = vendedores.find(v => v.id_vendedor === id);
    return v ? `Vendedor #${v.id_vendedor}` : `Vendedor #${id}`;
  };

  const filtered = documentos.filter(d => {
    const nombre = clienteNombre(d.id_cliente).toLowerCase();
    const desc = d.doc_descripcion.toLowerCase();
    const q = search.toLowerCase();
    return nombre.includes(q) || desc.includes(q) || String(d.id_documento).includes(q);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, descripción, ID..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" /> Nuevo Documento
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos de Venta</CardTitle>
          <CardDescription>
            Proformas, facturas y notas de crédito. Use el menú de acciones para ejecutar transiciones de estado.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No hay documentos.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(doc => (
                  <TableRow key={doc.id_documento}>
                    <TableCell className="font-mono text-xs">#{doc.id_documento}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={TIPO_CLASS[doc.doc_tipo] ?? ""}>
                        {TIPO_LABELS[doc.doc_tipo] ?? doc.doc_tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ESTADO_CLASS[doc.doc_estado] ?? ""}>
                        {ESTADO_LABELS[doc.doc_estado] ?? doc.doc_estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{clienteNombre(doc.id_cliente)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                      {doc.doc_descripcion}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(doc.doc_emision).toLocaleDateString("es-EC")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {usd.format(doc.doc_total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Transiciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {/* Emitir: BOR → EMI */}
                          {doc.doc_estado === "BOR" && (
                            <DropdownMenuItem
                              onClick={() => doc.id_documento && onEmitir(doc.id_documento)}
                              className="gap-2"
                            >
                              <SendHorizontal className="h-4 w-4" /> Emitir
                            </DropdownMenuItem>
                          )}

                          {/* Generar Factura: PRO + EMI → FAC */}
                          {doc.doc_tipo === "PRO" && doc.doc_estado === "EMI" && (
                            <DropdownMenuItem
                              onClick={() => doc.id_documento && onGenerarFactura(doc.id_documento)}
                              className="gap-2"
                            >
                              <FileText className="h-4 w-4" /> Generar Factura
                            </DropdownMenuItem>
                          )}

                          {/* Aprobar: FAC + EMI → APR */}
                          {doc.doc_tipo === "FAC" && doc.doc_estado === "EMI" && (
                            <DropdownMenuItem
                              onClick={() => { setSelectedDoc(doc); setMontoAprobar(String(doc.doc_total)); setIsAprobarOpen(true); }}
                              className="gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Aprobar (registrar pago)
                            </DropdownMenuItem>
                          )}

                          {/* Generar NCR: FAC + APR → NCR */}
                          {doc.doc_tipo === "FAC" && doc.doc_estado === "APR" && (
                            <DropdownMenuItem
                              onClick={() => { setSelectedDoc(doc); setIsNCROpen(true); }}
                              className="gap-2"
                            >
                              <CreditCard className="h-4 w-4" /> Generar Nota de Crédito
                            </DropdownMenuItem>
                          )}

                          {/* Anular: cualquiera que no sea APR ni ANU */}
                          {!["APR", "ANU"].includes(doc.doc_estado) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => doc.id_documento && onAnular(doc.id_documento)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <XCircle className="h-4 w-4" /> Anular
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Eliminar: solo BOR */}
                          {doc.doc_estado === "BOR" && (
                            <DropdownMenuItem
                              onClick={() => doc.id_documento && onDeleteDocumento(doc.id_documento)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" /> Eliminar borrador
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal: Crear Documento ─────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Nuevo Documento</DialogTitle>
              <DialogDescription>
                Crea un borrador de proforma o factura. Podrás emitirlo desde la tabla.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tipo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRO">Proforma</SelectItem>
                    <SelectItem value="FAC">Factura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Cliente *</Label>
                <Select value={idCliente} onValueChange={setIdCliente}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id_cliente} value={String(c.id_cliente)}>
                        {c.cli_nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Vendedor *</Label>
                <Select value={idVendedor} onValueChange={setIdVendedor}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map(v => (
                      <SelectItem key={v.id_vendedor} value={String(v.id_vendedor)}>
                        Vendedor #{v.id_vendedor} — {v.ven_estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Descripción *</Label>
                <Input
                  className="col-span-3"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  required
                  maxLength={50}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Subtotal *</Label>
                <Input
                  className="col-span-3"
                  type="number"
                  step="0.01"
                  min="0"
                  value={subtotal}
                  onChange={e => setSubtotal(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">IVA</Label>
                <Input
                  className="col-span-3"
                  type="number"
                  step="0.01"
                  min="0"
                  value={iva}
                  onChange={e => setIva(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Descuento</Label>
                <Input
                  className="col-span-3"
                  type="number"
                  step="0.01"
                  min="0"
                  value={descuento}
                  onChange={e => setDescuento(e.target.value)}
                />
              </div>

              <div className="col-span-4 text-right pr-1 text-sm font-semibold text-muted-foreground">
                Total estimado:{" "}
                {usd.format((parseFloat(subtotal) || 0) + (parseFloat(iva) || 0) - (parseFloat(descuento) || 0))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!idCliente || !idVendedor || !descripcion || !subtotal}>
                Crear borrador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Aprobar con pago ────────────────────────────────────────── */}
      <Dialog open={isAprobarOpen} onOpenChange={setIsAprobarOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleAprobar}>
            <DialogHeader>
              <DialogTitle>Aprobar Factura #{selectedDoc?.id_documento}</DialogTitle>
              <DialogDescription>
                Registra el pago para aprobar esta factura por {usd.format(selectedDoc?.doc_total ?? 0)}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Método *</Label>
                <Select value={idMetodo} onValueChange={setIdMetodo}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccione método" />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosPago.filter(m => m.mpg_estado).map(m => (
                      <SelectItem key={m.id_metodopago} value={String(m.id_metodopago)}>
                        {m.mpg_nombre.trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Monto *</Label>
                <Input
                  className="col-span-3"
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoAprobar}
                  onChange={e => setMontoAprobar(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Referencia</Label>
                <Input
                  className="col-span-3"
                  value={referencia}
                  onChange={e => setReferencia(e.target.value)}
                  placeholder="Nro. de transferencia, cheque..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAprobarOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!idMetodo || !montoAprobar}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Aprobar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Generar NCR ─────────────────────────────────────────────── */}
      <Dialog open={isNCROpen} onOpenChange={setIsNCROpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleNCR}>
            <DialogHeader>
              <DialogTitle>Generar Nota de Crédito</DialogTitle>
              <DialogDescription>
                Genera una NCR a partir de la Factura #{selectedDoc?.id_documento}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Motivo</Label>
                <Textarea
                  className="col-span-3 resize-none"
                  rows={3}
                  value={ncrDescripcion}
                  onChange={e => setNcrDescripcion(e.target.value)}
                  placeholder="Motivo de la devolución (opcional)..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNCROpen(false)}>Cancelar</Button>
              <Button type="submit">
                <CreditCard className="h-4 w-4 mr-2" /> Generar NCR
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
