import {
  DEBT_RATIO_THRESHOLD,
  PBR_THRESHOLD,
  PER_THRESHOLD,
} from "@/config/graham";
import type {
  GrahamCriterion,
  GrahamResult,
  StockFinancials,
} from "@/types/stock";

interface PriceInput {
  marketCap: number;
}

function statusFrom(pass: boolean): "pass" | "fail" {
  return pass ? "pass" : "fail";
}

export function evaluateGraham(
  price: PriceInput,
  financials: StockFinancials,
): GrahamResult {
  const isProfitable =
    financials.netIncome !== null && financials.netIncome > 0;

  const per: GrahamCriterion = isProfitable
    ? (() => {
        const value = price.marketCap / (financials.netIncome as number);
        return {
          key: "per",
          label: `PER < ${PER_THRESHOLD}`,
          value: `PER ${value.toFixed(1)}`,
          status: statusFrom(value < PER_THRESHOLD),
        };
      })()
    : {
        key: "per",
        label: `PER < ${PER_THRESHOLD}`,
        value: "N/A",
        status: "fail",
      };

  const pbr: GrahamCriterion =
    financials.totalEquity === null
      ? {
          key: "pbr",
          label: `PBR < ${PBR_THRESHOLD}`,
          value: "데이터 없음",
          status: "unavailable",
        }
      : (() => {
          const value = price.marketCap / financials.totalEquity!;
          return {
            key: "pbr",
            label: `PBR < ${PBR_THRESHOLD}`,
            value: `PBR ${value.toFixed(1)}`,
            status: statusFrom(value < PBR_THRESHOLD),
          };
        })();

  const debtRatio: GrahamCriterion =
    financials.totalLiabilities === null || financials.totalEquity === null
      ? {
          key: "debtRatio",
          label: `부채비율 < ${DEBT_RATIO_THRESHOLD}%`,
          value: "데이터 없음",
          status: "unavailable",
        }
      : (() => {
          const value =
            (financials.totalLiabilities! / financials.totalEquity!) * 100;
          return {
            key: "debtRatio",
            label: `부채비율 < ${DEBT_RATIO_THRESHOLD}%`,
            value: `${value.toFixed(0)}%`,
            status: statusFrom(value < DEBT_RATIO_THRESHOLD),
          };
        })();

  const profitable: GrahamCriterion = {
    key: "profitable",
    label: "최근 결산 순이익 흑자",
    value: isProfitable ? "흑자" : "적자",
    status: statusFrom(isProfitable),
  };

  const criteria = [per, pbr, debtRatio, profitable];
  const evaluable = criteria.filter((c) => c.status !== "unavailable");

  return {
    criteria,
    satisfiedCount: criteria.filter((c) => c.status === "pass").length,
    evaluableCount: evaluable.length,
  };
}
