# QC página por página — Automator

Generado: 2026-10-18. App: AUTOMATOR AI.

Producción revisada: `https://automator-ai-667496895561.us-east1.run.app`, revisión `automator-ai-00003-pjq`.

Certeza: `VERIFICADO EN VIVO` es lo que el browser mostró hoy en esa URL. `VERIFICADO EN CÓDIGO` es el working tree local, que **no** es lo que sirve Cloud Run. Donde chocan, manda el vivo para “qué ve el usuario” y el código para “qué hay en el disco”.

No se pagó. No se creó un lead, una reunión ni un correo. Un clic en Get Started del plan Starter, con una sesión de Google ya abierta en el browser, abrió Checkout de Stripe en vivo y se abandonó sin pulsar Subscribe. Costo: $0.

El QC de botones de CRM, email, calendario, workflows, connections, webhooks, settings, n8n y system-health en producción es de navegación y lectura. No se enviaron formularios.

## Totales

| Estado | Páginas |
|---|---|
| Funciona en vivo para lo que realmente hace | `/login` |
| Parcial | `/`, `/crm`, `/pricing`, `/thank-you`, `/cancelled`, y el resto del panel (código de dueño listo; la promesa del texto no) |
| Roto o huérfano | `/terms`, `/privacy`, el enlace `/dashboard` |
| Total de rutas en el router | 14 páginas + 404 |

Detalle por ruta: [BIBLIA-Automator.md](./BIBLIA-Automator.md) sección D.

---

## `/login` — Login

- **Certeza:** VERIFICADO EN VIVO.
- **Contenido:** “AUTOMATOR AI”, “Welcome back”, “Sign in with your Google account to continue”, “OAuth 2.0”, “Encrypted session”, “No passwords”. Inglés. Sin lorem. La primera pintura puede ser “Loading...” mientras `/api/me` responde (visto al entrar a `/pricing`).
- **Botones:** Continue with Google → `/api/auth/google`. En una sesión anterior de este ciclo el 302 a Google funcionó. Hoy la sesión ya estaba abierta, así que no se repitió el consentimiento. `OK` con esa evidencia previa; este pase no rehízo el OAuth.
- **Enlaces:** “terms” y “privacy policy” son `href="#"` en `client/src/pages/Login.tsx` líneas 92–94. `NO HACE NADA`.
- **Formularios:** ninguno. No hay email/contraseña.
- **Datos:** ninguno hasta el clic de Google.
- **Errores:** título del documento vacío (`<title>` ausente en `client/index.html`).
- **Móvil:** el layout es una tarjeta centrada (`p-4`, `max-w-md`). No se emuló un viewport de teléfono en este pase. `NO VERIFICADO` en 390px.
- **Puntaje:** 4. El login es el único camino y se ve bien. Los legales no llevan a ningún sitio.

## `/` — Dashboard

- **Certeza:** VERIFICADO EN VIVO para la revisión `00003`. El disco local dice otra cosa (`client/src/pages/Dashboard.tsx` líneas 62–63: “Your notebook… Nothing here sends email”).
- **Contenido en vivo:** “Overview of your automation system”. Métricas en 0: Active Workflows, Total Leads, Upcoming Meetings. “No activity yet.” Quick Workflow Builder: “Lead Capture & Nurture / Automatically add leads to CRM and start nurture sequence”, “Meeting Scheduler / Setup meetings with reminders and follow-ups”, “Document Generation / Create AI-powered proposals and contracts”. Eso no lo hace el producto. Inglés, con “Cerrar sesión” en español.
- **Botones en vivo:** Notifications (lleva a settings en el código local; en vivo no se pulsó, `NO VERIFICADO`), New Workflow (`NO VERIFICADO` el modal), See all, Create Custom Workflow, tabs Recent Activity y Suggested Templates. Sidebar: Dashboard, Workflows, CRM, Email, Calendar, Pricing, Connections, Webhooks, Settings, System Health, Cerrar sesión. n8n no está en el sidebar de escritorio (`Sidebar.tsx` líneas 45–56) y sí en el nav móvil (`MainContent.tsx` líneas 8–20).
- **Datos:** `/api/dashboard` con sesión. Los ceros coinciden con una cuenta sin filas. No son mocks de “12 workflows”.
- **Errores:** ninguno visible. Arranque en frío muestra “Loading...”.
- **Móvil:** sidebar con `hidden md:flex` (`Sidebar.tsx` línea 81). En teléfono el nav es una fila horizontal. No se midió 390px. `NO VERIFICADO`.
- **Puntaje:** 2. Los números son reales. El copy vende automatización que no corre.

## `/workflows` — Workflows

