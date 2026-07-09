"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/use-watchlist";
import { DuplicateDialog } from "./duplicate-dialog";
import { StockSearch } from "./stock-search";

export function Watchlist() {
  const {
    items,
    addStock,
    removeStock,
    pendingDuplicate,
    confirmDuplicate,
    cancelDuplicate,
  } = useWatchlist();

  return (
    <div className="flex flex-col gap-4">
      <StockSearch onSelect={addStock} />
      <DuplicateDialog
        stockName={pendingDuplicate?.name ?? null}
        onConfirm={confirmDuplicate}
        onCancel={cancelDuplicate}
      />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          워치리스트가 비어 있습니다. 종목을 검색해 추가하세요
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.code}
              className="flex items-center justify-between rounded-md border border-border bg-card p-3"
            >
              <div>
                <div className="text-sm font-bold">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.price
                    ? `${item.price.price.toLocaleString()}원 ${item.price.changeRate}%`
                    : "..."}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {item.graham ? `${item.graham.satisfiedCount}/4 만족` : "..."}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${item.name} 삭제`}
                  onClick={() => removeStock(item.code)}
                >
                  <TrashIcon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
