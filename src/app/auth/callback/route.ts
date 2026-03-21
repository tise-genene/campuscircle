import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This route is what Google redirects back to after OAuth
// Supabase exchanges the code for a session, then we redirect the user
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Middleware will handle redirecting to /verify or /setup if needed
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send back to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}