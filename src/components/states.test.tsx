import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState, ErrorState, LoadingState } from "./states";

afterEach(cleanup);

describe("EmptyState", () => {
  it("文言と、次にすることのリンクを出す", () => {
    render(<EmptyState message="まだ案件が登録されていません。" action={{ href: "/projects/new", label: "追加する" }} />);

    expect(screen.getByText("まだ案件が登録されていません。")).toBeTruthy();
    expect(screen.getByRole("link", { name: "追加する" }).getAttribute("href")).toBe("/projects/new");
  });

  it("リンクがなければ、文言だけ", () => {
    render(<EmptyState message="ありません" />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("ErrorState", () => {
  it("alert として、見出し・説明・ボタンを出す", () => {
    render(
      <ErrorState title="表示できませんでした" message="もう一度読み込んでください">
        <button type="button">もう一度読み込む</button>
      </ErrorState>,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("表示できませんでした");
    expect(screen.getByRole("button", { name: "もう一度読み込む" })).toBeTruthy();
  });
});

describe("LoadingState", () => {
  it("読み上げで「読み込み中」と伝える", () => {
    render(<LoadingState />);
    expect(screen.getByRole("status").textContent).toContain("読み込み中");
  });
});
