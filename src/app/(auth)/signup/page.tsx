"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleGoogleSignup() {
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-3xl mb-5">
          ✉️
        </div>
        <h1
          className="text-[22px] font-extrabold text-slate-900 text-center mb-3"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Check your email
        </h1>
        <p className="text-[13px] text-slate-500 text-center leading-relaxed mb-2">
          We sent a confirmation link to
        </p>
        <p className="text-[14px] font-semibold text-slate-900 text-center mb-6">
          {email}
        </p>
        <div className="w-full rounded-[11px] border border-emerald-200 bg-emerald-50 px-4 py-4 mb-6">
          <p className="text-[12px] text-emerald-800 leading-relaxed">
            Click the link in that email to activate your account. Then come back and log in.
          </p>
        </div>
        <button
          onClick={() => router.push("/login/email")}
          className="w-full rounded-[13px] bg-teal-600 py-[14px] text-[13px] font-semibold text-white active:scale-[0.98] transition-transform"
        >
          Go to Login
        </button>
        <button
          onClick={() => router.push("/login")}
          className="mt-3 text-[12px] text-slate-400"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  // ── Signup form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-5 pt-10 pb-8">

        {/* Back */}
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-8"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-7">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-2xl mb-4">
            🎓
          </div>
          <h1
            className="text-[24px] font-extrabold text-slate-900 mb-1"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Create account
          </h1>
          <p className="text-[13px] text-slate-500">
            Join your university&apos;s social network
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-[13px] border border-slate-200 bg-white py-[13px] text-[13px] font-semibold text-slate-700 mb-5 disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          <GoogleIcon />
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400">or sign up with email</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-[11px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="w-full rounded-[11px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              className={`w-full rounded-[11px] border bg-slate-50 px-3.5 py-3 text-[13px] text-slate-900 outline-none transition-colors
                ${confirmPassword && confirmPassword !== password
                  ? "border-red-400 focus:border-red-400"
                  : confirmPassword && confirmPassword === password
                    ? "border-teal-500 focus:border-teal-500"
                    : "border-slate-200 focus:border-teal-500"
                }`}
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="mt-1 text-[10px] text-red-500">Passwords do not match</p>
            )}
            {confirmPassword && confirmPassword === password && (
              <p className="mt-1 text-[10px] text-teal-600">Passwords match ✓</p>
            )}
          </div>

          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-[13px] bg-teal-600 py-[14px] text-[13px] font-semibold text-white disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

        </form>

        <p className="mt-6 text-center text-[12px] text-slate-500">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login/email")}
            className="text-teal-600 font-semibold"
          >
            Log in
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
