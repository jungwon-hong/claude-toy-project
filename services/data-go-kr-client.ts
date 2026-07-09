const BASE_URL =
  "https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo";

export interface KospiSnapshotItem {
  code: string;
  name: string;
  marketCap: number;
}

export interface StockPriceResult {
  price: number;
  changeRate: number;
  marketCap: number;
}

interface DataGoKrItem {
  srtnCd: string;
  itmsNm: string;
  mrktTotAmt: string;
  clpr?: string;
  fltRt?: string;
}

interface DataGoKrResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      totalCount: number;
      items?: { item?: DataGoKrItem | DataGoKrItem[] };
    };
  };
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function apiKey(): string {
  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) throw new Error("DATA_GO_KR_API_KEY is not set");
  return key;
}

async function fetchPage(
  params: Record<string, string>,
  pageNo: number,
  numOfRows: number,
) {
  const url = new URL(BASE_URL);
  url.searchParams.set("serviceKey", apiKey());
  url.searchParams.set("resultType", "json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(numOfRows));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`data.go.kr request failed with status ${res.status}`);
  }
  const json = (await res.json()) as DataGoKrResponse;
  if (json.response.header.resultCode !== "00") {
    throw new Error(`data.go.kr error: ${json.response.header.resultMsg}`);
  }
  return json.response.body;
}

/** Fetches all KOSPI-listed stocks for a single trading date. */
export async function fetchKospiSnapshotForDate(
  basDt: string,
): Promise<KospiSnapshotItem[]> {
  const params = { mrktCls: "KOSPI", basDt };
  const first = await fetchPage(params, 1, 1000);
  if (!first || first.totalCount === 0) return [];

  const items = toArray(first.items?.item);

  let pageNo = 2;
  while (items.length < first.totalCount) {
    const page = await fetchPage(params, pageNo, 1000);
    const pageItems = toArray(page?.items?.item);
    if (pageItems.length === 0) break;
    items.push(...pageItems);
    pageNo += 1;
  }

  return items.map((item) => ({
    code: item.srtnCd,
    name: item.itmsNm,
    marketCap: Number(item.mrktTotAmt),
  }));
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * data.go.kr has no "latest" query — walks backward from `from` until a
 * trading date with data is found (weekends/holidays return 0 rows).
 */
export async function fetchLatestKospiSnapshot(
  from: Date = new Date(),
  maxDaysBack = 10,
): Promise<KospiSnapshotItem[]> {
  const cursor = new Date(from);
  for (let i = 0; i < maxDaysBack; i += 1) {
    const basDt = formatDate(cursor);
    const items = await fetchKospiSnapshotForDate(basDt);
    if (items.length > 0) return items;
    cursor.setDate(cursor.getDate() - 1);
  }
  throw new Error(
    `No KOSPI trading data found in the last ${maxDaysBack} days`,
  );
}

/** Looks up a single stock's latest price by its 6-character short code. */
export async function fetchStockPriceByCode(
  code: string,
  from: Date = new Date(),
  maxDaysBack = 10,
): Promise<StockPriceResult | null> {
  const cursor = new Date(from);
  for (let i = 0; i < maxDaysBack; i += 1) {
    const basDt = formatDate(cursor);
    const page = await fetchPage({ likeSrtnCd: code, basDt }, 1, 1);
    const item = toArray(page?.items?.item)[0];
    if (item) {
      return {
        price: Number(item.clpr),
        changeRate: Number(item.fltRt),
        marketCap: Number(item.mrktTotAmt),
      };
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return null;
}
