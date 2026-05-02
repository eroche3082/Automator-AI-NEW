# BIBLIA COMPLETA DEL SISTEMA — AUTOMATOR AI
**Generado por:** Principal Engineer + Systems Architect + QA Auditor  
**Fecha:** 22 Abril 2026  
**Estado al inicio:** APP ROTA (2 errores críticos que bloqueaban el arranque)  
**Estado al cierre:** APP CORRIENDO ✅ (errores críticos resueltos durante esta auditoría)

---

## 1. VISIÓN GENERAL DE LA APP

| Campo | Detalle |
|-------|---------|
| **Nombre** | AUTOMATOR AI |
| **Propósito** | Plataforma de automatización inteligente para ventas, CRM y operaciones de negocio |
| **Problema que resuelve** | Automatizar flujos de trabajo repetitivos (emails, seguimiento de leads, reuniones, documentos) usando IA |
| **Tipo de producto** | SaaS — AI Automation Platform + CRM |
| **Usuario objetivo** | Pequeñas y medianas empresas, equipos de ventas, emprendedores |
| **Casos de uso principales** | Automatización de emails, gestión de leads (CRM), programación de reuniones, generación de documentos, workflows disparados por IA |
| **Valor diferencial** | Integración nativa con Gemini AI, soporte multilingüe, interfaz drag-and-drop para workflows, integración con n8n |

---

## 2. ARQUITECTURA GENERAL

```
Usuario
  ↓
Frontend (React + Vite + TypeScript) — puerto 5000
  ↓ fetch/apiRequest
Backend (Express.js + Node.js)
  ↓
┌─────────────────────────────────────────────────┐
│  Servicios Internos:                            │
│  - GeminiService (Google AI)                    │
│  - TranslateService (Google Translate API)      │
│  - TTSService (Google Text-to-Speech)           │
│  - N8nService (n8n REST API)                    │
│  - StripeService (Stripe Live)                  │
└─────────────────────────────────────────────────┘
  ↓
PostgreSQL (NeonDB — serverless)
  ↓
Drizzle ORM
  ↓
Response → Frontend
```

**Stack tecnológico:**
- **Frontend:** React 18 + TypeScript + Vite 5 + TanStack Query v5 + wouter + shadcn/ui + Tailwind CSS
- **Backend:** Express 4 + Node.js 20 + TypeScript + tsx
- **Base de datos:** PostgreSQL via NeonDB serverless (Drizzle ORM)
- **AI:** Google Gemini (via REST API directa + Firebase AI Logic en frontend)
- **Pagos:** Stripe LIVE
- **Workflows externos:** n8n
- **Auth:** Firebase (solo frontend actualmente)

---

## 3. INVENTARIO COMPLETO DEL SISTEMA

### Frontend — Páginas (10 rutas)
| Ruta | Componente | Estado |
|------|-----------|--------|
| `/` | `Dashboard.tsx` | PARCIAL — datos hardcodeados |
| `/workflows` | `Workflows.tsx` | PARCIAL — UI completa, backend hardcodeado |
| `/crm` | `CRM.tsx` | PARCIAL — UI presente, sin conexión real al DB |
| `/email` | `Email.tsx` | PARCIAL — solo UI |
| `/calendar` | `Calendar.tsx` | PARCIAL — solo UI |
| `/pricing` | `Pricing.tsx` | PARCIAL — planes definidos, Stripe sin enlazar |
| `/thank-you` | `Success.tsx` | UI solamente |
| `/cancelled` | `Cancel.tsx` | UI solamente |
| `/system-health` | `SystemHealth.tsx` | FUNCIONAL — conecta a `/api/health` |
| `/n8n` | `N8nIntegrationPage.tsx` | PARCIAL — requiere N8N_API_KEY |
| `/settings` | `Settings.tsx` | PARCIAL — formulario hardcodeado, sin persistencia |
| `/webhooks` | `Webhooks.tsx` | UI solamente |

### Frontend — Componentes Clave
- `AppLayout.tsx`, `Sidebar.tsx`, `MainContent.tsx` — Layout principal funcional
- `AIWelcomeCard.tsx` — Llama a `/api/ai/welcome` (funcional con API Key)
- `WorkflowBuilder.tsx`, `WorkflowAction.tsx` — Constructor de workflows (UI)
- `IntegrationCard.tsx` — Card de integraciones (solo UI)
- `MetricsCard.tsx`, `ActivityItem.tsx`, `ConnectionStatus.tsx` — Dashboard widgets

