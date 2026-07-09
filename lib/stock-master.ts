import type { StockMasterEntry } from "@/types/stock";

/** Partial, case-insensitive name match against the KOSPI200 master list. */
export function searchStockMaster(
  query: string,
  master: StockMasterEntry[],
  limit = 5,
): StockMasterEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const needle = trimmed.toLowerCase();
  const results: StockMasterEntry[] = [];

  for (const entry of master) {
    if (entry.name.toLowerCase().includes(needle)) {
      results.push(entry);
      if (results.length === limit) break;
    }
  }

  return results;
}
