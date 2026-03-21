"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(165deg, #0D9488 0%, #0F172A 58%)" }}
    >
      {/* Rings */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute top-8 right-8 w-44 h-44 rounded-full bg-white/[0.04] pointer-events-none" />
      <div className="absolute bottom-32 -left-16 w-48 h-48 rounded-full bg-white/[0.03] pointer-events-none" />

      {/* Top */}
      <div className="relative z-10 px-6 pt-14">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-4">
          🎓
        </div>
        <p className="text-white/40 text-[11px] font-semibold tracking-widest uppercase mb-1">
          Welcome to
        </p>
        <h1
          className="text-white font-extrabold leading-none mb-3"
          style={{ fontSize: 42, fontFamily: "'Syne', sans-serif" }}
        >
          Campus<br />Circle
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          Your university&apos;s own social network.{" "}
          <span className="text-white/85 font-semibold">Verified students only.</span>
        </p>
      </div>

      {/* What's waiting */}
      <div className="relative z-10 mx-6 mt-7 rounded-xl border border-white/10 bg-white/[0.07] p-4">
        <p className="text-[10px] font-bold text-teal-300 tracking-widest uppercase mb-3">
          What&apos;s waiting for you
        </p>
        <div className="flex flex-col gap-2">
          {[
            ["Cheap eats near campus today"],
            ["Live campus alerts & notices"],
            ["Top-rated spots by real students"],
            ["Anonymous confessions board"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-[11px] text-white/80">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 mt-auto px-6 pb-10">
        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-[13px] bg-white px-5 py-[14px] text-[13px] font-semibold text-slate-800 mb-3 disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-white/15" />
          <span className="text-[11px] text-white/40">or</span>
          <div className="flex-1 h-px bg-white/15" />
        </div>

        {/* Sign up with email */}
        <button
          onClick={() => router.push("/signup")}
          className="w-full rounded-[13px] bg-white/10 border border-white/15 py-[13px] text-[13px] font-semibold text-white mb-4 active:scale-[0.98] transition-transform"
        >
          Sign up with Email
        </button>

        {error && (
          <div className="mb-3 rounded-[10px] border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-[11px] text-red-300">
            {error}
          </div>
        )}

        <p className="text-center text-[12px] text-white/45">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login/email")}
            className="text-teal-300 font-semibold"
          >
            Log in with email
          </button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844a4.14 4.14 0 01-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
