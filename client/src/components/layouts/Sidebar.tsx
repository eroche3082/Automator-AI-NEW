import { useLocation } from "wouter";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as DbUser } from "@shared/schema";
import {
  LayoutDashboard,
  Workflow,
  Users,
  Mail,
  Calendar,
  Plug,
  Webhook,
  Settings,
  LogOut,
  CreditCard,
  BarChart3,
  Activity
} from "lucide-react";

const Sidebar = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile } = useQuery<DbUser>({ queryKey: ["/api/me"], retry: false });
  const displayName = profile?.name || profile?.email?.split("@")[0] || "Guest";
  const displayEmail = profile?.email || "Sign in to continue";
  const initial = (profile?.name || profile?.email || "G").charAt(0).toUpperCase();

  const logout = useMutation({
    mutationFn: async () => apiRequest({ url: "/api/auth/logout", method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      toast({ title: "Sesión cerrada" });
      setLocation("/login");
    },
  });

  const isActive = (path: string) => {
    return location === path;
  };

  const navigationItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", section: "Main" },
    { label: "Workflows & Triggers", icon: Workflow, path: "/workflows", section: "Main" },
    { label: "CRM & Leads", icon: Users, path: "/crm", section: "Main" },
    { label: "Email & Documents", icon: Mail, path: "/email", section: "Main" },
    { label: "Calendar", icon: Calendar, path: "/calendar", section: "Main" },
    { label: "Connections", icon: Plug, path: "/connections", section: "Integrations" },
    { label: "Webhooks", icon: Webhook, path: "/webhooks", section: "Integrations" },
    { label: "Settings", icon: Settings, path: "/settings", section: "Integrations" },
    { label: "System Health", icon: Activity, path: "/system-health", section: "Integrations" },
    { label: "Pricing", icon: CreditCard, path: "/pricing", section: "Main" },
  ];

  const renderNavigationItems = (section: string) => {
    return navigationItems
      .filter((item) => item.section === section)
      .map((item, index) => {
        const IconComponent = item.icon;
        return (
          <Link
            key={index}
            href={item.path}
            className={`flex items-center px-3 py-2 rounded-md space-x-3 ${
              isActive(item.path)
                ? "text-white bg-gray-800"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <IconComponent className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      });
  };

  return (
    <aside className="bg-surface h-screen border-r border-gray-800 overflow-y-auto p-4 flex flex-col bg-[#151515] hidden md:flex">
      {/* Brand Logo */}
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#0047FF] flex items-center justify-center mr-2">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <h1 className="text-xl font-bold text-white">
          <span>AUTOMATOR</span>
          <span className="gradient-text">AI</span>
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1 flex-1">
        <div className="text-xs uppercase text-gray-400 mt-3 mb-2 px-3">Main</div>
        {renderNavigationItems("Main")}

        <div className="text-xs uppercase text-gray-400 mt-6 mb-2 px-3">Integrations</div>
        {renderNavigationItems("Integrations")}
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-auto border-t border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00E5A8] flex items-center justify-center">
              <span className="text-xs font-bold text-white" data-testid="text-user-initial">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#E6E8EC] truncate" data-testid="text-user-name">{displayName}</p>
              <p className="text-xs text-[#94A3B8] truncate" data-testid="text-user-email">{displayEmail}</p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          data-testid="button-sidebar-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logout.isPending ? "Cerrando..." : "Cerrar sesión"}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;