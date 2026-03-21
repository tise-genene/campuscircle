"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FeedPost, PostCategory, PostLabel } from "@/types/database";

// ─── Category config ───────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<PostCategory, { label: string; bg: string; text: string }> = {
  food:       { label: "Food",      bg: "bg-amber-50",   text: "text-amber-800" },
  housing:    { label: "Housing",   bg: "bg-blue-50",    text: "text-blue-800"  },
  edu:        { label: "Edu",       bg: "bg-purple-50",  text: "text-purple-800"},
  service:    { label: "Service",   bg: "bg-red-50",     text: "text-red-800"   },
  social:     { label: "Social",    bg: "bg-pink-50",    text: "text-pink-800"  },
  market:     { label: "Market",    bg: "bg-green-50",   text: "text-green-800" },
  transport:  { label: "Transport", bg: "bg-teal-50",    text: "text-teal-800"  },
  events:     { label: "Event",     bg: "bg-green-50",   text: "text-green-800" },
  warning:    { label: "⚠️ Warning", bg: "bg-red-50",    text: "text-red-800"   },
  confession: { label: "Anon",      bg: "bg-slate-100",  text: "text-slate-600" },
};

// ─── Label strips ──────────────────────────────────────────────────────────
const LABEL_CONFIG: Record<PostLabel, { icon: string; text: string; bg: string; color: string }> = {
  trending:  { icon: "🔥", text: "Trending in Campus", bg: "bg-amber-50",  color: "text-amber-800" },
  cheap_eat: { icon: "💸", text: "Cheap Eat",          bg: "bg-green-50",  color: "text-green-800" },
  top_pick:  { icon: "⭐", text: "Top Pick",           bg: "bg-amber-50",  color: "text-amber-800" },
  avoid:     { icon: "⚠️", text: "Warning — Avoid",    bg: "bg-red-50",    color: "text-red-800"   },
  urgent:    { icon: "🚨", text: "Urgent Alert",       bg: "bg-red-50",    color: "text-red-800"   },
  free:      { icon: "🆓", text: "Free / Giveaway",    bg: "bg-green-50",  color: "text-green-800" },
};

// ─── Trust level badges ────────────────────────────────────────────────────
const TRUST_BADGE: Record<number, { icon: string; label: string }> = {
  1: { icon: "",   label: "" },
  2: { icon: "⭐", label: "Lvl 2" },
  3: { icon: "🏅", label: "Lvl 3" },
  4: { icon: "🎖️", label: "Lvl 4" },
};

// ─── Props ─────────────────────────────────────────────────────────────────
interface PostCardProps {
  post: FeedPost;
  currentUserId?: string;
  currentUserVote?: "+1" | "-1" | null;
  onDeleted?: (id: string) => void;
}

