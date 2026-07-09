"use client";

import { useCallback, useState } from "react";
import type { GrahamResult, StockPrice } from "@/types/stock";

const STORAGE_KEY = "graham-watchlist";

export interface WatchlistEntry {
  code: string;
  name: string;
}

export interface WatchlistItem extends WatchlistEntry {
  status: "loading" | "loaded" | "error";
  price: StockPrice | null;
  graham: GrahamResult | null;
}

function writeStoredEntries(entries: WatchlistEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function toEntries(items: WatchlistItem[]): WatchlistEntry[] {
  return items.map(({ code, name }) => ({ code, name }));
}

async function fetchStockData(
  code: string,
): Promise<{ price: StockPrice | null; graham: GrahamResult | null }> {
  const [priceRes, grahamRes] = await Promise.all([
    fetch(`/api/stocks/${code}/price`),
    fetch(`/api/stocks/${code}/graham`),
  ]);

  const price = priceRes.ok ? await priceRes.json() : null;
  const graham = grahamRes.ok ? await grahamRes.json() : null;
  return { price, graham };
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [pendingDuplicate, setPendingDuplicate] = useState<WatchlistEntry | null>(
    null,
  );

  const refetchStock = useCallback((code: string) => {
    setItems((prev) =>
      prev.map((i) => (i.code === code ? { ...i, status: "loading" } : i)),
    );
    fetchStockData(code).then(({ price, graham }) => {
      setItems((prev) =>
        prev.map((i) =>
          i.code === code ? { ...i, status: "loaded", price, graham } : i,
        ),
      );
    });
  }, []);

  const addStock = useCallback(
    (entry: WatchlistEntry) => {
      if (items.some((i) => i.code === entry.code)) {
        setPendingDuplicate(entry);
        return;
      }

      setItems((prev) => {
        const next: WatchlistItem[] = [
          ...prev,
          { ...entry, status: "loading", price: null, graham: null },
        ];
        writeStoredEntries(toEntries(next));
        return next;
      });
      fetchStockData(entry.code).then(({ price, graham }) => {
        setItems((prev) =>
          prev.map((i) =>
            i.code === entry.code
              ? { ...i, status: "loaded", price, graham }
              : i,
          ),
        );
      });
    },
    [items],
  );

  const confirmDuplicate = useCallback(() => {
    if (pendingDuplicate) {
      refetchStock(pendingDuplicate.code);
      setPendingDuplicate(null);
    }
  }, [pendingDuplicate, refetchStock]);

  const cancelDuplicate = useCallback(() => {
    setPendingDuplicate(null);
  }, []);

  // Completed in Task 9 (delete) and Task 10 (mount-time restore/refetch).
  const removeStock = useCallback((_code: string) => {}, []);

  return {
    items,
    addStock,
    removeStock,
    refetchStock,
    pendingDuplicate,
    confirmDuplicate,
    cancelDuplicate,
  };
}
