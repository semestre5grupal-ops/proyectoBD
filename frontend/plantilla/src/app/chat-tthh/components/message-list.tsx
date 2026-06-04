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
        const isAgent = msg.senderId === 'agent';
        
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
