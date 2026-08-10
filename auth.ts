import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/* ------------------------------------------------------------------ */
/* Auth.js v5 — Central Configuration                                  */
/* Google OAuth with Drive + Sheets scopes for BYOD storage            */
/* ------------------------------------------------------------------ */

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    error?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
          ].join(" "),
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, capture tokens from the Google account
      if (account) {
        token.access_token = account.access_token as string;
        token.refresh_token = account.refresh_token as string;
        token.expires_at = account.expires_at as number;
      }

      // Check if access token has expired
      if (token.expires_at && (Date.now() / 1000) > (token.expires_at as number)) {
        // Attempt to refresh
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refresh_token as string,
            }),
          });

          const refreshed = await response.json();

          if (!response.ok) throw refreshed;

          token.access_token = refreshed.access_token;
          token.expires_at = Math.floor(Date.now() / 1000) + refreshed.expires_in;
          // Google may or may not return a new refresh token
          if (refreshed.refresh_token) {
            token.refresh_token = refreshed.refresh_token;
          }
        } catch (error) {
          console.error("[auth] Token refresh failed:", error);
          token.error = "RefreshTokenError";
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.access_token as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
});
