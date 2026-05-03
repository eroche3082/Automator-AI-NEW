import { 
  users, type User, type InsertUser,
  workflows, type Workflow, type InsertWorkflow,
  leads, type Lead, type InsertLead,
  emailTemplates, type EmailTemplate, type InsertEmailTemplate,
  meetings, type Meeting, type InsertMeeting,
  integrations, type Integration, type InsertIntegration,
  webhooks, type Webhook, type InsertWebhook
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateUserByStripeCustomerId(customerId: string, data: Partial<User>): Promise<User | undefined>;
  countLeads(userId: number): Promise<number>;
  countWorkflows(userId: number, status?: string): Promise<number>;
  countUpcomingMeetings(userId: number, fromDate: Date): Promise<number>;
  getRecentActivity(userId: number, limit: number): Promise<Array<{ type: string; timestamp: Date; details: string }>>;
  getWorkflowsByUserId(userId: number): Promise<Workflow[]>;
  getLeadsByUserId(userId: number): Promise<Lead[]>;
  getEmailTemplatesByUserId(userId: number): Promise<EmailTemplate[]>;
  getMeetingsByUserId(userId: number): Promise<Meeting[]>;
  getIntegrationsByUserId(userId: number): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  
  // Workflow operations
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  
  // Lead operations
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  
  // Email Template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  
  // Meeting operations
  getMeetings(): Promise<Meeting[]>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;
  
  // Integration operations
  getIntegrations(): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: number): Promise<boolean>;

  // Webhook operations
  getWebhooksByUserId(userId: number): Promise<Webhook[]>;
  getWebhook(id: number): Promise<Webhook | undefined>;
  createWebhook(webhook: InsertWebhook & { secretKey: string }): Promise<Webhook>;
  updateWebhook(id: number, webhook: Partial<InsertWebhook>): Promise<Webhook | undefined>;
  deleteWebhook(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserByStripeCustomerId(customerId: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.stripeCustomerId, customerId))
      .returning();
    return updated;
  }

  async countLeads(userId: number): Promise<number> {
    const result = await db.select().from(leads).where(eq(leads.userId, userId));
    return result.length;
  }

  async countWorkflows(userId: number, status?: string): Promise<number> {
    const all = await db.select().from(workflows).where(eq(workflows.userId, userId));
    return status ? all.filter(w => w.status === status).length : all.length;
  }

  async countUpcomingMeetings(userId: number, fromDate: Date): Promise<number> {
    const all = await db.select().from(meetings).where(eq(meetings.userId, userId));
    return all.filter(m => m.startTime >= fromDate).length;
  }

  async getRecentActivity(userId: number, limit: number): Promise<Array<{ type: string; timestamp: Date; details: string }>> {
    const recentLeads = await db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt)).limit(limit);
    const recentWorkflows = await db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.updatedAt)).limit(limit);
    const recentMeetings = await db.select().from(meetings).where(eq(meetings.userId, userId)).orderBy(desc(meetings.createdAt)).limit(limit);

    const activity = [
      ...recentLeads.map(l => ({ type: "Lead Created", timestamp: l.createdAt, details: `New lead: ${l.name}` })),
      ...recentWorkflows.map(w => ({ type: "Workflow Updated", timestamp: w.updatedAt, details: w.name })),
      ...recentMeetings.map(m => ({ type: "Meeting Scheduled", timestamp: m.createdAt, details: m.title })),
    ];

    return activity
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getWorkflowsByUserId(userId: number): Promise<Workflow[]> {
    return await db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.updatedAt));
  }

  async getLeadsByUserId(userId: number): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
  }

  async getEmailTemplatesByUserId(userId: number): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId));
  }

  async getMeetingsByUserId(userId: number): Promise<Meeting[]> {
    return await db.select().from(meetings).where(eq(meetings.userId, userId)).orderBy(desc(meetings.startTime));
  }

  async getIntegrationsByUserId(userId: number): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  // Workflow operations
  async getWorkflows(): Promise<Workflow[]> {
    return await db.select().from(workflows).orderBy(desc(workflows.updatedAt));
  }
  
  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }
  
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows).values(workflow).returning();
    return newWorkflow;
  }
  
  async updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [updatedWorkflow] = await db
      .update(workflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return updatedWorkflow;
  }
  
  async deleteWorkflow(id: number): Promise<boolean> {
    const result = await db.delete(workflows).where(eq(workflows.id, id));
    return !!result;
  }
  
  // Lead operations
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.updatedAt));
  }
  
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }
  
  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }
  
  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return !!result;
  }
  
  // Email Template operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.lastEdited));
  }
  
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }
  
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db.update(emailTemplates).set({ ...template, lastEdited: new Date() }).where(eq(emailTemplates.id, id)).returning();
    return updated;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Meeting operations
  async getMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings).orderBy(desc(meetings.startTime));
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [m] = await db.select().from(meetings).where(eq(meetings.id, id));
    return m;
  }
  
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async updateMeeting(id: number, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const [updated] = await db.update(meetings).set(meeting).where(eq(meetings.id, id)).returning();
    return updated;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    const result = await db.delete(meetings).where(eq(meetings.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Integration operations
  async getIntegrations(): Promise<Integration[]> {
    return await db.select().from(integrations);
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    const [row] = await db.select().from(integrations).where(eq(integrations.id, id));
    return row;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [created] = await db.insert(integrations).values(integration).returning();
    return created;
  }
  
  async updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [updatedIntegration] = await db
      .update(integrations)
      .set({ ...integration, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updatedIntegration;
  }

  async deleteIntegration(id: number): Promise<boolean> {
    const result = await db.delete(integrations).where(eq(integrations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Webhook operations
  async getWebhooksByUserId(userId: number): Promise<Webhook[]> {
    return await db.select().from(webhooks).where(eq(webhooks.userId, userId)).orderBy(desc(webhooks.createdAt));
  }

  async getWebhook(id: number): Promise<Webhook | undefined> {
    const [w] = await db.select().from(webhooks).where(eq(webhooks.id, id));
    return w;
  }

  async createWebhook(webhook: InsertWebhook & { secretKey: string }): Promise<Webhook> {
    const [created] = await db.insert(webhooks).values(webhook).returning();
    return created;
  }

  async updateWebhook(id: number, webhook: Partial<InsertWebhook>): Promise<Webhook | undefined> {
    const [updated] = await db.update(webhooks).set(webhook).where(eq(webhooks.id, id)).returning();
    return updated;
  }

  async deleteWebhook(id: number): Promise<boolean> {
    const result = await db.delete(webhooks).where(eq(webhooks.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