### Backend — Endpoints (30+)
| Endpoint | Método | Estado |
|----------|--------|--------|
| `/api/health` | GET | FUNCIONAL |
| `/api/dashboard` | GET | HARDCODEADO |
| `/api/workflows` | GET (×2 duplicado!) | PARCIAL (1° mock, 2° DB) |
| `/api/workflows/:id` | GET/PUT/DELETE | FUNCIONAL (con DB) |
| `/api/leads` | GET/POST/PUT/DELETE | FUNCIONAL (con DB) |
| `/api/email-templates` | GET/POST | FUNCIONAL (con DB) |
| `/api/meetings` | GET/POST | FUNCIONAL (con DB) |
| `/api/integrations` | GET/PUT | FUNCIONAL (con DB) |
| `/api/ai/welcome` | GET | FUNCIONAL (con GOOGLE_GENAI_API_KEY) |
| `/api/ai/email-suggestion` | POST | FUNCIONAL |
| `/api/ai/document-suggestion` | POST | FUNCIONAL |
| `/api/ai/workflow-optimize/:id` | GET | FUNCIONAL |
| `/api/ai/lead-insights/:id` | GET | FUNCIONAL |
| `/api/translate` | POST | PARCIAL (requiere GOOGLE_TRANSLATE_API_KEY) |
| `/api/detect-language` | POST | PARCIAL |
| `/api/text-to-speech` | POST | PARCIAL (requiere GOOGLE_TTS_API_KEY) |
| `/api/membership/plans` | GET | FUNCIONAL |
| `/api/stripe/health` | GET | REQUIERE CREDENCIAL |
| `/api/stripe/connectivity` | GET | REQUIERE CREDENCIAL |
| `/api/stripe/environment` | GET | REQUIERE CREDENCIAL |
| `/api/stripe/create-payment-links` | POST | REQUIERE CREDENCIAL |
| `/api/stripe/customer-portal` | POST | REQUIERE CREDENCIAL |
| `/api/webhooks/stripe` | POST | PARCIAL — handlers con TODO |
| `/api/n8n/*` | GET/POST/PUT/DELETE | REQUIERE N8N_API_KEY |
| `/api/qc-report` | GET | FUNCIONAL |

### Backend — Servicios
| Servicio | Archivo | Estado |
|---------|---------|--------|
| GeminiService | `server/services/gemini-service.ts` | FUNCIONAL (con API key) |
| TranslateService | `server/services/translate-service.ts` | REQUIERE API KEY |
| TTSService | `server/services/tts-service.ts` | REQUIERE API KEY |
| N8nService | `server/services/n8n-service.ts` | REQUIERE N8N_API_KEY + URL |
| StripeService | `server/services/stripe-service.ts` | REQUIERE STRIPE_SECRET_KEY |

### Data — Modelos (shared/schema.ts)
| Tabla | Campos principales | Relaciones |
|-------|--------------------|-----------|
| `users` | id, username, password, name, email, company, plan | 1→N workflows, leads, templates, meetings, integrations |
| `workflows` | id, name, description, trigger, category, status, actions (JSON), userId, triggerCount | N→1 users |
| `leads` | id, name, email, phone, company, status, tags (JSON), notes, userId | N→1 users |
| `email_templates` | id, name, type, subject, content, emails, userId | N→1 users |
| `meetings` | id, title, description, startTime, endTime, attendees, type, link, status, userId | N→1 users |
| `integrations` | id, name, icon, status, config (JSON), lastSync, userId | N→1 users |

---

## 4. FUNCIONALIDADES — BREAKDOWN COMPLETO

