"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { signOut } from "@/app/auth/actions";
import { MAIN_LINKS, isCurrentPath } from "@/lib/nav";

const MENU_ID = "main-menu";

function SignOutButton({ className }: { className: string }) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        ログアウト
      </button>
    </form>
  );
}

/**
 * 640px 以上はリンクを横に並べ、それより狭いときは「メニュー」ボタンで開閉する。
 * リンクを選ぶか Esc で閉じる
 */
export function MainNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      toggleRef.current?.focus();
    }
  }

  return (
    <nav aria-label="メイン" onKeyDown={onKeyDown} className="mx-auto w-full max-w-3xl px-4">
      <div className="flex min-h-14 items-center justify-between gap-4">
        {/* ログイン直後に表示されるため、先読みしない */}
        <Link href="/dashboard" prefetch={false} className="font-semibold">
          副業管理
        </Link>

        <ul className="hidden items-center gap-4 text-sm font-medium sm:flex">
          {MAIN_LINKS.map((link) => {
            const current = isCurrentPath(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  aria-current={current ? "page" : undefined}
                  className={
                    current
                      ? "inline-flex min-h-10 items-center underline decoration-2 underline-offset-8"
                      : "inline-flex min-h-10 items-center text-zinc-700 hover:text-zinc-950"
                  }
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden sm:block">
          <SignOutButton className="inline-flex min-h-9 items-center rounded-md border border-zinc-400 px-3 text-sm font-medium" />
        </div>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={MENU_ID}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-zinc-400 px-3 text-sm font-medium sm:hidden"
        >
          <span aria-hidden="true" className="flex w-4 flex-col gap-1">
            <span className="h-0.5 rounded bg-current" />
            <span className="h-0.5 rounded bg-current" />
            <span className="h-0.5 rounded bg-current" />
          </span>
          {open ? "閉じる" : "メニュー"}
        </button>
      </div>

      <div id={MENU_ID} hidden={!open} className="border-t border-zinc-200 pb-3 sm:hidden">
        <ul className="flex flex-col py-2 text-base font-medium">
          {MAIN_LINKS.map((link) => {
            const current = isCurrentPath(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={
                    current
                      ? "flex min-h-11 items-center rounded-md bg-zinc-100 px-3"
                      : "flex min-h-11 items-center rounded-md px-3 text-zinc-700"
                  }
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <SignOutButton className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-zinc-400 px-3 text-sm font-medium" />
      </div>
    </nav>
  );
}
