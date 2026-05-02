import { firebaseAILogicService } from "./firebase-ai-logic";
import { apiRequest } from "./queryClient";
import { AIWelcomeMessage, AIEmailSuggestion, AIDocumentSuggestion } from "./types";

/**
 * Fetch an AI-generated welcome message for the dashboard
 * Uses Firebase AI Logic first, falls back to backend API
 */
export async function getAIWelcomeMessage(): Promise<AIWelcomeMessage | null> {
  try {
    // Try Firebase AI Logic first
    return await firebaseAILogicService.generateWelcomeMessage();
  } catch (error) {
    console.error("Error with Firebase AI Logic, trying backend API:", error);
    try {
      // Fallback to backend API
      const data = await apiRequest<AIWelcomeMessage>({ url: "/api/ai/welcome", method: "GET" });
      return data;
    } catch (apiError) {
      console.error("Backend API also failed:", apiError);
      return null;
    }
  }
}

/**
 * Get AI-generated email content suggestion
 * Uses Firebase AI Logic first, falls back to backend API
 * @param prompt The prompt or context for the email suggestion
 */
export async function getAIEmailSuggestion(prompt: string): Promise<AIEmailSuggestion | null> {
  try {
    // Try Firebase AI Logic first
    return await firebaseAILogicService.generateEmailSuggestion(prompt);
  } catch (error) {
    console.error("Error with Firebase AI Logic, trying backend API:", error);
    try {
      // Fallback to backend API
      const data = await apiRequest<AIEmailSuggestion>({ url: "/api/ai/email-suggestion", method: "POST", data: { prompt } });
      return data;
    } catch (apiError) {
      console.error("Backend API also failed:", apiError);
      return null;
    }
  }
}

/**
 * Get AI-generated document content suggestion
 * Uses Firebase AI Logic first, falls back to backend API
 * @param prompt The prompt or context for the document suggestion
 * @param documentType The type of document to generate (proposal, contract, etc.)
 */
export async function getAIDocumentSuggestion(
  prompt: string,
  documentType: string
): Promise<AIDocumentSuggestion | null> {
  try {
    // Try Firebase AI Logic first
    return await firebaseAILogicService.generateDocumentSuggestion(prompt, documentType);
  } catch (error) {
    console.error("Error with Firebase AI Logic, trying backend API:", error);
    try {
      // Fallback to backend API
      const data = await apiRequest<AIDocumentSuggestion>({ url: "/api/ai/document-suggestion", method: "POST", data: { prompt, documentType } });
      return data;
    } catch (apiError) {
      console.error("Backend API also failed:", apiError);
      return null;
    }
  }
}

/**
 * Get AI-generated workflow optimization suggestions
 * Uses Firebase AI Logic first, falls back to backend API
 * @param workflowId The ID of the workflow to optimize
 */
export async function getWorkflowOptimizations(workflowId: number): Promise<string[] | null> {
  try {
    // Try Firebase AI Logic first
    return await firebaseAILogicService.getWorkflowOptimizations(workflowId);
  } catch (error) {
    console.error("Error with Firebase AI Logic, trying backend API:", error);
    try {
      // Fallback to backend API
      const data = await apiRequest<{ suggestions: string[] }>({ url: `/api/ai/workflow-optimize/${workflowId}`, method: "GET" });
      return data.suggestions;
    } catch (apiError) {
      console.error("Backend API also failed:", apiError);
      return null;
    }
  }
}

/**
 * Get AI-generated lead insights
 * Uses Firebase AI Logic first, falls back to backend API
 * @param leadId The ID of the lead to analyze
 */
export async function getLeadInsights(leadId: number): Promise<string | null> {
  try {
    // Try Firebase AI Logic first
    return await firebaseAILogicService.getLeadInsights(leadId);
  } catch (error) {
    console.error("Error with Firebase AI Logic, trying backend API:", error);
    try {
      // Fallback to backend API
      const data = await apiRequest<{ insights: string }>({ url: `/api/ai/lead-insights/${leadId}`, method: "GET" });
      return data.insights;
    } catch (apiError) {
      console.error("Backend API also failed:", apiError);
      return null;
    }
  }
}
