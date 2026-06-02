# Active Design Specification: API Architecture for Compras Module (api-compras)

## Feature Name
Full Backend API Architecture and Implementation Plan for the `api-compras` Microservice (Proyecto RDA3 ERP), integrated with `api-inventario` and SSO authentication.

---

## Problem Statement
The ERP application is moving from a single SQL Server database to a distributed microservice architecture. The Purchases module (`api-compras`) must manage suppliers, purchase orders, purchase returns, and inventory receptions, while maintaining strict database isolation. 

Since it cannot directly access or query the `api-inventario` database (which contains product variants, warehouses, and physical stock), `api-compras` must securely validate reference keys (such as `id_variante` and `id_bodega`) and trigger stock updates via HTTP REST calls to the `api-inventario` microservice, under a secure SSO context using JWT signatures.

---

## Scope

### Included:
1. **CRUD Endpoints for Suppliers & Cities**: Full management of suppliers (`proveedores`) and supplier cities (`ciudades`) local to the Purchases module database.
2. **Purchase Orders (`compras` & `proxoc`)**: Create, list, retrieve, approve, and cancel purchase orders.
3. **Purchases Reception (`recepciones` & `proxrec`)**: Register received items, validate differences, and call `api-inventario` to increase stock levels.
4. **Purchase Returns (`devoluciones_compra` & `proxdevc`)**: Manage returned goods due to damage or differences, and call `api-inventario` to decrease stock levels.
5. **SSO Authorization**: Intercept incoming requests with JWT verification using `JWT_SECRET`.
6. **Distributed Communication**: REST integration with the `api-inventario` API endpoints to validate warehouses, variants, and perform stock adjustments.

### Excluded:
1. **Frontend View/Controller Rendering**: The design of UI pages, Bootstrap styling, or browser controllers is handled separately on the frontend client.
2. **Monolithic DB Joins**: Direct database linking between `api-compras` and `api-inventario` databases is strictly excluded.

---

## Implementation Details

### 1. Directory Structure (`backend/api-compras/`)
Following the strict MVC and configuration layout of the project:
```text
backend/api-compras/
├── config/
│   └── db.js                 # PostgreSQL Pool connection pool
├── controllers/
│   ├── ciudadController.js   # Logic for managing supplier cities
│   ├── proveedorController.js# Logic for managing supplier profiles
│   ├── compraController.js   # Logic for Purchase Orders and details (proxoc)
│   ├── recepcionController.js# Logic for Purchase Receptions (proxrec)
│   └── devolucionController.js # Logic for Returns (proxdevc)
├── middlewares/
│   └── authMiddleware.js     # Token verification (JWT_SECRET)
├── models/
│   ├── ciudadModel.js        # Queries to the local 'ciudades' table
│   ├── proveedorModel.js     # Queries to the local 'proveedores' table
│   ├── compraModel.js        # Queries to 'compras' and 'proxoc' tables
│   ├── recepcionModel.js     # Queries to 'recepciones' and 'proxrec' tables
│   └── devolucionModel.js    # Queries to 'devoluciones_compra' and 'proxdevc'
├── routes/
│   ├── ciudadRoutes.js       # Routes for /api/ciudades
│   ├── proveedorRoutes.js     # Routes for /api/proveedores
│   ├── compraRoutes.js       # Routes for /api/compras
│   ├── recepcionRoutes.js    # Routes for /api/recepciones
│   └── devolucionRoutes.js   # Routes for /api/devoluciones-compra
├── .env.example              # Template for local environment configs
├── package.json              # Express, PG, Cors, Dotenv, and Axios/Fetch dependencies
└── index.js                  # App startup and route registry
```

### 2. Database Schema (PostgreSQL for `api-compras`)
We translate the SQL Server relational schema for Purchases into clean PostgreSQL snake_case tables.

