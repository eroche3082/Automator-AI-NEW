import React from "react";
import { LanguageSelector } from "@/components/ui/language-selector";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { theme, setTheme } = useTheme();

  return (
    <main className="h-screen overflow-y-auto bg-[#0E0E0E] relative">
      {/* Top header with language selector and theme toggle */}
      <div className="absolute top-0 right-0 flex items-center p-4 z-10">
        <LanguageSelector />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="ml-2"
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {children}
    </main>
  );
};

export default MainContent;