- **Certeza:** VERIFICADO EN CÓDIGO. No se abrió esta URL en el browser hoy.
- **Contenido local:** “Workflows”. “Checklists for your notebook. Review reads leads and meetings. It does not send email.” (`Workflows.tsx` líneas 100–101). Producción, por el patrón del dashboard y del CRM, sigue el copy viejo. `NO VERIFICADO` el texto exacto en vivo.
- **Botones locales:** crear, borrar, cambiar status, “Review notebook” → `POST /api/workflows/:id/run`. Esa ruta existe solo en el disco (`routes.ts` línea 684). En `00003` no está desplegada. En vivo: `NO VERIFICADO`.
- **Datos:** `GET /api/workflows`, filtrado por `userId`.
- **Puntaje:** 2 en producción (guardar una ficha no es ejecutar). 3 en disco (la pasada es honesta y no envía).

## `/crm` — CRM

- **Certeza:** VERIFICADO EN VIVO el encabezado. VERIFICADO EN CÓDIGO el disco.
- **En vivo:** H1 “CRM & Lead Automation”. Subtítulo “Manage leads and automate follow-ups”. Tabs: All Leads, Hot, Warm, Cold, Customers. No hay tab Due. Botón Add Lead. Buscador “Search leads...”.
- **En disco:** H1 “CRM”. “A follow-up draft stays here until you copy it. It is not sent.” Tab Due (`CRM.tsx` líneas 111–112 y 104).
- **Formularios:** alta y edición de lead. No se envió ninguno. El POST fuerza `userId` del servidor (`routes.ts` líneas 284–288).
- **Datos:** `GET /api/leads`. Lista vacía en la cuenta de la sesión (no se copian filas).
- **Puntaje:** 2 en vivo (promete automatizar follow-ups). 3 en disco (el borrador es copiar, no enviar).

## `/email` — Email

- **Certeza:** VERIFICADO EN CÓDIGO. URL no abierta hoy.
- **Contenido local:** “Email drafts”. “Templates and Gemini drafts you copy. They are not sent.” (`Email.tsx` líneas 93–94). Tabs Compose, Templates, Documents, Sequences.
- **Formularios:** subject y content. Guardan en `email_templates`. No hay proveedor de envío en el código de rutas. `@sendgrid/mail` está en `package.json` y no hay import en `server/`.
- **Promesa rota si producción aún dice que envía:** no verificado el copy viejo en vivo; el dashboard vivo sí habla de “nurture sequence”.
- **Puntaje:** 2. Sirve como bloc de notas. No es correo.

## `/calendar` — Calendar

- **Certeza:** VERIFICADO EN CÓDIGO. URL no abierta hoy.
- **Contenido local:** “Meetings you save here. A brief uses this notebook only. It does not book a room or send an invite.” (`Calendar.tsx` líneas 93–94).
- **Formularios:** title, description, start, end. No hay Google Calendar. `GOOGLE_CALENDAR_API_KEY` solo se consulta como booleano en `/api/system/google-keys` (`routes.ts` línea 1215). No está en `cloudbuild.yaml`.
- **Puntaje:** 2. Agenda manual. No es calendario conectado.

## `/pricing` — Pricing

- **Certeza:** VERIFICADO EN VIVO y VERIFICADO EN CÓDIGO.
- **Contenido:** “Choose Your Plan”. Starter $19, Professional $49 (Most Popular), Enterprise $99, todos “/month”. Features de `Pricing.tsx` líneas 24–69: 5 / 25 / unlimited workflows, “24/7 Phone Support”, “White-label Options”, “Dedicated Account Manager”, “SLA Guarantees”. Esas features no existen en el producto. No hay toggle anual. El API público `/api/membership/plans` (respuesta viva, truncada) dice otros nombres (“AUTOMATOR AI Basic”) y otros límites (100 AI requests, 5 email templates). Tres listas distintas: página, `shared/membership.ts`, `stripe-service.ts` `defaultPlans`.
- **Botones:** Get Started del Starter, con sesión, abrió Checkout live “AUTOMATOR_AI — STARTER Subscription”, $19.00/mes, marca del comercio “Avatar Studios”, “Payment mode: Live mode”. `OK` hasta la pasarela. No se pagó. Contact Sales: el clic no cambió la URL ni abrió nada (`Pricing.tsx` líneas 188–190, sin `onClick`). `NO HACE NADA`.
- **Formularios:** ninguno en la página. El checkout es de Stripe.
- **Móvil:** la grilla es `grid-cols-1 md:grid-cols-3`. No se midió 390px. `NO VERIFICADO`.
- **Puntaje:** 2. El precio y el checkout live funcionan. La lista de beneficios es falsa y Contact Sales está muerto.

## `/thank-you` — Success

- **Certeza:** VERIFICADO EN VIVO.
- **Contenido:** “Welcome to AUTOMATOR AI! Your subscription has been activated successfully.” Se muestra al abrir la URL, sin haber pagado. “Set up your first automation workflow”, “Import your contacts and leads”, “Connect your favorite tools”. “Need help? Contact our support team anytime.” sin enlace (`Success.tsx` líneas 42–44).
- **Botones:** Get Started → `/dashboard` (`Success.tsx` línea 35). Esa ruta no existe. `LLEVA A SITIO EQUIVOCADO` (cae en el 404 del router).
- **Puntaje:** 1. Miente sobre una suscripción activada y el botón principal no va al dashboard.

