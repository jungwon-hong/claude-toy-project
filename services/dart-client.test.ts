import { describe, expect, it } from "vitest";
import { parseCorpCodeXml } from "./dart-client";

describe("parseCorpCodeXml", () => {
  it("maps 6-digit stock codes to their corp_code", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<result>
  <list>
    <corp_code>00126380</corp_code>
    <corp_name>삼성전자</corp_name>
    <corp_eng_name>Samsung Electronics</corp_eng_name>
    <stock_code>005930</stock_code>
    <modify_date>20260101</modify_date>
  </list>
  <list>
    <corp_code>00434003</corp_code>
    <corp_name>다코</corp_name>
    <corp_eng_name>Daco corporation</corp_eng_name>
    <stock_code> </stock_code>
    <modify_date>20170630</modify_date>
  </list>
</result>`;

    const map = parseCorpCodeXml(xml);

    expect(map.get("005930")).toBe("00126380");
    expect(map.size).toBe(1);
  });

  it("returns an empty map when no entries have a stock code", () => {
    const xml = `<result><list><corp_code>1</corp_code><stock_code> </stock_code></list></result>`;
    expect(parseCorpCodeXml(xml).size).toBe(0);
  });
});
