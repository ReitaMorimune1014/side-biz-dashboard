import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProjectFormState } from "./actions";
import { ProjectForm } from "./project-form";

afterEach(cleanup);

const CUSTOMER_ID = "3f1c2b7e-8a4d-4c1e-9b2f-1a2b3c4d5e6f";
const customers = [{ id: CUSTOMER_ID, name: "山田商店" }];

function setup(edit = false) {
  const action = vi.fn<(state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>>(
    async () => ({ status: "idle" }),
  );
  render(
    <ProjectForm
      action={action}
      customers={customers}
      submitLabel="保存する"
      {...(edit
        ? {
            status: { current: "in_progress" as const },
            defaultValues: { customer_id: CUSTOMER_ID, title: "LP制作", amount: "120000" },
          }
        : {})}
    />,
  );
  const submit = () => fireEvent.click(screen.getByRole("button", { name: "保存する" }));
  return { action, submit };
}

describe("ProjectForm の画面の検証", () => {
  it("新規で空のまま送ると、送信せずに必須の項目ごとにエラーを出す", async () => {
    const { action, submit } = setup();

    submit();

    expect(await screen.findByText("顧客を選んでください")).toBeTruthy();
    expect(screen.getByText("題名を入力してください")).toBeTruthy();
    expect(screen.getByText("金額を入力してください")).toBeTruthy();
    expect(action).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement?.id).toBe("customer_id"));
  });

  it("金額のエラーは、ヒントの代わりに出し、入力で直すと消える", async () => {
    const { submit } = setup();
    const amount = screen.getByLabelText(/金額/);
    fireEvent.change(amount, { target: { value: "12万" } });
    submit();

    expect(await screen.findByText("金額は0以上の整数(円)で入力してください")).toBeTruthy();
    expect(amount.getAttribute("aria-describedby")).toBe("amount-error");

    fireEvent.change(amount, { target: { value: "120,000" } });

    expect(screen.queryByText("金額は0以上の整数(円)で入力してください")).toBeNull();
    expect(amount.getAttribute("aria-describedby")).toBe("amount-hint");
  });

  it("エラーの出ていない項目は、入力してもエラーを出さない", async () => {
    const { submit } = setup();
    submit();
    await screen.findByText("題名を入力してください");

    fireEvent.change(screen.getByLabelText(/メモ/), { target: { value: "x".repeat(2001) } });

    expect(screen.queryByText("メモは2000文字以内で入力してください")).toBeNull();
  });

  it("編集でも、同じ検証で送信を止める", async () => {
    const { action, submit } = setup(true);
    fireEvent.change(screen.getByLabelText(/題名/), { target: { value: "   " } });

    submit();

    expect(await screen.findByText("題名を入力してください")).toBeTruthy();
    expect(action).not.toHaveBeenCalled();
  });

  it("正しい値なら、サーバーアクションに送る", async () => {
    const { action, submit } = setup(true);

    submit();

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("expected_status")).toBe("in_progress");
  });
});
