import { redirect } from "next/navigation";
import { createClient, getUserProfile } from "@/lib/supabase/server";
import FeedClient from "./feed-client";

// This is a Server Component — it fetches data then passes to the client
export default async function HomePage() {
  const profile = await getUserProfile();

  // Middleware handles this but double-check for safety
  if (!profile) redirect("/login");
  if (!profile.is_verified) redirect("/verify");

  const supabase = await createClient();

  // Initial feed load — server side for instant paint, no loading spinner
  const { data: posts } = await supabase
    .rpc("get_campus_feed", {
      p_user_id: profile.id,
      p_limit: 20,
      p_offset: 0,
    });

  // Get the current user's votes on these posts
  const postIds = (posts ?? []).map((p) => p.id);
  const { data: votes } = postIds.length
    ? await supabase
        .from("votes")
        .select("post_id, type")
        .eq("user_id", profile.id)
        .in("post_id", postIds)
    : { data: [] };

  const voteMap = Object.fromEntries(
    (votes ?? []).map((v) => [v.post_id, v.type as "+1" | "-1"])
  );

  // Unread notification count for bell badge
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("is_read", false);

  return (
    <FeedClient
      initialPosts={posts ?? []}
      voteMap={voteMap}
      profile={profile}
      unreadCount={unreadCount ?? 0}
    />
  );
}
