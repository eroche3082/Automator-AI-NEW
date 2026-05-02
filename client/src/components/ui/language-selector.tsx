import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, SupportedLanguage, languageNames } from "@/hooks/use-translation";

interface LanguageSelectorProps {
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { language, setLanguage } = useTranslation();
  const { toast } = useToast();

  const handleLanguageSelect = async (newLang: SupportedLanguage) => {
    try {
      // Don't do anything if the same language is selected
      if (newLang === language) return;
      
      // Update language through context provider
      setLanguage(newLang);
      
      // Call the onLanguageChange callback if provided
      if (onLanguageChange) {
        onLanguageChange(newLang);
      }

      toast({
        title: "Language updated",
        description: `The interface language has been changed to ${languageNames[newLang]}.`,
      });
    } catch (error) {
      console.error("Error changing language:", error);
      toast({
        title: "Error changing language",
        description: "There was a problem changing the language. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languageNames).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageSelect(code as SupportedLanguage)}
            className={language === code ? "bg-accent font-medium" : ""}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}