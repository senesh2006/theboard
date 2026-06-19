import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ROLE_HOME, roleCanAccessPath } from "@/lib/auth/roles";
import { Role } from "@prisma/client";

const AUTH_ROUTES = ["/login", "/signup"];

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/auth/callback")) return true;
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) return true;
  if (pathname === "/listings") return true;
  if (pathname.startsWith("/listings/") && !pathname.startsWith("/listings/new")) {
    return true;
  }
  if (pathname === "/") return true;
  return false;
}

function getUserRole(user: { user_metadata?: Record<string, unknown> }): Role | null {
  const role = user.user_metadata?.role as Role | undefined;
  if (!role || !Object.values(Role).includes(role)) return null;
  return role;
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const role = user ? getUserRole(user) : null;

  if (pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  if (pathname.startsWith("/onboarding")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (role) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_HOME[role];
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = role ? ROLE_HOME[role] : "/onboarding";
    return NextResponse.redirect(url);
  }

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (!roleCanAccessPath(role, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role];
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
