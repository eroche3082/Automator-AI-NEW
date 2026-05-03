import type { Request, Response, NextFunction } from "express";
import type { User as DbUser } from "@shared/schema";

declare global {
  namespace Express {
    // Tell Passport that req.user is our full DB user record.
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends DbUser {}
    interface Request {
      // Convenience alias used throughout the codebase.
      dbUser?: DbUser;
    }
  }
}

/**
 * Optional auth: passport already populates req.user when the session is valid.
 * This middleware is a no-op kept for compatibility with existing wiring.
 */
export function attachUser(_req: Request, _res: Response, next: NextFunction) {
  next();
}

/**
 * Strict auth: rejects requests without a valid logged-in session.
 * Mirrors req.user → req.dbUser so downstream route handlers keep working.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // passport's req.user IS the full DB user (see deserializeUser).
  (req as any).dbUser = req.user;
  next();
}
