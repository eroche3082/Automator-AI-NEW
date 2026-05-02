import type { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let initialized = false;
let initFailed = false;

function initFirebaseAdmin() {
  if (initialized || initFailed) return;
  try {
    const envCred = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    let credential: admin.credential.Credential | null = null;

    if (envCred) {
      credential = admin.credential.cert(JSON.parse(envCred));
    } else {
      const filePath = path.join(process.cwd(), "service-account.json");
      if (fs.existsSync(filePath)) {
        const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        credential = admin.credential.cert(json);
      }
    }

    if (!credential) {
      console.warn("⚠️ Firebase Admin not initialized: no credentials found (set FIREBASE_SERVICE_ACCOUNT_JSON or place service-account.json). Auth middleware will reject all requests.");
      initFailed = true;
      return;
    }

    admin.initializeApp({ credential });
    initialized = true;
    console.log("✅ Firebase Admin initialized");
  } catch (err) {
    console.error("❌ Firebase Admin init failed:", err);
    initFailed = true;
  }
}

initFirebaseAdmin();

export interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Optional auth: attaches req.user if a valid Bearer token is present.
 * Does NOT block requests without a token. Use for endpoints that may serve
 * both authenticated and anonymous users.
 */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  if (!initialized) return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    // Invalid token: ignore for optional auth
  }
  next();
}

/**
 * Strict auth: rejects requests without a valid Firebase ID token.
 * Apply to mutation endpoints and any endpoint exposing user-specific data.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!initialized) {
    return res.status(503).json({ error: "Authentication service unavailable" });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
