import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, XCircle, Briefcase, Users, UserPlus } from 'lucide-react';
import type { TareaTTHH, AccionTTHH } from '@/app/chat-tthh/types/tthh-agent';

interface TaskCardProps {
  tarea: TareaTTHH;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  disabled?: boolean;
}

const actionIcons: Record<AccionTTHH, React.ReactNode> = {
  CREAR_EMPLEADO: <UserPlus className="h-5 w-5 text-blue-500" />,
  CREAR_DEPARTAMENTO: <Briefcase className="h-5 w-5 text-purple-500" />,
  CREAR_CARGO: <Briefcase className="h-5 w-5 text-emerald-500" />,
  CONSULTAR_EMPLEADO: <Users className="h-5 w-5 text-blue-400" />,
  GENERAR_ROL_PAGO: <Clock className="h-5 w-5 text-yellow-500" />,
  INFORMATIVO: <AlertCircle className="h-5 w-5 text-gray-500" />
};

export function TaskCardTTHH({ tarea, onConfirm, onReject, disabled = false }: TaskCardProps) {
  const { id, accion, payload, mensaje_usuario, estado, timestamp } = tarea;

  return (
    <Card className="w-full max-w-md border shadow-sm transition-all duration-200">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {actionIcons[accion] || <AlertCircle className="h-5 w-5 text-gray-500" />}
          <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {accion.replace(/_/g, ' ')}
          </CardTitle>
        </div>
        
        {estado === 'pendiente' && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>
        )}
        {estado === 'confirmada' && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmada</Badge>
        )}
        {estado === 'ejecutada' && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ejecutada</Badge>
        )}
        {estado === 'rechazada' && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazada</Badge>
        )}
        {estado === 'error' && (
          <Badge variant="destructive">Error</Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-base font-medium leading-snug">{mensaje_usuario}</p>
        
        <div className="bg-muted/50 rounded-md p-3 text-sm font-mono whitespace-pre-wrap break-words border">
          {Object.entries(payload).map(([key, value]) => (
            <div key={key} className="flex justify-between items-start py-0.5">
              <span className="text-muted-foreground capitalize mr-2">{key.replace(/_/g, ' ')}:</span>
              <span className="text-foreground text-right">{String(value)}</span>
            </div>
          ))}
          {Object.keys(payload).length === 0 && (
            <span className="text-muted-foreground italic">Sin parámetros adicionales</span>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground text-right">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </CardContent>

      {estado === 'pendiente' && (
        <CardFooter className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => onReject(id)}
            disabled={disabled}
          >
            <XCircle className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
            onClick={() => onConfirm(id)}
            disabled={disabled}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
