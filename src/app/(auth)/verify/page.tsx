"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Step = "email" | "otp";

export default function VerifyPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [step, setStep] = useState<Step>("email");
  const [universityEmail, setUniversityEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [expireSeconds, setExpireSeconds] = useState(15 * 60);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timers
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  useEffect(() => {
    if (step !== "otp" || expireSeconds <= 0) return;
    const t = setTimeout(() => setExpireSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, expireSeconds]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // ── Step 1: Send OTP ───────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!universityEmail.endsWith(".edu.et") && !universityEmail.includes("aau.edu")) {
      setError("Please use your official university email (e.g. name@aau.edu.et)");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ university_email: universityEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");

      setStep("otp");
      setResendSeconds(60);
      setExpireSeconds(15 * 60);
      setAttempts(0);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP input handling ─────────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1); // one digit per box
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    text.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ university_email: universityEmail, otp: code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAttempts((a) => a + 1);
        throw new Error(data.error ?? "Invalid code");
      }

      // Success — refresh session so middleware sees is_verified = true
      await supabase.auth.refreshSession();
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendSeconds > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    // Re-trigger send
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSendOtp(fakeEvent);
  }

  const otpComplete = otp.every(Boolean);
  const expireProgress = (expireSeconds / (15 * 60)) * 100;

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-5 pt-12 pb-8 flex flex-col">

        {/* ── STEP: EMAIL ─────────────────────────────────────────────── */}
        {step === "email" && (
          <>
            <div className="w-11 h-11 rounded-[13px] bg-teal-50 flex items-center justify-center text-xl mb-4">
              🏫
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-900 leading-tight mb-2"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Verify your<br />campus email
            </h1>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
              Enter your university email. Only{" "}
              <span className="font-semibold text-slate-700">@aau.edu.et</span>{" "}
              addresses get full access.
            </p>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  University Email
                </label>
                <input
                  type="email"
                  value={universityEmail}
                  onChange={(e) => setUniversityEmail(e.target.value)}
                  placeholder="yourname@aau.edu.et"
                  required
                  className="w-full rounded-[11px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-900 outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Info box */}
              <div className="flex gap-2.5 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <span className="text-sm mt-0.5">💡</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  We&apos;ll send a 6-digit code. Expires in 15 min. Max 3
                  attempts/hour to prevent spam.
                </p>
              </div>

              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !universityEmail}
                className="mt-2 w-full rounded-[13px] bg-teal-600 py-[14px] text-[13px] font-semibold text-white transition-opacity disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? "Sending…" : "Send Verification Code →"}
              </button>
            </form>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              Wrong email?{" "}
              <button className="font-semibold text-teal-600">Change it</button>
            </p>

            {/* Supported universities */}
            <div className="mt-6 rounded-[11px] border border-slate-200 bg-slate-50 px-3.5 py-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Supported right now
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700">
                  AAU ✓
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-400">
                  + 12 coming soon
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── STEP: OTP ───────────────────────────────────────────────── */}
        {step === "otp" && (
          <>
            <div className="text-[22px] mb-3">✉️</div>
            <h1 className="text-[21px] font-extrabold text-slate-900 leading-tight mb-1.5"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Check your email
            </h1>
            <p className="text-[13px] text-slate-500 mb-1">
              6-digit code sent to
            </p>
            <p className="text-[13px] font-semibold text-slate-900 mb-6">
              {universityEmail}
            </p>

            <form onSubmit={handleVerifyOtp}>
              {/* OTP boxes */}
              <div className="flex gap-2.5 justify-center mb-5" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-[44px] h-[52px] rounded-[11px] border text-center text-[20px] font-bold outline-none transition-all
                      ${digit
                        ? "border-teal-500 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-slate-50 text-slate-900 focus:border-teal-500 focus:bg-white"
                      }`}
                  />
                ))}
              </div>

              {/* Expiry progress bar */}
              <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-1000"
                  style={{ width: `${expireProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-5">
                <span>Expires in {formatTime(expireSeconds)}</span>
                <span>Attempt {attempts + 1} of 3</span>
              </div>

              {error && (
                <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
                  {error}
                </div>
              )}

              {attempts >= 2 && (
                <div className="mb-4 flex gap-2 rounded-[10px] border border-orange-200 bg-orange-50 px-3 py-2.5">
                  <span className="text-sm">⚠️</span>
                  <p className="text-[11px] text-orange-800">
                    1 attempt remaining. Too many failures lock verification for
                    1 hour.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !otpComplete}
                className="w-full rounded-[13px] bg-teal-600 py-[14px] text-[13px] font-semibold text-white transition-opacity disabled:opacity-40 active:scale-[0.98]"
              >
                {loading ? "Verifying…" : "Verify Code"}
              </button>
            </form>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              Didn&apos;t get it?{" "}
              <button
                onClick={handleResend}
                disabled={resendSeconds > 0}
                className="font-semibold text-teal-600 disabled:text-slate-400"
              >
                {resendSeconds > 0
                  ? `Resend in 0:${resendSeconds.toString().padStart(2, "0")}`
                  : "Resend code"}
              </button>
            </p>

            <button
              onClick={() => { setStep("email"); setError(null); setOtp(["","","","","",""]); }}
              className="mt-3 text-center text-[11px] text-slate-400 w-full"
            >
              ← Use a different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}