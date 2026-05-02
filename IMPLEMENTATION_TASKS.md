
# 📋 IMPLEMENTATION TASKS - AUTOMATOR AI

## 🔴 P1 - CRITICAL (Esta Semana)

### Task 1.1: n8n Integration Setup ⏱️ 30min
**Status:** ❌ NOT STARTED
**Location:** `.env`, `server/services/n8n-service.ts`

```bash
# Steps:
1. Install n8n or use cloud instance
2. Generate API key from n8n settings
3. Add to .env:
   N8N_API_KEY=your_api_key
   N8N_API_URL=http://localhost:5678/api/v1
4. Restart server
5. Test: curl http://localhost:5000/api/n8n/workflows
```

**Acceptance Criteria:**
- [ ] n8n API key configured
- [ ] API returns workflows list
- [ ] No connection errors in logs

---

### Task 1.2: Connect CRM to Backend ⏱️ 2hrs
**Status:** ⚠️ PARTIAL
**Location:** `client/src/pages/CRM.tsx`

**Changes Needed:**
```typescript
// Replace mock data with:
import { useQuery, useMutation } from '@tanstack/react-query';

const { data: leads } = useQuery({
  queryKey: ['/api/leads'],
});

const createLead = useMutation({
  mutationFn: (lead) => apiRequest({
    url: '/api/leads',
    method: 'POST',
    data: lead
  })
});
```

**Acceptance Criteria:**
- [ ] Leads loaded from API
- [ ] Create lead works
- [ ] Update lead works
- [ ] Delete lead works
- [ ] Loading states shown
- [ ] Error handling added

---

### Task 1.3: Connect Workflows to Backend ⏱️ 2hrs
**Status:** ⚠️ PARTIAL
**Location:** `client/src/pages/Workflows.tsx`

**Similar implementation to Task 1.2**

**Acceptance Criteria:**
- [ ] Workflows from database
- [ ] CRUD operations work
- [ ] Workflow builder saves to DB
- [ ] Real-time updates

---

### Task 1.4: API Rate Limiting ⏱️ 1hr
**Status:** ❌ NOT STARTED
**Location:** `server/index.ts`

**Implementation:**
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

**Acceptance Criteria:**
- [ ] Rate limiting active
- [ ] Per-plan limits configured
- [ ] Rate limit headers in response
- [ ] Error message when exceeded

---

## 🟡 P2 - URGENT (Próxima Semana)

### Task 2.1: Google Calendar OAuth ⏱️ 4hrs
**Status:** ❌ NOT STARTED
**Location:** New files needed

**Steps:**
1. Create OAuth credentials in Google Cloud Console
2. Add callback endpoint `/api/auth/google/callback`
3. Implement token storage
4. Create calendar sync service
5. Add UI for OAuth flow

**Files to Create:**
- `server/services/google-calendar.ts`
- `server/routes/auth.ts`
- `client/src/components/auth/GoogleCalendarConnect.tsx`

**Acceptance Criteria:**
- [ ] OAuth flow works
- [ ] Tokens stored securely
- [ ] Calendar events sync
- [ ] Refresh token works
- [ ] Error handling complete

---

### Task 2.2: Email Template Persistence ⏱️ 3hrs
**Status:** ⚠️ UI ONLY
**Location:** `client/src/pages/Email.tsx`

**Backend Changes:**
```typescript
// Already exists: /api/email-templates
// Just need to connect frontend
```

**Frontend Changes:**
```typescript
const { data: templates } = useQuery({
  queryKey: ['/api/email-templates']
});

const saveTemplate = useMutation({
  mutationFn: (template) => apiRequest({
    url: '/api/email-templates',
    method: 'POST',
    data: template
  })
});
```

**Acceptance Criteria:**
- [ ] Templates saved to DB
- [ ] Templates load on page
- [ ] Template CRUD works
- [ ] Template preview works
- [ ] Variables system functional

---

### Task 2.3: SendGrid Email Sending ⏱️ 3hrs
**Status:** ⚠️ CONFIGURED NOT USED
**Location:** New service needed

**Implementation:**
```typescript
// server/services/email-service.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(to: string, templateId: string, data: any) {
  const msg = {
    to,
    from: 'noreply@automatorai.com',
    templateId,
    dynamicTemplateData: data
  };
  
  await sgMail.send(msg);
}
```

**Acceptance Criteria:**
- [ ] Emails send successfully
- [ ] Template rendering works
- [ ] Tracking (opens/clicks) active
- [ ] Bounce handling implemented
- [ ] Error logging added

---

### Task 2.4: User Settings Persistence ⏱️ 2hrs
**Status:** ❌ NOT STARTED
**Location:** New endpoint needed

**Backend:**
```typescript
// Add to routes.ts
app.get("/api/user/settings", async (req, res) => {
  const settings = await storage.getUserSettings(req.user.id);
  res.json(settings);
});

app.put("/api/user/settings", async (req, res) => {
  const updated = await storage.updateUserSettings(req.user.id, req.body);
  res.json(updated);
});
```