| Feature | Qué hace | Estado | Dependencias | APIs | Datos |
|---------|----------|--------|-------------|------|-------|
| Dashboard Overview | Muestra métricas KPI | PARCIAL | — | `/api/dashboard` | HARDCODEADO |
| AI Welcome Card | Genera mensaje de bienvenida con Gemini | FUNCIONAL | GOOGLE_GENAI_API_KEY | Gemini REST | Real |
| Workflow Builder | Crea/edita workflows visuales | PARCIAL | — | `/api/workflows` | Mix |
| CRM / Leads | Gestión de contactos | PARCIAL | DATABASE_URL | `/api/leads` | Real (DB) |
| Email Templates | Crea/edita plantillas de email | PARCIAL | DATABASE_URL | `/api/email-templates` | Real (DB) |
| Calendar | Vista de reuniones | UI SOLAMENTE | — | `/api/meetings` | Sin conectar |
| Pricing / Membresías | Muestra planes y precios | PARCIAL | Stripe LIVE keys | `/api/membership/plans`, Stripe | Mix |
| Stripe Payments | Procesa pagos y suscripciones | PARCIAL | STRIPE_SECRET_KEY | Stripe API | Real |
| Stripe Webhooks | Actualiza estado tras pagos | INCOMPLETO | STRIPE_WEBHOOK_SECRET | Stripe Webhooks | TODO en DB |
| n8n Integration | Conecta con instancia n8n propia | PARCIAL | N8N_API_KEY, N8N_API_URL | n8n REST API | Real |
| Translate API | Traduce texto | PARCIAL | GOOGLE_TRANSLATE_API_KEY | Google Translate | Real |
| Text-to-Speech | Convierte texto a audio | PARCIAL | GOOGLE_TTS_API_KEY | Google TTS | Real |
| Settings | Preferencias de usuario | PARCIAL | — | — | HARDCODEADO |
| System Health | Estado de todos los servicios | FUNCIONAL | — | `/api/health` | Real |
| Authentication | Login/logout | PARCIAL | Firebase config | Firebase Auth | Sin backend guard |

---

## 5. FLUJOS END-TO-END

### Flujo: Crear y ejecutar un workflow
```
Usuario → /workflows → WorkflowBuilder → POST /api/workflows → DB → OK ✅ (FUNCIONAL)
```

### Flujo: Gestionar un lead
```
Usuario → /crm → Formulario → POST /api/leads → DB → Listado actualizado ✅ (FUNCIONAL)
```

### Flujo: Pago de suscripción
```
Usuario → /pricing → Click Plan → Stripe Payment Link → Checkout → Webhook → /api/webhooks/stripe
→ switch(event.type) → TODO: actualizar DB ❌ (INCOMPLETO)
```
**ROTO**: El webhook recibe el evento pero no actualiza ningún modelo en la base de datos. Todos los handlers tienen comentarios `// TODO`.

### Flujo: Dashboard con datos reales
```
Usuario → / → fetch /api/dashboard → { totalLeads: 1500, hardcoded... } ❌ (HARDCODEADO)
```
**ROTO**: Los datos del dashboard son ficticios, no consultan la DB.

### Flujo: AI Email Suggestion
```
Usuario → /email → Prompt → POST /api/ai/email-suggestion → GeminiService → Respuesta IA ✅ (FUNCIONAL con API key)
```

### Flujo: Autenticación
```
Usuario → "Sign In with Google" (Firebase) → Firebase Auth (frontend) → Sin verificación backend ❌
```
**ROTO**: El backend no valida el JWT de Firebase. Cualquier usuario puede acceder a todos los endpoints de la API sin autenticación.

---

## 6. AUDITORÍA DE FRONTEND

| Sección | Navegación | UX/UI | Formularios | Estados vacíos | Responsivo | Estado |
|---------|-----------|-------|------------|----------------|------------|--------|
| Dashboard | FUNCIONA | Buena | N/A | Parcial | Sí | PARCIAL |
| Workflows | FUNCIONA | Buena | Presente | Sin estado vacío | Sí | PARCIAL |
| CRM | FUNCIONA | Buena | Presente | Sin estado vacío | Sí | PARCIAL |
| Email | FUNCIONA | Buena | Presente | N/A | Sí | PARCIAL |
| Calendar | FUNCIONA | Buena | N/A | N/A | Sí | UI SOLO |
| Pricing | FUNCIONA | Buena | N/A | N/A | Sí | PARCIAL |
| Settings | FUNCIONA | Buena | Presente | N/A | Sí | PARCIAL |
| System Health | FUNCIONA | Buena | N/A | N/A | Sí | FUNCIONAL |
| Webhooks | FUNCIONA | Buena | N/A | N/A | Sí | UI SOLO |

**Observaciones:**
- Diseño dark mode por defecto, profesional y consistente ✅
- Sidebar con navegación clara ✅
- El botón "Sign In with Google" existe pero auth sin backend guard ❌
- Formularios de Settings no persisten cambios (hardcoded state) ❌
- No hay estados de error explícitos cuando las APIs fallan en la mayoría de páginas

---

## 7. AUDITORÍA DE BACKEND

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Estructura de rutas | PARCIAL | `GET /api/workflows` duplicado — el segundo sobreescribe al primero |
| Validación de inputs | DÉBIL | Validación básica pero sin Zod schemas en la mayoría de endpoints |
| Manejo de errores | PARCIAL | try/catch en todos los endpoints pero respuestas genéricas |
| Seguridad básica | ROTO | Sin middleware de autenticación en ningún endpoint |
| Lógica de negocio | PARCIAL | Stripe webhooks sin implementar completamente |
| Middleware | MÍNIMO | Sin rate limiting, sin auth middleware, sin cors explícito |

