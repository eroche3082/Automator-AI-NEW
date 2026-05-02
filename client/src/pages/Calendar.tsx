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
import { Plus, Calendar as CalendarIcon, Clock, Users, Video, MoreVertical, Trash2, Pencil, ExternalLink } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Meeting } from "@shared/schema";
import { createMeetingPayloadSchema } from "@shared/schema";

const Calendar = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);

  const { data: meetings = [], isLoading, isError } = useQuery<Meeting[]>({ queryKey: ["/api/meetings"] });

  const form = useForm({
    resolver: zodResolver(createMeetingPayloadSchema),
    defaultValues: { title: "", description: "", startTime: new Date(), endTime: new Date(Date.now() + 30 * 60 * 1000), attendees: 1, type: "video", link: "", status: "scheduled" },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => editing
      ? apiRequest({ url: `/api/meetings/${editing.id}`, method: "PUT", data })
      : apiRequest({ url: "/api/meetings", method: "POST", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: editing ? "Meeting updated" : "Meeting scheduled" });
      setShowDialog(false); setEditing(null); form.reset();
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest({ url: `/api/meetings/${id}`, method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Meeting cancelled" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditing(null);
    const start = date || new Date(); start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    form.reset({ title: "", description: "", startTime: start, endTime: end, attendees: 1, type: "video", link: "", status: "scheduled" });
    setShowDialog(true);
  };
  const openEdit = (m: Meeting) => {
    setEditing(m);
    form.reset({ title: m.title, description: m.description || "", startTime: new Date(m.startTime), endTime: new Date(m.endTime), attendees: m.attendees || 1, type: m.type, link: m.link || "", status: m.status });
    setShowDialog(true);
  };

  const upcoming = meetings.filter(m => new Date(m.endTime).getTime() >= Date.now()).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const todays = upcoming.filter(m => new Date(m.startTime).toDateString() === (date || new Date()).toDateString());

  const toLocalInput = (d: Date) => {
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  };

  return (
    <>
      <div className="bg-[#151515] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar & Scheduling</h1>
          <p className="text-sm text-gray-400">Manage meetings and appointments</p>
        </div>
        <Button className="gradient-btn rounded-full" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Schedule Meeting
        </Button>
      </div>

      <div className="p-6">
        {isError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-sm text-red-300">
            Sign in with Google to manage your meetings.
          </div>
        )}

        <Tabs defaultValue="calendar">
          <TabsList className="grid w-full grid-cols-2 bg-[#151515] p-1 rounded-lg">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-gray-800"><CalendarIcon className="w-4 h-4 mr-2" /> Calendar</TabsTrigger>
            <TabsTrigger value="meetings" className="data-[state=active]:bg-gray-800"><Users className="w-4 h-4 mr-2" /> All Meetings</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#151515] rounded-lg p-5">
                <div className="rounded-lg overflow-hidden border border-gray-800">
                  <CalendarComponent mode="single" selected={date} onSelect={setDate} className="bg-gray-900" />
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-4">{date?.toDateString() || "Today"}'s Schedule</h4>
                  <div className="space-y-3">
                    {todays.length === 0 && <p className="text-sm text-gray-400">No meetings on this day.</p>}
                    {todays.map(m => (
                      <div key={m.id} className="bg-gray-800/50 p-3 rounded-lg border-l-2 border-[#0047FF]">
                        <div className="flex justify-between">
                          <h5 className="font-medium">{m.title}</h5>
                          <span className="text-xs bg-[#0047FF]/20 text-[#0047FF] px-2 py-0.5 rounded">{new Date(m.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                          <div className="flex items-center"><Video className="w-3 h-3 mr-1" />{m.type}<span className="mx-2">•</span><Users className="w-3 h-3 mr-1" />{m.attendees ?? 1}</div>
                          {m.link && <a href={m.link} target="_blank" rel="noreferrer" className="text-[#0047FF] flex items-center"><ExternalLink className="w-3 h-3 mr-1" />Join</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#151515] rounded-lg p-5">
                <h3 className="font-bold mb-4">Upcoming Meetings ({upcoming.length})</h3>
                {isLoading && <Skeleton className="h-32 bg-gray-800" />}
                {!isLoading && upcoming.length === 0 && <p className="text-sm text-gray-400">No upcoming meetings.</p>}
                <div className="space-y-3">
                  {upcoming.slice(0, 5).map(m => (
                    <div key={m.id} className="bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{m.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openEdit(m)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(m.id)} className="text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Cancel</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(m.startTime).toLocaleString()}</p>
                      <div className="mt-2 flex justify-between items-center text-xs">
                        <div className="flex items-center text-gray-400"><Users className="w-3 h-3 mr-1" />{m.attendees ?? 1} attendees</div>
                        {m.link && <a href={m.link} target="_blank" rel="noreferrer"><Button size="sm" className="h-6 px-2 text-xs gradient-btn">Join</Button></a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <div className="bg-[#151515] rounded-lg p-5">
              {isLoading && <Skeleton className="h-32 bg-gray-800" />}
              {!isLoading && meetings.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No meetings scheduled yet.</p>
                  <Button className="gradient-btn mt-4" onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Schedule your first meeting</Button>
                </div>
              )}
              <div className="space-y-3">
                {meetings.map(m => (
                  <div key={m.id} className="bg-gray-800/50 p-4 rounded-lg flex justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{m.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">{new Date(m.startTime).toLocaleString()} → {new Date(m.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      {m.description && <p className="text-sm text-gray-400 mt-2">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === "scheduled" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>{m.status}</span>
                      <Button size="sm" variant="outline" onClick={() => openEdit(m)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#151515] border-gray-800">
          <DialogHeader><DialogTitle>{editing ? "Edit Meeting" : "Schedule Meeting"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => upsertMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="bg-gray-800 border-gray-700" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem><FormLabel>Start</FormLabel><FormControl>
                    <Input type="datetime-local" className="bg-gray-800 border-gray-700" value={toLocalInput(new Date(field.value))} onChange={e => field.onChange(new Date(e.target.value))} />
                  </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem><FormLabel>End</FormLabel><FormControl>
                    <Input type="datetime-local" className="bg-gray-800 border-gray-700" value={toLocalInput(new Date(field.value))} onChange={e => field.onChange(new Date(e.target.value))} />
                  </FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="attendees" render={({ field }) => (
                  <FormItem><FormLabel>Attendees</FormLabel><FormControl><Input type="number" min={1} className="bg-gray-800 border-gray-700" {...field} value={field.value ?? 1} onChange={e => field.onChange(parseInt(e.target.value) || 1)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="in-person">In Person</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="link" render={({ field }) => (
                <FormItem><FormLabel>Meeting Link</FormLabel><FormControl><Input className="bg-gray-800 border-gray-700" placeholder="https://meet.google.com/..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit" className="gradient-btn" disabled={upsertMutation.isPending}>{upsertMutation.isPending ? "Saving..." : editing ? "Update" : "Schedule"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Calendar;
