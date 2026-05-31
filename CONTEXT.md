# Innamoratti Focaccia — Sistema de Apertura y Cierre Digital
## Documento de Contexto de Desarrollo

---

## 1. Resumen del Proyecto

Sistema web centralizado para el restaurante **Innamoratti Focaccia** que reemplaza checklists HTML estáticos. Permite a cada empleado iniciar sesión con un código único, completar sus checklists de apertura/cierre según su rol, y al administrador monitorear el estado de todas las áreas en tiempo real.

**Problema que resuelve:** Actualmente los checklists son páginas HTML sueltas, sin control de acceso, sin historial, sin roles y sin visibilidad para el administrador.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
|Frontend+Backend | **Next.js** (App Router) |
| Base de datos | **Supabase** (PostgreSQL) |
| Auth | **Custom** — login por código numérico (ver sección 4) |
| Estilos | Tailwind CSS |
| Estado/Sesión | Cookies HTTP-only con JWT firmado |
| Emails | **Resend** (notificaciones al admin) |

> **No usar Supabase Auth.** La autenticación es 100% custom con tabla de usuarios propia.

---

## 3. Áreas y Checklists del Restaurante

El sistema cubre exactamente estos 6 procesos:

| ID | Área | Tipo | Rol responsable |
|---|---|---|---|
| `salon_apertura` | Salón | Apertura (turno mañana) | Mesero / Salón |
| `salon_cierre` | Salón | Cierre de turno | Mesero / Salón |
| `cocina_apertura` | Cocina | Apertura | Cocinero / Cocina |
| `cocina_cierre` | Cocina | Cierre | Cocinero / Cocina |
| `caja_apertura` | Caja | Apertura | Cajero / Caja |
| `caja_cierre` | Caja | Cierre (Corte Maestro) | Cajero / Caja |

**Contenido de cada checklist (preservar del HTML original):**

- **Apertura Salón:** Preparación espacio físico, mobiliario exterior, limpieza de pisos, equipamiento de mesas, verificación de cristales, apertura oficial.
- **Cierre Salón:** Desmontaje de mesas, limpieza de barra/piso/mobiliario, guardado espejo y mobiliario exterior, verificación de baños, cierre del local.
- **Apertura Cocina:** Revisión limpieza y existencias, limpieza de equipos, montaje de barra con ingredientes e insumos.
- **Cierre Cocina:** Limpieza profunda de equipos y superficies, acomodo de utensilios e insumos, actividades generales de cierre.
- **Apertura Caja:** Recepción y conteo del fondo ($1,500), verificación sistema POS, impresora de tickets, datafono, métodos de pago.
- **Cierre Caja (Corte Maestro):** Preparación del corte, conteo del dinero por denominación (calculadora integrada), entrega del fondo y ventas al encargado, cierre del sistema, verificación final del local.

---

## 4. Autenticación — Login por Código

### Concepto
- **No hay email ni contraseña.** Cada empleado solo necesita ingresar su **código de acceso** (alfanumérico, ej: `4821`).
- El código es único por usuario.
- El admin crea el usuario → el sistema **genera el código automáticamente** (random de 4-6 chars + nombre-área).
- El admin puede **editar/cambiar el código** manualmente cuando quiera.
- El código se guarda **hasheado** en la base de datos (bcrypt).

### Flujo de login
```
1. Usuario entra a / → redirige a /login
2. Pantalla simple: campo único "Ingresa tu código"
3. POST /api/auth/login { code: "4821" }
4. Server busca en tabla users, compara hash
5. Si match → crea sesión (JWT en cookie HTTP-only)
6. Redirige según rol:
   - admin/encargado → /admin
   - empleado → /dashboard
   - dueño → /admin (solo lectura)
```

### Implementación
- Cookie `session` HTTP-only, SameSite=Strict, firmada con `JWT_SECRET` en `.env.local`
- Middleware de Next.js (`middleware.ts`) protege rutas por rol
- Sesión expira en 12 horas o al cerrar sesión manualmente
- No hay "olvidé mi código" — el admin lo resetea desde el panel

---

## 5. Roles del Sistema

| Rol | Valor en DB | Acceso |
|---|---|---|
| Administrador / Encargado | `admin` | Todo: panel de control, historial, gestión de empleados, todos los checklists |
| Cajero / Caja | `cajero` | `caja_apertura`, `caja_cierre` |
| Cocinero / Cocina | `cocinero` | `cocina_apertura`, `cocina_cierre` |
| Mesero / Salón | `mesero` | `salon_apertura`, `salon_cierre` |
| Dueño (solo lectura) | `dueno` | Panel admin en modo lectura, historial — **no puede editar nada** |

