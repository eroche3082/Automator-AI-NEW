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
 * Resolves the internal DB user from req.user (JWT). Must run AFTER `requireAuth`.
 */
export async function loadCurrentUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const dbUser = await storage.getUser(req.user.id);
    if (!dbUser) {
      return res.status(401).json({ error: "User no longer exists" });
    }
    req.dbUser = dbUser;
    next();
  } catch (err) {
    console.error("loadCurrentUser failed:", err);
    res.status(500).json({ error: "Failed to resolve current user" });
  }
}

export function ownedRoute(handler: (req: Request, res: Response) => unknown) {
  return async (req: Request, res: Response) => {
    if (!req.dbUser) return res.status(401).json({ error: "Authentication required" });
    return handler(req, res);
  };
}
