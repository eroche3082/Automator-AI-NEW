import type { Request, Response, NextFunction } from "express";

/**
 * Compatibility shim. Passport's deserializeUser already loads the full DB
 * user into req.user, and `requireAuth` mirrors it to req.dbUser. This
 * middleware is kept as a no-op so existing route arrays `[requireAuth, loadCurrentUser]`
 * keep compiling.
 */
export function loadCurrentUser(req: Request, res: Response, next: NextFunction) {
  if (!req.dbUser) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function ownedRoute(handler: (req: Request, res: Response) => unknown) {
  return async (req: Request, res: Response) => {
    if (!req.dbUser) return res.status(401).json({ error: "Authentication required" });
    return handler(req, res);
  };
}
