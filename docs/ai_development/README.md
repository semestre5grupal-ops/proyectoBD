# 🤖 AI Development Framework Index

This directory (`docs/ai_development/`) defines the configuration, roles, and automated workflows used for AI-assisted development in this repository.

---

## 📂 AI Development File Structure

```text
docs/ai_development/
├── README.md           # This index file
├── agents/             # Specialist AI agent personas
│   ├── README.md       # Catálogo de agentes
│   ├── engineer.md     # Guidelines for Frontend UI Engineering
│   ├── architect.md    # Guidelines for Frontend System Architecture
│   └── architect-reviewer.md # Reviewer for MVC rules and SOLID compliance
├── workflows/          # Structured development commands
│   ├── README.md       # Index of workflows
│   ├── prepare.md      # Context ingestion routine
│   ├── design-session.md # Architectural design planning
│   ├── implementation-session.md # Coding and environment deployment
│   └── deliver.md      # Testing and delivery checklist
└── languages/          # Language conventions
    └── README.md       # Target language guidelines index
```

---

## 👥 1. AI Developer Personas (`./agents/`)

| Agent | Spec File | Role |
| :--- | :--- | :--- |
| **Frontend Architect** | [`architect.md`](./agents/architect.md) | Organizes layout structure, specifies controller-service boundaries, maps out dynamic view rendering, and reviews overall system performance. |
| **Software Engineer** | [`engineer.md`](./agents/engineer.md) | Implements event listeners in controllers, builds fetch/axios services, codes view renderers, and applies responsive Bootstrap styling. |
| **Architect Reviewer** | [`architect-reviewer.md`](./agents/architect-reviewer.md) | Validates that proposed code does not bypass services, does not write direct fetch queries in views, and adheres to strict microservice DB isolation rules. |

---

## 🔄 2. Structured Workflows (`./workflows/`)

1. **`$prepare` ([`prepare.md`](./workflows/prepare.md))**:
   * Ingests general requirements, architectural specifications, and golden rules prior to coding.
2. **`$design-session <feature>` ([`design-session.md`](./workflows/design-session.md))**:
   * Creates a formal design schema under `docs/design_sessions/` to review interface structure and API endpoints before coding.
3. **`$implementation-session <feature>` ([`implementation-session.md`](./workflows/implementation-session.md))**:
   * Codes the implementation plan in accordance with strict MVC boundaries (controllers, services, views).
4. **`$deliver` ([`deliver.md`](./workflows/deliver.md))**:
   * Checks implementation against the *Golden Rules* and runs visual audits.