---

## 6. Esquema de Base de Datos (Supabase / PostgreSQL)

### Tabla: `users`
```sql
create table users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text not null check (role in ('admin','cajero','cocinero','mesero','dueno')),
  access_code text not null,        -- bcrypt hash del código
  code_display text not null,       -- código en texto plano SOLO para mostrarlo al admin al crearlo
  is_active   boolean default true,
  created_at  timestamptz default now()
);
```
> `code_display` se muestra una vez al admin cuando se crea el usuario. Sirve para que el admin pueda dárselo al empleado. Después el admin puede cambiarlo desde el panel.

### Tabla: `checklists`
```sql
create table checklists (
  id           uuid primary key default gen_random_uuid(),
  area_id      text not null,   -- 'salon_apertura', 'cocina_cierre', etc.
  user_id      uuid references users(id),
  date         date not null,   -- fecha de operación
  status       text default 'in_progress' check (status in ('in_progress','completed')),
  completed_at timestamptz,
  created_at   timestamptz default now()
);
```

### Tabla: `checklist_items`
```sql
create table checklist_items (
  id             uuid primary key default gen_random_uuid(),
  checklist_id   uuid references checklists(id) on delete cascade,
  item_key       text not null,   -- identificador de la tarea (ej: 'limpiar_pisos')
  label          text not null,   -- texto visible de la tarea
  is_completed   boolean default false,
  note           text,            -- nota/alerta opcional del empleado
  completed_at   timestamptz,
  completed_by   uuid references users(id)
);
```

### Tabla: `cash_close_details` (solo para Cierre de Caja)
```sql
create table cash_close_details (
  id              uuid primary key default gen_random_uuid(),
  checklist_id    uuid references checklists(id) on delete cascade,
  denom_1000      int default 0,
  denom_500       int default 0,
  denom_200       int default 0,
  denom_100       int default 0,
  denom_50        int default 0,
  denom_20        int default 0,
  denom_10        int default 0,
  denom_5         int default 0,
  denom_1         int default 0,
  total_counted   numeric(10,2),
  fund_amount     numeric(10,2) default 1500,
  sales_amount    numeric(10,2),
  digital_signature text          -- nombre del cajero como firma
);
```

---

## 7. Estructura de Rutas (Next.js App Router)

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx              # Pantalla de ingreso de código
│
├── (app)/
│   ├── layout.tsx                # Layout con sesión requerida
│   ├── dashboard/
│   │   └── page.tsx              # Panel del empleado: sus checklists del día
│   ├── checklist/
│   │   └── [areaId]/
│   │       └── page.tsx          # Checklist individual (e.g. /checklist/cocina_apertura)
│   │
│   └── admin/
│       ├── page.tsx              # Panel de control del admin (estado en tiempo real)
│       ├── usuarios/
│       │   ├── page.tsx          # Lista de empleados
│       │   └── nuevo/
│       │       └── page.tsx      # Crear nuevo usuario
│       └── historial/
│           └── page.tsx          # Historial por fecha y área
│
├── api/
│   ├── auth/
│   │   ├── login/route.ts        # POST — verifica código, crea sesión
│   │   └── logout/route.ts       # POST — destruye sesión
│   ├── checklists/
│   │   ├── route.ts              # GET (listar del día), POST (crear)
│   │   └── [id]/
│   │       ├── route.ts          # GET, PATCH (actualizar estado)
│   │       └── items/
│   │           └── [itemId]/
│   │               └── route.ts  # PATCH (marcar tarea completa, agregar nota)
│   └── users/
│       ├── route.ts              # GET (listar), POST (crear usuario + generar código)
│       └── [id]/
│           └── route.ts          # PATCH (editar), DELETE (desactivar)
│
└── middleware.ts                 # Protección de rutas por rol
```

---

## 8. Lógica de Generación de Códigos (Admin Panel)

```typescript
// Al crear un usuario, generar código automático
function generateAccessCode(name: string): string {
  const prefix = name.split(' ')[0].toUpperCase().slice(0, 4)
  const suffix = Math.floor(1000 + Math.random() * 9000) // 4 dígitos
  return `${prefix}-${suffix}` // Ej: "BETO-4821"
}

