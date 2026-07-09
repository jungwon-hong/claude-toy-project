import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fetchLatestKospiSnapshot } from "../services/data-go-kr-client";
import { fetchCorpCodeMap } from "../services/dart-client";
import type { StockMasterEntry } from "../types/stock";

const OUTPUT_PATH = join(__dirname, "..", "public", "data", "kospi200.json");
const LIST_SIZE = 200;

export async function generateKospi200List(): Promise<StockMasterEntry[]> {
  const [snapshot, corpCodeMap] = await Promise.all([
    fetchLatestKospiSnapshot(),
    fetchCorpCodeMap(),
  ]);

  const sortedByMarketCap = [...snapshot].sort(
    (a, b) => b.marketCap - a.marketCap,
  );

  const entries: StockMasterEntry[] = [];
  for (const stock of sortedByMarketCap) {
    const corpCode = corpCodeMap.get(stock.code);
    if (!corpCode) continue; // no DART mapping available, skip
    entries.push({ code: stock.code, name: stock.name, corpCode });
    if (entries.length === LIST_SIZE) break;
  }

  return entries;
}

async function main() {
  const entries = await generateKospi200List();
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2));
  console.log(`Wrote ${entries.length} entries to ${OUTPUT_PATH}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
