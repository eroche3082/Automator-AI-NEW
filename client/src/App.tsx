import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Workflows from "@/pages/Workflows";
import CRM from "@/pages/CRM";
import Email from "@/pages/Email";
import Calendar from "@/pages/Calendar";
import Pricing from "@/pages/Pricing";
import Success from "@/pages/Success";
import Cancel from "@/pages/Cancel";
import N8nIntegrationPage from "@/pages/N8nIntegrationPage";
import Connections from "@/pages/Connections";
import Webhooks from "@/pages/Webhooks";
import Settings from "@/pages/Settings";
import SystemHealth from "@/pages/SystemHealth";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/crm" component={CRM} />
      <Route path="/email" component={Email} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/thank-you" component={Success} />
      <Route path="/cancelled" component={Cancel} />
      <Route path="/system-health" component={SystemHealth} />
      <Route path="/n8n" component={N8nIntegrationPage} />
      <Route path="/connections" component={Connections} />
      <Route path="/settings" component={Settings} />
      <Route path="/webhooks" component={Webhooks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize theme on app load
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.add(savedTheme);
  }, []);

  return (
    <TooltipProvider>
      <AppLayout>
        <Router />
      </AppLayout>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;