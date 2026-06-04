# Contexto Actual del Proyecto — RDA3 ERP Comercial JW Cóndor
**Módulo:** Inventario (Agente IA + Microservicio)  
**Fecha de análisis:** 2026-06-03  
**Analista:** Agente Arquitecto (Read-Only)

---

# 1. Estado de Git y Ramas

## Rama actual
```
front-inventario  ← ACTIVA (working branch)
```

## Ramas locales
| Rama | Estado |
|---|---|
| `front-inventario` | ✅ Activa |
| `inventario` | Local, no activa |
| `interfaz-docs` | Local, no activa |
| `main` | Local, base de producción |

## Ramas remotas (`origin/`)
```
origin/main
origin/front-inventario
origin/inventario
origin/interfaz-docs
origin/interfaz-compras
origin/compras
origin/tthh
origin/ventas
```

## Estado de sincronización con `origin/main`
- **Commits ahead de origin/main:** `0` (rama completamente sincronizada con el remoto)
- **Archivos modificados sin commitear (working directory):**

| Archivo | Área |
|---|---|
| `backend/api-inventario/controllers/inventarioController.js` | Backend |
| `backend/api-inventario/models/inventarioModel.js` | Backend |
| `backend/api-inventario/routes/inventarioRoutes.js` | Backend |
| `frontend/plantilla/src/app/chat/components/task-card.tsx` | Frontend |
| `frontend/plantilla/src/app/chat/hooks/use-agent.ts` | Frontend |
| `frontend/plantilla/src/app/chat/prompts/system-prompts.ts` | Frontend |
| `frontend/plantilla/src/services/inventarioService.ts` | Frontend |

> [!CAUTION]
> Hay **7 archivos modificados localmente que NO han sido commiteados ni pusheados**. Si el servidor de CI/CD (Render/Vercel) usa la rama `front-inventario` del remoto, el backend y frontend en producción **NO tienen los cambios de la sesión actual**. Esta es la causa raíz de que las llamadas RPC fallen en Render.

---

# 2. Estructura de Directorios (Resumen)

## Backend (`backend/api-inventario/`)
```
api-inventario/
├── index.js                          ← Entry point Express (puerto 4000)
├── config/
│   └── db.js                         ← Cliente Supabase (createClient HTTP)
├── middlewares/
│   └── authMiddleware.js             ← verificarToken + restringirA (RBAC por rol)
├── models/
│   ├── inventarioModel.js            ← Acceso a Supabase (queries + RPC calls)
│   └── notificacionesModel.js        ← CRUD sobre tabla notificaciones_tareas
├── controllers/
│   ├── inventarioController.js       ← Lógica de negocio de stock y ajustes
│   └── notificacionesController.js   ← Lógica de lectura/escritura de notificaciones
└── routes/
    ├── inventarioRoutes.js           ← Todas las rutas bajo /api/inventario
    └── comprasIntegracionRoutes.js   ← Rutas de integración con módulo Compras
```

## Frontend (`frontend/plantilla/src/`)
```
src/
├── services/
│   └── inventarioService.ts          ← Capa HTTP hacia api-inventario
├── app/
│   └── chat/
│       ├── hooks/
│       │   └── use-agent.ts          ← Hook orquestador del Agente IA
│       ├── components/
│       │   ├── task-card.tsx         ← Componente visual de tarea pendiente
│       │   └── message-list.tsx      ← Renderizador del chat
│       ├── prompts/
│       │   └── system-prompts.ts     ← System prompts de Ollama por rol
│       ├── types/
│       │   └── erp-agent.ts          ← Tipos TypeScript (AccionInventario, etc.)
│       └── page.tsx                  ← Página principal del chat
```

---

# 3. Endpoints del Backend detectados (API Inventario)

**Prefijo base:** `/api/inventario`  
**Servidor:** Express en puerto `4000`

## Notificaciones de Tareas

