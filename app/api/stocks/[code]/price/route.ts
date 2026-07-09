import { fetchStockPriceByCode } from "@/services/data-go-kr-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  try {
    const price = await fetchStockPriceByCode(code);
    if (!price) {
      return Response.json(
        { error: `No price data found for stock code ${code}` },
        { status: 404 },
      );
    }
    return Response.json(price);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
