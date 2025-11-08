import NextAuth from "next-auth";

import { authOptions } from "./options";

export const { handlers: authHandlers, auth, signIn, signOut } = NextAuth(authOptions);
