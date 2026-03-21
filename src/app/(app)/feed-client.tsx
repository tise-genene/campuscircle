"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import PostCard from "@/components/feed/PostCard";
import BottomNav from "@/components/layout/BottomNav";
import type { FeedPost, PostCategory, ProfileWithUniversity } from "@/types/database";

const CATEGORIES: { label: string; value: PostCategory | "all" }[] = [
  { label: "🏫 Near Campus", value: "all"       },
  { label: "💸 Cheap Eats",  value: "food"      },
  { label: "📚 Notes",       value: "edu"       },
  { label: "🏠 Rooms",       value: "housing"   },
  { label: "⚠️ Avoid",       value: "warning"   },
  { label: "🤫 Confess",     value: "confession"},
  { label: "🛒 Market",      value: "market"    },
  { label: "🎭 Events",      value: "events"    },
];

interface FeedClientProps {
  initialPosts: FeedPost[];
  voteMap: Record<string, "+1" | "-1">;
  profile: ProfileWithUniversity;
  unreadCount: number;
}

export default function FeedClient({
  initialPosts,
  voteMap: initialVoteMap,
  profile,
  unreadCount,
}: FeedClientProps) {
  const supabase     = getSupabaseBrowserClient();
  const router       = useRouter();
  const loaderRef    = useRef<HTMLDivElement | null>(null);

  const [posts,     setPosts]     = useState<FeedPost[]>(initialPosts);
  const [voteMap,   setVoteMap]   = useState(initialVoteMap);
  const [category,  setCategory]  = useState<PostCategory | "all">("all");
  const [offset,    setOffset]    = useState(initialPosts.length);
  const [loading,   setLoading]   = useState(false);
  const [hasMore,   setHasMore]   = useState(initialPosts.length === 20);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  // ── Real-time: new posts + votes ──────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("feed-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `university_id=eq.${profile.university_id}`,
        },
        (payload) => {
          const newPost = payload.new as FeedPost;
          if (newPost.status !== "active") return;
          // Prepend new post if matching current filter
          if (category === "all" || newPost.category === category) {
            setPosts((prev) => [newPost, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          const updated = payload.new as FeedPost;
          setPosts((prev) =>
            prev.map((p) =>
              p.id === updated.id
                ? { ...p, upvote_count: updated.upvote_count, downvote_count: updated.downvote_count, score: updated.score }
                : p
            )
          );
        }
      )
      .subscribe();

    // Real-time campus alerts
    const alertChannel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "campus_alerts",
          filter: `university_id=eq.${profile.university_id}`,
        },
        (payload) => {
          const alert = payload.new as { title: string; severity: string };
          if (alert.severity === "urgent") {
            setLiveAlert(alert.title);
            setTimeout(() => setLiveAlert(null), 8000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(alertChannel);
    };
  }, [supabase, profile.university_id, category]);

  // ── Infinite scroll ───────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const { data } = await supabase.rpc("get_campus_feed", {
      p_user_id:  profile.id,
      p_category: category === "all" ? null : category,
      p_limit:    20,
      p_offset:   offset,
    });

    if (!data || data.length < 20) setHasMore(false);
    if (data && data.length > 0) {
      setPosts((prev) => [...prev, ...data]);
      setOffset((o) => o + data.length);

      // Fetch votes for new posts
      const ids = data.map((p: FeedPost) => p.id);
      const { data: newVotes } = await supabase
        .from("votes")
        .select("post_id, type")
        .eq("user_id", profile.id)
        .in("post_id", ids);

      if (newVotes) {
        setVoteMap((prev) => ({
          ...prev,
          ...Object.fromEntries(newVotes.map((v) => [v.post_id, v.type as "+1" | "-1"])),
        }));
      }
    }
    setLoading(false);
  }, [loading, hasMore, offset, category, profile.id, supabase]);

  // Intersection observer for infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Category change: reset and reload ────────────────────────────────
  async function handleCategoryChange(cat: PostCategory | "all") {
    setCategory(cat);
    setOffset(0);
    setHasMore(true);

    const { data } = await supabase.rpc("get_campus_feed", {
      p_user_id:  profile.id,
      p_category: cat === "all" ? null : cat,
      p_limit:    20,
      p_offset:   0,
    });

    setPosts(data ?? []);
    setOffset(data?.length ?? 0);
    setHasMore((data?.length ?? 0) === 20);

    if (data && data.length > 0) {
      const ids = data.map((p: FeedPost) => p.id);
      const { data: newVotes } = await supabase
        .from("votes")
        .select("post_id, type")
        .eq("user_id", profile.id)
        .in("post_id", ids);
      if (newVotes) {
        setVoteMap(Object.fromEntries(newVotes.map((v) => [v.post_id, v.type as "+1" | "-1"])));
      }
    }
  }

  function handlePostDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Instant value banner stats ────────────────────────────────────────
  // eslint-disable-next-line react-hooks/purity
  const nowRef = useRef(Date.now());
