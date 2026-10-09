import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CustomerFormState } from "./actions";
import { CustomerForm } from "./customer-form";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(cleanup);

function setup(result: CustomerFormState = { status: "idle" }) {
  const action = vi.fn<(state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>>(
    async () => result,
  );
  render(<CustomerForm action={action} submitLabel="追加する" />);
  const name = screen.getByLabelText(/名前/) as HTMLInputElement;
  const submit = () => fireEvent.click(screen.getByRole("button", { name: "追加する" }));
  return { action, name, submit };
}

describe("CustomerForm の画面の検証", () => {
  it("名前が空なら送信せず、項目の下にサーバーと同じ文言を出して、その項目へカーソルを移す", async () => {
    const { action, name, submit } = setup();

    submit();

    expect(await screen.findByText("名前を入力してください")).toBeTruthy();
    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(name.getAttribute("aria-describedby")).toBe("name-error");
    await waitFor(() => expect(document.activeElement).toBe(name));
    expect(action).not.toHaveBeenCalled();
  });

  it("エラーの出た項目は、入力して直すとエラーが消える", async () => {
    const { name, submit } = setup();
    submit();
    await screen.findByText("名前を入力してください");

    fireEvent.change(name, { target: { value: "山田商店" } });

    expect(screen.queryByText("名前を入力してください")).toBeNull();
    expect(name.getAttribute("aria-invalid")).toBeNull();
  });

  it("正しい値なら、サーバーアクションに送る", async () => {
    const { action, name, submit } = setup();

    fireEvent.change(name, { target: { value: "山田商店" } });
    submit();

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("name")).toBe("山田商店");
  });

  it("サーバーから返ったエラーも、項目ごとに出す", async () => {
    const { name, submit } = setup({
      status: "error",
      fieldErrors: { name: "サーバーのエラー" },
      values: { name: "山田商店", memo: "" },
    });

    fireEvent.change(name, { target: { value: "山田商店" } });
    submit();

    expect(await screen.findByText("サーバーのエラー")).toBeTruthy();
  });
});
