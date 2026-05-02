import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Search, MoreVertical, Mail, Phone, Star, Users, Trash2, Pencil } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { createLeadPayloadSchema } from "@shared/schema";

const statusColor = (s: string) => ({
  hot: "bg-red-500/20 text-red-500",
  warm: "bg-amber-500/20 text-amber-500",
  cold: "bg-blue-500/20 text-blue-500",
  customer: "bg-green-500/20 text-green-500",
}[s] || "bg-gray-500/20 text-gray-400");

const CRM = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);

  const { data: leads = [], isLoading, isError } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });

  const form = useForm({
    resolver: zodResolver(createLeadPayloadSchema),
    defaultValues: { name: "", email: "", phone: "", company: "", status: "cold", notes: "", tags: [] },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => editing
      ? apiRequest({ url: `/api/leads/${editing.id}`, method: "PUT", data })
      : apiRequest({ url: "/api/leads", method: "POST", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: editing ? "Lead updated" : "Lead created" });
      setShowDialog(false);
      setEditing(null);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest({ url: `/api/leads/${id}`, method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Lead deleted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => { setEditing(null); form.reset({ name: "", email: "", phone: "", company: "", status: "cold", notes: "", tags: [] }); setShowDialog(true); };
  const openEdit = (l: Lead) => {
    setEditing(l);
    form.reset({ name: l.name, email: l.email, phone: l.phone || "", company: l.company || "", status: l.status, notes: l.notes || "", tags: (l.tags as string[]) || [] });
    setShowDialog(true);
  };

  const filtered = leads.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()));
  const counts = {
    hot: leads.filter(l => l.status === "hot").length,
    warm: leads.filter(l => l.status === "warm").length,
    cold: leads.filter(l => l.status === "cold").length,
    customer: leads.filter(l => l.status === "customer").length,
  };
  const tabs = [
    { id: "all", name: "All Leads", filter: () => true },
    { id: "hot", name: "Hot", filter: (l: Lead) => l.status === "hot" },
    { id: "warm", name: "Warm", filter: (l: Lead) => l.status === "warm" },
    { id: "cold", name: "Cold", filter: (l: Lead) => l.status === "cold" },
    { id: "customer", name: "Customers", filter: (l: Lead) => l.status === "customer" },
  ];

  return (
    <>
      <div className="bg-[#151515] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM & Lead Automation</h1>
          <p className="text-sm text-gray-400">Manage leads and automate follow-ups</p>
        </div>
        <Button className="gradient-btn rounded-full" onClick={openCreate}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      <div className="p-6">
        {isError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-sm text-red-300">
            Sign in with Google to manage your leads.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[#151515] rounded-lg p-5">
              <h3 className="font-bold mb-4">Lead Overview</h3>
              <div className="space-y-3">
                {[
                  { label: "Hot", count: counts.hot, color: "text-[#FF3E3E]", bg: "bg-[#FF3E3E]/20", icon: <Star className="w-4 h-4" /> },
                  { label: "Warm", count: counts.warm, color: "text-amber-500", bg: "bg-amber-500/20", icon: <Star className="w-4 h-4" /> },
                  { label: "Cold", count: counts.cold, color: "text-blue-500", bg: "bg-blue-500/20", icon: <Star className="w-4 h-4" /> },
                  { label: "Customers", count: counts.customer, color: "text-green-500", bg: "bg-green-500/20", icon: <Users className="w-4 h-4" /> },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center mr-3 ${s.color}`}>{s.icon}</div>
                      <span>{s.label}</span>
                    </div>
                    <span className="text-lg font-bold">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-[#151515] rounded-lg overflow-hidden">
              <div className="p-5 border-b border-gray-800">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search leads..." className="pl-10 bg-gray-800 border-gray-700" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>

              <Tabs defaultValue="all">
                <div className="border-b border-gray-800">
                  <TabsList className="flex p-0 bg-transparent h-auto overflow-x-auto">
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
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No leads {tab.id !== "all" && `in ${tab.name}`}.</p>
                          <Button className="gradient-btn mt-4" onClick={openCreate}><UserPlus className="w-4 h-4 mr-2" /> Add your first lead</Button>
                        </div>
                      )}
                      <div className="divide-y divide-gray-800">
                        {items.map(l => (
                          <div key={l.id} className="p-5 hover:bg-gray-900/50 flex flex-col md:flex-row gap-4 justify-between">
                            <div className="flex items-start">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0047FF] to-[#D100FF] flex items-center justify-center mr-4">
                                <span className="text-white font-medium">{l.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <h3 className="font-medium">{l.name}</h3>
                                  <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${statusColor(l.status)}`}>{l.status}</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{l.company || "—"}</p>
                                {Array.isArray(l.tags) && (l.tags as string[]).length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {(l.tags as string[]).map((tag, i) => <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{tag}</span>)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-right">
                                <div className="flex items-center text-gray-400 mb-1"><Mail className="w-4 h-4 mr-1" />{l.email}</div>
                                {l.phone && <div className="flex items-center text-gray-400"><Phone className="w-4 h-4 mr-1" />{l.phone}</div>}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-gray-400"><MoreVertical className="w-5 h-5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => openEdit(l)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => deleteMutation.mutate(l.id)} className="text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#151515] border-gray-800">
          <DialogHeader><DialogTitle>{editing ? "Edit Lead" : "Add Lead"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => upsertMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" className="bg-gray-800 border-gray-700" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem><FormLabel>Company</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea className="bg-gray-800 border-gray-700" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="gradient-btn" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CRM;
