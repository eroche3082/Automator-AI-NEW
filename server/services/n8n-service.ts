import axios from "axios";

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

class N8nService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Get environment variables for n8n configuration
    this.baseUrl = process.env.N8N_API_URL || "http://localhost:5678/api/v1";
    
    // Look for API key in various environment variables
    this.apiKey = process.env.N8N_API_KEY || 
                 process.env.N8N_AUTH_TOKEN || 
                 "";
    
    if (!this.apiKey) {
      console.warn("WARNING: No n8n API key found in environment variables");
    } else {
      console.log("n8n service initialized with API endpoint:", this.baseUrl);
    }
  }

  private getHeaders() {
    return {
      "X-N8N-API-KEY": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  /**
   * Get all workflows from n8n
   */
  async getWorkflows(): Promise<N8nWorkflow[]> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return [];
      }

      const response = await axios.get(`${this.baseUrl}/workflows`, {
        headers: this.getHeaders(),
      });

      return response.data.data as N8nWorkflow[];
    } catch (error) {
      console.error("Error fetching n8n workflows:", error);
      return [];
    }
  }

  /**
   * Get a specific workflow by ID
   */
  async getWorkflow(id: string): Promise<N8nWorkflow | null> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/workflows/${id}`, {
        headers: this.getHeaders(),
      });

      return response.data as N8nWorkflow;
    } catch (error) {
      console.error(`Error fetching n8n workflow ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflowData: Partial<N8nWorkflow>): Promise<N8nWorkflow | null> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return null;
      }

      const response = await axios.post(
        `${this.baseUrl}/workflows`,
        workflowData,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data as N8nWorkflow;
    } catch (error) {
      console.error("Error creating n8n workflow:", error);
      return null;
    }
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(id: string, workflowData: Partial<N8nWorkflow>): Promise<N8nWorkflow | null> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return null;
      }

      const response = await axios.patch(
        `${this.baseUrl}/workflows/${id}`,
        workflowData,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data as N8nWorkflow;
    } catch (error) {
      console.error(`Error updating n8n workflow ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return false;
      }

      await axios.delete(`${this.baseUrl}/workflows/${id}`, {
        headers: this.getHeaders(),
      });

      return true;
    } catch (error) {
      console.error(`Error deleting n8n workflow ${id}:`, error);
      return false;
    }
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(id: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return false;
      }

      await axios.post(
        `${this.baseUrl}/workflows/${id}/activate`,
        {},
        {
          headers: this.getHeaders(),
        }
      );

      return true;
    } catch (error) {
      console.error(`Error activating n8n workflow ${id}:`, error);
      return false;
    }
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(id: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return false;
      }

      await axios.post(
        `${this.baseUrl}/workflows/${id}/deactivate`,
        {},
        {
          headers: this.getHeaders(),
        }
      );

      return true;
    } catch (error) {
      console.error(`Error deactivating n8n workflow ${id}:`, error);
      return false;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(id: string, data: any = {}): Promise<N8nExecution | null> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return null;
      }

      const response = await axios.post(
        `${this.baseUrl}/workflows/${id}/execute`,
        { data },
        {
          headers: this.getHeaders(),
        }
      );

      return response.data as N8nExecution;
    } catch (error) {
      console.error(`Error executing n8n workflow ${id}:`, error);
      return null;
    }
  }

  /**
   * Get workflow executions
   */
  async getExecutions(workflowId?: string, limit = 20): Promise<N8nExecution[]> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return [];
      }

      let url = `${this.baseUrl}/executions?limit=${limit}`;
      if (workflowId) {
        url += `&workflowId=${workflowId}`;
      }

      const response = await axios.get(url, {
        headers: this.getHeaders(),
      });

      return response.data.data as N8nExecution[];
    } catch (error) {
      console.error("Error fetching n8n executions:", error);
      return [];
    }
  }

  /**
   * Get all credentials
   */
  async getCredentials(): Promise<N8nCredential[]> {
    try {
      if (!this.apiKey) {
        console.warn("No N8N API key provided");
        return [];
      }

      const response = await axios.get(`${this.baseUrl}/credentials`, {
        headers: this.getHeaders(),
      });

      return response.data.data as N8nCredential[];
    } catch (error) {
      console.error("Error fetching n8n credentials:", error);
      return [];
    }
  }
}

export const n8nService = new N8nService();