---

## 8. CONECTIVIDAD FRONT ↔ BACK

| Acción | Conectado | Notas |
|--------|-----------|-------|
| Cargar dashboard | HARDCODEADO | `/api/dashboard` devuelve datos ficticios |
| Crear workflow | FUNCIONAL | POST `/api/workflows` → DB |
| Listar workflows | PARCIAL | Primer GET devuelve hardcoded, segundo devuelve DB |
| CRUD leads | FUNCIONAL | Conectado a DB |
| CRUD email templates | FUNCIONAL | Conectado a DB |
| CRUD meetings | FUNCIONAL | Conectado a DB |
| AI welcome message | FUNCIONAL | Conectado a Gemini |
| Pricing / Stripe | DESCONECTADO | Botones de compra sin enlace real al flow de Stripe |
| Settings form | DESCONECTADO | Formulario no llama ningún API |
| Auth | PARCIAL | Firebase auth solo en frontend, backend sin protección |

---

## 9. APIs EXTERNAS E INTEGRACIONES

| Integración | Implementada | Conectada | Credencial necesaria | Lista para prod |
|-------------|-------------|-----------|---------------------|----------------|
| Google Gemini AI | SÍ | SÍ (GOOGLE_GENAI_API_KEY presente) | GOOGLE_GENAI_API_KEY | SÍ |
| Firebase Auth | SÍ (frontend) | PARCIAL | Firebase config en frontend | NO (sin backend guard) |
| Firebase AI Logic | SÍ | SÍ | service-account.json ⚠️ | RIESGO SEGURIDAD |
| Stripe | SÍ | REQUIERE CREDENCIAL | STRIPE_SECRET_KEY / _LIVE | NO (webhooks incompletos) |
| Google Translate | SÍ | NO VERIFICADO | GOOGLE_TRANSLATE_API_KEY | NO |
| Google TTS | SÍ | NO VERIFICADO | GOOGLE_TTS_API_KEY | NO |
| n8n | SÍ | NO VERIFICADO | N8N_API_KEY, N8N_API_URL | NO |
| SendGrid | Instalado (@sendgrid/mail) | NO CONECTADO | SENDGRID_API_KEY | NO |
| PayPal | Mencionado en .env.example | NO IMPLEMENTADO | PAYPAL_CLIENT_ID_LIVE | NO |

---

## 10. VARIABLES DE ENTORNO

| Variable | Requerida | Presente (inferido) | Usada Correctamente | Notas |
|----------|-----------|---------------------|---------------------|-------|
| `DATABASE_URL` | CRÍTICA | SÍ | SÍ | NeonDB PostgreSQL |
| `GOOGLE_GENAI_API_KEY` | ALTA | SÍ (app funciona) | SÍ | Gemini AI funcionando |
| `STRIPE_SECRET_KEY` | ALTA | DESCONOCIDA | PARCIAL | stripe-service.ts lo espera |
| `STRIPE_SECRET_KEY_LIVE` | ALTA | DESCONOCIDA | PARCIAL | Usado en routes.ts para webhook |
| `STRIPE_PUBLISHABLE_KEY` | ALTA | DESCONOCIDA | NO | Frontend lo necesita |
| `STRIPE_WEBHOOK_SECRET` | ALTA | DESCONOCIDA | PARCIAL | Requerido para validar webhooks |
| `N8N_API_KEY` | MEDIA | NO (warning en logs) | — | n8n deshabilitado |
| `N8N_API_URL` | MEDIA | NO | — | Default: localhost:5678 |
| `GOOGLE_TRANSLATE_API_KEY` | MEDIA | NO VERIFICADO | — | |
| `GOOGLE_TTS_API_KEY` | MEDIA | NO VERIFICADO | — | |
| `SESSION_SECRET` | MEDIA | NO VERIFICADO | — | express-session |
| `APP_DOMAIN` | BAJA | NO | — | Hardcodeado en stripe-service |
| `SENDGRID_API_KEY` | BAJA | NO | NO | Paquete instalado pero no usado |
| `PAYPAL_CLIENT_ID_LIVE` | NO | NO | NO | No implementado |

---

## 11. BASE DE DATOS Y PERSISTENCIA

