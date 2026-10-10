import type { Metadata } from "next";
import { EmptyState } from "@/components/states";

export const metadata: Metadata = {
  title: "ページが見つかりません",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-semibold">ページが見つかりません</h1>
      <EmptyState
        message="URL が間違っているか、ページが移動した可能性があります。"
        action={{ href: "/dashboard", label: "ダッシュボードへ" }}
      />
    </main>
  );
}
