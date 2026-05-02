import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { geminiService, Workflow } from "./services/gemini-service";
import type { User } from "@shared/schema";
import {
  createWorkflowPayloadSchema, updateWorkflowPayloadSchema,
  createLeadPayloadSchema, updateLeadPayloadSchema,
  createEmailTemplatePayloadSchema, updateEmailTemplatePayloadSchema,
  createMeetingPayloadSchema, updateMeetingPayloadSchema,
  createIntegrationPayloadSchema, updateIntegrationPayloadSchema,
  createWebhookPayloadSchema, updateWebhookPayloadSchema,
  createCheckoutSessionSchema,
} from "@shared/schema";
import crypto from "crypto";
import { translateService, type SupportedLanguage } from "./services/translate-service";
import { ttsService, type VoiceConfig, type AudioConfig } from "./services/tts-service";
import { n8nService } from "./services/n8n-service";
import { checkSystemHealth } from './health-check';

// Helper: parse a Zod schema, return 400 with details on failure.
function parseOrFail<T>(schema: { safeParse: (i: unknown) => any }, body: unknown, res: Response): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    return null;
  }
  return parsed.data as T;
}
import { attachUser, requireAuth } from "./middleware/auth";
import { loadCurrentUser } from "./middleware/current-user";
import { getPlanByCode } from "@shared/membership";

// Convenience: routes that need authentication + DB-user resolution.
const authed = [requireAuth, loadCurrentUser];

