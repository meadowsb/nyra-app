import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

function isValidEmail(email: string): boolean {
  if (!email || email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { email: rawEmail, prompt: rawPrompt } = body as Record<
    string,
    unknown
  >;

  if (typeof rawEmail !== "string") {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const email = rawEmail.trim();
  if (!isValidEmail(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  let prompt = "";
  if (rawPrompt !== undefined && rawPrompt !== null) {
    if (typeof rawPrompt !== "string") {
      return Response.json({ error: "Invalid prompt" }, { status: 400 });
    }
    prompt = rawPrompt.trim().slice(0, 8000);
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error("[waitlist] SUPABASE_URL or SUPABASE_ANON_KEY missing");
    return Response.json({ error: "Unable to save signup" }, { status: 503 });
  }

  const { error: insertError } = await supabase.from("waitlist").insert({
    email,
    prompt,
  });

  if (insertError) {
    console.error("[waitlist] Supabase insert failed", insertError);
    return Response.json({ error: "Unable to save signup" }, { status: 500 });
  }

  console.log("[waitlist]", JSON.stringify({ email, prompt }));

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log(
      "[waitlist] RESEND_API_KEY missing — signup saved without confirmation email"
    );
  } else {
    const from =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "Nyra <onboarding@resend.dev>";

    const promptBlock = prompt
      ? `<p style="margin:16px 0 0"><strong>Your request:</strong><br />${escapeHtml(prompt).replace(/\n/g, "<br />")}</p>`
      : "";

    const html = `<p>Thank you for joining the Nyra waitlist.</p>${promptBlock}<p style="margin:16px 0 0">We&apos;ll reach out when access opens.</p>`;

    try {
      const resend = new Resend(apiKey);
      const { error: sendError } = await resend.emails.send({
        from,
        to: email,
        subject: "You're on the Nyra waitlist 💌",
        html,
      });
      if (sendError) {
        console.error("[waitlist] Resend error (signup still saved)", sendError);
      }
    } catch (err) {
      console.error("[waitlist] Resend send threw (signup still saved)", err);
    }
  }

  return Response.json({ success: true });
}
