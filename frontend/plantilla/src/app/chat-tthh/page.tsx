"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Settings2, Trash2 } from 'lucide-react';

import { BaseLayout } from '@/components/layouts/base-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTTHHAgent } from './hooks/use-tthh-agent';
import { MessageListTTHH } from './components/message-list';

export default function ChatTTHHPage() {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    mensajes,
    agentThinking,
    agentError,
    rolActivo,
    nombreUsuario,
    escuchando,
    sendMessage,
    toggleVoz,
    confirmarTarea,
    rechazarTarea,
    cancelarGeneracion,
    limpiarError,
    inyectarMensajeAgente
  } = useTTHHAgent();

  // Bienvenida inicial
  useEffect(() => {
    if (mensajes.length === 0) {
      inyectarMensajeAgente(`¡Hola ${nombreUsuario}! Soy el Agente IA de Talento Humano.\n\nTu rol actual es: **${rolActivo.replace(/_/g, ' ')}**.\n\nPuedes pedirme que contrate empleados, cree departamentos o consulte información.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || agentThinking) return;
    const texto = inputValue;
    setInputValue('');
    await sendMessage(texto);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  return (
    <BaseLayout 
      title="Asistente IA - Talento Humano" 
      description="Agentic Task Center para gestionar RRHH con lenguaje natural"
    >
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full bg-background border shadow-sm rounded-xl overflow-hidden mt-4">
        
        {/* HEADER DEL CHAT */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h2 className="font-semibold leading-none mb-1">Agente TTHH</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                En línea • {rolActivo.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Ajustes del modelo">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {agentError && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-start justify-between">
            <span className="flex-1">{agentError}</span>
            <button onClick={limpiarError} className="opacity-70 hover:opacity-100 p-1">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* LISTA DE MENSAJES */}
        <MessageListTTHH 
          mensajes={mensajes}
          agentThinking={agentThinking}
          onConfirmTask={confirmarTarea}
          onRejectTask={rechazarTarea}
        />

        {/* ÁREA DE INPUT */}
        <div className="p-4 bg-card border-t">
          {agentThinking && (
            <div className="flex justify-center mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cancelarGeneracion}
                className="text-xs h-7 rounded-full bg-background"
              >
                Detener generación
              </Button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
            <div className="relative flex-1 flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute left-2 z-10 rounded-full w-8 h-8 transition-colors ${
                  escuchando ? 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700' : 'text-muted-foreground'
                }`}
                onClick={toggleVoz}
                title={escuchando ? "Detener micrófono" : "Dictar por voz"}
              >
                {escuchando ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
              </Button>
              
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={escuchando ? "Escuchando... di 'confirmar' o 'cancelar'" : "Escribe tu orden para RRHH..."}
                className="pl-12 pr-12 py-6 rounded-2xl bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                disabled={agentThinking}
                autoFocus
              />
            </div>
            
            <Button 
              type="submit" 
              size="icon"
              disabled={!inputValue.trim() || agentThinking}
              className="rounded-full h-12 w-12 flex-shrink-0 shadow-sm"
            >
              <Send className="h-5 w-5 ml-1" />
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Desarrollado con Ollama Llama 3 🦙
            </span>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
