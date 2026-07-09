import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StockDetail } from "./stock-detail";
import type { GrahamResult, StockPrice } from "@/types/stock";

const price: StockPrice = { price: 277500, changeRate: -6.25, marketCap: 1 };

function grahamAllPass(): GrahamResult {
  return {
    criteria: [
      { key: "per", label: "PER < 15", value: "PER 9.8", status: "pass" },
      { key: "pbr", label: "PBR < 1.5", value: "PBR 1.1", status: "pass" },
      { key: "debtRatio", label: "부채비율 < 100%", value: "42%", status: "pass" },
      { key: "profitable", label: "최근 결산 순이익 흑자", value: "흑자", status: "pass" },
    ],
    satisfiedCount: 4,
    evaluableCount: 4,
  };
}

describe("StockDetail", () => {
  it("shows 4/4 만족 and all-pass icons when every criterion passes", () => {
    render(<StockDetail name="삼성전자" price={price} graham={grahamAllPass()} />);
    expect(screen.getByText("4/4 만족")).toBeInTheDocument();
    expect(screen.getAllByLabelText("통과")).toHaveLength(4);
  });

  it("shows a fail icon only for the failing criterion when partially satisfied", () => {
    const graham = grahamAllPass();
    graham.criteria[0] = { ...graham.criteria[0], value: "PER 18.4", status: "fail" };
    graham.satisfiedCount = 3;

    render(<StockDetail name="한국항공우주" price={price} graham={graham} />);

    expect(screen.getByText("3/4 만족")).toBeInTheDocument();
    expect(screen.getAllByLabelText("통과")).toHaveLength(3);
    expect(screen.getAllByLabelText("실패")).toHaveLength(1);
  });

  it("shows N/A for PER when the company reported a net loss", () => {
    const graham = grahamAllPass();
    graham.criteria[0] = { ...graham.criteria[0], value: "N/A", status: "fail" };

    render(<StockDetail name="적자기업" price={price} graham={graham} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("shows '데이터 없음' and the reduced-denominator score when a criterion is unavailable", () => {
    const graham = grahamAllPass();
    graham.criteria[2] = {
      ...graham.criteria[2],
      value: "데이터 없음",
      status: "unavailable",
    };
    graham.satisfiedCount = 2;
    graham.evaluableCount = 3;

    render(<StockDetail name="상장직후기업" price={price} graham={graham} />);

    expect(screen.getByText("데이터 없음")).toBeInTheDocument();
    expect(screen.getByText("3개 기준 중 2/3 만족")).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <StockDetail name="삼성전자" price={price} graham={grahamAllPass()} onBack={onBack} />,
    );
    await user.click(screen.getByRole("button", { name: "뒤로가기" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