- **Tipo:** PostgreSQL via NeonDB (serverless, WebSocket)
- **ORM:** Drizzle ORM v0.39
- **Estado:** FUNCIONAL (DATABASE_URL configurado)
- **Modelos activos:** 6 tablas (users, workflows, leads, email_templates, meetings, integrations)
- **Migrations:** Solo via `drizzle-kit push` (sin sistema de migraciones versionado)
- **Conexión:** Pool con WebSocket (Neon serverless)

**Lo que sí guarda datos:**
- Workflows (CRUD completo)
- Leads (CRUD completo)
- Email Templates (CRUD parcial)
- Meetings (CRUD parcial)
- Integrations (read + update)

**Lo que NO está conectado:**
- Users (no hay endpoint de registro/login real en backend)
- Suscripciones de Stripe (webhooks con TODO)
- Configuración de Settings del usuario

---

## 12. AUDITORÍA DE BOTONES Y ACCIONES

| Botón / Acción | Ubicación | Estado |
|----------------|-----------|--------|
| "Sign In with Google" | Header/Dashboard | PARCIAL — Firebase auth, sin backend |
| "New Workflow" | Dashboard + Workflows | FUNCIONAL — abre builder |
| "Create Lead" | CRM | FUNCIONAL — crea en DB |
| "Save" en Settings | Settings | NO HACE NADA — sin API call |
| "Save Changes" en workflows | Workflow builder | FUNCIONAL |
| Botones de Plan (Pricing) | Pricing | SIN ENLACE REAL a Stripe checkout |
| "Connect" en Integrations | Connections | UI SOLO |
| Toggle de notificaciones | Settings | UI ONLY — no persiste |
| "System Health" check | SystemHealth | FUNCIONAL |
| Stripe webhook toggle | Webhooks | UI ONLY |
| n8n Connect | N8n page | PARCIAL — requiere credenciales |

---

## 13. CALIDAD DE CÓDIGO

**Código duplicado:**
- `GET /api/workflows` registrado DOS veces en `routes.ts` (líneas 31 y 131) — el primero devuelve datos hardcodeados, el segundo usa storage. El segundo sobreescribe al primero en Express, pero es confuso y genera deuda.

**Dead code:**
- `qc-report-generator.ts` en raíz — archivo de utilidades QC, no parte del producto
- `connection-check.ts` en raíz — archivo de diagnóstico suelto
- `interactive-qc.spec.ts` — spec de Playwright que no se corre en CI
- `src/testConnection.ts` — archivo de prueba huérfano
- `stripe_links.ts` en raíz — archivo de configuración de links hardcodeados suelto

**TODOs en producción:**
- `routes.ts`: 5 comentarios `// TODO` dentro del handler del webhook de Stripe
- `gemini-service.ts`: múltiples TODOs en manejo de errores

**Malas prácticas:**
- `server/db.ts` (original) — tenía `export` dentro de bloques `if/else` (JavaScript inválido) → CORREGIDO
- `Settings.tsx` (original) — JSX desbalanceado con tabs sin wrappers → CORREGIDO
- `storage.ts` — solo `DatabaseStorage`, sin `MemStorage` de fallback para desarrollo sin DB
- `service-account.json` — credenciales reales comprometidas en el repositorio ⚠️ CRÍTICO
- Stripe API version inconsistente: `routes.ts` usa `2025-07-30.basil`, `stripe-service.ts` usa `2024-09-30.acacia`

**Deuda técnica:**
- Sin tests automatizados funcionales
- Sin CI/CD pipeline
- Sin rate limiting en ningún endpoint
- Sin middleware de autenticación en backend
- Dashboard data hardcodeada (no reflejará datos reales del DB)

---

## 14. SEGURIDAD Y RIESGOS

### P0 — CRÍTICO
**`service-account.json` en el repositorio**
- El archivo contiene credenciales reales de una cuenta de servicio de Google Cloud (`project_id: "automator-ai"`, `private_key_id: "4a839ffe..."`)
- Está comprometido en el historial de git
- **Impacto:** Cualquiera con acceso al repo puede usar estas credenciales para acceder a los servicios de Google Cloud
- **Fix:** 1) Revocar inmediatamente la cuenta de servicio en Google Cloud Console, 2) Agregar `service-account.json` al `.gitignore`, 3) Mover credenciales a variables de entorno

