# FabLab UTFSM Workflow Platform

Sistema web de apoyo para la gestion del FabLab UTFSM, construido a partir de los informes de rediseño del curso. El proyecto cubre el flujo principal de trabajo entre usuario, staff y administracion: proyectos, solicitudes de fabricacion, cotizaciones, inventario, reservas y seguimiento operativo.

## Que hace el proyecto

El sistema permite:

- iniciar sesion con roles `USER`, `STAFF` y `ADMIN`;
- completar el onboarding inicial de cuenta;
- crear y gestionar proyectos academicos;
- crear solicitudes de fabricacion con archivos tecnicos;
- revisar solicitudes por parte de staff;
- emitir cotizaciones con costo de maquina, preparacion, material y tiempo estimado;
- aceptar o rechazar cotizaciones por parte del usuario;
- gestionar inventario de materiales e insumos;
- reservar maquinas segun disponibilidad semanal, reglas por tipo de maquina y bloqueos por mantenimiento;
- operar solicitudes con tablero staff, fechas compromiso, responsable interno y notificaciones;
- administrar catalogo de tipos de maquina, maquinas y materiales.

## Stack

- Frontend: React + Vite + TypeScript
- API: Node.js + Express + TypeScript
- Base de datos: PostgreSQL
- ORM: Prisma
- Contenedores: Docker Compose

## Arquitectura

```text
fablab-platform/
  api/        -> API REST, Prisma, seed, archivos subidos
  frontend/   -> interfaz React
  docker-compose.yml
```

## Modulos principales

### Usuario final

- Inicio / dashboard personal
- Configuracion de cuenta
- Mis proyectos
- Detalle de proyecto
- Nueva solicitud
- Mis solicitudes
- Detalle de solicitud
- Mis reservas
- Crear / editar reserva
- Catalogo de maquinas

### Staff

- Dashboard operacional
- Tablero de solicitudes
- Detalle staff de solicitud
- Inventario staff
- Detalle de material
- Centro de notificaciones

### Admin

- Admin de materiales
- Admin de maquinas
- Admin de tipos de maquina

## Base de datos y carga inicial

La carga de base de datos que se debe subir a Git **no es un dump binario de PostgreSQL**. La fuente versionada del estado inicial es:

- `api/prisma/schema.prisma`
- `api/prisma/seed.ts`

Cuando levantas el proyecto con Docker, la API ejecuta:

```sh
npx prisma generate
npx prisma db push --force-reset
npm run seed
npm run dev
```

Eso significa:

- la base se recrea desde cero en cada arranque del contenedor `api`;
- el seed deja datos demo consistentes;
- no necesitas subir el volumen de PostgreSQL al repositorio;
- el estado inicial queda reproducible para cualquier persona que clone el proyecto.

Si mas adelante quieres persistir cambios manuales entre reinicios, debes quitar `--force-reset` del `command` del servicio `api` en [docker-compose.yml](H:\Documentos\Tabby\2026-S13\INF322\Proyecto\fablab-platform\docker-compose.yml).

## Credenciales seed

### Usuario

- email: `tabata.ahumada@usm.cl`
- clave: `123fablab..`

### Staff

- email: `staff.fablab@usm.cl`
- clave: `stafffablab..`

### Admin

- email: `admin.fablab@usm.cl`
- clave: `adminfablab..`

## Como levantar el proyecto con Docker

### Requisitos

- Docker
- Docker Compose

### Pasos

1. Clonar el repositorio.
2. Entrar a la carpeta del proyecto:

```bash
cd fablab-platform
```

3. Levantar contenedores:

```bash
docker compose up --build -d
```

4. Abrir:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

### Detener contenedores

```bash
docker compose down
```

### Reiniciar con base limpia

```bash
docker compose down -v
docker compose up --build -d
```

`down -v` elimina el volumen de PostgreSQL. De todos modos, como el `api` ya corre con `--force-reset`, el seed se vuelve a cargar automaticamente.

## Desarrollo local sin Docker

### 1. Levantar solo PostgreSQL

```bash
docker compose up db -d
```

### 2. Instalar dependencias

```bash
cd api
npm install
cd ../frontend
npm install
```

### 3. Configurar entorno

Usa estos archivos como base:

- `api/.env.example`
- `frontend/.env.example`

### 4. Inicializar base de datos

```bash
cd api
npx prisma generate
npx prisma db push --force-reset
npm run seed
```

### 5. Levantar API y frontend

En una terminal:

```bash
cd api
npm run dev
```

En otra:

```bash
cd frontend
npm run dev
```

## Endpoints y flujo funcional

### Auth y cuenta

- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me/profile`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Proyectos

- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `POST /api/projects/:id/members`
- `POST /api/projects/:id/files`

### Solicitudes

- `GET /api/requests`
- `GET /api/requests/:id`
- `POST /api/requests`
- `PUT /api/requests/:id`
- `POST /api/requests/:id/comments`

### Cotizaciones

- `POST /api/requests/:id/quotation`
- `GET /api/requests/:id/quotation`
- `POST /api/quotations/:id/accept`
- `POST /api/quotations/:id/reject`

### Materiales e inventario

- `GET /api/materials`
- `GET /api/materials/:id`
- `POST /api/materials`
- `PUT /api/materials/:id`
- `POST /api/materials/:id/movements`

### Reservas

- `GET /api/reservations`
- `GET /api/reservations/:id`
- `GET /api/reservations/availability`
- `POST /api/reservations`
- `PUT /api/reservations/:id`
- `POST /api/reservations/:id/cancel`
- `GET /api/machines/:id/schedule`

### Operacion staff

- `GET /api/staff/dashboard`
- `GET /api/staff/board`
- `GET /api/staff/requests`
- `GET /api/staff/requests/:id`
- `POST /api/requests/:id/assign`
- `POST /api/requests/:id/status`

### Notificaciones

- `GET /api/notifications`
- `POST /api/notifications/:id/read`

### Catalogo y administracion

- `GET /api/machine-types`
- `GET /api/machine-types/:id`
- `GET /api/admin/machine-types`
- `POST /api/admin/machine-types`
- `PUT /api/admin/machine-types/:id`
- `GET /api/admin/machines`
- `POST /api/admin/machines`
- `PUT /api/admin/machines/:id`

## Archivos que si se suben a Git

- codigo de `api/` y `frontend/`
- `schema.prisma`
- `seed.ts`
- `docker-compose.yml`
- assets del frontend
- `api/uploads/request-files/.gitkeep`

## Archivos que no se deben subir

- `node_modules/`
- archivos `.env`
- volumenes y dumps locales de PostgreSQL
- uploads reales de usuarios
- builds locales (`dist/`, `.vite/`)

Esto ya esta cubierto por [.gitignore](H:\Documentos\Tabby\2026-S13\INF322\Proyecto\fablab-platform\.gitignore).

## Recomendacion para subirlo a Git

Sube el proyecto desde la carpeta `fablab-platform` y no desde la carpeta superior donde estan los PDFs del curso. La estructura recomendable del repositorio es:

```text
repo/
  api/
  frontend/
  docker-compose.yml
  README.md
  .gitignore
```

Si quieres inicializar Git ahi mismo:

```bash
cd fablab-platform
git init
git add .
git commit -m "feat: base completa plataforma fablab"
```

## Estado actual

El proyecto esta listo como base de desarrollo y demo funcional. La forma correcta de compartir la base de datos en Git ya quedo resuelta mediante `Prisma + seed reproducible`, que es mas limpia y portable que subir datos binarios del contenedor.
