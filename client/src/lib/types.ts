// User related types
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  company?: string;
  plan: "free" | "pro" | "enterprise";
  avatar?: string;
}

// Workflow types
export interface WorkflowAction {
  id: string;
  type: string;
  value: string;
  description: string;
}

export interface Workflow {
  id: number;
  name: string;
  description: string;
  trigger: string;
  category: string;
  status: "active" | "draft" | "archived";
  actions: WorkflowAction[];
  triggerCount?: number;
  lastRun?: string;
}

// CRM and Lead types
export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "hot" | "warm" | "cold" | "customer";
  tags: string[];
  lastContact?: string;
  notes?: string;
}

// Email types
export interface EmailTemplate {
  id: number;
  name: string;
  type: "template" | "automation";
  content: string;
  subject: string;
  emails?: number;
  lastEdited: string;
}

export interface Email {
  id: number;
  to: string;
  subject: string;
  content: string;
  status: "draft" | "sent" | "scheduled";
  sentAt?: Date;
  scheduledFor?: Date;
}

// Calendar types
export interface Meeting {
  id: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: number;
  type: "video" | "in-person" | "phone";
  link?: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface CalendarConnection {
  id: number;
  name: string;
  connected: boolean;
  lastSync?: string;
}

// Integration types
export interface Integration {
  id: number;
  name: string;
  icon: string;
  status: "connected" | "disconnected";
  lastSync?: string;
  description?: string;
}

// API response types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  status: "success" | "error";
}

// AI types
export interface AIWelcomeMessage {
  greeting: string;
  activeWorkflows: number;
  timesSaved: number;
  suggestion: string;
}

export interface AIEmailSuggestion {
  subject: string;
  content: string;
}

export interface AIDocumentSuggestion {
  title: string;
  content: string;
}

// n8n integration types
export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: any[];
  connections: Record<string, any>;
  staticData?: any;
  settings?: any;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  data: any;
}
