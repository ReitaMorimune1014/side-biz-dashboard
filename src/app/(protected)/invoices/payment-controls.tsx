"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { PaymentState } from "./actions";

const initialState: PaymentState = { status: "idle" };

type RecordProps = {
  action: (state: PaymentState, formData: FormData) => Promise<PaymentState>;
  /** 読み上げで、どの請求の操作かを分かるようにする */
  name: string;
  defaultPaidOn: string;
  inputId: string;
};

/** 入金日(初期値は今日)を選んで「入金を記録」 */
export function RecordPaymentForm({ action, name, defaultPaidOn, inputId }: RecordProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="text-sm">
          入金日
        </label>
        <input
          id={inputId}
          name="paid_on"
          type="date"
          defaultValue={defaultPaidOn}
          disabled={pending}
          className="rounded-md border border-zinc-400 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={`${name}の入金を記録`}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "記録中…" : "入金を記録"}
        </button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}

function UnpaidButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${name}を未入金に戻す`}
      className="text-sm text-zinc-600 underline disabled:opacity-60"
    >
      {pending ? "戻しています…" : "未入金に戻す"}
    </button>
  );
}

export function MarkUnpaidForm({ action, name }: { action: () => Promise<void>; name: string }) {
  return (
    <form action={action}>
      <UnpaidButton name={name} />
    </form>
  );
}
