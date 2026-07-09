import AdmZip from "adm-zip";
import type { StockFinancials } from "@/types/stock";

const CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml";
const SINGLE_ACNT_URL = "https://opendart.fss.or.kr/api/fnlttSinglAcnt.json";
const NO_DATA_STATUS = "013";

function apiKey(): string {
  const key = process.env.DART_API_KEY;
  if (!key) throw new Error("DART_API_KEY is not set");
  return key;
}

/** Maps a 6-digit stock code to DART's 8-digit corp_code. */
export type CorpCodeMap = Map<string, string>;

export function parseCorpCodeXml(xml: string): CorpCodeMap {
  const map: CorpCodeMap = new Map();
  const listBlocks = xml.match(/<list>[\s\S]*?<\/list>/g) ?? [];

  for (const block of listBlocks) {
    const corpCode = block.match(/<corp_code>(.*?)<\/corp_code>/)?.[1]?.trim();
    const stockCode = block.match(/<stock_code>(.*?)<\/stock_code>/)?.[1]?.trim();
    if (corpCode && stockCode && stockCode.length === 6) {
      map.set(stockCode, corpCode);
    }
  }

  return map;
}

/** Downloads and parses DART's full corp_code listing (one-time, ~4MB zip). */
export async function fetchCorpCodeMap(): Promise<CorpCodeMap> {
  const url = new URL(CORP_CODE_URL);
  url.searchParams.set("crtfc_key", apiKey());

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`DART corpCode request failed with status ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("CORPCODE.xml");
  if (!entry) throw new Error("CORPCODE.xml not found in DART zip response");

  const xml = zip.readAsText(entry);
  return parseCorpCodeXml(xml);
}

interface DartAccountItem {
  account_nm: string;
  fs_div: string;
  thstrm_amount: string;
}

interface DartSingleAcntResponse {
  status: string;
  message: string;
  list?: DartAccountItem[];
}

async function fetchSingleAcnt(
  corpCode: string,
  year: number,
): Promise<DartAccountItem[] | null> {
  const url = new URL(SINGLE_ACNT_URL);
  url.searchParams.set("crtfc_key", apiKey());
  url.searchParams.set("corp_code", corpCode);
  url.searchParams.set("bsns_year", String(year));
  url.searchParams.set("reprt_code", "11011"); // 사업보고서 (annual)

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`DART financials request failed with status ${res.status}`);
  }
  const json = (await res.json()) as DartSingleAcntResponse;

  if (json.status === NO_DATA_STATUS) return null;
  if (json.status !== "000") {
    throw new Error(`DART error: ${json.status} ${json.message}`);
  }
  return json.list ?? [];
}

function pickAmount(list: DartAccountItem[], accountName: string): number | null {
  const matches = list.filter((item) => item.account_nm === accountName);
  const preferred =
    matches.find((item) => item.fs_div === "CFS") ?? matches[0];
  if (!preferred) return null;
  return Number(preferred.thstrm_amount.replace(/,/g, ""));
}

/**
 * Fetches a company's key financial accounts for its most recent annual
 * report, walking backward through `maxYearsBack` years if the latest
 * year has no filing yet (status 013).
 */
export async function fetchStockFinancials(
  corpCode: string,
  fromYear: number = new Date().getFullYear(),
  maxYearsBack = 5,
): Promise<StockFinancials> {
  for (let i = 1; i <= maxYearsBack; i += 1) {
    const year = fromYear - i;
    const list = await fetchSingleAcnt(corpCode, year);
    if (list === null) continue;

    return {
      totalAssets: pickAmount(list, "자산총계"),
      totalLiabilities: pickAmount(list, "부채총계"),
      totalEquity: pickAmount(list, "자본총계"),
      netIncome: pickAmount(list, "당기순이익(손실)"),
      revenue: pickAmount(list, "매출액"),
    };
  }

  throw new Error(
    `No DART annual report found for corp_code ${corpCode} in the last ${maxYearsBack} years`,
  );
}
