import { AIWelcomeMessage, AIEmailSuggestion, AIDocumentSuggestion } from './types';

class FirebaseAILogicService {
  private async callAPI(endpoint: string, data?: any) {
    const method = data ? 'POST' : 'GET';
    const headers: Record<string, string> = {};
    let body: string | undefined = undefined;

    if (data) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, { method, headers, body });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async generateWelcomeMessage(): Promise<AIWelcomeMessage> {
    return this.callAPI('/api/ai/welcome');
  }

  async generateEmailSuggestion(prompt: string): Promise<AIEmailSuggestion> {
    return this.callAPI('/api/ai/email-suggestion', { prompt });
  }

  async generateDocumentSuggestion(prompt: string, documentType: string): Promise<AIDocumentSuggestion> {
    return this.callAPI('/api/ai/document-suggestion', { prompt, documentType });
  }

  async getWorkflowOptimizations(workflowId: number): Promise<string[]> {
    const data = await this.callAPI(`/api/ai/workflow-optimize/${workflowId}`);
    return data.suggestions;
  }

  async getLeadInsights(leadId: number): Promise<string> {
    const data = await this.callAPI(`/api/ai/lead-insights/${leadId}`);
    return data.insights;
  }
}

export const firebaseAILogicService = new FirebaseAILogicService();
