import axios from "axios";

// Define supported languages for translation
export type SupportedLanguage = "en" | "es" | "fr" | "de" | "pt" | "zh" | "ja" | "ko" | "ru" | "ar";

// Language display names for UI
export const languageNames: Record<SupportedLanguage, string> = {
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

class TranslateService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    // Use GOOGLE_CLOUD_TRANSLATION_API_KEY if available, fallback to GOOGLE_TRANSLATE_API_KEY
    this.apiKey = process.env.GOOGLE_CLOUD_TRANSLATION_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY || "";
    this.apiEndpoint = "https://translation.googleapis.com/language/translate/v2";
    
    if (!this.apiKey) {
      console.warn("WARNING: No Google Translate API key found in environment variables");
    } else {
      console.log("Google Translate API service initialized");
    }
  }

  /**
   * Translate text from one language to another
   * @param text Text to translate
   * @param targetLanguage Language code to translate to
   * @param sourceLanguage Optional source language code
   */
  async translateText(
    text: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        console.warn("No Google Translate API key provided");
        return text; // Return original text if no API key
      }

      // Build request parameters
      const params = new URLSearchParams({
        key: this.apiKey,
        q: text,
        target: targetLanguage,
        format: "text"
      });

      // Add source language if provided
      if (sourceLanguage) {
        params.append("source", sourceLanguage);
      }

      // Make the API request
      const response = await axios.post(
        this.apiEndpoint,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      // Extract translated text from response
      const translatedText = response.data?.data?.translations?.[0]?.translatedText;

      if (!translatedText) {
        throw new Error("No translation returned from API");
      }

      return translatedText;
    } catch (error) {
      console.error("Error translating text:", error);
      return text; // Return original text on error
    }
  }

  /**
   * Detect the language of a given text
   * @param text Text to detect language for
   */
  async detectLanguage(text: string): Promise<SupportedLanguage> {
    try {
      if (!this.apiKey) {
        console.warn("No Google Translate API key provided");
        return "en"; // Default to English if no API key
      }

      // Build request parameters
      const params = new URLSearchParams({
        key: this.apiKey,
        q: text
      });

      // Make the API request
      const response = await axios.post(
        `${this.apiEndpoint}/detect`,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      // Extract detected language from response
      const detectedLanguage = response.data?.data?.detections?.[0]?.[0]?.language;

      if (!detectedLanguage) {
        throw new Error("No language detection returned from API");
      }

      // Ensure the detected language is in our supported list
      return (Object.keys(languageNames).includes(detectedLanguage) 
        ? detectedLanguage 
        : "en") as SupportedLanguage;
    } catch (error) {
      console.error("Error detecting language:", error);
      return "en"; // Default to English on error
    }
  }
}

export const translateService = new TranslateService();