import { apiRequest } from "./queryClient";
import { AIWelcomeMessage, AIEmailSuggestion, AIDocumentSuggestion } from "./types";

export async function getAIWelcomeMessage(): Promise<AIWelcomeMessage | null> {
  try {
    return await apiRequest<AIWelcomeMessage>({ url: "/api/ai/welcome", method: "GET" });
  } catch (error) {
    console.error("Failed to fetch AI welcome message:", error);
    return null;
  }
}

export async function getAIEmailSuggestion(prompt: string): Promise<AIEmailSuggestion | null> {
  try {
    return await apiRequest<AIEmailSuggestion>({ url: "/api/ai/email-suggestion", method: "POST", data: { prompt } });
  } catch (error) {
    console.error("Failed to fetch AI email suggestion:", error);
    return null;
  }
}

export async function getAIDocumentSuggestion(prompt: string, documentType: string): Promise<AIDocumentSuggestion | null> {
  try {
    return await apiRequest<AIDocumentSuggestion>({ url: "/api/ai/document-suggestion", method: "POST", data: { prompt, documentType } });
  } catch (error) {
    console.error("Failed to fetch AI document suggestion:", error);
    return null;
  }
}

export async function getWorkflowOptimizations(workflowId: number): Promise<string[] | null> {
  try {
    const data = await apiRequest<{ suggestions: string[] }>({ url: `/api/ai/workflow-optimize/${workflowId}`, method: "GET" });
    return data.suggestions;
  } catch (error) {
    console.error("Failed to fetch workflow optimizations:", error);
    return null;
  }
}

export async function getLeadInsights(leadId: number): Promise<string | null> {
  try {
    const data = await apiRequest<{ insights: string }>({ url: `/api/ai/lead-insights/${leadId}`, method: "GET" });
    return data.insights;
  } catch (error) {
    console.error("Failed to fetch lead insights:", error);
    return null;
  }
}
