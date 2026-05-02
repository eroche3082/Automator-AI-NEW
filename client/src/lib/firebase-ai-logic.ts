import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel } from 'firebase/ai';
import { AIWelcomeMessage, AIEmailSuggestion, AIDocumentSuggestion } from './types';

// Firebase configuration - Credenciales reales para automator-ai
const firebaseConfig = {
  apiKey: "AIzaSyDjLW2v8BRyHnnMZC1rdG6Tp5T-Hbp80r4",
  authDomain: "automator-ai.firebaseapp.com",
  projectId: "automator-ai",
  storageBucket: "automator-ai.firebasestorage.app",
  messagingSenderId: "1095307761542",
  appId: "1:1095307761542:web:dfe732267c090630c03e07",
  measurementId: "G-04MT27TPBE"
};

class FirebaseAILogicService {
  private app: any;
  private aiLogic: any;
  private model: any;
  private isInitialized: boolean = false;

  constructor() {
    try {
      // Inicializar Firebase
      this.app = initializeApp(firebaseConfig);
      
      // Inicializar Firebase AI Logic
      this.aiLogic = getAI(this.app);
      
      // Obtener modelo generativo Gemini
      this.model = getGenerativeModel(this.aiLogic, { 
        model: "gemini-1.5-pro" 
      });
      
      this.isInitialized = true;
      console.log("Firebase AI Logic initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase AI Logic:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Generate welcome message with Firebase AI Logic
   */
  async generateWelcomeMessage(): Promise<AIWelcomeMessage> {
    try {
      if (!this.isInitialized || !this.model) {
        console.warn("Firebase AI Logic not initialized, falling back to API");
        return this.fallbackToAPI('/api/ai/welcome');
      }

      const prompt = "Generate a personalized welcome message for the user of an automation platform. Include information about active workflows, time saved, and a suggestion for improvement. Format the response as JSON with the following fields: greeting, activeWorkflows, timesSaved, suggestion.";
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      const jsonStr = text.substring(jsonStartIndex, jsonEndIndex + 1);
      
      const parsedData = JSON.parse(jsonStr);
      
      return {
        greeting: parsedData.greeting || "Welcome back!",
        activeWorkflows: parsedData.activeWorkflows || 12,
        timesSaved: parsedData.timesSaved || 4.5,
        suggestion: parsedData.suggestion || "Consider adding more automated workflows to save time."
      };
    } catch (error) {
      console.error("Error with Firebase AI Logic, falling back to API:", error);
      return this.fallbackToAPI('/api/ai/welcome');
    }
  }

  /**
   * Generate email suggestion with Firebase AI Logic
   */
  async generateEmailSuggestion(prompt: string): Promise<AIEmailSuggestion> {
    try {
      if (!this.isInitialized || !this.model) {
        console.warn("Firebase AI Logic not initialized, falling back to API");
        return this.fallbackToAPI('/api/ai/email-suggestion', { prompt });
      }

      const emailPrompt = `Generate a professional email ${prompt}. Make it concise, professional and actionable. Format the response as JSON with the following fields: subject, content.`;
      
      const result = await this.model.generateContent(emailPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      const jsonStr = text.substring(jsonStartIndex, jsonEndIndex + 1);
      
      const parsedData = JSON.parse(jsonStr);
      
      return {
        subject: parsedData.subject || "Follow-up from our meeting",
        content: parsedData.content || "Thank you for your time today..."
      };
    } catch (error) {
      console.error("Error with Firebase AI Logic, falling back to API:", error);
      return this.fallbackToAPI('/api/ai/email-suggestion', { prompt });
    }
  }

  /**
   * Generate document suggestion with Firebase AI Logic
   */
  async generateDocumentSuggestion(prompt: string, documentType: string): Promise<AIDocumentSuggestion> {
    try {
      if (!this.isInitialized || !this.model) {
        console.warn("Firebase AI Logic not initialized, falling back to API");
        return this.fallbackToAPI('/api/ai/document-suggestion', { prompt, documentType });
      }

      const docPrompt = `Generate a professional ${documentType} document for ${prompt}. Format the response as JSON with the following fields: title, content.`;
      
      const result = await this.model.generateContent(docPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      const jsonStr = text.substring(jsonStartIndex, jsonEndIndex + 1);
      
      const parsedData = JSON.parse(jsonStr);
      
      return {
        title: parsedData.title || `${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`,
        content: parsedData.content || "Document content will be generated here..."
      };
    } catch (error) {
      console.error("Error with Firebase AI Logic, falling back to API:", error);
      return this.fallbackToAPI('/api/ai/document-suggestion', { prompt, documentType });
    }
  }

  /**
   * Get workflow optimizations with Firebase AI Logic
   */
  async getWorkflowOptimizations(workflowId: number): Promise<string[] | null> {
    try {
      if (!this.isInitialized || !this.model) {
        console.warn("Firebase AI Logic not initialized, falling back to API");
        return this.fallbackToAPI(`/api/ai/workflow-optimize/${workflowId}`);
      }

      const prompt = `Analyze workflow with ID ${workflowId} and provide 3-5 optimization suggestions. Format the response as a JSON array of suggestion strings.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON array from response
      const jsonStartIndex = text.indexOf('[');
      const jsonEndIndex = text.lastIndexOf(']');
      const jsonStr = text.substring(jsonStartIndex, jsonEndIndex + 1);
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error with Firebase AI Logic, falling back to API:", error);
      return this.fallbackToAPI(`/api/ai/workflow-optimize/${workflowId}`);
    }
  }

  /**
   * Get lead insights with Firebase AI Logic
   */
  async getLeadInsights(leadId: number): Promise<string | null> {
    try {
      if (!this.isInitialized || !this.model) {
        console.warn("Firebase AI Logic not initialized, falling back to API");
        return this.fallbackToAPI(`/api/ai/lead-insights/${leadId}`);
      }

      const prompt = `Generate insights for lead with ID ${leadId}. Provide a single paragraph with actionable advice on how to approach this lead.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      console.error("Error with Firebase AI Logic, falling back to API:", error);
      return this.fallbackToAPI(`/api/ai/lead-insights/${leadId}`);
    }
  }

  /**
   * Fallback to backend API when Firebase AI Logic is not available
   */
  private async fallbackToAPI(endpoint: string, data?: any) {
    try {
      const method = data ? 'POST' : 'GET';
      const headers: any = {};
      let body: string | undefined = undefined;

      if (data) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API fallback failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const firebaseAILogicService = new FirebaseAILogicService();