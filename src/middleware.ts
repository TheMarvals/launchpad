import { auth } from "@/lib/auth";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = (req.auth?.user as any)?.role;

  // 1. Check for public routes (ignoring locale prefix)
  const isPublicRoute = (path: string) => {
    const publicPaths = [
      '/login',
      '/api/auth',
      '/api/setup',
      '/api/reset-password',
      '/_next',
      '/favicon',
      '/api/servers', // Keep APIs out of auth if they handle their own
    ];
    
    // Remove locale prefix for checking
    const pathWithoutLocale = path.replace(/^\/(en|es)/, '') || '/';
    
    if (publicPaths.some(p => pathWithoutLocale.startsWith(p)) || pathWithoutLocale === '/') {
      return true;
    }

    // Special case for PDF preview
    if (pathWithoutLocale.startsWith("/quotes/") && pathWithoutLocale.endsWith("/preview")) {
      return true;
    }

    return false;
  };

  // 2. If not authenticated and not a public route, redirect to login
  if (!req.auth && !isPublicRoute(pathname)) {
    const locale = pathname.split('/')[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-based access control (if authenticated)
  if (req.auth) {
    const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/';

    // Root redirect
    if (pathWithoutLocale === '/') {
      const locale = pathname.split('/')[1] || routing.defaultLocale;
      if (role === "CLIENT") {
        return NextResponse.redirect(new URL(`/${locale}/client-portal`, req.url));
      }
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }

    // Prevent CLIENTs from accessing /dashboard
    if (pathWithoutLocale.startsWith("/dashboard") && role === "CLIENT") {
      const locale = pathname.split('/')[1] || routing.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/client-portal`, req.url));
    }

    // Prevent ADMINs from accessing /client-portal
    if (pathWithoutLocale.startsWith("/client-portal") && role === "ADMIN") {
      const locale = pathname.split('/')[1] || routing.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
    }
  }

  // 4. Finally, let next-intl handle the locale and routing
  return intlMiddleware(req);
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(en|es)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
