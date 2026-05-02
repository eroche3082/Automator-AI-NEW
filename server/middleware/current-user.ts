import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      dbUser?: User;
    }
  }
}

/**
 * Resolves (and auto-provisions if missing) the internal DB user from req.user (Firebase token).
 * Must be used AFTER `requireAuth`. Sets `req.dbUser` and continues.
 *
 * Auto-provisioning creates a minimal user row the first time a Firebase user hits the API.
 * This is safe because requireAuth already verified the token cryptographically.
 */
export async function loadCurrentUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.uid) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    let dbUser = await storage.getUserByFirebaseUid(req.user.uid);

    if (!dbUser) {
      const email = req.user.email || `${req.user.uid}@firebase.local`;
      const name = req.user.name || (email.split("@")[0] ?? "User");
      try {
        dbUser = await storage.createUser({
          username: req.user.uid,
          password: "firebase-auth",
          name,
          email,
          firebaseUid: req.user.uid,
        } as any);
      } catch (createErr: any) {
        // Race condition: another concurrent request inserted the same user.
        // Re-read by firebaseUid; if still missing, surface the original error.
        const retry = await storage.getUserByFirebaseUid(req.user.uid);
        if (retry) {
          dbUser = retry;
        } else {
          throw createErr;
        }
      }
    }

    req.dbUser = dbUser;
    next();
  } catch (err) {
    console.error("loadCurrentUser failed:", err);
    res.status(500).json({ error: "Failed to resolve current user" });
  }
}

/**
 * Convenience: combines requireAuth-style identity check + DB lookup.
 * For routes that need both an authenticated identity AND tenant scoping.
 */
export function ownedRoute(handler: (req: Request, res: Response) => unknown) {
  return async (req: Request, res: Response) => {
    if (!req.dbUser) return res.status(401).json({ error: "Authentication required" });
    return handler(req, res);
  };
}
