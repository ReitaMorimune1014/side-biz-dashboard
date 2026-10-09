"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CUSTOMER_MEMO_MAX, CUSTOMER_NAME_MAX } from "@/lib/customers/schema";
import type { CustomerFormState, CustomerFormValues } from "./actions";

type Props = {
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  defaultValues?: CustomerFormValues;
  submitLabel: string;
};

const initialState: CustomerFormState = { status: "idle" };

export function CustomerForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const values = state.status === "error" ? state.values : defaultValues;
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const message = state.status === "error" ? state.message : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          名前 <span className="text-red-700">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={CUSTOMER_NAME_MAX}
          defaultValue={values?.name}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          className="rounded-md border border-zinc-400 px-3 py-2"
        />
        {fieldErrors.name && (
          <p id="name-error" className="text-sm text-red-700">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="memo" className="text-sm font-medium">
          メモ
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={5}
          maxLength={CUSTOMER_MEMO_MAX}
          defaultValue={values?.memo}
          aria-invalid={fieldErrors.memo ? true : undefined}
          aria-describedby={fieldErrors.memo ? "memo-error" : undefined}
          className="rounded-md border border-zinc-400 px-3 py-2"
        />
        {fieldErrors.memo && (
          <p id="memo-error" className="text-sm text-red-700">
            {fieldErrors.memo}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "保存中…" : submitLabel}
        </button>
        <Link href="/customers" className="text-sm underline">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
