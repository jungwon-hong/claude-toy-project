import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StockSearch } from "./stock-search";

describe("StockSearch", () => {
  it("shows up to 5 matching KOSPI200 stock names when the user types a partial name", async () => {
    const user = userEvent.setup();
    render(<StockSearch onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText("종목명 입력 (코스피200)");
    await user.type(input, "삼성");

    const options = await screen.findAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThanOrEqual(5);
    for (const option of options) {
      expect(option.textContent).toContain("삼성");
    }
  });

  it("shows a no-match message when the query matches no KOSPI200 stock", async () => {
    const user = userEvent.setup();
    render(<StockSearch onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText("종목명 입력 (코스피200)");
    await user.type(input, "존재하지않는아주긴이름의종목");

    expect(
      await screen.findByText("코스피200 내에서 일치하는 종목이 없습니다"),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the chosen stock and clears the input", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StockSearch onSelect={onSelect} />);

    const input = screen.getByPlaceholderText("종목명 입력 (코스피200)");
    await user.type(input, "삼성전자");

    const option = await screen.findByRole("option", { name: /삼성전자/ });
    await user.click(option);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: "005930", name: "삼성전자" }),
    );
  });
});