```sql
-- 1. Ciudades (Local supplier catalog)
CREATE TABLE ciudades (
    id_ciudad SERIAL PRIMARY KEY,
    ciu_nombre VARCHAR(45) NOT NULL,
    ciu_abreviado VARCHAR(5) NOT NULL,
    ciu_estado BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Proveedores
CREATE TABLE proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    id_ciudad INT NOT NULL REFERENCES ciudades(id_ciudad),
    prv_nombre VARCHAR(40) NOT NULL,
    prv_ciruc VARCHAR(13) NOT NULL,
    prv_telefono VARCHAR(10) NOT NULL,
    prv_mail VARCHAR(60) NOT NULL,
    prv_celular VARCHAR(10) NOT NULL,
    prv_direccion VARCHAR(60) NOT NULL,
    prv_estado VARCHAR(3) NOT NULL DEFAULT 'ACT' -- 'ACT', 'INA'
);

-- 3. Compra (Purchase Order Header)
CREATE TABLE compras (
    id_compra SERIAL PRIMARY KEY,
    id_proveedor INT NOT NULL REFERENCES proveedores(id_proveedor),
    oc_fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    oc_fechaentrega TIMESTAMP NULL,
    oc_subtotal DECIMAL(9,2) NOT NULL DEFAULT 0.00,
    oc_iva NUMERIC NOT NULL DEFAULT 12, -- 12% or 15% IVA percentage
    oc_total DECIMAL(9,2) NOT NULL DEFAULT 0.00,
    oc_estado VARCHAR(3) NOT NULL DEFAULT 'ABI' -- 'ABI' (Open), 'APR' (Approved), 'ANU' (Cancelled)
);

-- 4. Proxoc (Purchase Order Detail)
CREATE TABLE proxoc (
    id_compra INT NOT NULL REFERENCES compras(id_compra) ON DELETE CASCADE,
    id_variante INT NOT NULL, -- Logical reference validation via api-inventario
    pxo_cantidad INT NOT NULL CHECK (pxo_cantidad > 0),
    pxo_valor DECIMAL(9,2) NOT NULL,
    pxo_subtotal DECIMAL(9,2) NOT NULL,
    pxo_estado VARCHAR(3) NOT NULL DEFAULT 'ACT',
    PRIMARY KEY (id_compra, id_variante)
);

-- 5. Recepciones (Purchase Reception Header)
CREATE TABLE recepciones (
    id_recepcion SERIAL PRIMARY KEY,
    id_compra INT NOT NULL REFERENCES compras(id_compra),
    id_bodega INT NOT NULL, -- Logical reference validation via api-inventario
    rec_descripcion VARCHAR(100) NOT NULL,
    rec_fechahora TIMESTAMP NOT NULL DEFAULT NOW(),
    rec_num_productos INT NOT NULL DEFAULT 0,
    rec_fecharesolucion TIMESTAMP NULL,
    usu_responsable VARCHAR(30) NOT NULL,
    rec_estado VARCHAR(3) NOT NULL DEFAULT 'ABI' -- 'ABI' (In-progress), 'APR' (Approved/Resolved), 'ANU' (Cancelled)
);

-- 6. Proxrec (Purchase Reception Detail)
CREATE TABLE proxrec (
    id_recepcion INT NOT NULL REFERENCES recepciones(id_recepcion) ON DELETE CASCADE,
    id_variante INT NOT NULL, -- Logical reference validation via api-inventario
    pxr_cantidad_solicitada INT NOT NULL,
    pxr_qty_recibida INT NOT NULL,
    pxr_diferencia INT NOT NULL,
    pxr_motivo_diferencia VARCHAR(100) NULL,
    pxr_estado VARCHAR(3) NOT NULL DEFAULT 'PEN', -- 'PEN' (Pending), 'PAR' (Partial), 'COM' (Completed), 'ANU' (Cancelled)
    PRIMARY KEY (id_recepcion, id_variante)
);

-- 7. Devoluciones Compra (Purchase Return Header)
CREATE TABLE devoluciones_compra (
    id_devcompra_pk SERIAL PRIMARY KEY,
    id_compra INT NOT NULL REFERENCES compras(id_compra),
    id_bodega INT NOT NULL, -- Logical reference validation via api-inventario
    devc_fechahora TIMESTAMP NOT NULL DEFAULT NOW(),
    devc_motivo VARCHAR(100) NOT NULL,
    devc_num_produc INT NOT NULL DEFAULT 0,
    devc_fecharesolucion TIMESTAMP NULL,
    usu_responsable VARCHAR(30) NOT NULL,
    devc_estado VARCHAR(3) NOT NULL DEFAULT 'ABI' -- 'ABI' (In-progress), 'APR' (Approved/Deducted), 'ANU' (Cancelled)
);

-- 8. Proxdevc (Purchase Return Detail)
CREATE TABLE proxdevc (
    id_devcompra_pk INT NOT NULL REFERENCES devoluciones_compra(id_devcompra_pk) ON DELETE CASCADE,
    id_variante INT NOT NULL, -- Logical reference validation via api-inventario
    pxdc_cantidad_recibida INT NOT NULL,
    pxdc_cantidad_devuelta INT NOT NULL,
    pxdc_diferencia INT NOT NULL,
    pxdc_motivo VARCHAR(100) NULL,
    pxdc_estado VARCHAR(3) NOT NULL DEFAULT 'PEN',
    PRIMARY KEY (id_devcompra_pk, id_variante)
);
```

