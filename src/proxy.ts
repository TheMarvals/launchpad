import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/api/reset-password") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Allow PDF preview routes (used by Puppeteer)
  if (pathname.startsWith("/quotes/") && pathname.endsWith("/preview")) {
    return NextResponse.next();
  }

  // Protect routes and check roles
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (req.auth.user as any).role;

  // Root redirect for logged-in users
  if (pathname === "/") {
    if (role === "CLIENT") {
      return NextResponse.redirect(new URL("/client-portal", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Prevent CLIENTs from accessing /dashboard
  if (pathname.startsWith("/dashboard") && role === "CLIENT") {
    return NextResponse.redirect(new URL("/client-portal", req.url));
  }

  // Prevent ADMINs from accessing /client-portal (optional, but keeps it clean)
  if (pathname.startsWith("/client-portal") && role === "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
