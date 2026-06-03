# Active Design Specification: Separation of Compras Tables and CRUD Implementation

## Feature Name

Separation of the Purchases (`compras`) module into dedicated routes (Proveedores, Compras/Ordenes) and implementation of complete CRUD operations, including a Purchase Order (Compra) details and edit modal.

---

## Problem Statement

Currently, the Purchases module (`compras`) is consolidated into a single dashboard route (`/dashboard/compras`) using a tabbed navigation interface. 

This single-dashboard approach has several limitations:
1. **UX Clutter**: Managing both suppliers and purchase orders on a single view increases complexity, load times, and state management overhead.
2. **Lack of Deep Routing**: Users cannot directly navigate to or link to the "Proveedores" management or specific "Órdenes de Compra" listings.
3. **Incomplete CRUD**: The current implementation lacks a full, granular CRUD flow for each entity (specifically, edit/deletion capabilities for purchase orders, status transitions, and a details view for individual orders).

We need to decouple this layout into dedicated routes/pages:
*   **Proveedores (Suppliers)**: Dedicated route and views for listing, creating, reading, updating, and deactivating suppliers.
*   **Compras (Purchase Orders)**: Dedicated route and views for listing, creating, reading, updating, and deactivating/canceling purchase orders.
*   **Compra Details Modal**: A dynamic modal to view, edit items, update status, and manage specific purchase orders.

---

## Scope

### Included:
1. **Routing Changes**:
   * Create separate client routes under `/dashboard/compras`:
     * `/dashboard/compras` or `/dashboard/compras/ordenes` (main Purchase Orders view).
     * `/dashboard/compras/proveedores` (dedicated Suppliers view).
   * Update the sidebar navigation (`app-sidebar.tsx`) to show separate sub-items for "Órdenes de Compra" and "Proveedores" under the "Compras" section.
2. **Suppliers (Proveedores) CRUD**:
   * **Create**: Modal form to add a supplier with city selection.
   * **Read**: Paginated table listing suppliers with search, filter, and details.
   * **Update**: Modal form to edit existing supplier properties.
   * **Delete (Logical)**: Option to toggle supplier state between Active (`ACT`) and Inactive (`INA`) via the UI, calling the backend API.
3. **Purchase Orders (Compras) CRUD**:
   * **Create**: Detailed form to select a supplier, dynamically add/remove product variant items, enter unit prices, choose tax rates (12% or 15% IVA), and save.
   * **Read**: Table listing orders with search and filtering by status (`ABI`, `APR`, `ANU`).
   * **Update**: Edit existing open (`ABI`) orders, adjusting items, quantities, or header details.
   * **Delete / Cancel**: Allow canceling open orders (`ABI` ➡️ `ANU`).
4. **Compra Detail Modal**:
   * Display full header details (Supplier, date, status, subtotals, IVA, total).
   * Display list of items (`proxoc` details) with product variant names, quantities, unit prices, and line subtotals.
   * Provide actions inside the modal to **Edit** (if state is `ABI`), **Approve** (`ABI` ➡️ `APR`), or **Cancel** (`ABI` ➡️ `ANU`).

### Excluded:
1. **Warehouse Receptions, Returns & Inventory**: All aspects of warehouse receptions, physical inventory management, returns, Kardex ledger operations, or warehouse operator dashboards are completely excluded.
2. **Backend API Changes**: This is a frontend layout and CRUD behavior enhancement. The backend API is assumed to support standard CRUD endpoints (`GET`, `POST`, `PUT` to `/api/proveedores` and `/api/compras`).

---

## Implementation Details

### 1. New Routing Architecture (`src/config/routes.tsx`)

We will register the separate sub-routes under the router:

```tsx
const ComprasOrdenes = lazy(() => import('@/app/compras/ordenes/page'))
const ComprasProveedores = lazy(() => import('@/app/compras/proveedores/page'))

// inside routes:
{
  path: "/dashboard/compras",
  element: <Navigate to="/dashboard/compras/ordenes" replace />
},
{
  path: "/dashboard/compras/ordenes",
  element: <ComprasOrdenes />
},
{
  path: "/dashboard/compras/proveedores",
  element: <ComprasProveedores />
}
```

