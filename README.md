# PROYECTO 6: Aplicación Backend con Autenticación

> **Stack:** Node.js + Express (ESM) · TypeScript · MongoDB Atlas · Mongoose · JWT (Bearer) · Swagger/OpenAPI · Render · CORS

## Índice
1. [Intro](#intro)
2. [Demo](#demo)
3. [¿Qué construirás?](#qué-construirás)
4. [Objetivos de Aprendizaje](#objetivos-de-aprendizaje)
5. [Requisitos](#requisitos)
6. [Criterios de evaluación](#criterios-de-evaluación)
7. [Entregas](#entregas)
8. [Guía rápida de ejecución](#guía-rápida-de-ejecución)
9. [Arquitectura de carpetas](#arquitectura-de-carpetas)
10. [API y Endpoints](#api-y-endpoints)
11. [Autenticación y Autorización](#autenticación-y-autorización)
12. [Documentación (OpenAPI/Swagger)](#documentación-openapiswagger)
13. [Configuración de CORS](#configuración-de-cors)
14. [Despliegue en Render](#despliegue-en-render)

---

## 1. Intro
En este proyecto se construye una **API backend con autenticación y autorización** basada en **JWT**. La aplicación gestiona **usuarios** y **productos**, con operaciones CRUD sobre productos, persistencia en **MongoDB Atlas** (vía **Mongoose**), documentación con **OpenAPI/Swagger** y despliegue en **Render**.

Además, el servidor expone un **Swagger UI** para probar los endpoints y aplica **CORS** configurable por entorno. Se utiliza una estructura modular con **rutas**, **controladores** y **servicios**.

---

## 2. Demo
- **Producción (Render):** _LINK_  ← (reemplaza por tu URL de Render)
- **Swagger UI:** `https://lab6-qlw6.onrender.com//api-docs`

En la demo verás autenticación de usuarios y gestión de productos. La parte de e‑commerce/Stripe es **opcional**.

---

## 3. ¿Qué construirás?
Una API que maneja **login/registro** de usuarios (JWT) y permite **CRUD** sobre **productos**. Los modelos están relacionados por el **id del usuario** (por ejemplo, `createdBy`, `updatedBy` se rellenan desde el JWT en el backend).

> **Tecnologías:** Node.js + Express (ESM), TypeScript, JWT, MongoDB Atlas, Mongoose, CORS, Swagger.

---

## 4. Objetivos de Aprendizaje
- Comprender y aplicar **autenticación y autorización** con JWT.
- Modelar con **MongoDB + Mongoose** y operar CRUD.
- Documentar APIs con **OpenAPI/Swagger**.
- Desplegar backend en **Render** y DB en **MongoDB Atlas**.
- Organizar el proyecto con **controladores, servicios y rutas**.

---

## 5. Requisitos
**General**
- Trabajo individual.

**Arquitectura**
- Estructura clara de carpetas y archivos.

**Servicios CRUD**
- Autenticación y autorización con JWT.
- Mínimo 2 modelos: **Usuario** y **Producto**.
- CRUD completo para **Producto**.
- Uso de **MongoDB** y **Mongoose**.

**Control de versiones**
- Repositorio en **GitHub** con el proyecto.

**Entrega**
- Entrega a tiempo.

**Opcional**
- Documentar con **Swagger/OpenAPI**.
- Desplegar en **Render**.

---

## 6. Criterios de evaluación
| Área | % |
|---|---:|
| Arquitectura de carpetas y organización de código | 30% |
| Implementación de autenticación y autorización | 20% |
| Implementación de modelado de producto | 20% |
| Uso adecuado de Git & GitHub | 20% |
| Entrega a tiempo | 10% |

---

## 7. Entregas
- Alinear fechas con los coaches.
- Subir el proyecto a **GitHub** con este **README**.
- Aunque no esté 100% completo, **entregar** el avance alcanzado.

---

## 8. Guía rápida de ejecución

### Variables de entorno (`.env`)
```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
MDBURI=mongodb+srv://<usuario>:<password>@<cluster>/<params>
MDBPORT=27017
MDBDB=dwfs-lab6
SYSTEM_USER_ID=SYSTEM
JWT_SECRET=<tu_secreto_jwt>
```

### Instalación & desarrollo
```bash
# 1) Instalar dependencias
npm install

# 2) Compilar TypeScript
npm run build

# 3) Ejecutar (JS compilado)
npm start
# ó
node dist/app/main.js
```
> **Notas**
> - El proyecto usa **ESM**: en los imports de TypeScript se deja la **extensión .js** (aunque el archivo sea .ts) para que funcionen en `dist`.
> - Durante el build se copia `src/app/config/swagger.yaml` a `dist/app/config/swagger.yaml`.

---

## 9. Arquitectura de carpetas
```
EJEMPLO_TU_PROYECTO
├─ .env
├─ .gitignore
├─ README.md
├─ package.json
├─ tsconfig.json
└─ src/
   └─ app/
      ├─ main.ts           # archivo de entrada
      ├─ config/
      │  ├─ logger.ts
      │  ├─ environment.ts
      │  ├─ db.mongo.ts o database.ts
      │  └─ swagger.yaml
      ├─ routes/
      │  ├─ user.routes.ts
      │  └─ product.routes.ts
      ├─ controllers/
      │  ├─ user.controller.ts
      │  └─ product.controller.ts
      ├─ services/
      │  ├─ user.service.ts
      │  ├─ user.service.impl.ts
      │  ├─ product.service.ts
      │  └─ product.service.impl.ts
      └─ models/           # (si aplica)
```

---

## 10. API y Endpoints
La API se sirve bajo el prefijo `http://localhost:<PORT>/api`.

### Usuarios
| Descripción | Método | Endpoint |
|---|---|---|
| Registrar un usuario | **POST** | `/api/users/register` |
| Iniciar sesión | **POST** | `/api/users/login` |
| Verificar/Refrescar token | **GET** | `/api/users/verifytoken?refresh=true|false` |
| Actualizar usuario por ID | **PUT** | `/api/users/update/{id}` |

**Ejemplo — Registro**
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"juan","email":"juan@example.com","password":"123456"}'
```

### Productos
> Requieren JWT. Rutas con rol **seller** (create/update/delete) y **buyer** (readAll/readOne) según middlewares.

| Descripción | Método | Endpoint |
|---|---|---|
| Crear producto | **POST** | `/api/products/create` |
| Listar productos | **GET** | `/api/products/readAll` |
| Obtener producto por ID | **GET** | `/api/products/readOne/{id}` |
| Actualizar producto | **PUT** | `/api/products/update/{id}` |
| Eliminar producto | **DELETE** | `/api/products/delete/{id}` |

**Ejemplo — Crear**
```bash
curl -X POST http://localhost:3000/api/products/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Teclado 60%","descripcion":"switches rojos","precio":59.99}'
```

---

## 11. Autenticación y Autorización
- **JWT Bearer** en header `Authorization: Bearer <token>`.
- El backend toma el **id del usuario** desde el token y lo usa como `createdBy`/`updatedBy` en productos (no se envía en el body).
- Control de **roles** (`buyer`, `seller`, opcionalmente `admin`) en middlewares para restringir endpoints.

---

## 12. Documentación (OpenAPI/Swagger)
- **Spec:** `src/app/config/swagger.yaml` (copiado al build a `dist/app/config/swagger.yaml`).
- **UI:** `GET /api-docs`.
- La spec describe Users y Products, esquemas de request/response y seguridad **bearerAuth (JWT)**.

---

## 13. Configuración de CORS
Configurado en `main.ts` mediante la variable `ALLOWED_ORIGINS` (coma-separada). Ejemplo:
```env
ALLOWED_ORIGINS=https://tu-frontend.onrender.com,https://midominio.com,http://localhost:5173
```
El servidor permite **credenciales** (`credentials: true`) y valida el `origin` contra la lista blanca.

---

## 14. Despliegue en Render
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/app/main.js` (o `npm start`)
- **Node version:** especifica en `package.json` → `"engines": { "node": ">=18" }`
- **Environment Variables:** define las del `.env` (PORT, MDBURI, MDBDB, JWT_SECRET, ALLOWED_ORIGINS, etc.).

> Si usas imports con alias (ej. `config/...`), configura reescritura con **tsc-alias** o usa **rutas relativas** (`./config/...`).

---

### Troubleshooting
- **ERR_MODULE_NOT_FOUND: 'config'** → Corrige imports a **rutas relativas** o usa `tsc-alias`.
- **No arranca en Render** → Revisa que Swagger YAML se copie al `dist` en el script de build.
- **CORS bloquea** → Asegura `ALLOWED_ORIGINS` contenga la URL de tu frontend.

---


