"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-md bg-green-50 p-4 text-sm text-green-900">
        {state.email} に、ログイン用のリンクを送りました。メールを開いて、
        <strong>このブラウザで</strong>リンクを押してください。
      </p>
    );
  }

  const errorMessage = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? "email-error" : undefined}
          className="rounded-md border border-zinc-400 px-3 py-2"
        />
        {errorMessage && (
          <p id="email-error" role="alert" className="text-sm text-red-700">
            {errorMessage}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "送信中…" : "ログイン用のリンクを送る"}
      </button>
    </form>
  );
}
