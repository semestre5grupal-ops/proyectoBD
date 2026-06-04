import React, { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import type { MensajeTTHH } from '@/app/chat-tthh/types/tthh-agent';
import { TaskCardTTHH } from './task-card';

interface MessageListProps {
  mensajes: MensajeTTHH[];
  onConfirmTask: (id: string) => void;
  onRejectTask: (id: string) => void;
  agentThinking: boolean;
}

export function MessageListTTHH({ mensajes, onConfirmTask, onRejectTask, agentThinking }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, agentThinking]);

  return (
    <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto p-4 space-y-6 print:space-y-4 print:text-black">
      {mensajes.length === 0 && !agentThinking && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4">
          <Bot className="h-12 w-12 opacity-20" />
          <p>¡Hola! Soy tu asistente de Talento Humano.</p>
          <p className="text-sm opacity-70">
            Prueba decir: "Contrata a Juan Pérez con cédula 17..." o "Crea el departamento de Marketing".
          </p>
        </div>
      )}

      {mensajes.map((msg) => {
        const isAgent = msg.senderId === 'agent' || msg.senderId === 'system';
        
        return (
          <div key={msg.id} className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}>
            {isAgent && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}
            
            <div className={`max-w-[85%] ${isAgent ? 'items-start' : 'items-end'}`}>
              {msg.type === 'task_card' && msg.tarea ? (
                <TaskCardTTHH 
                  tarea={msg.tarea} 
                  onConfirm={onConfirmTask} 
                  onReject={onRejectTask} 
                  disabled={msg.tarea.estado !== 'pendiente'}
                />
              ) : msg.type === 'employee_card' && msg.empleado_data ? (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700 shadow-md rounded-2xl p-5 mb-2 w-[350px] relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-500/30 overflow-hidden">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{msg.empleado_data.nombre}</h3>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{msg.empleado_data.cedula}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${msg.empleado_data.estado === 'ACT' || msg.empleado_data.estado === 'ACTIVO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {msg.empleado_data.estado === 'ACT' ? 'ACTIVO' : msg.empleado_data.estado}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/50 dark:border-slate-600/50">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Sueldo Base</p>
                      <p className="font-bold text-gray-800 dark:text-gray-100">${Number(msg.empleado_data.sueldoBase || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/50 dark:border-slate-600/50">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">Vacaciones</p>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{msg.empleado_data.vacSaldoTotal} <span className="text-xs font-normal text-gray-500">días</span></p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-indigo-100/50 dark:border-slate-700/50 flex justify-between text-xs text-gray-500 dark:text-gray-400 relative z-10">
                    <span className="truncate pr-2">✉️ {msg.empleado_data.correo}</span>
                    <span className="flex-shrink-0">📞 {msg.empleado_data.telefono}</span>
                  </div>
                </div>
              ) : (
                <div 
                  className={`px-4 py-3 rounded-2xl whitespace-pre-wrap break-words print:text-black print:bg-transparent print:border print:border-gray-300 print:shadow-none ${
                    isAgent 
                      ? 'bg-muted/60 text-foreground rounded-tl-sm' 
                      : 'bg-primary text-primary-foreground rounded-tr-sm'
                  }`}
                >
                  {msg.content}
                </div>
              )}
              
              <div className={`text-xs text-muted-foreground mt-1 px-1 ${isAgent ? 'text-left' : 'text-right'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {!isAgent && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </div>
        );
      })}

      {agentThinking && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div className="bg-muted/60 text-foreground px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-12">
            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}
