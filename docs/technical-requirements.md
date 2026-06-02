# Technical Requirements - Proyecto RDA3 (ERP System)

## System Overview
This project consists of an ERP Distributed System designed with a clear separation between the presentation layer (Frontend) and the business logic and persistence layers (Backend).

- **Frontend (Vista)**: A static dashboard interface built with HTML, CSS (Bootstrap), and modular Vanilla JavaScript. It will be deployed on Vercel.
- **Backend (Modelos y Controladores)**: Composed of 4 independent APIs built in Node.js/Express. They will be deployed on Render.
- **Databases**: Each microservice manages its own isolated database instance (Distributed Database Pattern).
- **Authentication**: Centralized Single Sign-On (SSO) using JSON Web Tokens (JWT).

---

# Architecture & File Structure

## 1. Frontend Structure (`frontend/`)
The frontend is responsible for the user interface, DOM event interception, rendering views dynamically, and making API requests.

```text
frontend/
│   ├── public/                   # Static assets (images, icons)
│   ├── src/
│   │   ├── css/                  # Styling (Customized Bootstrap)
│   │   ├── js/
│   │   │   ├── controllers/      # Event listeners and DOM action handling
│   │   │   ├── services/         # API HTTP client functions (fetch/axios)
│   │   │   └── views/            # Dynamic rendering of UI elements
│   │   └── index.html            # Main application dashboard
```

*   **`index.html`**: Entry point. It has no hardcoded business logic or inline javascript script blocks.
*   **`src/js/controllers/`**: Intercepts DOM user actions (e.g., button clicks, form submissions) and delegates work to the API services, then instructs views to update.
*   **`src/js/services/`**: Encapsulates all API requests. These functions make the asynchronous HTTP calls (fetch/axios) to the 4 Render APIs.
*   **`src/js/views/`**: Contains code dedicated exclusively to writing or modifying HTML elements dynamically.

---

## 2. Backend Structure (`backend/api-[modulo]/`)
The backend is split into 4 independent microservices. Each service follows a strict MVC folder layout:

```text
backend/api-[modulo]/
  ├── config/        # Database connections and env loaders
  ├── routes/        # Maps endpoints directly to controllers
  ├── middlewares/   # JWT authorization and request validation
  ├── controllers/   # Processes request data and coordinates models
  └── models/        # Schemas and queries to the specific database
```

### Microservice Modules:
1.  **`api-talento-humano`**: Identity provider, handles SSO authentication, users, and roles.
2.  **`api-compras`**: Purchases and procurement logs.
3.  **`api-ventas`**: Sales records and client invoicing.
4.  **`api-inventario`**: Raw materials and final products stock levels.

---

# Single Sign-On (SSO) with JWT

To prevent duplicating user profiles and credentials across multiple databases, the system implements centralized authentication.

```text
  [ Client (Frontend) ] ──(1) Login Credentials──► [ api-talento-humano ]
           ▲                                                 │
           │                                          (Validates DB)
           │                                                 │
    (2) JWT Token Returned ◄─────────────────────────────────┘
           │
           ├───(3) Request + Auth Header ──► [ api-ventas ]
           │       (Bearer <token>)                │
           │                                 (Verifies JWT
           │                                  with Secret)
           │                                       │
           ◄──────────(4) API Data─────────────────┘
```

1.  **Access Controller**: Only `api-talento-humano` has access to the user credentials table. It processes logins (`POST /auth/login`) and generates a signed JWT.
2.  **Authorization Header**: The frontend stores the token and attaches it to the header of all requests made to any of the 4 APIs:
    ```text
    Authorization: Bearer <token>
    ```
3.  **Distributed Validation**: The other APIs (`api-compras`, `api-ventas`, `api-inventario`) validate the signature mathematically using a shared `JWT_SECRET` key in their local `.env`. They do not connect to the `api-talento-humano` database, saving round-trip queries.

---

# Environment Variables Configuration

Both frontend and backend rely on local configuration files (`.env`) that must not be committed.

### Backend `.env` Template (per API)
```text
PORT=300X
DB_CONNECTION_STRING=your_db_credentials
JWT_SECRET=shared_secret_string_across_all_apis
```

### Frontend Environment Variables
```text
URL_API_TALENTO_HUMANO=https://api-talento-humano.onrender.com
URL_API_COMPRAS=https://api-compras.onrender.com
URL_API_VENTAS=https://api-ventas.onrender.com
URL_API_INVENTARIO=https://api-inventario.onrender.com
```
