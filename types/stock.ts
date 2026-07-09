export interface StockMasterEntry {
  code: string;
  name: string;
  corpCode: string;
}

export interface StockPrice {
  price: number;
  changeRate: number;
  marketCap: number;
}

export interface StockFinancials {
  netIncome: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  revenue: number | null;
}

export type GrahamCriterionKey = "per" | "pbr" | "debtRatio" | "profitable";
export type GrahamCriterionStatus = "pass" | "fail" | "unavailable";

export interface GrahamCriterion {
  key: GrahamCriterionKey;
  label: string;
  value: string;
  status: GrahamCriterionStatus;
}

export interface GrahamResult {
  criteria: GrahamCriterion[];
  satisfiedCount: number;
  evaluableCount: number;
}
