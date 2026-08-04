import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      clientId?: string | null
      permissions: string[]
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    clientId?: string | null
    permissions: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    clientId?: string | null
    permissions: string[]
  }
}

declare module "@novnc/novnc";