const DAY_MS = 24 * 60 * 60 * 1000;
const todayPosts   = posts.filter(
  (p) => nowRef.current - new Date(p.created_at).getTime() < DAY_MS
);
const dealCount    = todayPosts.filter((p) => p.label === "cheap_eat").length;
const warningCount = todayPosts.filter((p) => p.category === "warning").length;
const hotCount     = todayPosts.filter((p) => p.label === "trending").length;

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ── Urgent live alert toast ──────────────────────────────────── */}
      {liveAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 text-[12px] font-semibold flex items-center gap-2 shadow-lg">
          <span>🚨</span>
          <span className="flex-1">{liveAlert}</span>
          <button onClick={() => setLiveAlert(null)} className="text-white/70 text-lg">✕</button>
        </div>
      )}

      {/* ── Sticky header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200/80">
        {/* Status bar space */}
        <div className="h-[44px] flex items-center justify-between px-4">
          <span className="text-[13px] font-semibold text-slate-900">9:41</span>
        </div>

        {/* App bar */}
        <div className="flex items-center justify-between px-4 pb-2.5">
          <h1
            className="text-[18px] font-extrabold text-teal-600"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            CampusCircle
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/search")}
              className="w-[34px] h-[34px] rounded-[10px] bg-slate-50 border border-slate-200 flex items-center justify-center text-[15px]"
            >
              🔍
            </button>
            <button
              onClick={() => router.push("/notifications")}
              className="w-[34px] h-[34px] rounded-[10px] bg-slate-50 border border-slate-200 flex items-center justify-center text-[15px] relative"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-red-500 border border-white" />
              )}
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCategoryChange(c.value)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-colors whitespace-nowrap
                ${category === c.value
                  ? "bg-teal-600 text-white border-teal-600"
                  : c.value === "warning"
                    ? "bg-red-50 text-red-800 border-red-200"
                    : c.value === "food"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-white text-slate-600 border-slate-200"
                }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────── */}
      <div className="px-3.5 pt-3">

        {/* Instant value banner */}
        <div
          className="rounded-[13px] p-3.5 mb-3 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0D9488, #0F6E56)" }}
        >
          <div className="absolute top-[-25px] right-[-25px] w-[110px] h-[110px] rounded-full bg-white/5" />
          <p
            className="text-[13px] font-bold text-white mb-1"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            📍 Near {profile.universities?.short_name ?? "Campus"} right now
          </p>
          <p className="text-[10px] text-white/60 mb-2.5">Live · Updated every 5 min</p>
          <div className="flex gap-1.5">
            {[
              { icon: "🍜", val: `${dealCount || "-"} deals` },
              { icon: "⚠️", val: `${warningCount || "-"} alerts` },
              { icon: "🔥", val: `${hotCount || "-"} trending` },
              { icon: "📝", val: `${posts.length} posts` },
            ].map((s) => (
              <div
                key={s.val}
                className="flex-1 rounded-lg bg-white/[0.13] px-1 py-2 text-center"
              >
                <div className="text-[14px] mb-0.5">{s.icon}</div>
                <div className="text-[9px] text-white font-medium">{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 && !loading ? (
          <EmptyState category={category} onPost={() => router.push("/compose")} />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={profile.id}
              currentUserVote={voteMap[post.id] ?? null}
              onDeleted={handlePostDeleted}
            />
          ))
        )}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="py-4 flex justify-center">
          {loading && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-[11px] text-slate-400">You&apos;ve seen everything 🎉</p>
          )}
        </div>
      </div>

      {/* ── FAB ────────────────────────────────────────────────────── */}
      <button
        onClick={() => router.push("/compose")}
        className="fixed bottom-[72px] right-4 z-20 w-[50px] h-[50px] rounded-full bg-teal-600 flex items-center justify-center text-white text-[22px] shadow-lg shadow-teal-500/40 active:scale-95 transition-transform"
      >
        +
      </button>

      {/* ── Bottom nav ──────────────────────────────────────────────── */}
      <BottomNav active="home" />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────
function EmptyState({
  category,
  onPost,
}: {
  category: PostCategory | "all";
  onPost: () => void;
}) {
  const suggestions = [
    { icon: "🍜", title: "Best food spot near campus",    sub: "Students are always hungry 😅" },
    { icon: "⚠️", title: "Warn about a dodgy place",     sub: "Help fellow students stay safe" },
    { icon: "📚", title: "Share course notes",            sub: "+2 trust points per upload"    },
    { icon: "🤫", title: "Post an anonymous confession",  sub: "No name shown. 3/day limit."   },
  ];

  return (
    <div className="pt-2">
      {/* Welcome banner */}
      <div
        className="rounded-[13px] p-4 mb-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D9488, #0F6E56)" }}
      >
        <p className="text-[13px] font-bold text-white mb-1"
          style={{ fontFamily: "'Syne', sans-serif" }}>
          👋 Be the first to post
          {category !== "all" ? ` in ${category}` : ""}!
        </p>
        <p className="text-[11px] text-white/65">
          Set the vibe for your campus community.
        </p>
      </div>

      <p className="text-[12px] font-semibold text-slate-700 mb-3">
        What should you post first?
      </p>

      <div className="flex flex-col gap-2.5">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={onPost}
            className="flex items-center gap-3 bg-white rounded-[11px] border border-slate-200 p-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-[9px] bg-slate-100 flex items-center justify-center text-[18px] flex-shrink-0">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-900">{s.title}</p>
              <p className="text-[10px] text-slate-400">{s.sub}</p>
            </div>
            <span className="text-teal-500 text-[15px] flex-shrink-0">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
