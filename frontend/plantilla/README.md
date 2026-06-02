# 🛒 Sistema Distribuido - Proyecto RDA3

Bienvenidos al repositorio. Este proyecto consiste en un sistema estructurado con una arquitectura de base de datos distribuida y microservicios, aplicando de manera estricta el patrón MVC y estándares de código limpio.

---

## 📁 Estructura del Proyecto

El proyecto está claramente separado en Frontend (Vista) y Backend (Modelos y Controladores distribuidos).

### 🖥️ Frontend (La Vista)
Se encarga de la interfaz y la interacción con el usuario. Será desplegado en Vercel.

```text
frontend/
│   ├── public/                   # Archivos estáticos (imágenes, iconos)
│   ├── src/
│   │   ├── css/                  # Estilos (Bootstrap personalizado)
│   │   ├── js/
│   │   │   ├── controllers/      # Controladores del Frontend (manejadores de eventos del DOM)
│   │   │   ├── services/         # Clientes API (fetch/axios hacia las 4 APIs de Render)
│   │   │   └── views/            # Componentes o renderizadores de UI dinámicos
│   │   └── index.html            # Dashboard principal
```

### ⚙️ Backend (Modelos y Controladores)
Se compone de 4 APIs independientes, que serán desplegadas en Render. Cada API gestiona su propia base de datos, garantizando la arquitectura distribuida:
*   `api-talento-humano`
*   `api-compras`
*   `api-ventas`
*   `api-inventario`

Todas las APIs siguen obligatoriamente esta estructura interna:
```text
backend/api-[modulo]/
  ├── config/        # Configuración de la base de datos y variables de entorno
  ├── routes/        # Definición de las rutas/endpoints del API
  ├── middlewares/   # Interceptores (validación de datos, autenticación, etc.)
  ├── controllers/   # Lógica de negocio (procesamiento de peticiones)
  └── models/        # Esquemas y lógica directa de base de datos
```

---

## ⚠️ Reglas de Trabajo (Guía para el Equipo)

Para que el sistema funcione de manera distribuida y sin problemas en el despliegue, TODOS deben adherirse a las siguientes reglas:

### ✅ QUÉ SÍ HACER:
*   **Respetar el patrón MVC:** El Frontend es solo para pintar y recibir eventos. Toda la lógica dura del negocio y bases de datos va en el Backend.
*   **Encapsular llamados al API:** En el Frontend, cualquier llamada HTTP (fetch) debe crearse dentro de la carpeta `services/`. Los controladores del Frontend solo llaman al servicio.
*   **Manejar Errores:** En el Backend, utiliza bloques `try-catch` y devuelve respuestas estandarizadas (ej: `{ "success": false, "error": "Mensaje" }`).
*   **Variables de Entorno:** Utiliza archivos `.env` locales para las credenciales de la BD. Estos archivos NO deben subirse al repositorio.
*   **Comunicación entre APIs:** Si Ventas necesita descontar Inventario, el `api-ventas` debe hacer una petición HTTP al endpoint del `api-inventario`.

### ❌ QUÉ NO HACER (Estrictamente Prohibido):
*   **NO mezclar responsabilidades en el Frontend:** No hagas peticiones fetch directamente en el `index.html` ni modifiques el DOM dentro de los archivos de `services/`.
*   **NO escribir lógica de negocio en las rutas:** Los archivos dentro de `routes/` en el backend SOLO deben redirigir la petición al Controlador correspondiente.
*   **NO compartir Base de Datos:** Está prohibido que un API (ej. Compras) se conecte directamente mediante cadena de conexión a la base de datos de otra API (ej. Inventario).
*   **NO subir node_modules:** Asegúrense de que el archivo `.gitignore` esté correctamente configurado desde el primer commit.
*   **NO subir código sin probar:** Prueben con Postman que su API funciona y responde antes de hacer un Pull Request o Push a la rama principal.

---

## 🔒 Arquitectura de Autenticación Centralizada (SSO con JWT)

El sistema utiliza un enfoque de Proveedor de Identidad Centralizado para evitar la duplicación de credenciales en las diferentes bases de datos.

*   **El Guardián de Acceso:** Únicamente el API de Talento Humano (que posee las tablas de usuario y rol) es el encargado de procesar el Login.
*   **JSON Web Tokens (JWT):** Cuando un usuario inicia sesión correctamente, Talento Humano genera un Token JWT firmado criptográficamente.
*   **Uso del Token:** El Frontend guarda este Token y lo envía en la cabecera `Authorization: Bearer <token>` en cada petición que haga a cualquiera de las 4 APIs.
*   **Validación Distribuida:** Las APIs de Compras, Ventas e Inventario NO se conectan a la base de datos de Talento Humano. En su lugar, comparten la misma clave secreta (`JWT_SECRET` en su `.env`). Al recibir una petición, usan esta clave secreta para verificar matemáticamente que el Token es auténtico y extraer de ahí el ID del usuario y su Rol.
    *Esto garantiza un Single Sign-On rápido y descentraliza la carga de validación.*
