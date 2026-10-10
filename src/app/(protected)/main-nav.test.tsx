import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/projects/board" }));
vi.mock("@/app/auth/actions", () => ({ signOut: vi.fn() }));

const { MainNav } = await import("./main-nav");

afterEach(cleanup);

function menu() {
  return document.getElementById("main-menu") as HTMLElement;
}

describe("MainNav", () => {
  it("メニューは閉じた状態で始まり、ボタンで開閉する", () => {
    render(<MainNav />);
    const toggle = screen.getByRole("button", { name: /メニュー/ });

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(menu().hidden).toBe(true);

    fireEvent.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent).toContain("閉じる");
    expect(menu().hidden).toBe(false);
  });

  it("今いる画面のリンクに aria-current を付ける(かんばんは「案件」)", () => {
    render(<MainNav />);

    const current = within(menu()).getByText("案件").closest("a");
    expect(current?.getAttribute("aria-current")).toBe("page");
    expect(within(menu()).getByText("お金").closest("a")?.getAttribute("aria-current")).toBeNull();
  });

  it("リンクを選ぶと閉じる", () => {
    render(<MainNav />);
    fireEvent.click(screen.getByRole("button", { name: /メニュー/ }));

    fireEvent.click(within(menu()).getByText("お金"));

    expect(menu().hidden).toBe(true);
  });

  it("Esc で閉じ、ボタンにカーソルを戻す", () => {
    render(<MainNav />);
    const toggle = screen.getByRole("button", { name: /メニュー/ });
    fireEvent.click(toggle);

    fireEvent.keyDown(within(menu()).getByText("お金"), { key: "Escape" });

    expect(menu().hidden).toBe(true);
    expect(document.activeElement).toBe(toggle);
  });

  it("メニューの中にもログアウトがある", () => {
    render(<MainNav />);
    expect(within(menu()).getByRole("button", { name: "ログアウト", hidden: true })).toBeTruthy();
  });
});