### P0 — CRÍTICO
**Backend sin autenticación**
- Ningún endpoint tiene middleware de verificación de token
- Cualquier usuario puede llamar `GET /api/leads`, `GET /api/workflows`, `POST /api/leads`, etc.
- **Fix:** Implementar middleware de verificación de Firebase JWT en todos los endpoints que manejen datos de usuario

### P1 — IMPORTANTE
**Validación de inputs débil**
- La mayoría de endpoints de POST/PUT no validan el body con Zod antes de pasar al storage
- **Fix:** Agregar `insertWorkflowSchema.parse(req.body)` en cada endpoint de creación/actualización

### P1 — IMPORTANTE
**35 vulnerabilidades en dependencias** (npm audit: 9 low, 11 moderate, 13 high, 2 critical)
- **Fix:** `npm audit fix` para los que no requieren breaking changes, revisar manualmente los críticos

### P2 — MENOR
**Stripe API version mismatch**
- `routes.ts`: `2025-07-30.basil` (versión futura/incorrecta)
- `stripe-service.ts`: `2024-09-30.acacia`
- **Fix:** Unificar a versión estable actual

---

## 15. DEPLOYMENT Y ESTADO REAL

**¿Se puede deployar hoy?** — CONDICIONALMENTE

**Lo que funciona:**
- Backend Express levanta correctamente ✅
- Frontend carga y navega ✅
- DB conectada ✅
- Gemini AI funcionando ✅
- CRUD de workflows, leads, templates funciona ✅

**Lo que lo bloquea para producción real:**
1. `service-account.json` con credenciales en repo — riesgo de seguridad
2. Backend sin autenticación — cualquiera puede leer/escribir datos
3. Stripe webhooks no actualizan la DB — suscripciones no se activan
4. Dashboard con datos hardcodeados — engaña a usuarios
5. Settings sin persistencia — las preferencias se pierden al recargar
6. 35 vulnerabilidades en npm, incluyendo 2 críticas

**Para un deploy de MVP funcional:**
- 1-2 días de trabajo para resolver los puntos 1, 2 y 3

---

## 16. ESTADO GENERAL DE LA APP

| Métrica | Valor |
|---------|-------|
| **% completitud estimado** | 55-60% |
| **Nivel de madurez** | Beta temprana |
| **Tipo** | MVP (con UI production-ready, backend parcialmente funcional) |

**Desglose:**
- UI/UX: 85% ✅ (diseño sólido, componentes completos)
- Backend CRUD: 70% ✅ (la mayoría de operaciones DB funcionan)
- Autenticación: 20% ❌ (solo frontend, sin backend guard)
- Pagos: 40% ⚠️ (Stripe configurado, webhooks sin completar)
- Integraciones externas: 50% ⚠️ (Gemini funciona, resto requiere credenciales)
- Seguridad: 15% ❌ (credenciales expuestas, sin auth en API)

---

## 17. HALLAZGOS CRÍTICOS — P0

### P0-1: `service-account.json` comprometido en el repo
- **Qué es:** Archivo con private key real de Google Cloud service account
- **Impacto:** Acceso no autorizado a servicios Google Cloud (Firebase, Vertex AI, etc.)
- **Causa:** El archivo no está en `.gitignore` y fue commiteado con credenciales reales
- **Fix:**
  1. Revocar la cuenta de servicio en https://console.cloud.google.com/iam-admin/serviceaccounts
  2. Crear nueva cuenta de servicio
  3. Agregar `service-account.json` y `*.json` de credenciales al `.gitignore`
  4. Usar variable de entorno `GOOGLE_APPLICATION_CREDENTIALS` o Replit Secrets

### P0-2: ~~server/db.ts roto~~ → RESUELTO ✅
- **Qué era:** `export` dentro de bloque `if/else` (inválido en ES modules) + exports duplicados
- **Fix aplicado:** Reescritura limpia del archivo, throw explícito si `DATABASE_URL` falta

### P0-3: ~~Settings.tsx con JSX desbalanceado~~ → RESUELTO ✅
- **Qué era:** `<CardContent>`, `<Card>`, `<TabsContent>` cerrando tags incorrectos, mismatches de +5 niveles
- **Fix aplicado:** Añadido `</div>` faltante, `<TabsContent value="appearance">` y `<TabsContent value="language-region">` + sus triggers correspondientes

### P0-4: Backend sin autenticación en ningún endpoint
- **Qué es:** Todos los endpoints de la API son públicos sin verificación de identidad
- **Impacto:** Cualquier persona puede leer/crear/modificar/eliminar leads, workflows, templates
- **Fix:** Implementar middleware `verifyFirebaseToken` que verifique el JWT de Firebase en el header `Authorization`

