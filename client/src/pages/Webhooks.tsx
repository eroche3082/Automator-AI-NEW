import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Plus, Trash, Globe, Link as LinkIcon, AlertCircle, Code, Lock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Webhook } from "@shared/schema";
import { createWebhookPayloadSchema } from "@shared/schema";

const EVENT_OPTIONS = ["lead.created", "lead.updated", "lead.deleted", "workflow.run", "meeting.scheduled", "payment.success", "payment.failed"];

const WebhooksPage: React.FC = () => {
  const { toast } = useToast();
  const [showSecretFor, setShowSecretFor] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: webhooks = [], isLoading, isError } = useQuery<Webhook[]>({ queryKey: ["/api/webhooks"] });

  const form = useForm({
    resolver: zodResolver(createWebhookPayloadSchema),
    defaultValues: { name: "", url: "", active: true, events: [] as string[] },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest({ url: "/api/webhooks", method: "POST", data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] }); toast({ title: "Webhook created" }); setShowDialog(false); form.reset(); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => apiRequest({ url: `/api/webhooks/${id}`, method: "PUT", data: { active } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] }); toast({ title: "Webhook updated" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest({ url: `/api/webhooks/${id}`, method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] }); toast({ title: "Webhook deleted" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  const renderWebhookCard = (w: Webhook) => (
    <Card key={w.id} className="bg-[#151515]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">{w.name}<Badge className="ml-2" variant={w.active ? "default" : "secondary"}>{w.active ? "Active" : "Inactive"}</Badge></CardTitle>
            <CardDescription>Created {new Date(w.createdAt).toLocaleDateString()}</CardDescription>
          </div>
          <Switch checked={w.active} onCheckedChange={() => toggleMutation.mutate({ id: w.id, active: !w.active })} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Webhook URL</h3>
          <div className="flex items-center">
            <div className="bg-gray-800 p-2 rounded flex-1 border border-gray-700 overflow-hidden"><code className="text-sm break-all">{w.url}</code></div>
            <Button variant="outline" size="sm" className="ml-2" onClick={() => copyToClipboard(w.url, "URL")}><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1">Secret Key</h3>
          <div className="flex items-center">
            <div className="bg-gray-800 p-2 rounded flex-1 border border-gray-700"><code className="text-sm break-all">{showSecretFor === w.id ? w.secretKey : "••••••••••••••••••••••••••••••••"}</code></div>
            <Button variant="outline" size="sm" className="ml-2" onClick={() => setShowSecretFor(showSecretFor === w.id ? null : w.id)}>{showSecretFor === w.id ? "Hide" : "Show"}</Button>
            <Button variant="outline" size="sm" className="ml-2" onClick={() => copyToClipboard(w.secretKey, "Secret")}><Copy className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Use this key to validate webhook payloads.</p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1">Events</h3>
          <div className="flex flex-wrap gap-2">
            {(w.events as string[])?.length === 0 && <span className="text-xs text-gray-400">No events subscribed</span>}
            {(w.events as string[])?.map(e => <Badge key={e} variant="secondary">{e}</Badge>)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-800 pt-4 flex justify-end">
        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(w.id)}><Trash className="h-4 w-4 mr-2" /> Delete</Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Create Webhook</Button>
      </div>

      {isError && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-sm text-red-300">
          Sign in with Google to manage your webhooks.
        </div>
      )}

      <Card className="bg-[#151515]">
        <CardHeader><CardTitle>About Webhooks</CardTitle><CardDescription>Webhooks allow external services to notify your AUTOMATOR AI instance when something happens.</CardDescription></CardHeader>
        <CardContent>
          <div className="bg-gray-800/50 p-4 rounded-lg flex items-start space-x-4">
            <AlertCircle className="mt-1 h-5 w-5 text-blue-400" />
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-3 rounded-lg"><div className="flex items-center"><Code className="h-5 w-5 mr-2 text-blue-400" /><span className="font-medium">Developer-Friendly</span></div><p className="text-sm text-gray-400 mt-1">Easy to integrate with HTTP POST.</p></div>
                <div className="bg-gray-900/50 p-3 rounded-lg"><div className="flex items-center"><Lock className="h-5 w-5 mr-2 text-blue-400" /><span className="font-medium">Signed Payloads</span></div><p className="text-sm text-gray-400 mt-1">Validate signatures with the secret key.</p></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading && <Skeleton className="h-32 bg-gray-800" />}
          {!isLoading && webhooks.filter(w => w.active).length === 0 && (
            <Card className="bg-[#151515] py-8">
              <CardContent className="flex flex-col items-center justify-center">
                <LinkIcon className="h-10 w-10 text-gray-500 mb-3" />
                <h3 className="text-xl font-medium mb-2">No Active Webhooks</h3>
                <p className="text-gray-400 text-center max-w-md mb-4">Create one or activate an existing webhook.</p>
                <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Create Webhook</Button>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 gap-4">{webhooks.filter(w => w.active).map(renderWebhookCard)}</div>
        </TabsContent>

        <TabsContent value="all">
          {isLoading && <Skeleton className="h-32 bg-gray-800" />}
          {!isLoading && webhooks.length === 0 && (
            <Card className="bg-[#151515] py-8">
              <CardContent className="flex flex-col items-center justify-center">
                <Globe className="h-10 w-10 text-gray-500 mb-3" />
                <h3 className="text-xl font-medium mb-2">No Webhooks Found</h3>
                <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Create Webhook</Button>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 gap-4">{webhooks.map(renderWebhookCard)}</div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#151515] border-gray-800">
          <DialogHeader><DialogTitle>Create Webhook</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem><FormLabel>URL</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" placeholder="https://example.com/webhook" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="events" render={({ field }) => (
                <FormItem>
                  <FormLabel>Events</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {EVENT_OPTIONS.map(ev => (
                      <label key={ev} className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded border border-gray-700 cursor-pointer">
                        <input type="checkbox" checked={field.value?.includes(ev)} onChange={e => {
                          const v = field.value || [];
                          field.onChange(e.target.checked ? [...v, ev] : v.filter((x: string) => x !== ev));
                        }} />
                        <span className="text-xs">{ev}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="gradient-btn" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhooksPage;
