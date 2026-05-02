import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash, RefreshCcw, Link as LinkIcon, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Integration } from "@shared/schema";
import { createIntegrationPayloadSchema } from "@shared/schema";
import { SiZapier, SiGooglesheets, SiSlack, SiAirtable, SiTwilio, SiMailchimp, SiStripe, SiZoom, SiHubspot, SiShopify } from "react-icons/si";
import { BsMicrosoftTeams } from "react-icons/bs";

const POPULAR = [
  { id: "slack", name: "Slack", icon: "slack", desc: "Send channel notifications", logo: <SiSlack className="h-10 w-10 text-[#4A154B]" /> },
  { id: "googlesheets", name: "Google Sheets", icon: "googlesheets", desc: "Sync rows to Sheets", logo: <SiGooglesheets className="h-10 w-10 text-[#0F9D58]" /> },
  { id: "zapier", name: "Zapier", icon: "zapier", desc: "Trigger Zaps", logo: <SiZapier className="h-10 w-10 text-[#FF4A00]" /> },
  { id: "msteams", name: "Microsoft Teams", icon: "msteams", desc: "Post to Teams", logo: <BsMicrosoftTeams className="h-10 w-10 text-[#6264A7]" /> },
  { id: "airtable", name: "Airtable", icon: "airtable", desc: "Sync with Airtable bases", logo: <SiAirtable className="h-10 w-10 text-[#F82B60]" /> },
  { id: "twilio", name: "Twilio", icon: "twilio", desc: "Send SMS / WhatsApp", logo: <SiTwilio className="h-10 w-10 text-[#F22F46]" /> },
  { id: "mailchimp", name: "Mailchimp", icon: "mailchimp", desc: "Email campaigns", logo: <SiMailchimp className="h-10 w-10 text-[#FFE01B]" /> },
  { id: "stripe", name: "Stripe", icon: "stripe", desc: "Payments", logo: <SiStripe className="h-10 w-10 text-[#008CDD]" /> },
  { id: "zoom", name: "Zoom", icon: "zoom", desc: "Video meetings", logo: <SiZoom className="h-10 w-10 text-[#2D8CFF]" /> },
  { id: "hubspot", name: "HubSpot", icon: "hubspot", desc: "CRM sync", logo: <SiHubspot className="h-10 w-10 text-[#FF7A59]" /> },
  { id: "shopify", name: "Shopify", icon: "shopify", desc: "E-commerce", logo: <SiShopify className="h-10 w-10 text-[#7AB55C]" /> },
];

const ConnectionsPage: React.FC = () => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);

  const { data: integrations = [], isLoading, isError } = useQuery<Integration[]>({ queryKey: ["/api/integrations"] });

  const form = useForm({
    resolver: zodResolver(createIntegrationPayloadSchema),
    defaultValues: { name: "", icon: "", status: "disconnected", config: {} },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest({ url: "/api/integrations", method: "POST", data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integrations"] }); toast({ title: "Connection added" }); setShowDialog(false); form.reset(); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => apiRequest({ url: `/api/integrations/${id}`, method: "PUT", data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integrations"] }); toast({ title: "Connection updated" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest({ url: `/api/integrations/${id}`, method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/integrations"] }); toast({ title: "Connection removed" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const handleSync = (id: number) => updateMutation.mutate({ id, data: { lastSync: new Date().toISOString() } as any });
  const handleToggle = (i: Integration) => updateMutation.mutate({ id: i.id, data: { status: i.status === "connected" ? "disconnected" : "connected" } });

  const quickConnect = (svc: { id: string; name: string; icon: string }) => {
    createMutation.mutate({ name: svc.name, icon: svc.icon, status: "connected", config: {} });
  };

  const findLogo = (icon: string) => POPULAR.find(p => p.icon === icon)?.logo || <LinkIcon className="h-5 w-5 text-gray-400" />;
  const connectedIds = new Set(integrations.map(i => i.icon));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Connections</h1>
        <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add Connection</Button>
      </div>

      {isError && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-sm text-red-300">
          Sign in with Google to manage your connections.
        </div>
      )}

      <Card className="bg-[#151515]">
        <CardHeader>
          <CardTitle>Connection Hub</CardTitle>
          <CardDescription>Integrate AUTOMATOR AI with external services and applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-800/50 p-4 rounded-lg flex items-start space-x-4">
            <AlertCircle className="mt-1 h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-medium">About connections</h3>
              <p className="text-sm text-gray-400 mt-1">Connecting external services lets workflows trigger actions across multiple platforms.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="current">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Your Connections</TabsTrigger>
          <TabsTrigger value="popular">Add Service</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {isLoading && <Skeleton className="h-32 bg-gray-800" />}
          {!isLoading && integrations.length === 0 && (
            <Card className="bg-[#151515] py-8">
              <CardContent className="flex flex-col items-center justify-center">
                <LinkIcon className="h-10 w-10 text-gray-500 mb-3" />
                <h3 className="text-xl font-medium mb-2">No Connections</h3>
                <p className="text-gray-400 text-center max-w-md mb-4">Add a connection to integrate with other platforms.</p>
                <Button onClick={() => setShowDialog(true)}><Plus className="mr-2 h-4 w-4" /> Add Connection</Button>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 gap-4">
            {integrations.map(c => (
              <Card key={c.id} className="bg-[#151515]">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">{findLogo(c.icon)}</div>
                      <div>
                        <CardTitle className="flex items-center">
                          {c.name}
                          <Badge className="ml-2" variant={c.status === "connected" ? "default" : c.status === "error" ? "destructive" : "secondary"}>{c.status}</Badge>
                        </CardTitle>
                        <CardDescription>{c.lastSync ? `Last synced: ${new Date(c.lastSync).toLocaleString()}` : "Never synced"}</CardDescription>
                      </div>
                    </div>
                    {c.status === "connected" ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-gray-500" />}
                  </div>
                </CardHeader>
                <CardFooter className="border-t border-gray-800 pt-4 flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleSync(c.id)} disabled={c.status !== "connected" || updateMutation.isPending}>
                      <RefreshCcw className="h-4 w-4 mr-2" /> Sync
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggle(c)} disabled={updateMutation.isPending}>
                      {c.status === "connected" ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(c.id)} disabled={deleteMutation.isPending}>
                    <Trash className="h-4 w-4 mr-2" /> Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR.map(svc => {
              const already = connectedIds.has(svc.icon);
              return (
                <Card key={svc.id} className="bg-[#151515]">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-3">{svc.logo}</div>
                      <CardTitle className="flex items-center">{svc.name}{already && <Badge className="ml-2">Added</Badge>}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent><p className="text-sm text-gray-400">{svc.desc}</p></CardContent>
                  <CardFooter className="pt-2">
                    <Button className="w-full" disabled={already || createMutation.isPending} onClick={() => quickConnect(svc)}>
                      <LinkIcon className="h-4 w-4 mr-2" /> {already ? "Already added" : "Connect"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#151515] border-gray-800">
          <DialogHeader><DialogTitle>Add Custom Connection</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="icon" render={({ field }) => (
                <FormItem><FormLabel>Icon ID</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" placeholder="e.g. slack, custom" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="gradient-btn" disabled={createMutation.isPending}>{createMutation.isPending ? "Adding..." : "Add"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectionsPage;
