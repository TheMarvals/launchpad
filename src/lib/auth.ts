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
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          console.log('[AUTH] Missing email or OTP');
          return null;
        }

        console.log(`[AUTH] Attempting OTP verification for: ${credentials.email}`);

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.isActive) {
            console.log('[AUTH] User not found or inactive');
            return null;
          }

          // Verify OTP
          const otpCode = credentials.otp as string;
          
          const validOtp = await prisma.otpCode.findFirst({
            where: {
              userId: user.id,
              action: 'LOGIN',
              code: otpCode,
              used: false,
              expiresAt: {
                gt: new Date() // Must not be expired
              }
            }
          });

          if (!validOtp) {
            console.log(`[AUTH] Invalid OTP for user ${user.email}`);
            return null;
          }

          // Mark OTP as used
          await prisma.otpCode.update({
            where: { id: validOtp.id },
            data: { used: true }
          });

          console.log(`[AUTH] Login successful for: ${user.email}`);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            clientId: user.clientId,
            permissions: user.permissions,
          };
        } catch (error: any) {
          console.error('[AUTH] DB ERROR:', error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.clientId = (user as any).clientId;
        token.permissions = (user as any).permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).clientId = token.clientId;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
});
