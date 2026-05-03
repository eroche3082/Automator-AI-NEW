import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  Key,
  Globe,
  Info,
  Database,
  Cloud,
  HelpCircle,
  LogOut,
  Check,
  X,
  Crown,
  Palette,
  Sun,
  Moon,
  Monitor,
  Shield,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembership } from "@/hooks/use-membership";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/hooks/use-theme";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link as WouterLink } from "wouter";
import { useLocation } from "wouter";
import type { User as DbUser } from "@shared/schema";

type NotificationPrefs = {
  email: boolean;
  workflowAlerts: boolean;
  leadNotifications: boolean;
  calendarReminders: boolean;
  marketingUpdates: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  email: true,
  workflowAlerts: true,
  leadNotifications: true,
  calendarReminders: true,
  marketingUpdates: false,
};

const Settings = () => {
  const { currentPlan, membership } = useMembership();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("••••••••••••••••••••••••••••••");
  const [showApiKey, setShowApiKey] = useState(false);
  const notReady = (label: string) =>
    toast({ title: label, description: "Esta función estará disponible próximamente." });

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({ title: "API key copiada al portapapeles" });
  };

  const deleteAccount = () => {
    if (window.confirm("¿Eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      notReady("Eliminación de cuenta");
    }
  };

  const { data: profile, isLoading: profileLoading } = useQuery<DbUser>({
    queryKey: ["/api/me"],
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    timeZone: "America/New_York",
    language: "en",
    notifications: true,
    workflowAlerts: true,
    leadNotifications: true,
    calendarReminders: true,
    marketingUpdates: false,
    browserNotifications: true,
    discordNotifications: false,
    twoFactorAuth: false,
    selectedTheme: theme,
  });

  // Hydrate form once profile arrives.
  useEffect(() => {
    if (!profile) return;
    const prefs = { ...DEFAULT_PREFS, ...((profile.notificationPrefs as Partial<NotificationPrefs>) || {}) };
    setFormData((f) => ({
      ...f,
      name: profile.name || "",
      email: profile.email || "",
      company: profile.company || "",
      timeZone: profile.timezone || "America/New_York",
      language: profile.language || "en",
      notifications: prefs.email,
      workflowAlerts: prefs.workflowAlerts,
      leadNotifications: prefs.leadNotifications,
      calendarReminders: prefs.calendarReminders,
      marketingUpdates: prefs.marketingUpdates,
    }));
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const body = {
        name: formData.name,
        email: formData.email,
        company: formData.company || null,
        timezone: formData.timeZone,
        language: formData.language,
        notificationPrefs: {
          email: formData.notifications,
          workflowAlerts: formData.workflowAlerts,
          leadNotifications: formData.leadNotifications,
          calendarReminders: formData.calendarReminders,
          marketingUpdates: formData.marketingUpdates,
        },
      };
      return apiRequest({ method: "PATCH", url: "/api/me", data: body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Settings saved", description: "Your profile has been updated." });
    },
    onError: (err: any) => {
      toast({
        title: "Could not save",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const openBillingPortal = useMutation({
    mutationFn: async () => {
      const data = await apiRequest<{ url: string }>({
        method: "POST",
        url: "/api/stripe/customer-portal",
        data: {},
      });
      return data.url;
    },
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
    onError: (err: any) => {
      toast({
        title: "Billing unavailable",
        description: err?.message || "No active subscription linked to this account yet.",
        variant: "destructive",
      });
    },
  });

  const [, setLocation] = useLocation();
  const handleLogout = async () => {
    try {
      await apiRequest({ url: "/api/auth/logout", method: "POST" });
      queryClient.clear();
      toast({ title: "Sesión cerrada" });
      setLocation("/login");
    } catch (err: any) {
      toast({ title: "Sign-out failed", description: err?.message, variant: "destructive" });
    }
  };


  const { data: integrationsData = [] } = useQuery<{ id: number; name: string; icon: string; status: string; lastSync: string | null }[]>({
    queryKey: ["/api/integrations"],
  });

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#151515] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-400">Configure your automation system</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => saveProfile.mutate()}
            disabled={saveProfile.isPending || profileLoading}
            className="flex items-center px-3 py-1.5 text-sm text-white gradient-btn rounded-full space-x-2"
            data-testid="button-save-settings"
          >
            {saveProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{saveProfile.isPending ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs defaultValue="account" className="w-full">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4">
              <TabsList className="flex flex-col w-full bg-[#151515] rounded-lg p-2 h-auto">
                <TabsTrigger
                  value="account"
                  className="w-full justify-start px-3 py-3 mb-1 data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <User className="w-4 h-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="w-full justify-start px-3 py-3 mb-1 data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="w-full justify-start px-3 py-3 mb-1 data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="integrations"
                  className="w-full justify-start px-3 py-3 mb-1 data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger
                  value="api"
                  className="w-full justify-start px-3 py-3 mb-1 data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <Key className="w-4 h-4 mr-2" />
                  API & Webhooks
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="w-full justify-start px-3 py-3 mb-1 data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <Info className="w-4 h-4 mr-2" />
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="w-full justify-start px-3 py-3 mb-1 data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger
                  value="language-region"
                  className="w-full justify-start px-3 py-3 mb-1 data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Language
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-700 text-gray-400 hover:text-white justify-start"
                  onClick={() => window.open("mailto:contact2610@replit.com?subject=AUTOMATOR%20AI%20Support", "_blank")}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full mt-2 bg-gray-800 border-gray-700 text-gray-400 hover:text-white justify-start"
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>

            <div className="md:w-3/4">
              <TabsContent value="account" className="mt-0">
                <Card className="bg-[#151515] border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#E6E8EC]">
                      <User className="w-5 h-5" />
                      <span>Account Settings</span>
                    </CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-gray-800 border-gray-700 focus:border-[#0047FF]" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-gray-800 border-gray-700 focus:border-[#0047FF]" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="bg-gray-800 border-gray-700 focus:border-[#0047FF]" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="timezone">Time Zone</Label>
                        <Select defaultValue={formData.timeZone} onValueChange={(value) => setFormData({...formData, timeZone: value})}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-[#0047FF]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (US & Canada)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (US & Canada)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="language">Language</Label>
                        <Select defaultValue={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-[#0047FF]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <h4 className="font-medium mb-4 text-[#E6E8EC]">Subscription Plan</h4>
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium text-[#E6E8EC]">{currentPlan?.name || "Free"} Plan</h5>
                            {currentPlan?.monthly != null && currentPlan.monthly > 0 && (
                              <p className="text-sm text-gray-400 mt-1">${(currentPlan.monthly / 100).toFixed(0)}/month</p>
                            )}
                            {membership.status && (
                              <p className="text-xs text-gray-500 mt-1 capitalize">Status: {membership.status}</p>
                            )}
                          </div>
                          <Button
                            className="gradient-btn"
                            onClick={() => openBillingPortal.mutate()}
                            disabled={openBillingPortal.isPending}
                            data-testid="button-manage-plan"
                          >
                            {openBillingPortal.isPending ? "Loading..." : "Manage Plan"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#E6E8EC]">Current Plan</label>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-[#6C5CE7]/20 text-[#6C5CE7] px-3 py-1 rounded-full">
                          <Crown className="w-4 h-4" />
                          <span className="text-sm font-medium">{currentPlan?.name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => openBillingPortal.mutate()}
                          disabled={openBillingPortal.isPending}
                          data-testid="button-manage-billing"
                        >
                          {openBillingPortal.isPending ? "Loading..." : "Manage Billing"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <Card className="bg-[#151515] border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#E6E8EC]">
                      <Bell className="w-5 h-5" />
                      <span>Notification Preferences</span>
                    </CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      Manage your notification settings and channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#E6E8EC]">Email Notifications</h4>
                        <p className="text-sm text-gray-400 mt-1">Receive email updates about your account</p>
                      </div>
                      <Switch checked={formData.notifications} onCheckedChange={(checked) => setFormData({...formData, notifications: checked})} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#E6E8EC]">Workflow Alerts</h4>
                        <p className="text-sm text-gray-400 mt-1">Get notified when workflows are completed or failed</p>
                      </div>
                      <Switch checked={formData.workflowAlerts} onCheckedChange={(checked) => setFormData({...formData, workflowAlerts: checked})} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#E6E8EC]">Lead Notifications</h4>
                        <p className="text-sm text-gray-400 mt-1">Alerts for new leads and status changes</p>
                      </div>
                      <Switch checked={formData.leadNotifications} onCheckedChange={(checked) => setFormData({...formData, leadNotifications: checked})} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#E6E8EC]">Calendar Reminders</h4>
                        <p className="text-sm text-gray-400 mt-1">Get meeting reminders and schedule updates</p>
                      </div>
                      <Switch checked={formData.calendarReminders} onCheckedChange={(checked) => setFormData({...formData, calendarReminders: checked})} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#E6E8EC]">Marketing Updates</h4>
                        <p className="text-sm text-gray-400 mt-1">Receive news about new features and updates</p>
                      </div>
                      <Switch checked={formData.marketingUpdates} onCheckedChange={(checked) => setFormData({...formData, marketingUpdates: checked})} />
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <h4 className="font-medium mb-4 text-[#E6E8EC]">Notification Channels</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-[#0047FF]/20 flex items-center justify-center mr-3">
                              <Bell className="w-4 h-4 text-[#0047FF]" />
                            </div>
                            <div>
                              <h5 className="font-medium text-[#E6E8EC]">Browser Notifications</h5>
                              <p className="text-xs text-gray-400">Real-time alerts in your browser</p>
                            </div>
                          </div>
                          <Switch checked={formData.browserNotifications} onCheckedChange={(checked) => setFormData({...formData, browserNotifications: checked})} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-700/20 flex items-center justify-center mr-3">
                              <span className="text-blue-700 font-bold">D</span>
                            </div>
                            <div>
                              <h5 className="font-medium text-[#E6E8EC]">Discord Notifications</h5>
                              <p className="text-xs text-gray-400">Send alerts to Discord channels</p>
                            </div>
                          </div>
                          <Switch checked={formData.discordNotifications} onCheckedChange={(checked) => setFormData({...formData, discordNotifications: checked})} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <Card className="bg-[#151515] border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#E6E8EC]">
                      <Shield className="w-5 h-5" />
                      <span>Security Settings</span>
                    </CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      Manage your account security and authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border border-gray-800 bg-[#0D0E11] p-4 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-[#00E5A8] mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-medium text-[#E6E8EC]">Sesión iniciada con Google</h4>
                        <p className="text-sm text-gray-400">
                          Tu cuenta usa Google OAuth 2.0. La autenticación, contraseña y verificación en dos pasos se gestionan directamente en tu cuenta de Google. No almacenamos contraseñas en nuestros servidores.
                        </p>
                        <a
                          href="https://myaccount.google.com/security"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-sm text-[#0047FF] hover:underline mt-1"
                          data-testid="link-google-security"
                        >
                          Gestionar seguridad en Google →
                        </a>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[#E6E8EC]">Cerrar sesión en este dispositivo</h4>
                        <p className="text-sm text-gray-400 mt-1">Termina la sesión actual en este navegador.</p>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-gray-800 border-gray-700"
                        onClick={() => {
                          fetch("/api/auth/logout", { method: "POST", credentials: "include" })
                            .then(() => (window.location.href = "/login"));
                        }}
                        data-testid="button-settings-logout"
                      >
                        Cerrar sesión
                      </Button>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-destructive">Danger Zone</h4>
                        <p className="text-sm text-gray-400 mt-1">Delete your account and all associated data</p>
                      </div>
                      <Button variant="destructive" onClick={deleteAccount}>
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="mt-0">
                <Card className="bg-[#151515] border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#E6E8EC]">
                      <Cloud className="w-5 h-5" />
                      <span>Integrations & Connections</span>
                    </CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      Manage your connected services and applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {integrationsData.length === 0 ? (
                      <p className="text-sm text-gray-400">No integrations configured yet.</p>
                    ) : integrationsData.map((integration) => (
                      <div key={integration.id} className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                              <span className="text-white font-bold">{integration.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-[#E6E8EC]">{integration.name}</h4>
                              <div className="flex items-center mt-1">
                                {integration.status === "connected" ? (
                                  <>
                                    <Check className="w-3 h-3 text-green-500 mr-1" />
                                    <span className="text-xs text-gray-400">
                                      Connected{integration.lastSync ? ` • Last sync: ${new Date(integration.lastSync).toLocaleString()}` : ""}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3 text-gray-500 mr-1" />
                                    <span className="text-xs text-gray-400">Not connected</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <WouterLink href="/connections">
                            <Button
                              variant={integration.status === "connected" ? "destructive" : "outline"}
                              size="sm"
                              className={integration.status !== "connected" ? "gradient-btn text-white" : ""}
                            >
                              {integration.status === "connected" ? "Disconnect" : "Connect"}
                            </Button>
                          </WouterLink>
                        </div>
                      </div>
                    ))}

                    <Separator className="bg-gray-800" />

                    <div className="bg-gray-800/50 p-4 rounded-lg border border-dashed border-gray-700 flex flex-col items-center justify-center text-center py-6">
                      <Cloud className="w-8 h-8 text-gray-500 mb-2" />
                      <h4 className="font-medium text-[#E6E8EC] mb-1">Connect More Services</h4>
                      <p className="text-sm text-gray-400 mb-4">Browse the integration marketplace</p>
                      <WouterLink href="/connections">
                        <Button className="gradient-btn">Browse Integrations</Button>
                      </WouterLink>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api" className="mt-0">
                <Card className="bg-[#151515] border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#E6E8EC]">
                      <Key className="w-5 h-5" />
                      <span>API Keys & Webhooks</span>
                    </CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      Manage your API keys and service integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3 text-[#E6E8EC]">Your AUTOMATOR AI API Key</h4>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            value={apiKey}
                            readOnly
                            type={showApiKey ? "text" : "password"}
                            className="bg-gray-800 border-gray-700 focus:border-[#0047FF]"
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="bg-gray-800 border-gray-700"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </Button>
                        <Button variant="outline" className="bg-gray-800 border-gray-700" onClick={copyApiKey}>
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Use this key to authenticate with the AUTOMATOR AI API</p>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <h4 className="font-medium mb-3 text-[#E6E8EC]">Service API Keys</h4>

                      {/* Firebase AI Logic / Gemini API */}
                      <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center mr-3">
                              <span className="text-white font-bold">F</span>
                            </div>
                            <div>
                              <h5 className="font-medium flex items-center text-[#E6E8EC]">
                                Firebase AI Logic / Gemini
                                <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded">Connected</span>
                              </h5>
                              <p className="text-xs text-gray-400 mt-1">Firebase AI Logic with Gemini API for automation</p>
                            </div>
                          </div>
                          <Button variant="outline" className="bg-gray-800 border-gray-700" size="sm" onClick={() => notReady("Configurar Gemini")}>
                            Configure
                          </Button>
                        </div>
                      </div>

                      {/* Google Translate API */}
                      <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                              <span className="text-blue-500 font-bold">G</span>
                            </div>
                            <div>
                              <h5 className="font-medium flex items-center text-[#E6E8EC]">
                                Google Translate API
                                <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded">Connected</span>
                              </h5>
                              <p className="text-xs text-gray-400 mt-1">Translation services for multilingual support</p>
                            </div>
                          </div>
                          <Button variant="outline" className="bg-gray-800 border-gray-700" size="sm" onClick={() => notReady("Configurar Translate")}>
                            Configure
                          </Button>
                        </div>
                      </div>

                      {/* Google TTS API */}
                      <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
                              <span className="text-blue-500 font-bold">G</span>
                            </div>
                            <div>
                              <h5 className="font-medium flex items-center text-[#E6E8EC]">
                                Google Text-to-Speech API
                                <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded">Connected</span>
                              </h5>
                              <p className="text-xs text-gray-400 mt-1">Speech synthesis for audio notifications and content</p>
                            </div>
                          </div>
                          <Button variant="outline" className="bg-gray-800 border-gray-700" size="sm">
                            Configure
                          </Button>
                        </div>
                      </div>

                      {/* n8n API */}
                      <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center mr-3">
                              <span className="text-white font-bold">n8n</span>
                            </div>
                            <div>
                              <h5 className="font-medium flex items-center text-[#E6E8EC]">
                                n8n Integration
                                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded">Not Configured</span>
                              </h5>
                              <p className="text-xs text-gray-400 mt-1">Workflow automation platform connection</p>
                            </div>
                          </div>
                          <Button variant="outline" className="bg-gray-800 border-gray-700" size="sm" onClick={() => notReady("Configurar TTS")}>
                            Configure
                          </Button>
                        </div>
                      </div>

                      {/* SendGrid API */}
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                              <span className="text-white font-bold">SG</span>
                            </div>
                            <div>
                              <h5 className="font-medium flex items-center text-[#E6E8EC]">
                                SendGrid API
                                <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded">Connected</span>
                              </h5>
                              <p className="text-xs text-gray-400 mt-1">Email delivery and template services</p>
                            </div>
                          </div>
                          <Button variant="outline" className="bg-gray-800 border-gray-700" size="sm" onClick={() => notReady("Configurar SendGrid")}>
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <h4 className="font-medium mb-3 text-[#E6E8EC]">Webhook Endpoints</h4>
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium text-[#E6E8EC]">Lead Capture Webhook</h5>
                            <p className="text-xs text-gray-400 mt-1">https://api.example.com/webhook/leads</p>
                          </div>
                          <WouterLink href="/webhooks">
                            <Button variant="outline" className="bg-gray-800 border-gray-700" size="sm">Edit</Button>
                          </WouterLink>
                        </div>
                      </div>

                      <div className="mt-4">
                        <WouterLink href="/webhooks">
                          <Button className="gradient-btn">Add New Webhook</Button>
                        </WouterLink>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <h4 className="font-medium mb-3 text-[#E6E8EC]">API Usage</h4>
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">API Calls (This Month)</p>
                            <p className="text-2xl font-bold mt-1">12,543</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">API Limit</p>
                            <p className="text-2xl font-bold mt-1">50,000</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#0047FF] to-[#D100FF] w-1/4"></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">25% of monthly limit used</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                <Card className="bg-[#151515] border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#E6E8EC]">
                      <Info className="w-5 h-5" />
                      <span>About AUTOMATOR AI</span>
                    </CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      Learn more about the platform and its capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 rounded-lg bg-[#0047FF] flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">A</span>
                      </div>
                      <h3 className="text-xl font-bold">
                        <span>AUTOMATOR</span>
                        <span className="gradient-text">AI</span>
                      </h3>
                      <p className="text-sm text-gray-400 mt-2">Version 1.5.3</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-[#E6E8EC]">About AUTOMATOR AI</h4>
                      <p className="text-sm text-gray-400">
                        AUTOMATOR AI is an all-in-one automation system designed to streamline your business processes,
                        manage tasks, track leads, send emails, and automate workflows. Our platform leverages
                        cutting-edge AI technology to help businesses scale without adding overhead.
                      </p>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <h4 className="font-medium mb-3 text-[#E6E8EC]">Powered By</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 p-3 rounded-lg">
                          <h5 className="font-medium text-[#E6E8EC] mb-1">Google Vertex AI</h5>
                          <p className="text-xs text-gray-400">AI functionality powered by Vertex AI 2.5 Pro</p>
                        </div>
                        <div className="bg-gray-800/50 p-3 rounded-lg">
                          <h5 className="font-medium text-[#E6E8EC] mb-1">Gemini 1.5 Flash</h5>
                          <p className="text-xs text-gray-400">Fast, efficient AI processing for real-time suggestions</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <h4 className="font-medium mb-3 text-[#E6E8EC]">Legal Information</h4>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full bg-gray-800 border-gray-700 justify-start" onClick={() => window.open("/terms", "_blank")}>
                          Terms of Service
                        </Button>
                        <Button variant="outline" className="w-full bg-gray-800 border-gray-700 justify-start" onClick={() => window.open("/privacy", "_blank")}>
                          Privacy Policy
                        </Button>
                        <Button variant="outline" className="w-full bg-gray-800 border-gray-700 justify-start" onClick={() => notReady("Acuerdo de procesamiento de datos")}>
                          Data Processing Agreement
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="text-center">
                      <p className="text-xs text-gray-400">
                        © 2023 AUTOMATOR AI. All rights reserved.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Theme Settings */}
              <TabsContent value="appearance" className="mt-0">
              <Card className="bg-[#151515] border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-[#E6E8EC]">
                    <Palette className="w-5 h-5" />
                    <span>Theme & Appearance</span>
                  </CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    Customize the look and feel of your workspace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-[#E6E8EC] mb-3 block">
                      Theme Mode
                    </Label>
                    <RadioGroup
                      value={theme}
                      onValueChange={(value) => {
                        setFormData({ ...formData, selectedTheme: value });
                        setTheme(value as "light" | "dark" | "system");
                      }}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="light" id="light" className="peer-sr-only" />
                        <Label
                          htmlFor="light"
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-700 bg-transparent p-4 hover:bg-gray-800/50 cursor-pointer transition-all peer-data-[state=checked]:border-[#0047FF] peer-data-[state=checked]:bg-[#0047FF]/10"
                        >
                          <Sun className="h-6 w-6 mb-2 text-gray-400" />
                          <span className="text-sm font-medium text-[#E6E8EC]">Light</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="dark" id="dark" className="peer-sr-only" />
                        <Label
                          htmlFor="dark"
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-700 bg-transparent p-4 hover:bg-gray-800/50 cursor-pointer transition-all peer-data-[state=checked]:border-[#0047FF] peer-data-[state=checked]:bg-[#0047FF]/10"
                        >
                          <Moon className="h-6 w-6 mb-2 text-gray-400" />
                          <span className="text-sm font-medium text-[#E6E8EC]">Dark</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="system" id="system" className="peer-sr-only" />
                        <Label
                          htmlFor="system"
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-700 bg-transparent p-4 hover:bg-gray-800/50 cursor-pointer transition-all peer-data-[state=checked]:border-[#0047FF] peer-data-[state=checked]:bg-[#0047FF]/10"
                        >
                          <Monitor className="h-6 w-6 mb-2 text-gray-400" />
                          <span className="text-sm font-medium text-[#E6E8EC]">System</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
                </Card>
              </TabsContent>

              {/* Language & Region */}
              <TabsContent value="language-region" className="mt-0">
                <Card className="bg-[#151515] border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#E6E8EC]">
                      <Globe className="w-5 h-5" />
                      <span>Language & Region</span>
                    </CardTitle>
                    <CardDescription className="text-[#94A3B8]">
                      Set your preferred language and regional settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="language">Language</Label>
                      <Select defaultValue={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-[#0047FF]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="timezone">Time Zone</Label>
                      <Select defaultValue={formData.timeZone} onValueChange={(value) => setFormData({...formData, timeZone: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-[#0047FF]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (US & Canada)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (US & Canada)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default Settings;