export async function registerRoutes(app: Express): Promise<Server> {
  // Attach req.user to every request when a valid Firebase token is provided.
  // Endpoints that require authentication use the strict `requireAuth` middleware.
  app.use("/api", attachUser);

  // API Routes

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const health = await checkSystemHealth();
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        services: health
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================================
  // Current user (profile) — read & update
  // ============================================================
  // Public-safe shape of a user. Excludes credentials AND internal identifiers
  // (firebaseUid, stripeCustomerId, stripeSubscriptionId) that the client does not need.
  function toProfileDto(u: User) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      company: u.company,
      timezone: u.timezone,
      language: u.language,
      notificationPrefs: u.notificationPrefs,
      plan: u.plan,
      subscriptionStatus: u.subscriptionStatus,
      hasBillingAccount: !!u.stripeCustomerId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  app.get("/api/me", ...authed, async (req, res) => {
    try {
      res.json(toProfileDto(req.dbUser!));
    } catch (error) {
      res.status(500).json({ error: "Failed to load profile" });
    }
  });

  app.patch("/api/me", ...authed, async (req, res) => {
    try {
      const { updateUserProfileSchema } = await import("@shared/schema");
      const parsed = updateUserProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid profile data", details: parsed.error.flatten() });
      }

      // Merge notificationPrefs over existing rather than overwriting wholesale.
      const updates: Partial<User> = { ...parsed.data } as Partial<User>;
      if (parsed.data.notificationPrefs) {
        const current = (req.dbUser!.notificationPrefs as Record<string, boolean>) || {};
        updates.notificationPrefs = { ...current, ...parsed.data.notificationPrefs } as any;
      }
      updates.updatedAt = new Date();

      try {
        const updated = await storage.updateUser(req.dbUser!.id, updates);
        if (!updated) return res.status(404).json({ error: "User not found" });
        return res.json(toProfileDto(updated));
      } catch (dbErr: any) {
        // Postgres unique-violation code is "23505".
        if (dbErr?.code === "23505" || /unique|duplicate/i.test(dbErr?.message || "")) {
          return res.status(409).json({ error: "That email is already in use." });
        }
        throw dbErr;
      }
    } catch (error) {
      console.error("PATCH /api/me failed:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Dashboard endpoint — real data scoped to authenticated user
  app.get("/api/dashboard", ...authed, async (req, res) => {
    try {
      const userId = req.dbUser!.id;
      const [totalLeads, activeWorkflows, upcomingMeetings, recentActivity] = await Promise.all([
        storage.countLeads(userId),
        storage.countWorkflows(userId, "active"),
        storage.countUpcomingMeetings(userId, new Date()),
        storage.getRecentActivity(userId, 5),
      ]);

      res.json({
        totalLeads,
        activeWorkflows,
        upcomingMeetings,
        recentActivity: recentActivity.map(a => ({
          type: a.type,
          timestamp: a.timestamp.toISOString(),
          details: a.details,
        })),
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // QC Report endpoint
  app.get("/api/qc-report", async (req, res) => {
    try {
      const { QCReportGenerator } = await import('../qc-report-generator');
      const report = await QCReportGenerator.generateReport();

      res.setHeader('Content-Type', 'text/plain');
      res.send(report);
    } catch (error) {
      res.status(500).json({
        error: "Failed to generate QC report",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================================
  // Workflow Routes — scoped to authenticated user (tenant isolation)
  // ============================================================
  app.get("/api/workflows", ...authed, async (req, res) => {
    try {
      const list = await storage.getWorkflowsByUserId(req.dbUser!.id);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", ...authed, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(parseInt(req.params.id));
      if (!workflow || workflow.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", ...authed, async (req, res) => {
    try {
      const data = parseOrFail<any>(createWorkflowPayloadSchema, req.body, res);
      if (!data) return;
      const workflow = await storage.createWorkflow({ ...data, userId: req.dbUser!.id });
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to create workflow" });
    }
  });

  app.put("/api/workflows/:id", ...authed, async (req, res) => {
    try {
      const existing = await storage.getWorkflow(parseInt(req.params.id));
      if (!existing || existing.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      const data = parseOrFail<any>(updateWorkflowPayloadSchema, req.body, res);
      if (!data) return;
      const updated = await storage.updateWorkflow(existing.id, data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", ...authed, async (req, res) => {
    try {
      const existing = await storage.getWorkflow(parseInt(req.params.id));
      if (!existing || existing.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      await storage.deleteWorkflow(existing.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  // ============================================================
  // Lead Routes — tenant scoped
  // ============================================================
  app.get("/api/leads", ...authed, async (req, res) => {
    try {
      const list = await storage.getLeadsByUserId(req.dbUser!.id);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", ...authed, async (req, res) => {
    try {
      const lead = await storage.getLead(parseInt(req.params.id));
      if (!lead || lead.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", ...authed, async (req, res) => {
    try {
      const data = parseOrFail<any>(createLeadPayloadSchema, req.body, res);
      if (!data) return;
      const lead = await storage.createLead({ ...data, userId: req.dbUser!.id });
      res.status(201).json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", ...authed, async (req, res) => {
    try {
      const existing = await storage.getLead(parseInt(req.params.id));
      if (!existing || existing.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Lead not found" });
      }
      const data = parseOrFail<any>(updateLeadPayloadSchema, req.body, res);
      if (!data) return;
      const updated = await storage.updateLead(existing.id, data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", ...authed, async (req, res) => {
    try {
      const existing = await storage.getLead(parseInt(req.params.id));
      if (!existing || existing.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Lead not found" });
      }
      await storage.deleteLead(existing.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // ============================================================
  // Email Templates Routes — tenant scoped
  // ============================================================
  app.get("/api/email-templates", ...authed, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplatesByUserId(req.dbUser!.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  app.get("/api/email-templates/:id", ...authed, async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(parseInt(req.params.id));
      if (!template || template.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Email template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email template" });
    }
  });

  app.post("/api/email-templates", ...authed, async (req, res) => {
    try {
      const data = parseOrFail<any>(createEmailTemplatePayloadSchema, req.body, res);
      if (!data) return;
      const template = await storage.createEmailTemplate({ ...data, userId: req.dbUser!.id });
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create email template" });
    }
  });

  app.put("/api/email-templates/:id", ...authed, async (req, res) => {
    try {
      const target = await storage.getEmailTemplate(parseInt(req.params.id));
      if (!target || target.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Email template not found" });
      }
      const data = parseOrFail<any>(updateEmailTemplatePayloadSchema, req.body, res);
      if (!data) return;
      const updated = await storage.updateEmailTemplate(target.id, data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update email template" });
    }
  });

  app.delete("/api/email-templates/:id", ...authed, async (req, res) => {
    try {
      const target = await storage.getEmailTemplate(parseInt(req.params.id));
      if (!target || target.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Email template not found" });
      }
      await storage.deleteEmailTemplate(target.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete email template" });
    }
  });

  // ============================================================
  // Meeting Routes — tenant scoped
  // ============================================================
  app.get("/api/meetings", ...authed, async (req, res) => {
    try {
      const list = await storage.getMeetingsByUserId(req.dbUser!.id);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", ...authed, async (req, res) => {
    try {
      const data = parseOrFail<any>(createMeetingPayloadSchema, req.body, res);
      if (!data) return;
      const meeting = await storage.createMeeting({ ...data, userId: req.dbUser!.id });
      res.status(201).json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.put("/api/meetings/:id", ...authed, async (req, res) => {
    try {
      const target = await storage.getMeeting(parseInt(req.params.id));
      if (!target || target.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      const data = parseOrFail<any>(updateMeetingPayloadSchema, req.body, res);
      if (!data) return;
      const updated = await storage.updateMeeting(target.id, data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", ...authed, async (req, res) => {
    try {
      const target = await storage.getMeeting(parseInt(req.params.id));
      if (!target || target.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      await storage.deleteMeeting(target.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // ============================================================
  // Integration Routes — tenant scoped
  // ============================================================
  app.get("/api/integrations", ...authed, async (req, res) => {
    try {
      const list = await storage.getIntegrationsByUserId(req.dbUser!.id);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations", ...authed, async (req, res) => {
    try {
      const data = parseOrFail<any>(createIntegrationPayloadSchema, req.body, res);
      if (!data) return;
      const created = await storage.createIntegration({ ...data, userId: req.dbUser!.id });
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create integration" });
    }
  });

  app.put("/api/integrations/:id", ...authed, async (req, res) => {
    try {
      const target = await storage.getIntegration(parseInt(req.params.id));
      if (!target || target.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Integration not found" });
      }
      const data = parseOrFail<any>(updateIntegrationPayloadSchema, req.body, res);
      if (!data) return;
      const updated = await storage.updateIntegration(target.id, data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update integration" });
    }
  });

  app.delete("/api/integrations/:id", ...authed, async (req, res) => {
    try {
      const target = await storage.getIntegration(parseInt(req.params.id));
      if (!target || target.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Integration not found" });
      }
      await storage.deleteIntegration(target.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete integration" });
    }
  });

  // ============================================================
  // Webhook Routes — tenant scoped
  // ============================================================
  app.get("/api/webhooks", ...authed, async (req, res) => {
    try {
      const list = await storage.getWebhooksByUserId(req.dbUser!.id);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webhooks" });
    }
  });

  app.post("/api/webhooks", ...authed, async (req, res) => {
    try {
      const data = parseOrFail<any>(createWebhookPayloadSchema, req.body, res);
      if (!data) return;
      const secretKey = "whsec_" + crypto.randomBytes(24).toString("hex");
      const created = await storage.createWebhook({ ...data, userId: req.dbUser!.id, secretKey });
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: "Failed to create webhook" });
    }
  });

  app.put("/api/webhooks/:id", ...authed, async (req, res) => {
    try {
      const target = await storage.getWebhook(parseInt(req.params.id));
      if (!target || target.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Webhook not found" });
      }
      const data = parseOrFail<any>(updateWebhookPayloadSchema, req.body, res);
      if (!data) return;
      const updated = await storage.updateWebhook(target.id, data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update webhook" });
    }
  });

  app.delete("/api/webhooks/:id", ...authed, async (req, res) => {
    try {
      const target = await storage.getWebhook(parseInt(req.params.id));
      if (!target || target.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Webhook not found" });
      }
      await storage.deleteWebhook(target.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  });

  // AI Routes using Gemini
  app.get("/api/ai/welcome", async (req, res) => {
    try {
      const welcomeMessage = await geminiService.generateWelcomeMessage();
      res.json(welcomeMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate welcome message" });
    }
  });

  app.post("/api/ai/email-suggestion", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const suggestion = await geminiService.generateEmailSuggestion(prompt);
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate email suggestion" });
    }
  });

  app.post("/api/ai/document-suggestion", async (req, res) => {
    try {
      const { prompt, documentType } = req.body;
      if (!prompt || !documentType) {
        return res.status(400).json({ error: "Prompt and document type are required" });
      }
      const suggestion = await geminiService.generateDocumentSuggestion(prompt, documentType);
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate document suggestion" });
    }
  });

  app.get("/api/ai/workflow-optimize/:id", ...authed, async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow || workflow.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      // Create a compatible workflow object ensuring description is in the right format
      const workflowData: Workflow = {
        ...workflow,
        description: workflow.description || undefined,
        triggerCount: workflow.triggerCount || 0
      };
      const suggestions = await geminiService.optimizeWorkflow(workflowData);
      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ error: "Failed to optimize workflow" });
    }
  });

  app.get("/api/ai/lead-insights/:id", ...authed, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const lead = await storage.getLead(leadId);
      if (!lead || lead.userId !== req.dbUser!.id) {
        return res.status(404).json({ error: "Lead not found" });
      }
      const insights = await geminiService.generateLeadInsights(lead);
      res.json({ insights });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate lead insights" });
    }
  });

  // Translation API Routes
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({ 
          error: "Text and target language are required" 
        });
      }

      const translatedText = await translateService.translateText(
        text,
        targetLanguage as SupportedLanguage,
        sourceLanguage as SupportedLanguage
      );

      res.json({ translatedText });
    } catch (error) {
      res.status(500).json({ error: "Failed to translate text" });
    }
  });

  app.post("/api/detect-language", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const detectedLanguage = await translateService.detectLanguage(text);
      res.json({ language: detectedLanguage });
    } catch (error) {
      res.status(500).json({ error: "Failed to detect language" });
    }
  });

  // Text-to-Speech API Routes
  app.post("/api/text-to-speech", async (req, res) => {
    try {
      const { text, voice, audioConfig } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const audioContent = await ttsService.textToSpeech(
        text,
        voice as Partial<VoiceConfig>,
        audioConfig as Partial<AudioConfig>
      );

      res.json({ audioContent });
    } catch (error) {
      res.status(500).json({ error: "Failed to convert text to speech" });
    }
  });

  app.get("/api/tts/voices", async (req, res) => {
    try {
      const { languageCode } = req.query;
      const voices = await ttsService.listVoices(languageCode as string);
      res.json({ voices });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voices" });
    }
  });

  // Membership Configuration
  app.get("/api/membership/plans", async (req, res) => {
    try {
      const { MEMBERSHIP_CONFIG } = await import("../shared/membership");
      res.json(MEMBERSHIP_CONFIG);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch membership plans" });
    }
  });

  // Stripe Payment Routes
  app.get("/api/stripe/health", async (req, res) => {
    try {
      const { stripeService } = await import("./services/stripe-service");
      const healthReport = await stripeService.generateHealthReport();
      res.json(healthReport);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate Stripe health report" });
    }
  });

  app.get("/api/stripe/connectivity", async (req, res) => {
    try {
      const { stripeService } = await import("./services/stripe-service");
      const connectivity = await stripeService.validateLiveConnectivity();
      res.json(connectivity);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate Stripe connectivity" });
    }
  });

  app.post("/api/stripe/create-payment-links", async (req, res) => {
    try {
      const { stripeService } = await import("./services/stripe-service");
      const { plans } = req.body || {};
      if (!Array.isArray(plans) || plans.length === 0) {
        return res.status(400).json({ error: "Body must include a non-empty 'plans' array" });
      }
      const paymentLinks = await stripeService.createPaymentLinks(plans);
      res.json(paymentLinks);
    } catch (error: any) {
      console.error("create-payment-links failed:", error);
      res.status(500).json({ error: error?.message || "Failed to create payment links" });
    }
  });

  // Create a Stripe Checkout Session for the authenticated user + chosen plan.
  // The webhook (POST /api/webhooks/stripe) consumes client_reference_id to link
  // the resulting Stripe customer back to our user.
  app.post("/api/stripe/create-checkout-session", ...authed, async (req, res) => {
    try {
      const data = parseOrFail<{ planCode: "basic"|"pro"|"elite"; interval: "month"|"year" }>(
        createCheckoutSessionSchema, req.body, res
      );
      if (!data) return;
      const { stripeService } = await import("./services/stripe-service");
      const result = await stripeService.createCheckoutSession({
        planCode: data.planCode,
        interval: data.interval,
        userId: req.dbUser!.id,
        email: req.dbUser!.email,
      });
      res.json(result);
    } catch (error: any) {
      console.error("create-checkout-session failed:", error);
      res.status(500).json({ error: error?.message || "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/customer-portal", requireAuth, async (req, res) => {
    try {
      const { stripeService } = await import("./services/stripe-service");
      // Derive Stripe customerId from the authenticated user; never trust client input.
      if (!req.user?.uid) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const dbUser = await storage.getUserByFirebaseUid(req.user.uid);
      if (!dbUser?.stripeCustomerId) {
        return res.status(404).json({ error: "No Stripe customer linked to this account" });
      }
      const portalUrl = await stripeService.createCustomerPortalSession(dbUser.stripeCustomerId);
      res.json({ url: portalUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to create customer portal session" });
    }
  });

  app.get("/api/stripe/environment", async (req, res) => {
    try {
      const { stripeService } = await import("./services/stripe-service");
      const env = stripeService.getEnvironmentStatus();
      res.json(env);
    } catch (error) {
      res.status(500).json({ error: "Failed to get environment status" });
    }
  });

  // Stripe Webhook Handler — verifies signature and updates DB
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeKey = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
    const rawBody: Buffer | undefined = (req as any).rawBody;

    if (!webhookSecret || !stripeKey) {
      return res.status(503).json({ error: "Stripe webhook not configured" });
    }
    if (!sig || !rawBody) {
      return res.status(400).json({ error: "Missing signature or body" });
    }

    let event: any;
    try {
      const Stripe = (await import("stripe")).default;
      const stripeClient = new Stripe(stripeKey, { apiVersion: '2024-09-30.acacia' as any });
      event = stripeClient.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    // Helper: map a Stripe price/product to one of our internal plan codes.
    const planFromPriceNickname = (nickname?: string | null): string | null => {
      if (!nickname) return null;
      const n = nickname.toLowerCase();
      if (n.includes("elite")) return "elite";
      if (n.includes("pro")) return "pro";
      if (n.includes("basic")) return "basic";
      return null;
    };

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const customerId = session.customer as string | null;
          const subscriptionId = session.subscription as string | null;
          const userIdRef = session.client_reference_id as string | null;
          const planFromMeta = session.metadata?.plan as string | undefined;

          if (!customerId) break;

          const updates: any = {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: "active",
          };
          if (planFromMeta && getPlanByCode(planFromMeta)) updates.plan = planFromMeta;

          const parsedUserId = userIdRef ? parseInt(userIdRef, 10) : NaN;
          if (Number.isFinite(parsedUserId) && parsedUserId > 0) {
            await storage.updateUser(parsedUserId, updates);
            console.log(`✅ Activated subscription for user ${parsedUserId} (customer ${customerId})`);
          } else {
            // Fallback: try to find existing user by customerId
            const existing = await storage.getUserByStripeCustomerId(customerId);
            if (existing) {
              await storage.updateUser(existing.id, updates);
              console.log(`✅ Updated existing customer ${customerId}`);
            } else {
              console.warn(`⚠️ checkout.session.completed without client_reference_id; cannot link customer ${customerId} to a user`);
            }
          }
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const sub = event.data.object;
          const customerId = sub.customer as string;
          const status = sub.status as string;
          const priceNickname = sub.items?.data?.[0]?.price?.nickname;
          const planCode = planFromPriceNickname(priceNickname);

          const updates: any = {
            stripeSubscriptionId: sub.id,
            subscriptionStatus: status,
          };
          if (planCode) updates.plan = planCode;

          const updated = await storage.updateUserByStripeCustomerId(customerId, updates);
          if (updated) {
            console.log(`📝 Subscription ${status} for customer ${customerId}`);
          } else {
            console.warn(`⚠️ No user found for Stripe customer ${customerId}`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object;
          const customerId = sub.customer as string;
          const updated = await storage.updateUserByStripeCustomerId(customerId, {
            plan: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null as any,
          });
          if (updated) console.log(`❌ Subscription cancelled for customer ${customerId} → downgraded to free`);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          const customerId = invoice.customer as string;
          await storage.updateUserByStripeCustomerId(customerId, { subscriptionStatus: "active" });
          console.log(`💰 Payment succeeded for customer ${customerId}`);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          const customerId = invoice.customer as string;
          await storage.updateUserByStripeCustomerId(customerId, { subscriptionStatus: "past_due" });
          console.warn(`💸 Payment failed for customer ${customerId} → marked past_due`);
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook handler error:', err);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  });

  // n8n Integration Routes

  // Returns the n8n base URL so the frontend can build direct links (never exposes the API key)
  app.get("/api/n8n/config", (_req, res) => {
    const apiUrl = process.env.N8N_API_URL || "";
    // Strip /api/v1 suffix to get the UI base URL
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "") || null;
    res.json({ baseUrl });
  });

  app.get("/api/n8n/workflows", async (req, res) => {
    try {
      const workflows = await n8nService.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch n8n workflows" });
    }
  });

  app.get("/api/n8n/workflows/:id", async (req, res) => {
    try {
      const workflow = await n8nService.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "n8n workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch n8n workflow" });
    }
  });

  app.post("/api/n8n/workflows", requireAuth, async (req, res) => {
    try {
      const workflow = await n8nService.createWorkflow(req.body);
      if (!workflow) {
        return res.status(400).json({ error: "Failed to create n8n workflow" });
      }
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to create n8n workflow" });
    }
  });

  app.patch("/api/n8n/workflows/:id", requireAuth, async (req, res) => {
    try {
      const updated = await n8nService.updateWorkflow(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "n8n workflow not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update n8n workflow" });
    }
  });

  app.delete("/api/n8n/workflows/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await n8nService.deleteWorkflow(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "n8n workflow not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete n8n workflow" });
    }
  });

  app.post("/api/n8n/workflows/:id/activate", requireAuth, async (req, res) => {
    try {
      const activated = await n8nService.activateWorkflow(req.params.id);
      if (!activated) {
        return res.status(404).json({ error: "Failed to activate n8n workflow" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to activate n8n workflow" });
    }
  });

  app.post("/api/n8n/workflows/:id/deactivate", requireAuth, async (req, res) => {
    try {
      const deactivated = await n8nService.deactivateWorkflow(req.params.id);
      if (!deactivated) {
        return res.status(404).json({ error: "Failed to deactivate n8n workflow" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to deactivate n8n workflow" });
    }
  });

  app.post("/api/n8n/workflows/:id/execute", requireAuth, async (req, res) => {
    try {
      const execution = await n8nService.executeWorkflow(req.params.id, req.body.data);
      if (!execution) {
        return res.status(400).json({ error: "Failed to execute n8n workflow" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: "Failed to execute n8n workflow" });
    }
  });

  app.get("/api/n8n/executions", async (req, res) => {
    try {
      const { workflowId, limit } = req.query;
      const executions = await n8nService.getExecutions(
        workflowId as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(executions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch n8n executions" });
    }
  });

  app.get("/api/n8n/credentials", async (req, res) => {
    try {
      const credentials = await n8nService.getCredentials();
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch n8n credentials" });
    }
  });

  // Comprehensive connectivity test endpoint
  app.get("/api/system/health", async (req: Request, res: Response) => {
    try {
      const startDb = Date.now();
      await storage.getLeads(); // Check DB connection
      const dbResponseTime = Date.now() - startDb;

      let geminiStatus: '✅' | '❌' | '⚠️' = '❌';
      let geminiDetails = 'Not checked';
      let geminiResponseTime: number | undefined = undefined;
      try {
        const startGemini = Date.now();
        await geminiService.generateWelcomeMessage();
        geminiStatus = '✅';
        geminiDetails = 'Connected and responding';
        geminiResponseTime = Date.now() - startGemini;
      } catch (error) {
        geminiDetails = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }

      let translateStatus: '✅' | '❌' | '⚠️' = '❌';
      let translateDetails = 'Not checked';
      let translateResponseTime: number | undefined = undefined;
      try {
        const startTranslate = Date.now();
        await translateService.translateText('Hello', 'es');
        translateStatus = '✅';
        translateDetails = 'Translation service is active';
        translateResponseTime = Date.now() - startTranslate;
      } catch (error) {
        translateDetails = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }

      let ttsStatus: '✅' | '❌' | '⚠️' = '❌';
      let ttsDetails = 'Not checked';
      let ttsResponseTime: number | undefined = undefined;
      try {
        const startTts = Date.now();
        const voices = await ttsService.listVoices('en-US');
        ttsStatus = '✅';
        ttsDetails = `Available voices: ${voices.length}`;
        ttsResponseTime = Date.now() - startTts;
      } catch (error) {
        ttsDetails = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }

      let stripeStatus: '✅' | '❌' | '⚠️' = '❌';
      let stripeDetails = 'Not checked';
      let stripeResponseTime: number | undefined = undefined;
      try {
        const startStripe = Date.now();
        const { stripeService } = await import("./services/stripe-service");
        const connectivity = await stripeService.validateLiveConnectivity();
        stripeStatus = connectivity.isLive && connectivity.chargesEnabled ? '✅' : '⚠️';
        stripeDetails = `Account: ${connectivity.accountId}, Charges Enabled: ${connectivity.chargesEnabled}`;
        stripeResponseTime = Date.now() - startStripe;
      } catch (error) {
        stripeDetails = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }

      let n8nStatus: '✅' | '❌' | '⚠️' = '❌';
      let n8nDetails = 'Not checked';
      let n8nResponseTime: number | undefined = undefined;
      try {
        const startN8n = Date.now();
        const workflows = await n8nService.getWorkflows();
        n8nStatus = workflows ? '✅' : '⚠️';
        n8nDetails = workflows ? `Connected - ${workflows.length} workflows` : 'API key missing or invalid';
        n8nResponseTime = Date.now() - startN8n;
      } catch (error) {
        n8nDetails = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }

      const envChecks = [
        'GOOGLE_GENAI_API_KEY',
        'GOOGLE_AI_API_KEY',
        'GEMINI_API_KEY',
        'VERTEX_AI_API_KEY',
        'GOOGLE_TRANSLATE_API_KEY',
        'GOOGLE_TTS_API_KEY',
        'GOOGLE_MAPS_API_KEY',
        'GOOGLE_CALENDAR_API_KEY',
        'GOOGLE_APPLICATION_CREDENTIALS',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'DATABASE_URL',
        'SESSION_SECRET'
      ];
      const missingEnvVars = envChecks.filter(key => !process.env[key]);
      const envVarsStatus: '✅' | '❌' | '⚠️' = missingEnvVars.length === 0 ? '✅' : missingEnvVars.length < envChecks.length ? '⚠️' : '❌';
      const envVarsDetails = `Missing: ${missingEnvVars.join(', ') || 'None'}`;


      const healthChecks = {
        timestamp: new Date().toISOString(),
        app: process.env.APP_NAME || 'AUTOMATOR_AI',
        environment: process.env.NODE_ENV || 'development',
        checks: {
          'Database': {
            status: '✅',
            details: `Connected - ${dbResponseTime}ms`,
          },
          'Google AI (Gemini)': {
            status: geminiStatus,
            details: geminiDetails,
            response_time: geminiResponseTime
          },
          'Google Translate': {
            status: translateStatus,
            details: translateDetails,
            response_time: translateResponseTime
          },
          'Google Text-to-Speech': {
            status: ttsStatus,
            details: ttsDetails,
            response_time: ttsResponseTime
          },
          'Stripe LIVE': {
            status: stripeStatus,
            details: stripeDetails,
            response_time: stripeResponseTime
          },
          'n8n Integration': {
            status: n8nStatus,
            details: n8nDetails,
            response_time: n8nResponseTime
          },
          'Environment Variables': {
            status: envVarsStatus,
            details: envVarsDetails
          }
        }
      };

      const totalChecks = Object.keys(healthChecks.checks).length;
      const passedChecks = Object.values(healthChecks.checks).filter(check => check.status === '✅').length;
      const warningChecks = Object.values(healthChecks.checks).filter(check => check.status === '⚠️').length;

      res.json({
        ...healthChecks,
        summary: {
          total: totalChecks,
          passed: passedChecks,
          warnings: warningChecks,
          failed: totalChecks - passedChecks - warningChecks,
          overall_status: passedChecks === totalChecks ? '✅ ALL SYSTEMS OPERATIONAL' :
                         warningChecks > 0 ? '⚠️ SOME ISSUES DETECTED' : '❌ CRITICAL ISSUES'
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Health check failed", details: error });
    }
  });

  // Google API Keys verification endpoint
  app.get("/api/system/google-keys", async (req: Request, res: Response) => {
    try {
      const googleKeys = {
        GOOGLE_GENAI_API_KEY: !!process.env.GOOGLE_GENAI_API_KEY,
        GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        VERTEX_AI_API_KEY: !!process.env.VERTEX_AI_API_KEY,
        GOOGLE_TRANSLATE_API_KEY: !!process.env.GOOGLE_TRANSLATE_API_KEY,
        GOOGLE_TTS_API_KEY: !!process.env.GOOGLE_TTS_API_KEY,
        GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
        GOOGLE_CALENDAR_API_KEY: !!process.env.GOOGLE_CALENDAR_API_KEY,
        service_account_configured: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
      };

      const activeCount = Object.values(googleKeys).filter(Boolean).length;

      res.json({
        timestamp: new Date().toISOString(),
        total_keys: Object.keys(googleKeys).length,
        active_keys: activeCount,
        status: activeCount > 0 ? "✅ ACTIVE" : "❌ NO KEYS FOUND",
        keys: googleKeys,
        recommendations: activeCount === 0 ? [
          "Add GOOGLE_GENAI_API_KEY to environment variables",
          "Or configure service account authentication"
        ] : ["All Google services are properly configured"]
      });
    } catch (error) {
      res.status(500).json({ error: "Google keys check failed", details: error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}