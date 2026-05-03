import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import {
  registerPayloadSchema,
  loginPayloadSchema,
} from "@shared/schema";
import {
  signAuthToken,
  buildAuthCookie,
  buildClearAuthCookie,
  requireAuth,
} from "../middleware/auth";
import { loadCurrentUser } from "../middleware/current-user";

export const authRouter = Router();

function publicUser(u: { id: number; name: string; email: string; plan: string }) {
  return { id: u.id, name: u.name, email: u.email, plan: u.plan };
}

authRouter.post("/register", async (req: Request, res: Response) => {
  const parsed = registerPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid registration data", details: parsed.error.flatten() });
  }
  const { name, email, password, company } = parsed.data;

  try {
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await storage.createUser({
      username: email,
      password: passwordHash,
      name,
      email,
      company: company || null,
      plan: "free",
    } as any);

    const token = signAuthToken({ id: created.id, email: created.email });
    res.setHeader("Set-Cookie", buildAuthCookie(token));
    return res.status(201).json({ user: publicUser(created) });
  } catch (err: any) {
    if (err?.code === "23505" || /unique|duplicate/i.test(err?.message || "")) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    console.error("POST /api/auth/register failed:", err);
    return res.status(500).json({ error: "Failed to create account" });
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const parsed = loginPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid login data", details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  try {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signAuthToken({ id: user.id, email: user.email });
    res.setHeader("Set-Cookie", buildAuthCookie(token));
    return res.json({ user: publicUser(user) });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  res.setHeader("Set-Cookie", buildClearAuthCookie());
  return res.json({ ok: true });
});

authRouter.get("/session", requireAuth, loadCurrentUser, (req: Request, res: Response) => {
  return res.json({ user: publicUser(req.dbUser!) });
});
