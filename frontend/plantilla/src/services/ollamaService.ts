/**
 * ollamaService.ts
 * -----------------
 * CLIENTE HTTP PARA OLLAMA LOCAL
 * Proyecto RDA3 · Módulo de Inventario (Paul)
 *
 * Conecta al servidor Ollama local (puerto 11434) a través del proxy de Vite.
 * No usa Axios — el fetch nativo con ReadableStream es suficiente y evita
 * añadir dependencias al proyecto.
 *
 * Golden Rules:
 *  ✅ No usa hooks de React ni modifica el DOM.
 *  ✅ No maneja estado global — solo I/O puro.
 *  ✅ Compatible con el proxy Vite: target /ollama → http://localhost:11434
 *
 * Proxy Vite configurado en vite.config.ts:
 *   '/ollama' → 'http://localhost:11434'  (rewrite elimina /ollama del path)
 *   Resultado: fetch('/ollama/api/chat') → POST http://localhost:11434/api/chat
 */

// ─── Endpoint vía proxy Vite (sin CORS) ──────────────────────────────────────
const OLLAMA_ENDPOINT = '/ollama/api/chat';

// ─── Modelo por defecto: lee la variable de entorno o usa llama3.2 ────────────
const DEFAULT_MODEL =
  (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'qwen2.5:1.5b';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

/** Mensaje del historial de conversación en formato Ollama */
export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Fragmento de la respuesta NDJSON de Ollama (modo stream: true) */
interface OllamaStreamChunk {
  model: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
}

/** Opciones de configuración para chatOllama */
export interface ChatOllamaOptions {
  /** Modelo Ollama a usar. Por defecto: VITE_OLLAMA_MODEL ?? 'llama3.2' */
  model?: string;
  /** AbortSignal para cancelar la generación desde el componente */
  signal?: AbortSignal;
  /** Temperatura del modelo (0 = determinista, 1 = creativo). Default: 0.1 */
  temperature?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — chatOllama con streaming
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Envía un historial de mensajes a Ollama y consume la respuesta en streaming.
 *
 * @param messages    - Array de mensajes [system, ...historial, user_actual]
 * @param onChunk     - Callback llamado por cada fragmento de texto recibido.
 *                      Úsalo para actualizar la UI en tiempo real (streaming effect).
 * @param options     - Configuración opcional (modelo, signal de cancelación, temperatura)
 * @returns           - El texto completo ensamblado al finalizar el stream
 *
 * Flujo de datos:
 *   POST /ollama/api/chat (stream: true)
 *   → Response body como ReadableStream
 *   → Decodificar cada chunk como UTF-8
 *   → Parsear NDJSON línea por línea
 *   → Extraer message.content de cada fragmento
 *   → Llamar onChunk(delta) para actualizar la UI
 *
 * Errores manejados:
 *   - Ollama no disponible (network error): lanza Error con mensaje descriptivo
 *   - Respuesta HTTP != 200: lanza Error con status code
 *   - AbortError (cancelación): propaga silenciosamente (el caller decide qué mostrar)
 */
export async function chatOllama(
  messages: OllamaMessage[],
  onChunk: (delta: string) => void,
  options: ChatOllamaOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    signal,
    temperature = 0.1, // Temperatura baja → respuestas JSON más deterministas
  } = options;

  // ── 1. Ejecutar la petición al proxy Vite ──────────────────────────────────
  let response: Response;
  try {
    response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: { temperature },
      }),
      signal,
    });
  } catch (err) {
    // AbortError: el usuario canceló la generación — propagar para que el caller limpie
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    // Error de red: Ollama no está corriendo
    throw new Error(
      'No se pudo conectar con Ollama. Verifica que el servidor esté activo en http://localhost:11434'
    );
  }

  if (!response.ok) {
    throw new Error(
      `Ollama devolvió un error HTTP ${response.status}. Verifica que el modelo "${model}" esté instalado.`
    );
  }

  if (!response.body) {
    throw new Error('La respuesta de Ollama no contiene un stream de datos.');
  }

  // ── 2. Leer el ReadableStream en modo NDJSON ───────────────────────────────
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = ''; // Buffer para líneas incompletas entre chunks

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decodificar el chunk binario a texto
      buffer += decoder.decode(value, { stream: true });

      // Procesar líneas completas (separadas por \n)
      const lines = buffer.split('\n');
      // La última línea puede estar incompleta — guardarla en el buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const chunk = JSON.parse(trimmed) as OllamaStreamChunk;
          const delta = chunk.message?.content ?? '';
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // Línea NDJSON malformada — ignorar (puede ser el payload final de Ollama)
          console.warn('[ollamaService] Chunk no parseable:', trimmed);
        }
      }
    }

    // Procesar el buffer restante si hay contenido
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer.trim()) as OllamaStreamChunk;
        const delta = chunk.message?.content ?? '';
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      } catch {
        // Ignorar buffer final malformado
      }
    }
  } finally {
    // Liberar el reader aunque haya un error
    reader.releaseLock();
  }

  return fullText;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDAD — Verificar si Ollama está disponible (ping)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si el servidor Ollama local está respondiendo.
 * Útil para mostrar un indicador de estado en la UI antes de enviar mensajes.
 *
 * @returns true si Ollama responde con HTTP 200, false en cualquier otro caso
 */
export async function verificarOllama(): Promise<boolean> {
  try {
    const response = await fetch('/ollama/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // Timeout de 3 segundos
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Devuelve la lista de modelos instalados en Ollama local.
 * Útil para validar que 'llama3.2' (u otro) esté disponible.
 */
export async function listarModelosOllama(): Promise<string[]> {
  try {
    const response = await fetch('/ollama/api/tags');
    if (!response.ok) return [];
    const data = await response.json() as { models?: Array<{ name: string }> };
    return (data.models ?? []).map(m => m.name);
  } catch {
    return [];
  }
}
