"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/* ------------------------------------------------------------------ */
/* Client-side SessionProvider wrapper for use in layout.tsx           */
/* ------------------------------------------------------------------ */

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
