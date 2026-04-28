import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-neutral-900 to-black px-6 py-16 font-sans antialiased">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur-md sm:p-10">
        <p className="mb-6 text-xs uppercase tracking-[0.35em] text-white/40">NYRA</p>
        <h1 className="text-3xl font-semibold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-white/50">Last updated: April 2026</p>

        <div className="mt-6 space-y-4 text-white/70 leading-relaxed">
          <p>By joining the Nyra waitlist or using this website, you agree to these terms.</p>
          <p>
            Nyra is currently in development. Features, availability, and the way the service works may
            change before public launch.
          </p>
          <p>
            Nyra is designed to help simplify wedding planning by organizing requests, options, and
            follow-up. We aim to provide helpful information, but we do not guarantee vendor availability,
            pricing, responses, or outcomes.
          </p>
        </div>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-white">Acceptable Use</h2>
        <p className="text-white/70 leading-relaxed">
          By using Nyra, you agree not to misuse the service. This includes:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-white/70">
          <li>Submitting false or misleading information</li>
          <li>Attempting to interfere with or disrupt the service</li>
          <li>Using Nyra for unlawful, abusive, or harmful purposes</li>
        </ul>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-white">Contact</h2>
        <p className="text-white/70 leading-relaxed">
          If you have questions about these terms, contact{" "}
          <a href="mailto:hello@meetnyra.com" className="text-white/90 underline-offset-2 hover:text-white hover:underline">
            hello@meetnyra.com
          </a>
          .
        </p>

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
