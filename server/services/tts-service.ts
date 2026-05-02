import axios from "axios";

// Voice options for text-to-speech
export type VoiceType = "standard" | "wavenet" | "neural2";
export type VoiceGender = "MALE" | "FEMALE";

// Voice configuration interface
export interface VoiceConfig {
  languageCode: string; // e.g., "en-US", "es-ES"
  name: string; // e.g., "en-US-Neural2-F"
  ssmlGender: VoiceGender;
  type: VoiceType;
}

// Audio configuration options
export interface AudioConfig {
  audioEncoding: "LINEAR16" | "MP3" | "OGG_OPUS";
  speakingRate: number; // 0.25 to 4.0
  pitch: number; // -20.0 to 20.0
  volumeGainDb: number; // -96.0 to 16.0
}

class TTSService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    // Use GOOGLE_TTS_KEY_ID if available, fallback to GOOGLE_TTS_API_KEY
    this.apiKey = process.env.GOOGLE_TTS_KEY_ID || process.env.GOOGLE_TTS_API_KEY || "";
    this.apiEndpoint = "https://texttospeech.googleapis.com/v1/text:synthesize";
    
    if (!this.apiKey) {
      console.warn("WARNING: No Google TTS API key found in environment variables");
    } else {
      console.log("Google Text-to-Speech API service initialized");
    }
  }

  /**
   * Convert text to speech using Google Cloud TTS API
   * @param text Text to convert to speech
   * @param voice Voice configuration
   * @param audioConfig Audio configuration
   * @returns Base64 encoded audio content
   */
  async textToSpeech(
    text: string,
    voice: Partial<VoiceConfig> = {},
    audioConfig: Partial<AudioConfig> = {}
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        console.warn("No Google TTS API key provided");
        return "";
      }

      // Default voice configuration
      const defaultVoice: VoiceConfig = {
        languageCode: "en-US",
        name: "en-US-Neural2-F",
        ssmlGender: "FEMALE",
        type: "neural2"
      };

      // Default audio configuration
      const defaultAudioConfig: AudioConfig = {
        audioEncoding: "MP3",
        speakingRate: 1.0,
        pitch: 0,
        volumeGainDb: 0
      };

      // Merge defaults with provided configs
      const mergedVoice = { ...defaultVoice, ...voice };
      const mergedAudioConfig = { ...defaultAudioConfig, ...audioConfig };

      // Build request payload
      const requestData = {
        input: {
          text
        },
        voice: mergedVoice,
        audioConfig: mergedAudioConfig
      };

      // Make the API request
      const response = await axios.post(
        `${this.apiEndpoint}?key=${this.apiKey}`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      // Extract audio content from response
      const audioContent = response.data?.audioContent;

      if (!audioContent) {
        throw new Error("No audio content returned from API");
      }

      return audioContent;
    } catch (error) {
      console.error("Error converting text to speech:", error);
      return "";
    }
  }

  /**
   * List available voices for a specific language
   * @param languageCode Optional language code to filter voices
   * @returns Array of available voices
   */
  async listVoices(languageCode?: string): Promise<VoiceConfig[]> {
    try {
      if (!this.apiKey) {
        console.warn("No Google TTS API key provided");
        return [];
      }

      // Build request URL
      let url = `https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`;
      if (languageCode) {
        url += `&languageCode=${languageCode}`;
      }

      // Make the API request
      const response = await axios.get(url);

      // Extract voices from response
      const voices = response.data?.voices || [];
      
      // Convert to our VoiceConfig format
      return voices.map((voice: any) => ({
        languageCode: voice.languageCodes[0],
        name: voice.name,
        ssmlGender: voice.ssmlGender,
        type: voice.name.includes("Neural2") 
          ? "neural2" 
          : voice.name.includes("Wavenet") 
            ? "wavenet" 
            : "standard"
      }));
    } catch (error) {
      console.error("Error listing voices:", error);
      return [];
    }
  }
}

export const ttsService = new TTSService();