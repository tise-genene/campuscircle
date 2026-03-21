// src/app/api/auth/send-otp/route.ts
//
// POST /api/auth/send-otp
// Body: { university_email: string }
//
// 1. Validates the email domain against the universities table
// 2. Generates a 6-digit OTP
// 3. Stores the hashed OTP in otp_verifications
// 4. Sends the email via Resend (or logs it in dev)

import { NextResponse } from "next/server";
import { createAdminClient, getUser } from "@/lib/supabase/server";
import { createHash, randomInt } from "crypto";

// Rate limit: max 3 OTPs per user per hour (enforced via otp_verifications count)
const MAX_OTPs_PER_HOUR = 3;

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { university_email } = body as { university_email: string };

    if (!university_email || typeof university_email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const emailDomain = university_email.split("@")[1]?.toLowerCase();
    if (!emailDomain) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Validate domain is a registered university
    const { data: university } = await supabase
      .from("universities")
      .select("id, name, short_name")
      .eq("domain", emailDomain)
      .eq("is_active", true)
      .single();

    if (!university) {
      return NextResponse.json(
        { error: `${emailDomain} is not a supported university domain` },
        { status: 400 }
      );
    }

    // 2. Rate limit — max 3 OTPs in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("otp_verifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("created_at", oneHourAgo);

    if ((count ?? 0) >= MAX_OTPs_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many verification attempts. Try again in 1 hour." },
        { status: 429 }
      );
    }

    // 3. Generate 6-digit OTP
    const otp = String(randomInt(100000, 999999));
    const otpHash = createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // 4. Save to DB (invalidating any previous unused OTPs)
    await supabase
      .from("otp_verifications")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    await supabase.from("otp_verifications").insert({
      user_id: user.id,
      university_email: university_email.toLowerCase(),
      otp_hash: otpHash,
      expires_at: expiresAt,
    });

    // 5. Send email
    // In production: use Resend (https://resend.com)
    // npm install resend
    //
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'CampusCircle <noreply@campuscircle.app>',
    //   to: university_email,
    //   subject: `Your CampusCircle verification code: ${otp}`,
    //   html: `
    //     <h2>Verify your ${university.short_name} email</h2>
    //     <p>Your verification code is:</p>
    //     <h1 style="letter-spacing: 8px; font-size: 40px;">${otp}</h1>
    //     <p>Expires in 15 minutes. Do not share this code.</p>
    //   `,
    // });

    // DEV: log the OTP to console
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔐 OTP for ${university_email}: ${otp}\n`);
    }

    return NextResponse.json({
      success: true,
      message: `Code sent to ${university_email}`,
      // In dev, return OTP directly so you can test without email setup
      ...(process.env.NODE_ENV === "development" ? { dev_otp: otp } : {}),
    });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// ============================================================
// src/app/api/auth/verify-otp/route.ts
//
// POST /api/auth/verify-otp
// Body: { university_email: string, otp: string }
// ============================================================
// NOTE: Put this in a separate file: src/app/api/auth/verify-otp/route.ts

export async function PUT(request: Request) {
  // This export is a placeholder comment only.
  // The verify-otp route is in the file below.
  return NextResponse.json({ error: "Use POST /api/auth/verify-otp" }, { status: 405 });
}
