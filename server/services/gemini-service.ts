import { AIWelcomeMessage, AIEmailSuggestion, AIDocumentSuggestion } from "../../client/src/lib/types";
import axios from "axios";

// Define compatible interfaces for database types
export interface Workflow {
  id: number;
  name: string;
  description?: string;
  trigger: string;
  category: string;
  status: string;
  actions: any;
  userId: number;
  triggerCount?: number;
  lastRun?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: string;
  tags: any;
  lastContact?: Date | null;
  notes?: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

class GeminiService {
  private isInitialized: boolean = false;
  private apiKey: string | undefined;

  constructor() {
    // Check for multiple API key environment variables
    this.apiKey = process.env.GOOGLE_GENAI_API_KEY || 
                  process.env.GOOGLE_AI_API_KEY || 
                  process.env.GEMINI_API_KEY ||
                  process.env.GOOGLE_API_KEY ||
                  process.env.GOOGLE_GROUP2_API_KEY;

    if (this.apiKey) {
      console.log("✅ Google AI API Key found, Gemini service ready");
      this.isInitialized = true;
    } else {
      console.error("❌ Google AI API Key not found. Please add it to environment variables.");
      this.isInitialized = false;
    }
  }

  /**
   * Generate content using direct API key
   */
  private async generateWithDirectAPI(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || 
                  process.env.GOOGLE_AI_API_KEY || 
                  process.env.GEMINI_API_KEY ||
                  process.env.GOOGLE_API_KEY ||
                  process.env.GOOGLE_GROUP2_API_KEY;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500,
        }
      }
    );

    return response.data.candidates[0]?.content?.parts[0]?.text || "";
  }

  /**
   * Generate welcome message with Gemini API
   */
  async generateWelcomeMessage(): Promise<AIWelcomeMessage> {
    try {
      if (!this.isInitialized) {
        console.warn("Google AI API Key not found, returning mock data");
        return this.getMockWelcomeMessage();
      }

      console.log("🔑 Using Google AI API Key for welcome message");
      const prompt = "Generate a personalized welcome message for the user of an automation platform. Include information about active workflows, time saved, and a suggestion for improvement. Format the response as JSON with the following fields: greeting, activeWorkflows, timesSaved, suggestion.";
      const textContent = await this.generateWithDirectAPI(prompt);

      if (!textContent) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from the text content
      const jsonStartIndex = textContent.indexOf('{');
      const jsonEndIndex = textContent.lastIndexOf('}');
      const jsonStr = textContent.substring(jsonStartIndex, jsonEndIndex + 1);

      const parsedData = JSON.parse(jsonStr);

      return {
        greeting: parsedData.greeting || "Welcome back!",
        activeWorkflows: parsedData.activeWorkflows || 12,
        timesSaved: parsedData.timesSaved || "4.5 hours",
        suggestion: parsedData.suggestion || "Consider adding more automated workflows to save time."
      };
    } catch (error) {
      console.error("Error generating welcome message with Gemini API:", error);
      return this.getMockWelcomeMessage();
    }
  }

  /**
   * Generate email suggestion with Gemini API
   */
  async generateEmailSuggestion(prompt: string): Promise<AIEmailSuggestion> {
    try {
      if (!this.isInitialized) {
        console.warn("Google AI API Key not found, returning mock data");
        return this.getMockEmailSuggestion();
      }

      const emailPrompt = `Generate a professional email ${prompt}. Make it concise, professional and actionable. Format the response as JSON with the following fields: subject, content.`;
      const textContent = await this.generateWithDirectAPI(emailPrompt);

      if (!textContent) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from the text content
      const jsonStartIndex = textContent.indexOf('{');
      const jsonEndIndex = textContent.lastIndexOf('}');
      const jsonStr = textContent.substring(jsonStartIndex, jsonEndIndex + 1);

      const parsedData = JSON.parse(jsonStr);

      return {
        subject: parsedData.subject || "Follow-up from our meeting",
        content: parsedData.content || "Thank you for your time today..."
      };
    } catch (error) {
      console.error("Error generating email suggestion with Gemini API:", error);
      return this.getMockEmailSuggestion();
    }
  }

  /**
   * Generate document suggestion with Gemini API
   */
  async generateDocumentSuggestion(prompt: string, documentType: string): Promise<AIDocumentSuggestion> {
    try {
      if (!this.isInitialized) {
        console.warn("Google AI API Key not found, returning mock data");
        return this.getMockDocumentSuggestion();
      }

      const docPrompt = `Generate a professional ${documentType} document for ${prompt}. Format the response as JSON with the following fields: title, content.`;
      const textContent = await this.generateWithDirectAPI(docPrompt);

      if (!textContent) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from the text content
      const jsonStartIndex = textContent.indexOf('{');
      const jsonEndIndex = textContent.lastIndexOf('}');
      const jsonStr = textContent.substring(jsonStartIndex, jsonEndIndex + 1);

      const parsedData = JSON.parse(jsonStr);

      return {
        title: parsedData.title || `${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`,
        content: parsedData.content || "Document content will be generated here..."
      };
    } catch (error) {
      console.error("Error generating document suggestion with Gemini API:", error);
      return this.getMockDocumentSuggestion();
    }
  }

  /**
   * Optimize workflow with Gemini API
   */
  async optimizeWorkflow(workflow: Workflow): Promise<string[]> {
    try {
      if (!this.isInitialized) {
        console.warn("Google AI API Key not found, returning mock data");
        return ["Add more conditional logic to handle edge cases", "Consider adding a delay between email actions", "Add error handling for failed API calls"];
      }

      const workflowPrompt = `Analyze this workflow and provide 3-5 optimization suggestions: ${JSON.stringify(workflow)}. Format the response as a JSON array of suggestion strings.`;
      const textContent = await this.generateWithDirectAPI(workflowPrompt);

      if (!textContent) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from the text content
      const jsonStartIndex = textContent.indexOf('[');
      const jsonEndIndex = textContent.lastIndexOf(']');
      const jsonStr = textContent.substring(jsonStartIndex, jsonEndIndex + 1);

      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error optimizing workflow with Gemini API:", error);
      return ["Add more conditional logic to handle edge cases", "Consider adding a delay between email actions", "Add error handling for failed API calls"];
    }
  }

  /**
   * Generate lead insights with Gemini API
   */
  async generateLeadInsights(lead: Lead): Promise<string> {
    try {
      if (!this.isInitialized) {
        console.warn("Google AI API Key not found, returning mock data");
        return "This lead has shown interest in your premium features. Consider scheduling a demo call to showcase the benefits of your product.";
      }

      const leadPrompt = `Generate insights for this lead: ${JSON.stringify(lead)}. Provide a single paragraph with actionable advice on how to approach this lead.`;
      const textContent = await this.generateWithDirectAPI(leadPrompt);

      if (!textContent) {
        throw new Error("No response from Gemini API");
      }

      return textContent.trim();
    } catch (error) {
      console.error("Error generating lead insights with Gemini API:", error);
      return "This lead has shown interest in your premium features. Consider scheduling a demo call to showcase the benefits of your product.";
    }
  }

  // Mock data methods for fallback

  private getMockWelcomeMessage(): AIWelcomeMessage {
    return {
      greeting: "Welcome back to your automation hub!",
      activeWorkflows: 12,
      timesSaved: 4.5,
      suggestion: "Try connecting your calendar to automate meeting reminders and save even more time."
    };
  }

  private getMockEmailSuggestion(): AIEmailSuggestion {
    return {
      subject: "Follow-up from our meeting today",
      content: `Dear [Client],

Thank you for taking the time to meet with me today. I appreciated the opportunity to discuss how our automation solutions can help streamline your business processes.

As promised, I'm sending over the additional information about our workflow automation features. Our platform can help you save up to 15 hours per week by automating repetitive tasks and integrating with your existing tools.

I'd love to schedule a demo to show you these features in action. Would you be available for a 30-minute call next Tuesday or Wednesday?

Looking forward to your response.

Best regards,
[Your Name]`
    };
  }

  private getMockDocumentSuggestion(): AIDocumentSuggestion {
    return {
      title: "Business Automation Proposal",
      content: `# Business Automation Proposal

## Executive Summary
This proposal outlines a comprehensive automation strategy designed to optimize your business operations, reduce manual workload, and increase overall productivity.

## Current Challenges
- Time-consuming manual processes
- Inconsistent data entry
- Delayed follow-ups with clients
- Limited visibility into business metrics

## Proposed Solution
Our automation platform will address these challenges through:

1. **Workflow Automation**
   - Trigger-based actions
   - Conditional logic
   - Multi-step processes

2. **CRM Integration**
   - Automatic lead capture
   - Prospect scoring
   - Follow-up sequences

3. **Document Generation**
   - Template-based proposals
   - Dynamically populated contracts
   - E-signature integration

## Implementation Timeline
- Week 1: System setup and configuration
- Week 2: Data migration and integration
- Week 3: User training and workflow setup
- Week 4: Testing and optimization

## Investment
- Setup fee: $X,XXX
- Monthly subscription: $XXX/month
- ROI expected within 3 months

## Next Steps
1. Review proposal
2. Schedule implementation call
3. Begin onboarding process

We look forward to helping your business achieve new levels of efficiency through intelligent automation.`
    };
  }
}

export const geminiService = new GeminiService();