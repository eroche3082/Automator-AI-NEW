import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configurePassport } from "./auth/passport";

const app = express();

// Trust the first proxy hop. Required so Express knows the request was HTTPS
// when behind Cloud Run / Vercel / any load balancer; without this `Secure`
// cookies are silently dropped.
app.set("trust proxy", 1);

// Capture the raw body for webhook signature verification (e.g. Stripe).
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// ─── Sessions backed by Postgres (Neon) ────────────────────────────────
const PgStore = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === "production") {
    // Fail fast: refusing to start with a predictable signing key in prod.
    throw new Error(
      "SESSION_SECRET is required in production. Refusing to start the server."
    );
  }
  console.warn(
    "⚠️ SESSION_SECRET is not set. Using an ephemeral dev secret. Set SESSION_SECRET before deploying."
  );
}

app.use(
  session({
    name: "automator.sid",
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret || "dev-only-insecure-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ─── Passport (Google OAuth) ────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ─── Request logging ────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Guard: any /api/* route that wasn't handled above must return a JSON 404.
  app.use("/api", (req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found", path: req.originalUrl, method: req.method });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Cloud Run injects PORT (typically 8080); fall back to 5000 for local dev.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`LIVE: http://localhost:${port} (port ${port})`);
    }
  );
})();
