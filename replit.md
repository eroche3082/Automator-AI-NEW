# AUTOMATOR AI — Biblia Completa del Sistema

## Visión general
SaaS de automatización de ventas y CRM con IA. Plataforma multi-tenant con autenticación Firebase, suscripciones Stripe, IA Gemini/Vertex y orquestación opcional con n8n. Comunicación interna en español, profesional, sin emojis.

## Preferencias del usuario
- Idioma: Español, profesional, sin emojis.
- Verificación exhaustiva: cada botón/enlace/feature debe estar cableado a backend real (NO MOCK).
- No tocar: `server/vite.ts`, `vite.config.ts`, `package.json`, `drizzle.config.ts`.

## Arquitectura

### Stack
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui + Wouter + TanStack Query v5 + react-hook-form + zodResolver.
- **Backend**: Express.js + TypeScript + Drizzle ORM.
- **DB**: PostgreSQL en NeonDB.
- **Auth**: Firebase Auth (cliente) + Firebase Admin (servidor) — middleware `requireAuth` + `loadCurrentUser` resuelve `req.dbUser`.
- **IA**: Google Vertex AI / Gemini en servidor via `/api/ai/*`. Cliente llama directamente al backend (Firebase AI Logic eliminado — era un bypass con credenciales hardcodeadas).
- **Pagos**: Stripe live (`acct_1OFjtMLyFdxK9hC8` Edgar Roche), 3 planes (`basic`, `pro`, `elite`) con intervalos `month`/`year`, billing portal.
- **Orquestación**: n8n opcional (avisa si no hay API key).
- **Servicios Google**: Translate API, Text-to-Speech.

### Convenciones críticas
- `apiRequest` en `client/src/lib/queryClient.ts` usa firma de objeto: `apiRequest({ url, method, data })` — **NO** posicional.
- Default `queryFn` de TanStack Query usa solo `queryKey[0]` como URL → siempre URL completa en `queryKey[0]`.
- Todos los `insertXxxSchema` son `.strict()`: rechazan claves extra. `userId` lo fuerza el servidor desde `req.dbUser`, nunca el cliente.
- Endpoints CRUD verifican propietario: `target.userId !== req.dbUser!.id → 404`.
- Validación Zod centralizada con helper `parseOrFail(schema, body, res)`.
- Mutaciones invalidan cache por `queryKey` y disparan toast de éxito/error.
- Páginas muestran banner rojo si `isError` (típicamente 401 sin login Firebase).

## Modelo de datos (`shared/schema.ts`)

| Tabla | Campos clave | Propietario |
|---|---|---|
| `users` | firebaseUid, email, stripeCustomerId, plan, notificationPrefs | — |
| `workflows` | name, description, status, steps (JSON), userId | userId |
| `leads` | name, email, status, score, source, userId | userId |
| `emailTemplates` | name, type (template/automation), subject, content, emails, lastEdited, userId | userId |
| `meetings` | title, description, startTime, endTime, attendees, type (video/in-person/phone), link, status, userId | userId |
| `integrations` | name, icon, status, config (JSON), lastSync, userId | userId |
| `webhooks` | name, url, active, events (JSON), secretKey (`whsec_...` 24-byte hex), userId | userId |

Cada tabla tiene `insertXxxSchema`, `createXxxPayloadSchema` (omit userId, strict) y `updateXxxPayloadSchema` (partial, strict).

## Endpoints (`server/routes.ts`) — todos `tenant-scoped`

### Auth/usuario
- `GET /api/me`, `PATCH /api/me`, `GET /api/dashboard` (KPIs reales: workflows activos, leads, meetings próximos, actividad reciente).

### CRUD completo
- `/api/workflows` — GET, POST, PUT, DELETE
- `/api/leads` — GET, POST, PUT, DELETE
- `/api/email-templates` — GET, POST, PUT, DELETE
- `/api/meetings` — GET, POST, PUT, DELETE
- `/api/integrations` — GET, POST, PUT, DELETE
- `/api/webhooks` — GET, POST (genera secret server-side con `crypto.randomBytes(24)`), PUT, DELETE

