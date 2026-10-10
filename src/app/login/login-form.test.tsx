import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LoginState } from "./actions";

const sendMagicLink = vi.fn<(state: LoginState, formData: FormData) => Promise<LoginState>>();
vi.mock("./actions", () => ({
  sendMagicLink: (state: LoginState, formData: FormData) => sendMagicLink(state, formData),
}));

const { LoginForm } = await import("./login-form");

beforeEach(() => sendMagicLink.mockReset());
afterEach(cleanup);

function setup() {
  render(<LoginForm next="/dashboard" />);
  const email = screen.getByLabelText("メールアドレス") as HTMLInputElement;
  const submit = () =>
    fireEvent.click(screen.getByRole("button", { name: "ログイン用のリンクを送る" }));
  return { email, submit };
}

describe("LoginForm の画面の検証", () => {
  it("空なら送信せず、入力を求める", async () => {
    const { email, submit } = setup();

    submit();

    expect(await screen.findByText("メールアドレスを入力してください")).toBeTruthy();
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(sendMagicLink).not.toHaveBeenCalled();
  });

  it("形式が違えば送信せず、そう伝える", async () => {
    const { email, submit } = setup();
    fireEvent.change(email, { target: { value: "me@example" } });

    submit();

    expect(await screen.findByText("メールアドレスの形式が正しくありません")).toBeTruthy();
    expect(sendMagicLink).not.toHaveBeenCalled();
  });

  it("送れなかったときは、入力したアドレスを残してエラーを出す", async () => {
    sendMagicLink.mockResolvedValue({
      status: "error",
      fieldErrors: {},
      message: "メールを送れませんでした。時間をおいて、もう一度お試しください",
      email: "me@example.com",
    });
    const { email, submit } = setup();
    fireEvent.change(email, { target: { value: "me@example.com" } });

    submit();

    expect(await screen.findByRole("alert")).toBeTruthy();
    await waitFor(() =>
      expect((screen.getByLabelText("メールアドレス") as HTMLInputElement).value).toBe(
        "me@example.com",
      ),
    );
  });
});
