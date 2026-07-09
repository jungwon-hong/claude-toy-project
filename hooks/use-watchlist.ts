"use client";

import { useCallback, useEffect, useState } from "react";
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

function readStoredEntries(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchlistEntry[]) : [];
  } catch {
    return [];
  }
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
  const [items, setItems] = useState<WatchlistItem[]>(() =>
    readStoredEntries().map((entry) => ({
      ...entry,
      status: "loading",
      price: null,
      graham: null,
    })),
  );
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

  // Restore-on-mount: refetch fresh price/graham data for whatever was
  // persisted from a previous visit. Runs once, over the initial items only.
  useEffect(() => {
    items.forEach((item) => refetchStock(item.code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const removeStock = useCallback((code: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.code !== code);
      writeStoredEntries(toEntries(next));
      return next;
    });
  }, []);

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
