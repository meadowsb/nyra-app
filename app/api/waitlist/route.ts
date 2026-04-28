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

  try {
    if (!process.env.RESEND_API_KEY?.trim()) {
      console.error(
        "[waitlist] RESEND_API_KEY missing — signup saved without confirmation email"
      );
    } else {
      const { error: sendError } = await resend.emails.send({
        from: "Nyra <hello@meetnyra.com>",
        to: email,
        subject: "You’re on the Nyra list",
        html: [
          "<p>Hi there,</p>",
          "<p>Thanks for joining Nyra.</p>",
          "<p>We’re preparing your wedding shortlist and will reach out when your matches are ready.</p>",
          "<p>— Nyra</p>",
        ].join("\n"),
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