// El admin también puede sobreescribir el código manualmente en el form
```

---

## 9. Funcionalidades Clave por Vista

### `/login`
- Campo único de texto grande (para celular)
- Botón "Entrar"
- Mensaje de error si el código no es válido o el usuario está inactivo

### `/dashboard` (Empleado)
- Muestra solo los checklists del día que corresponden a su rol
- Cada checklist tiene: progreso en % (barra), estado (pendiente/en progreso/completado), botón para abrir
- Si ya completó todos → mensaje de confirmación

### `/checklist/[areaId]`
- Lista de tareas con checkbox
- Cada tarea tiene opción de agregar nota/alerta
- Autoguardado al marcar cada ítem (PATCH al API)
- Cuando llega al 100% → botón "Confirmar y Firmar" (nombre del empleado como firma digital)
- Caso especial `caja_cierre`: incluye calculadora de denominaciones que suma automáticamente

### `/admin` (Panel de Control) — Layout Desktop-first
- **Layout de escritorio:** sidebar fija a la izquierda (navegación: Panel, Usuarios, Historial) + área de contenido principal. Responsive: en móvil el sidebar colapsa a bottom nav.
- Grid de 3 columnas en desktop: una tarjeta grande por área (Salón, Cocina, Caja). En móvil apilan verticalmente.
- Cada tarjeta de área muestra:
  - Nombre del área + icono
  - Barra de progreso de apertura (%) con nombre del empleado responsable
  - Barra de progreso de cierre (%) con nombre del empleado responsable
  - Indicador de color: verde (100%), amarillo (en progreso), gris (no iniciado)
  - Lista de alertas/notas activas del día (si las hay)
- Sección inferior: feed de actividad reciente del día (quién completó qué y a qué hora)
- Actualización automática (polling cada 30s o Supabase Realtime)

### `/admin/usuarios`
- Tabla de empleados con: nombre, rol, código visible, estado (activo/inactivo)
- Botón "Nuevo empleado" → formulario (nombre, rol) → sistema genera código → se muestra UNA VEZ
- Editar: puede cambiar nombre, rol, código, activar/desactivar
- No se elimina físicamente, solo `is_active = false`

### `/admin/historial`
- Filtros: por fecha (date picker) y por área
- Tabla de resultados: qué tareas se completaron, cuáles no, a qué hora, quién
- Para cierre de caja: muestra el detalle del conteo

---

## 10. Seguridad

- **Middleware** (`middleware.ts`): verifica JWT en cookie en cada request; redirige a `/login` si no hay sesión válida
- **Protección por rol en API Routes:** cada endpoint verifica el rol del usuario en sesión antes de responder
- **Códigos hasheados con bcrypt** (no se guarda en texto plano en `access_code`; `code_display` solo se usa para mostrarlo al admin)
- **Un cocinero que intente `/checklist/caja_apertura`** recibe 403 — el middleware lo bloquea
- Las cookies son HTTP-only (no accesibles desde JS del browser)

---

## 11. Variables de Entorno (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # Solo para server-side (API routes)
JWT_SECRET=...                   # Para firmar tokens de sesión
RESEND_API_KEY=...               # Para envío de emails (resend.com)
ADMIN_EMAIL=...                  # Email del administrador que recibe notificaciones
```

---

## 12. Casos de Uso Clave (referencia del documento original)

| CU | Actor | Descripción |
|---|---|---|
| CU-01 | Empleado | Completa apertura de su área: marca tareas → confirma con firma digital |
| CU-02 | Admin | Ve panel con % de cada área en tiempo real |
| CU-03 | Cajero | Realiza corte de caja con calculadora de denominaciones |
| CU-04 | Admin | Crea usuario nuevo, sistema genera código, se lo da al empleado |
| CU-05 | Admin | Consulta historial de un día específico y área específica |
| CU-06 | Empleado | Reporta problema en una tarea con nota — visible para admin |
| CU-07 | Sistema | Bloquea acceso de un rol a sección que no le corresponde |

---

## 13. Decisiones de Diseño

- **Mobile-first:** Los empleados lo usan en celular durante el turno. Tamaño de fuente grande, checkboxes táctiles grandes.
- **Sin email/password recovery:** Si el empleado pierde su código, el admin lo cambia desde el panel. Simple y sin fricción.
- **Un checklist por día por área:** No se pueden crear múltiples del mismo tipo en el mismo día. Si ya existe uno, se continúa.
- **El contenido de los checklists es fijo en código** (no hay editor de tareas en el MVP). Las tareas están definidas en un archivo de configuración.
- **Código de acceso display:** Mostrar el código al admin solo al crear/editar, con botón de copiar. Después solo se ve como `****` en la tabla.
- **Realtime optional:** Implementar con polling cada 30 segundos si Supabase Realtime añade complejidad innecesaria para el MVP.
