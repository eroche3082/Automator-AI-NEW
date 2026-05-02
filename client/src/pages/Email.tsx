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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PenSquare, Search, MoreVertical, Mail, FileText, Clock, AlignLeft, Wand2, Trash2, Pencil } from "lucide-react";
import { getAIEmailSuggestion } from "@/lib/gemini";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailTemplate } from "@shared/schema";
import { createEmailTemplatePayloadSchema } from "@shared/schema";

const Email = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("compose");
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [search, setSearch] = useState("");

  const { data: templates = [], isLoading, isError } = useQuery<EmailTemplate[]>({ queryKey: ["/api/email-templates"] });

  const form = useForm({
    resolver: zodResolver(createEmailTemplatePayloadSchema),
    defaultValues: { name: "", type: "template", subject: "", content: "", emails: 1 },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => editing
      ? apiRequest({ url: `/api/email-templates/${editing.id}`, method: "PUT", data })
      : apiRequest({ url: "/api/email-templates", method: "POST", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: editing ? "Template updated" : "Template created" });
      setShowDialog(false); setEditing(null); form.reset();
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest({ url: `/api/email-templates/${id}`, method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const generateAIEmail = async () => {
    setIsGenerating(true);
    try {
      const suggestion = await getAIEmailSuggestion("follow-up email after initial client meeting");
      if (suggestion) setEmailContent(suggestion.content);
    } catch (e) { toast({ title: "AI generation failed", variant: "destructive" }); }
    finally { setIsGenerating(false); }
  };

  const saveAsTemplate = () => {
    if (!emailContent.trim() || !emailSubject.trim()) {
      toast({ title: "Subject and content required", variant: "destructive" }); return;
    }
    setEditing(null);
    form.reset({ name: emailSubject.slice(0, 60), type: "template", subject: emailSubject, content: emailContent, emails: 1 });
    setShowDialog(true);
  };

  const openCreate = () => { setEditing(null); form.reset({ name: "", type: "template", subject: "", content: "", emails: 1 }); setShowDialog(true); };
  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    form.reset({ name: t.name, type: t.type, subject: t.subject, content: t.content, emails: t.emails ?? 1 });
    setShowDialog(true);
  };

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="bg-[#151515] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email & Document Automation</h1>
          <p className="text-sm text-gray-400">Create and manage email templates</p>
        </div>
        <Button className="gradient-btn rounded-full" onClick={openCreate}>
          <PenSquare className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      <div className="p-6">
        {isError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-sm text-red-300">
            Sign in with Google to manage your email templates.
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#151515] p-1 rounded-lg">
            <TabsTrigger value="compose" className="flex-1 data-[state=active]:bg-gray-800"><Mail className="w-4 h-4 mr-2" /> Compose</TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 data-[state=active]:bg-gray-800"><FileText className="w-4 h-4 mr-2" /> Templates</TabsTrigger>
            <TabsTrigger value="documents" className="flex-1 data-[state=active]:bg-gray-800"><AlignLeft className="w-4 h-4 mr-2" /> Documents</TabsTrigger>
            <TabsTrigger value="sequences" className="flex-1 data-[state=active]:bg-gray-800"><Clock className="w-4 h-4 mr-2" /> Sequences</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-6">
            <div className="bg-[#151515] rounded-lg p-5">
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Subject</label>
                <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject" className="bg-gray-800 border-gray-700" />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Content</label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-700 flex">
                    <Button variant="ghost" size="sm" onClick={generateAIEmail} disabled={isGenerating} className="text-[#0047FF]">
                      <Wand2 className="h-4 w-4 mr-1" /> {isGenerating ? "Generating..." : "AI Writer"}
                    </Button>
                  </div>
                  <Textarea value={emailContent} onChange={e => setEmailContent(e.target.value)} placeholder="Write your email or use AI suggestions..." className="border-0 resize-none h-64" />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" className="bg-gray-800 border-gray-700" onClick={saveAsTemplate}>Save as Template</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="bg-[#151515] rounded-lg overflow-hidden">
              <div className="p-5 border-b border-gray-800 flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search templates..." className="pl-10 bg-gray-800 border-gray-700" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button className="gradient-btn ml-auto" onClick={openCreate}><PenSquare className="w-4 h-4 mr-2" /> New Template</Button>
              </div>
              {isLoading && <div className="p-5 space-y-3"><Skeleton className="h-16 bg-gray-800" /><Skeleton className="h-16 bg-gray-800" /></div>}
              {!isLoading && filtered.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No email templates yet.</p>
                  <Button className="gradient-btn mt-4" onClick={openCreate}><PenSquare className="w-4 h-4 mr-2" /> Create your first template</Button>
                </div>
              )}
              <div className="divide-y divide-gray-800">
                {filtered.map(t => (
                  <div key={t.id} className="p-5 hover:bg-gray-900/50 flex justify-between gap-4">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-lg mr-4 ${t.type === "automation" ? "bg-[#0047FF]/10" : "bg-[#D100FF]/10"}`}>
                        <Mail className={`w-5 h-5 ${t.type === "automation" ? "text-[#0047FF]" : "text-[#D100FF]"}`} />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{t.name}</h3>
                          <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${t.type === "automation" ? "bg-[#0047FF]/20 text-[#0047FF]" : "bg-[#D100FF]/20 text-[#D100FF]"}`}>
                            {t.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{t.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-right">
                      <div>
                        <p className="text-gray-400 text-xs">Last Edited</p>
                        <p className="font-medium">{new Date(t.lastEdited).toLocaleDateString()}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-gray-400"><MoreVertical className="w-5 h-5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEdit(t)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteMutation.mutate(t.id)} className="text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <div className="bg-[#151515] rounded-lg p-6 text-center py-16 text-gray-400">
              <FileText className="w-16 h-16 mx-auto opacity-50 mb-4" />
              <p>Document automation coming soon.</p>
            </div>
          </TabsContent>

          <TabsContent value="sequences" className="mt-6">
            <div className="bg-[#151515] rounded-lg p-6 text-center py-16 text-gray-400">
              <Clock className="w-16 h-16 mx-auto opacity-50 mb-4" />
              <p>Multi-stage sequences coming soon. Use templates with type "automation" for now.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#151515] border-gray-800 max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => upsertMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea className="bg-gray-800 border-gray-700 h-40" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="gradient-btn" disabled={upsertMutation.isPending}>{upsertMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Email;