**Database Schema:**
```sql
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  theme TEXT,
  language TEXT,
  notifications JSON,
  preferences JSON
);
```

**Acceptance Criteria:**
- [ ] Settings save to DB
- [ ] Settings load on login
- [ ] Settings sync across devices
- [ ] Migration for existing users

---

## 🟢 P3 - DEPLOYMENT (Antes del Launch)

### Task 3.1: 2FA Implementation ⏱️ 4hrs
**Status:** ❌ NOT STARTED

**Steps:**
1. Install speakeasy, qrcode
2. Create 2FA setup endpoint
3. Add verification endpoint
4. Generate backup codes
5. Update login flow

**Acceptance Criteria:**
- [ ] 2FA setup works
- [ ] QR code displays
- [ ] Verification works
- [ ] Backup codes generated
- [ ] Login with 2FA functional

---

### Task 3.2: Webhook Delivery System ⏱️ 4hrs
**Status:** ⚠️ PARTIAL

**Implementation:**
```bash
npm install bull redis
```

**Queue System:**
```typescript
import Queue from 'bull';

const webhookQueue = new Queue('webhooks', {
  redis: process.env.REDIS_URL
});

webhookQueue.process(async (job) => {
  const { url, payload } = job.data;
  await axios.post(url, payload, {
    headers: { 'X-Webhook-Signature': generateSignature(payload) }
  });
});
```

**Acceptance Criteria:**
- [ ] Queue system active
- [ ] Webhooks delivered
- [ ] Retry logic works
- [ ] Delivery logs saved
- [ ] Signature verification

---

### Task 3.3: Security Hardening ⏱️ 3hrs
**Status:** ⚠️ PARTIAL

**Additions Needed:**
```bash
npm install helmet csurf express-validator
```

```typescript
import helmet from 'helmet';
import csrf from 'csurf';

app.use(helmet());
app.use(csrf({ cookie: true }));
```

**Acceptance Criteria:**
- [ ] CSRF protection active
- [ ] Security headers set
- [ ] Input validation (Zod)
- [ ] XSS protection
- [ ] SQL injection prevention

---

## 📊 ADDITIONAL IMPROVEMENTS

### Task 4.1: Request Caching ⏱️ 2hrs
**Impact:** 50% faster API responses

```typescript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 });

app.get('/api/workflows', async (req, res) => {
  const cached = cache.get('workflows');
  if (cached) return res.json(cached);
  
  const workflows = await storage.getWorkflows();
  cache.set('workflows', workflows);
  res.json(workflows);
});
```

---

### Task 4.2: Error Monitoring ⏱️ 1hr
**Impact:** Better debugging

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

---

### Task 4.3: Performance Monitoring ⏱️ 1hr

```typescript
import { performance } from 'perf_hooks';

app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

---

## 🎯 SPRINT PLANNING

### Sprint 1 (Week 1) - P1 Critical
**Goal:** Fix critical issues, connect frontend to backend

- [ ] Task 1.1: n8n setup (0.5 days)
- [ ] Task 1.2: CRM backend connection (1 day)
- [ ] Task 1.3: Workflows backend connection (1 day)
- [ ] Task 1.4: Rate limiting (0.5 days)
- [ ] Task 4.2: Error monitoring (0.5 days)

**Total:** 3.5 days

---

### Sprint 2 (Week 2) - P2 Urgent
**Goal:** Complete essential features

- [ ] Task 2.1: Google Calendar OAuth (2 days)
- [ ] Task 2.2: Email templates persistence (1.5 days)
- [ ] Task 2.3: SendGrid integration (1.5 days)

**Total:** 5 days

---

### Sprint 3 (Week 3) - P3 Deployment
**Goal:** Security & deployment prep

- [ ] Task 2.4: User settings (1 day)
- [ ] Task 3.1: 2FA (2 days)
- [ ] Task 3.2: Webhook delivery (2 days)

**Total:** 5 days

---

### Sprint 4 (Week 4) - Polish
**Goal:** Performance & UX

- [ ] Task 3.3: Security hardening (1.5 days)
- [ ] Task 4.1: Caching (1 day)
- [ ] Task 4.3: Performance monitoring (0.5 day)
- [ ] Testing & bug fixes (2 days)

**Total:** 5 days

---

## 📈 TRACKING

### Completion Status
- **P1 Tasks:** 0/4 complete (0%)
- **P2 Tasks:** 0/4 complete (0%)
- **P3 Tasks:** 0/3 complete (0%)
- **Improvements:** 0/3 complete (0%)

### Time Estimates
- **P1 Total:** 5.5 hours
- **P2 Total:** 12 hours
- **P3 Total:** 11 hours
- **Improvements:** 4 hours

**Grand Total:** ~32 hours (4 working days)

---

## ✅ DEFINITION OF DONE

Each task is complete when:
- [ ] Code implemented and tested
- [ ] Unit tests added (if applicable)
- [ ] Documentation updated
- [ ] PR reviewed and merged
- [ ] Deployed to staging
- [ ] QC verification passed
- [ ] No regressions detected

---

**Last Updated:** 2025-01-13
**Next Review:** After Sprint 1 completion