| Método | Ruta | Middleware | Controlador | Descripción |
|---|---|---|---|---|
| `GET` | `/tareas/pendientes` | `verificarToken` | `notificacionesController.obtenerTareasPendientes` | Obtiene tareas `estado=pendiente` del rol del JWT |
| `POST` | `/tareas` | `verificarToken` | `notificacionesController.crearTarea` | Persiste una intención de IA en Supabase |
| `PUT` | `/tareas/:id/estado` | `verificarToken` | `notificacionesController.actualizarEstadoTarea` | Marca la tarea como ejecutada/rechazada |

## Stock

| Método | Ruta | Middleware | Controlador | Descripción |
|---|---|---|---|---|
| `GET` | `/stock/:idVariante` | `verificarToken` | `inventarioController.consultarStock` | Consulta stock de una variante |
| `POST` | `/ingresar` | `verificarToken` + JEFE/OPERATIVO | `inventarioController.ingresarStock` | Ingresa unidades al stock |
| `POST` | `/descontar` | `verificarToken` + JEFE/OPERATIVO | `inventarioController.descontarStock` | Descuenta unidades del stock |

## Ajustes (RPC a Supabase)

| Método | Ruta | Middleware | Controlador | Función RPC |
|---|---|---|---|---|
| `PUT` | `/ajustes/:id/aprobar` | `verificarToken` + JEFE/OPERATIVO | `inventarioController.aprobarAjuste` | `fn_aprobar_ajuste_inventario` |
| `POST` | `/ajustes/pendiente` | `verificarToken` + JEFE/OPERATIVO/**AUXILIAR** | `inventarioController.crearCabeceraPendiente` | INSERT en `ajustes` + `proxaju` |

## Recepciones y Entregas (RPC a Supabase)

| Método | Ruta | Middleware | Controlador | Función RPC |
|---|---|---|---|---|
| `PUT` | `/recepciones/:id/aprobar` | `verificarToken` + JEFE/OPERATIVO | `inventarioController.aprobarRecepcion` | `fn_aprobar_recepcion_inventario` |
| `PUT` | `/entregas/:id/aprobar` | `verificarToken` + JEFE/OPERATIVO | `inventarioController.aprobarEntrega` | `fn_aprobar_entrega_inventario` |

## Sincronización Cloud

| Método | Ruta | Middleware | Controlador | Descripción |
|---|---|---|---|---|
| `GET` | `/sincronizar-cloud` | `verificarToken` + **solo JEFE** | `inventarioController.sincronizarCloud` | Sincronización masiva hacia Firebase |

## Integración Compras (prefijo `/api`)
Montado en `comprasIntegracionRoutes.js` bajo `/api` (sin el prefijo `/inventario`).

---

# 4. URLs de Conexión en el Frontend

## Variables de Entorno (`.env` local)
```
VITE_API_INVENTARIO=http://localhost:4000         ← 🔴 APUNTA A LOCALHOST
VITE_API_TALENTO_HUMANO=https://api-talento-humano.onrender.com/api
VITE_URL_API_COMPRAS=https://proyectobd-dge1.onrender.com
VITE_API_VENTAS=https://proyectobd-api-ventas.onrender.com
```

> [!WARNING]
> `VITE_API_INVENTARIO` apunta a `localhost:4000`. Cuando el frontend se **despliega en Vercel**, esta variable debe apuntar a la URL de producción de Render. Si el `.env` de Vercel no está configurado con la URL real de Render, **todas las llamadas de inventario desde producción fallarán silenciosamente con CORS/Network Error**.

## Construcción de URL en `inventarioService.ts`
```typescript
const API_BASE_URL =
  (import.meta.env.VITE_API_INVENTARIO as string | undefined) ??
  "http://localhost:4000";
```

**Patrón de `apiFetch`:** Lee `jwt_token` de `localStorage`, lo inyecta como `Authorization: Bearer <TOKEN>`, y en caso de `401/403` elimina el token y redirige a `/auth/sign-in`.

---

# 5. Análisis del Hook `use-agent.ts`

## Flujo General del Pipeline

```
Voz/Texto usuario
    ↓
chatOllama() con streaming NDJSON (actualizarUltimoMensaje)
    ↓
Respuesta completa acumulada en `respuestaCompleta`
    ↓
[INTERCEPTOR] setMensajes → reemplaza burbuja con solo `mensaje_usuario` limpio
    ↓
parseAgentResponse() → TareaInventario
    ↓
¿accion === 'INFORMATIVO'?  → emitirVoz + return
    ↓
¿rol_destino !== rolActivo? → FLUJO DE DELEGACIÓN
    │    ↓ AUTORIZAR_AJUSTE → crearAjusteCabeceraPendiente (inserta en BD)
    │    ↓ CONFIRMAR_ENTREGA / CONFIRMAR_RECEPCION → payload directo
    │    ↓ crearNotificacionTarea (POST /tareas) → guarda en Supabase
    │    ↓ Mensaje informativo en UI, sin TaskCard
    ↓
¿confirmacion_requerida?    → TaskCard en UI (pendingTaskRef)
    ↓
confirmarTarea(id) → ejecutarTarea()
    ↓
Switch por accion → inventarioService.*()
    ↓
marcarNotificacionEjecutada() → PUT /tareas/:id/estado
    ↓
setMensajes → muta estado a 'ejecutada' (trazabilidad, NO elimina)
```

## Parseo JSON (`parseAgentResponse`)
- Extrae bloque JSON de respuesta raw (soporta markdown ```json ... ```)
- Busca el primer `{` y el último `}` para extraer el objeto
- `JSON.parse()` envuelto en try-catch → fallback a INFORMATIVO si falla
- Valida `accion` y `mensaje_usuario` como campos mínimos
- **Segunda línea de defensa:** Valida que `accion` esté en `PERMISOS_POR_ROL[rolActivo]`

## Interceptor Post-Streaming (agregado recientemente)
```typescript
const textoParaUI = tarea.mensaje_usuario || respuestaCompleta;
setMensajes(prev => prev.map(m =>
  m.id === thinkingId ? { ...m, content: textoParaUI } : m
));
```
Esto previene que el JSON crudo se muestre en la burbuja de chat.

## Sanitización Anti-Alucinaciones
Si el modelo devuelve `INGRESAR_STOCK` cuando la instrucción dice "entrega":
```typescript
if (instrLower.includes('entrega') || ...) tarea.accion = 'CONFIRMAR_ENTREGA';
if (instrLower.includes('recepcion') || ...) tarea.accion = 'CONFIRMAR_RECEPCION';
```

## Trazabilidad
- **NO elimina** la TaskCard del estado tras la ejecución
- La **muta** con `estado: 'ejecutada'`
- `task-card.tsx` renderiza el badge verde "✅ Tarea ejecutada" y **oculta los botones** cuando `esFinalizado === true`

---

# 6. Cuellos de Botella Detectados

## 🔴 CRÍTICO — Cambios locales no commiteados (Mayor causa de fallos en producción)

| Archivo crítico | Problema |
|---|---|
| `inventarioModel.js` | `crearCabeceraAjustePendiente` y `aprobarAjusteFisico` con `p_periodo` NO están en Render |
| `inventarioController.js` | `aprobarRecepcion` y `aprobarEntrega` NO existen en el servidor de producción |
| `inventarioRoutes.js` | Rutas `PUT /recepciones/:id/aprobar` y `PUT /entregas/:id/aprobar` NO están en Render |
| `inventarioService.ts` | `aprobarRecepcionCabecera` y `aprobarEntregaCabecera` solo existen localmente |
| `use-agent.ts` | Interceptor de respuesta, sanitizador anti-alucinaciones y casos `CONFIRMAR_ENTREGA` solo existen localmente |

**Solución inmediata:** `git add . && git commit -m "feat: RPC ajustes, recepciones, entregas + interceptor LLM" && git push origin front-inventario`

---

## 🔴 CRÍTICO — `CONFIRMAR_ENTREGA` no existe en el tipo `AccionInventario`

El tipo en `erp-agent.ts` (líneas 38-47) **no incluye `CONFIRMAR_ENTREGA`**:
```typescript
export type AccionInventario =
  | 'INGRESAR_STOCK'
  | 'DESCONTAR_STOCK'
  | ...
  | 'AUTORIZAR_AJUSTE';  // ← CONFIRMAR_ENTREGA no está aquí
```

Además, `PERMISOS_POR_ROL.JEFE_INVENTARIO` no incluye `CONFIRMAR_ENTREGA`, por lo que la segunda línea de defensa en `parseAgentResponse` **rechaza la acción y devuelve INFORMATIVO**. Esto hace que la notificación NUNCA llegue a Supabase aunque la sanitización post-parseo intente corregirlo.

**Solución:** Añadir `| 'CONFIRMAR_ENTREGA'` al tipo y a `PERMISOS_POR_ROL`.

---

## 🟡 ADVERTENCIA — `VITE_API_INVENTARIO` en Vercel apunta a localhost

Si la variable de entorno de Vercel no está configurada con la URL de Render, el frontend en producción fallará silenciosamente. Verificar en el dashboard de Vercel → Settings → Environment Variables.

---

## 🟡 ADVERTENCIA — CORS en backend (`index.js`)

```javascript
app.use(cors()); // Sin restricción de origins
```

En producción, `cors()` sin opciones acepta cualquier origen. Esto es funcional pero inseguro. Considerar restringir a los dominios de Vercel y del propio Render.

---

## 🟡 ADVERTENCIA — Detección de UUID local vs BD (lógica frágil)

En `use-agent.ts`:
```typescript
if (tarea.id.length !== 36) { // Si no es un UUID
  await marcarNotificacionEjecutada(tarea.id);
}
```
Esta lógica está **invertida**: solo marca como ejecutada si el ID **NO** tiene 36 caracteres (es decir, no es UUID). Los IDs de Supabase son UUIDs de 36 chars, por lo que **NUNCA se llama a `marcarNotificacionEjecutada`** para las tareas persistidas en BD.

**Solución:** Invertir la condición a `if (tarea.id.length === 36)` o eliminar la condición.

---

## 🟡 ADVERTENCIA — `PayloadInventario` no incluye `idCabecera`

```typescript
export interface PayloadInventario {
  idVariante?: number;
  cantidad?: number;
  idBodega?: number;
  descripcion?: string;
  usuario?: string;
  // ← idCabecera falta aquí
}
```

Todos los accesos a `payload.idCabecera` en `use-agent.ts` usan casting `as Record<string, any>` para evitar el error de TypeScript. Añadir `idCabecera?: number` al tipo resolvería esto formalmente.

---

## 🟢 INFO — Mapeo de roles del middleware

El middleware `authMiddleware.js` resuelve `id_rol` numérico → string:
```
id_rol 8  → JEFE_INVENTARIO
id_rol 9  → AUXILIAR_INVENTARIO
id_rol 10 → OPERATIVO_INVENTARIO
```

---

## Resumen de Prioridades de Acción

| Prioridad | Acción | Impacto |
|---|---|---|
| 🔴 P0 | `git push` de los 7 archivos modificados | Sincroniza producción con el trabajo actual |
| 🔴 P0 | Añadir `CONFIRMAR_ENTREGA` al tipo y permisos en `erp-agent.ts` | Sin esto, el flujo de entregas/ventas nunca se activa |
| 🔴 P0 | Verificar `VITE_API_INVENTARIO` en Vercel apunte a URL de Render | Sin esto, producción no puede comunicarse con el backend |
| 🟡 P1 | Corregir la condición `tarea.id.length !== 36` a `=== 36` | Las tareas de BD nunca se marcan como ejecutadas |
| 🟡 P1 | Añadir `idCabecera?: number` a `PayloadInventario` | Limpieza de tipado estricto |
| 🟢 P2 | Restringir `cors()` a dominios conocidos | Seguridad en producción |