### 3. API Endpoints List

#### A. Suppliers & Cities
* `GET /api/ciudades` - Retrieve all active supplier cities.
* `POST /api/ciudades` - Create a new city.
* `GET /api/proveedores` - List all suppliers.
* `POST /api/proveedores` - Register a supplier.
* `PUT /api/proveedores/:id` - Edit supplier profile.

#### B. Purchase Orders (PO)
* `GET /api/compras` - Retrieve list of POs.
* `POST /api/compras` - Create PO with items (writes to `compras` and `proxoc`).
* `GET /api/compras/:id` - Detailed view of PO and items.
* `PUT /api/compras/:id/estado` - Update PO status (`ABI`, `APR`, `ANU`).

#### C. Purchase Receptions
* `GET /api/recepciones` - List all receptions.
* `POST /api/recepciones` - Create a new reception (writes `recepciones` and `proxrec`).
* `PUT /api/recepciones/:id/aprobar` - Approves reception, triggers inventory REST request, and finalizes stock entry.

#### D. Returns
* `GET /api/devoluciones-compra` - List all returns.
* `POST /api/devoluciones-compra` - Register a return.
* `PUT /api/devoluciones-compra/:id/aprobar` - Approves return, triggers inventory REST request to decrement stock.

### 4. Distributed Integration Contract with `api-inventario`

To satisfy Database Isolation, `api-compras` will request information from `api-inventario` over HTTPS:
1. **Warehouse Validation**: During creation of receptions or returns, check warehouse validity.
   * **Endpoint**: `GET ${URL_API_INVENTARIO}/api/bodegas/:id`
   * **Expected Response**: `{ "success": true, "data": { "id_bodega": X, "estado_bod": "ACT" } }`
2. **Variant Validation**: During PO item creation, check that target variants exist.
   * **Endpoint**: `GET ${URL_API_INVENTARIO}/api/variantes/:id`
   * **Expected Response**: `{ "success": true, "data": { "id_variante": Y, "var_estado": "ACT" } }`
3. **Stock Updates (Transaction execution)**:
   * When a reception is approved: Call `POST /api/inventario/movimientos` with type `ING` (Ingreso/Entry) to add stock to the specified warehouse.
   * When a return is approved: Call `POST /api/inventario/movimientos` with type `EGR` (Egreso/Exit) to subtract stock.
   * **Payload**:
     ```json
     {
       "id_bodega": 3,
       "tipo_movimiento": "ING",
       "referencia": "RECPCION-12",
       "detalles": [
         { "id_variante": 5, "cantidad": 10 },
         { "id_variante": 8, "cantidad": 25 }
       ]
     }
     ```

---

## Test Plan

1. **Local Endpoint Tests (Supertest)**:
   * Perform route tests for `ciudades` and `proveedores` database queries.
   * Test validation middleware behavior for missing JWT.
2. **Mocking External Integrations (Nock / Jest)**:
   * Test PO creation while mocking calls to `${URL_API_INVENTARIO}/api/variantes/:id`. Assert HTTP response code `400` when validation fails.
   * Test reception approval and verify that the correct HTTP payload is emitted to `api-inventario`.

---

## Risks / Edge Cases

1. **Vite / Network Outage during Stock Entry**:
   * *Risk*: The reception status in `api-compras` updates to approved, but the network request to update inventory in `api-inventario` fails.
   * *Mitigation*: Run the operations inside a transaction block in `api-compras`. The HTTP request to `api-inventario` must complete successfully *before* committing the database transaction in `api-compras`. If it fails, rollback the transaction and report the error to the client.
2. **Stale/Non-Existent ID References**:
   * *Risk*: Multiple items are added to a PO, but one of the variant IDs was deleted or doesn't exist.
   * *Mitigation*: Perform batch validation against `api-inventario` before starting database writes.

---

## Open Questions

1. **How should we handle CORS and JWT verification between APIs?**
   * *Answer*: All microservices share the same `JWT_SECRET` key loaded in their `.env`. Authorization headers are verified locally via an authentication middleware.
2. **What happens if a supplier changes their details while there are active POs?**
   * *Answer*: Supplier detail changes do not alter historic orders. The historical order subtotal, total, and prices remain fixed in `proxoc` and `compras`.

---
*Is this design ready for implementation?*
