"use client";

import { useActionState } from "react";
import { signInAsDemo, type DemoLoginState } from "./actions";

const initialState: DemoLoginState = { status: "idle" };

export function DemoLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAsDemo, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {state.message}
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-10 rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "ログイン中…" : "デモを見る(閲覧専用)"}
      </button>
    </form>
  );
}
