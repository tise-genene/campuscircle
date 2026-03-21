// src/app/api/auth/verify-otp/route.ts
//
// POST /api/auth/verify-otp
// Body: { university_email: string, otp: string }

import { NextResponse } from "next/server";
import { createAdminClient, getUser } from "@/lib/supabase/server";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { university_email, otp } = body as {
      university_email: string;
      otp: string;
    };

    if (!university_email || !otp || otp.length !== 6) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Find the most recent unused, unexpired OTP for this user
    const { data: record } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("university_email", university_email.toLowerCase())
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!record) {
      return NextResponse.json(
        { error: "Code expired or not found. Request a new one." },
        { status: 400 }
      );
    }

    // Check attempt limit
    if (record.attempts >= 3) {
      await supabase
        .from("otp_verifications")
        .update({ used: true })
        .eq("id", record.id);
      return NextResponse.json(
        { error: "Too many failed attempts. Request a new code." },
        { status: 429 }
      );
    }

    // Verify the hash
    const inputHash = createHash("sha256").update(otp).digest("hex");
    if (inputHash !== record.otp_hash) {
      // Increment attempts
      await supabase
        .from("otp_verifications")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);

      const remaining = 3 - (record.attempts + 1);
      return NextResponse.json(
        { error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
        { status: 400 }
      );
    }

    // ── SUCCESS ──────────────────────────────────────────────────────────

    // Get the university_id for this email domain
    const emailDomain = university_email.split("@")[1]?.toLowerCase();
    const { data: university } = await supabase
      .from("universities")
      .select("id")
      .eq("domain", emailDomain)
      .single();

    // Mark OTP as used
    await supabase
      .from("otp_verifications")
      .update({ used: true })
      .eq("id", record.id);

    // Update profile: verified + store university email + link university
    await supabase
      .from("profiles")
      .update({
        university_email: university_email.toLowerCase(),
        university_id: university?.id ?? null,
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Award +1 trust for completing verification
    await supabase
      .from("profiles")
      .update({ trust_score: 1 })
      .eq("id", user.id)
      .eq("trust_score", 0); // only if they have 0 (first time)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}