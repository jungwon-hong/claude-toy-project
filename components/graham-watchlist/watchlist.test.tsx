import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Watchlist } from "./watchlist";

describe("Watchlist", () => {
  it("shows the empty-state message when there are no stocks", () => {
    render(<Watchlist />);
    expect(
      screen.getByText("워치리스트가 비어 있습니다. 종목을 검색해 추가하세요"),
    ).toBeInTheDocument();
  });

  it("adding a stock via search shows its name, price, changeRate, and score", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/price")) {
        return {
          ok: true,
          json: async () => ({ price: 277500, changeRate: -6.25, marketCap: 1 }),
        };
      }
      return {
        ok: true,
        json: async () => ({ criteria: [], satisfiedCount: 4, evaluableCount: 4 }),
      };
    }) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<Watchlist />);

    const input = screen.getByPlaceholderText("종목명 입력 (코스피200)");
    await user.type(input, "삼성전자");
    const option = await screen.findByRole("option", { name: /삼성전자/ });
    await user.click(option);

    expect(screen.getByText("삼성전자")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("4/4 만족")).toBeInTheDocument();
    });
    expect(screen.getByText(/277,500원/)).toBeInTheDocument();
  });

  it("selecting an already-added stock shows a confirm dialog instead of duplicating the row", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/price")) {
        return {
          ok: true,
          json: async () => ({ price: 277500, changeRate: -6.25, marketCap: 1 }),
        };
      }
      return {
        ok: true,
        json: async () => ({ criteria: [], satisfiedCount: 4, evaluableCount: 4 }),
      };
    }) as unknown as typeof fetch;

    const user = userEvent.setup();
    render(<Watchlist />);

    const input = screen.getByPlaceholderText("종목명 입력 (코스피200)");
    await user.type(input, "삼성전자");
    await user.click(await screen.findByRole("option", { name: /삼성전자/ }));
    await waitFor(() => expect(screen.getByText("4/4 만족")).toBeInTheDocument());

    await user.type(input, "삼성전자");
    await user.click(await screen.findByRole("option", { name: /삼성전자/ }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getAllByText("삼성전자")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getAllByText("삼성전자")).toHaveLength(1);
  });
});
