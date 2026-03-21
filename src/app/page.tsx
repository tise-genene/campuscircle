"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const FACULTIES = [
  "Computer Science",
  "Electrical Engineering",
  "Civil Engineering",
  "Medicine",
  "Law",
  "Business & Economics",
  "Natural Sciences",
  "Social Sciences",
  "Agriculture",
  "Veterinary Medicine",
  "Pharmacy",
  "Other",
];

export default function SetupPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Username availability check (debounced) ──────────────────────────
  let usernameTimer: ReturnType<typeof setTimeout>;

  async function handleUsernameChange(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleaned);

    clearTimeout(usernameTimer);
    if (cleaned.length < 3) { setUsernameStatus("idle"); return; }

    setUsernameStatus("checking");
    usernameTimer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleaned)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 400);
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (usernameStatus !== "available" || !displayName || !faculty || !year) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username,
          display_name: displayName,
          faculty,
          year_of_study: year,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      router.push("/verify");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isValid =
    usernameStatus === "available" &&
    displayName.trim().length >= 2 &&
    faculty &&
    year !== null;

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 px-5 pt-10 pb-8">

        {/* Progress */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-teal-500" />
          </div>
          <span className="text-[10px] text-slate-400">3 / 4</span>
        </div>

        <h1
          className="text-[20px] font-extrabold text-slate-900 mb-1"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Set up your profile
        </h1>
        <p className="text-[12px] text-slate-500 mb-6">
          How other students at AAU will see you
        </p>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-[68px] h-[68px] rounded-full border-2 border-dashed border-teal-300 bg-teal-50 flex items-center justify-center text-[22px] font-extrabold text-teal-700 select-none"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            {displayName ? displayName.slice(0, 2).toUpperCase() : "?"}
          </div>
          <button className="mt-2 text-[11px] font-semibold text-teal-600">
            Add photo (optional)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-slate-400">
                @
              </span>
              <input
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="yourname"
                minLength={3}
                maxLength={20}
                required
                className={`w-full rounded-[11px] border bg-slate-50 pl-7 pr-10 py-3 text-[13px] text-slate-900 outline-none transition-colors
                  focus:bg-white
                  ${usernameStatus === "available" ? "border-teal-500" : ""}
                  ${usernameStatus === "taken" ? "border-red-400" : ""}
                  ${usernameStatus === "idle" || usernameStatus === "checking" ? "border-slate-200 focus:border-teal-400" : ""}
                `}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px]">
                {usernameStatus === "checking" && (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                )}
                {usernameStatus === "available" && (
                  <span className="text-teal-600 font-bold">✓</span>
                )}
                {usernameStatus === "taken" && (
                  <span className="text-red-500 font-bold">✗</span>
                )}
              </span>
            </div>
            {usernameStatus === "taken" && (
              <p className="mt-1 text-[10px] text-red-500">Username taken, try another</p>
            )}
            {usernameStatus === "available" && (
              <p className="mt-1 text-[10px] text-teal-600">Username available ✓</p>
            )}
            <p className="mt-1 text-[10px] text-slate-400">
              Lowercase, letters, numbers, underscores only
            </p>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Genene Tise"
              required
              className="w-full rounded-[11px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-900 outline-none focus:border-teal-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Faculty */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Faculty / Department
            </label>
            <select
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              required
              className="w-full rounded-[11px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-900 outline-none focus:border-teal-400 focus:bg-white transition-colors appearance-none"
            >
              <option value="">Select your faculty…</option>
              {FACULTIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Year of Study
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`flex-1 rounded-[9px] border py-2.5 text-[11px] font-semibold transition-colors
                    ${year === y
                      ? "border-teal-500 bg-teal-500 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                    }`}
                >
                  {y === 5 ? "5th+" : `${y}${["st","nd","rd","th"][y-1]}`}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isValid}
            className="mt-2 w-full rounded-[13px] bg-teal-600 py-[14px] text-[13px] font-semibold text-white transition-opacity disabled:opacity-40 active:scale-[0.98]"
          >
            {loading ? "Saving…" : "Let's go 🎉"}
          </button>
        </form>
      </div>
    </div>
  );
}