# 📋 CONTEXTO ACTUAL DEL PROYECTO — Sistema Distribuido RDA3
## "Comercial JW Cóndor" — Fuente Única de Verdad (Single Source of Truth)

> **⚠️ INSTRUCCIONES PARA IAs COLABORADORAS:**
> Este archivo es el punto de partida OBLIGATORIO para cualquier IA que trabaje en este repositorio.
> Léelo completo antes de generar cualquier código, archivo o sugerencia.
> No alucines rutas, endpoints ni estructuras que no estén aquí documentadas explícitamente.
> Si algo no está en este documento, pregunta antes de inventarlo.

---

## Tabla de Contenidos
1. [Arquitectura General del Sistema](#1-arquitectura-general-del-sistema)
2. [Estructura Real del Repositorio](#2-estructura-real-del-repositorio)
3. [Estado del Microservicio de Inventario — PAUL (100% Completado)](#3-estado-del-microservicio-de-inventario--paul-100-completado)
4. [Reglas Estrictas de Desarrollo (Golden Rules)](#4-reglas-estrictas-de-desarrollo-golden-rules)
5. [Objetivo Inmediato — Fase Frontend](#5-objetivo-inmediato--fase-frontend)
6. [Mapa de Integrantes y Módulos](#6-mapa-de-integrantes-y-módulos)
7. [Autenticación Centralizada (SSO con JWT)](#7-autenticación-centralizada-sso-con-jwt)
8. [Variables de Entorno](#8-variables-de-entorno)

---

## 1. Arquitectura General del Sistema

### Descripción
El proyecto implementa un **ERP distribuido de múltiples microservicios** con arquitectura híbrida (SQL + NoSQL) para la empresa "Comercial JW Cóndor".

### Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENTE (Navegador)                             │
│         Frontend React/Vite — Plantilla Shadcn/ui                   │
│              Desplegado en: VERCEL                                   │
│        (frontend/plantilla/ — patrón MVC propio)                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  HTTP + JWT (Authorization: Bearer <token>)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Render)                               │
│            4 Microservicios Node.js/Express INDEPENDIENTES           │
│                                                                      │
│  ┌─────────────────────┐    ┌────────────────────────────────────┐  │
│  │  api-talento-humano │    │          api-ventas                │  │
│  │  (SSO/Auth/JWT)     │    │    (Facturación, Pedidos)          │  │
│  │  Puerto local: 3001 │    │    Puerto local: 3003              │  │
│  └──────────┬──────────┘    └────────────────┬───────────────────┘  │
│             │                                │ HTTP (/descontar)    │
│             │                                ▼                      │
│  ┌──────────▼──────────┐    ┌────────────────────────────────────┐  │
│  │    api-compras      │    │        api-inventario (LIVE ✅)    │  │
│  │  (Proveedores, OC)  │    │  https://api-inventario-1r1w       │  │
│  │  Puerto local: 3002 │    │         .onrender.com              │  │
│  └─────────────────────┘    └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   BASES DE DATOS (Supabase)                          │
│         FRAGMENTACIÓN VERTICAL — Aislamiento Total por Módulo        │
│                                                                      │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │  DB Talento Humano   │    │        DB Ventas                 │   │
│  │  (usuarios, roles)   │    │  (facturas, pedidos, clientes)   │   │
│  └──────────────────────┘    └──────────────────────────────────┘   │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │     DB Compras       │    │       DB Inventario (SEEDED ✅)  │   │
│  │  (proveedores, OC)   │    │  1,000 registros por tabla       │   │
│  └──────────────────────┘    └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SINCRONIZACIÓN NoSQL (Firebase Realtime DB)             │
│         Catálogo E-commerce — Actualizado por api-inventario         │
│       Endpoint: GET /api/inventario/sincronizar-cloud                │
│       Nodo en Firebase: /catalogo_ecommerce.json                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Decisiones Técnicas de Arquitectura

| Capa | Tecnología | Plataforma de Despliegue | Propósito |
|---|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Shadcn/ui | Vercel | Interfaz de usuario, dashboards por módulo |
| Backend (x4) | Node.js + Express.js (CommonJS) | Render | Microservicios con lógica de negocio |
| Base de Datos Relacional | Supabase (PostgreSQL) | Supabase Cloud | Persistencia por fragmentación vertical |
| Base de Datos NoSQL | Firebase Realtime Database | Firebase Cloud | Catálogo e-commerce sincronizado |
| Auth | JWT con clave secreta compartida (`JWT_SECRET`) | Distribuido | SSO ligero sin base de datos central |

---

## 2. Estructura Real del Repositorio

### Árbol Completo Validado Localmente

```
proyectoBD/                          ← Raíz del proyecto
│
├── .env.example                     ← Plantilla de variables de entorno para todos los equipos
├── .gitignore                       ← node_modules y .env ignorados
├── README.md                        ← Reglas de trabajo del equipo (lectura obligatoria)
├── supabase_migration.sql           ← Script SQL maestro (34 MB — esquema + 1,000 registros/tabla)
├── CONTEXTO_ACTUAL_PROYECTO.md      ← Este archivo (Single Source of Truth)
│
├── frontend/
│   └── plantilla/                   ← Plantilla base: Shadcn Dashboard + Landing Template
│       │                               Stack: React 18 + Vite + TypeScript + TailwindCSS + Shadcn/ui
│       ├── index.html               ← Entry point HTML (sin lógica inline)
│       ├── vite.config.ts           ← Configuración Vite
│       ├── tsconfig.json            ← Configuración TypeScript
│       ├── package.json             ← Dependencias (pnpm workspace)
│       ├── pnpm-workspace.yaml
│       ├── components.json          ← Configuración Shadcn/ui
│       ├── public/                  ← Assets estáticos
│       │   ├── favicon.png
│       │   ├── favicon-dark.png
│       │   ├── dashboard.png
│       │   ├── dashboard-dark.png
│       │   ├── dashboard-light.png
│       │   ├── apps.png
│       │   ├── customizer.png
│       │   ├── og-image.png
│       │   ├── hero-images-container.png
│       │   ├── feature-1-dark.png / feature-1-light.png
│       │   ├── feature-2-dark.png / feature-2-light.png
│       │   └── vite.svg
│       └── src/
│           ├── main.tsx             ← Punto de entrada React
│           ├── App.tsx              ← Router + ThemeProvider + SidebarConfigProvider
│           ├── App.css
│           ├── index.css            ← Estilos globales + variables CSS
│           ├── vite-env.d.ts
│           ├── app/                 ← Páginas de la aplicación (enrutadas por react-router-dom)
│           │   ├── auth/            ← Sign-in, Sign-up, Forgot password (múltiples variantes)
│           │   ├── calendar/
│           │   ├── chat/
│           │   ├── dashboard/       ← Dashboard principal (página de aterrizaje)
│           │   │   ├── page.tsx     ← Página Dashboard
│           │   │   ├── components/  ← Componentes específicos del dashboard
│           │   │   │   ├── chart-area-interactive.tsx
│           │   │   │   ├── data-table.tsx
│           │   │   │   └── section-cards.tsx
│           │   │   ├── data/        ← Datos mock (data.json, etc.)
│           │   │   └── schemas/
│           │   ├── dashboard-2/     ← Variante alternativa de dashboard
│           │   ├── errors/          ← Páginas 401, 403, 404, 500
│           │   ├── faqs/
│           │   ├── landing/         ← Landing page pública
│           │   ├── mail/
│           │   ├── pricing/
│           │   ├── settings/        ← User, Account, Billing, Appearance, etc.
│           │   ├── tasks/
│           │   └── users/
│           ├── assets/              ← Imágenes importadas por código
│           ├── components/          ← Componentes reutilizables globales
│           │   ├── app-sidebar.tsx  ← Sidebar de navegación (Dashboards, Apps, Pages)
│           │   ├── nav-main.tsx     ← Navegación principal
│           │   ├── nav-user.tsx     ← Bloque de usuario en el sidebar
│           │   ├── nav-secondary.tsx
│           │   ├── logo.tsx
│           │   ├── mode-toggle.tsx  ← Selector Dark/Light mode
│           │   ├── command-search.tsx
│           │   ├── theme-provider.tsx
│           │   ├── theme-customizer.tsx
│           │   ├── sidebar-notification.tsx
│           │   ├── site-header.tsx
│           │   ├── site-footer.tsx
│           │   ├── pricing-plans.tsx
│           │   ├── color-picker.tsx
│           │   ├── dot-pattern.tsx
│           │   ├── image-3d.tsx
│           │   ├── upgrade-to-pro-button.tsx
│           │   ├── landing/         ← Componentes de la landing page
│           │   ├── layouts/         ← Layouts base (BaseLayout, etc.)
│           │   ├── router/          ← AppRouter con todas las rutas declaradas
│           │   ├── theme-customizer/
│           │   └── ui/              ← Componentes Shadcn/ui (button, card, table, etc.)
│           ├── config/              ← Configuración de la aplicación (rutas, nav items)
│           ├── contexts/            ← Contextos React (SidebarConfigContext, etc.)
│           ├── hooks/               ← Custom hooks
│           ├── lib/                 ← Utilidades (cn, etc.)
│           ├── types/               ← TypeScript interfaces y tipos
│           └── utils/               ← Utilidades (analytics, etc.)
│
├── backend/
│   ├── api-inventario/              ← ✅ MÓDULO COMPLETADO Y DESPLEGADO EN RENDER
│   │   ├── index.js                 ← Servidor Express (Puerto: process.env.PORT || 4000)
│   │   ├── package.json             ← deps: express, cors, dotenv, @supabase/supabase-js, axios, pg
│   │   ├── .env                     ← Variables locales (NO en Git): SUPABASE_URL, SUPABASE_KEY, FIREBASE_DB_URL
│   │   ├── config/
│   │   │   └── db.js                ← Cliente Supabase (createClient con SUPABASE_URL + SUPABASE_KEY)
│   │   ├── routes/
│   │   │   └── inventarioRoutes.js  ← 4 endpoints registrados (solo mapeo a controladores)
│   │   ├── controllers/
│   │   │   └── inventarioController.js ← Lógica de negocio: descontar, ingresar, consultar, sincronizar
│   │   ├── models/
│   │   │   └── inventarioModel.js   ← Queries directas a Supabase (5 funciones CRUD)
│   │   └── middlewares/             ← (Directorio presente, sin middleware implementado aún)
│   │
│   ├── api-compras/                 ← 🔄 En construcción (Liz)
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   └── routes/
│   │
│   ├── api-ventas/                  ← 🔄 En construcción (Gabriel)
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   └── routes/
│   │
│   └── api-talento-humano/          ← 🔄 En construcción (Alejandro)
│       ├── index.js                 ← Servidor Express con más endpoints (SSO)
│       ├── package.json
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       └── routes/
│
└── docs/
    ├── README.md                    ← Índice de documentación
    ├── golden-rules.md              ← Reglas de oro no negociables (ver Sección 4)
    ├── technical-requirements.md   ← Requisitos técnicos detallados
    ├── architecture/
    │   └── README.md               ← Diagramas de arquitectura y flujos de datos
    ├── ai_development/             ← Guías para IAs colaboradoras
    │   ├── README.md
    │   ├── agents/
    │   ├── languages/
    │   └── workflows/
    └── design_sessions/
        └── TEMPLATE.md
```

---

## 3. Estado del Microservicio de Inventario — PAUL (100% Completado)

### 🟢 Estado: LIVE y Operativo en Producción

| Atributo | Valor |
|---|---|
| **URL de Producción** | `https://api-inventario-1r1w.onrender.com` |
| **Plataforma** | Render (Free Tier) |
| **Runtime** | Node.js + Express.js 5.x (CommonJS) |
| **Base de Datos** | Supabase PostgreSQL (aislada, fragmentación vertical) |
| **Sincronización NoSQL** | Firebase Realtime Database |
| **Estado local** | Servidor corriendo con `node index.js` en puerto 4000 |

---

### Contratos de Endpoints Validados

#### `POST /api/inventario/descontar`
**Propósito:** Descontar stock al ejecutar una venta (consumido por `api-ventas` de Gabriel)

```json
// Request Body
{
  "idVariante": 123,
  "cantidad": 5
}

// Response 200 OK
{
  "success": true,
  "message": "Stock de inventario descontado con éxito del flujo de bodegas.",
  "stock_restante": 45
}

// Response 400 — Parámetros inválidos o stock insuficiente
{ "success": false, "error": "Stock insuficiente en bodega." }

// Response 404 — Variante no existe en inventario
{ "success": false, "error": "No existe el registro de inventario." }
```

---

#### `POST /api/inventario/ingresar`
**Propósito:** Registrar ingreso de mercadería por compra (consumido por `api-compras` de Liz)

```json
// Request Body
{
  "idVariante": 123,
  "cantidad": 50,
  "idBodega": 1,
  "descripcion": "Ingreso por Orden de Compra #OC-2024-001",
  "usuario": "liz.compras"
}

// Response 200 OK
{
  "success": true,
  "message": "Mercadería ingresada al inventario y recepción registrada con éxito.",
  "stock_actual": 95
}
```

**Nota:** Además de actualizar `inventario_bodegas`, este endpoint crea automáticamente un registro de auditoría en la tabla `recepciones`.

---

#### `GET /api/inventario/stock/:idVariante`
**Propósito:** Consultar disponibilidad en tiempo real de una variante de producto

```
GET /api/inventario/stock/123
```

```json
// Response 200 OK
{
  "success": true,
  "id_bodega": 1,
  "stock_disponible": 45
}

// Response 404 — Sin inventario asignado
{ "success": false, "error": "Variante sin inventario asignado." }
```

---

#### `GET /api/inventario/sincronizar-cloud`
**Propósito:** Sincronizar el catálogo completo de productos activos con Firebase Realtime Database para el e-commerce

```
GET /api/inventario/sincronizar-cloud
```

```json
// Response 200 OK
{
  "success": true,
  "message": "Ecosistema híbrido sincronizado. Catálogo en la nube Firebase actualizado con éxito.",
  "items_sincronizados": 342
}
```

**Flujo interno:**
1. Consulta `productos` (estado ACT) con sus `variantes_producto` anidadas desde Supabase.
2. Cruza con `inventario_bodegas` para obtener el stock real.
3. Genera un array JSON unificado por producto con variantes y stock.
4. Ejecuta un `PUT` a `${FIREBASE_DB_URL}/catalogo_ecommerce.json` (reemplaza el nodo completo).

**Variable de entorno requerida:** `FIREBASE_DB_URL` (URL completa de la Realtime Database de Firebase, sin `/catalogo_ecommerce.json`).

---

### Base de Datos de Inventario — Supabase (Estado: Seeded ✅)

El nodo de Supabase del módulo de Inventario ya cuenta con datos semilla:

| Tabla | Tipo | Descripción | Estado |
|---|---|---|---|
| `categoria` | Maestra | Categorías de productos | ✅ 1,000 registros |
| `productos` | Maestra | Catálogo de productos | ✅ 1,000 registros |
| `variantes_producto` | Maestra | SKUs/variantes con precio y código de barras | ✅ 1,000 registros |
| `inventario_bodegas` | Transaccional | Stock por variante y bodega (saldo inicial, egresos, ingresos) | ✅ 1,000 registros |
| `recepciones` | Transaccional | Auditoría de ingresos físicos a bodega | ✅ 1,000 registros |
| `entregas` | Transaccional | Registro de salidas/despachos | ✅ 1,000 registros |
| `devoluciones` | Transaccional | Control de devoluciones | ✅ 1,000 registros |

**Integridad referencial:** Todas las claves foráneas están correctamente enlazadas. El archivo `supabase_migration.sql` (34 MB) en la raíz del proyecto contiene el esquema completo y los datos de carga inicial.

### Columnas clave de `inventario_bodegas`
```
id_bodega         → FK a la tabla de bodegas
id_variante       → FK a variantes_producto
inv_periodo       → Período contable de registro
inv_saldo_final   → Stock disponible actual ← el campo crítico
inv_qty_ingresos  → Acumulado de ingresos en el período
inv_qty_egresos   → Acumulado de egresos en el período
```

### Stack técnico del microservicio
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.106.2",
    "axios": "^1.16.1",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "pg": "^8.21.0"
  },
  "scripts": {
    "start": "node index.js"
  }
}
```

---

## 4. Reglas Estrictas de Desarrollo (Golden Rules)

> **Estas reglas son NO NEGOCIABLES. Ninguna IA puede sugerir código que las viole.**
> Referencia completa: [`docs/golden-rules.md`](./docs/golden-rules.md)

---

### ✅ REGLA 1 — Patrón MVC Estricto

El sistema separa **obligatoriamente** las responsabilidades:

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| **Vista** | `frontend/plantilla/src/app/*/page.tsx` y componentes | Renderizado HTML/JSX, captura de eventos de usuario |
| **Controlador (Frontend)** | `src/js/controllers/` *(destino de la refactorización)* | Intercepta eventos DOM, llama a servicios, actualiza vistas |
| **Servicio (Frontend)** | `src/js/services/` *(destino de la refactorización)* | Solo realiza peticiones HTTP fetch/axios. Sin lógica de negocio, sin DOM |
| **Controlador (Backend)** | `backend/api-[modulo]/controllers/` | Procesa datos de la petición, coordina modelos |
| **Modelo (Backend)** | `backend/api-[modulo]/models/` | Queries directas a la base de datos |
| **Ruta (Backend)** | `backend/api-[modulo]/routes/` | Solo mapea URL → método del controlador |

---

### ❌ REGLA 2 — Prohibición en la Capa de Servicios del Frontend

**Los archivos `services/` del frontend SOLO ejecutan peticiones HTTP.**

```javascript
// ✅ CORRECTO — services/inventarioService.js
export async function consultarStock(idVariante) {
  const response = await fetch(`${API_URL}/api/inventario/stock/${idVariante}`);
  return response.json();
  // Sin document.getElementById, sin alert(), sin lógica de negocio
}

// ❌ PROHIBIDO — No modifiques el DOM dentro de services/
export async function consultarStock(idVariante) {
  const data = await fetch(...).then(r => r.json());
  document.getElementById('stock-display').textContent = data.stock; // ← VIOLACIÓN
}
```

---

### ❌ REGLA 3 — Prohibición de Lógica en las Rutas del Backend

```javascript
// ✅ CORRECTO — routes/inventarioRoutes.js
router.post('/descontar', inventarioController.descontarStock);

// ❌ PROHIBIDO — Lógica en la ruta
router.post('/descontar', async (req, res) => {
  const { idVariante } = req.body;
  if (!idVariante) return res.status(400).json({ error: "..." }); // ← VIOLACIÓN
  // ... más código aquí ← VIOLACIÓN
});
```

---

### ❌ REGLA 4 — Prohibición de Cadenas de Conexión Compartidas

La comunicación inter-módulos es **EXCLUSIVAMENTE** por peticiones HTTP entre APIs:

```javascript
// ✅ CORRECTO — api-ventas llama a api-inventario por HTTP
const response = await axios.post(`${process.env.URL_API_INVENTARIO}/api/inventario/descontar`, {
  idVariante: 123,
  cantidad: 5
});

// ❌ PROHIBIDO — api-ventas conectándose directamente a la DB de Inventario
const supabaseInventario = createClient(SUPABASE_URL_INVENTARIO, SUPABASE_KEY_INVENTARIO); // ← VIOLACIÓN GRAVE
```

---

### ❌ REGLA 5 — Prohibición de Raw Fetch en Controladores o Vistas

```javascript
// ✅ CORRECTO — controllers/inventarioController.js (Frontend)
import { consultarStock } from '../services/inventarioService.js';
document.getElementById('btn-consultar').addEventListener('click', async () => {
  const data = await consultarStock(idVariante);
  InventarioView.renderStock(data);
});

// ❌ PROHIBIDO — fetch directo en un controlador o vista
document.getElementById('btn-consultar').addEventListener('click', async () => {
  const data = await fetch('/api/inventario/stock/1').then(r => r.json()); // ← VIOLACIÓN
});
```

---

### 🔒 REGLA 6 — Seguridad de Variables de Entorno

- Los archivos `.env` **NUNCA** se suben al repositorio.
- Las credenciales **NUNCA** se hardcodean en archivos fuente.
- El `.gitignore` ya está correctamente configurado para ignorar `.env` y `node_modules`.

---

## 5. Objetivo Inmediato — Fase Frontend

### Contexto de la Plantilla

La carpeta `frontend/plantilla/` contiene una **plantilla comercial de alta calidad** llamada "Shadcn Dashboard & Landing Template", construida con:
- **React 18 + Vite + TypeScript**
- **TailwindCSS + Shadcn/ui** (componentes accesibles y configurables)
- **react-router-dom** para SPA routing
- **pnpm** como gestor de paquetes
- Soporte completo para **Dark/Light mode** via `ThemeProvider`

La plantilla ya incluye páginas base: Dashboard, Auth, Mail, Tasks, Chat, Calendar, Users, Settings, FAQs, Pricing, Landing, Errors.

---

### Plan de Refactorización — Modularización por Integrante

El siguiente paso es **reemplazar el contenido genérico** de la plantilla con dashboards funcionales por módulo. El equipo tiene **4 dashboards independientes** que corresponden a los 4 microservicios del backend:

| Integrante | Módulo | Dashboard URL (propuesta) | API Backend |
|---|---|---|---|
| **Gabriel** | Ventas | `/dashboard/ventas` | `api-ventas` |
| **Liz** | Compras | `/dashboard/compras` | `api-compras` |
| **Alejandro** | Talento Humano / Contabilidad | `/dashboard/talento-humano` | `api-talento-humano` |
| **Paul** | Inventario | `/dashboard/inventario` | `api-inventario` (LIVE ✅) |

---

### Objetivo Inmediato — Dashboard de Inventario de Paul

**Paul tiene el microservicio backend 100% funcional y desplegado**. El enfoque actual es construir la capa de presentación que lo conecte.

#### Componentes a crear (siguiendo MVC del frontend):

```
frontend/plantilla/src/
│
├── app/
│   └── dashboard-inventario/        ← NUEVA PÁGINA (route: /dashboard/inventario)
│       ├── page.tsx                 ← Página principal del dashboard de inventario
│       └── components/
│           ├── StockCard.tsx        ← Tarjeta con stock de una variante
│           ├── StockTable.tsx       ← Tabla de inventario
│           ├── IngresarStockForm.tsx ← Formulario para ingresar mercadería
│           └── SincronizarButton.tsx ← Botón para disparar sincronización Firebase
│
├── services/                        ← NUEVA CARPETA (capa de servicios del frontend)
│   └── inventarioService.ts         ← Funciones fetch hacia https://api-inventario-1r1w.onrender.com
│
└── controllers/                     ← NUEVA CARPETA (coordinadores de eventos)
    └── inventarioController.ts      ← Handlers: consultarStock, ingresarStock, sincronizar
```

#### Funciones del servicio a implementar:

```typescript
// services/inventarioService.ts
const API_BASE = 'https://api-inventario-1r1w.onrender.com';

export async function consultarStock(idVariante: number) { ... }
export async function descontarStock(idVariante: number, cantidad: number) { ... }
export async function ingresarStock(payload: IngresarStockPayload) { ... }
export async function sincronizarCloud() { ... }
```

---

## 6. Mapa de Integrantes y Módulos

| Integrante | Módulo Backend | Estado Backend | Módulo Frontend | Estado Frontend |
|---|---|---|---|---|
| **Paul** | `api-inventario` | ✅ **100% LIVE** en Render | Dashboard Inventario | 🔄 **Próximo a implementar** |
| **Liz** | `api-compras` | 🔄 Estructura creada | Dashboard Compras | ⏳ Pendiente |
| **Gabriel** | `api-ventas` | 🔄 Estructura creada | Dashboard Ventas | ⏳ Pendiente |
| **Alejandro** | `api-talento-humano` | 🔄 Con más avance (index.js existe, SSO) | Dashboard RRHH | ⏳ Pendiente |

---

## 7. Autenticación Centralizada (SSO con JWT)

```
[ Cliente Frontend ]
        │
        ├──(1) POST /auth/login {usuario, password}──► [ api-talento-humano ]
        │                                                       │
        │                                              Valida en su propia DB
        │                                                       │
        ◄──────────(2) { token: "eyJhbG..." } ─────────────────┘
        │
        ├──(3) Cualquier request a cualquier API:
        │      Headers: { Authorization: "Bearer eyJhbG..." }
        │                                                       │
        │      ┌──────────────────────────────────────────────┐ │
        │      │ Cada API valida el token LOCALMENTE con:     │ │
        │      │   jwt.verify(token, process.env.JWT_SECRET)  │ │
        │      │ Sin consultar la DB de Talento Humano        │ │
        │      └──────────────────────────────────────────────┘ │
        │
        ◄──────────(4) Datos de la API solicitada ─────────────┘
```

**Clave compartida:** `JWT_SECRET` debe ser **idéntica** en los `.env` de los 4 microservicios.

---

## 8. Variables de Entorno

### `api-inventario/.env` (Estructura real del archivo)
```env
PORT=4000
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[anon-public-key]
FIREBASE_DB_URL=https://[project-id]-default-rtdb.firebaseio.com
```

### Plantilla genérica para otros microservicios (`.env.example`)
```env
PORT=300X
NODE_ENV=development
JWT_SECRET=super_secreto_para_desarrollo_local_123
JWT_EXPIRES_IN=1d

# URLs para comunicación inter-APIs en desarrollo local
URL_API_TALENTO_HUMANO=http://localhost:3001
URL_API_COMPRAS=http://localhost:3002
URL_API_VENTAS=http://localhost:3003
URL_API_INVENTARIO=http://localhost:3004

# En producción usar las URLs de Render:
# URL_API_INVENTARIO=https://api-inventario-1r1w.onrender.com
```

### Variables del Frontend (futuro `.env` de Vite)
```env
VITE_API_INVENTARIO=https://api-inventario-1r1w.onrender.com
VITE_API_COMPRAS=https://[url-render-compras].onrender.com
VITE_API_VENTAS=https://[url-render-ventas].onrender.com
VITE_API_TALENTO_HUMANO=https://[url-render-talento].onrender.com
```

---

## Historial de Cambios

| Fecha | Acción | Responsable |
|---|---|---|
| 2026-06-02 | Microservicio `api-inventario` desplegado en Render. 4 endpoints validados con Postman. | Paul |
| 2026-06-02 | Generación de este archivo `CONTEXTO_ACTUAL_PROYECTO.md` (v1.0) | IA (Antigravity) |

---

*Última validación del workspace: 2026-06-02 | Generado automáticamente mediante inspección real de archivos locales.*
