# Plan de fases — Automator

Generado: 2026-10-18. Propuesto. No ejecutado.

Este archivo es la sección X de [BIBLIA-Automator.md](./BIBLIA-Automator.md). No sustituye al plan del 2026-10-15 (`docs/audit/Automator/plan-15-fases.md`, fuera de este repo), que ya no describe el disco ni la revisión en tráfico.

## Recomendación

Empezar por la **Fase 0**. El código que dice la verdad (cuaderno, borrador, brief, pasada) está en el disco y la revisión `automator-ai-00003-pjq` sigue vendiendo “nurture sequence”. No hay `.git` local. Sin una rama que coincida con lo que se quiere publicar, las fases 1–6 no tienen dónde aterrizar. El CNAME de `automator-ai.socialbrands.ai` depende de Cloudflare y no lo puede cerrar un deploy.

## Fase 0 — Base sana

- **Objetivo:** una rama git cuya revisión de Cloud Run sea exactamente ese commit, con secretos ya montados y el dominio custom sin fingir que resuelve.
- **Tareas:**
  - Inicializar git en esta carpeta sin commitear `.env`, `google cloud/`, `node_modules` ni `dist`. Remote: `eroche3082/Automator-AI-NEW`. No pisar `main` del 2026-05-03 a ciegas.
  - Decidir el corte que se despliega: el disco de hoy (cuaderno honesto) o la revisión `00003`. El criterio de esta biblia es desplegar el disco.
  - Confirmar que `server/vite.ts` sigue importando Vite solo dentro de `setupVite` (el crash `ERR_MODULE_NOT_FOUND` del 2026-10-15).
  - No cambiar nombres de secrets en `cloudbuild.yaml`.
  - DNS: CNAME `automator-ai` → `ghs.googlehosted.com`, proxy apagado. El mapping ya pide ese record (`gcloud beta run domain-mappings list`, 2026-10-18, status Ready=False, CertificatePending).
  - `npm audit` de hoy: 2 críticas (`proxy-addr`, `shell-quote`) y 15 altas. Parches que no salten de React 18 ni Express 4. `trust proxy` está en 1 (`server/index.ts` línea 14).
- **Dependencias:** aprobación explícita de deploy. Acceso a Cloudflare para el CNAME.
- **Riesgo:** medio. Un deploy del disco cambia el copy que ya ven los usuarios. El schema nuevo ya está en Neon desde el 2026-10-16.
- **Esfuerzo:** medio.
- **Terminado cuando:** `gcloud run services describe` muestra una revisión nueva, `/api/health` sigue en 200, el dashboard en vivo dice que no envía email, y el commit de esa imagen está en el remote.

## Fase 1 — Identidad y acceso

- **Objetivo:** un solo login (Google) y tres roles de verdad: super admin, admin, cliente.
- **Tareas:**
  - No añadir contraseña. El login actual no tiene password (`Login.tsx`, `auth.ts`).
  - Columna de rol. Hoy `users` no tiene rol (`schema.ts` líneas 7–33). El super admin del portafolio no está implementado.
  - Dejar de mapear `free` a `basic` en `client/src/hooks/use-membership.ts` líneas 9–11.
  - Quitar el 404 de boilerplate (`not-found.tsx` “Did you forget to add the page to the router?”).
  - Arreglar `/dashboard` → `/` en `Success.tsx` línea 35 y `Cancel.tsx` línea 53.
- **Dependencias:** Fase 0 si el rol tiene que verse en producción.
- **Riesgo:** bajo si el default de los usuarios actuales es cliente.
- **Esfuerzo:** medio.
- **Terminado cuando:** un usuario cliente no abre system-health ni crea payment links de Stripe, y el super admin sí. La comprobación es en el servidor, no solo ocultando el botón.

## Fase 2 — Flujo principal

- **Objetivo:** el golden path que la app sí puede cumplir: entrar, anotar un lead, anotar una reunión, pedir un borrador, copiarlo, y que la pantalla no diga que lo envió.
- **Tareas:**
  - Desplegar cola, borrador, brief, pasada y `ai_calls` (ya en `shared/notebook.ts`, `routes.ts` 614–716, páginas CRM, Calendar, Workflows, Dashboard, Settings).
  - Quitar del dashboard vivo “Automatically add leads” y “nurture sequence”.
  - Borrar o no montar `AIWelcomeCard` (defaults “John”, 12 workflows, 4.5). Hoy no está importada.
  - Decidir el runner: la pasada de cuaderno se queda, o se apaga con 501. No hay un tercer camino a medias.
  - Email: no cablear Resend en esta fase. El botón sigue diciendo que no se envía.
- **Dependencias:** Fase 0.
- **Riesgo:** bajo. Gemini ya responde en health. Cada borrador gasta tokens; el registro `ai_calls` debe verse en Settings.
- **Esfuerzo:** medio (el código local ya existe; falta deploy y un click-through).
- **Terminado cuando:** en la URL de producción, un lead vencido aparece, el borrador se copia, `sent` no existe, y el health de n8n sigue en false.