---

## 18. HALLAZGOS IMPORTANTES — P1

### P1-1: Stripe webhooks no actualizan la DB
- Todos los handlers del webhook (`checkout.session.completed`, `customer.subscription.updated`, etc.) tienen `// TODO: Actualizar DB`
- **Impacto:** Los pagos se procesan pero las suscripciones no se activan automáticamente
- **Fix:** Implementar en cada case: buscar usuario por `customer_id`, actualizar `plan` en tabla `users`

### P1-2: `GET /api/workflows` duplicado
- Registrado dos veces en `routes.ts` (líneas 31 y 131)
- El primero devuelve datos hardcodeados; el segundo usa storage
- Express usa el último registrado, pero genera confusión
- **Fix:** Eliminar el bloque hardcodeado de línea 31-92

### P1-3: Dashboard data hardcodeada
- `/api/dashboard` retorna `{ totalLeads: 1500, activeWorkflows: 3 }` fijos
- No refleja datos reales del usuario
- **Fix:** Reemplazar con queries reales al DB: `COUNT(*)` de leads, workflows activos, reuniones próximas

### P1-4: Settings sin persistencia
- El formulario de Settings usa `useState` local
- El botón "Save Changes" no llama ningún API
- **Fix:** Agregar `PUT /api/users/:id` y conectar el formulario

### P1-5: Pricing sin enlace real a Stripe Checkout
- Los botones de plan muestran precios pero no redirigen al checkout de Stripe
- **Fix:** Crear Stripe Payment Links o Stripe Checkout Sessions desde el backend, devolver URL, redirigir

---

## 19. HALLAZGOS MENORES — P2

- **P2-1:** Firebase Analytics warning en browser console (no crítico, solo dev)
- **P2-2:** Stripe API version inconsistente entre `routes.ts` y `stripe-service.ts`
- **P2-3:** `browserslist` desactualizado — ejecutar `npx update-browserslist-db@latest`
- **P2-4:** 35 vulnerabilidades npm — ejecutar `npm audit fix`
- **P2-5:** Archivos de diagnóstico/QC huérfanos en la raíz (`qc-report-generator.ts`, `connection-check.ts`, `interactive-qc.spec.ts`, `src/testConnection.ts`)
- **P2-6:** `stripe_links.ts` en raíz con configuración hardcodeada (mala práctica)
- **P2-7:** `@playwright/test` en `dependencies` (debería estar en `devDependencies`)
- **P2-8:** `firebase-admin` importado pero no usado directamente — se usa vía `service-account.json`
- **P2-9:** No existe ruta `/connections` en wouter aunque existe `Connections.tsx` como página

---

## 20. QUICK WINS (MENOS DE 1 HORA)

1. **Agregar `service-account.json` al `.gitignore`** — 5 min (no resuelve el leak histórico pero previene futuros)
2. **Eliminar el `GET /api/workflows` duplicado** — 10 min (borrar líneas 31-92 de routes.ts)
3. **Conectar `/api/dashboard` a datos reales** — 30 min (4 queries SQL simples en routes.ts)
4. **Agregar validación Zod en endpoints POST** — 20 min por endpoint
5. **Agregar `npm audit fix`** — 5 min (soluciona vulnerabilidades automáticamente)
6. **Unificar versión de Stripe API** — 5 min
7. **Agregar ruta `/connections` al Router en App.tsx** — 5 min
8. **`npx update-browserslist-db@latest`** — 2 min

---

## 21. ROADMAP PARA TERMINARLA

### 1-2 Horas (Seguridad + Datos reales)
- [ ] Revocar y regenerar credenciales Google Cloud
- [ ] Agregar `service-account.json` al `.gitignore`
- [ ] Implementar `verifyFirebaseToken` middleware en Express
- [ ] Aplicar middleware a todos los endpoints de datos (`/api/leads`, `/api/workflows`, etc.)
- [ ] Conectar `/api/dashboard` a queries reales del DB
- [ ] Eliminar duplicado de `GET /api/workflows`

### 1 Día (Funcionalidades core)
- [ ] Implementar `PUT /api/users/:id` y conectar Settings form
- [ ] Completar handlers del webhook de Stripe (activar suscripciones en DB)
- [ ] Conectar botones de Pricing a Stripe Checkout Sessions
- [ ] Agregar estados vacíos y de error en páginas CRM, Workflows, Calendar
- [ ] Resolver 35 vulnerabilidades npm
- [ ] Agregar validación Zod en todos los endpoints POST/PUT

