import { pgTable, text, serial, integer, boolean, json, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  // bcrypt hash of the user's password.
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company"),
  timezone: text("timezone").default("America/New_York"),
  language: text("language").default("en"),
  notificationPrefs: json("notification_prefs").default({
    email: true,
    workflowAlerts: true,
    leadNotifications: true,
    calendarReminders: true,
    marketingUpdates: false,
  }),
  plan: text("plan").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Auth payloads (client → server)
export const registerPayloadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  company: z.string().max(120).optional(),
}).strict();

export const loginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
}).strict();

export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
export type LoginPayload = z.infer<typeof loginPayloadSchema>;

export const usersRelations = relations(users, ({ many }) => ({
  workflows: many(workflows),
  leads: many(leads),
  emailTemplates: many(emailTemplates),
  meetings: many(meetings),
  integrations: many(integrations),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  company: true,
  plan: true,
});

// Whitelist of fields a user is allowed to modify on their own profile.
// Excludes: id, username, password, plan, stripe*, createdAt, updatedAt.
export const updateUserProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  company: z.string().max(120).nullable().optional(),
  timezone: z.string().max(60).optional(),
  language: z.string().max(10).optional(),
  notificationPrefs: z.object({
    email: z.boolean().optional(),
    workflowAlerts: z.boolean().optional(),
    leadNotifications: z.boolean().optional(),
    calendarReminders: z.boolean().optional(),
    marketingUpdates: z.boolean().optional(),
  }).partial().optional(),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Workflow Schema
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").notNull(),
  category: text("category").notNull(),
  status: text("status").default("draft").notNull(),
  actions: json("actions").notNull(),
  userId: integer("user_id").notNull(),
  triggerCount: integer("trigger_count").default(0),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowsRelations = relations(workflows, ({ one }) => ({
  user: one(users, {
    fields: [workflows.userId],
    references: [users.id],
  }),
}));

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Client-side payload schemas: userId is NEVER accepted from the client; the server forces it.
// `.strict()` makes Zod reject unknown keys (instead of silently stripping them) so any attempt to
// inject extra fields like `userId`, `id`, `createdAt`, etc. fails with 400.
export const createWorkflowPayloadSchema = insertWorkflowSchema.omit({ userId: true }).strict();
export const updateWorkflowPayloadSchema = insertWorkflowSchema.omit({ userId: true }).partial().strict();

// Lead Schema
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  status: text("status").default("cold").notNull(),
  tags: json("tags").default([]),
  lastContact: timestamp("last_contact"),
  notes: text("notes"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leadsRelations = relations(leads, ({ one }) => ({
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
}));

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createLeadPayloadSchema = insertLeadSchema.omit({ userId: true }).strict();
export const updateLeadPayloadSchema = insertLeadSchema.omit({ userId: true }).partial().strict();

// Email Template Schema
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").default("template").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  emails: integer("emails").default(1),
  userId: integer("user_id").notNull(),
  lastEdited: timestamp("last_edited").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  user: one(users, {
    fields: [emailTemplates.userId],
    references: [users.id],
  }),
}));

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  lastEdited: true,
  createdAt: true,
});

export const createEmailTemplatePayloadSchema = insertEmailTemplateSchema.omit({ userId: true }).strict();
export const updateEmailTemplatePayloadSchema = insertEmailTemplateSchema.omit({ userId: true }).partial().strict();

// Meeting Schema
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  attendees: integer("attendees").default(1),
  type: text("type").default("video").notNull(),
  link: text("link"),
  status: text("status").default("scheduled").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingsRelations = relations(meetings, ({ one }) => ({
  user: one(users, {
    fields: [meetings.userId],
    references: [users.id],
  }),
}));

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
});

export const createMeetingPayloadSchema = insertMeetingSchema
  .omit({ userId: true })
  .extend({
    // Allow ISO strings from JSON, coerce to Date.
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .strict();
export const updateMeetingPayloadSchema = insertMeetingSchema
  .omit({ userId: true })
  .extend({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .partial()
  .strict();

// Integration Schema
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  status: text("status").default("disconnected").notNull(),
  config: json("config").default({}),
  lastSync: timestamp("last_sync"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateIntegrationPayloadSchema = insertIntegrationSchema
  .omit({ userId: true })
  .partial()
  .strict();

// Webhooks Schema
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  active: boolean("active").default(true).notNull(),
  events: json("events").default([]).notNull(),
  secretKey: text("secret_key").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  user: one(users, { fields: [webhooks.userId], references: [users.id] }),
}));

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true, createdAt: true, secretKey: true,
});

export const createWebhookPayloadSchema = insertWebhookSchema.omit({ userId: true }).strict();
export const updateWebhookPayloadSchema = insertWebhookSchema.omit({ userId: true }).partial().strict();

export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

// Integration create payload (allow user to add new integrations)
export const createIntegrationPayloadSchema = insertIntegrationSchema.omit({ userId: true }).strict();

// Stripe checkout payload — caller provides only the plan code; everything else
// (price id, customer email, user id) is derived server-side.
export const createCheckoutSessionSchema = z.object({
  planCode: z.enum(["basic", "pro", "elite"]),
  interval: z.enum(["month", "year"]).default("month"),
}).strict();

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;
