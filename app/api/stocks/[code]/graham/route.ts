import { evaluateGraham } from "@/lib/graham";
import { fetchStockPriceByCode } from "@/services/data-go-kr-client";
import { fetchStockFinancials } from "@/services/dart-client";
import kospi200 from "@/public/data/kospi200.json";
import type { StockMasterEntry } from "@/types/stock";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const master = (kospi200 as StockMasterEntry[]).find((s) => s.code === code);
  if (!master) {
    return Response.json(
      { error: `Unknown stock code ${code} (not in the KOSPI200 master list)` },
      { status: 404 },
    );
  }

  try {
    const [price, financials] = await Promise.all([
      fetchStockPriceByCode(code),
      fetchStockFinancials(master.corpCode),
    ]);

    if (!price) {
      return Response.json(
        { error: `No price data found for stock code ${code}` },
        { status: 404 },
      );
    }

    const result = evaluateGraham(price, financials);
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
