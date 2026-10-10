import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DemoLoginState } from "./actions";

const signInAsDemo =
  vi.fn<(state: DemoLoginState, formData: FormData) => Promise<DemoLoginState>>();
vi.mock("./actions", () => ({
  signInAsDemo: (state: DemoLoginState, formData: FormData) => signInAsDemo(state, formData),
}));

const { DemoLoginForm } = await import("./demo-login-form");

beforeEach(() => signInAsDemo.mockReset());
afterEach(cleanup);

describe("DemoLoginForm", () => {
  it("パスワードの入力欄はなく、ボタンだけで、戻り先を送る", async () => {
    signInAsDemo.mockResolvedValue({ status: "idle" });
    const { container } = render(<DemoLoginForm next="/projects" />);
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(container.querySelector('input[type="email"]')).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "デモを見る(閲覧専用)" }));

    await waitFor(() => expect(signInAsDemo).toHaveBeenCalledTimes(1));
    const formData = signInAsDemo.mock.calls[0][1];
    expect(formData.get("next")).toBe("/projects");
    expect([...formData.keys()]).toEqual(["next"]);
  });

  it("ログインできなかったときは、エラーを出す", async () => {
    signInAsDemo.mockResolvedValue({ status: "error", message: "デモにログインできませんでした" });
    render(<DemoLoginForm next="/dashboard" />);

    fireEvent.click(screen.getByRole("button", { name: "デモを見る(閲覧専用)" }));

    expect((await screen.findByRole("alert")).textContent).toBe("デモにログインできませんでした");
  });
});
