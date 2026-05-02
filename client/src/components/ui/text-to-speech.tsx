import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";

interface TextToSpeechProps {
  text: string;
  className?: string;
}

export function TextToSpeech({ text, className }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { language } = useTranslation();

  // Map of language codes to TTS voice language codes
  const languageToVoiceMap: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    pt: "pt-BR",
    zh: "cmn-CN",
    ja: "ja-JP",
    ko: "ko-KR",
    ru: "ru-RU",
    ar: "ar-XA"
  };

  const handlePlay = async () => {
    // If already playing, stop the audio
    if (isPlaying && audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setAudio(null);
      return;
    }

    if (!text) {
      toast({
        title: "No text to speak",
        description: "Please provide text to convert to speech.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get the appropriate language for TTS
      const voiceLanguage = languageToVoiceMap[language] || "en-US";

      // Configure the voice based on the selected language
      const voiceConfig = {
        languageCode: voiceLanguage,
        ssmlGender: "FEMALE",
        name: `${voiceLanguage}-Neural2-F` // Using Neural2 voices for best quality
      };

      // Call the TTS API
      const response = await apiRequest({
        url: "/api/text-to-speech",
        method: "POST",
        data: {
          text,
          voice: voiceConfig,
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0
          }
        }
      });

      if (response && response.audioContent) {
        // Convert base64 to audio
        const audioSrc = `data:audio/mp3;base64,${response.audioContent}`;
        const newAudio = new Audio(audioSrc);
        
        // Set up event handlers
        newAudio.onended = () => {
          setIsPlaying(false);
        };
        
        newAudio.onerror = (e) => {
          console.error("Audio playback error:", e);
          toast({
            title: "Playback error",
            description: "There was a problem playing the audio.",
            variant: "destructive",
          });
          setIsPlaying(false);
        };
        
        // Play the audio
        newAudio.play().catch(error => {
          console.error("Audio play error:", error);
          setIsPlaying(false);
          toast({
            title: "Playback error",
            description: "There was a problem playing the audio.",
            variant: "destructive",
          });
        });
        
        setAudio(newAudio);
        setIsPlaying(true);
      } else {
        throw new Error("No audio content received from API");
      }
    } catch (error) {
      console.error("Text-to-speech error:", error);
      toast({
        title: "Text-to-speech error",
        description: "There was a problem converting text to speech.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePlay}
      disabled={isLoading}
      className={className}
      title="Text to speech"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isPlaying ? (
        <Square className="h-5 w-5" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
      <span className="sr-only">
        {isPlaying ? "Stop speaking" : "Speak text"}
      </span>
    </Button>
  );
}