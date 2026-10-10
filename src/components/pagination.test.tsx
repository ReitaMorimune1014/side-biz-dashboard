import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Pagination } from "./pagination";

afterEach(cleanup);

const hrefFor = (n: number) => `/projects?page=${n}`;

describe("Pagination", () => {
  it("件数と範囲を表示し、1ページだけならページ送りを出さない", () => {
    render(
      <Pagination
        page={{ page: 1, pageCount: 1, total: 3, from: 1, to: 3 }}
        hrefFor={hrefFor}
        label="案件のページ"
      />,
    );

    expect(screen.getByText("全3件中 1〜3件")).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("途中のページでは、前へ・次へと番号のリンクを出し、今のページを示す", () => {
    render(
      <Pagination
        page={{ page: 2, pageCount: 3, total: 23, from: 11, to: 20 }}
        hrefFor={hrefFor}
        label="案件のページ"
      />,
    );

    const nav = screen.getByRole("navigation", { name: "案件のページ" });
    expect(nav).toBeTruthy();
    expect(screen.getByRole("link", { name: "前へ" }).getAttribute("href")).toBe("/projects?page=1");
    expect(screen.getByRole("link", { name: "次へ" }).getAttribute("href")).toBe("/projects?page=3");
    expect(screen.getByRole("link", { name: "3ページ目" }).getAttribute("href")).toBe(
      "/projects?page=3",
    );
    expect(screen.getByText("2").getAttribute("aria-current")).toBe("page");
  });

  it("最初のページでは前へ、最後のページでは次へをリンクにしない", () => {
    const { rerender } = render(
      <Pagination
        page={{ page: 1, pageCount: 2, total: 12, from: 1, to: 10 }}
        hrefFor={hrefFor}
        label="案件のページ"
      />,
    );
    expect(screen.queryByRole("link", { name: "前へ" })).toBeNull();
    expect(screen.getByRole("link", { name: "次へ" })).toBeTruthy();

    rerender(
      <Pagination
        page={{ page: 2, pageCount: 2, total: 12, from: 11, to: 12 }}
        hrefFor={hrefFor}
        label="案件のページ"
      />,
    );
    expect(screen.getByRole("link", { name: "前へ" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "次へ" })).toBeNull();
  });
});
