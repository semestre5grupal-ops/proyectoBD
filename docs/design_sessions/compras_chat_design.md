# Active Design Specification

## Feature Name

Compras Module Chat Integration (Adapted from `app/chat`)

---

## Problem Statement

The Compras module (`app/compras`) requires a robust, granular chat interface to facilitate procurement workflows, supplier communications, and AI-assisted task management. We need to duplicate the existing, highly polished chat system located in `frontend/plantilla/src/app/chat` and adapt its structure and logic for the purchasing domain. The goal is to retain 100% of the UI/UX quality, component architecture, and agent capabilities (`erp-agent.ts`, `use-agent.ts`) while scoping the data and intents strictly to "Compras" (e.g., purchase orders, supplier interactions, inventory ingress).

---

## Scope

**Included:**
- Creating a dedicated chat architecture for the Compras module, mirroring `frontend/plantilla/src/app/chat`.
- Porting and adapting the component structure:
  - `components/chat-header.tsx`: Adapted for purchasing context (e.g., Supplier info, Compras AI).
  - `components/chat.tsx`: The core wrapper.
  - `components/conversation-list.tsx` & `conversation-list-new.tsx`: Showing procurement team or supplier threads.
  - `components/message-input.tsx`: Chat input tailored with relevant placeholders.
  - `components/message-list.tsx`: Rendering chat bubbles and system messages.
  - `components/task-card.tsx`: Adapted to render specific Compras entities (e.g., Purchase Order summaries, Supplier Cards).
- Porting and adapting the logic layer:
  - `hooks/use-agent.ts`: Modifying the simulated AI logic to handle intents like `CREATE_PURCHASE_ORDER`, `CHECK_SUPPLIER_STATUS`, etc.
  - `types/erp-agent.ts`: Adding purchasing-specific type definitions.
  - `use-chat.ts`: State management for the chat interface.
  - `prompts/`: Adapting system prompts for the Compras domain.
- Data mocking:
  - Adapting `data/conversations.json`, `data/messages.json`, and `data/users.json` to feature suppliers, logistics personnel, and procurement officers.

**Excluded:**
- Modifying the original global `app/chat` module.
- Backend database implementations for chat (this focuses purely on frontend UI, state, and simulated agent logic as implemented in the template).
- Full live WebSockets (using the existing template's simulated delay/polling mechanics).

---

## Implementation Details

1. **Directory Structure:**
   We will establish a new directory structure within the Compras module to encapsulate the chat feature, preventing interference with the global chat.
   Suggested path: `frontend/plantilla/src/app/compras/components/chat/`
   
2. **Component Adaptation (`components/`):**
   - **`chat.tsx` & `page.tsx` logic:** The original `app/chat/page.tsx` is very large (26KB) and handles complex layout (Sidebar, Main Content). We will extract the necessary layout logic to fit within the Compras dashboard, either as a slide-out panel, a dedicated tab, or a split-pane view.
   - **`message-list.tsx`:** We will retain its scrolling logic, message grouping, and integration with `task-card`.
   - **`task-card.tsx`:** This is crucial. We will alter the props and rendering logic to display "Orden de Compra" (PO) details, total amounts, supplier names, and action buttons like "Aprobar Orden" or "Registrar Ingreso".

3. **Logic and Agent Adaptation (`hooks/`, `types/`):**
   - **`use-agent.ts`:** The original `use-agent.ts` simulates an ERP agent. We will modify the regex matching or intent detection to listen for keywords like "comprar", "proveedor", "orden de compra", "recepción".
   - **`types/erp-agent.ts`:** Define new interfaces such as `PurchaseOrderTask`, `SupplierQuery`, extending the base agent types.
   - **`use-chat.ts`:** Keep the message sending, typing indicators, and state manipulation intact.

4. **Context & State:**
   Ensure that the state (selected conversation, message history) is isolated to the Compras module so that interacting with the Compras Chat doesn't mutate the Global Chat's state.

---

## Test Plan

- **UI Fidelity:** Verify the adapted Compras chat looks visually identical in quality to the original `app/chat` (Shadcn components, hover effects, dark/light mode compatibility).
- **Layout Integration:** Ensure embedding the chat into `app/compras` does not break the existing Compras page layout or overflow boundaries unexpectedly.
- **Agent Interactivity:** Test typing a procurement command (e.g., "Generar orden para Comercial JW") and verify `use-agent.ts` intercepts it and responds with the mocked Compras task card.
- **State Isolation:** Verify that messages sent in the Compras chat do not appear in the global `app/chat` state.

---

## Risks / Edge Cases

- **CSS/Layout Conflicts:** `app/chat/page.tsx` might rely on specific viewport heights (`h-screen`, `h-[calc(100vh-rem)]`) that could conflict when nested inside another dashboard page.
- **Hardcoded Imports:** Extensive care must be taken to update all internal imports (e.g., `import data from '../data/conversations.json'`) to point to the new Compras-specific data files, avoiding accidental linkage to the global chat data.
- **Context Leakage:** If `use-chat.ts` utilizes a global Context Provider defined high in the React tree, we might need to duplicate or scope the Context Provider specifically for the Compras page.

---

## Open Questions

1. **Layout Strategy:** Should this chat be integrated into `compras/page.tsx` as a permanent split-pane view, a collapsible sidebar, or a separate sub-route (`/dashboard/compras/chat`)?
2. **Agent Focus:** Should the Compras chat *only* be an AI Assistant interface (removing peer-to-peer conversation features like group chats), or should we mock human suppliers as well?
3. **Data Strategy:** Are we strictly mocking the data via JSON files (as in `app/chat/data`), or should we attempt to read actual Suppliers from the `api-compras` backend?
