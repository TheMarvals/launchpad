import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        console.log(`[AUTH] Attempting login for: ${credentials.email}`);
        console.log(`[AUTH] DATABASE_URL defined: ${!!process.env.DATABASE_URL}`);
        console.log(`[AUTH] DB host: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? 'unknown'}`);

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          console.log(`[AUTH] User found: ${!!user}, active: ${user?.isActive}`);

          if (!user || !user.isActive) {
            console.log('[AUTH] User not found or inactive');
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          console.log(`[AUTH] Password valid: ${isValid}`);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            clientId: user.clientId,
          };
        } catch (error: any) {
          console.error('[AUTH] DB ERROR:', error.message);
          return null;
        }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.clientId = (user as any).clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).clientId = token.clientId;
      }
      return session;
    },
  },
});
