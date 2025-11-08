import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { ensureGuest } from "@/lib/auth/guest";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Guest",
      credentials: {},
      async authorize() {
        const user = await ensureGuest();
        return { id: user.id, name: user.anonId };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user = {
          id: token.userId as string,
          name: session.user?.name ?? "Guest",
        };
      }
      return session;
    },
  },
};