### 3 Días (MVP completo)
- [ ] Implementar sistema de usuarios real (registro, login, sesiones)
- [ ] Aislar datos por userId en todas las queries (actualmente cualquier user ve todos los datos)
- [ ] Completar página Calendar con datos reales de reuniones
- [ ] Conectar SendGrid para envío real de emails
- [ ] Implementar página Webhooks funcional
- [ ] Añadir rate limiting al backend
- [ ] Tests básicos E2E con Playwright
- [ ] Configurar variables de entorno correctas para producción

---

## 22. POTENCIAL DE NEGOCIO

| Aspecto | Evaluación |
|---------|-----------|
| **Monetización** | Clara: 3 planes (Basic $19/mes, Pro $49/mes, Elite $99/mes) ya definidos. Stripe integrado. Alto potencial. |
| **Mercado** | Automatización de ventas/CRM es mercado de $40B+ (HubSpot, Zapier, Make.com son comparables). Nicho de PYMES bien definido. |
| **Escalabilidad** | Arquitectura NeonDB serverless + Gemini AI escalable. Backend Express puede crecer a microservicios. |
| **Valor real** | Si se completan los flujos core (auth, pagos, workflows reales), es un producto vendible. La UI ya está a nivel production. |
| **Diferenciador** | Combinación de CRM + n8n + Gemini AI + TTS/Translate en un solo producto es interesante. |
| **Competidores** | Zapier, Make.com, HubSpot, Pipedrive. AUTOMATOR AI apunta a ser una versión más asequible y con IA integrada. |

---

## 23. RECOMENDACIÓN FINAL

### ✅ ITERAR

**Razón:** La app tiene una base sólida — arquitectura correcta, UI production-ready, modelos de datos bien diseñados, Gemini AI funcionando y planes de negocio definidos. Los blockers son resolubles en 1-3 días de trabajo enfocado.

Lo que necesita:
1. Seguridad mínima (auth en API, credenciales no expuestas)
2. Datos reales en dashboard
3. Flujo de pago completo (webhooks de Stripe)

Con eso, es un MVP lanzable y facturable.

**NO abandonar.** La inversión en UI y arquitectura es demasiado buena para tirarla.

---

## 24. SCORE FINAL

| Dimensión | Score | Justificación |
|-----------|-------|--------------|
| **Producto** | 6.5/10 | Visión clara, UI excelente, funcionalidades core parciales |
| **Código** | 5/10 | Arquitectura correcta pero con bugs críticos, sin auth, duplicados, TODOs |
| **Arquitectura** | 7/10 | Stack moderno adecuado, modelos bien diseñados, separación front/back correcta |
| **Negocio** | 7.5/10 | Planes de precio definidos, Stripe listo, mercado grande, valor diferencial claro |
| **Seguridad** | 2/10 | Credenciales expuestas en repo, sin auth en API — inaceptable para producción |
| **PROMEDIO** | 5.6/10 | |

---

## 25. RESUMEN EJECUTIVO

**AUTOMATOR AI** es una plataforma SaaS de automatización de ventas y CRM con IA integrada (Gemini), construida en React + Express + PostgreSQL. La app tiene un diseño visual excelente y una arquitectura técnica sólida. Sin embargo, al momento de esta auditoría, **la app no arrancaba** por dos errores críticos de código (sintaxis inválida en el servidor y JSX roto en el frontend) — ambos fueron corregidos durante esta auditoría y la app ahora corre correctamente.

**Lo que funciona:** UI completa, CRUD de leads/workflows/meetings contra DB real, Gemini AI operativo, sistema de salud del servidor.

**Lo que no funciona:** Autenticación backend (cualquiera puede acceder a la API), webhooks de Stripe sin completar (pagos se procesan pero suscripciones no se activan), dashboard con datos ficticios, Settings sin persistencia.

**Riesgo mayor:** `service-account.json` con credenciales reales de Google Cloud está comprometido en el repositorio git — requiere acción inmediata.

**Veredicto:** Vale la pena. Con 1-3 días de trabajo enfocado en seguridad y flujos core, puede ser un MVP lanzable y facturable. La inversión en UI y arquitectura base es de alta calidad.

**Acción inmediata:** Revocar credenciales Google Cloud comprometidas → implementar auth middleware → completar webhooks Stripe.

---

*Fin de la Biblia del Sistema — AUTOMATOR AI*  
*Auditoría realizada el 22/04/2026 por Replit Agent (Principal Engineer + QA Auditor)*
