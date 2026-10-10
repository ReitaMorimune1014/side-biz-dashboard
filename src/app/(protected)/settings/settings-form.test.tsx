import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SettingsFormState } from "./actions";

const saveSettingsAction =
  vi.fn<(state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>>();
vi.mock("./actions", () => ({
  saveSettingsAction: (state: SettingsFormState, formData: FormData) =>
    saveSettingsAction(state, formData),
}));

const { SettingsForm } = await import("./settings-form");

beforeEach(() => saveSettingsAction.mockReset().mockResolvedValue({ status: "saved" }));
afterEach(cleanup);

function setup() {
  render(<SettingsForm defaultValues={{ hours: "5", minutes: "0", week_start: "1" }} />);
  const submit = () => fireEvent.click(screen.getByRole("button", { name: "保存する" }));
  return { hours: screen.getByLabelText("時間"), submit };
}

describe("SettingsForm の画面の検証", () => {
  it("目標が0時間なら送信せず、目標時間のエラーを出し、直すと消える", async () => {
    const { hours, submit } = setup();
    fireEvent.change(hours, { target: { value: "0" } });

    submit();

    expect(await screen.findByText("目標時間を入力してください")).toBeTruthy();
    expect(hours.getAttribute("aria-describedby")).toBe("target-error");
    expect(saveSettingsAction).not.toHaveBeenCalled();

    fireEvent.change(hours, { target: { value: "3" } });
    expect(screen.queryByText("目標時間を入力してください")).toBeNull();
  });

  it("正しい値なら保存する", async () => {
    const { submit } = setup();

    submit();

    await waitFor(() => expect(saveSettingsAction).toHaveBeenCalledTimes(1));
  });
});
