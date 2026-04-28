import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-neutral-900 to-black px-6 py-16 font-sans antialiased">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur-md sm:p-10">
        <p className="mb-6 text-xs uppercase tracking-[0.35em] text-white/40">NYRA</p>
        <h1 className="text-3xl font-semibold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/50">Last updated: April 2026</p>

        <div className="mt-6 space-y-4 text-white/70 leading-relaxed">
          <p>We respect your privacy.</p>
          <p>
            When you join the Nyra waitlist, we collect your first name, email address, and any wedding
            details you choose to share so we can understand interest in Nyra and follow up as the product
            becomes available.
          </p>
          <p>We do not sell your personal information.</p>
          <p>
            We may use trusted service providers, such as hosting, database, and email tools, to store
            information and send product updates. These providers only process information needed to support
            Nyra.
          </p>
          <p>
            You can ask us to delete your information at any time by emailing{" "}
            <a href="mailto:hello@meetnyra.com" className="text-white/90 underline-offset-2 hover:text-white hover:underline">
              hello@meetnyra.com
            </a>
            .
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-white/50 transition hover:text-white"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