### 2. Sidebar Navigation Modifications (`src/components/app-sidebar.tsx`)

Modify the sidebar hierarchy to represent the separation clearly:

```typescript
{
  title: "Compras (Liz)",
  url: "/dashboard/compras",
  icon: ShoppingCart,
  items: [
    {
      title: "Órdenes de Compra",
      url: "/dashboard/compras/ordenes",
    },
    {
      title: "Proveedores",
      url: "/dashboard/compras/proveedores",
    }
  ]
}
```

### 3. File Reorganization

We will organize the folder structure under `frontend/plantilla/src/app/compras`:
*   `frontend/plantilla/src/app/compras/ordenes/page.tsx`: Page representing the purchase orders view.
*   `frontend/plantilla/src/app/compras/proveedores/page.tsx`: Page representing the suppliers view.
*   `frontend/plantilla/src/app/compras/components/compra-detail-modal.tsx`: Component containing the detailed view and edit capabilities for a single purchase order.

### 4. CRUD and Modal Details

#### A. Suppliers (Proveedores) CRUD
*   Uses `proveedores-tab.tsx` as a base, turning it into a full page layout.
*   Includes a confirmation dialog for deactivating active suppliers, calling `handleUpdateSupplier` with `prv_estado: 'INA'`.

#### B. Purchase Orders (Compras) CRUD & Modal
*   **The Modal (`CompraDetailModal`)** will receive the selected order and state context.
*   If `order.oc_estado === 'ABI'`:
    *   Show "Editar Orden" button which toggles form input modes for quantities and prices.
    *   Show "Aprobar Orden" and "Anular Orden" action buttons.
*   If `order.oc_estado === 'APR'` or `'ANU'`:
    *   Show static read-only details. No edit or status changes allowed.
*   **Dynamic Calculations**: 
    *   Subtotal: `SUM(pxo_cantidad * pxo_valor)`
    *   IVA: `Subtotal * (oc_iva / 100)`
    *   Total: `Subtotal + IVA`

### 5. Functional Specification: State Management and Role-Based Access Control (RBAC)

#### A. Role and Permission Matrix
The system operates under a Role-Based Access Control (RBAC) model. Each user is assigned a profile that determines their privileges over documents, depending on the state they are in.

| User Profile | Code | Description and Access Level |
|---|---|---|
| **Purchasing Manager** | `JEFE` | **Total Commercial Control**: Final authority on budgets. Can create, edit, approve, and cancel purchase orders. Has full visibility of costs and inventory. |
| **Purchasing Assistant** | `AUX` | **Commercial Operational Management**: Responsible for quoting and preparing documents. Can create and edit orders, but does NOT have approval or cancellation permissions. |
| **Warehouse Operator** | `OPER` | **No Access**: Focuses strictly on physical inventory. Has no visibility or action rights in the purchasing flow. |

#### B. Purchase Order Lifecycle (Timeline)
Documents are not static; they evolve over time. The transition from one state to another automatically restricts who can modify the document and which fields are editable in the interface.

1. **State 1: Open / Draft (`ABI`)**
   * *Context*: The document is being drafted. Items are being added, and totals are being calculated.
   * *Who can edit*: `JEFE` and `AUX`.
   * *Interface Rules*: All text fields, supplier selectors, and "Add/Remove Item" buttons are enabled.
2. **State 2: Approved (`APR`)**
   * *Context*: The document has been reviewed and financially authorized.
   * *Who approves*: Exclusively `JEFE`.
   * *Interface Rules*: The document is completely locked. The interface switches to "Read-Only" mode. Save/edit buttons disappear.
   * *System Effect*: Stores an immutable record and triggers notifications to external accounting.
3. **State 3: Canceled (`ANU`)**
   * *Context*: The purchase is canceled before the merchandise is dispatched or received.
   * *Who cancels*: Exclusively `JEFE`.
   * *Rules*: Irreversible action. Releases committed budgets.

