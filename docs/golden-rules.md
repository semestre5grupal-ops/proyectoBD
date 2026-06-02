# Golden Rules - Core Engineering Principles (Proyecto RDA3 ERP)

These rules are NON-NEGOTIABLE. 

They protect the architectural integrity of the ERP Distributed System (Proyecto RDA3) and enforce high standards for frontend structure, backend independence, database security, and clean code.

If any rule is violated: STOP implementation and fix the issue before proceeding.

---

# 1) Strict Separation of Concerns (MVC Pattern)

The system MUST strictly separate the presentation layer (Frontend) from the business logic and persistence layers (Backend).

Why this exists:
- Keeps the frontend lightweight and fast.
- Allows independent development, testing, and deployment of frontend and backend modules.
- Ensures clean code standards where UI elements do not execute database operations or heavy calculations.

Mandatory:
- **Frontend**: Only handles visual rendering (Views), catching user inputs/events, and invoking backend APIs.
- **Backend**: Processes all business rules, validates inputs, and handles direct database operations.

---

# 2) Encapsulate API Calls (Frontend Service Layer)

All HTTP requests (using `fetch` or `axios`) on the frontend MUST be encapsulated inside the `src/js/services/` directory.

Why this exists:
- Avoids scattering API URLs and request options across UI files.
- Makes API integrations easy to refactor, debug, and mock.

Mandatory:
- Frontend controllers and views MUST ONLY interact with backend APIs by calling functions exported from the `services/` directory.

Forbidden:
- Making raw `fetch` or `axios` calls directly inside views (`src/js/views/`), controllers (`src/js/controllers/`), or the main `index.html`.
- Modifying the DOM directly within files located in `src/js/services/`.

---

# 3) Strict Database Isolation (No Shared Connections)

Each backend API (`api-talento-humano`, `api-compras`, `api-ventas`, `api-inventario`) MUST manage its own isolated database.

Why this exists:
- Avoids coupling services at the database level.
- Ensures that if one database fails, it does not cascade and crash other modules.
- Allows services to scale independently.

Forbidden:
- Accessing the database of another microservice directly. (For example, `api-compras` connecting directly to the database of `api-inventario`).

Do this instead:
- If a service needs data from another, it must query the required endpoint via HTTP REST request (e.g., `api-ventas` sending an HTTP request to `api-inventario` to deduct stock).

---

# 4) Centralized Identity Provider (SSO with JWT)

Authentication MUST be centralized to prevent credentials duplication across databases.

Why this exists:
- Implements a single source of truth for users and credentials.
- Decentralizes token validation without bottlenecking the database.

Mandatory:
- **`api-talento-humano`** is the ONLY service authorized to process logins and sign JWT tokens.
- The Frontend must store the token and send it in the header `Authorization: Bearer <token>` on all requests.
- All other microservices (`api-compras`, `api-ventas`, `api-inventario`) must validate the token signature locally using the shared `JWT_SECRET`.

---

# 5) Clean Routing and Controller Separation (Backend)

Backend routes MUST ONLY map endpoints to their respective controller methods.

Why this exists:
- Keeps routing files readable and simple.
- Grouping logic in controllers makes code reusable and testable.

Forbidden:
- Writing business logic, validation rules, or database queries inside route files (`backend/api-[modulo]/routes/`).

---

# 6) Environmental Safety & Configuration

Environment configurations and dependencies MUST remain local and secure.

Mandatory:
- Always use `.env` files locally to store database connection strings, ports, and secret keys.
- Ensure `node_modules` are ignored by git (always present in `.gitignore`).

Forbidden:
- Hardcoding credentials (like DB passwords or `JWT_SECRET`) in source files.
- Committing `.env` files or `node_modules` to the repository.
