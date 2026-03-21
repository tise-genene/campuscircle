import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton for client components — avoids creating a new client on every render
let client: ReturnType<typeof createClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