## `/cancelled` — Cancel

- **Certeza:** VERIFICADO EN VIVO.
- **Contenido:** “Subscription Cancelled”. “Save 10+ hours per week”, “Seamless integrations”, “14-day free trial, cancel anytime”. El checkout visto hoy no muestra trial. `stripe-service.ts` `createCheckoutSession` no pone `trial_period_days`.
- **Botones:** Try Again → `/pricing` `OK` (no se rehízo el clic). Contact Us sin handler (`Cancel.tsx` líneas 44–50). `NO HACE NADA`. Back to Dashboard → `/dashboard`. `LLEVA A SITIO EQUIVOCADO`.
- **Puntaje:** 1. Promesas falsas y dos botones muertos o mal enrutados.

## `/connections` — Connections

- **Certeza:** VERIFICADO EN CÓDIGO. URL no abierta hoy.
- **Qué es:** CRUD de filas `integrations` (nombre, icono, status, config JSON). No hace OAuth con terceros. Guardar “Slack connected” no conecta Slack.
- **Puntaje:** 2. Es un registro manual. El nombre “Connections” promete integraciones.

## `/webhooks` — Webhooks

- **Certeza:** VERIFICADO EN CÓDIGO. URL no abierta hoy.
- **Qué es:** CRUD de URLs y eventos. El servidor genera `secretKey` y lo devuelve al crear (`routes.ts` líneas 504–506). No hay un emisor que POSTEE esos eventos cuando cambia un lead. Guardar el webhook no lo dispara.
- **Puntaje:** 2. Almacén de URLs. No hay entrega.

## `/settings` — Settings

- **Certeza:** VERIFICADO EN CÓDIGO. URL no abierta hoy.
- **Qué hay:** perfil `PATCH /api/me`, portal de Stripe, logout, lista de integraciones, uso de Gemini `GET /api/ai/usage` (ruta local, no en `00003`), botones Terms y Privacy que abren `/terms` y `/privacy` (`Settings.tsx` líneas 864–867). Esas rutas dan 404. Soporte abre `mailto:` hacia un contacto del hub; el valor no se copia aquí.
- **Plan mostrado:** `use-membership.ts` líneas 9–11 convierten cualquier plan que no sea `pro` o `elite` en `basic`. El default de la base es `free` (`schema.ts` línea 27). Un usuario free se ve como Basic. `VERIFICADO EN CÓDIGO`.
- **Puntaje:** 2.

## `/system-health` — System Health

- **Certeza:** VERIFICADO EN CÓDIGO. URL no abierta hoy. El JSON público `/api/health` sí se pidió.
- **Datos:** `GET /api/system/health` exige sesión. El health público no. Hoy: database, auth, gemini, stripe true; translation, textToSpeech, n8n false.
- **Puntaje:** 3 si la página refleja esos flags. `NO VERIFICADO` el render.

## `/n8n` — n8n

- **Certeza:** VERIFICADO EN CÓDIGO. URL no abierta hoy.
- **Qué hace:** `GET /api/n8n/workflows` sin clave responde 501 (`routes.ts` líneas 1013–1017). Sin sesión, hoy, esa ruta respondió 401 (la auth corre antes). Health público: `n8n: false`. La página habla de instalar n8n y de “hundreds of integrations”.
- **Sidebar:** no está en escritorio. Sí en el menú móvil.
- **Puntaje:** 2. El 501 es honesto. La página sigue pareciendo un producto conectado.

## 404 — `not-found.tsx`

- **Certeza:** VERIFICADO EN VIVO en `/terms`.
- **Contenido:** “404 Page Not Found”. “Did you forget to add the page to the router?” Fondo claro sobre app oscura. Es texto de boilerplate.
- **Puntaje:** 1. No es una página de producto.

## `/terms` y `/privacy`

- **Certeza:** `/terms` VERIFICADO EN VIVO → el 404 de arriba, dentro del layout, con sesión. `/privacy` no se abrió; el router no tiene la ruta (`App.tsx`). `INFERIDO` que `/privacy` cae igual.
- **Puntaje:** 1. No existen.

## `/dashboard`

- **Certeza:** VERIFICADO EN CÓDIGO. Lo enlazan Success y Cancel. No hay `<Route path="/dashboard">`. Con sesión cae en el 404. Sin sesión, `AppLayout` redirige a `/login` porque no está en `PUBLIC_ROUTES`.
- **Puntaje:** 1.

## Móvil (corte)

No se aplicó emulación de 390px en este pase. En código, el sidebar de escritorio se oculta bajo `md` y aparece una barra horizontal (`MainContent.tsx` líneas 31–40). Las grillas de pricing y dashboard bajan a una columna. Contraste del 404 (texto gris sobre blanco) no se midió con herramienta. Accesibilidad de teclado: `NO VERIFICADO`.
