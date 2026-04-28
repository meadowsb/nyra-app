import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const {
    firstName: rawFirstName,
    email: rawEmail,
    prompt: rawPrompt,
  } = body as Record<string, unknown>;

  if (typeof rawFirstName !== "string") {
    return Response.json({ error: "First name is required" }, { status: 400 });
  }

  const firstName = rawFirstName.trim();
  if (!firstName) {
    return Response.json({ error: "First name is required" }, { status: 400 });
  }
  if (firstName.length > 120) {
    return Response.json({ error: "First name is too long" }, { status: 400 });
  }

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
    first_name: firstName,
    email,
    prompt,
  });

  if (insertError) {
    console.error("[waitlist] Supabase insert failed", insertError);
    return Response.json({ error: "Unable to save signup" }, { status: 500 });
  }

  console.log("[waitlist]", JSON.stringify({ firstName, email, prompt }));

  try {
    if (!process.env.RESEND_API_KEY?.trim()) {
      console.error(
        "[waitlist] RESEND_API_KEY missing — signup saved without confirmation email"
      );
    } else {
      const safeName = firstName?.trim() || "there";
      const { error: sendError } = await resend.emails.send({
        from: "Nyra <hello@meetnyra.com>",
        to: email,
        subject: "You're on the Nyra list ✨",
        html: `<p>Hi ${safeName},</p>

<p>Thanks for joining Nyra.</p>

<p>We're building a simpler way to plan a wedding — without the back-and-forth.</p>

<p>You'll be among the first to try it when we open things up.</p>

<p>— Nyra</p>`,
      });

      if (sendError) {
        console.error("[waitlist] Resend error (signup still saved)", sendError);
      }
    }
  } catch (err) {
    console.error("[waitlist] Resend send threw (signup still saved)", err);
  }

  return Response.json({ success: true });
}