### IA
- `POST /api/chat` (chatbot)
- `GET /api/ai/welcome`, `POST /api/ai/email-suggestion`, `POST /api/ai/document-suggestion`, `GET /api/ai/workflow-optimize/:id`, `GET /api/ai/lead-insights/:id`

### Stripe
- `POST /api/billing/checkout` (planCode + interval), `POST /api/billing/portal`, webhooks Stripe.

### Health
- `GET /` devuelve estado JSON `LIVE`.

## Páginas frontend (todas con TanStack Query + apiRequest + Dialog modales + zodResolver + toasts + invalidación)

| Ruta | Página | Funcionalidad real |
|---|---|---|
| `/` | Dashboard | KPIs desde `/api/dashboard`, actividad reciente |
| `/workflows` | Workflows | Lista, crear, editar, borrar, toggle active/inactive |
| `/crm` | CRM | Lista de leads, add/edit modal, delete con confirmación |
| `/email` | Email | Compose con AI Writer (Gemini), Save as Template, CRUD templates con tabs |
| `/calendar` | Calendar | Vista calendario, schedule meeting con datetime-local, edit/cancel |
| `/connections` | Connections | 11 servicios populares (Slack, Google Sheets, Zapier, Teams, Airtable, Twilio, Mailchimp, Stripe, Zoom, HubSpot, Shopify) con quick-connect + custom + sync + toggle + remove |
| `/webhooks` | Webhooks | Crear con secret auto-generado, eventos checkboxes (lead.created, workflow.run, etc.), copy/show secret, toggle, delete |
| `/settings` | Settings | Profile (`PATCH /api/me`), billing portal Stripe, password change con validación, integraciones → link a `/connections`, webhooks → link a `/webhooks`, copy API key, mailto soporte, delete account con confirm |

## Cambios recientes (22 abril 2026 — Cableado real exhaustivo)

### Backend
- Añadida tabla `webhooks` + relations en `shared/schema.ts`.
- 6 nuevos payload schemas: `createWebhookPayloadSchema`, `updateWebhookPayloadSchema`, `createIntegrationPayloadSchema`, `updateEmailTemplatePayloadSchema`, `updateMeetingPayloadSchema`.
- 12 métodos nuevos en `DatabaseStorage`: updateEmailTemplate, deleteEmailTemplate, getMeeting, updateMeeting, deleteMeeting, createIntegration, deleteIntegration + CRUD completo de webhooks.
- 11 endpoints nuevos en `server/routes.ts` con verificación de propietario.
- Secret de webhooks server-side: `whsec_` + `crypto.randomBytes(24).toString("hex")`, nunca aceptado del cliente.
- `npm run db:push --force` ejecutado: tabla `webhooks` creada en NeonDB.

### Frontend
- 7 páginas reescritas desde cero (Dashboard, Workflows, CRM, Email, Calendar, Connections, Webhooks): TanStack Query v5, mutaciones con invalidación, formularios `useForm`+`zodResolver`, modales `Dialog`, toasts, banner 401.
- `client/src/pages/Settings.tsx`: 17 botones cosméticos cableados — navegación a `/connections`/`/webhooks`, mailto soporte, copy API key, password con validación, delete account con `confirm()`, links legales.
- **Bug crítico corregido**: `client/src/lib/gemini.ts` usaba la firma antigua `apiRequest("GET", url)`; migrado a `apiRequest({ url, method, data })` en las 5 funciones IA.

## Pendientes del usuario (no son bugs de código)
- Configurar `STRIPE_WEBHOOK_SECRET` en secretos.
- Revocar el service account de Google `4a839ffe...` filtrado en commits anteriores y crear uno nuevo.
- Configurar `N8N_API_KEY` si se quiere activar la orquestación n8n.

## Estado actual
- Workflow `Start application` corriendo limpio en puerto 5000.
- Firebase Admin, Google AI/Translate/TTS inicializados.
- Consola del navegador sin errores (solo warning estándar de Firebase Analytics en sandbox sin cookies).
- Todas las páginas verificadas: NO MOCK, todas las acciones cableadas a endpoints reales.
- **Estado: LISTO PARA PUBLICAR.**
