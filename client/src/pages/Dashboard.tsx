import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AIWelcomeCard from "@/components/dashboard/AIWelcomeCard";
import MetricsCard from "@/components/dashboard/MetricsCard";
import ActivityItem from "@/components/dashboard/ActivityItem";
import WorkflowTemplate from "@/components/dashboard/WorkflowTemplate";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import {
  Bell, Plus, Workflow, Users, Calendar, Mail, FileText, UserPlus, PlusCircle, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface DashboardData {
  totalLeads: number;
  activeWorkflows: number;
  upcomingMeetings: number;
  recentActivity: Array<{ type: string; timestamp: string; details: string }>;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  return `${Math.floor(hr / 24)} d ago`;
}

function activityIcon(type: string) {
  if (type.includes("Lead")) return { icon: <UserPlus className="w-4 h-4" />, bg: "bg-green-500/20", color: "text-green-500" };
  if (type.includes("Workflow")) return { icon: <Workflow className="w-4 h-4" />, bg: "bg-[#0047FF]/20", color: "text-[#0047FF]" };
  if (type.includes("Meeting")) return { icon: <Calendar className="w-4 h-4" />, bg: "bg-[#D100FF]/20", color: "text-[#D100FF]" };
  return { icon: <Activity className="w-4 h-4" />, bg: "bg-gray-500/20", color: "text-gray-400" };
}

const Dashboard = () => {
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useQuery<DashboardData>({ queryKey: ["/api/dashboard"] });

  const metrics = [
    { title: "Active Workflows", value: data?.activeWorkflows ?? 0, icon: <Workflow className="w-5 h-5" />, borderColor: "border-[#0047FF]", iconColor: "text-[#0047FF]" },
    { title: "Total Leads", value: data?.totalLeads ?? 0, icon: <Users className="w-5 h-5" />, borderColor: "border-[#D100FF]", iconColor: "text-[#D100FF]" },
    { title: "Upcoming Meetings", value: data?.upcomingMeetings ?? 0, icon: <Calendar className="w-5 h-5" />, borderColor: "border-[#FF3E3E]", iconColor: "text-[#FF3E3E]" },
  ];

  const workflowTemplates = [
    { title: "Lead Capture & Nurture", description: "Automatically add leads to CRM and start nurture sequence", badge: { text: "Popular", color: "bg-[#0047FF]/20 text-[#0047FF]" } },
    { title: "Meeting Scheduler", description: "Setup meetings with reminders and follow-ups", badge: { text: "New", color: "bg-[#D100FF]/20 text-[#D100FF]" } },
    { title: "Document Generation", description: "Create AI-powered proposals and contracts" },
  ];

  return (
    <>
      <div className="bg-[#151515] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400">Overview of your automation system</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="flex items-center space-x-2 bg-gray-800" onClick={() => setLocation("/settings")}>
            <Bell className="w-4 h-4" /><span>Notifications</span>
          </Button>
          <Button className="gradient-btn rounded-full" onClick={() => setShowWorkflowBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Workflow
          </Button>
        </div>
      </div>

      <div className="p-6">
        {isError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-sm text-red-300">
            Sign in to see your live dashboard data. The metrics below show zeros until you authenticate.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metrics.map((m, i) => (
            isLoading ? <Skeleton key={i} className="h-28 bg-gray-800" /> :
            <MetricsCard key={i} title={m.title} value={String(m.value)} icon={m.icon} change="" changeText="this period" borderColor={m.borderColor} iconColor={m.iconColor} />
          ))}
        </div>

        <Tabs defaultValue="recent" className="mb-8">
          <TabsList className="border-b border-gray-800 bg-transparent flex space-x-6 pb-2">
            <TabsTrigger value="recent" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0047FF] text-gray-400 data-[state=active]:text-white py-3">Recent Activity</TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:border-b-2 data-[state=active]:border-[#0047FF] text-gray-400 data-[state=active]:text-white py-3">Suggested Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="pt-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-[#151515] rounded-lg shadow p-5">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold">Recent Activity</h3>
                    <button className="text-sm text-gray-400 hover:text-white" onClick={() => setLocation("/crm")}>See all</button>
                  </div>
                  <div className="space-y-4">
                    {isLoading && <><Skeleton className="h-16 bg-gray-800" /><Skeleton className="h-16 bg-gray-800" /></>}
                    {data?.recentActivity?.length === 0 && (
                      <p className="text-sm text-gray-400">No activity yet. Create your first workflow, lead or meeting.</p>
                    )}
                    {data?.recentActivity?.map((a, i) => {
                      const icon = activityIcon(a.type);
                      return <ActivityItem key={i} icon={icon.icon} iconBgColor={icon.bg} iconColor={icon.color} title={a.type} time={formatRelativeTime(a.timestamp)} description={a.details} />;
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-[#151515] rounded-lg shadow p-5">
                  <h3 className="font-bold mb-4">Quick Workflow Builder</h3>
                  <div className="space-y-3">
                    {workflowTemplates.map((t, i) => (
                      <WorkflowTemplate key={i} title={t.title} description={t.description} badge={t.badge} onClick={() => setShowWorkflowBuilder(true)} />
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-5 bg-gray-800 hover:bg-gray-700" onClick={() => setShowWorkflowBuilder(true)}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Create Custom Workflow
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="pt-5">
            <div className="bg-[#151515] rounded-lg p-5">
              <h3 className="font-bold mb-4">AI-Suggested Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-[#0047FF]/30 hover:border-[#0047FF] cursor-pointer" onClick={() => setShowWorkflowBuilder(true)}>
                  <Mail className="w-6 h-6 text-[#0047FF] mb-2" />
                  <h4 className="font-medium">Advanced Email Follow-up</h4>
                  <p className="text-xs text-gray-400 mt-2">Multi-stage email sequence with conditional logic</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-[#D100FF]/30 hover:border-[#D100FF] cursor-pointer" onClick={() => setShowWorkflowBuilder(true)}>
                  <Calendar className="w-6 h-6 text-[#D100FF] mb-2" />
                  <h4 className="font-medium">Smart Meeting Scheduler</h4>
                  <p className="text-xs text-gray-400 mt-2">Auto-schedule based on calendar availability</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-[#FF3E3E]/30 hover:border-[#FF3E3E] cursor-pointer" onClick={() => setShowWorkflowBuilder(true)}>
                  <FileText className="w-6 h-6 text-[#FF3E3E] mb-2" />
                  <h4 className="font-medium">Document Generator</h4>
                  <p className="text-xs text-gray-400 mt-2">Generate proposals from CRM data</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {showWorkflowBuilder && <WorkflowBuilder />}
      </div>
    </>
  );
};

export default Dashboard;
