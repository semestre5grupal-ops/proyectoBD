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
      inyectarMensajeAgente(`¡Hola ${nombreUsuario}! Soy el Asesor Legal de Talento Humano.\n\nTu rol actual es: **${rolActivo.replace(/_/g, ' ')}**.\n\nPuedes consultarme sobre el Código del Trabajo de Ecuador, liquidaciones, despidos, vacaciones y la normativa del IESS.`);
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
      title="Asistente IA - Asesoría Legal Laboral (Ecuador)" 
      description="Consultas sobre el Código del Trabajo, IESS y obligaciones patronales en Ecuador"
    >
      <div className="flex flex-col h-[calc(100vh-140px)] print:h-auto print:block print:overflow-visible max-w-4xl mx-auto w-full bg-background print:bg-white border print:border-none shadow-sm print:shadow-none rounded-xl overflow-hidden mt-4 print:mt-0">
        
        {/* HEADER DEL CHAT */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-card print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <h2 className="font-semibold leading-none mb-1">Asesor Legal TTHH</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                En línea • {rolActivo.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} title="Generar PDF / Imprimir" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Generar Reporte
            </Button>
            <Button variant="ghost" size="icon" title="Ajustes del modelo">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {agentError && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 text-sm flex items-start justify-between print:hidden">
            <span className="flex-1">{agentError}</span>
            <button onClick={limpiarError} className="opacity-70 hover:opacity-100 p-1">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* LISTA DE MENSAJES (OCULTA EN IMPRESIÓN) */}
        <div className="flex-1 overflow-hidden print:hidden flex flex-col relative">
          <MessageListTTHH 
            mensajes={mensajes}
            agentThinking={agentThinking}
            onConfirmTask={confirmarTarea}
            onRejectTask={rechazarTarea}
          />
        </div>

        {/* REPORTE FORMAL (SOLO VISIBLE EN IMPRESIÓN) */}
        <div className="hidden print:block p-8 bg-white text-black w-full min-h-screen">
          <div className="text-center mb-10 border-b-2 border-black pb-6">
            <h1 className="text-3xl font-bold uppercase mb-2">Reporte de Asesoría Legal</h1>
            <h2 className="text-xl font-semibold text-gray-700">Departamento de Talento Humano</h2>
            <div className="mt-6 flex justify-between text-sm text-gray-600">
              <span><strong>Generado por:</strong> {nombreUsuario} ({rolActivo.replace(/_/g, ' ')})</span>
              <span><strong>Fecha:</strong> {new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          
          <div className="whitespace-pre-wrap text-base leading-relaxed text-black">
            {mensajes.filter(m => m.senderId === 'agent').pop()?.content || "No hay consultas procesadas para generar reporte."}
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
            <p>Este documento es un dictamen pericial generado por Inteligencia Artificial para el área de Talento Humano.</p>
            <p>Los cálculos de liquidación y asunciones legales se basan en el Código del Trabajo y la normativa vigente de Ecuador.</p>
          </div>
        </div>

        {/* ÁREA DE INPUT */}
        <div className="p-4 bg-card border-t print:hidden">
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
                placeholder={escuchando ? "Escuchando..." : "Realiza una consulta legal sobre legislación laboral ecuatoriana..."}
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
