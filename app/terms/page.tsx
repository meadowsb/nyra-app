import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 px-2 py-20 font-sans text-neutral-900 antialiased sm:px-3 sm:py-24">
      <div className="mx-auto max-w-xl">
        <p className="nyra-eyebrow">Nyra</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-neutral-950">Terms of service</h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-500">
          This page is a placeholder. Final terms will be published before public launch.
        </p>
        <Link
          href="/"
          className="mt-10 inline-block text-sm font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-950 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
