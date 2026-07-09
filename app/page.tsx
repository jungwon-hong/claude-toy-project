import { Watchlist } from "@/components/graham-watchlist/watchlist";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-5 text-lg font-bold">워치리스트</h1>
      <Watchlist />
    </main>
  );
}
