import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// ─── Route groups ─────────────────────────────────────────────────────────
const PUBLIC_ROUTES = [
  "/login",
  "/auth/callback",
  "/auth/confirm",
];

const VERIFY_ROUTE = "/verify";
const SETUP_ROUTE = "/setup";
const HOME_ROUTE = "/";

// ─── Middleware ────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build a response we can attach cookies to
  let supabaseResponse = NextResponse.next({ request });

  // Create a Supabase client that reads/writes cookies via the middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always call getUser() — this refreshes the session token
  // Do not replace with getSession() — it does not validate on server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!user) {
    if (isPublicRoute) {
      // Allow through — they're on a public page
      return supabaseResponse;
    }
    // Redirect to login, preserving the intended destination
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Logged in ─────────────────────────────────────────────────────────────
  // Fetch their profile to check verification state
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified, username, display_name, university_id")
    .eq("id", user.id)
    .single();

  const isVerified = profile?.is_verified ?? false;
  const hasUsername = !!profile?.username;
  const hasUniversity = !!profile?.university_id;

  // If they're on a public (auth) route but already logged in and verified,
  // redirect them home
  if (isPublicRoute && isVerified) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = HOME_ROUTE;
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  // Allow the verify and setup routes to pass through always
  if (pathname === VERIFY_ROUTE || pathname === SETUP_ROUTE) {
    return supabaseResponse;
  }

  // ── Gate 1: Profile setup incomplete ─────────────────────────────────────
  // User signed up with Google but hasn't finished profile setup
  if (!hasUsername) {
    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = SETUP_ROUTE;
    return NextResponse.redirect(setupUrl);
  }

  // ── Gate 2: University email not verified ─────────────────────────────────
  // Block all app routes until verified
  if (!isVerified) {
    const verifyUrl = request.nextUrl.clone();
    verifyUrl.pathname = VERIFY_ROUTE;
    return NextResponse.redirect(verifyUrl);
  }

  // ── All good — user is logged in, setup complete, and verified ────────────
  return supabaseResponse;
}

// ─── Route matcher ────────────────────────────────────────────────────────
// Run middleware on all routes EXCEPT static files and Next.js internals
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
