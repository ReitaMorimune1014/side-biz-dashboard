import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TimeEntryFormState } from "./actions";
import { TimeEntryForm } from "./time-entry-form";

afterEach(cleanup);

const PROJECT_ID = "3f1c2b7e-8a4d-4c1e-9b2f-1a2b3c4d5e6f";

function setup() {
  const action = vi.fn<
    (state: TimeEntryFormState, formData: FormData) => Promise<TimeEntryFormState>
  >(async () => ({ status: "saved" }));
  render(
    <TimeEntryForm
      action={action}
      projects={[{ id: PROJECT_ID, label: "LP制作(山田商店)" }]}
      defaultValues={{ project_id: PROJECT_ID, work_date: "2026-10-10" }}
      submitLabel="記録する"
    />,
  );
  const submit = () => fireEvent.click(screen.getByRole("button", { name: "記録する" }));
  const hours = screen.getByLabelText("時間");
  const minutes = screen.getByLabelText("分");
  return { action, submit, hours, minutes };
}

describe("TimeEntryForm の画面の検証", () => {
  it("時間と分が空なら送信せず、稼働時間のエラーを両方の欄に結び付ける", async () => {
    const { action, submit, hours, minutes } = setup();

    submit();

    expect(await screen.findByText("稼働時間を入力してください")).toBeTruthy();
    expect(hours.getAttribute("aria-invalid")).toBe("true");
    expect(minutes.getAttribute("aria-describedby")).toBe("duration-error");
    expect(action).not.toHaveBeenCalled();
  });

  it("分の欄を直すと、稼働時間のエラーが消える", async () => {
    const { submit, minutes } = setup();
    submit();
    await screen.findByText("稼働時間を入力してください");

    fireEvent.change(minutes, { target: { value: "30" } });

    expect(screen.queryByText("稼働時間を入力してください")).toBeNull();
  });

  it("分が範囲外なら、サーバーと同じ文言を出す", async () => {
    const { submit, minutes } = setup();
    fireEvent.change(minutes, { target: { value: "60" } });

    submit();

    expect(await screen.findByText("分は0〜59の整数で入力してください")).toBeTruthy();
  });

  it("正しい値なら、サーバーアクションに送る", async () => {
    const { action, submit, hours } = setup();
    fireEvent.change(hours, { target: { value: "2" } });

    submit();

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("hours")).toBe("2");
  });
});
