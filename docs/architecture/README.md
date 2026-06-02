# Architecture Overview - Proyecto RDA3

## Purpose
This document provides a technical overview of the system architecture, design patterns, directory layouts, and data flows of the **Proyecto RDA3 ERP Distributed System**. It is the primary reference for both human developers and AI agents working in this repository.

---

## System Context Diagram

```text
               ┌───────────────────────────────────────┐
               │         FRONTEND (Vercel)             │
               │  Vanilla HTML / Bootstrap / JS MVC    │
               └───────────────────┬───────────────────┘
                                   │
                                   │ HTTP API Calls (with JWT token)
                                   ▼
        ┌─────────────────────────────────────────────────────┐
        │                 BACKEND (Render)                    │
        │                                                     │
        │  ┌──────────────────┐        ┌───────────────────┐  │
        │  │ api-talento-hum  │        │    api-ventas     │  │
        │  │  (SSO Provider)  │        │ (Sales Service)   │  │
        │  └────────┬─────────┘        └─────────┬─────────┘  │
        │           │                            │            │
        │           │ (Internal API call)        │ (HTTP)     │
        │           │                            ▼            │
        │  ┌────────▼─────────┐        ┌───────────────────┐  │
        │  │   api-compras    │◄───────┤  api-inventario   │  │
        │  │ (Purchases Serv) │ (HTTP) │ (Inventory Serv)  │  │
        │  └──────────────────┘        └───────────────────┘  │
        └─────────────────────────────────────────────────────┘
```

The system splits operational concerns into 4 backend microservices and 1 frontend client, ensuring independent scalability and database isolation.

---

## Core Design Decisions

### 1. Frontend MVC (Model-View-Controller)
* **Decision**: Organize frontend code into `controllers/` (handles DOM events), `services/` (HTTP requests using fetch/axios), and `views/` (DOM rendering).
* **Rationale**: Decouples network code from UI display logic. Ensures that the interface renders fast, has clean element hooks, and is easy to refactor without side effects.

### 2. Distributed Database Architecture
* **Decision**: Databases are strictly isolated per microservice.
* **Rationale**: Direct queries between domains are forbidden. If `api-ventas` needs to confirm product availability, it must send an HTTP API request to `api-inventario`, rather than joining database tables directly. This prevents cascading database outages.

### 3. Single Sign-On (SSO) with JWT
* **Decision**: Centralize user sessions in `api-talento-humano` while delegating authentication checks locally.
* **Rationale**: Minimizes cross-network queries. `api-talento-humano` signs a JWT containing the user ID and role, and the other microservices verify the token signature locally using a shared `JWT_SECRET`.

---

## Directory Structure

```text
/
├── frontend/
│   ├── public/                 # Static assets (images, icons)
│   └── src/
│       ├── css/                # Styling (Customized Bootstrap)
│       ├── js/
│       │   ├── controllers/    # DOM event listeners and coordinators
│       │   ├── services/       # Asynchronous HTTP clients calling Render APIs
│       │   └── views/          # JS modules generating dynamic HTML layouts
│       └── index.html          # Main application dashboard
├── backend/
│   ├── api-talento-humano/     # Identity provider (SSO)
│   ├── api-compras/            # Procurement microservice
│   ├── api-ventas/             # Sales and invoicing microservice
│   └── api-inventario/         # Stock control microservice
└── docs/
    ├── README.md               # Documentation entry index
    ├── golden-rules.md         # Non-negotiable architectural principles
    └── technical-requirements.md # Technical setup and environment guide
```

---

## Operational Data Flow (Example: Stock Deduction on Sale)

```text
[ Client (UI) ] ──(1. Click Sell)──► [ ControllerVentas ]
                                              │
                                     (2. Invoke Service)
                                              │
                                              ▼
[ InventarioAPI ] ◄──(4. HTTP Deduct)── [ ServiceVentas ] ──(3. POST /ventas/pedidos)──► [ VentasAPI ]
                                                                                               │
                                                                                        (5. Write Sales DB)
```

1. The operator triggers a transaction in the browser.
2. The frontend controller intercepts the action and calls `VentasService.placeOrder(items, token)`.
3. The service fires a `POST` request to `api-ventas` with the JWT in the header.
4. `api-ventas` validates the token, contacts `api-inventario` via HTTP to deduct product quantities, and writes the record to its own sales database.

---

## Common Pitfalls & Anti-Patterns

* **Bypassing Services**: Do not make raw fetch/axios requests in controllers or views. Always place API client calls inside the `services/` directory.
* **Database Coupling**: Under no circumstances should you configure connection strings in one API pointing to the database of another API.
* **Leaking Secrets**: Never commit `.env` configuration files or `node_modules` folders.
