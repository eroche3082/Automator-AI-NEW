import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

// Define supported languages matching our backend
export type SupportedLanguage = "en" | "es" | "fr" | "de" | "pt" | "zh" | "ja" | "ko" | "ru" | "ar";

// Language display names for UI
export const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  ar: "Arabic"
};

// Define context types
interface TranslationContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  translate: (text: string) => Promise<string>;
  isTranslating: boolean;
  cachedTranslations: Record<string, Record<SupportedLanguage, string>>;
}

// Create the context
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Create a provider component
interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  // Cache structure: { originalText: { languageCode: translatedText } }
  const [cachedTranslations, setCachedTranslations] = useState<Record<string, Record<SupportedLanguage, string>>>({});

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage") as SupportedLanguage;
    if (savedLanguage && Object.keys(languageNames).includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Function to set language and save to localStorage
  const setLanguage = (newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);
    localStorage.setItem("preferredLanguage", newLanguage);
  };

  // Translation function
  const translate = async (text: string): Promise<string> => {
    // If language is English or text is empty, return the original text
    if (language === "en" || !text) {
      return text;
    }

    // Check if we have a cached translation
    if (
      cachedTranslations[text] &&
      cachedTranslations[text][language]
    ) {
      return cachedTranslations[text][language];
    }

    try {
      setIsTranslating(true);
      
      // Call the translation API
      const response = await apiRequest({
        url: "/api/translate",
        method: "POST",
        data: {
          text,
          targetLanguage: language,
          sourceLanguage: "en" // Assuming original content is in English
        }
      });

      const translatedText = response?.translatedText || text;

      // Update cache
      setCachedTranslations(prev => ({
        ...prev,
        [text]: {
          ...(prev[text] || {}),
          [language]: translatedText
        }
      }));

      return translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  };

  const value = {
    language,
    setLanguage,
    translate,
    isTranslating,
    cachedTranslations
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use the translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

// Simple hook for translating text with automatic re-translation on language change
export function useTranslatedText(text: string): { translatedText: string; isTranslating: boolean } {
  const { translate, language, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    let isMounted = true;
    
    const translateText = async () => {
      const result = await translate(text);
      if (isMounted) {
        setTranslatedText(result);
      }
    };

    translateText();

    return () => {
      isMounted = false;
    };
  }, [text, language, translate]);

  return { translatedText, isTranslating };
}