import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
export const AUTH_COOKIE = "auth_token";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

if (!JWT_SECRET) {
  console.warn(
    "⚠️ JWT_SECRET is not set. Authentication will refuse all requests until it is configured."
  );
}

export interface AuthUser {
  id: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signAuthToken(user: AuthUser): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function buildAuthCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${AUTH_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${TOKEN_TTL_SECONDS}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export function buildClearAuthCookie(): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${AUTH_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

function extractToken(req: Request): string | null {
  // Prefer cookie; fall back to Authorization: Bearer for API clients.
  const cookieToken = (req as any).cookies?.[AUTH_COOKIE];
  if (cookieToken && typeof cookieToken === "string") return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

function verifyToken(token: string): AuthUser | null {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (typeof decoded.sub !== "number" && typeof decoded.sub !== "string") return null;
    const id = typeof decoded.sub === "number" ? decoded.sub : parseInt(decoded.sub, 10);
    if (!Number.isFinite(id)) return null;
    return { id, email: typeof decoded.email === "string" ? decoded.email : "" };
  } catch {
    return null;
  }
}

/**
 * Optional auth: attaches req.user if a valid token is present.
 * Does NOT block requests without a token.
 */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();
  const user = verifyToken(token);
  if (user) req.user = user;
  next();
}

/**
 * Strict auth: rejects requests without a valid JWT.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!JWT_SECRET) {
    return res.status(503).json({ error: "Authentication service unavailable" });
  }
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = user;
  next();
}
