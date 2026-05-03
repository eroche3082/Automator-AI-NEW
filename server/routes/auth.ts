import { Router, type Request, type Response, type NextFunction } from "express";
import passport from "passport";

export const authRouter = Router();

const FAILURE_REDIRECT = "/login?error=oauth_failed";
const SUCCESS_REDIRECT = "/";

/**
 * Start the Google OAuth dance. The user is redirected to Google's consent screen.
 * Requesting "profile" + "email" scopes — minimal and what the strategy expects.
 */
authRouter.get(
  "/google",
  (req: Request, res: Response, next: NextFunction) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res
        .status(503)
        .json({ error: "Google OAuth is not configured on this server." });
    }
    // CSRF protection: Passport generates a random `state` parameter, stores
    // it in req.session, and verifies it on the callback. The runtime accepts
    // `state: true`; cast because the d.ts types it as `string`.
    return passport.authenticate("google", {
      scope: ["profile", "email"],
      state: true as unknown as string,
    })(req, res, next);
  }
);

/**
 * Google redirects back here. Passport exchanges the code, runs the verify
 * callback (creates/links user), and on success establishes the session cookie.
 */
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: FAILURE_REDIRECT,
    failureMessage: true,
  }),
  (_req: Request, res: Response) => {
    res.redirect(SUCCESS_REDIRECT);
  }
);

/**
 * Destroy the session and clear the cookie.
 */
authRouter.post("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    req.session?.destroy(() => {
      // Clear with matching options so the cookie is actually invalidated.
      res.clearCookie("automator.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      res.json({ ok: true });
    });
  });
});

/**
 * Returns the current user (or 401 if no session).
 */
authRouter.get("/session", (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const u = req.user as any;
  res.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image ?? null,
      plan: u.plan,
    },
  });
});