---

### 6. Visual Implementation Guidelines (UI): State & Role Matrix

To ensure data integrity and avoid human error, the user interface must dynamically render components based on the following matrix:

#### A. Purchase Order (PO) Module UI Rules
* **State 1: ABI (Open / Draft)**
  * *UI Context*: Active form view.
  * *`JEFE`*: Full Edit Access. All form fields (supplier, items, quantities, prices) are editable. **Visible Buttons**: *Save Draft*, *Approve Order*, *Cancel Order*.
  * *`AUX`*: Partial Edit Access. Form fields are editable to prepare the quote. **Visible Buttons**: *Save Draft*. **Hidden Buttons**: *Approve Order* and *Cancel Order* are strictly hidden.
  * *`OPER`*: No Access. The document does not appear in their dashboard.
* **State 2: APR (Approved)**
  * *UI Context*: Document locks to prevent post-approval tampering.
  * *`JEFE`*: Read-Only mode (all inputs are static text). **Visible Buttons**: *Cancel Order* (active for emergency rollback). **Hidden Buttons**: *Save Draft*, *Approve Order*.
  * *`AUX`*: Read-Only mode. All inputs are disabled. **Visible Buttons**: None.
  * *`OPER`*: No Access.
* **State 3: ANU (Canceled)**
  * *UI Context*: Canceled transaction.
  * *All Roles (`JEFE`, `AUX`, `OPER`)*: Read-Only mode. The UI displays a prominent visual indicator (e.g., a red "ANULADA" watermark or banner). All modification/cancellation buttons are permanently removed.

#### B. Auditability and Traceability
* Every state transition (e.g., from `ABI` to `APR`) must save a timestamp and the user ID of the session that executed the action in the database.

---

## Test Plan

1.  **Navigation Flow**:
    *   Verify that clicking "Proveedores" in the sidebar loads the dedicated suppliers view.
    *   Verify that clicking "Órdenes de Compra" loads the purchase orders view.
2.  **Supplier CRUD Actions**:
    *   Test adding a supplier with invalid/missing RUC and verify field validations.
    *   Test editing an existing supplier and verify list updates.
    *   Test deactivating a supplier and verify the badge changes to "Inactivo" (`INA`).
3.  **Purchase Order CRUD & Modal Actions**:
    *   Test creating a new purchase order with multiple items and dynamic tax selection (12% vs 15% IVA).
    *   Test clicking an order row to open the `CompraDetailModal`.
    *   Inside the modal:
        *   Verify that details match the row values.
        *   Trigger "Anular" status change and check if the badge on the main page updates to `ANU`.
        *   Verify that approved/cancelled orders disable editing fields.

---

## Risks / Edge Cases

1.  **Referential Integrity Constraints**:
    *   *Risk*: Trying to set a supplier to `INA` while they are referenced by open purchase orders.
    *   *Mitigation*: Display a warning in the UI, but let the database constraint or backend return an informative error message if the action is invalid.
2.  **Shared State Sync**:
    *   *Risk*: When navigating between `/dashboard/compras/ordenes` and `/dashboard/compras/proveedores`, the state might reset or lead to stale data.
    *   *Mitigation*: Ensure the react context or hook (`useCompras`) fetches fresh data upon page mounting or wraps the layout in a shared state provider.
3.  **Modifying Approved Orders**:
    *   *Risk*: A user bypasses UI rules and attempts to edit an order that is already approved (`APR`) or cancelled (`ANU`).
    *   *Mitigation*: The `CompraDetailModal` must explicitly block editing inputs and hide update buttons when the state is not `ABI`.

---

## Open Questions

1. **How should we handle cities (ciudades) CRUD?**
   * *Proposal*: Cities are managed as part of the supplier registry context (as a lookup field). A separate CRUD for cities can be added later if needed.
2. **What route should `/dashboard/compras` default to?**
   * *Proposal*: Redirect to `/dashboard/compras/ordenes`.
