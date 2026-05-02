import { pool } from './db';

export interface SystemHealth {
  database: boolean;
  firebase: boolean;
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
    firebase: false,
    googleApis: {
      gemini: false,
      translation: false,
      textToSpeech: false,
    },
    stripe: false,
    n8n: false,
  };

  // Database check
  try {
    if (pool) {
      const result = await pool.query('SELECT 1');
      health.database = true;
    }
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Firebase check
  try {
    health.firebase = !!process.env.FIREBASE_PROJECT_ID;
  } catch (error) {
    console.error('Firebase health check failed:', error);
  }

  // Google APIs check
  try {
    health.googleApis.gemini = !!process.env.GOOGLE_CLOUD_PROJECT;
    health.googleApis.translation = !!process.env.GOOGLE_CLOUD_PROJECT;
    health.googleApis.textToSpeech = !!process.env.GOOGLE_CLOUD_PROJECT;
  } catch (error) {
    console.error('Google APIs health check failed:', error);
  }

  // Stripe check
  try {
    health.stripe = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
  } catch (error) {
    console.error('Stripe health check failed:', error);
  }

  // n8n check
  try {
    health.n8n = !!process.env.N8N_API_KEY;
  } catch (error) {
    console.error('n8n health check failed:', error);
  }

  return health;
}