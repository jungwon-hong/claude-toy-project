"use client";

import { useState } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/use-watchlist";
import { formatGrahamScore } from "@/lib/graham";
import { cn } from "@/lib/utils";
import { DuplicateDialog } from "./duplicate-dialog";
import { StockDetail } from "./stock-detail";
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
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const selectedItem = items.find((i) => i.code === selectedCode) ?? null;

  return (
    <div className="@container flex flex-col gap-4">
      <StockSearch onSelect={addStock} />
      <DuplicateDialog
        stockName={pendingDuplicate?.name ?? null}
        onConfirm={confirmDuplicate}
        onCancel={cancelDuplicate}
      />

      <div className={cn("flex flex-col gap-6", selectedItem && "@md:flex-row")}>
        <div
          className={cn(
            "flex flex-col gap-4",
            selectedItem && "hidden @md:block @md:w-2/5 @md:shrink-0",
          )}
        >
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              워치리스트가 비어 있습니다. 종목을 검색해 추가하세요
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={item.code}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-card p-3"
                  onClick={() => setSelectedCode(item.code)}
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
                      {item.graham ? formatGrahamScore(item.graham) : "..."}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${item.name} 삭제`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStock(item.code);
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedItem && (
          <div className="@md:flex-1 @md:border-l @md:border-border @md:pl-6">
            <StockDetail
              name={selectedItem.name}
              price={selectedItem.price}
              graham={selectedItem.graham}
              onBack={() => setSelectedCode(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
