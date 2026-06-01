# 🛒 Sistema Distribuido - Proyecto RDA3

Bienvenidos al repositorio. Este proyecto consiste en un sistema estructurado con una **arquitectura de base de datos distribuida y microservicios**, aplicando de manera estricta el **patrón MVC** y estándares de código limpio.

---

## 📁 Estructura del Proyecto

El proyecto está claramente separado en Frontend (Vista) y Backend (Modelos y Controladores distribuidos).

### 🖥️ Frontend (La Vista)
Se encarga de la interfaz y la interacción con el usuario. Será desplegado en **Vercel**.
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
Se compone de **4 APIs independientes**, que serán desplegadas en **Render**.
Cada API gestiona su propia base de datos, garantizando la arquitectura distribuida:
1. `api-talento-humano`
2. `api-compras`
3. `api-ventas`
4. `api-inventario`

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

Para que el sistema funcione de manera distribuida y sin problemas en el despliegue, **TODOS** deben adherirse a las siguientes reglas.

### ✅ QUÉ SÍ HACER:
1. **Respetar el patrón MVC:** El Frontend es solo para pintar y recibir eventos. Toda la lógica dura del negocio y bases de datos va en el Backend.
2. **Encapsular llamados al API:** En el Frontend, cualquier llamada HTTP (`fetch`) debe crearse dentro de la carpeta `services/`. Los controladores del Frontend solo llaman al servicio.
3. **Manejar Errores:** En el Backend, utiliza bloques `try-catch` y devuelve respuestas estandarizadas (ej: `{ "success": false, "error": "Mensaje" }`).
4. **Variables de Entorno:** Utiliza archivos `.env` locales para las credenciales de la BD. Estos archivos NO deben subirse al repositorio.
5. **Comunicación entre APIs:** Si Ventas necesita descontar Inventario, el `api-ventas` debe hacer una petición HTTP al endpoint del `api-inventario`.

### ❌ QUÉ NO HACER (Estrictamente Prohibido):
1. **NO mezclar responsabilidades en el Frontend:** No hagas peticiones `fetch` directamente en el `index.html` ni modifiques el DOM dentro de los archivos de `services/`.
2. **NO escribir lógica de negocio en las rutas:** Los archivos dentro de `routes/` en el backend SOLO deben redirigir la petición al Controlador correspondiente.
3. **NO compartir Base de Datos:** Está prohibido que un API (ej. Compras) se conecte directamente mediante cadena de conexión a la base de datos de otra API (ej. Inventario).
4. **NO subir `node_modules`:** Asegúrense de que el archivo `.gitignore` esté correctamente configurado desde el primer commit.
5. **NO subir código sin probar:** Prueben con Postman que su API funciona y responde antes de hacer un Pull Request o Push a la rama principal.

---

