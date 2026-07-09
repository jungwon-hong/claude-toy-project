import AdmZip from "adm-zip";

const CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml";

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
