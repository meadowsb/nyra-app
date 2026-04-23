export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-semibold text-center mb-4">
        Find your wedding venue without the back-and-forth
      </h1>

      <p className="text-gray-500 text-center mb-8 max-w-md">
        Nyra finds, shortlists, and contacts venues for pricing and availability.
      </p>

      <form action="/chat" className="w-full max-w-xl flex gap-2">
        <input
          name="query"
          placeholder="e.g. 80 guests, Miami, modern, under $25k"
          className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none"
        />
        <button className="bg-black text-white px-4 py-3 rounded-xl">
          Start
        </button>
      </form>
    </main>
  );
}