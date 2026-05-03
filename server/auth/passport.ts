import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import { storage } from "../storage";
import type { User } from "@shared/schema";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";
// Cloud Run / Vercel: PUBLIC_BASE_URL must be set to e.g. https://app.example.com.
const CALLBACK_URL = `${PUBLIC_BASE_URL}/api/auth/google/callback`;

export function configurePassport() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn(
      "⚠️ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set. Google OAuth will be disabled."
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        // Use proxy headers so the redirect URL is built correctly behind
        // load balancers (Cloud Run, Vercel, etc.).
        proxy: true,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: any, user?: User) => void
      ) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || email || "Google User";
          const image = profile.photos?.[0]?.value || null;

          if (!email) {
            return done(new Error("Google account has no email."));
          }

          let user = await storage.getUserByGoogleId(googleId);

          if (!user) {
            // Account-link: if a user with this email already exists (created
            // before OAuth), attach the googleId to it instead of failing.
            const byEmail = await storage.getUserByEmail(email);
            if (byEmail) {
              const linked = await storage.updateUser(byEmail.id, {
                googleId,
                image: image ?? byEmail.image,
                name: byEmail.name || name,
                updatedAt: new Date(),
              });
              user = linked || byEmail;
            } else {
              user = await storage.createUser({
                googleId,
                email,
                username: email,
                name,
                image: image || undefined,
                plan: "free",
              } as any);
            }
          } else if (image && image !== user.image) {
            // Refresh profile photo on subsequent sign-ins.
            const updated = await storage.updateUser(user.id, { image, updatedAt: new Date() });
            user = updated || user;
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
