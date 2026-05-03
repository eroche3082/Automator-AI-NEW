# Threat Model

## Project Overview

AUTOMATOR AI is a multi-tenant sales automation and CRM SaaS. The production stack is a React/Vite frontend served by an Express/TypeScript API, Drizzle ORM over Neon PostgreSQL, Google OAuth 2.0 with server-side PostgreSQL sessions, Stripe subscriptions, Google Gemini/Translate/Text-to-Speech APIs, and optional n8n orchestration. The browser is untrusted; all tenant isolation, plan assignment, billing changes, and third-party service calls must be enforced by the backend.

Production assumptions: `NODE_ENV` is `production`; the platform terminates TLS and manages certificates; the mockup/sandbox environment is development-only and not production-scoped.

## Assets

- **User accounts and sessions** -- Google OAuth identities, email addresses, profile data, and the `automator.sid` session cookie. Compromise allows account impersonation and tenant data access.
- **Tenant CRM data** -- workflows, leads, email templates, meetings, integrations, and user-created webhooks. These records are tenant-owned and must not cross user boundaries.
- **Billing and subscription state** -- Stripe customer IDs, subscription IDs, plan codes, checkout sessions, billing portal URLs, and webhook-driven plan updates. Tampering can cause unauthorized paid access or billing disruption.
- **Application and integration secrets** -- database URL, session secret, Google API keys/service account credentials, Stripe keys/webhook secret, n8n API key, and webhook signing secrets.
- **Paid external API quota** -- Google AI/Translate/TTS, Stripe API, and n8n API calls. Abuse can create direct cost, quota exhaustion, or unwanted external resource changes.
- **Operational diagnostics** -- health reports, environment-key presence, connected account IDs, service error messages, and integration metadata that reveal internal configuration.

## Trust Boundaries

- **Browser to Express API** -- all client requests are attacker-controlled. Protected endpoints must require a valid server-side session and must derive `userId`, Stripe customer identity, and plan state server-side.
- **Authenticated tenant to other tenants** -- CRUD routes for workflows, leads, templates, meetings, integrations, and webhooks must check ownership before read/write/delete.
- **Express API to PostgreSQL** -- database access must use Drizzle query builders or safe parameterization. No public endpoint may expose unscoped tenant data.
- **Express API to Stripe** -- only authenticated users may create checkout/customer-portal sessions for themselves; Stripe webhooks must verify signatures before mutating subscription state; administrative Stripe setup/health actions are not public user features.
- **Express API to Google AI/Translate/TTS** -- endpoints using paid Google APIs must be authenticated, validated, bounded, and rate-limited to prevent quota/cost abuse and uncontrolled prompt/data processing.
- **Express API to n8n** -- the server-side n8n API key is privileged. n8n workflow, execution, and credential metadata must not be exposed to unauthenticated users, and mutations must be authorized.
- **Public to operational diagnostics** -- production diagnostics must not reveal secrets, key names, account IDs, service inventory, internal errors, or trigger expensive connectivity checks unless protected by an admin boundary.

## Scan Anchors

- Production entry points: `server/index.ts`, `server/routes.ts`, `server/routes/auth.ts`, `server/auth/passport.ts`, `server/middleware/auth.ts`.
- Tenant data and validation: `shared/schema.ts`, `server/storage.ts`, CRUD sections in `server/routes.ts`.
- Billing surface: `server/services/stripe-service.ts` and Stripe routes/webhook in `server/routes.ts`.
- External API surfaces: `server/services/gemini-service.ts`, `server/services/translate-service.ts`, `server/services/tts-service.ts`, `server/services/n8n-service.ts`, and their routes in `server/routes.ts`.
- Public diagnostic surfaces: `/api/health`, `/api/qc-report`, `/api/stripe/health`, `/api/stripe/connectivity`, `/api/stripe/environment`, `/api/system/health`, `/api/system/google-keys`, and unauthenticated n8n/AI/Translate/TTS routes in `server/routes.ts`.
- Dev-only areas usually ignored unless production reachability is shown: `server/vite.ts`, Vite dev plugins, QC/test scripts such as `src/testConnection.ts`, `interactive-qc.spec.ts`, and attached assets.

## Threat Categories

### Spoofing

Users authenticate through Google OAuth and server-side sessions. Every endpoint that reads or mutates user, tenant, billing, or integration data must require `requireAuth` and must not trust client-supplied user identifiers. OAuth state must remain enabled, session cookies must be `httpOnly`, `Secure` in production, and signed with a production-only secret.

### Tampering

Tenant records, integration settings, webhook URLs/events, and subscription state must only be changed by authorized users or verified Stripe webhook events. The server must derive `userId`, Stripe customer IDs, prices, and plan codes from trusted data, not from arbitrary client input. Operational endpoints that create Stripe products/payment links or mutate n8n resources require an admin-only boundary.

### Information Disclosure

API responses must not expose other tenants' data, internal billing identifiers beyond what the client needs, secrets, partial secrets, environment variable names that materially aid attackers, n8n credential metadata, stack traces, or detailed third-party service errors. Diagnostic and health endpoints must be authenticated/admin-only or return a minimal public liveness response.

### Denial of Service

Public endpoints that call paid or slow external APIs can be abused to exhaust quota, incur cost, or tie up server resources. AI, translation, TTS, Stripe connectivity/setup, n8n listing, and comprehensive health checks must require authorization, enforce input limits, rate limits, and timeouts, and avoid triggering expensive checks on public traffic.

### Elevation of Privilege

A regular or unauthenticated user must not gain admin-like capabilities such as creating Stripe resources, viewing integration credentials/metadata, running n8n workflows, or activating paid plans without verified payment. All tenant-scoped CRUD routes must maintain server-side ownership checks, and all database queries must remain parameterized.