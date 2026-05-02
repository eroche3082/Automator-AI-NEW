import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Filter, MoreVertical, Workflow as WorkflowIcon, Mail, Calendar, FileText, Trash2, Power } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workflow } from "@shared/schema";
import { createWorkflowPayloadSchema } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const categoryIcon = (cat: string) => {
  if (cat.toLowerCase().includes("email")) return { Icon: Mail, color: "text-[#0047FF]", bg: "bg-[#0047FF]/10" };
  if (cat.toLowerCase().includes("calendar") || cat.toLowerCase().includes("meeting")) return { Icon: Calendar, color: "text-[#D100FF]", bg: "bg-[#D100FF]/10" };
  if (cat.toLowerCase().includes("document")) return { Icon: FileText, color: "text-[#FF3E3E]", bg: "bg-[#FF3E3E]/10" };
  return { Icon: WorkflowIcon, color: "text-amber-500", bg: "bg-amber-500/10" };
};

const Workflows = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const { data: workflows = [], isLoading, isError } = useQuery<Workflow[]>({ queryKey: ["/api/workflows"] });

  const form = useForm({
    resolver: zodResolver(createWorkflowPayloadSchema),
    defaultValues: { name: "", description: "", trigger: "manual", category: "Email", status: "draft", actions: [], triggerCount: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest({ url: "/api/workflows", method: "POST", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Workflow created" });
      setShowDialog(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Failed to create", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest({ url: `/api/workflows/${id}`, method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Workflow deleted" });
    },
    onError: (e: any) => toast({ title: "Failed to delete", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      apiRequest({ url: `/api/workflows/${id}`, method: "PUT", data: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Workflow updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const filtered = workflows.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
  const tabs = [
    { id: "all", name: "All", filter: () => true },
    { id: "active", name: "Active", filter: (w: Workflow) => w.status === "active" },
    { id: "draft", name: "Drafts", filter: (w: Workflow) => w.status === "draft" },
    { id: "archived", name: "Archived", filter: (w: Workflow) => w.status === "archived" },
  ];

  return (
    <>
      <div className="bg-[#151515] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows & Triggers</h1>
          <p className="text-sm text-gray-400">Build and manage automated workflows</p>
        </div>
        <Button className="gradient-btn rounded-full" onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Workflow
        </Button>
      </div>

      <div className="p-6">
        {isError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-sm text-red-300">
            Sign in with Google to manage your workflows.
          </div>
        )}

        <div className="bg-[#151515] rounded-lg overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search workflows..." className="pl-10 bg-gray-800 border-gray-700" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <Tabs defaultValue="all">
            <div className="border-b border-gray-800">
              <TabsList className="flex p-0 bg-transparent h-auto">
                {tabs.map(t => (
                  <TabsTrigger key={t.id} value={t.id} className="py-3 px-5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0047FF] text-gray-400 data-[state=active]:text-white">
                    {t.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {tabs.map(tab => {
              const items = filtered.filter(tab.filter);
              return (
                <TabsContent key={tab.id} value={tab.id} className="m-0">
                  {isLoading && <div className="p-5 space-y-3"><Skeleton className="h-20 bg-gray-800" /><Skeleton className="h-20 bg-gray-800" /></div>}
                  {!isLoading && items.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                      <WorkflowIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No workflows {tab.id !== "all" && `in ${tab.name}`}.</p>
                      <Button className="gradient-btn mt-4" onClick={() => setShowDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Create your first workflow
                      </Button>
                    </div>
                  )}
                  <div className="divide-y divide-gray-800">
                    {items.map(w => {
                      const { Icon, color, bg } = categoryIcon(w.category);
                      return (
                        <div key={w.id} className="p-5 hover:bg-gray-900/50 flex justify-between gap-4">
                          <div className="flex items-start">
                            <div className={`${bg} p-2 rounded-lg mr-4`}><Icon className={`${color} w-5 h-5`} /></div>
                            <div>
                              <div className="flex items-center">
                                <h3 className="font-medium">{w.name}</h3>
                                <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${w.status === "active" ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-400"}`}>
                                  {w.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">{w.description || "No description"}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-right">
                            <div>
                              <p className="text-gray-400 text-xs">Triggers</p>
                              <p className="font-medium">{w.triggerCount ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Last Run</p>
                              <p className="font-medium">{w.lastRun ? new Date(w.lastRun).toLocaleDateString() : "Never"}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-gray-400"><MoreVertical className="w-5 h-5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => toggleMutation.mutate({ id: w.id, status: w.status === "active" ? "draft" : "active" })}>
                                  <Power className="w-4 h-4 mr-2" /> {w.status === "active" ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteMutation.mutate(w.id)} className="text-red-400">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#151515] border-gray-800">
          <DialogHeader><DialogTitle>New Workflow</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="bg-gray-800 border-gray-700" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Calendar">Calendar</SelectItem>
                      <SelectItem value="Document">Document</SelectItem>
                      <SelectItem value="CRM">CRM</SelectItem>
                      <SelectItem value="Notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="trigger" render={({ field }) => (
                <FormItem><FormLabel>Trigger</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="gradient-btn" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Workflows;
