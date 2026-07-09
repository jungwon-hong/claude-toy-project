import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DuplicateDialog } from "./duplicate-dialog";

describe("DuplicateDialog", () => {
  it("renders nothing when there is no pending duplicate", () => {
    render(
      <DuplicateDialog stockName={null} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows the stock name and calls onConfirm when confirmed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <DuplicateDialog
        stockName="삼성전자"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/이미 워치리스트에 있습니다/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel exactly once when cancelled", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <DuplicateDialog stockName="삼성전자" onConfirm={vi.fn()} onCancel={onCancel} />,
    );

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
