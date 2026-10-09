"use client";

import { useActionState } from "react";
import { useClientValidation } from "@/components/use-client-validation";
import { parseLoginEmail } from "@/lib/auth/email";
import { fieldErrorsOf } from "@/lib/forms/form-values";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

const validate = (formData: FormData) => fieldErrorsOf(parseLoginEmail(formData.get("email")));

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);
  const { formRef, errors, onSubmit, onChange } = useClientValidation({
    validate,
    serverState: state,
    serverErrors: state.status === "error" ? state.fieldErrors : {},
  });

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-md bg-green-50 p-4 text-sm text-green-900">
        {state.email} に、ログイン用のリンクを送りました。メールを開いて、
        <strong>このブラウザで</strong>リンクを押してください。
      </p>
    );
  }

  const message = state.status === "error" ? state.message : undefined;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      onChange={onChange}
      className="flex flex-col gap-4"
      noValidate
    >
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {message}
        </p>
      )}
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
          defaultValue={state.status === "error" ? state.email : undefined}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="rounded-md border border-zinc-400 px-3 py-2"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-700">
            {errors.email}
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