## Fase 3 — Cobro

- **Objetivo:** una sola tabla de planes, límites aplicados en el servidor, checkout que no activa la cuenta hasta el webhook.
- **Tareas:**
  - Unificar `Pricing.tsx` `PLANS`, `shared/membership.ts` y `stripe-service.ts` `planMap`. Precios que coinciden hoy: 1900 / 4900 / 9900 centavos al mes. Lo que no coincide son nombres y features.
  - Quitar de la página pública: phone support 24/7, white-label, account manager, SLA, team collaboration, analytics, “14-day free trial” (`Cancel.tsx` línea 33).
  - `checkLimit` existe y ningún route lo llama. Aplicarlo en POST de leads, workflows y en las rutas de Gemini.
  - `/thank-you` no debe decir “activated” solo por abrirse. Confirmar con el webhook.
  - `POST /api/stripe/create-payment-links` hoy lo puede llamar cualquier sesión (`routes.ts` línea 815). Reservarlo a super admin o quitarlo.
  - Contact Sales: enlace real o quitar el botón.
  - No hay reembolso en código. Documentarlo como no disponible.
- **Dependencias:** Fases 0 y 1.
- **Riesgo:** alto si se crean precios duplicados en la cuenta Stripe compartida. El checkout de hoy ya creó un precio “AUTOMATOR_AI — STARTER” en vivo.
- **Esfuerzo:** alto.
- **Terminado cuando:** un usuario over-limit recibe 403, la página y `/api/membership/plans` listan las mismas features, y un pago de prueba (cuenta de prueba, no un cargo improvisado) baja el plan al cancelar.

## Fase 4 — Limpieza

- **Objetivo:** un árbol que no contradiga el runtime.
- **Tareas:**
  - Sacar o archivar `BIBLIA_SISTEMA.md`, `QC_COMPLETE_REPORT.md`, `COMPLETE_SYSTEM_QC.md`, `frontend-qc-report.md`, `FIREBASE_AI_LOGIC_SETUP.md`, `IMPLEMENTATION_TASKS.md`, `DEPLOYMENT_STATUS.md` (este último ya tiene una nota del 2026-10-14; el resto sigue en presente de Replit).
  - `interactive-qc.spec.ts` apunta a `https://automator-ai.socialbrands.ai/dashboard` y a un welcome card que no está montado. No es una suite verde.
  - `stripe_links.ts`, `connection-check.ts`, `qc-report-generator.ts`, `src/testConnection.ts`, `scripts/post-merge.sh`: marcar muertos o borrarlos en un commit aparte.
  - Carpeta `google cloud/`: no se listó (el listado recursivo no terminó). Revisar a mano antes de cualquier commit y no subir credenciales.
  - Quitar el script de Replit en `client/index.html` línea 11.
  - Dependencias sin import en `server/` ni `client/src`: `@sendgrid/mail`, `@google-cloud/vertexai`, `memorystore`, `ws` (confirmar con un depcheck antes de borrar).
  - `ConnectionStatus.tsx` no está importado.
- **Dependencias:** Fase 0, para no borrar historia que alguien use.
- **Riesgo:** bajo.
- **Esfuerzo:** medio.
- **Terminado cuando:** un lector nuevo no encuentra Firebase como auth ni “92% operational” sin la etiqueta de obsoleto.

## Fase 5 — Calidad pública

- **Objetivo:** que lo público sea cierto, legible y legal.
- **Tareas:**
  - `<title>`, description, OG. Hoy `client/index.html` no tiene título.
  - Páginas `/terms` y `/privacy` reales, y los enlaces del login dejan de ser `#`.
  - Un idioma. Hoy la UI mezcla inglés y “Cerrar sesión”. El selector llama a `/api/translate` y Translate está en false.
  - 404 con la marca oscura, sin la frase del boilerplate.
  - Pasada móvil de login, pricing, dashboard y CRM a 390px.
  - Sitemap y robots: no existen.
- **Dependencias:** Fase 2 (el copy) y Fase 3 (los precios).
- **Riesgo:** bajo.
- **Esfuerzo:** medio.
- **Terminado cuando:** las cuatro pantallas anteriores se leen en el teléfono y ningún enlace legal da 404.

## Fase 6 — Elevar

- **Objetivo:** solo después de que el cuaderno sea verdad en producción.
- **Tareas (de la sección W de la biblia):**
  - Envío real con el secret de Resend del hub, from de un dominio verificado, o no hacerlo.
  - Límites de IA visibles antes de gastar.
  - Sentry con el secret del hub, sin imprimir el DSN.
  - No integrar Voicebox. Ver `docs/VOICEBOX-ASSESSMENT.md`.
  - No encender n8n ni TTS ni Translate hasta que exista secret y la pantalla diga el costo.
- **Dependencias:** Fases 0–3.
- **Riesgo:** medio (correo y webhooks salen del edificio).
- **Esfuerzo:** alto.
- **Terminado cuando:** un envío de prueba a un buzón propio queda en estado “enviado” solo con respuesta 2xx, o la feature sigue apagada y el copy lo dice.
