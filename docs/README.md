# 📁 ERP Distributed System Documentation - Proyecto RDA3

This folder contains the technical specifications, architectural guidelines, and AI instructions for the development of the distributed ERP system (Proyecto RDA3).

---

## 🏛️ System Core Specifications

*   **[`technical-requirements.md`](./technical-requirements.md)**: Detalla la arquitectura de software general, la pila tecnológica elegida (Bootstrap CSS + HTML + Vanilla JS en el frontend; Node.js + Express en el backend), la estructura distribuida de base de datos por microservicio, el mapa detallado de directorios y el flujo secuencial del Single Sign-On (SSO) con tokens JWT.
*   **[`golden-rules.md`](./golden-rules.md)**: Establece las normas de ingeniería de cumplimiento obligatorio. Detalla las fronteras del patrón MVC, el encapsulamiento de peticiones HTTP en el frontend, la política de aislamiento estricto de base de datos entre microservicios, las restricciones de routing en el backend y el esquema de seguridad para JWT.
*   **[`architecture/README.md`](./architecture/README.md)**: Ofrece la visión de arquitectura de alto nivel del sistema, los diagramas de interacción y casos de comunicación inter-servicio (como la deducción de inventario desde ventas).

---

## 🤖 AI Development Framework (`./ai_development/`)

This directory holds configuration and rules tailored for AI-assisted development of this repository.

*   **[`ai_development/README.md`](./ai_development/README.md)**: Índice general del framework de IA.
*   **[`ai_development/agents/`](./ai_development/agents/)**: Catálogo y directrices específicas para los agentes de desarrollo (Architect, Engineer, Reviewer).
*   **[`ai_development/workflows/`](./ai_development/workflows/)**: Rutinas de desarrollo estructuradas para fases de preparación, diseño, implementación y entrega.
