import { pool } from './db';

export interface SystemHealth {
  database: boolean;
  auth: boolean;
  googleApis: {
    gemini: boolean;
    translation: boolean;
    textToSpeech: boolean;
  };
  stripe: boolean;
  n8n: boolean;
}

export async function checkSystemHealth(): Promise<SystemHealth> {
  const health: SystemHealth = {
    database: false,
    auth: false,
    googleApis: {
      gemini: false,
      translation: false,
      textToSpeech: false,
    },
    stripe: false,
    n8n: false,
  };

  try {
    if (pool) {
      await pool.query('SELECT 1');
      health.database = true;
    }
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  health.auth = !!(
    process.env.SESSION_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );

  health.googleApis.gemini = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);
  health.googleApis.translation = !!process.env.GOOGLE_CLOUD_PROJECT;
  health.googleApis.textToSpeech = !!process.env.GOOGLE_CLOUD_PROJECT;

  health.stripe = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
  health.n8n = !!process.env.N8N_API_KEY;

  return health;
}
