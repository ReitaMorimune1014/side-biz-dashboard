import Link from "next/link";

const TABS = [
  { href: "/projects", label: "一覧" },
  { href: "/projects/board", label: "かんばん" },
] as const;

export function ViewTabs({ current }: { current: (typeof TABS)[number]["href"] }) {
  return (
    <nav aria-label="案件の表示" className="flex gap-1 rounded-md bg-zinc-100 p-1 text-sm">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === current ? "page" : undefined}
          className={
            tab.href === current
              ? "rounded bg-white px-3 py-1 font-medium shadow-sm"
              : "rounded px-3 py-1 text-zinc-700"
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
