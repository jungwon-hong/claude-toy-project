import { describe, expect, it, vi } from "vitest";

vi.mock("../services/data-go-kr-client", () => ({
  fetchLatestKospiSnapshot: vi.fn(async () => [
    { code: "000010", name: "Small Cap", marketCap: 100 },
    { code: "000020", name: "Big Cap", marketCap: 900 },
    { code: "000030", name: "No DART Mapping", marketCap: 500 },
  ]),
}));

vi.mock("../services/dart-client", () => ({
  fetchCorpCodeMap: vi.fn(async () =>
    new Map([
      ["000010", "00000001"],
      ["000020", "00000002"],
      // 000030 intentionally missing
    ]),
  ),
}));

import { generateKospi200List } from "./generate-kospi200-list";

describe("generateKospi200List", () => {
  it("sorts by market cap descending and attaches corpCode", async () => {
    const entries = await generateKospi200List();

    expect(entries).toEqual([
      { code: "000020", name: "Big Cap", corpCode: "00000002" },
      { code: "000010", name: "Small Cap", corpCode: "00000001" },
    ]);
  });

  it("skips stocks with no DART corpCode mapping", async () => {
    const entries = await generateKospi200List();
    expect(entries.find((e) => e.code === "000030")).toBeUndefined();
  });
});
