"use client";

import { ArrowLeftIcon, CheckIcon, MinusIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { formatGrahamScore } from "@/lib/graham";
import type { GrahamCriterionStatus, GrahamResult, StockPrice } from "@/types/stock";

const STATUS_ICON: Record<GrahamCriterionStatus, typeof CheckIcon> = {
  pass: CheckIcon,
  fail: XIcon,
  unavailable: MinusIcon,
};

const STATUS_LABEL: Record<GrahamCriterionStatus, string> = {
  pass: "통과",
  fail: "실패",
  unavailable: "데이터 없음",
};

interface StockDetailProps {
  name: string;
  price: StockPrice | null;
  graham: GrahamResult | null;
  onBack?: () => void;
}

export function StockDetail({ name, price, graham, onBack }: StockDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="icon" aria-label="뒤로가기" onClick={onBack}>
            <ArrowLeftIcon />
          </Button>
        )}
        <h2 className="text-lg font-bold">{name}</h2>
      </div>

      {price && (
        <div>
          <div className="text-2xl font-bold">{price.price.toLocaleString()}원</div>
          <div className="text-sm text-muted-foreground">
            전일 대비 {price.changeRate}%
          </div>
        </div>
      )}

      {graham && (
        <>
          <div className="flex items-center justify-between rounded-md border border-border bg-card p-3">
            <span className="text-sm font-bold">그레이엄 체크리스트</span>
            <span className="text-sm font-bold">{formatGrahamScore(graham)}</span>
          </div>

          <ul className="flex flex-col gap-2">
            {graham.criteria.map((criterion) => {
              const Icon = STATUS_ICON[criterion.status];
              return (
                <li
                  key={criterion.key}
                  className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                >
                  <span className="text-sm">{criterion.label}</span>
                  <span className="flex items-center gap-2 text-sm">
                    {criterion.value}
                    <Icon aria-label={STATUS_LABEL[criterion.status]} />
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
