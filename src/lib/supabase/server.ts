import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// ─── Server Component client ───────────────────────────────────────────────
// Use inside: page.tsx, layout.tsx, route handlers, server actions
// Never use in client components (use client.ts instead)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — safe to ignore
            // The middleware handles session refresh
          }
        },
      },
    }
  );
}

// ─── Admin client (service role) ──────────────────────────────────────────
// Use ONLY in trusted server code: API routes, server actions
// NEVER expose to the client or browser
// Bypasses RLS — use with extreme care
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ─── Get current user (server-side) ───────────────────────────────────────
// Convenience helper — use in page.tsx to protect routes
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

// ─── Get current user profile (with university + trust data) ─────────────
export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      universities (
        id,
        name,
        short_name,
        domain,
        city
      )
    `
    )
    .eq("id", user.id)
    .single();

  return profile;
}