export default function PostCard({
  post,
  currentUserId,
  currentUserVote,
  onDeleted,
}: PostCardProps) {
  const supabase = getSupabaseBrowserClient();

  const [vote, setVote]               = useState<"+1" | "-1" | null>(currentUserVote ?? null);
  const [upvotes, setUpvotes]         = useState(post.upvote_count);
  const [downvotes, setDownvotes]     = useState(post.downvote_count);
  const [comments, setComments]       = useState(post.comment_count);
  const [voteLoading, setVoteLoading] = useState(false);
  const [reported, setReported]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);

  const isOwn = currentUserId && post.user_id === currentUserId;
  const cat   = CATEGORY_CONFIG[post.category] ?? CATEGORY_CONFIG.social;
  const label = post.label ? LABEL_CONFIG[post.label] : null;
  const trust = post.trust_level ? TRUST_BADGE[post.trust_level] : null;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false });

  // ── Vote handler ──────────────────────────────────────────────────────
  async function handleVote(type: "+1" | "-1") {
    if (!currentUserId || voteLoading) return;
    setVoteLoading(true);

    const prevVote    = vote;
    const prevUp      = upvotes;
    const prevDown    = downvotes;

    // Optimistic update
    if (vote === type) {
      // Toggle off (delete vote)
      setVote(null);
      if (type === "+1") setUpvotes((v) => v - 1);
      else setDownvotes((v) => v - 1);
    } else {
      // Switch or new vote
      if (vote === "+1") setUpvotes((v) => v - 1);
      if (vote === "-1") setDownvotes((v) => v - 1);
      if (type === "+1") setUpvotes((v) => v + 1);
      if (type === "-1") setDownvotes((v) => v + 1);
      setVote(type);
    }

    try {
      if (prevVote === type) {
        await supabase
          .from("votes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", post.id);
      } else if (prevVote) {
        await supabase
          .from("votes")
          .update({ type })
          .eq("user_id", currentUserId)
          .eq("post_id", post.id);
      } else {
        await supabase
          .from("votes")
          .insert({ user_id: currentUserId, post_id: post.id, type });
      }
    } catch {
      // Rollback on error
      setVote(prevVote);
      setUpvotes(prevUp);
      setDownvotes(prevDown);
    } finally {
      setVoteLoading(false);
    }
  }

  // ── Report ────────────────────────────────────────────────────────────
  async function handleReport() {
    if (!currentUserId || reported) return;
    setMenuOpen(false);
    await supabase.from("reports").insert({
      reporter_id: currentUserId,
      target_type: "post",
      target_id: post.id,
      reason: "inappropriate", notes: "",
    });
    setReported(true);
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async function handleDelete() {
    setMenuOpen(false);
    if (!isOwn) return;
    await supabase.from("posts").delete().eq("id", post.id);
    onDeleted?.(post.id);
  }

  // ══════════════════════════════════════════════════════════════════════
  return (
    <article className="bg-white rounded-[14px] border border-slate-200/80 p-3 mb-2.5">

      {/* Label strip */}
      {label && (
        <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 mb-2 text-[10px] font-bold ${label.bg} ${label.color}`}>
          <span className="text-xs">{label.icon}</span>
          {label.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        {/* Avatar */}
        {post.is_anonymous ? (
          <div className="w-[30px] h-[30px] rounded-full bg-slate-100 flex items-center justify-center text-[11px] text-slate-400 select-none flex-shrink-0">
            👤
          </div>
        ) : (
          <div
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 bg-teal-100 text-teal-800 select-none"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {post.display_name?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
        )}

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[12px] font-semibold text-slate-900 truncate">
              {post.is_anonymous ? "Anonymous" : (post.username ?? "Unknown")}
            </span>
            {trust && trust.icon && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-50 px-1.5 py-0 text-[9px] font-bold text-teal-800">
                {trust.icon} {trust.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {post.location_name && (
              <span className="text-[10px] text-teal-700 bg-teal-50 rounded-full px-1.5 py-0 leading-4">
                📍 {post.location_name}
              </span>
            )}
            <span className="text-[10px] text-slate-400">{timeAgo} ago</span>
          </div>
        </div>

        {/* Category badge */}
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold flex-shrink-0 ${cat.bg} ${cat.text}`}>
          {cat.label}
        </span>

        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-slate-300 hover:text-slate-500 text-lg leading-none px-1"
          >
            •••
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-6 z-20 w-36 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                {isOwn ? (
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50"
                  >
                    🗑 Delete post
                  </button>
                ) : (
                  <button
                    onClick={handleReport}
                    disabled={reported}
                    className="w-full px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
                  >
                    {reported ? "✓ Reported" : "🚩 Report post"}
                  </button>
                )}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50"
                >
                  ↗ Share
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-[12.5px] text-slate-600 leading-relaxed mb-2.5">
        {post.content}
      </p>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-1 rounded-xl overflow-hidden mb-2.5 ${post.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.media_urls.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className={`w-full object-cover ${post.media_urls.length === 1 ? "max-h-48" : "h-28"}`}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-0.5">
        {/* Upvote */}
        <button
          onClick={() => handleVote("+1")}
          disabled={voteLoading}
          className={`flex items-center gap-1 text-[11px] font-semibold transition-colors
            ${vote === "+1" ? "text-teal-600" : "text-slate-400 hover:text-teal-500"}`}
        >
          ▲ {upvotes}
        </button>

        {/* Downvote */}
        <button
          onClick={() => handleVote("-1")}
          disabled={voteLoading}
          className={`flex items-center gap-1 text-[11px] transition-colors
            ${vote === "-1" ? "text-red-500" : "text-slate-300 hover:text-red-400"}`}
        >
          ▼ {downvotes > 0 ? downvotes : ""}
        </button>

        <span className="w-px h-3 bg-slate-200" />

        {/* Comments */}
        <button className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors">
          💬 {comments}
        </button>

        {/* Share */}
        <button className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors ml-auto">
          ↗ Share
        </button>
      </div>
    </article>
  );
}
