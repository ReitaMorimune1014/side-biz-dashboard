"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { PROJECT_MEMO_MAX, PROJECT_TITLE_MAX } from "@/lib/projects/schema";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/projects/status";
import type { ProjectFormState, ProjectFormValues } from "./actions";

type CustomerOption = { id: string; name: string; deleted?: boolean };

type Props = {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  customers: CustomerOption[];
  defaultValues?: ProjectFormValues;
  /** 編集のときだけ渡す。開いたときの状態 */
  status?: { current: ProjectStatus };
  submitLabel: string;
};

const initialState: ProjectFormState = { status: "idle" };

const inputClass = "rounded-md border border-zinc-400 px-3 py-2";

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-zinc-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function ProjectForm({ action, customers, defaultValues, status, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const values = state.status === "error" ? state.values : defaultValues;
  const errors = state.status === "error" ? state.fieldErrors : {};
  const message = state.status === "error" ? state.message : undefined;
  const amountHint = "税込の円。整数で入力します(例: 120000)";

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {message && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {message}
        </p>
      )}

      <Field id="customer_id" label="顧客" required error={errors.customer_id}>
        <select
          id="customer_id"
          name="customer_id"
          required
          defaultValue={values?.customer_id ?? ""}
          aria-invalid={errors.customer_id ? true : undefined}
          aria-describedby={describedBy("customer_id", errors.customer_id)}
          className={inputClass}
        >
          <option value="" disabled>
            選んでください
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
              {customer.deleted ? "(削除済み)" : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field id="title" label="題名" required error={errors.title}>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={PROJECT_TITLE_MAX}
          defaultValue={values?.title}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={describedBy("title", errors.title)}
          className={inputClass}
        />
      </Field>

      <Field id="amount" label="金額(円)" required error={errors.amount} hint={amountHint}>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="numeric"
          required
          defaultValue={values?.amount}
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={describedBy("amount", errors.amount, amountHint)}
          className={inputClass}
        />
      </Field>

      <Field id="due_date" label="納期" error={errors.due_date}>
        <input
          id="due_date"
          name="due_date"
          type="date"
          defaultValue={values?.due_date}
          aria-invalid={errors.due_date ? true : undefined}
          aria-describedby={describedBy("due_date", errors.due_date)}
          className={inputClass}
        />
      </Field>

      {status && (
        <Field id="status" label="状態" required error={errors.status}>
          <input type="hidden" name="expected_status" value={status.current} />
          <select
            id="status"
            name="status"
            defaultValue={values?.status ?? status.current}
            aria-invalid={errors.status ? true : undefined}
            aria-describedby={describedBy("status", errors.status)}
            className={inputClass}
          >
            {PROJECT_STATUSES.map((option) => (
              <option key={option} value={option}>
                {PROJECT_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field id="memo" label="メモ" error={errors.memo}>
        <textarea
          id="memo"
          name="memo"
          rows={4}
          maxLength={PROJECT_MEMO_MAX}
          defaultValue={values?.memo}
          aria-invalid={errors.memo ? true : undefined}
          aria-describedby={describedBy("memo", errors.memo)}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "保存中…" : submitLabel}
        </button>
        <Link href="/projects" className="text-sm underline">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
