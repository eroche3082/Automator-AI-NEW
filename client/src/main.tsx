import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from "@/components/ui/toaster";
import { TranslationProvider } from "@/hooks/use-translation";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="automator-ui-theme">
      <TranslationProvider>
        <App />
        <Toaster />
      </TranslationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
