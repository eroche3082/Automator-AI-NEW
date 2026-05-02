import React, { useState } from "react";
import { useN8nWorkflows, useDeleteN8nWorkflow, useActivateN8nWorkflow, useDeactivateN8nWorkflow } from "@/hooks/use-n8n-workflows";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranslatedText } from "@/components/ui/translated-text";
import { AlertCircle, Check, ExternalLink, Play, Square, Trash } from "lucide-react";
import { N8nWorkflow } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Componente de diálogo para configurar n8n
const SetupN8nDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("http://localhost:5678");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!url || !apiKey) {
      toast({
        title: "Error",
        description: "Please provide both URL and API key",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // En una implementación real, esto se enviaría al backend para almacenar la configuración
      // Por ahora simularemos que se guardó correctamente
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simular que estamos estableciendo las variables de entorno (en una implementación real)
      console.log("Saving n8n configuration:", { url, apiKey: "***" });
      
      toast({
        title: "Configuration saved",
        description: "The n8n configuration has been saved successfully.",
      });
      
      // Invalidar las consultas relacionadas con n8n para forzar una recarga
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/workflows'] });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <TranslatedText text="Configure n8n Connection" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <TranslatedText text="n8n Configuration" />
          </DialogTitle>
          <DialogDescription>
            <TranslatedText text="Configure the connection to your n8n instance. You need an n8n API key to connect to your n8n server." />
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="n8n-url" className="text-sm font-medium">
              <TranslatedText text="n8n URL" />
            </label>
            <input
              id="n8n-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded text-white"
              placeholder="http://localhost:5678"
            />
            <p className="text-xs text-gray-400">
              <TranslatedText text="The URL where your n8n instance is running, including http/https" />
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="n8n-api-key" className="text-sm font-medium">
              <TranslatedText text="n8n API Key" />
            </label>
            <input
              id="n8n-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-700 bg-gray-800 rounded text-white"
              placeholder="Enter your n8n API key"
            />
            <p className="text-xs text-gray-400">
              <TranslatedText text="You can find or create your API key in the n8n settings under 'API' tab" />
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                <TranslatedText text="Saving..." />
              </>
            ) : (
              <TranslatedText text="Save Configuration" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Componente de tarjeta de workflow
const WorkflowCard: React.FC<{ workflow: N8nWorkflow; onDelete: () => void }> = ({ workflow, onDelete }) => {
  const activateWorkflow = useActivateN8nWorkflow(workflow.id);
  const deactivateWorkflow = useDeactivateN8nWorkflow(workflow.id);
  const { toast } = useToast();

  const handleToggleActive = async () => {
    try {
      if (workflow.active) {
        await deactivateWorkflow.mutateAsync();
        toast({
          title: "Workflow deactivated",
          description: "The workflow has been deactivated successfully",
        });
      } else {
        await activateWorkflow.mutateAsync();
        toast({
          title: "Workflow activated",
          description: "The workflow has been activated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${workflow.active ? "deactivate" : "activate"} workflow`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{workflow.name}</CardTitle>
          <Badge variant={workflow.active ? "default" : "secondary"}>
            {workflow.active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardDescription>
          Created on {new Date(workflow.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          {`Nodes: ${workflow.nodes?.length || 0}`}
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleActive}
            disabled={activateWorkflow.isPending || deactivateWorkflow.isPending}
          >
            {activateWorkflow.isPending || deactivateWorkflow.isPending ? (
              <Skeleton className="h-4 w-4 mr-2" />
            ) : workflow.active ? (
              <Square className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {workflow.active ? "Deactivate" : "Activate"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <TranslatedText text="Are you sure you want to delete this workflow?" />
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <TranslatedText text="This action cannot be undone. This will permanently delete the workflow and all its configurations." />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <TranslatedText text="Cancel" />
                </AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  <TranslatedText text="Delete" />
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => window.open(`http://localhost:5678/workflow/${workflow.id}`, "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          <TranslatedText text="Edit" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const N8nIntegrationPage: React.FC = () => {
  const { data: workflows = [] as N8nWorkflow[], isLoading, error } = useN8nWorkflows();
  const deleteWorkflow = useDeleteN8nWorkflow();
  const { toast } = useToast();
  const [n8nUrl] = useState("http://localhost:5678");

  const handleOpenN8n = () => {
    window.open(n8nUrl, "_blank");
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await deleteWorkflow.mutateAsync(id);
      toast({
        title: "Workflow deleted",
        description: "The workflow has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-3xl font-bold">n8n Integration</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-red-500">
              <TranslatedText text="Error connecting to n8n" as="h2" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-red-500">
              <AlertCircle className="mr-2" />
              <TranslatedText text="Failed to fetch n8n workflows. Make sure n8n is running and the API key is correctly configured." />
            </div>
            <div className="mt-4">
              <TranslatedText text="If you don't have n8n installed yet, you can install it by following the instructions on the official website:" />
              <a 
                href="https://docs.n8n.io/hosting/installation/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center mt-2"
              >
                n8n Installation Documentation
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </CardContent>
          <CardFooter>
            <SetupN8nDialog />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          <TranslatedText text="n8n Integration" />
        </h1>
        <div className="flex gap-2">
          <SetupN8nDialog />
          <Button onClick={handleOpenN8n} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            <TranslatedText text="Open n8n Interface" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">
            <TranslatedText text="Workflows" />
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <TranslatedText text="Integrations" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="py-4">
          {workflows && workflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow: N8nWorkflow) => (
                <WorkflowCard 
                  key={workflow.id} 
                  workflow={workflow} 
                  onDelete={() => handleDeleteWorkflow(workflow.id)} 
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  <TranslatedText text="No workflows found" />
                </CardTitle>
                <CardDescription>
                  <TranslatedText text="You don't have any n8n workflows configured yet." />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TranslatedText text="Create your first workflow in n8n to get started. Once created, it will appear here and you can manage it through the AUTOMATOR AI interface." />
              </CardContent>
              <CardFooter>
                <Button onClick={handleOpenN8n}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <TranslatedText text="Open n8n to create workflows" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="integrations" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <TranslatedText text="Available Integrations" />
              </CardTitle>
              <CardDescription>
                <TranslatedText text="n8n provides hundreds of integrations with popular services and tools." />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                <TranslatedText text="With n8n, you can connect AUTOMATOR AI to services like:" />
              </p>
              <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {["Slack", "Gmail", "Google Sheets", "Airtable", "Trello", "GitHub", "GitLab", 
                  "Jira", "Notion", "Twitter", "Instagram", "Facebook", "LinkedIn", "Salesforce", 
                  "Hubspot", "Mailchimp", "Stripe", "PayPal", "AWS", "Google Cloud", "Azure", 
                  "Dropbox", "Google Drive", "OneDrive", "Zoom"].map((service) => (
                  <li key={service} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {service}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={handleOpenN8n}>
                <ExternalLink className="h-4 w-4 mr-2" />
                <TranslatedText text="Browse all n8n nodes" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default N8nIntegrationPage;