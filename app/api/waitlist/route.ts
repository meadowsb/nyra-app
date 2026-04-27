import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { Resend } from "resend";

const WAITLIST_PATH = path.join(process.cwd(), "data", "waitlist.json");

type WaitlistEntry = {
  email: string;
  prompt: string;
  createdAt: string;
};

const memoryStore: WaitlistEntry[] = [];

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

async function persistEntry(entry: WaitlistEntry): Promise<void> {
  memoryStore.push(entry);
  console.log("[waitlist]", JSON.stringify(entry));

  try {
    await mkdir(path.dirname(WAITLIST_PATH), { recursive: true });
    let existing: WaitlistEntry[] = [];
    try {
      const raw = await readFile(WAITLIST_PATH, "utf8");
      existing = JSON.parse(raw) as WaitlistEntry[];
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
    existing.push(entry);
    await writeFile(WAITLIST_PATH, JSON.stringify(existing, null, 2), "utf8");
  } catch (err) {
    console.error("[waitlist] failed to persist to file", err);
  }
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

  const entry: WaitlistEntry = {
    email,
    prompt,
    createdAt: new Date().toISOString(),
  };

  await persistEntry(entry);

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
